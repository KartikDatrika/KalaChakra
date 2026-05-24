/**
 * PomodoroView — state machine orchestrating the full session lifecycle:
 *
 *   setup → running(plan) → notes(plan)
 *        → running(work)  → notes(work)
 *        → running(verify)→ notes(verify)
 *        → summary → done
 */
import React, { useCallback, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { colors } from '@/theme/colors';
import {
  PHASE_ORDER,
  PomodoroConfig,
  PomodoroPhase,
  nextPhase,
  phaseMins,
} from '@/time/pomodoro';
import { PomodoroSetup }   from './PomodoroSetup';
import { PomodoroDial }    from './PomodoroDial';
import { PhaseModal }      from './PhaseModal';
import { SummaryScreen }   from './SummaryScreen';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PhaseResult {
  actualSecs: number;
  notes: string;
}

type Stage =
  | { name: 'setup' }
  | { name: 'running';  phase: PomodoroPhase }
  | { name: 'notes';    phase: PomodoroPhase; actualSecs: number }
  | { name: 'summary' }
  | { name: 'done' };

// ---------------------------------------------------------------------------

export function PomodoroView() {
  const [stage,   setStage]   = useState<Stage>({ name: 'setup' });
  const configRef             = useRef<PomodoroConfig | null>(null);
  const startedAtRef          = useRef<number>(0);
  const resultsRef            = useRef<Partial<Record<PomodoroPhase, PhaseResult>>>({});

  // ---- setup → running(plan) ----
  const handleStart = useCallback((config: PomodoroConfig) => {
    configRef.current    = config;
    startedAtRef.current = Date.now();
    resultsRef.current   = {};
    setStage({ name: 'running', phase: 'plan' });
  }, []);

  // ---- running → notes ----
  const handlePhaseComplete = useCallback((actualSecs: number) => {
    if (stage.name !== 'running') return;
    setStage({ name: 'notes', phase: stage.phase, actualSecs });
  }, [stage]);

  // ---- notes → running(next) or summary ----
  const handleNotesContinue = useCallback((notes: string) => {
    if (stage.name !== 'notes') return;
    resultsRef.current[stage.phase] = { actualSecs: stage.actualSecs, notes };
    const next = nextPhase(stage.phase);
    if (next) {
      setStage({ name: 'running', phase: next });
    } else {
      setStage({ name: 'summary' });
    }
  }, [stage]);

  // ---- summary → done ----
  const handleDone = useCallback(() => {
    setStage({ name: 'setup' });
    configRef.current  = null;
    resultsRef.current = {};
  }, []);

  // ---- render ----
  if (stage.name === 'setup') {
    return <PomodoroSetup onStart={handleStart} />;
  }

  if (stage.name === 'running') {
    const config    = configRef.current!;
    const totalSecs = phaseMins(config, stage.phase) * 60;
    return (
      <View style={styles.fill}>
        <PomodoroDial
          phase={stage.phase}
          totalSecs={totalSecs}
          onComplete={handlePhaseComplete}
        />
      </View>
    );
  }

  if (stage.name === 'notes') {
    const config = configRef.current!;
    return (
      <PhaseModal
        phase={stage.phase}
        actualSecs={stage.actualSecs}
        plannedMins={phaseMins(config, stage.phase)}
        onContinue={handleNotesContinue}
      />
    );
  }

  if (stage.name === 'summary') {
    const config  = configRef.current!;
    // All three phases must be complete before summary renders.
    const results = resultsRef.current as Record<PomodoroPhase, PhaseResult>;
    return (
      <SummaryScreen
        config={config}
        startedAt={startedAtRef.current}
        results={results}
        onDone={handleDone}
      />
    );
  }

  return null;
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: colors.bg },
});
