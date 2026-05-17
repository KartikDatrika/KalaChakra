export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS interactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp INTEGER NOT NULL,
  duration_mins INTEGER NOT NULL,
  guna_state TEXT NOT NULL CHECK(guna_state IN ('sattva','rajas','tamas')),
  type TEXT NOT NULL,
  score REAL NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_interactions_ts ON interactions(timestamp);
`;
