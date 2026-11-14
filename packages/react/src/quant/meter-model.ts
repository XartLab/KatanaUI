// SPDX-License-Identifier: MIT
// Meter 的几何与状态（纯函数）：已用在 0 到满刻度上的位置；软限（接近）与硬限（越限）两根刻度的位置；状态。
// 状态按「达到」算：已用 ≥ 软限是 warn，≥ 硬限是 breach（限额板的惯例是碰到线就算，不是越过线才算）。
// 满刻度没传时取已用、软限、硬限里最大的一个，不加余量（余量是个没有出处的数，要的话调用方自己传 max）。

export type MeterState = 'ok' | 'warn' | 'breach'

export type MeterInput = { value: number; max?: number; soft?: number; hard?: number }

export type MeterModel = {
  max: number
  /** 已用、软限、硬限在整条上的位置（0 到 1，越界按边；没给的是 null）。 */
  value: number
  soft: number | null
  hard: number | null
  state: MeterState
}

const share = (x: number, max: number) => (max > 0 && Number.isFinite(x) ? Math.min(1, Math.max(0, x / max)) : 0)

export function meterModel({ value, max, soft, hard }: MeterInput): MeterModel {
  const full = max ?? Math.max(value, soft ?? 0, hard ?? 0)
  const state: MeterState =
    hard !== undefined && value >= hard ? 'breach' : soft !== undefined && value >= soft ? 'warn' : 'ok'
  return {
    max: full,
    value: share(value, full),
    soft: soft === undefined ? null : share(soft, full),
    hard: hard === undefined ? null : share(hard, full),
    state,
  }
}

/** 刻度盘（Gauge）上的指针位置：0 到 100 的读数，两端各留 6px 与 12% 的余地由 CSS 做；这里只夹到 0..1。 */
export const gaugeShare = (value: number, max = 100): number => share(value, max)
