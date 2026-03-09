import {
  createAccessToken,
  createRefreshTokenExpiryDate,
  createRefreshTokenHash,
  createRefreshTokenValue,
  verifyAccessToken
} from './jwt.js';
import { hashPassword, verifyPassword } from './password.js';

const VALID_ROLES = new Set(['admin', 'operador', 'viewer']);

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
    const existing = await this.userRepo.findByEmail(this.config.authDefaultAdminEmail);

    if (existing) {
      return sanitizeUser(existing);
    }

    const passwordHash = await hashPassword(this.config.authDefaultAdminPassword);
    const created = await this.userRepo.createUser({
      email: this.config.authDefaultAdminEmail,
      password_hash: passwordHash,
      role: 'admin'
    });

    this.logger.info({ email: created.email }, 'Default admin user created');
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
      email,
      password_hash: passwordHash,
      role
    });

    return sanitizeUser(created);
  }

  async login({ email, password }) {
    const user = await this.userRepo.findByEmail(email);

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
