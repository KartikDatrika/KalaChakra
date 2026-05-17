import React, { useMemo } from 'react';
import { Circle, G } from 'react-native-svg';
import { polar } from '../geometry';
import { colors } from '@/theme/colors';

interface Props {
  cx: number;
  cy: number;
  r: number;
}

const DOT_COUNT = 720;
const RING_COUNT = 4;

export function BrahmaDial({ cx, cy, r }: Props) {
  const dots = useMemo(() => {
    const out: { x: number; y: number; rr: number }[] = [];
    for (let ring = 0; ring < RING_COUNT; ring++) {
      const radius = r * (0.6 + ring * 0.12);
      const count = DOT_COUNT / RING_COUNT;
      for (let i = 0; i < count; i++) {
        const a = (i / count) * 360 + ring * 0.7;
        const p = polar(cx, cy, radius, a);
        out.push({ x: p.x, y: p.y, rr: 0.6 + (ring % 2) * 0.3 });
      }
    }
    return out;
  }, [cx, cy, r]);

  return (
    <G>
      {dots.map((d, i) => (
        <Circle key={i} cx={d.x} cy={d.y} r={d.rr} fill={colors.muted} fillOpacity={0.5} />
      ))}
      <Circle cx={cx} cy={cy} r={1.5} fill={colors.sattva} />
    </G>
  );
}
