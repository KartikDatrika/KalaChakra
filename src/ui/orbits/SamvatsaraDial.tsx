import React, { useEffect, useState } from 'react';
import { Circle, G, Line, Path, Text as SvgText } from 'react-native-svg';
import { polar, wedgePath } from '../geometry';
import { colors } from '@/theme/colors';
import { MONTHS, RITUS } from '@/time/ritu';
import { aggregateByMonth } from '@/db/queries';
import type { MonthAggregate } from '@/types';

interface Props {
  cx: number;
  cy: number;
  r: number;
  active: boolean;
}

export function SamvatsaraDial({ cx, cy, r, active }: Props) {
  const [rows, setRows] = useState<MonthAggregate[]>([]);

  useEffect(() => {
    if (!active) return;
    try {
      setRows(aggregateByMonth());
    } catch {
      setRows([]);
    }
  }, [active]);

  const rajasByMonth = new Map<number, number>();
  rows.forEach((r2) => {
    if (r2.guna_state === 'rajas') {
      rajasByMonth.set(r2.month, (rajasByMonth.get(r2.month) ?? 0) + r2.total_mins);
    }
  });
  const max = Math.max(1, ...Array.from(rajasByMonth.values()));

  const seg = 360 / 12;
  const innerR = r - 36;
  const rituInnerR = r - 70;

  return (
    <G>
      <Circle cx={cx} cy={cy} r={r} stroke={colors.faint} strokeWidth={1} fill="none" />
      <Circle cx={cx} cy={cy} r={innerR} stroke={colors.faint} strokeWidth={0.5} fill="none" />

      {MONTHS.map((m, i) => {
        const a0 = i * seg;
        const a1 = a0 + seg;
        const sum = rajasByMonth.get(i) ?? 0;
        const intensity = sum / max;
        const fill = sum > 0 ? colors.rajas : colors.faint;
        const labelP = polar(cx, cy, r - 18, a0 + seg / 2);
        return (
          <G key={`m-${i}`}>
            <Path
              d={wedgePath(cx, cy, r - 2, a0, a1)}
              fill={fill}
              fillOpacity={0.1 + 0.7 * intensity}
              stroke={colors.bg}
              strokeWidth={1}
            />
            <SvgText
              x={labelP.x}
              y={labelP.y}
              fill={colors.text}
              fontSize={9}
              textAnchor="middle"
            >
              {m}
            </SvgText>
          </G>
        );
      })}

      <Circle cx={cx} cy={cy} r={innerR} fill={colors.bg} />

      {RITUS.map((ritu, i) => {
        const a0 = i * 60;
        const a1 = a0 + 60;
        const labelP = polar(cx, cy, rituInnerR + (innerR - rituInnerR) / 2, a0 + 30);
        return (
          <G key={`ritu-${i}`}>
            <Path
              d={wedgePath(cx, cy, innerR - 2, a0, a1)}
              fill={colors.faint}
              stroke={colors.bg}
              strokeWidth={1}
            />
            <SvgText
              x={labelP.x}
              y={labelP.y}
              fill={colors.muted}
              fontSize={8}
              textAnchor="middle"
            >
              {ritu.name}
            </SvgText>
          </G>
        );
      })}

      <Circle cx={cx} cy={cy} r={rituInnerR} fill={colors.bg} />

      {Array.from({ length: 12 }, (_, i) => {
        const a = i * seg;
        const p1 = polar(cx, cy, r, a);
        const p2 = polar(cx, cy, rituInnerR, a);
        return (
          <Line
            key={`div-${i}`}
            x1={p1.x}
            y1={p1.y}
            x2={p2.x}
            y2={p2.y}
            stroke={colors.dim}
            strokeWidth={0.5}
          />
        );
      })}
    </G>
  );
}
