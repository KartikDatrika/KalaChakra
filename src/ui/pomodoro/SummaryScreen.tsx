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
  PHASE_COLOR,
  PHASE_LABEL,
  PHASE_ORDER,
  PomodoroConfig,
  PomodoroPhase,
  formatDuration,
} from '@/time/pomodoro';
import { insertPomodoroSession } from '@/db/pomodoro';

interface PhaseResult {
  actualSecs: number;
  notes: string;
}

interface Props {
  config: PomodoroConfig;
  startedAt: number;
  results: Record<PomodoroPhase, PhaseResult>;
  onDone: () => void;
}

export function SummaryScreen({ config, startedAt, results, onDone }: Props) {
  const [summary, setSummary] = useState('');
  const [saved,   setSaved]   = useState(false);

  const totalActualSecs = PHASE_ORDER.reduce((acc, p) => acc + results[p].actualSecs, 0);
  const totalPlannedMins = config.planMins + config.workMins + config.verifyMins;

  function handleSave() {
    insertPomodoroSession({
      taskName:         config.taskName,
      startedAt,
      completedAt:      Date.now(),
      planMins:         config.planMins,
      workMins:         config.workMins,
      verifyMins:       config.verifyMins,
      planActualSecs:   results.plan.actualSecs,
      workActualSecs:   results.work.actualSecs,
      verifyActualSecs: results.verify.actualSecs,
      planNotes:        results.plan.notes,
      workNotes:        results.work.notes,
      verifyNotes:      results.verify.notes,
      summary:          summary.trim(),
    });
    setSaved(true);
    setTimeout(onDone, 800);
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        {/* Task */}
        <Text style={styles.taskName}>{config.taskName}</Text>
        <Text style={styles.subhead}>SESSION COMPLETE</Text>

        {/* Total time */}
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>TOTAL TIME</Text>
          <Text style={styles.totalValue}>
            {`${formatDuration(totalActualSecs)}  /  ${totalPlannedMins}m planned`}
          </Text>
        </View>

        {/* Per-phase breakdown */}
        {PHASE_ORDER.map((phase) => (
          <PhaseCard
            key={phase}
            phase={phase}
            plannedMins={
              phase === 'plan'   ? config.planMins :
              phase === 'work'   ? config.workMins :
              config.verifyMins
            }
            result={results[phase]}
          />
        ))}

        {/* Summary notes */}
        <Text style={styles.sectionLabel}>OVERALL SUMMARY</Text>
        <TextInput
          style={styles.summaryInput}
          placeholder="Key takeaways, decisions, next steps…"
          placeholderTextColor={colors.muted}
          value={summary}
          onChangeText={setSummary}
          multiline
          textAlignVertical="top"
        />

        {/* Save */}
        <Pressable
          style={[styles.saveBtn, saved && styles.saveBtnDone]}
          onPress={handleSave}
          disabled={saved}
        >
          <Text style={styles.saveText}>{saved ? 'SAVED ✓' : 'SAVE SESSION'}</Text>
        </Pressable>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ---------------------------------------------------------------------------

function PhaseCard({
  phase,
  plannedMins,
  result,
}: {
  phase: PomodoroPhase;
  plannedMins: number;
  result: PhaseResult;
}) {
  const color = PHASE_COLOR[phase];
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={[styles.cardPhase, { color }]}>{PHASE_LABEL[phase]}</Text>
        <Text style={styles.cardTime}>
          {`${formatDuration(result.actualSecs)}  /  ${plannedMins}m`}
        </Text>
      </View>
      {result.notes ? (
        <Text style={styles.cardNotes}>{result.notes}</Text>
      ) : (
        <Text style={styles.cardEmpty}>No notes</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 28,
    paddingTop: 64,
    paddingBottom: 48,
  },
  taskName: {
    fontSize: 24,
    fontWeight: '300',
    color: colors.text,
    marginBottom: 6,
  },
  subhead: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 3,
    color: colors.muted,
    marginBottom: 32,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.faint,
    marginBottom: 24,
  },
  totalLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 2,
    color: colors.muted,
  },
  totalValue: {
    fontSize: 13,
    fontWeight: '300',
    color: colors.text,
  },
  card: {
    backgroundColor: colors.faint,
    borderRadius: 6,
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardPhase: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
  },
  cardTime: {
    fontSize: 12,
    fontWeight: '300',
    color: colors.muted,
  },
  cardNotes: {
    fontSize: 14,
    fontWeight: '300',
    color: colors.text,
    lineHeight: 22,
  },
  cardEmpty: {
    fontSize: 13,
    color: colors.dim,
    fontStyle: 'italic',
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 3,
    color: colors.muted,
    marginTop: 24,
    marginBottom: 12,
  },
  summaryInput: {
    fontSize: 15,
    fontWeight: '300',
    color: colors.text,
    lineHeight: 24,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.dim,
    borderRadius: 4,
    padding: 14,
    minHeight: 100,
    marginBottom: 32,
  },
  saveBtn: {
    height: 56,
    backgroundColor: colors.text,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnDone: {
    backgroundColor: colors.faint,
  },
  saveText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 4,
    color: colors.bg,
  },
});
