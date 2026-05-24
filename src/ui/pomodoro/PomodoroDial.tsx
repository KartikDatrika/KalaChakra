import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedProps,
  useDerivedValue,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, G, Line, Text as SvgText } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { polar } from '../geometry';
import { AnimatedCircle, AnimatedG } from '../animated';
import { colors } from '@/theme/colors';
import {
  PHASE_COLOR,
  PHASE_LABEL,
  PomodoroPhase,
  formatCountdown,
} from '@/time/pomodoro';

const { width, height } = Dimensions.get('window');
const SIZE   = Math.min(width, height) * 0.92;
const CX     = SIZE / 2;
const CY     = SIZE / 2;
const R_OUTER = SIZE / 2 - 18;
const R_INNER = R_OUTER - 70;
const R_HUB   = 26;

// Progress arc ring sits just inside the outer ring
const R_ARC = R_OUTER - 10;
const ARC_CIRCUMFERENCE = 2 * Math.PI * R_ARC;

// Tick marks: 12 divisions (5-min intervals for a 60-min max dial)
const TICK_COUNT = 60;
const MAJOR_EVERY = 5; // bold tick every 5 units

const AnimatedLine = Animated.createAnimatedComponent(Line);

interface Props {
  phase: PomodoroPhase;
  totalSecs: number;
  onComplete: (actualSecs: number) => void;
}

export function PomodoroDial({ phase, totalSecs, onComplete }: Props) {
  const phaseColor    = PHASE_COLOR[phase];
  const startedAt     = useRef<number>(Date.now());
  const completedRef  = useRef(false);

  // Shared value for smooth needle + arc animation (rAF on UI thread)
  const progress      = useSharedValue(0); // 0 → 1
  // Flash overlay opacity for phase-complete signal
  const flashOpacity  = useSharedValue(0);

  // JS-side countdown text state (~2x per sec)
  const [remainingSecs, setRemainingSecs] = useState(totalSecs);

  // Reset on phase change
  useEffect(() => {
    startedAt.current  = Date.now();
    completedRef.current = false;
    progress.value     = 0;
    flashOpacity.value = 0;
    setRemainingSecs(totalSecs);
  }, [phase, totalSecs]); // eslint-disable-line react-hooks/exhaustive-deps

  const triggerComplete = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    const actualSecs = Math.round((Date.now() - startedAt.current) / 1000);

    // Visual flash
    flashOpacity.value = withRepeat(
      withSequence(
        withTiming(0.8, { duration: 120 }),
        withTiming(0,   { duration: 180 }),
      ),
      5,
      false,
    );

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    // Small delay so flash plays before unmount
    setTimeout(() => onComplete(actualSecs), 1400);
  }, [onComplete, flashOpacity]);

  // rAF loop — drives smooth progress on UI thread
  useEffect(() => {
    let raf: number;
    const tick = () => {
      const elapsed = (Date.now() - startedAt.current) / 1000;
      const p = Math.min(1, elapsed / totalSecs);
      progress.value = p;
      if (p < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        runOnJS(triggerComplete)();
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phase, totalSecs, triggerComplete]); // eslint-disable-line react-hooks/exhaustive-deps

  // Countdown text interval
  useEffect(() => {
    const id = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startedAt.current) / 1000);
      setRemainingSecs(Math.max(0, totalSecs - elapsed));
    }, 500);
    return () => clearInterval(id);
  }, [phase, totalSecs]);

  // Needle rotation: 0° = top, sweeps clockwise
  const needleAngle = useDerivedValue(() => progress.value * 360);

  const needleProps = useAnimatedProps(() => ({
    transform: [
      { translateX: CX },
      { translateY: CY },
      { rotate: `${needleAngle.value}deg` },
    ],
  }));

  // Progress arc via strokeDashoffset
  const arcProps = useAnimatedProps(() => ({
    strokeDashoffset: ARC_CIRCUMFERENCE * (1 - progress.value),
  }));

  // Flash ring
  const flashProps = useAnimatedProps(() => ({
    opacity: flashOpacity.value,
  }));

  const pct = Math.round((1 - remainingSecs / totalSecs) * 100);

  return (
    <View style={styles.fill}>
      <View style={styles.center}>
        <Svg width={SIZE} height={SIZE}>
          {/* Tick ring */}
          <TickRing phaseColor={phaseColor} />

          {/* Background arc ring */}
          <Circle
            cx={CX}
            cy={CY}
            r={R_ARC}
            stroke={colors.faint}
            strokeWidth={3}
            fill="none"
          />

          {/* Progress arc — clockwise from top */}
          <AnimatedCircle
            cx={CX}
            cy={CY}
            r={R_ARC}
            stroke={phaseColor}
            strokeWidth={3}
            fill="none"
            strokeDasharray={ARC_CIRCUMFERENCE}
            strokeLinecap="round"
            transform={`rotate(-90 ${CX} ${CY})`}
            animatedProps={arcProps}
          />

          {/* Flash overlay arc */}
          <AnimatedCircle
            cx={CX}
            cy={CY}
            r={R_ARC}
            stroke="#FFFFFF"
            strokeWidth={6}
            fill="none"
            strokeDasharray={ARC_CIRCUMFERENCE}
            strokeLinecap="round"
            transform={`rotate(-90 ${CX} ${CY})`}
            animatedProps={flashProps}
          />

          {/* Needle */}
          <AnimatedG animatedProps={needleProps}>
            <Line
              x1={0}
              y1={-R_HUB}
              x2={0}
              y2={-(R_INNER - 4)}
              stroke={phaseColor}
              strokeWidth={3}
              strokeLinecap="round"
            />
            <Circle cx={0} cy={-(R_INNER - 4)} r={5} fill={phaseColor} />
          </AnimatedG>

          {/* Center hub */}
          <Circle cx={CX} cy={CY} r={R_HUB + 20} fill={colors.bg} />

          {/* Center readout */}
          <SvgText
            x={CX}
            y={CY - 16}
            fill={colors.muted}
            fontSize={11}
            fontWeight="600"
            textAnchor="middle"
            letterSpacing={2}
          >
            {PHASE_LABEL[phase]}
          </SvgText>
          <SvgText
            x={CX}
            y={CY + 12}
            fill={colors.text}
            fontSize={28}
            fontWeight="300"
            textAnchor="middle"
          >
            {formatCountdown(remainingSecs)}
          </SvgText>
          <SvgText
            x={CX}
            y={CY + 30}
            fill={phaseColor}
            fontSize={11}
            textAnchor="middle"
          >
            {`${pct}%`}
          </SvgText>
        </Svg>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Static tick ring
// ---------------------------------------------------------------------------

function TickRing({ phaseColor }: { phaseColor: string }) {
  return (
    <G>
      {Array.from({ length: TICK_COUNT }, (_, i) => {
        const deg = (i / TICK_COUNT) * 360;
        const major = i % MAJOR_EVERY === 0;
        const len = major ? 10 : 5;
        const p1 = polar(CX, CY, R_OUTER, deg);
        const p2 = polar(CX, CY, R_OUTER - len, deg);
        return (
          <Line
            key={i}
            x1={p1.x} y1={p1.y}
            x2={p2.x} y2={p2.y}
            stroke={major ? phaseColor : colors.dim}
            strokeWidth={major ? 1.5 : 0.75}
            strokeLinecap="round"
            opacity={major ? 0.6 : 0.4}
          />
        );
      })}
    </G>
  );
}

const styles = StyleSheet.create({
  fill:   { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
