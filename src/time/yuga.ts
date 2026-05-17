import { colors } from '@/theme/colors';

export const YUGAS = [
  { name: 'Kali', ratio: 1, color: colors.yuga.kali },
  { name: 'Dvapara', ratio: 2, color: colors.yuga.dvapara },
  { name: 'Treta', ratio: 3, color: colors.yuga.treta },
  { name: 'Satya', ratio: 4, color: colors.yuga.satya },
] as const;

export const YUGA_TOTAL = YUGAS.reduce((s, y) => s + y.ratio, 0);
