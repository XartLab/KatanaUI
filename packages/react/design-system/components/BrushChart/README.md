# BrushChart

一条整段序列的概览条，上面套一个可拖的窗口，主图只画窗口里的那一段：拖中间平移、拖两端缩放、点窗口外的地方把窗口移过去。主图上指针或 ←→ 扫读。可作 EquityCurve 的底座。功能参照 Arc 的 Brush chart。

## Provide

`*` marks a required prop.

### BrushChart

图画在 viewBox 里（竖向就是像素），文字与十字线是叠在上面的 HTML，不用量尺寸。窗口是 [start, end)：含起点、不含终点，单位是点的下标。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `values` | `number[]` | — | 整段序列，从旧到新。主图画窗口里的，概览条画全部。 |
| `label` | `string` | — | 整张图的读屏名（必填，包里没有文案）。 |
| `formatX` | `(index: number) => string` | — | 第几个点写成什么：时间轴刻度、读数、手柄的读屏值都用它。 |
| `formatValue` | `(value: number) => string` | — | 数值写成什么：纵轴刻度与读数。 |
| `labels` | `{ start, end, window }` | — | 三个手柄的读屏名（起点、终点、整个窗口）。 |
| `window / defaultWindow` | `[number, number]` | — | 受控 / 不受控的窗口，默认整段。 |
| `onWindowChange` | `(window: [number, number]) => void` | — | 窗口变了（拖、键盘、点概览条）。 |
| `minSpan` | `number` | `2` | 窗口最少几个点：折线至少两个点才画得出来。 |
| `height / brushHeight` | `number` | `160 / 40` | 主图与概览条的高（px）。 |

### BrushStrip

只有概览条（SeriesExplorer 这类自己画主图的件用它）。属性是 values、window、onWindowChange、formatX、labels、minSpan、height。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `window / onWindowChange` | `[number, number]` | — | 必填：窗口由上层持有。 |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { BrushChart } from '@katana-ui/react/quant'

export function seeded(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** 随机游走：从 start 起 count 个点，每步 ±step 内。 */

export function walk(seed: number, count: number, start = 100, step = 2): number[] {
  const next = seeded(seed)
  const out = [start]
  for (let i = 1; i < count; i++) out.push(+(out[i - 1]! + (next() - 0.5) * 2 * step).toFixed(2))
  return out
}

const DAY = 86_400_000
/** 演示用的日期轴：2026-01-01 起每天一格（UTC）。 */

export const DEMO_START = Date.UTC(2026, 0, 1)

export const dayAt = (index: number) => new Date(DEMO_START + index * DAY).toISOString().slice(0, 10)

export function BrushChartUsage() {
  const values = walk(11, 120, 1000, 18)
  return (
    <>
      <div className="gal-wide" data-gallery-brush style={{ maxWidth: 640 }}>
        <BrushChart
          values={values}
          label="示例权益曲线"
          formatX={dayAt}
          formatValue={(v) => v.toFixed(0)}
          labels={{ start: '窗口起点', end: '窗口终点', window: '窗口位置' }}
          defaultWindow={[60, 120]}
        />
      </div>
    </>
  )
}
```

## States

- 默认：窗口整段（或 defaultWindow），概览条上窗口外变暗。
- 拖动中：窗口换成抓取手形，主图同步变。
- 扫读：主图上出现竖线与点，下面一行写时间与值。
- 窗口到了最小（minSpan）：继续缩小被夹住，不再变。

## Don't

- 不要用它画多条序列：它是单条权益线这类的概览加细看，多条走 SeriesExplorer 或 SmallMultiples。
- 不要在包里写时间格式：用 formatX 传，时区与语言是调用方的事。
- values 里不要夹 NaN 想表示断点：窗口与概览条按下标走，断开会让下标对不上；先补好再传。

## Composition

```
BrushChart
  div[role=group]（主图：svg 折线与面积 · 纵轴刻度 · 十字线与点）
  横轴刻度 · 读数行（aria-live）
  BrushStrip
    svg 概览线
    窗口（slider）· 起点手柄（slider）· 终点手柄（slider）
```

## Keyboard

- `← →`：主图上：扫读前后一格；手柄上：窗口或该端移一点
- `Shift + ← →`：一次三点
- `Home / End`：主图上：第一格 / 最后一格；手柄上：窗口或该端到头尾
- `Esc`：主图上：清掉选中
