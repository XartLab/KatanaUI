// SPDX-License-Identifier: MIT
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vite-plus/test'

// 涨跌色不上面积（dataviz.md §2、readability §14；KATANAview #1931 判据，KatanaUI #165）：#1931 这批图表件的样式与源码里，
// --pnl-up / --pnl-down 只许当文字色（CSS 的 color、Tailwind 的 text-(…)）；SVG 里的数字是 <text>，它的字色写在 fill 上，
// 这种选择器列在 TEXT_FILL 里。面、条、点阵纹理、背景一律不许读涨跌色：正负用 div-*，大小用 --k-heat-*，类别用 series-*。
const SRC = fileURLToPath(new URL('../../../', import.meta.url))

/** #1931 表里的件（AttributionBars 取代了 WaterfallChart，Meter 并了 BulletMeter）与它们共用的 chart-kit、SparkTile。 */
const CSS_FILES = [
  'attribution-bars',
  'brush-chart',
  'calendar-heatmap',
  'chart-kit',
  'connected-scatter',
  'equity-curve',
  'event-timeline',
  'horizon-chart',
  'meter',
  'quantile-layers',
  'range-histogram-slider',
  'ridgeline',
  'series-explorer',
  'slope-chart',
  'small-multiples',
  'spark-tile',
  'symbol-galaxy',
  'uptime-bars',
].map((name) => `theme/${name}.css`)

const TSX_FILES = [
  'blocks/attribution-bars/attribution-bars.tsx',
  'blocks/event-timeline/event-timeline.tsx',
  'blocks/meter/meter.tsx',
  'blocks/series-explorer/series-explorer.tsx',
  'blocks/series-explorer/series-explorer-head.tsx',
  'blocks/series-explorer/series-explorer-reconcile.tsx',
  'blocks/series-explorer/series-explorer-table.tsx',
  'blocks/small-multiples.tsx',
  'blocks/symbol-galaxy/symbol-galaxy.tsx',
  'blocks/uptime-bars/uptime-bars.tsx',
  'lib/chart/chart-kit/dot-fill.tsx',
  'lib/chart/chart-kit/end-marker.tsx',
  'lib/chart/chart-kit/lcd-tooltip.tsx',
  'patterns/range-histogram-slider.tsx',
  'quant/brush-chart.tsx',
  'quant/calendar-heatmap.tsx',
  'quant/connected-scatter.tsx',
  'quant/equity-curve.tsx',
  'quant/horizon-chart.tsx',
  'quant/quantile-layers.tsx',
  'quant/ridgeline.tsx',
  'quant/slope-chart.tsx',
]

/** SVG <text> 的字色写在 fill 上：这些选择器画的是数字，不是面。 */
const TEXT_FILL = new Set([
  ".k-slope-item[data-tone='up'] .k-slope-num",
  ".k-slope-item[data-tone='down'] .k-slope-num",
])

const PNL = /--pnl-(?:up|down)\b/

const read = (path: string): string => readFileSync(`${SRC}${path}`, 'utf8')
const stripBlockComments = (text: string): string => text.replace(/\/\*[\s\S]*?\*\//g, '')

/** 一份 CSS 里所有读涨跌色的声明：{ 选择器, 属性 }。只认「选择器 { 声明; … }」这一层（这批文件没有嵌套）。 */
function pnlDeclarations(css: string): { selector: string; property: string }[] {
  const found: { selector: string; property: string }[] = []
  for (const rule of stripBlockComments(css).matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const selector = rule[1]!.trim().replace(/\s+/g, ' ')
    for (const declaration of rule[2]!.split(';')) {
      const colon = declaration.indexOf(':')
      if (colon < 0 || !PNL.test(declaration.slice(colon + 1))) continue
      found.push({ selector, property: declaration.slice(0, colon).trim() })
    }
  }
  return found
}

/** 源码里读涨跌色的地方，去掉注释与 Tailwind 的文字色类 text-(--pnl-…) / text-(color:--pnl-…) 之后还剩的。 */
function pnlOutsideText(source: string): string[] {
  const code = stripBlockComments(source)
    .split('\n')
    .map((line) => line.replace(/\/\/.*$/, ''))
    .join('\n')
    .replace(/text-\((?:color:)?--pnl-(?:up|down)\)/g, '')
  return [...code.matchAll(/.{0,40}--pnl-(?:up|down)\b.{0,20}/g)].map((match) => match[0].trim())
}

describe('涨跌色不上面积（#1931 这批件）', () => {
  it.each(CSS_FILES)('%s：--pnl-* 只给文字色', (path) => {
    const faces = pnlDeclarations(read(path)).filter(
      ({ selector, property }) => property !== 'color' && !(property === 'fill' && TEXT_FILL.has(selector)),
    )
    expect(faces).toEqual([])
  })

  it.each(TSX_FILES)('%s：--pnl-* 不进 fill、background 与纹理色', (path) => {
    expect(pnlOutsideText(read(path))).toEqual([])
  })

  it('守卫认得出违规：回撤纹理读跌色、背景读涨色都会被挑出来', () => {
    expect(
      pnlOutsideText('<DotFill id={id} color="color-mix(in srgb, var(--pnl-down) 60%, transparent)" />'),
    ).toHaveLength(1)
    expect(pnlOutsideText("className={cn('text-(--pnl-up)')} // var(--pnl-down)")).toEqual([])
    expect(
      pnlDeclarations(
        '.a { background-image: radial-gradient(var(--pnl-down) 0 1px, transparent 2px); }\n.b { color: var(--pnl-up); }',
      ),
    ).toEqual([
      { selector: '.a', property: 'background-image' },
      { selector: '.b', property: 'color' },
    ])
  })
})
