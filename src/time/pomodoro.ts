export type PomodoroPhase = 'plan' | 'work' | 'verify';

export interface PomodoroConfig {
  taskName: string;
  planMins: number;
  workMins: number;
  verifyMins: number;
}

export const PHASE_ORDER: PomodoroPhase[] = ['plan', 'work', 'verify'];

export const PHASE_LABEL: Record<PomodoroPhase, string> = {
  plan: 'PLAN',
  work: 'WORK',
  verify: 'VERIFY',
};

export const PHASE_COLOR: Record<PomodoroPhase, string> = {
  plan: '#FF5A5F',
  work: '#3B82F6',
  verify: '#7FB2FF',
};

export const PHASE_PROMPT: Record<PomodoroPhase, string> = {
  plan: 'What is your plan for this task?',
  work: 'What did you build / accomplish?',
  verify: 'What did you verify? Any issues?',
};

export const DEFAULT_MINS: PomodoroConfig = {
  taskName: '',
  planMins: 15,
  workMins: 45,
  verifyMins: 15,
};

export function phaseMins(config: PomodoroConfig, phase: PomodoroPhase): number {
  switch (phase) {
    case 'plan':   return config.planMins;
    case 'work':   return config.workMins;
    case 'verify': return config.verifyMins;
  }
}

export function nextPhase(phase: PomodoroPhase): PomodoroPhase | null {
  const idx = PHASE_ORDER.indexOf(phase);
  return idx < PHASE_ORDER.length - 1 ? (PHASE_ORDER[idx + 1] ?? null) : null;
}

export function formatCountdown(secs: number): string {
  const m = Math.floor(Math.max(0, secs) / 60);
  const s = Math.max(0, secs) % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export function formatDuration(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}
