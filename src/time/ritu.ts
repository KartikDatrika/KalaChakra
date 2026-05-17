export const RITUS = [
  { name: 'Vasanta', months: [2, 3] },
  { name: 'Grishma', months: [4, 5] },
  { name: 'Varsha', months: [6, 7] },
  { name: 'Sharad', months: [8, 9] },
  { name: 'Hemanta', months: [10, 11] },
  { name: 'Shishira', months: [0, 1] },
] as const;

export const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
] as const;

export function rituForMonth(month: number): string {
  const r = RITUS.find((x) => (x.months as readonly number[]).includes(month));
  return r ? r.name : 'Vasanta';
}
