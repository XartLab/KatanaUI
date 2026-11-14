# RegimeStrip

市场状态带：状态模型把历史分成几种状态，画成无缝色带叠在任何时间轴下，配图例；颜色是类别（series-1…7）不是好坏；RegimeBand 只画带。

## Provide

### RegimeStrip

带加图例；RegimeBand 的属性全部适用。分状态收益表不在本件里，由调用方用表格摆在下面。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `title` | `ReactNode` | — | 图例上方的标题行。 |
| `current` | `string` | — | 当前所处状态的 id。 |
| `currentText` | `string` | — | 「当前」的字；给了 current 就要给。 |
| `estimateText` | `string` | `'est.'` | 有估算段时图例末尾的字。 |
| `onPickState` | `(id: string \| null) => void` | — | 给了图例每项就是按钮：点选高亮，再点取消（传 null）。 |

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

- `Enter / Space`：给了 onPickState 时，图例项点选或取消高亮
