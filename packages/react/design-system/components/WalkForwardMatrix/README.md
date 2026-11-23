# WalkForwardMatrix

步进（Walk-Forward）优化的窗口表：每个窗口一行——样本内与样本外区间、这个窗口里选中的参数、样本外收益、通过与否，行首一条共用时间轴的小条（灰是样本内、亮而高是样本外），锚定模式样本内条都从同一处起，滚动模式整条后移。底部汇总通过窗口、样本外盈利占比、样本内与样本外年化与步进效率（样本外年化 ÷ 样本内年化；年化取各窗口的平均，不把重叠的样本内区间复利）。锚定与滚动各一套窗口由调用方给，件里切换；「通过」的判据是调用方的策略。新做。

## Provide

`*` marks a required prop.

### WalkForwardMatrix

件只汇总调用方给的每窗口结果，不切窗口、不优化。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `modes` | `{ rolling?: WalkForwardWindow[]; anchored?: WalkForwardWindow[] }` | — | 两种模式的窗口集；只给一种就不显示切换。窗口：{ id, inStart, inEnd, outStart, outEnd, params, inReturn, outReturn, passed }。 |
| `mode / onModeChange` | `'rolling' \| 'anchored'` | — | 当前模式；不给用内部状态（有锚定先显示锚定）。 |
| `formatDate / formatPercent / formatRatio` | `function` | — | 区间端点、收益、占比与效率的写法。 |
| `labels` | `WalkForwardMatrixLabels` | — | 表头、通过与否、汇总各项与空态的文字。 |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { WalkForwardMatrix } from '@katana-ui/react/quant'
import { DEMO_WALK_FORWARD, dateText, pct1, ratio0 } from '../research-data'

export const WALK_FORWARD_LABELS = {
  modeGroup: '窗口模式',
  rolling: '滚动',
  anchored: '锚定',
  window: '窗口',
  timeline: '时间轴',
  inSample: '样本内',
  outSample: '样本外',
  params: '选中参数',
  outPerformance: '样本外收益',
  result: '结果',
  pass: '通过',
  fail: '未通过',
  windows: '窗口数',
  passed: '通过窗口',
  profitable: '样本外盈利占比',
  inAnnualized: '样本内年化',
  outAnnualized: '样本外年化',
  efficiency: '步进效率',
  noValue: '–',
  empty: '没有步进窗口',
} as const

export function WalkForwardMatrixUsage() {
  return (
    <div className="gal-wide" data-gallery-walkforward="main" style={{ maxWidth: 900 }}>
      <WalkForwardMatrix
        modes={DEMO_WALK_FORWARD}
        label="示例：八个步进窗口"
        formatDate={dateText}
        formatPercent={pct1}
        formatRatio={ratio0}
        labels={WALK_FORWARD_LABELS}
        source="来源 / 演示数据（固定种子合成，不是回测结果；通过 = 样本外收益大于 1%，演示用）"
      />
    </div>
  )
}
```

## States

- 默认：表头加每窗口一行；通过用对勾加「通过」，没通过用叉加「未通过」，不只靠颜色。
- 样本外收益的涨跌色只给这一格的字。
- 样本内年化不为正：步进效率没有意义，写 noValue。
- 没有窗口：写 empty。

## Don't

- 不要在件里定「通过」的判据：它是策略的判断，由调用方给 passed。
- 不要拿首尾相接复利代替各窗口年化的平均：锚定模式的样本内区间重叠。
- 不要拿步进效率单独当结论：和稳健性门的其他判定一起看。

## Composition

```
WalkForwardMatrix
  头（锚定/滚动开关 · 图例）
  table（窗口 · 时间轴小条 · 样本内 · 样本外 · 选中参数 · 样本外收益 · 结果）
  汇总（窗口数 · 通过 · 盈利占比 · 样本内年化 · 样本外年化 · 步进效率）
  来源行
```

## Keyboard

- `Tab`：进表后按表格语义读；开关用方向键切换
