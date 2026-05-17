import React, { useEffect, useRef, useState } from 'react';
import { Circle, G, Text as SvgText } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { colors } from '@/theme/colors';
import { insertInteraction } from '@/db/queries';
import { gunaForDate } from '@/time/guna';

const FOCUS_MINS = 25;
const TICK_MS = 1000;

interface Props {
  cx: number;
  cy: number;
  r: number;
  active: boolean;
  onComplete: () => void;
}

export function PomodoroCore({ cx, cy, r, active, onComplete }: Props) {
  const [elapsedSec, setElapsedSec] = useState(0);
  const startedAt = useRef<number | null>(null);

  useEffect(() => {
    if (!active) {
      setElapsedSec(0);
      startedAt.current = null;
      return;
    }
    startedAt.current = Date.now();
    const id = setInterval(() => {
      if (startedAt.current == null) return;
      const e = Math.floor((Date.now() - startedAt.current) / 1000);
      setElapsedSec(e);
      if (e >= FOCUS_MINS * 60) {
        clearInterval(id);
        insertInteraction({
          timestamp: Date.now(),
          duration_mins: FOCUS_MINS,
          guna_state: gunaForDate(),
          type: 'pomodoro',
          score: 1,
        });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        onComplete();
      }
    }, TICK_MS);
    return () => clearInterval(id);
  }, [active, onComplete]);

  if (!active) return null;

  const total = FOCUS_MINS * 60;
  const progress = Math.min(1, elapsedSec / total);
  const circumference = 2 * Math.PI * r;
  const mins = Math.floor((total - elapsedSec) / 60);
  const secs = (total - elapsedSec) % 60;

  return (
    <G>
      <Circle
        cx={cx}
        cy={cy}
        r={r}
        stroke={colors.faint}
        strokeWidth={3}
        fill="none"
      />
      <Circle
        cx={cx}
        cy={cy}
        r={r}
        stroke={colors.rajas}
        strokeWidth={3}
        fill="none"
        strokeDasharray={`${circumference}`}
        strokeDashoffset={`${circumference * (1 - progress)}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cy})`}
      />
      <SvgText
        x={cx}
        y={cy + 6}
        fill={colors.text}
        fontSize={22}
        fontWeight="300"
        textAnchor="middle"
      >
        {`${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`}
      </SvgText>
    </G>
  );
}
