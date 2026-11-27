// SPDX-License-Identifier: MIT
/**
 * Price-change direction shared by quote, change and calendar components.
 * 涨跌三态的唯一定义（G0，体检 §1：quant/format 的 Tone、katana 的 QuoteTone、event-calendar 的 EconomicTone 取值相同，合一放这里）。
 * 颜色走 characteristics 的 --k-tone-*（跟着主题与 data-updown 换红绿）；方向怎么从数里取由各自的函数定（toneOf 先舍入，quoteTone 不舍入）。
 */

/** Direction of a change: up, down or flat (zero, missing or not finite). */
export type Tone = 'up' | 'down' | 'flat'

/** All tones in display order. */
export const TONES: readonly Tone[] = ['up', 'down', 'flat']

const TONE_COLOR: Record<Tone, string> = {
  up: 'var(--k-tone-up-foreground)',
  down: 'var(--k-tone-down-foreground)',
  flat: 'var(--k-tone-flat-foreground)',
}

/** CSS color of a tone's text and glyph, as a characteristics variable (`var(--k-tone-up-foreground)`). */
export const toneColor = (tone: Tone): string => TONE_COLOR[tone]
