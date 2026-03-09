import bcrypt from 'bcryptjs';

const DEFAULT_SALT_ROUNDS = 10;

export async function hashPassword(rawPassword, saltRounds = DEFAULT_SALT_ROUNDS) {
  return bcrypt.hash(rawPassword, saltRounds);
}

export async function verifyPassword(rawPassword, passwordHash) {
  return bcrypt.compare(rawPassword, passwordHash);
}
