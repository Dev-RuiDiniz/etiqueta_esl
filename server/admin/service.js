import { USER_ROLES } from '../auth/rbac.js';

function buildRoleCounts(users) {
  const counts = {
    usuario: 0,
    administrador: 0,
    desenvolvedor: 0
  };

  for (const user of users) {
    if (Object.prototype.hasOwnProperty.call(counts, user.role)) {
      counts[user.role] += 1;
    }
  }

  return counts;
}

function countUsersWithActiveSession(users, activeUserIds) {
  return users.reduce((count, user) => count + (activeUserIds.has(user.id) ? 1 : 0), 0);
}

function buildRecentAlerts(deadLetters) {
  return deadLetters.slice(0, 5).map((entry) => ({
    id: entry.id,
    operation: entry.operation,
    status: entry.status,
    created_at: entry.created_at,
    last_error: entry.last_error ?? '',
    attempts: Number(entry.attempts ?? 0)
  }));
}

export class AdminService {
  constructor({ authService, refreshTokenRepo, deadLetterRepo, catalogService, templateService, statusService }) {
    this.authService = authService;
    this.refreshTokenRepo = refreshTokenRepo;
    this.deadLetterRepo = deadLetterRepo;
    this.catalogService = catalogService;
    this.templateService = templateService;
    this.statusService = statusService;
  }

  assertRoleAssignableBy(actorRole, targetRole) {
    if (!USER_ROLES.includes(targetRole)) {
      const error = new Error('Perfil inválido.');
      error.code = 'AUTH_INVALID_ROLE';
      error.statusCode = 422;
      throw error;
    }

    if (actorRole === 'administrador' && targetRole === 'desenvolvedor') {
      const error = new Error('Administrador não pode atribuir o perfil desenvolvedor.');
      error.code = 'AUTH_FORBIDDEN_ROLE_ASSIGNMENT';
      error.statusCode = 403;
      throw error;
    }
  }

  async assertManageableTarget(actor, targetUserId) {
    const target = await this.authService.getUserById(targetUserId);

    if (!target) {
      const error = new Error('Usuário não encontrado.');
      error.code = 'AUTH_USER_NOT_FOUND';
      error.statusCode = 404;
      throw error;
    }

    if (actor.role === 'administrador' && target.role === 'desenvolvedor') {
      const error = new Error('Administrador não pode gerenciar usuários desenvolvedor.');
      error.code = 'AUTH_FORBIDDEN';
      error.statusCode = 403;
      throw error;
    }

    return target;
  }

  async listUsers({ limit = 100, search = '', role = null } = {}) {
    return this.authService.listUsers({ limit, search, role });
  }

  async createUser({ actor, email, password, role }) {
    this.assertRoleAssignableBy(actor.role, role);
    return this.authService.createUser({ email, password, role });
  }

  async updateUser({ actor, userId, email, role }) {
    await this.assertManageableTarget(actor, userId);

    if (typeof role !== 'undefined') {
      this.assertRoleAssignableBy(actor.role, role);
    }

    const updated = await this.authService.updateUser(userId, { email, role });

    if (!updated) {
      const error = new Error('Usuário não encontrado.');
      error.code = 'AUTH_USER_NOT_FOUND';
      error.statusCode = 404;
      throw error;
    }

    if (typeof role !== 'undefined') {
      await this.authService.revokeAllSessionsByUserId(userId);
    }

    return updated;
  }

  async resetPassword({ actor, userId, password }) {
    await this.assertManageableTarget(actor, userId);
    const updated = await this.authService.updateUser(userId, { password });

    if (!updated) {
      const error = new Error('Usuário não encontrado.');
      error.code = 'AUTH_USER_NOT_FOUND';
      error.statusCode = 404;
      throw error;
    }

    const revoked_sessions = await this.authService.revokeAllSessionsByUserId(userId);

    return {
      user: updated,
      revoked_sessions
    };
  }

  async revokeSessions({ actor, userId }) {
    const target = await this.assertManageableTarget(actor, userId);
    const revoked_sessions = await this.authService.revokeAllSessionsByUserId(userId);

    return {
      user: target,
      revoked_sessions
    };
  }

  async getDashboardSummary() {
    const [users, activeUserIds, stationOverview, templatesResult, eslDashboard, deadLetters] = await Promise.all([
      this.authService.listUsers({ limit: 500 }),
      this.refreshTokenRepo.listActiveUserIds(),
      this.catalogService.buildStationOverview().catch(() => ({
        stations: [],
        totals: { stations: 0, tags: 0, online: 0, offline: 0 }
      })),
      this.templateService.queryTemplates({ page: 1, size: 200, forceRefresh: false }).catch(() => ({
        data: []
      })),
      this.statusService.buildDashboardAggregate(),
      this.deadLetterRepo.listDeadLetters(20)
    ]);

    const roleCounts = buildRoleCounts(users);
    const templateItems = Array.isArray(templatesResult?.data) ? templatesResult.data : [];

    return {
      users: {
        total: users.length,
        active: countUsersWithActiveSession(users, activeUserIds),
        by_role: roleCounts,
        recent: users.slice(0, 6)
      },
      esl: eslDashboard,
      stations: {
        totals: stationOverview.totals,
        recent: stationOverview.stations.slice(0, 5)
      },
      templates: {
        total: templateItems.length,
        by_type: templateItems.reduce((acc, item) => {
          const key = String(item.esltype_code ?? 'UNKNOWN');
          acc[key] = (acc[key] ?? 0) + 1;
          return acc;
        }, {})
      },
      alerts: {
        pending_dead_letters: deadLetters.filter((item) => item.status === 'PENDING').length,
        recent: buildRecentAlerts(deadLetters)
      }
    };
  }
}
