// SPDX-License-Identifier: MIT
import { useState } from 'react'
import { Slider, fontFor, measureText, truncateText, wrapText } from '../../src/index'

const NOTE = '美联储议息前，美元流动性收紧，成长股估值承压；先看两年期美债收益率与 BTC 资金费率是否同步走高。'

// SVG 里没有自动换行和省略号：用 pretext 量好再画。拖滑块改宽度，只重跑排版，不碰 DOM 量尺寸。
export function TextMeasureUsage() {
  const [width, setWidth] = useState(260)
  const font = fontFor(400, 12, '--font-sans')
  const { lines, height } = wrapText(NOTE, font, width - 16, 18, 3)
  const label = truncateText('MarketHeatmap 市场热力图（跨市场共用）', fontFor(600, 12, '--font-sans'), width - 16)
  return (
    <div style={{ display: 'grid', gap: 12, width: 420 }}>
      <Slider
        value={[width]}
        min={120}
        max={400}
        step={10}
        onValueChange={(v) => setWidth(v[0] ?? 260)}
        thumbLabels={['宽度']}
      />
      <svg width={width} height={height + 52} role="img" aria-label={NOTE}>
        <rect
          x={0.5}
          y={0.5}
          width={width - 1}
          height={height + 51}
          rx={6}
          fill="var(--bg-300)"
          stroke="var(--line-200)"
        />
        <text x={8} y={20} fill="var(--ink-100)" style={{ font: '600 12px var(--font-sans)' }}>
          {label}
        </text>
        {lines.map((line, i) => (
          <text key={i} x={8} y={42 + i * 18} fill="var(--ink-200)" style={{ font: '400 12px var(--font-sans)' }}>
            {line.text}
          </text>
        ))}
      </svg>
      <small style={{ color: 'var(--ink-300)' }}>
        宽 {width}px · {lines.length} 行 · 标题实宽 {Math.round(measureText(label, fontFor(600, 12, '--font-sans')))}px
      </small>
    </div>
  )
}
