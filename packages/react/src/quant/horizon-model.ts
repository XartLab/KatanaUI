// SPDX-License-Identifier: MIT
// 地平线图（horizon chart）的分带（纯函数）：把一列带正负的数折成几条叠起来的窄带。
// 满刻度 max 平分成 bands 份，每份 unit = max / bands；第 k 条带（从 0 数）装 |值| 落在 [k * unit, (k + 1) * unit) 里的那一截，高度占整行的 0 到 1，
// 超过 max 的按满高画（上限夹住，不外溢）。正的和负的各一套，画在同一条基线上、靠颜色区分。非有限数当 0。
// 带数默认 3：Heer、Kong、Agrawala《Sizing the Horizon》（CHI 2009）实验里比较了 2 到 4 带；具体哪一档最好，我们没读到原文，写「待核对」，所以带数留成属性。

export const HORIZON_BANDS = 3

export type HorizonBandHeights = {
  /** positive[k][i]：第 k 条带在第 i 个点上的高度（0 到 1）。 */
  positive: number[][]
  negative: number[][]
}

export function horizonBands(values: readonly number[], max: number, bands = HORIZON_BANDS): HorizonBandHeights {
  const unit = max > 0 ? max / bands : 0
  const make = (sign: 1 | -1) =>
    Array.from({ length: bands }, (_, k) =>
      values.map((value) => {
        if (!Number.isFinite(value) || unit === 0 || value * sign <= 0) return 0
        return Math.min(1, Math.max(0, (value * sign - k * unit) / unit))
      }),
    )
  return { positive: make(1), negative: make(-1) }
}

/** 一批行共用的满刻度：所有行 |值| 的最大值。 */
export function horizonMax(rows: readonly (readonly number[])[]): number {
  let max = 0
  for (const row of rows) for (const value of row) if (Number.isFinite(value)) max = Math.max(max, Math.abs(value))
  return max
}
