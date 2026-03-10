import { mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { createSqliteRepositories } from '../db/repositories/sqlite.js';

const activeContexts = [];

function createContext() {
  const dataDir = mkdtempSync(join(os.tmpdir(), 'etiqueta-sqlite-repo-'));
  const repositories = createSqliteRepositories({
    dataDir,
    backupRetentionCount: 7
  });

  const context = {
    dataDir,
    repositories,
    async close() {
      await repositories.close();
      rmSync(dataDir, { recursive: true, force: true });
    }
  };

  activeContexts.push(context);
  return context;
}

afterEach(async () => {
  while (activeContexts.length > 0) {
    const ctx = activeContexts.pop();
    await ctx.close();
  }
});

describe('SQLite repositories', () => {
  it('supports CRUD, counts and purge operations for all repository contracts', async () => {
    const ctx = createContext();
    const repos = ctx.repositories;

    const createdBinding = await repos.bindingRepo.upsertBinding({
      esl_code: 'ESL-001',
      product_code: 'SKU-001',
      template_id: 10
    });

    expect(createdBinding.esl_code).toBe('ESL-001');
    expect(createdBinding.product_code).toBe('SKU-001');

    const updatedBinding = await repos.bindingRepo.upsertBinding({
      esl_code: 'ESL-001',
      product_code: 'SKU-002',
      template_id: 22
    });

    expect(updatedBinding.product_code).toBe('SKU-002');
    expect(await repos.bindingRepo.countBindings()).toBe(1);
    expect((await repos.bindingRepo.listBindingsByProductCode('SKU-002')).length).toBe(1);

    const removedBinding = await repos.bindingRepo.removeBinding('ESL-001');
    expect(removedBinding.binding_status).toBe('UNBOUND');
    expect(await repos.bindingRepo.countBindings()).toBe(0);

    await repos.statusRepo.upsertStatusSnapshots([
      {
        esl_code: 'ESL-ONLINE',
        online: 1,
        esl_battery: 90,
        product_code: 'SKU-ONLINE'
      },
      {
        esl_code: 'ESL-OFFLINE',
        online: 0,
        esl_battery: 50,
        product_code: 'SKU-OFFLINE'
      }
    ]);

    const summary = await repos.statusRepo.getStatusSummary();
    expect(summary.total_count).toBe(2);
    expect(summary.online_count).toBe(1);
    expect(summary.offline_count).toBe(1);

    const commandLog = await repos.commandLogRepo.addCommandLog({
      operation: 'esl.bind',
      request_id: 'REQ-001',
      success: true,
      payload: { foo: 'bar' },
      response: { ok: true }
    });

    expect(commandLog.success).toBe(true);
    expect((await repos.commandLogRepo.listCommandLogs(10)).length).toBeGreaterThanOrEqual(1);
    expect((await repos.commandLogRepo.findCommandByRequestId('REQ-001'))?.id).toBe(commandLog.id);
    expect(await repos.commandLogRepo.countLogs()).toBeGreaterThanOrEqual(1);

    const removedLogs = await repos.commandLogRepo.purgeOlderThan(new Date(Date.now() + 60_000).toISOString());
    expect(removedLogs).toBeGreaterThanOrEqual(1);
    expect(await repos.commandLogRepo.countLogs()).toBe(0);

    const deadLetter = await repos.deadLetterRepo.addDeadLetter({
      operation: 'product.create',
      payload: { pc: 'SKU-001' },
      error: { message: 'timeout' },
      attempts: 1
    });

    expect(deadLetter.status).toBe('PENDING');

    const markedDeadLetter = await repos.deadLetterRepo.markDeadLetterStatus(deadLetter.id, 'PROCESSED');
    expect(markedDeadLetter.status).toBe('PROCESSED');

    const removedDeadLetter = await repos.deadLetterRepo.removeDeadLetter(deadLetter.id);
    expect(removedDeadLetter.id).toBe(deadLetter.id);

    await repos.deadLetterRepo.addDeadLetter({
      operation: 'esl.bind_task',
      payload: { f1: 'ESL-009' }
    });

    const removedDeadLetters = await repos.deadLetterRepo.purgeOlderThan(new Date(Date.now() + 60_000).toISOString());
    expect(removedDeadLetters).toBeGreaterThanOrEqual(1);
    expect(await repos.deadLetterRepo.countDeadLetters()).toBe(0);

    const user = await repos.userRepo.createUser({
      email: 'admin@sqlite.test',
      password_hash: 'hash',
      role: 'admin'
    });

    expect((await repos.userRepo.findByEmail('admin@sqlite.test'))?.id).toBe(user.id);

    const updatedUser = await repos.userRepo.updateUser(user.id, {
      role: 'operador'
    });

    expect(updatedUser.role).toBe('operador');

    const refreshToken = await repos.refreshTokenRepo.createRefreshToken({
      user_id: user.id,
      token_hash: 'token-hash-1',
      expires_at: new Date(Date.now() + 60_000).toISOString()
    });

    expect(refreshToken.revoked).toBe(false);
    expect((await repos.refreshTokenRepo.findByTokenHash('token-hash-1'))?.id).toBe(refreshToken.id);

    const revokedToken = await repos.refreshTokenRepo.revokeToken('token-hash-1');
    expect(revokedToken.revoked).toBe(true);

    const revokedAll = await repos.refreshTokenRepo.revokeAllByUserId(user.id);
    expect(revokedAll).toBe(0);

    expect(await repos.ready()).toBe(true);
  });
});
