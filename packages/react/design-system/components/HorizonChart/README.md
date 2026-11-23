# HorizonChart

十几个品种的日内收益叠成窄带，一屏看完：每行把正负值折成几条叠起来的带，颜色越深值越大，正负用发散色（涨跌色只给右边的数）。所有行共用一个扫读位置，指针所在的那一行出 LCD 窗；右上有表格视图。功能参照 Arc 的 Horizon chart。

## Provide

`*` marks a required prop.

### HorizonChart

每行一个 svg（viewBox，竖向是像素），右边一列写值：没选中写最新值，选中后写那一格。各行点数应当相同，短的行末尾当没有值。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `rows` | `{ key, label, values }[]` | — | 每行一个品种：名字与从旧到新的值（带正负）。 |
| `label` | `string` | — | 整张图的读屏名（必填）。 |
| `formatValue` | `(value: number) => string` | — | 右边一列的值写成什么字，正负号由调用方定。 |
| `formatX` | `(index: number) => string` | — | 读数行写第几个点是什么时间；不给没有读数行。 |
| `bands` | `number` | `3` | 几条带（待核对：Heer 等《Sizing the Horizon》比较过 2 到 4 带，没读到原文结论）。 |
| `scale` | `'shared' \| 'row'` | `'shared'` | shared：所有行同一把满刻度，行与行可比；row：每行各用自己的最大值，只看形状。 |
| `max` | `number` | — | 固定满刻度；不给按数据算。 |
| `rowHeight` | `number` | `24` | 一行高（px）。 |
| `actionLabels / tableLabel / tableXHead / source / onExport / onFullscreen` | `SeriesTableViewProps` | — | 三个图工具的名字、表格视图的读屏名与第一列（横轴位置）的列头（其余列头是各行的名字）、来源一行、导出与全屏的回调。 |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { HorizonChart, type HorizonRow } from '@katana-ui/react/quant'

const HZ_POINTS = 48

const hz = (f: (i: number) => number) => Array.from({ length: HZ_POINTS }, (_, i) => +f(i).toFixed(3))

export const HORIZON_DEMO_ROWS: readonly HorizonRow[] = [
  { key: 'AAA', label: 'AAA', values: hz((i) => 3 * Math.sin(i / 3.8)) },
  { key: 'BBB', label: 'BBB', values: hz((i) => 1.2 * Math.sin(i / 3.8 + 1)) },
  { key: 'CCC', label: 'CCC', values: hz((i) => (i < HZ_POINTS / 2 ? 0.9 : -0.9)) },
  { key: 'DDD', label: 'DDD', values: hz((i) => -2 * Math.cos(i / 5)) },
]

const pctText = (value: number) => `${value > 0 ? '+' : ''}${value.toFixed(2)}%`

/** 图右上三件的文字（表格视图必须有，dataviz §4）。 */
const ACTIONS = { group: '图工具', table: '表格视图', exportCsv: '导出 CSV', fullscreen: '全屏' }

export function HorizonChartUsage() {
  return (
    <>
      <div className="gal-wide" data-gallery-horizon="shared" style={{ maxWidth: 560 }}>
        <HorizonChart
          rows={HORIZON_DEMO_ROWS}
          label="示例：四个品种的日内收益（共用刻度）"
          formatValue={pctText}
          formatX={(i) => `第 ${i + 1} 点`}
          actionLabels={ACTIONS}
          tableLabel="四个品种的日内收益（表格视图）"
          tableXHead="时点"
        />
      </div>
      <div className="gal-wide" data-gallery-horizon="row" style={{ maxWidth: 560 }}>
        <HorizonChart
          rows={HORIZON_DEMO_ROWS}
          label="示例：四个品种的日内收益（各自刻度）"
          formatValue={pctText}
          scale="row"
          actionLabels={ACTIONS}
          tableLabel="四个品种的日内收益（各自刻度，表格视图）"
          tableXHead="序号"
        />
      </div>
    </>
  )
}

/** 演示用的六个品种的价格走势：闭式公式，一条 40 个点。 */
```

## States

- 默认：每行正值的带在基线上方叠起、负值的带同一基线叠起（发散色），右边写最新值。
- 扫读：每行同一根竖线，右边一列写那一格的值，读数行写时间；指针所在的那一行出 LCD 窗。
- 表格视图：一行一个横轴位置、一列一行序列。
- 共用刻度：小行只有浅带；各自刻度：每行都填满。
- 一行全是 0 或没数据：画成空行，值写「—」或 0。

## Don't

- 不要拿它读精确值：颜色深浅只是量级，精确值在右边一列与读数里。
- 不要在 scale 为 row 时比较不同行的高低：每行的满刻度不一样。
- 不要超过十来行：行高 24px，几十行用 SmallMultiples 或表。

## Composition

```
HorizonChart
  右上三件（表格视图 · 导出 · 全屏）
  div[role=group]
    每行：名字 · 窄带 svg（正、负各 bands 条 path）· 十字线 · LCD 窗（指针所在行）· 值
  读数行（aria-live）· 来源行
```

## Keyboard

- `← →`：选中前后一格；没选中时先落到最新一格
- `Shift + ← →`：一次三格
- `Home / End`：第一格 / 最后一格
- `Esc`：清掉选中
