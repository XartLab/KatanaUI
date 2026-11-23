# ParamSurfaceHeatmap

优化结果的参数平面：两个参数为横纵轴、目标值（可切）为色，悬停或聚焦一格，右侧读数区列出这一格全部参数与全部指标；最优格加琥珀环，周围一圈用细框标出，并算最优格邻域的均值、方差与保留率（邻均值 ÷ 最优值）——孤峰过拟合一眼能看出来（调用方给 spikeBelow 就标「孤峰」）。参数多于两个时选两轴，其余固定为切片，每个一个下拉。ParamScatter 是自由散点（点没有网格邻接关系、没有切片与邻域），这里要的是格子邻接，所以新做一件；最优与色阶的做法与它一致（暗灰到亮灰、跨 0 用涨跌发散色）。

## Provide

`*` marks a required prop.

### ParamSurfaceHeatmap

数据（每组参数的各项指标）由调用方给，件不算优化。轴、目标值、切片都可受控。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `points` | `SurfacePoint[]` | — | { id, params: {key: 数}, metrics: {key: 数 \| null} }；没跑出结果的指标传 null。 |
| `params` | `{ key, name, format? }[]` | — | 参数表：可选做轴的、切片的都在这里。 |
| `metrics` | `{ key, name, format, goal, formatSpread? }[]` | — | 指标表：goal 决定最优格与色阶方向（max 越大越好、min 越小越好）。 |
| `axes / onAxesChange` | `[xKey, yKey]` | — | 两根轴的参数；选到另一根轴在用的参数时两轴对调。 |
| `metric / onMetricChange` | `string` | — | 当前目标值的 key。 |
| `slice / onSliceChange` | `Record<string, number>` | — | 其余参数固定在哪；不给各取第一个取值。 |
| `radius` | `number` | `1` | 邻域半径（格）：1 即八邻。 |
| `spikeBelow` | `number` | — | 保留率低于它标「孤峰」；不给就不判，只显示数（阈值是策略判断，件里不写死）。 |
| `formatRatio / labels` | `function / ParamSurfaceLabels` | — | 保留率的写法；轴名、读数区各项、空态的文字。 |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { ParamSurfaceHeatmap } from '@katana-ui/react/quant'
import { DEMO_SURFACE, money, ratio0 } from '../research-data'

export function ParamSurfaceHeatmapUsage() {
  return (
    <div className="gal-wide" data-gallery-surface="main" style={{ maxWidth: 820 }}>
      <ParamSurfaceHeatmap
        points={DEMO_SURFACE}
        params={[
          { key: 'fast', name: '快线周期' },
          { key: 'slow', name: '慢线周期' },
          { key: 'stop', name: '止损 %' },
        ]}
        metrics={[
          { key: 'sharpe', name: '夏普比率', format: (v) => v.toFixed(2), goal: 'max' },
          {
            key: 'net',
            name: '净利润',
            format: money,
            goal: 'max',
            formatSpread: (v) => Math.round(v).toLocaleString('en-US'),
          },
          { key: 'drawdown', name: '最大回撤', format: (v) => `${(v * 100).toFixed(1)}%`, goal: 'min' },
        ]}
        label="示例：快线与慢线周期的参数曲面（止损固定）"
        spikeBelow={0.6}
        formatRatio={ratio0}
        labels={{
          xAxis: '横轴',
          yAxis: '纵轴',
          metric: '目标值',
          slice: '固定',
          best: '最优',
          spike: '孤峰',
          cell: '这一格',
          neighborhood: '最优格的邻域',
          neighbors: '邻格数',
          mean: '邻域均值',
          variance: '邻域方差',
          retention: '保留率（邻均值 ÷ 最优）',
          noValue: '没有结果',
          missing: '没有这组参数',
          idle: '移到一格上，看这组参数的全部指标',
          empty: '没有优化结果',
        }}
        source="来源 / 演示数据（固定种子合成，不是回测结果）"
      />
    </div>
  )
}
```

## States

- 默认：前两个参数为轴，第一个指标为色；最优格琥珀环，它的邻格细琥珀框。
- 悬停、聚焦或点一格（再点取消）：读数区列这格全部参数与指标；没选时读数区看最优格。
- 右下「最优格的邻域」：邻格数、邻域均值、邻域方差、保留率；保留率低于 spikeBelow 标「孤峰」。
- 格子多于 14 列时只留颜色不写字；没有结果的格是空心框。

## Don't

- 不要只看最优值：旁边的邻域稳定度才说明它是平台还是孤峰。
- 不要在件里写死孤峰阈值：由调用方按策略定。
- 不要在这里跑优化：件只画结果。

## Composition

```
ParamSurfaceHeatmap
  头（横轴 · 纵轴 · 目标值开关 · 各切片下拉）
  网格 role=grid（行头 · 格 role=gridcell · 横轴刻度）· 色条
  读数区（这一格全部参数与指标）· 最优格的邻域
  来源行
```

## Keyboard

- `Tab`：进图，停在一格上
- `方向键`：走格（到头不绕回）
- `Home / End`：到行首 / 行尾
- `Enter / 空格`：钉住或取消当前格
- `Esc`：取消钉住
