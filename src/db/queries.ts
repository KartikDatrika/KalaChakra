import { db } from './client';
import type { GunaState, MonthAggregate, NewInteraction, YearAggregate } from '@/types';

export function insertInteraction(i: NewInteraction): void {
  const d = db();
  if (!d) return;
  d.runSync(
    `INSERT INTO interactions (timestamp, duration_mins, guna_state, type, score)
     VALUES (?, ?, ?, ?, ?);`,
    i.timestamp,
    i.duration_mins,
    i.guna_state,
    i.type,
    i.score,
  );
}

export function aggregateByMonth(): MonthAggregate[] {
  const d = db();
  if (!d) return [];
  const rows = d.getAllSync<{
    m: string;
    guna_state: GunaState;
    s: number;
  }>(
    `SELECT strftime('%m', timestamp/1000, 'unixepoch') AS m,
            guna_state,
            SUM(duration_mins) AS s
       FROM interactions
       GROUP BY m, guna_state;`,
  );
  return rows.map((r) => ({
    month: parseInt(r.m, 10) - 1,
    guna_state: r.guna_state,
    total_mins: r.s,
  }));
}

export function aggregateByYearOfLife(birthYear: number): YearAggregate[] {
  const d = db();
  if (!d) return [];
  const rows = d.getAllSync<{ y: string; s: number }>(
    `SELECT strftime('%Y', timestamp/1000, 'unixepoch') AS y,
            SUM(duration_mins) AS s
       FROM interactions
       GROUP BY y;`,
  );
  return rows.map((r) => ({
    year_of_life: parseInt(r.y, 10) - birthYear,
    total_mins: r.s,
  }));
}
