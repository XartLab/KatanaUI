// SPDX-License-Identifier: MIT
// 组件卡 DotMatrix 里的点阵纹理（pixel.md、dataviz.md §3）：4px 实、2px 空的方点，铺满一个面。EquityCurve 的回撤面用它，不用实色——这是本系统图表的签名。
// 搬自 src/ui（#1860）：样子与行为没改。
// 放进 <svg><defs> 里，用 fill="url(#id)" 引用；同一个页面里每张图的 id 要不同。

export const DOT_SIZE = 4
export const DOT_PITCH = 6

export function DotMatrix({
  id,
  color = 'var(--k-heat-3)',
}: {
  /** Id of the pattern; it must differ for every chart on the same page. */
  id: string
  /** Fill color of the dots. */
  color?: string
}) {
  return (
    <pattern id={id} width={DOT_PITCH} height={DOT_PITCH} patternUnits="userSpaceOnUse">
      <rect className="k-dot-tile" width={DOT_SIZE} height={DOT_SIZE} style={{ fill: color }} />
    </pattern>
  )
}
