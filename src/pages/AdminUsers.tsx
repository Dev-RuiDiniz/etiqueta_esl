import { FormEvent, useState } from 'react';
import EmptyState from '../components/common/EmptyState';
import ErrorState from '../components/common/ErrorState';
import LoadingState from '../components/common/LoadingState';
import useAsync from '../hooks/useAsync';
import {
  createAdminUser,
  listAdminUsers,
  resetAdminUserPassword,
  revokeAdminUserSessions,
  updateAdminUser
} from '../services/adminService';
import type { AdminUser } from '../types/admin';
import type { AppUserRole } from '../types/auth';

type NewUserForm = {
  email: string;
  password: string;
  role: AppUserRole;
};

const defaultForm: NewUserForm = {
  email: '',
  password: '',
  role: 'usuario'
};

function AdminUsers() {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [form, setForm] = useState<NewUserForm>(defaultForm);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);

  const {
    data: users,
    loading,
    error,
    run
  } = useAsync(() => listAdminUsers({ search, role: roleFilter }), [search, roleFilter]);

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setFeedback(null);

    try {
      await createAdminUser(form);
      setForm(defaultForm);
      setFeedback({ ok: true, text: 'Usuário criado com sucesso.' });
      await run();
    } catch (err) {
      setFeedback({ ok: false, text: err instanceof Error ? err.message : 'Não foi possível criar o usuário.' });
    } finally {
      setSaving(false);
    }
  };

  const handleRoleChange = async (user: AdminUser, nextRole: AppUserRole) => {
    try {
      await updateAdminUser(user.id, { role: nextRole });
      setFeedback({ ok: true, text: `Perfil de ${user.email} atualizado para ${nextRole}.` });
      await run();
    } catch (err) {
      setFeedback({ ok: false, text: err instanceof Error ? err.message : 'Não foi possível alterar o perfil.' });
    }
  };

  const handleResetPassword = async (user: AdminUser) => {
    const password = window.prompt(`Defina a nova senha para ${user.email}:`, '');

    if (!password) {
      return;
    }

    try {
      const result = await resetAdminUserPassword(user.id, password);
      setFeedback({
        ok: true,
        text: `Senha redefinida para ${user.email}. ${result.revoked_sessions ?? 0} sessão(ões) revogada(s).`
      });
    } catch (err) {
      setFeedback({ ok: false, text: err instanceof Error ? err.message : 'Falha ao redefinir senha.' });
    }
  };

  const handleRevokeSessions = async (user: AdminUser) => {
    try {
      const result = await revokeAdminUserSessions(user.id);
      setFeedback({
        ok: true,
        text: `${result.revoked_sessions ?? 0} sessão(ões) revogada(s) para ${user.email}.`
      });
    } catch (err) {
      setFeedback({ ok: false, text: err instanceof Error ? err.message : 'Falha ao revogar sessões.' });
    }
  };

  return (
    <div className="container-fluid px-0 admin-page">
      <header className="page-header mb-4">
        <div>
          <span className="eyebrow">Administração</span>
          <h1 className="h3 mb-1">Gestão de identidades LiveLabel</h1>
          <p className="text-muted mb-0">Crie contas, ajuste papéis e preserve a segurança da operação com renovação controlada de sessão.</p>
        </div>
      </header>

      <section className="row g-4">
        <div className="col-12 col-xl-4">
          <article className="app-surface p-4 h-100">
            <h2 className="h5 mb-3">Novo usuário</h2>
            <form onSubmit={(event) => void handleCreate(event)}>
              <div className="mb-3">
                <label className="form-label" htmlFor="admin-user-email">
                  E-mail
                </label>
                <input
                  id="admin-user-email"
                  className="form-control"
                  type="email"
                  value={form.email}
                  onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                  required
                />
              </div>
              <div className="mb-3">
                <label className="form-label" htmlFor="admin-user-password">
                  Senha provisória
                </label>
                <input
                  id="admin-user-password"
                  className="form-control"
                  type="password"
                  value={form.password}
                  onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                  minLength={8}
                  required
                />
              </div>
              <div className="mb-4">
                <label className="form-label" htmlFor="admin-user-role">
                  Perfil
                </label>
                <select
                  id="admin-user-role"
                  className="form-select"
                  value={form.role}
                  onChange={(event) => setForm((current) => ({ ...current, role: event.target.value as AppUserRole }))}
                >
                  <option value="usuario">usuario</option>
                  <option value="administrador">administrador</option>
                  <option value="desenvolvedor">desenvolvedor</option>
                </select>
              </div>
              <button type="submit" className="btn btn-primary w-100" disabled={saving}>
                {saving ? 'Salvando...' : 'Criar usuário'}
              </button>
            </form>

            {feedback ? (
              <div className={`mt-3 mb-0 ${feedback.ok ? 'app-alert app-alert--success' : 'app-alert app-alert--danger'}`} role="alert">
                {feedback.text}
              </div>
            ) : null}
          </article>
        </div>

        <div className="col-12 col-xl-8">
          <article className="app-surface p-4 h-100">
            <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-end gap-3 mb-4">
              <div>
                <h2 className="h5 mb-1">Contas cadastradas</h2>
                <p className="text-muted small mb-0">Ajuste o papel operacional e execute ações administrativas rápidas.</p>
              </div>
              <div className="d-flex flex-column flex-sm-row gap-2">
                <input
                  className="form-control"
                  placeholder="Buscar por e-mail"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
                <select className="form-select" value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)}>
                  <option value="">Todos os perfis</option>
                  <option value="usuario">usuario</option>
                  <option value="administrador">administrador</option>
                  <option value="desenvolvedor">desenvolvedor</option>
                </select>
              </div>
            </div>

            {error ? (
              <ErrorState
                title="Não foi possível carregar os usuários"
                message="Verifique a sessão e tente novamente."
                onRetry={() => {
                  void run();
                }}
              />
            ) : loading ? (
              <LoadingState lines={6} />
            ) : !users || users.length === 0 ? (
              <EmptyState
                title="Nenhum usuário encontrado"
                description="Ajuste os filtros ou crie uma nova conta pelo formulário ao lado."
              />
            ) : (
              <div className="table-responsive">
                <table className="table align-middle admin-table mb-0">
                  <thead>
                    <tr>
                      <th>Usuário</th>
                      <th>Perfil</th>
                      <th>Criação</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id}>
                        <td>
                          <div className="fw-semibold">{user.email}</div>
                          <div className="small text-muted">{user.id}</div>
                        </td>
                        <td style={{ minWidth: 200 }}>
                          <select
                            className="form-select form-select-sm"
                            value={user.role}
                            onChange={(event) => void handleRoleChange(user, event.target.value as AppUserRole)}
                          >
                            <option value="usuario">usuario</option>
                            <option value="administrador">administrador</option>
                            <option value="desenvolvedor">desenvolvedor</option>
                          </select>
                        </td>
                        <td>{new Date(user.created_at).toLocaleString('pt-BR')}</td>
                        <td>
                          <div className="d-flex flex-wrap gap-2">
                            <button
                              type="button"
                              className="btn btn-outline-primary btn-sm"
                              onClick={() => void handleResetPassword(user)}
                            >
                              Redefinir senha
                            </button>
                            <button
                              type="button"
                              className="btn btn-outline-secondary btn-sm"
                              onClick={() => void handleRevokeSessions(user)}
                            >
                              Revogar sessões
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </article>
        </div>
      </section>
    </div>
  );
}

export default AdminUsers;
