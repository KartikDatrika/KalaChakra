import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { colors } from '@/theme/colors';
import {
  DEFAULT_MINS,
  PHASE_COLOR,
  PHASE_LABEL,
  PomodoroConfig,
  PomodoroPhase,
} from '@/time/pomodoro';

interface Props {
  onStart: (config: PomodoroConfig) => void;
}

const PHASES: PomodoroPhase[] = ['plan', 'work', 'verify'];
const MIN_MINS = 1;
const MAX_MINS = 120;
const STEP     = 5;

export function PomodoroSetup({ onStart }: Props) {
  const [taskName, setTaskName] = useState('');
  const [mins, setMins] = useState({
    plan:   DEFAULT_MINS.planMins,
    work:   DEFAULT_MINS.workMins,
    verify: DEFAULT_MINS.verifyMins,
  });

  function adjust(phase: PomodoroPhase, delta: number) {
    setMins((prev) => ({
      ...prev,
      [phase]: Math.min(MAX_MINS, Math.max(MIN_MINS, prev[phase] + delta)),
    }));
  }

  function handleStart() {
    if (!taskName.trim()) return;
    onStart({
      taskName: taskName.trim(),
      planMins:   mins.plan,
      workMins:   mins.work,
      verifyMins: mins.verify,
    });
  }

  const canStart = taskName.trim().length > 0;

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        {/* Header */}
        <Text style={styles.heading}>New Session</Text>

        {/* Task name */}
        <View style={styles.section}>
          <Text style={styles.label}>TASK</Text>
          <TextInput
            style={styles.taskInput}
            placeholder="What are you working on?"
            placeholderTextColor={colors.muted}
            value={taskName}
            onChangeText={setTaskName}
            returnKeyType="done"
            autoFocus
          />
        </View>

        {/* Phase duration steppers */}
        <View style={styles.section}>
          <Text style={styles.label}>PHASES</Text>
          {PHASES.map((phase) => (
            <PhaseRow
              key={phase}
              phase={phase}
              value={mins[phase]}
              onDecrement={() => adjust(phase, -STEP)}
              onIncrement={() => adjust(phase, +STEP)}
            />
          ))}
        </View>

        {/* Total */}
        <Text style={styles.total}>
          {`Total  ${mins.plan + mins.work + mins.verify} min`}
        </Text>

        {/* Start */}
        <Pressable
          style={[styles.startBtn, !canStart && styles.startBtnDisabled]}
          onPress={handleStart}
          disabled={!canStart}
        >
          <Text style={styles.startText}>BEGIN</Text>
        </Pressable>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ---------------------------------------------------------------------------

interface PhaseRowProps {
  phase: PomodoroPhase;
  value: number;
  onDecrement: () => void;
  onIncrement: () => void;
}

function PhaseRow({ phase, value, onDecrement, onIncrement }: PhaseRowProps) {
  const col = PHASE_COLOR[phase];
  return (
    <View style={styles.phaseRow}>
      <View style={[styles.phaseTag, { borderColor: col }]}>
        <Text style={[styles.phaseLabel, { color: col }]}>{PHASE_LABEL[phase]}</Text>
      </View>
      <View style={styles.stepper}>
        <Pressable style={styles.stepBtn} onPress={onDecrement} hitSlop={12}>
          <Text style={styles.stepIcon}>−</Text>
        </Pressable>
        <Text style={styles.stepValue}>{`${value} min`}</Text>
        <Pressable style={styles.stepBtn} onPress={onIncrement} hitSlop={12}>
          <Text style={styles.stepIcon}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 28,
    paddingTop: 72,
    paddingBottom: 48,
  },
  heading: {
    fontSize: 28,
    fontWeight: '200',
    color: colors.text,
    letterSpacing: 4,
    marginBottom: 48,
    textTransform: 'uppercase',
  },
  section: {
    marginBottom: 36,
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 3,
    color: colors.muted,
    marginBottom: 16,
  },
  taskInput: {
    fontSize: 20,
    fontWeight: '300',
    color: colors.text,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.dim,
    paddingVertical: 8,
  },
  phaseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.faint,
  },
  phaseTag: {
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  phaseLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  stepBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.faint,
    borderRadius: 18,
  },
  stepIcon: {
    fontSize: 20,
    color: colors.text,
    lineHeight: 24,
  },
  stepValue: {
    fontSize: 16,
    fontWeight: '300',
    color: colors.text,
    minWidth: 64,
    textAlign: 'center',
  },
  total: {
    fontSize: 12,
    color: colors.muted,
    textAlign: 'right',
    letterSpacing: 1,
    marginBottom: 48,
  },
  startBtn: {
    height: 56,
    borderRadius: 4,
    backgroundColor: colors.text,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startBtnDisabled: {
    opacity: 0.25,
  },
  startText: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 4,
    color: colors.bg,
  },
});
