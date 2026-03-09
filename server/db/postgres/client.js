import pg from 'pg';

const { Pool } = pg;

export function createPostgresPool(databaseUrl) {
  return new Pool({
    connectionString: databaseUrl,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000
  });
}

export async function withTransaction(pool, task) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    const result = await task(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function checkPostgresReadiness(pool) {
  const result = await pool.query('SELECT 1 AS ok');
  return Array.isArray(result.rows) && result.rows.length === 1;
}
