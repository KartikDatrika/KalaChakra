import * as SQLite from 'expo-sqlite';
import { SCHEMA_SQL } from './schema';

let _db: SQLite.SQLiteDatabase | null = null;
let _available = false;

export function db(): SQLite.SQLiteDatabase | null {
  if (!_available) return null;
  if (!_db) {
    _db = SQLite.openDatabaseSync('jivan.db');
  }
  return _db;
}

export function isDbAvailable(): boolean {
  return _available;
}

export function initDatabase(): void {
  try {
    _db = SQLite.openDatabaseSync('jivan.db');
    _db.execSync(SCHEMA_SQL);
    _available = true;
  } catch (error) {
    _available = false;
    _db = null;
    console.warn('SQLite init failed (likely sim/SDK mismatch):', error);
  }
}
