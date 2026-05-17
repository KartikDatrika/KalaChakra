import { useMemo } from 'react';
import { Dimensions } from 'react-native';
import { Gesture } from 'react-native-gesture-handler';
import {
  runOnJS,
  useSharedValue,
  withSpring,
  type SharedValue,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

export const MAX_LEVEL = 4;
export const HITBOX_WIDTH = 60;

function clamp(v: number, lo: number, hi: number): number {
  'worklet';
  return Math.min(hi, Math.max(lo, v));
}

function bump(): void {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
}

export interface OrbitSlider {
  orbitLevel: SharedValue<number>;
  panGesture: ReturnType<typeof Gesture.Pan>;
}

export function useOrbitSlider(): OrbitSlider {
  const orbitLevel = useSharedValue(0);
  const start = useSharedValue(0);
  const screenH = Dimensions.get('window').height;

  const panGesture = useMemo(() => {
    return Gesture.Pan()
      .activeOffsetY([-4, 4])
      .onStart(() => {
        start.value = orbitLevel.value;
      })
      .onUpdate((e) => {
        const delta = (-e.translationY / screenH) * MAX_LEVEL * 2;
        orbitLevel.value = clamp(start.value + delta, 0, MAX_LEVEL);
      })
      .onEnd(() => {
        const target = Math.round(orbitLevel.value);
        orbitLevel.value = withSpring(target, { damping: 18, stiffness: 180 });
        runOnJS(bump)();
      });
  }, [orbitLevel, start, screenH]);

  return { orbitLevel, panGesture };
}
