import React, { useEffect, useState } from 'react';
import { G, Circle, Line, Path, Text as SvgText } from 'react-native-svg';
import { arcPath, polar } from '../geometry';
import { colors } from '@/theme/colors';
import { gunaColor, gunaForHour } from '@/time/guna';

interface Props {
  cx: number;
  cy: number;
  r: number;
}

export function AhoratraDial({ cx, cy, r }: Props) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const hoursDecimal = now.getHours() + now.getMinutes() / 60;
  const deg = (hoursDecimal / 24) * 360;
  const g = gunaForHour(now.getHours());

  const rta = Array.from({ length: 108 }, (_, i) => i);
  const hours = Array.from({ length: 24 }, (_, i) => i);

  return (
    <G opacity={1}>
      <Circle cx={cx} cy={cy} r={r} stroke={colors.faint} strokeWidth={1} fill="none" />
      <Circle cx={cx} cy={cy} r={r - 28} stroke={colors.faint} strokeWidth={0.5} fill="none" />

      {rta.map((i) => {
        const a = (i / 108) * 360;
        const p1 = polar(cx, cy, r - 2, a);
        const p2 = polar(cx, cy, r - 6, a);
        return (
          <Line
            key={`rta-${i}`}
            x1={p1.x}
            y1={p1.y}
            x2={p2.x}
            y2={p2.y}
            stroke={colors.dim}
            strokeWidth={0.5}
          />
        );
      })}

      {hours.map((h) => {
        const a = (h / 24) * 360;
        const p1 = polar(cx, cy, r - 2, a);
        const p2 = polar(cx, cy, r - 14, a);
        const lbl = polar(cx, cy, r - 26, a);
        return (
          <G key={`hr-${h}`}>
            <Line
              x1={p1.x}
              y1={p1.y}
              x2={p2.x}
              y2={p2.y}
              stroke={colors.muted}
              strokeWidth={1}
            />
            {h % 6 === 0 && (
              <SvgText
                x={lbl.x}
                y={lbl.y}
                fill={colors.muted}
                fontSize={9}
                textAnchor="middle"
              >
                {h.toString().padStart(2, '0')}
              </SvgText>
            )}
          </G>
        );
      })}

      <Path
        d={arcPath(cx, cy, r, deg - 7.5, deg + 7.5)}
        stroke={gunaColor(g)}
        strokeWidth={4}
        fill="none"
        strokeLinecap="round"
      />
    </G>
  );
}
