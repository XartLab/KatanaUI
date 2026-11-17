// SPDX-License-Identifier: MIT
// 不碰 DOM 量文字（2026-11-17，用户：「pretext 我们的利用率太低了」）：包一层 @chenglou/pretext（MIT，chenglou/pretext）。
// 用途：画在 SVG / canvas 里的字（没有自动换行与省略号）、按字宽决定放不放得下（热力格、关系图的标签）、表格按内容定列宽、预先算文字高度给虚拟列表。
// 规矩：
// - prepare 贵、layout 便宜：同一段字同一个字体只 prepare 一次（这里按「字体 + 文本」缓存），宽度变了只重跑 layout。
// - 字体要用具名字体：pretext 说明里写 system-ui / -apple-system 在 macOS 上量不准，所以先按 CSS 变量解析出具名字体再交给它；
//   解析不出具名字体（比如 macOS 默认 SF）时仍然量，但结果按「估计」用：放不放得下的判断多留 2px 余量。
// - Web 字体加载完、设备像素比变了都要清缓存（pretext 的 clearCache），这里自动挂好。
// - 没有 canvas 的环境（单测、SSR）退回按字符估宽，不抛错。

import {
  clearCache,
  layout,
  layoutWithLines,
  measureNaturalWidth,
  prepare,
  prepareWithSegments,
} from '@chenglou/pretext'

type Prepared = ReturnType<typeof prepare>
type PreparedSegments = ReturnType<typeof prepareWithSegments>

const canMeasure = () => typeof OffscreenCanvas !== 'undefined' || typeof document !== 'undefined'

const plain = new Map<string, Prepared>()
const segmented = new Map<string, PreparedSegments>()
const LIMIT = 4000
const remember = <T>(map: Map<string, T>, key: string, make: () => T): T => {
  const hit = map.get(key)
  if (hit) return hit
  const value = make()
  if (map.size >= LIMIT) map.delete(map.keys().next().value!)
  map.set(key, value)
  return value
}

/** 字体变了（Web 字体加载完、换了渲染设置的字体、缩放改了 DPR）时清掉所有缓存。 */
export function resetTextMeasure() {
  plain.clear()
  segmented.clear()
  try {
    clearCache()
  } catch {
    // 没有 canvas 的环境里 pretext 也可能没初始化，忽略。
  }
}

if (typeof window !== 'undefined') {
  document.fonts?.addEventListener?.('loadingdone', resetTextMeasure)
  let ratio = window.devicePixelRatio
  window.matchMedia?.(`(resolution: ${ratio}dppx)`)?.addEventListener?.('change', () => {
    ratio = window.devicePixelRatio
    resetTextMeasure()
  })
  // 渲染设置换字体（根节点 data-font-* / 字体变量）也要清。
  new MutationObserver(resetTextMeasure).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['style', 'data-font-ui', 'data-font-num', 'data-font-cjk', 'data-font-mono'],
  })
}

/** 没 canvas 时的估宽：全角 1em，其余 0.6em。 */
function estimate(text: string, sizePx: number) {
  let width = 0
  for (const char of text) width += char.charCodeAt(0) > 0x2e7f ? sizePx : sizePx * 0.6
  return width
}
const sizeOf = (font: string) => Number(/(\d+(?:\.\d+)?)px/.exec(font)?.[1] ?? 12)

/**
 * 把一个 CSS 字体变量（如 --font-num）与字号字重拼成 canvas 认的 font 串，去掉 pretext 量不准的系统别名
 * （-apple-system、BlinkMacSystemFont、system-ui），留下第一个具名字体起的栈。
 */
export function fontFor(weight: number, sizePx: number, familyVar = '--font-sans', element?: Element): string {
  let family = 'sans-serif'
  if (typeof document !== 'undefined') {
    const from = element ?? document.documentElement
    const raw = getComputedStyle(from).getPropertyValue(familyVar).trim()
    if (raw) {
      const named = raw
        .split(',')
        .map((part) => part.trim())
        .filter((part) => !/^(-apple-system|BlinkMacSystemFont|system-ui|ui-sans-serif)$/i.test(part))
      if (named.length) family = named.join(', ')
    }
  }
  return `${weight} ${sizePx}px ${family}`
}

/** 一行字的宽度（像素，像 CSS max-content）。 */
export function measureText(text: string, font: string): number {
  if (!text) return 0
  if (!canMeasure()) return estimate(text, sizeOf(font))
  try {
    return measureNaturalWidth(remember(segmented, `${font}\u0000${text}`, () => prepareWithSegments(text, font)))
  } catch {
    return estimate(text, sizeOf(font))
  }
}

/** 放不放得下：留 2px 余量（系统字体量出来的是估计值）。 */
export const fitsWidth = (text: string, font: string, maxWidth: number) => measureText(text, font) <= maxWidth - 2

/** 放不下就从尾巴截、加省略号（单行，给 SVG / canvas 用）。按字素截，不会截断表情或组合字。 */
export function truncateText(text: string, font: string, maxWidth: number, ellipsis = '…'): string {
  if (fitsWidth(text, font, maxWidth)) return text
  const chars = Array.from(new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(text), (s) => s.segment)
  let low = 0
  let high = chars.length
  while (low < high) {
    const mid = Math.ceil((low + high) / 2)
    if (fitsWidth(chars.slice(0, mid).join('') + ellipsis, font, maxWidth)) low = mid
    else high = mid - 1
  }
  return low === 0 ? '' : chars.slice(0, low).join('') + ellipsis
}

/** 多行折行（给 SVG 的 <tspan> 或 canvas 逐行画）：返回每行文字与宽度；maxLines 之后的折进最后一行并加省略号。 */
export function wrapText(
  text: string,
  font: string,
  maxWidth: number,
  lineHeight: number,
  maxLines = Infinity,
): { lines: { text: string; width: number }[]; height: number } {
  if (!text) return { lines: [], height: 0 }
  let lines: { text: string; width: number }[]
  if (!canMeasure()) {
    lines = [{ text, width: estimate(text, sizeOf(font)) }]
  } else {
    try {
      const prepared = remember(segmented, `${font}\u0000${text}`, () => prepareWithSegments(text, font))
      lines = layoutWithLines(prepared, maxWidth, lineHeight).lines.map((line) => ({
        text: line.text,
        width: line.width,
      }))
    } catch {
      lines = [{ text, width: estimate(text, sizeOf(font)) }]
    }
  }
  if (lines.length > maxLines) {
    const rest = lines
      .slice(maxLines - 1)
      .map((line) => line.text)
      .join('')
    const last = truncateText(rest, font, maxWidth)
    lines = [...lines.slice(0, maxLines - 1), { text: last, width: measureText(last, font) }]
  }
  return { lines, height: lines.length * lineHeight }
}

/** 一段字在给定宽度下的高度（给虚拟列表预先定行高，不用渲染出来量）。 */
export function textHeight(text: string, font: string, maxWidth: number, lineHeight: number): number {
  if (!text) return 0
  if (!canMeasure()) return Math.max(1, Math.ceil(estimate(text, sizeOf(font)) / Math.max(1, maxWidth))) * lineHeight
  try {
    return layout(
      remember(plain, `${font}\u0000${text}`, () => prepare(text, font)),
      maxWidth,
      lineHeight,
    ).height
  } catch {
    return lineHeight
  }
}
