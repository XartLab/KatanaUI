// SPDX-License-Identifier: MIT
// 改自 SmoothUI ai-prompt-input（https://github.com/educlopez/smoothui ，MIT，© 2024 Eduardo Calvo）
// 输入框的纯逻辑：附件大小的写法、回车是否该发送。

const KILOBYTE = 1024
const MEGABYTE = KILOBYTE * KILOBYTE

/** 附件大小：842 B、12 KB、1.4 MB。纯数字加单位字母，不带中文。 */
export function formatBytes(bytes: number): string {
  if (bytes < KILOBYTE) return `${bytes} B`
  if (bytes < MEGABYTE) return `${Math.round(bytes / KILOBYTE)} KB`
  return `${(bytes / MEGABYTE).toFixed(1)} MB`
}

/** 字数到了上限的多少时才显示计数（原件 80%）。 */
export const COUNTER_VISIBLE_RATIO = 0.8

/**
 * 这次按键该不该发送：回车发送，Shift+回车换行。
 * 中文输入法选词时的回车是「确认候选」，不是发送：composing 或 keyCode 229 时一律不发（原件没处理这个，中文用户会把没打完的拼音发出去）。
 */
export function shouldSubmit(event: {
  key: string
  shiftKey: boolean
  isComposing: boolean
  keyCode?: number
}): boolean {
  if (event.key !== 'Enter' || event.shiftKey) return false
  return !(event.isComposing || event.keyCode === 229)
}
