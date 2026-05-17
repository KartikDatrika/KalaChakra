import Animated from 'react-native-reanimated';
import { Circle, G, Path, Rect } from 'react-native-svg';

export const AnimatedG = Animated.createAnimatedComponent(G);
export const AnimatedPath = Animated.createAnimatedComponent(Path);
export const AnimatedCircle = Animated.createAnimatedComponent(Circle);
export const AnimatedRect = Animated.createAnimatedComponent(Rect);
