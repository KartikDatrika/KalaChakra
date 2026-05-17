import { colors } from '@/theme/colors';
import type { GunaState } from '@/types';

export function gunaForHour(hour: number): GunaState {
  if (hour >= 2 && hour < 10) return 'sattva';
  if (hour >= 10 && hour < 18) return 'rajas';
  return 'tamas';
}

export function gunaColor(g: GunaState): string {
  if (g === 'sattva') return colors.sattva;
  if (g === 'rajas') return colors.rajas;
  return colors.tamas;
}

export function gunaForDate(d: Date = new Date()): GunaState {
  return gunaForHour(d.getHours());
}
