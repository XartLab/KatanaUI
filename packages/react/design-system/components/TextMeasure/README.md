# TextMeasure

不碰 DOM 量文字：一行多宽、放不放得下、放不下截尾加省略号、按宽度折成几行、一段字多高。包一层 @chenglou/pretext（MIT）：同一段字同一字体只准备一次，宽度变了只重算排版。给 SVG / canvas 里的字（没有自动换行与省略号）、按字宽决定写不写字的格子、按内容定列宽、虚拟列表预先定行高用。字体按 CSS 变量解析成具名字体（去掉 -apple-system 这类量不准的系统别名）；Web 字体加载完、缩放、换字体时自动清缓存；没有 canvas 的环境退回估宽。

## Provide

`*` marks a required prop.

### measureText

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `measureText(text, font)` | `number` | — | 一行字的宽度（像素，像 max-content）。 |
| `fitsWidth(text, font, maxWidth)` | `boolean` | — | 放不放得下，留 2px 余量。 |
| `truncateText(text, font, maxWidth, ellipsis?)` | `string` | — | 放不下就按字素截尾加省略号。 |
| `wrapText(text, font, maxWidth, lineHeight, maxLines?)` | `{ lines, height }` | — | 折成多行；超过 maxLines 的折进最后一行加省略号。 |
| `textHeight(text, font, maxWidth, lineHeight)` | `number` | — | 一段字的高度，给虚拟列表。 |
| `fontFor(weight, sizePx, familyVar?, element?)` | `string` | — | 拼 canvas 字体串：读 CSS 字体变量（默认 --font-sans），去掉系统别名。 |
| `resetTextMeasure()` | `void` | — | 手动清缓存（字体变了而自动监听没覆盖到时）。 |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { useState } from 'react'
import { Slider, fontFor, measureText, truncateText, wrapText } from '@katana-ui/react'

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
```

## States

- 有 canvas：pretext 实测
- 没有 canvas（单测、服务端渲染）：按全角 1em、半角 0.6em 估

## Don't

- 不要在每次渲染里 prepare 新文本又丢掉：同一段字会缓存，别拼随机串
- 能用 CSS 的 text-overflow 解决的 HTML 文字不用它

## Composition

```
measureText / fitsWidth / truncateText / wrapText / textHeight
  fontFor（字体串）
  @chenglou/pretext（prepare → layout）
```
