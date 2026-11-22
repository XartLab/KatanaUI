# ConnectedScatter

每个点是一个时刻的 (x, y)，按时间顺序连成轨迹，看一个对象在两个量之间怎么走（如策略的波动 vs 收益按月的路径、风格漂移）。时间方向不单靠颜色：起点空心圈、终点强调色实心圈加箭头、中间的点按时间取 seq 色阶（越晚越亮）。多条轨迹各取 series 色板的一个色。功能参照 Arc Connected scatter，实现原创。

## Provide

`*` marks a required prop.

### ConnectedScatter

文字全由 props 传：每个点的整句在 point.label 里，轴名在 axes。图是一个 role=group，每条轨迹一个 role=group，每个点一个带整句名的 role=img。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `series` | `ScatterSeries[]` | — | { id, label, points: { x, y, label }[] }；点按时间从早到晚排。 |
| `label` | `string` | — | 整张图的读屏名。 |
| `axes` | `{ x: string; y: string }` | — | 两根轴的名字。 |
| `formatX / formatY` | `(value: number) => string` | `String` | 刻度怎么写。 |
| `xDomain / yDomain` | `[number, number]` | — | 轴范围；不给取全体数据放宽 5%。 |
| `idle` | `ReactNode` | — | 没有悬停也没有聚焦时读数行写什么。 |

### scatterLayout(series, frame, options)

点到像素的纯函数：返回刻度位置、每个点的像素坐标与终点箭头的三个顶点。

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { ConnectedScatter, type ScatterSeries } from '@katana-ui/react/quant'

const ACTIONS = { group: '图的操作', table: '表格视图', exportCsv: '导出 CSV', fullscreen: '全屏' }

const view = (tableHead: string[], tableLabel: string) => ({
  actionLabels: ACTIONS,
  tableLabel,
  tableHead,
  onExport: () => {},
  onFullscreen: () => {},
  source: '来源 / 演示数据 · 固定种子合成 · 非行情',
})

// #1918：分布与关系类的件的演示。下面所有数据都是演示用的示例（在这个展示页里写死或用固定种子构造，不是行情，也不是真实的连接状态），页上也写明了；应用里没有样本数据。

/** 固定种子的伪随机（mulberry32）：同样的种子永远同样的演示数据，e2e 的几何断言才稳。 */

const MONTHS = ['01', '02', '03', '04', '05', '06', '07', '08']

const path = (name: string, points: readonly (readonly [number, number])[]) =>
  points.map(([x, y], i) => ({ x, y, label: `${name} 2026-${MONTHS[i]}：波动 ${x} %，收益 ${y} %` }))

const STRATEGIES: readonly ScatterSeries[] = [
  {
    id: 'a',
    label: '示例策略甲',
    points: path('甲', [
      [8, 4],
      [9, 5],
      [10, 4.5],
      [11, 6],
      [12, 7],
      [13, 6.5],
      [14, 8],
      [15, 9],
    ]),
  },
  {
    id: 'b',
    label: '示例策略乙',
    points: path('乙', [
      [14, 6],
      [13, 6.5],
      [12, 5.5],
      [11, 5],
      [10, 5.5],
      [9, 4.5],
      [8, 4],
      [7, 4.2],
    ]),
  },
]

export function ConnectedScatterUsage() {
  return (
    <>
      <div className="gal-wide" data-gallery-scatter="two">
        <ConnectedScatter
          {...view(['轨迹', '时间点', '波动', '收益'], '轨迹点表')}
          series={STRATEGIES}
          label="示例：两个策略的波动与收益按月的轨迹"
          axes={{ x: '年化波动（%）', y: '年化收益（%）' }}
          formatX={(value) => `${value} %`}
          formatY={(value) => `${value} %`}
          idle="悬停或用方向键选一个月"
        />
      </div>

      <div className="gal-wide" data-gallery-scatter="one">
        <ConnectedScatter
          {...view(['轨迹', '时间点', '波动', '收益'], '轨迹点表')}
          series={STRATEGIES.slice(0, 1)}
          label="示例：策略甲的轨迹"
          axes={{ x: '年化波动（%）', y: '年化收益（%）' }}
        />
      </div>
    </>
  )
}
```

## States

- 起点空心圈、中间小点、终点大实心圈加箭头；中间的点取 --k-heat-1 到 --k-heat-5（按时间分档），终点用强调色加辉光。
- 悬停或聚焦一个点：该点描白边，别的轨迹变暗，读数行写这个点的整句。
- 单点的轨迹只画一个点，没有连线与箭头。

## Don't

- 不要在没有时间顺序的数据上用它：连线表示先后。
- 不要放太多条轨迹（超过七条色板就循环、颜色重复）：轨迹交叠时看不清。
- 不要只靠颜色认哪条是哪条：图例与每个点的整句里都写了名字。

## Composition

```
ConnectedScatter
  svg role=group
    g（刻度线与轴名）
    g role=group（一条轨迹：折线 · 终点箭头 · 各点 circle role=img）
  ul（图例）
  output（读数行）
```

## Keyboard

- `← / →`：沿时间在同一条轨迹的点上走，到头不绕回
- `↑ / ↓`：去上一条 / 下一条轨迹的同一位置（不够长落在最后一个点）
- `Home / End`：去这条轨迹的第一个 / 最后一个点
