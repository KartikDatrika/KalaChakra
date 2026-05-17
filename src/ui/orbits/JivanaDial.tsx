import React, { useEffect, useState } from 'react';
import { Circle, G, Line } from 'react-native-svg';
import { polar } from '../geometry';
import { colors } from '@/theme/colors';
import { aggregateByYearOfLife } from '@/db/queries';
import type { YearAggregate } from '@/types';

interface Props {
  cx: number;
  cy: number;
  r: number;
  active: boolean;
  birthYear?: number;
}

const LIFESPAN = 60;

export function JivanaDial({ cx, cy, r, active, birthYear }: Props) {
  const [rows, setRows] = useState<YearAggregate[]>([]);
  const by = birthYear ?? new Date().getFullYear() - 30;

  useEffect(() => {
    if (!active) return;
    try {
      setRows(aggregateByYearOfLife(by));
    } catch {
      setRows([]);
    }
  }, [active, by]);

  const minsByYear = new Map<number, number>();
  rows.forEach((r2) => minsByYear.set(r2.year_of_life, r2.total_mins));
  const max = Math.max(1, ...Array.from(minsByYear.values()));

  return (
    <G>
      <Circle cx={cx} cy={cy} r={r} stroke={colors.faint} strokeWidth={1} fill="none" />
      {Array.from({ length: LIFESPAN }, (_, i) => {
        const a = (i / LIFESPAN) * 360;
        const intensity = (minsByYear.get(i) ?? 0) / max;
        const tickColor = intensity > 0 ? colors.rajas : colors.muted;
        const p1 = polar(cx, cy, r, a);
        const p2 = polar(cx, cy, r - (i % 10 === 0 ? 18 : 10), a);
        return (
          <Line
            key={`y-${i}`}
            x1={p1.x}
            y1={p1.y}
            x2={p2.x}
            y2={p2.y}
            stroke={tickColor}
            strokeOpacity={0.3 + 0.7 * intensity}
            strokeWidth={i % 10 === 0 ? 2 : 1}
          />
        );
      })}
    </G>
  );
}
