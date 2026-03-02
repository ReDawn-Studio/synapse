import { Kysely, PostgresDialect } from 'kysely';
import { Pool } from 'pg';
import type { Database } from '../types/database.js';

export function createDatabase() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  return new Kysely<Database>({
    dialect: new PostgresDialect({ pool }),
  });
}

export const db = createDatabase();
