import * as SQLite from 'expo-sqlite';
import { SCHEMA_SQL } from './schema';

let _db: SQLite.SQLiteDatabase | null = null;

export function db(): SQLite.SQLiteDatabase {
  if (!_db) {
    _db = SQLite.openDatabaseSync('jivan.db');
  }
  return _db;
}

export function initDatabase(): void {
  const d = db();
  d.execSync(SCHEMA_SQL);
}
