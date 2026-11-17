// SPDX-License-Identifier: MIT
// PasswordInput 的眼睛轮廓（纯函数）：睁开程度 0..1 → SVG 路径。
import { clamp } from '../lib/num.ts'

/** Eye outline path: open = 1 is the almond shape, 0 is a flat line (lids closed); out-of-range values are clamped. */
export function eyePath(open: number): string {
  const lift = 8 * clamp(open, 0, 1)
  return `M2 12C6 ${12 - lift} 18 ${12 - lift} 22 12C18 ${12 + lift} 6 ${12 + lift} 2 12Z`
}
