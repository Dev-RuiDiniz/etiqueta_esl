import { mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import { join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { Pool } from 'pg';
import { createSqliteRepositories } from '../db/repositories/sqlite.js';
import { migrateSqliteToPostgres } from '../scripts/migrate-sqlite-to-postgres.js';

const testDatabaseUrl = (process.env.TEST_POSTGRES_URL ?? '').trim();
const describeMigration = testDatabaseUrl ? describe : describe.skip;

const tempDirs = [];

function createSqliteFixture() {
  const dataDir = mkdtempSync(join(os.tmpdir(), 'sqlite-to-pg-migrate-'));
  tempDirs.push(dataDir);
  return createSqliteRepositories({ dataDir, backupRetentionCount: 2 });
}

describeMigration('SQLite -> Postgres migration', () => {
  afterAll(async () => {
    for (const dir of tempDirs) {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('migrates users, products and bindings to postgres', async () => {
    const sqliteRepos = createSqliteFixture();
    const marker = `MIG_${Date.now()}_${Math.random().toString(36).slice(2, 7).toUpperCase()}`;

    const user = await sqliteRepos.userRepo.createUser({
      email: `${marker.toLowerCase()}@migration.test`,
      password_hash: 'hash',
      role: 'usuario'
    });

    await sqliteRepos.productRepo.upsertProduct({
      product_code: `${marker}_SKU`,
      product_name: 'Produto Migração',
      price: 99.9,
      sync_status: 'SYNCED'
    });

    await sqliteRepos.bindingRepo.upsertBinding({
      esl_code: `${marker}_ESL`,
      product_code: `${marker}_SKU`,
      template_id: 7
    });

    const sqlitePath = sqliteRepos.storagePaths.databasePath;
    await sqliteRepos.close();

    const report = await migrateSqliteToPostgres({
      sqlitePath,
      databaseUrl: testDatabaseUrl
    });

    expect(report.success).toBe(true);
    expect(report.tables.users.upserted).toBeGreaterThanOrEqual(1);

    const pool = new Pool({
      connectionString: testDatabaseUrl,
      ssl: process.env.PGSSLMODE?.toLowerCase() === 'disable' ? false : { rejectUnauthorized: false }
    });

    try {
      const migratedUser = await pool.query('SELECT * FROM users WHERE id = $1 LIMIT 1;', [user.id]);
      expect(migratedUser.rowCount).toBe(1);

      const migratedProduct = await pool.query('SELECT * FROM products WHERE product_code = $1 LIMIT 1;', [`${marker}_SKU`]);
      expect(migratedProduct.rowCount).toBe(1);

      const migratedBinding = await pool.query('SELECT * FROM esl_bindings WHERE esl_code = $1 LIMIT 1;', [`${marker}_ESL`]);
      expect(migratedBinding.rowCount).toBe(1);
    } finally {
      await pool.end();
    }
  });
});
