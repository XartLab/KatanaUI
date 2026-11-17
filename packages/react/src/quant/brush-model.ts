// SPDX-License-Identifier: MIT
// 刷选窗口的几何（纯函数）。窗口是 [start, end)：start 含、end 不含，按点的下标，单位是「第几个点」，不是像素。
// 夹取规则：窗口不出 [0, count]，长度不小于 minSpan（点数不够时取 count）；缩放时另一端不动；整体平移时长度不变，碰到边就停在边上。

import { clamp } from '../lib/num.ts'

export type BrushWindow = readonly [start: number, end: number]

/** 一条折线至少要两个点才画得出来，所以默认最小窗口是 2 点。 */
export const BRUSH_MIN_SPAN = 2

export function clampWindow(window: BrushWindow, count: number, minSpan = BRUSH_MIN_SPAN): BrushWindow {
  if (count <= 0) return [0, 0]
  const span = clamp(Math.round(minSpan), 1, count)
  let start = Math.round(window[0])
  let end = Math.round(window[1])
  if (end - start < span) end = start + span
  if (end > count) {
    end = count
    start = Math.min(start, count - span)
  }
  start = Math.max(0, start)
  if (end - start < span) end = start + span
  return [start, Math.min(count, end)]
}

/** 整体平移 delta 个点，长度不变。 */
export function moveWindow(window: BrushWindow, delta: number, count: number): BrushWindow {
  const length = window[1] - window[0]
  const start = clamp(Math.round(window[0] + delta), 0, count - length)
  return [start, start + length]
}

/** 拖一端到 to（点下标；end 端 to 是「含这个点」，所以内部加 1）。另一端不动，不让两端越过最小窗口。 */
export function resizeWindow(
  window: BrushWindow,
  edge: 'start' | 'end',
  to: number,
  count: number,
  minSpan = BRUSH_MIN_SPAN,
): BrushWindow {
  const span = Math.min(count, minSpan)
  if (edge === 'start') return [clamp(Math.round(to), 0, window[1] - span), window[1]]
  // end 端先夹上界再保最小窗口（max 在外），与 clamp 的先后相反，留本地写法。
  return [window[0], Math.max(Math.min(count, Math.round(to) + 1), window[0] + span)]
}

/** 以点 center 为中心重放窗口（点概览条上窗口外的地方），长度不变。 */
export function centerWindow(window: BrushWindow, center: number, count: number): BrushWindow {
  const length = window[1] - window[0]
  return moveWindow(window, Math.round(center - length / 2) - window[0], count)
}

/** 概览条上的横向位置（0 到 1）换成点下标。 */
export const brushIndexAt = (ratio: number, count: number): number =>
  clamp(Math.round(ratio * (count - 1)), 0, count - 1)
