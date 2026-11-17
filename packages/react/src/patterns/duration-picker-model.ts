// SPDX-License-Identifier: MIT
// DurationPicker 的输入规则（纯函数）：框里的字与数互转、超上限夹住。

/** Text in an hours / minutes box → number: digits only, empty is 0, above max is clamped (overflow marks the shake).
 * 输入框里的字 → 数：只认数字，空当 0，超出范围夹进 0 到 max；overflow 为真表示被夹了（要抖一下）。 */
export function parseField(text: string, max: number): { value: number; overflow: boolean } {
  const digits = text.replace(/\D/g, '')
  if (digits === '') return { value: 0, overflow: false }
  const raw = Number(digits)
  return raw > max ? { value: max, overflow: true } : { value: raw, overflow: false }
}

/** Number → text in the box: 0 shows as empty while editing (the placeholder draws 0).
 * 数 → 输入框里的字：0 在编辑时显示成空（占位符画 0），其它写数字。 */
export function fieldText(value: number): string {
  return value === 0 ? '' : String(value)
}
