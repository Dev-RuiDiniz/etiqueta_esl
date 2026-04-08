import { afterAll, describe, expect, it } from 'vitest';
import { createPostgresRepositories } from '../db/repositories/postgres.js';

const testDatabaseUrl = (process.env.TEST_POSTGRES_URL ?? '').trim();
const describePostgres = testDatabaseUrl ? describe : describe.skip;

let repositories = null;

function buildPrefix() {
  return `TST_${Date.now()}_${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

describePostgres('Postgres repositories', () => {
  afterAll(async () => {
    if (repositories) {
      await repositories.close();
    }
  });

  it('supports the same contract used by services', async () => {
    repositories = await createPostgresRepositories({ databaseUrl: testDatabaseUrl });
    const prefix = buildPrefix();

    const user = await repositories.userRepo.createUser({
      email: `${prefix.toLowerCase()}@postgres.test`,
      password_hash: 'hash',
      role: 'usuario'
    });

    const token = await repositories.refreshTokenRepo.createRefreshToken({
      user_id: user.id,
      token_hash: `${prefix}_TOKEN_HASH`,
      expires_at: new Date(Date.now() + 60_000).toISOString()
    });

    expect(token.revoked).toBe(false);
    expect((await repositories.refreshTokenRepo.findByTokenHash(token.token_hash))?.id).toBe(token.id);

    const eslCode = `${prefix}_ESL`;
    const productCode = `${prefix}_SKU`;

    await repositories.eslCatalogRepo.upsertCatalogItem({
      esl_code: eslCode,
      display_name: 'Teste',
      source: 'MANUAL',
      registration_status: 'REGISTERED'
    });

    await repositories.productRepo.upsertProduct({
      product_code: productCode,
      product_name: 'Produto Teste',
      price: 10.5,
      sync_status: 'SYNCED'
    });

    await repositories.bindingRepo.upsertBinding({
      esl_code: eslCode,
      product_code: productCode,
      template_id: 1
    });

    await repositories.statusRepo.upsertStatusSnapshots([
      {
        esl_code: eslCode,
        online: 1,
        esl_battery: 87,
        product_code: productCode,
        seen_at: new Date().toISOString()
      }
    ]);

    const summary = await repositories.statusRepo.getStatusSummary();
    expect(summary.total_count).toBeGreaterThanOrEqual(1);

    const log = await repositories.commandLogRepo.addCommandLog({
      operation: 'esl.bind',
      request_id: `${prefix}_REQ`,
      success: true,
      payload: { esl_code: eslCode }
    });
    expect(log.id).toBeTruthy();

    const deadLetter = await repositories.deadLetterRepo.addDeadLetter({
      operation: 'esl.bind',
      payload: { esl_code: eslCode },
      attempts: 1
    });
    expect(deadLetter.id).toBeTruthy();

    const ready = await repositories.ready();
    expect(ready).toBe(true);
  });
});
