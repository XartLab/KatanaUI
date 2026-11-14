// SPDX-License-Identifier: MIT
// 子弹图仪表的几何与状态（纯函数）。三段底：0 到软限是正常，软限到硬限是接近，硬限以上是越限；一根条是已用；两根刻度是软限与硬限。
// 状态按「达到」算：已用 ≥ 软限是 warn，≥ 硬限是 breach（限额板的惯例是碰到线就算，不是越过线才算）。
// 满刻度没传时取已用、软限、硬限里最大的一个，不加余量（余量是个没有出处的数，要的话调用方自己传 max）。

export type BulletState = 'ok' | 'warn' | 'breach'

export type BulletInput = { value: number; max?: number; soft?: number; hard?: number }

export type BulletModel = {
  max: number
  /** 已用、软限、硬限在整条上的位置（0 到 1，越界按边；没给的是 null）。 */
  value: number
  soft: number | null
  hard: number | null
  state: BulletState
}

const share = (x: number, max: number) => (max > 0 && Number.isFinite(x) ? Math.min(1, Math.max(0, x / max)) : 0)

export function bulletModel({ value, max, soft, hard }: BulletInput): BulletModel {
  const full = max ?? Math.max(value, soft ?? 0, hard ?? 0)
  const state: BulletState =
    hard !== undefined && value >= hard ? 'breach' : soft !== undefined && value >= soft ? 'warn' : 'ok'
  return {
    max: full,
    value: share(value, full),
    soft: soft === undefined ? null : share(soft, full),
    hard: hard === undefined ? null : share(hard, full),
    state,
  }
}
