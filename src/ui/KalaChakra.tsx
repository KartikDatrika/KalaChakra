import React, { useCallback, useState } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  interpolate,
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
} from 'react-native-reanimated';
import Svg from 'react-native-svg';
import { HITBOX_WIDTH, useOrbitSlider } from '@/gestures/useOrbitSlider';
import { AhoratraDial } from './orbits/AhoratraDial';
import { SamvatsaraDial } from './orbits/SamvatsaraDial';
import { JivanaDial } from './orbits/JivanaDial';
import { DivyaDial } from './orbits/DivyaDial';
import { BrahmaDial } from './orbits/BrahmaDial';
import { PomodoroCore } from './PomodoroCore';
import { colors } from '@/theme/colors';

const { width, height } = Dimensions.get('window');
const SIZE = Math.min(width, height) * 0.92;
const CX = SIZE / 2;
const CY = SIZE / 2;
const R = SIZE / 2 - 16;

function useLayerStyle(orbitLevel: Animated.SharedValue<number>, target: number) {
  return useAnimatedStyle(() => {
    const op = interpolate(
      orbitLevel.value,
      [target - 1, target, target + 1],
      [0, 1, 0],
      'clamp',
    );
    const scale = interpolate(
      orbitLevel.value,
      [target - 1, target, target + 1],
      [0.85, 1, 1.15],
      'clamp',
    );
    return { opacity: op, transform: [{ scale }] };
  });
}

export function KalaChakra() {
  const { orbitLevel, panGesture } = useOrbitSlider();
  const [activeLevel, setActiveLevel] = useState(0);
  const [pomodoroOn, setPomodoroOn] = useState(false);

  useAnimatedReaction(
    () => Math.round(orbitLevel.value),
    (v, prev) => {
      if (v !== prev) runOnJS(setActiveLevel)(v);
    },
  );

  const s0 = useLayerStyle(orbitLevel, 0);
  const s1 = useLayerStyle(orbitLevel, 1);
  const s2 = useLayerStyle(orbitLevel, 2);
  const s3 = useLayerStyle(orbitLevel, 3);
  const s4 = useLayerStyle(orbitLevel, 4);

  const onCenterTap = useCallback(() => {
    if (activeLevel === 0) setPomodoroOn((p) => !p);
  }, [activeLevel]);

  const onPomodoroDone = useCallback(() => setPomodoroOn(false), []);

  return (
    <View style={styles.fill}>
      <View style={styles.center} pointerEvents="box-none">
        <View style={[styles.layer, { width: SIZE, height: SIZE }]} pointerEvents="box-none">
          <Animated.View style={[styles.absFill, s0]} pointerEvents="none">
            <Svg width={SIZE} height={SIZE}>
              <AhoratraDial cx={CX} cy={CY} r={R} />
            </Svg>
          </Animated.View>

          <Animated.View style={[styles.absFill, s1]} pointerEvents="none">
            <Svg width={SIZE} height={SIZE}>
              <SamvatsaraDial cx={CX} cy={CY} r={R} active={activeLevel === 1} />
            </Svg>
          </Animated.View>

          <Animated.View style={[styles.absFill, s2]} pointerEvents="none">
            <Svg width={SIZE} height={SIZE}>
              <JivanaDial cx={CX} cy={CY} r={R} active={activeLevel === 2} />
            </Svg>
          </Animated.View>

          <Animated.View style={[styles.absFill, s3]} pointerEvents="none">
            <Svg width={SIZE} height={SIZE}>
              <DivyaDial cx={CX} cy={CY} r={R} />
            </Svg>
          </Animated.View>

          <Animated.View style={[styles.absFill, s4]} pointerEvents="none">
            <Svg width={SIZE} height={SIZE}>
              <BrahmaDial cx={CX} cy={CY} r={R} />
            </Svg>
          </Animated.View>

          {pomodoroOn && (
            <View style={styles.absFill} pointerEvents="none">
              <Svg width={SIZE} height={SIZE}>
                <PomodoroCore
                  cx={CX}
                  cy={CY}
                  r={R - 50}
                  active={pomodoroOn}
                  onComplete={onPomodoroDone}
                />
              </Svg>
            </View>
          )}

          <View
            style={styles.centerTap}
            onTouchEnd={onCenterTap}
            pointerEvents="auto"
          />
        </View>
      </View>

      <GestureDetector gesture={panGesture}>
        <View style={styles.hitbox} />
      </GestureDetector>
    </View>
  );
}

const TAP_SIZE = 120;

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: colors.bg },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  layer: { position: 'relative' },
  absFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  centerTap: {
    position: 'absolute',
    width: TAP_SIZE,
    height: TAP_SIZE,
    left: SIZE / 2 - TAP_SIZE / 2,
    top: SIZE / 2 - TAP_SIZE / 2,
    borderRadius: TAP_SIZE / 2,
    backgroundColor: 'transparent',
  },
  hitbox: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: HITBOX_WIDTH,
    backgroundColor: 'transparent',
  },
});
