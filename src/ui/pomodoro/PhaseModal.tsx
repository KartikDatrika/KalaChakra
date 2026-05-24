import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { colors } from '@/theme/colors';
import {
  PHASE_COLOR,
  PHASE_LABEL,
  PHASE_PROMPT,
  PomodoroPhase,
  formatDuration,
  nextPhase,
} from '@/time/pomodoro';

interface Props {
  phase: PomodoroPhase;
  actualSecs: number;
  plannedMins: number;
  onContinue: (notes: string) => void;
}

export function PhaseModal({ phase, actualSecs, plannedMins, onContinue }: Props) {
  const [notes, setNotes] = useState('');
  const color = PHASE_COLOR[phase];
  const next  = nextPhase(phase);

  const overUnder = actualSecs - plannedMins * 60;
  const overUnderLabel =
    overUnder > 0
      ? `+${formatDuration(overUnder)} over`
      : overUnder < 0
      ? `${formatDuration(-overUnder)} under`
      : 'on time';

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Phase complete badge */}
      <View style={[styles.badge, { borderColor: color }]}>
        <Text style={[styles.badgePhase, { color }]}>{PHASE_LABEL[phase]}</Text>
        <Text style={styles.badgeDone}> COMPLETE</Text>
      </View>

      {/* Time stats */}
      <View style={styles.stats}>
        <Stat label="ACTUAL"  value={formatDuration(actualSecs)} />
        <Stat label="PLANNED" value={`${plannedMins}m`} />
        <Stat label="DELTA"   value={overUnderLabel} color={overUnder > 60 ? '#FF5A5F' : colors.muted} />
      </View>

      {/* Notes input */}
      <Text style={styles.prompt}>{PHASE_PROMPT[phase]}</Text>
      <TextInput
        style={styles.notesInput}
        placeholder="Add notes…"
        placeholderTextColor={colors.muted}
        value={notes}
        onChangeText={setNotes}
        multiline
        autoFocus
        textAlignVertical="top"
      />

      {/* Continue */}
      <Pressable
        style={[styles.continueBtn, { borderColor: next ? color : colors.text }]}
        onPress={() => onContinue(notes.trim())}
      >
        <Text style={[styles.continueText, { color: next ? color : colors.text }]}>
          {next ? `${PHASE_LABEL[next]} →` : 'FINISH ✓'}
        </Text>
      </Pressable>
    </KeyboardAvoidingView>
  );
}

function Stat({ label, value, color = colors.text }: { label: string; value: string; color?: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: 28,
    paddingTop: 72,
    paddingBottom: 48,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 36,
  },
  badgePhase: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 3,
  },
  badgeDone: {
    fontSize: 12,
    fontWeight: '300',
    color: colors.muted,
    letterSpacing: 3,
  },
  stats: {
    flexDirection: 'row',
    gap: 24,
    marginBottom: 40,
  },
  stat: {
    flex: 1,
  },
  statLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 2,
    color: colors.muted,
    marginBottom: 6,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '300',
    color: colors.text,
  },
  prompt: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.muted,
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  notesInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '300',
    color: colors.text,
    lineHeight: 26,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.faint,
    borderRadius: 4,
    padding: 16,
    marginBottom: 28,
    maxHeight: 220,
    minHeight: 120,
  },
  continueBtn: {
    height: 56,
    borderWidth: 1,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueText: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 4,
  },
});
