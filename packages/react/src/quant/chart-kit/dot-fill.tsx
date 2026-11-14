// SPDX-License-Identifier: MIT
// 点阵纹理填充（dataviz.md §3：面用点阵纹理，4px 实 2px 空，不用实色透明；本系统图表的签名）。放进 <svg><defs> 里，用 fill="url(#id)" 引用。
// 纹理的样子读 CSS 变量（--chart-fill-dot / --chart-fill-hatch，见 theme/chart-kit.css）：默认点阵，换成斜线排线只改变量，件里不写死。
// 同一页里每个图的 id 要不同：用 useDotId() 取。HTML 里的条（Meter 的填充）用 theme/chart-kit.css 的 .k-dotfill，同一个节奏。
import { useId } from 'react'

/** 调用方只传语义，不传颜色（Meter 卡：「调用方不传颜色，只传 tone」）。 */
export type ChartTone = 'ink' | 'accent' | 'ok' | 'warn' | 'off' | 'orange-dim'

const TONES: Record<ChartTone, string> = {
  ink: 'var(--ink-200)',
  accent: 'var(--signal-orange)',
  ok: 'var(--signal-green)',
  warn: 'var(--signal-amber)',
  off: 'var(--line-200)',
  'orange-dim': 'var(--signal-orange-dim)',
}

export const toneColor = (tone: ChartTone): string => TONES[tone]

/** pattern 的 id：useId 里有冒号，换成下划线，免得 url(#…) 解析出错。 */
export const useDotId = (name: string): string => `${name}-${useId().replaceAll(':', '_')}`

const PITCH = 6

export function DotFill({ id, color }: { id: string; color: string }) {
  return (
    <pattern id={id} width={PITCH} height={PITCH} patternUnits="userSpaceOnUse">
      <rect className="k-fill-dot" width={4} height={4} style={{ fill: color }} />
      <path className="k-fill-hatch" d={`M0,${PITCH} L${PITCH},0`} style={{ stroke: color }} />
    </pattern>
  )
}
