// SPDX-License-Identifier: MIT
/**
 * Small number helpers shared across components: clamp, zero-pad, sign, extent and percent.
 * G0（体检 §1）把各件里的同名本地实现收到这里；行为与被替换的本地版逐字一致，有差别的留在原处并写了原因。
 */

/** Limits value to [min, max]; computed as `Math.min(max, Math.max(min, value))`, so when min > max the result is max. */
export const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value))

/** Writes an integer with leading zeros to at least width digits (default 2): `pad(7)` is `07`. */
export const pad = (value: number, width = 2): string => String(value).padStart(width, '0')

/** Prefixes + for positive and - for negative, then writes the absolute value with format (default String); zero gets no sign. */
export const signed = (value: number, format: (abs: number) => string = String): string =>
  (value > 0 ? '+' : value < 0 ? '-' : '') + format(Math.abs(value))

/** Lowest and highest finite value, optionally widened to include 0; `[0, 1]` when there is no finite value. */
export function extent(values: Iterable<number>, includeZero = false): [number, number] {
  let lo = includeZero ? 0 : Infinity
  let hi = includeZero ? 0 : -Infinity
  for (const value of values) {
    if (!Number.isFinite(value)) continue
    if (value < lo) lo = value
    if (value > hi) hi = value
  }
  return lo <= hi ? [lo, hi] : [0, 1]
}

/** Share of total as a CSS percentage string: `pct(1, 4)` is `25%` (no rounding). */
export const pct = (value: number, total: number): string => `${(value / total) * 100}%`
