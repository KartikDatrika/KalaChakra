import { db } from './client';

export const POMODORO_SCHEMA = `
CREATE TABLE IF NOT EXISTS pomodoro_sessions (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  task_name         TEXT    NOT NULL,
  started_at        INTEGER NOT NULL,
  completed_at      INTEGER NOT NULL,
  plan_mins         INTEGER NOT NULL,
  work_mins         INTEGER NOT NULL,
  verify_mins       INTEGER NOT NULL,
  plan_actual_secs  INTEGER NOT NULL DEFAULT 0,
  work_actual_secs  INTEGER NOT NULL DEFAULT 0,
  verify_actual_secs INTEGER NOT NULL DEFAULT 0,
  plan_notes        TEXT    NOT NULL DEFAULT '',
  work_notes        TEXT    NOT NULL DEFAULT '',
  verify_notes      TEXT    NOT NULL DEFAULT '',
  summary           TEXT    NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS idx_pomo_started ON pomodoro_sessions(started_at);
`;

export interface PomodoroSessionRecord {
  taskName: string;
  startedAt: number;
  completedAt: number;
  planMins: number;
  workMins: number;
  verifyMins: number;
  planActualSecs: number;
  workActualSecs: number;
  verifyActualSecs: number;
  planNotes: string;
  workNotes: string;
  verifyNotes: string;
  summary: string;
}

export function insertPomodoroSession(s: PomodoroSessionRecord): void {
  const d = db();
  if (!d) return;
  d.runSync(
    `INSERT INTO pomodoro_sessions
       (task_name, started_at, completed_at,
        plan_mins, work_mins, verify_mins,
        plan_actual_secs, work_actual_secs, verify_actual_secs,
        plan_notes, work_notes, verify_notes, summary)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?);`,
    s.taskName,
    s.startedAt,
    s.completedAt,
    s.planMins,
    s.workMins,
    s.verifyMins,
    s.planActualSecs,
    s.workActualSecs,
    s.verifyActualSecs,
    s.planNotes,
    s.workNotes,
    s.verifyNotes,
    s.summary,
  );
}
