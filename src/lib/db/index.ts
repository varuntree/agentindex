import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';

const globalForDb = globalThis as unknown as {
  sqliteDb: Database.Database | undefined;
};

const dbPath = './data/agentindex.db';

export const sqliteDb =
  globalForDb.sqliteDb ??
  new Database(dbPath, {
    readonly: process.env.NODE_ENV === 'production',
  });

sqliteDb.pragma('journal_mode = WAL');
sqliteDb.pragma('foreign_keys = ON');

if (process.env.NODE_ENV !== 'production') {
  globalForDb.sqliteDb = sqliteDb;
}

export const db = drizzle(sqliteDb, { schema });
