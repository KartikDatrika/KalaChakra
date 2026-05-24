import React, { useCallback, useEffect, useState } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Animated, {
  cancelAnimation,
  runOnJS,
  useAnimatedProps,
  useAnimatedReaction,
  useDerivedValue,
  useSharedValue,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import Svg, { Circle, G, Line, Text as SvgText } from 'react-native-svg';
import { polar } from './geometry';
import { AnimatedG } from './animated';
import { colors } from '@/theme/colors';
import {
  CYCLE_MINUTES,
  DEGREES_PER_DAY,
  MODE_LABEL,
  NEEDLE_COLOR,
  PHASE_BOUNDS,
  RELAX_SECONDS,
  RTA_PER_DAY,
  SLEEP_END_HOUR,
  SLEEP_START_HOUR,
  SVG_ROTATE_DEG,
  formatClock,
  formatRta,
  modeForDate,
  type DialMode,
} from '@/time/kalachakra';

const { width, height } = Dimensions.get('window');
const SIZE = Math.min(width, height) * 0.92;
const CX = SIZE / 2;
const CY = SIZE / 2;

// Ring radii.
const R_OUTER = SIZE / 2 - 18; // 24-hour ring
const R_INNER = R_OUTER - 70; // 108-rta ring
const R_HUB = 26; // center pivot

// ---------------------------------------------------------------------------
// Static rings — pure geometry, drawn once, never re-render.
// ---------------------------------------------------------------------------

const HOUR_TICKS = Array.from({ length: 24 }, (_, i) => i);
const HALF_TICKS = Array.from({ length: 24 }, (_, i) => i); // 30-min marks
const RTA_TICKS = Array.from({ length: RTA_PER_DAY }, (_, i) => i);

/** SVG angle for hour h with sleep window centred at the bottom of the dial. */
function hourSvgDeg(h: number): number {
  return (SVG_ROTATE_DEG + (h / 24) * DEGREES_PER_DAY) % 360;
}

function OuterRing() {
  return (
    <G>
      {HOUR_TICKS.map((h) => {
        const a = hourSvgDeg(h);
        const p1 = polar(CX, CY, R_OUTER, a);
        const p2 = polar(CX, CY, R_OUTER - 14, a);
        const lbl = polar(CX, CY, R_OUTER - 30, a);
        const showLabel = h % 2 === 0;
        return (
          <G key={`h-${h}`}>
            <Line
              x1={p1.x}
              y1={p1.y}
              x2={p2.x}
              y2={p2.y}
              stroke={colors.text}
              strokeWidth={2}
              strokeLinecap="round"
            />
            {showLabel && (
              <SvgText
                x={lbl.x}
                y={lbl.y + 3.5}
                fill={colors.muted}
                fontSize={11}
                textAnchor="middle"
              >
                {h}
              </SvgText>
            )}
          </G>
        );
      })}

      {HALF_TICKS.map((h) => {
        const a = hourSvgDeg(h + 0.5);
        const p1 = polar(CX, CY, R_OUTER, a);
        const p2 = polar(CX, CY, R_OUTER - 6, a);
        return (
          <Line
            key={`hh-${h}`}
            x1={p1.x}
            y1={p1.y}
            x2={p2.x}
            y2={p2.y}
            stroke={colors.muted}
            strokeWidth={1}
          />
        );
      })}
    </G>
  );
}

function InnerRing() {
  return (
    <G>
      <Circle
        cx={CX}
        cy={CY}
        r={R_INNER}
        stroke={colors.faint}
        strokeWidth={0.75}
        fill="none"
      />
      {RTA_TICKS.map((i) => {
        const a = (SVG_ROTATE_DEG + (i / RTA_PER_DAY) * 360) % 360;
        // Every 9th rta gets a slightly longer, brighter tick (108 / 12 cycles).
        const major = i % 9 === 0;
        const len = major ? 7 : 4;
        const p1 = polar(CX, CY, R_INNER, a);
        const p2 = polar(CX, CY, R_INNER - len, a);
        return (
          <Line
            key={`rta-${i}`}
            x1={p1.x}
            y1={p1.y}
            x2={p2.x}
            y2={p2.y}
            stroke={major ? colors.muted : colors.dim}
            strokeWidth={major ? 1 : 0.6}
          />
        );
      })}
    </G>
  );
}

// ---------------------------------------------------------------------------
// Dial
// ---------------------------------------------------------------------------

interface Snapshot {
  mode: DialMode;
  time: string;
  rta: string;
  color: string;
}

function snapshotFor(d: Date): Snapshot {
  const mode = modeForDate(d);
  return {
    mode,
    time: formatClock(d),
    rta: formatRta(d),
    color: NEEDLE_COLOR[mode],
  };
}

export function KalaChakraDial() {
  // secondsOfDay is the single animated source of truth, advanced on the UI
  // thread by a requestAnimationFrame loop — no React renders at 60fps.
  const _now = new Date();
  const secondsOfDay = useSharedValue(
    _now.getHours() * 3600 + _now.getMinutes() * 60 + _now.getSeconds() + _now.getMilliseconds() / 1000,
  );
  // relaxSweep ramps 0 -> 1 across the 30-min Relax phase to drive the
  // autonomous full rotation, decoupled from real-time angle.
  const relaxSweep = useSharedValue(0);
  // 1 while in Relax (needle shrinks to inner ring + dims), else 0.
  const relaxing = useSharedValue(0);
  // 1 while asleep (needle hidden), else 0.
  const sleeping = useSharedValue(0);

  // Lightweight JS-side snapshot for the center text — updated ~1x/sec only.
  const [snap, setSnap] = useState<Snapshot>(() => snapshotFor(new Date()));

  const updateSnap = useCallback((ts: number) => {
    setSnap(snapshotFor(new Date(ts)));
  }, []);

  // ---- rAF clock loop (UI thread) ----------------------------------------
  useEffect(() => {
    let raf: number;
    const tick = () => {
      const d = new Date();
      const s =
        d.getHours() * 3600 +
        d.getMinutes() * 60 +
        d.getSeconds() +
        d.getMilliseconds() / 1000;
      secondsOfDay.value = s;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [secondsOfDay]);

  // ---- mode tracking: drives relax sweep + 1Hz text refresh ----------------
  useAnimatedReaction(
    () => Math.floor(secondsOfDay.value),
    (sec, prev) => {
      'worklet';
      if (sec === prev) return;
      const ts = Date.now();
      const minutesIntoDay = sec / 60;
      const offset = minutesIntoDay % CYCLE_MINUTES;
      const h = new Date(ts).getHours();
      const asleep = h >= SLEEP_START_HOUR || h < SLEEP_END_HOUR;
      const inRelax = !asleep && offset >= PHASE_BOUNDS.verifyEnd;

      sleeping.value = asleep ? 1 : 0;
      relaxing.value = inRelax ? 1 : 0;
      runOnJS(updateSnap)(ts);
    },
    [],
  );

  // ---- Relax autonomous sweep ---------------------------------------------
  // When entering Relax, start one full 0->1 ramp over RELAX_SECONDS. The
  // ramp is restarted (seeded from the actual elapsed position) on entry so
  // it stays roughly phase-accurate even if the app was backgrounded.
  useAnimatedReaction(
    () => relaxing.value,
    (now, prev) => {
      if (now === prev) return;
      if (now === 1) {
        const minutesIntoDay = secondsOfDay.value / 60;
        const offset = minutesIntoDay % CYCLE_MINUTES;
        const elapsedSec = (offset - PHASE_BOUNDS.verifyEnd) * 60;
        const start = Math.max(0, Math.min(1, elapsedSec / RELAX_SECONDS));
        const remaining = Math.max(1, RELAX_SECONDS * (1 - start));
        relaxSweep.value = start;
        relaxSweep.value = withTiming(1, {
          duration: remaining * 1000,
          easing: Easing.linear,
        });
      } else {
        cancelAnimation(relaxSweep);
        relaxSweep.value = 0;
      }
    },
    [],
  );

  // ---- Needle rotation -----------------------------------------------------
  // Standard phases: track real time (midnight bottom -> 180deg offset).
  // Relax: ignore time, do a full 360 sweep driven by relaxSweep.
  const needleAngle = useDerivedValue(() => {
    if (relaxing.value === 1) {
      return relaxSweep.value * 360;
    }
    const h = secondsOfDay.value / 3600;
    return (SVG_ROTATE_DEG + (h / 24) * 360) % 360;
  });

  // ---- Needle length: outer ring normally, inner ring during Relax ---------
  const needleLength = useDerivedValue(() => {
    return relaxing.value === 1 ? R_INNER - R_HUB : R_OUTER - R_HUB;
  });

  const needleProps = useAnimatedProps(() => ({
    transform: [
      { translateX: CX },
      { translateY: CY },
      { rotate: `${needleAngle.value}deg` },
    ],
    opacity: sleeping.value === 1 ? 0.12 : 1,
  }));

  const needleLineProps = useAnimatedProps(() => ({
    y2: -(R_HUB + needleLength.value),
  }));

  const needleTipProps = useAnimatedProps(() => ({
    cy: -(R_HUB + needleLength.value),
  }));

  const isSleep = snap.mode === 'sleep';
  const needleColor = snap.color;

  return (
    <View style={styles.fill}>
      <View style={styles.center}>
        <Svg width={SIZE} height={SIZE}>
          <OuterRing />
          <InnerRing />

          {/* Needle — translated to center, rotated on the UI thread.
              Drawn pointing "up" (-y); angle 0 = top of dial. */}
          <AnimatedG animatedProps={needleProps}>
            <AnimatedLine
              x1={0}
              y1={-R_HUB}
              x2={0}
              animatedProps={needleLineProps}
              stroke={needleColor}
              strokeWidth={3}
              strokeLinecap="round"
            />
            <AnimatedCircle
              cx={0}
              animatedProps={needleTipProps}
              r={5}
              fill={needleColor}
            />
          </AnimatedG>

          {/* Center hub + readout */}
          <Circle cx={CX} cy={CY} r={R_HUB} fill={colors.bg} />
          <SvgText
            x={CX}
            y={CY - 8}
            fill={colors.text}
            fontSize={26}
            fontWeight="600"
            textAnchor="middle"
          >
            {snap.time.slice(0, 5)}
          </SvgText>
          <SvgText
            x={CX}
            y={CY + 12}
            fill={isSleep ? colors.muted : needleColor}
            fontSize={12}
            fontWeight="700"
            textAnchor="middle"
          >
            {MODE_LABEL[snap.mode]}
          </SvgText>
          <SvgText
            x={CX}
            y={CY + 28}
            fill={colors.muted}
            fontSize={10}
            textAnchor="middle"
          >
            {`Rta ${snap.rta}`}
          </SvgText>
        </Svg>
      </View>
    </View>
  );
}

const AnimatedLine = Animated.createAnimatedComponent(Line);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
