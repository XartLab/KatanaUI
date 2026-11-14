// SPDX-License-Identifier: MIT
// 图旁的数值（Precision Instrument UI §2.2，design/katana-console/project/precision-instrument.md，2026-11-14 读）：
// 等宽、tabular、主墨色；单位比数字小一档、次一级墨色。数值文字由调用方按位格式化，这里不格式化。
export function ChartValue({ text, unit }: { text: string; unit?: string }) {
  return (
    <span className="k-ck-value" data-slot="chart-value">
      <span className="k-ck-value-num">{text}</span>
      {unit === undefined ? null : <span className="k-ck-value-unit">{unit}</span>}
    </span>
  )
}
