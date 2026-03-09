import { createHash, randomBytes } from 'node:crypto';
import jwt from 'jsonwebtoken';

export function createAccessToken(payload, config) {
  return jwt.sign(payload, config.jwtAccessSecret, {
    expiresIn: config.jwtAccessTtl,
    issuer: 'esl-bff',
    audience: 'esl-bff-client'
  });
}

export function verifyAccessToken(token, config) {
  return jwt.verify(token, config.jwtAccessSecret, {
    issuer: 'esl-bff',
    audience: 'esl-bff-client'
  });
}

export function createRefreshTokenValue() {
  return randomBytes(48).toString('hex');
}

export function createRefreshTokenHash(tokenValue) {
  return createHash('sha256').update(tokenValue).digest('hex');
}

export function createRefreshTokenExpiryDate(config) {
  const ttl = String(config.jwtRefreshTtl).trim();
  const now = Date.now();

  const match = ttl.match(/^(\d+)([smhd])$/i);
  if (!match) {
    return new Date(now + 7 * 24 * 60 * 60 * 1000).toISOString();
  }

  const amount = Number(match[1]);
  const unit = match[2].toLowerCase();

  const multipliers = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000
  };

  return new Date(now + amount * multipliers[unit]).toISOString();
}
