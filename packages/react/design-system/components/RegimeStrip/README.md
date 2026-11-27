# RegimeStrip

市场状态带：状态模型把历史分成几种状态，画成无缝色带叠在任何时间轴下，配图例；颜色是类别（series-1…7）不是好坏；RegimeBand 只画带。

## Provide

`*` marks a required prop.

### RegimeStrip

带加图例；RegimeBand 的属性全部适用。分状态收益表不在本件里，由调用方用表格摆在下面。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `title` | `ReactNode` | — | 图例上方的标题行。 |
| `current` | `string` | — | 当前所处状态的 id。 |
| `labels` | `{ current?, estimate? }` | — | 「当前」的字（给了 current 就要给）、有估算段时图例末尾的字（默认 'est.'）；旧名 currentText / estimateText 留一个版本。 |
| `onSelect` | `(state: RegimeState \| null) => void` | — | 给了图例每项就是按钮：点选高亮，再点同一项取消（传 null）；旧名 onPickState（给 id）留一个版本。 |

### RegimeBand

只画带。宽度与时间的对应由调用方传 scale，把它放在跟上面时间轴同宽的容器里。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `segments` | `readonly { from, to, state, estimated? }[]` | — | 状态段；时间单位由调用方定，跟 scale 一致。 |
| `states` | `readonly { id, name, color, detail? }[]` | — | color 是 1 到 7（series-N）；≤ 6 态，挑色距大的（1、2、4、7）。 |
| `scale` | `(time: number) => number` | — | 时间到 0–1 的位置；不给就在最早与最晚之间线性排。 |
| `activeState` | `string \| null` | — | 高亮某状态，其余变淡到 25%。 |
| `describe` | `(segment, state) => string` | — | 每段的悬停与读屏文字；不给只写状态名。 |
| `label` | `string` | — | 整条带的读屏名。 |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { useState } from 'react'
import { RegimeBand, RegimeStrip, type RegimeSegment, type RegimeState } from '@katana-ui/react/blocks'

const regimeStates: readonly RegimeState[] = [
  { id: 'trend', name: '趋势上', color: 1, detail: '47%' },
  { id: 'range', name: '震荡', color: 2, detail: '38%' },
  { id: 'vol', name: '高波下行', color: 4, detail: '11%' },
  { id: 'crisis', name: '危机', color: 7, detail: '4%' },
]

const regimeSegments: readonly RegimeSegment[] = [
  { from: 0, to: 12, state: 'trend' },
  { from: 12, to: 20, state: 'range' },
  { from: 20, to: 26, state: 'vol' },
  { from: 26, to: 40, state: 'trend' },
  { from: 40, to: 50, state: 'range' },
  { from: 50, to: 54, state: 'crisis' },
  { from: 54, to: 66, state: 'range' },
  { from: 66, to: 71, state: 'vol' },
  { from: 71, to: 80, state: 'trend' },
  { from: 80, to: 88, state: 'range' },
  { from: 88, to: 100, state: 'trend', estimated: true },
]

export function RegimeStripUsage() {
  const [active, setActive] = useState<string | null>(null)
  return (
    <>
      <div style={{ width: 620 }} data-testid="regime-strip">
        <RegimeStrip
          title="RUN 3d07 · HMM 4 态 · 月频"
          segments={regimeSegments}
          states={regimeStates}
          label="市场状态带：2019 到 2026，四种状态"
          describe={(segment, state) =>
            `${state.name} · ${segment.from}–${segment.to}${segment.estimated ? '（估）' : ''}`
          }
          current="trend"
          labels={{ current: '当前', estimate: '估（尚未确认）' }}
          activeState={active}
          onSelect={(state) => setActive(state?.id ?? null)}
        />
      </div>

      <div style={{ width: 620 }}>
        <RegimeBand segments={regimeSegments} states={regimeStates} label="只有带" />
      </div>
    </>
  )
}
```

## States

- 平常：14px 无缝色带，图例里每个状态一个色块加名字。
- 高亮：选中的状态保持，其余变淡。
- 估算段（样本外最后一段常见）：带上叠斜纹，图例末尾写估算字。
- 当前状态：图例里它后面写「当前」。

## Don't

- 不要用涨跌色或 signal 色：危机也是 series 色，颜色是类别不是好坏。
- 不要超过 6 个状态。
- 不要只靠颜色认状态，图例里一定有名字。

## Composition

```
RegimeStrip
  RegimeBand
  图例（色块 + 名字 + 小字）
```

## Keyboard

- `Enter / Space`：给了 onSelect 时，图例项点选或取消高亮
