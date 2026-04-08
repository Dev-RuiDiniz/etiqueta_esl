import {
  createAccessToken,
  createRefreshTokenExpiryDate,
  createRefreshTokenHash,
  createRefreshTokenValue,
  verifyAccessToken
} from './jwt.js';
import { hashPassword, verifyPassword } from './password.js';
import { USER_ROLES } from './rbac.js';

const VALID_ROLES = new Set(USER_ROLES);

function normalizeEmail(email) {
  return String(email ?? '').trim().toLowerCase();
}

function sanitizeUser(user) {
  if (!user) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    role: user.role,
    created_at: user.created_at,
    updated_at: user.updated_at
  };
}

export class AuthService {
  constructor({ config, userRepo, refreshTokenRepo, logger }) {
    this.config = config;
    this.userRepo = userRepo;
    this.refreshTokenRepo = refreshTokenRepo;
    this.logger = logger;
  }

  async ensureDefaultAdmin() {
    const existing = await this.userRepo.findByEmail(normalizeEmail(this.config.authDefaultAdminEmail));

    if (existing) {
      return sanitizeUser(existing);
    }

    const passwordHash = await hashPassword(this.config.authDefaultAdminPassword);
    const created = await this.userRepo.createUser({
      email: normalizeEmail(this.config.authDefaultAdminEmail),
      password_hash: passwordHash,
      role: 'desenvolvedor'
    });

    this.logger.info({ email: created.email }, 'Default developer user created');
    return sanitizeUser(created);
  }

  async createUser({ email, password, role }) {
    if (!VALID_ROLES.has(role)) {
      const error = new Error('Invalid role');
      error.code = 'AUTH_INVALID_ROLE';
      throw error;
    }

    const passwordHash = await hashPassword(password);
    const created = await this.userRepo.createUser({
      email: normalizeEmail(email),
      password_hash: passwordHash,
      role
    });

    return sanitizeUser(created);
  }

  async listUsers({ limit = 100, search = '', role = null } = {}) {
    const normalizedRole = role ? String(role).trim().toLowerCase() : null;
    const normalizedSearch = normalizeEmail(search);
    const users = await this.userRepo.listUsers(Math.max(1, Number(limit) || 100));

    return users
      .filter((user) => {
        if (normalizedRole && user.role !== normalizedRole) {
          return false;
        }

        if (normalizedSearch && !String(user.email).toLowerCase().includes(normalizedSearch)) {
          return false;
        }

        return true;
      })
      .map((user) => sanitizeUser(user));
  }

  async getUserById(userId) {
    return sanitizeUser(await this.userRepo.findById(userId));
  }

  async updateUser(userId, updates) {
    if (updates.role && !VALID_ROLES.has(updates.role)) {
      const error = new Error('Invalid role');
      error.code = 'AUTH_INVALID_ROLE';
      throw error;
    }

    const nextUpdates = {};

    if (typeof updates.email !== 'undefined') {
      nextUpdates.email = normalizeEmail(updates.email);
    }

    if (typeof updates.role !== 'undefined') {
      nextUpdates.role = updates.role;
    }

    if (typeof updates.password !== 'undefined') {
      nextUpdates.password_hash = await hashPassword(updates.password);
    }

    const updated = await this.userRepo.updateUser(userId, nextUpdates);
    return sanitizeUser(updated);
  }

  async revokeAllSessionsByUserId(userId) {
    return this.refreshTokenRepo.revokeAllByUserId(userId);
  }

  async login({ email, password }) {
    const user = await this.userRepo.findByEmail(normalizeEmail(email));

    if (!user) {
      const error = new Error('Invalid credentials.');
      error.code = 'AUTH_INVALID_CREDENTIALS';
      throw error;
    }

    const validPassword = await verifyPassword(password, user.password_hash);

    if (!validPassword) {
      const error = new Error('Invalid credentials.');
      error.code = 'AUTH_INVALID_CREDENTIALS';
      throw error;
    }

    return this.issueTokenPair(user);
  }

  async issueTokenPair(user) {
    const accessToken = createAccessToken(
      {
        sub: user.id,
        email: user.email,
        role: user.role
      },
      this.config
    );

    const refreshTokenValue = createRefreshTokenValue();
    const refreshTokenHash = createRefreshTokenHash(refreshTokenValue);
    const refreshTokenExpiry = createRefreshTokenExpiryDate(this.config);

    await this.refreshTokenRepo.createRefreshToken({
      user_id: user.id,
      token_hash: refreshTokenHash,
      expires_at: refreshTokenExpiry
    });

    return {
      access_token: accessToken,
      refresh_token: refreshTokenValue,
      token_type: 'Bearer',
      expires_in: this.config.jwtAccessTtl,
      user: sanitizeUser(user)
    };
  }

  async refresh({ refreshToken }) {
    const tokenHash = createRefreshTokenHash(refreshToken);
    const tokenRecord = await this.refreshTokenRepo.findByTokenHash(tokenHash);

    if (!tokenRecord || tokenRecord.revoked) {
      const error = new Error('Invalid refresh token.');
      error.code = 'AUTH_INVALID_REFRESH_TOKEN';
      throw error;
    }

    if (new Date(tokenRecord.expires_at).getTime() <= Date.now()) {
      await this.refreshTokenRepo.revokeToken(tokenHash);
      const error = new Error('Refresh token expired.');
      error.code = 'AUTH_REFRESH_TOKEN_EXPIRED';
      throw error;
    }

    const user = await this.userRepo.findById(tokenRecord.user_id);

    if (!user) {
      const error = new Error('User no longer exists.');
      error.code = 'AUTH_USER_NOT_FOUND';
      throw error;
    }

    await this.refreshTokenRepo.revokeToken(tokenHash);
    return this.issueTokenPair(user);
  }

  async logout({ refreshToken }) {
    const tokenHash = createRefreshTokenHash(refreshToken);
    await this.refreshTokenRepo.revokeToken(tokenHash);
    return { success: true };
  }

  async authenticateAccessToken(accessToken) {
    let payload;

    try {
      payload = verifyAccessToken(accessToken, this.config);
    } catch (error) {
      const authError = new Error('Invalid access token.');
      authError.code = 'AUTH_INVALID_ACCESS_TOKEN';
      authError.cause = error;
      throw authError;
    }

    const user = await this.userRepo.findById(payload.sub);

    if (!user) {
      const error = new Error('User not found for token.');
      error.code = 'AUTH_USER_NOT_FOUND';
      throw error;
    }

    return sanitizeUser(user);
  }
}
