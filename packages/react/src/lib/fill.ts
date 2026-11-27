// SPDX-License-Identifier: MIT
import type { CSSProperties } from 'react'

/**
 * 条长与标记位置：写成自定义属性 --fill（0 到 1），样式用 scale / translate 去画它。
 * 不对 width / height / left / top 做过渡，每帧都不重排（kubai Vibe Design Tips 011，#251 批 B；高频刷新的盘口深度条、行情条最受益）。
 * 数值保留四位小数：条再长，也到不了 1px 的 1/10000。
 */
export function fillVar(ratio: number): CSSProperties {
  return { '--fill': Math.round(ratio * 10000) / 10000 } as CSSProperties
}

/** 带起点的条（零轴两边的净额条）：起点 --from 与长度 --fill 都是 0 到 1，样式用 translate 加 scale 画。 */
export function spanVar(from: number, length: number): CSSProperties {
  return { '--from': Math.round(from * 10000) / 10000, '--fill': Math.round(length * 10000) / 10000 } as CSSProperties
}
