// SPDX-License-Identifier: MIT
// 图里的数值文字（precision-instrument §2.2：单位跟在数值后，小一档、次一级墨色，中间一个空格）。
// 格式化回调返回字符串时原样写；返回 { value, unit } 时单位用次一级墨色与小一档字号单独渲染。
import type { ReactNode } from 'react'

export type ChartValueText = string | { value: string; unit: string }

export function ChartValue({ text }: { text: ChartValueText }): ReactNode {
  if (typeof text === 'string') return text
  return (
    <>
      {text.value} <span className="k-ck-unit">{text.unit}</span>
    </>
  )
}
