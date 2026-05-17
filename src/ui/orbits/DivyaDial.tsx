import React from 'react';
import { Circle, G, Path, Text as SvgText } from 'react-native-svg';
import { polar, wedgePath } from '../geometry';
import { colors } from '@/theme/colors';
import { YUGAS, YUGA_TOTAL } from '@/time/yuga';

interface Props {
  cx: number;
  cy: number;
  r: number;
}

export function DivyaDial({ cx, cy, r }: Props) {
  let acc = 0;
  return (
    <G>
      {YUGAS.map((y) => {
        const a0 = (acc / YUGA_TOTAL) * 360;
        acc += y.ratio;
        const a1 = (acc / YUGA_TOTAL) * 360;
        const labelP = polar(cx, cy, r * 0.65, (a0 + a1) / 2);
        return (
          <G key={y.name}>
            <Path
              d={wedgePath(cx, cy, r, a0, a1)}
              fill={y.color}
              stroke={colors.bg}
              strokeWidth={2}
            />
            <SvgText
              x={labelP.x}
              y={labelP.y}
              fill={colors.text}
              fontSize={11}
              fontWeight="600"
              textAnchor="middle"
            >
              {y.name}
            </SvgText>
          </G>
        );
      })}
      <Circle cx={cx} cy={cy} r={r * 0.18} fill={colors.bg} />
    </G>
  );
}
