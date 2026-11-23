# UnderwaterChart

权益距历史最高的回撤百分比随时间的面积图（点阵纹理，不用实色），标出最大回撤段（前高到恢复的一块底色）、谷底读数，顶上写深度、前高到谷底与恢复用时；到末点还没回到前高时写「尚未恢复」，这一段改琥珀底。横轴复用 EquityCurve 的 timeX 与默认刻度、同样的 xDomain / xTicks / formatTime 写法，左侧留白一致，叠着放时同一时刻落在同一列。EquityCurve 里已有镜像回撤，但没有最大回撤段与恢复时长，所以这里新做一件，不改它。数据由调用方给（drawdown 小数 ≤ 0）。

## Provide

`*` marks a required prop.

### UnderwaterChart

文字与数值写法全由 props 传。与 EquityCurve 对齐：两边传同一对 xDomain、同一个 formatTime（和 xTicks）。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `points` | `{ time, drawdown }[]` | — | time 是毫秒时刻；drawdown 是小数，≤ 0，创新高时 0。 |
| `title / label` | `string` | — | 标题与整张图的读屏名。 |
| `xDomain` | `[start, end]` | — | 横轴定义域（毫秒）；不给取 points 首末。落在外面的点不画。 |
| `xTicks` | `(start, end) => { time, label }[]` | — | 同 EquityCurve；不给均分 5 个。 |
| `formatTime / formatPercent / formatDuration` | `function` | — | 横轴与读数、回撤百分比、时长的写法。 |
| `labels` | `UnderwaterChartLabels` | — | 回撤、最大回撤、前高到谷底、恢复、尚未恢复、没有回撤的文字。 |
| `actionLabels / tableLabel / tableHead / source / onExport / onFullscreen` | `ChartViewProps` | — | 同其他图。 |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { EquityCurve, UnderwaterChart } from '@katana-ui/react/quant'
import { DEMO_EQUITY, DEMO_RANGE, DEMO_UNDERWATER, dateText, duration, pct1 } from '../research-data'

const actions = { group: '图的操作', table: '表格视图', exportCsv: '导出 CSV', fullscreen: '全屏' }

/** 水下回撤图，单独一张。 */
export function UnderwaterChartUsage() {
  return (
    <div className="gal-wide" data-gallery-underwater="main" style={{ maxWidth: 760 }}>
      <UnderwaterChart
        points={DEMO_UNDERWATER}
        title="水下回撤"
        label="示例：权益距历史最高的回撤"
        xDomain={DEMO_RANGE}
        formatTime={dateText}
        formatPercent={pct1}
        formatDuration={duration}
        labels={{
          drawdown: '回撤',
          maxDrawdown: '最大回撤',
          fall: '前高到谷底',
          recovery: '恢复',
          notRecovered: '尚未恢复',
          noDrawdown: '没有回撤',
        }}
        actionLabels={actions}
        tableLabel="回撤表"
        tableHead={['日期', '回撤']}
        source="来源 / 演示数据（固定种子合成，不是回测结果）"
      />
    </div>
  )
}

/** 和权益曲线叠着放：同一对 xDomain、同一个 formatTime，横轴对齐。 */
export function UnderwaterWithEquityUsage() {
  return (
    <div className="gal-wide" data-gallery-underwater="stack" style={{ maxWidth: 760 }}>
      <EquityCurve
        points={DEMO_EQUITY}
        title="权益曲线"
        name="权益"
        label="示例：权益曲线"
        axis={(v) => v.toLocaleString('en-US')}
        formatTime={dateText}
        labels={{
          drawdown: '回撤',
          time: '时刻',
          scale: { group: '纵轴', linear: '线性', log: '对数' },
          brush: { start: '窗口起点', end: '窗口终点', window: '窗口位置' },
          actions,
        }}
      />
      <UnderwaterChart
        points={DEMO_UNDERWATER}
        title="水下回撤"
        label="示例：和权益曲线同一条时间轴的回撤"
        xDomain={DEMO_RANGE}
        formatTime={dateText}
        formatPercent={pct1}
        formatDuration={duration}
        labels={{
          drawdown: '回撤',
          maxDrawdown: '最大回撤',
          fall: '前高到谷底',
          recovery: '恢复',
          notRecovered: '尚未恢复',
          noDrawdown: '没有回撤',
        }}
        actionLabels={actions}
        tableLabel="回撤表"
        tableHead={['日期', '回撤']}
      />
    </div>
  )
}
```

## States

- 默认：点阵面加细线，最大回撤段淡底色，谷底标读数。
- 悬停或聚焦后 ← →：十字线与 LCD tooltip 写时刻与回撤。
- 到末点还没恢复：恢复一栏写「尚未恢复」，段底色改琥珀。
- 一直创新高：只留 0 线，头里写「没有回撤」。

## Don't

- 不要把回撤画成实色面：用纹理。
- 不要在面上用涨跌色：跌色只混进纹理与细线。
- 不要自己换横轴写法：和权益曲线用同一组 xDomain 与 formatTime，才对得齐。

## Composition

```
UnderwaterChart
  头（标题 · 图例 · 最大回撤 / 前高到谷底 / 恢复 · 表格视图/导出/全屏）
  图（网格 · 最大回撤段 · 回撤面 · 谷底读数 · 十字线与 LCD tooltip）
  横轴 · 来源行
```

## Keyboard

- `← →`：在图上扫读一点（Shift 三点）
- `Home / End`：扫读到头 / 尾
- `Esc`：清除扫读点
