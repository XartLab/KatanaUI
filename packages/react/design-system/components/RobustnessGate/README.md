# RobustnessGate

一组判定条：每条一行写名字、实测值、比较符号与阈值、一根小条（条长是实测值、一道刻线是阈值）与通过状态；全部通过才过门，有一条失败或没测出来就不过（未知不当通过放行）。阈值、比较方向（≥ ≤ > <）与数值写法全由调用方传，件里没有任何写死的数字。状态用文字加图标，不只靠颜色。新做；设计卡在 KATANAview 的 RobustnessGate。

## Provide

`*` marks a required prop.

### RobustnessGate

阈值与口径全由调用方给。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `checks` | `RobustnessCheck[]` | — | { id, name, value, threshold, op, format?, hint? }：op 是 gte / gt / lte / lt；value 为 null 是「未测出」。 |
| `label / title` | `string / ReactNode` | — | 整组读屏名与标题。 |
| `labels` | `RobustnessGateLabels` | — | 三列小标题、通过 / 未通过 / 未测出、过门 / 未过门、汇总写法（函数）、空态。 |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import {
  RobustnessGate,
  sliceGrid,
  bestCell,
  surfaceNeighborhood,
  summarizeWindows,
  type RobustnessCheck,
} from '@katana-ui/react/quant'
import { DEMO_SURFACE, DEMO_WALK_FORWARD, ratio0 } from '../research-data'

// 实测值取自别的演示页同一份数据：步进效率与样本外盈利占比来自滚动窗口，邻域保留率来自止损 = 1 的曲面切片（有孤峰）。
// 阈值是这份演示自己定的，不是推荐值：件里没有任何写死的阈值，全由调用方传。
const walk = summarizeWindows(DEMO_WALK_FORWARD.rolling)
const grid = sliceGrid(DEMO_SURFACE, ['fast', 'slow'], { stop: 1 })
const best = bestCell(grid, 'sharpe', 'max')!
const stable = surfaceNeighborhood(grid, best, 'sharpe', 'max')

export const DEMO_CHECKS: readonly RobustnessCheck[] = [
  {
    id: 'wfe',
    name: '步进效率',
    value: walk.efficiency,
    threshold: 0.5,
    op: 'gte',
    format: ratio0,
    hint: '样本外年化 ÷ 样本内年化',
  },
  {
    id: 'profitable',
    name: '样本外盈利窗口占比',
    value: walk.profitableShare,
    threshold: 0.6,
    op: 'gte',
    format: ratio0,
  },
  {
    id: 'retention',
    name: '最优参数邻域保留率',
    value: stable.retention,
    threshold: 0.6,
    op: 'gte',
    format: ratio0,
    hint: '最优格周围八格的均值 ÷ 最优值',
  },
  { id: 'drawdown', name: '样本外最大回撤', value: 0.167, threshold: 0.25, op: 'lte', format: ratio0 },
  { id: 'trades', name: '样本外交易笔数', value: null, threshold: 100, op: 'gte' },
]

export function RobustnessGateUsage() {
  return (
    <div className="gal-wide" data-gallery-gate="main" style={{ maxWidth: 720 }}>
      <RobustnessGate
        title="上线前稳健性检查"
        label="示例：稳健性门"
        checks={DEMO_CHECKS}
        labels={{
          measured: '实测值',
          threshold: '阈值',
          result: '结果',
          pass: '通过',
          fail: '未通过',
          unknown: '未测出',
          open: '过门',
          closed: '未过门',
          summary: (passed, total) => `${passed} / ${total} 通过`,
          empty: '没有判定条',
        }}
        source="来源 / 演示数据与演示阈值"
      />
    </div>
  )
}
```

## States

- 全部通过：头里「过门」加对勾。
- 有失败：「未过门」加叉，失败的行写「未通过」。
- 有未测出：那行写「未测出」，整组不过门。
- 没有判定条：写 empty，不过门。

## Don't

- 不要在件里写死阈值：它们是策略判断。
- 不要把未测出当通过。
- 不要只靠颜色：状态有字有图标。

## Composition

```
RobustnessGate
  头（标题 · 过门/未过门 · 通过计数）
  列表（名字 · 实测值 比较符 阈值 · 小条与阈值刻线 · 状态）
  来源行
```
