/**
 * Kala Chakra — unified timeline math.
 *
 * The single source of truth for the dial. Time, degrees, and rta are
 * perfectly proportional on one circle:
 *
 *     24 hours = 360 degrees = 108 rta
 *     1 hour   = 15 degrees  = 4.5 rta
 *
 * Orientation: the sleep window (22:00 → 06:00) is centred on the BOTTOM of
 * the dial. Its midpoint (02:00) sits at the 6-o'clock position, so the full
 * 8-hour sleep block lives entirely in the lower hemisphere. The SVG helpers
 * in ui/geometry.ts treat deg 0 as the top of the circle, so we offset by
 * (180 - 2h*15) = 150° — see SVG_ROTATE_DEG and hoursToSvgDeg().
 *
 * This module is intentionally pure (no React, no SVG, no native deps) so it
 * can be unit-tested in plain Node.
 */

export type ActivePhase = 'plan' | 'implement' | 'verify' | 'relax';
export type DialMode = ActivePhase | 'sleep';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const HOURS_PER_DAY = 24;
export const DEGREES_PER_DAY = 360;
export const RTA_PER_DAY = 108;

export const DEGREES_PER_HOUR = DEGREES_PER_DAY / HOURS_PER_DAY; // 15
export const RTA_PER_HOUR = RTA_PER_DAY / HOURS_PER_DAY; // 4.5

/** One ultradian cycle is 120 minutes; 12 cycles fill a 24h day. */
export const CYCLE_MINUTES = 120;
export const CYCLES_PER_DAY = (HOURS_PER_DAY * 60) / CYCLE_MINUTES; // 12

/** Sleep window: 22:00 → 06:00 (4 ultradian cycles / 8 hours). */
export const SLEEP_START_HOUR = 22;
export const SLEEP_END_HOUR = 6;

/** Relax sub-phase length, in seconds — drives the autonomous needle sweep. */
export const RELAX_SECONDS = 30 * 60; // 1800

/**
 * Sub-phase boundaries inside one 120-minute cycle, expressed as minute
 * offsets from the start of the cycle:
 *   Plan      0    – 22.5   (Ascent,  ~22.5 min)
 *   Implement 22.5 – 67.5   (Peak,    ~45   min)
 *   Verify    67.5 – 90     (Descent, ~22.5 min)
 *   Relax     90   – 120    (Rest,    ~30   min)
 */
export const PHASE_BOUNDS = {
  planEnd: 22.5,
  implementEnd: 67.5,
  verifyEnd: 90,
  relaxEnd: 120,
} as const;

// ---------------------------------------------------------------------------
// Conversions
// ---------------------------------------------------------------------------

/** Decimal hours since midnight, e.g. 13:30 -> 13.5. */
export function hoursDecimal(d: Date): number {
  return d.getHours() + d.getMinutes() / 60 + d.getSeconds() / 3600;
}

export function hoursToRta(h: number): number {
  return h * RTA_PER_HOUR;
}

export function hoursToDeg(h: number): number {
  return h * DEGREES_PER_HOUR;
}

/**
 * Rotation offset applied to every clock-derived SVG angle. Chosen so that
 * the sleep window 22:00→06:00 is centred on the bottom of the dial: its
 * midpoint (02:00) maps to 180° (6-o'clock). 180 - 2*15 = 150.
 */
export const SVG_ROTATE_DEG = 150;

/**
 * Convert decimal hours to the SVG angle used by ui/geometry.ts (where 0deg
 * is the top of the circle). 02:00 -> 180 (bottom), 14:00 -> 0 (top).
 */
export function hoursToSvgDeg(h: number): number {
  return (SVG_ROTATE_DEG + hoursToDeg(h)) % 360;
}

/** Same orientation transform, but for an arbitrary rta value (0..108). */
export function rtaToSvgDeg(rta: number): number {
  return (SVG_ROTATE_DEG + (rta / RTA_PER_DAY) * 360) % 360;
}

// ---------------------------------------------------------------------------
// Phase logic
// ---------------------------------------------------------------------------

/** True during the 22:00 → 06:00 sleep window. */
export function isSleep(d: Date): boolean {
  const h = d.getHours();
  return h >= SLEEP_START_HOUR || h < SLEEP_END_HOUR;
}

/** Minute offset (0..120) into the current ultradian cycle. */
export function cycleOffsetMinutes(d: Date): number {
  const totalMinutes = d.getHours() * 60 + d.getMinutes() + d.getSeconds() / 60;
  return totalMinutes % CYCLE_MINUTES;
}

/** Resolve the active sub-phase from a minute offset within a cycle. */
export function phaseForOffset(offset: number): ActivePhase {
  if (offset < PHASE_BOUNDS.planEnd) return 'plan';
  if (offset < PHASE_BOUNDS.implementEnd) return 'implement';
  if (offset < PHASE_BOUNDS.verifyEnd) return 'verify';
  return 'relax';
}

/** The current dial mode, accounting for the sleep window. */
export function modeForDate(d: Date): DialMode {
  if (isSleep(d)) return 'sleep';
  return phaseForOffset(cycleOffsetMinutes(d));
}

/**
 * Seconds elapsed into the current Relax sub-phase (0..1800). Only meaningful
 * when modeForDate(d) === 'relax'; returns 0 otherwise.
 */
export function relaxElapsedSeconds(d: Date): number {
  if (modeForDate(d) !== 'relax') return 0;
  const offsetMin = cycleOffsetMinutes(d) - PHASE_BOUNDS.verifyEnd; // minutes into relax
  return offsetMin * 60;
}

// ---------------------------------------------------------------------------
// Presentation helpers
// ---------------------------------------------------------------------------

export const MODE_LABEL: Record<DialMode, string> = {
  plan: 'PLAN',
  implement: 'IMPLEMENT',
  verify: 'VERIFY',
  relax: 'RELAX',
  sleep: 'SLEEP',
};

/**
 * Needle colours, matched to the reference screenshots:
 *   Plan      soft red / coral   (ascent)
 *   Implement blue               (peak)
 *   Verify    lighter sky-blue   (descent)
 *   Relax     near-black         (rest — visually detaches to inner ring)
 *   Sleep     background-matched (needle effectively invisible)
 */
export const NEEDLE_COLOR: Record<DialMode, string> = {
  plan: '#FF5A5F',
  implement: '#3B82F6',
  verify: '#7FB2FF',
  relax: '#141414',
  sleep: '#0F0F0F',
};

export function pad2(n: number): string {
  return Math.floor(n).toString().padStart(2, '0');
}

export function formatClock(d: Date): string {
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;
}

export function formatRta(d: Date): string {
  return hoursToRta(hoursDecimal(d)).toFixed(1);
}
