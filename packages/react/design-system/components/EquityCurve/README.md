# EquityCurve

权益线加镜像回撤：上区 2px 权益线（series-1）、可选 1px 灰虚线基准，下区回撤面用点阵 / 斜线纹理，末点橙色旁标最终值；线性 / 对数纵轴、底下概览刷选条、表格视图。横轴按点的时刻摆。对设计稿的 EquityCurve 卡。

## Provide

### EquityCurve

包里不带语言：标题、图例、数值与时间的写法都由调用方传。外观读 CSS 变量，见 theme/chart-kit.css 开头。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `points` | `{ time, equity, drawdown, title, equityText, drawdownText }[]` | — | 一点一笔；time 是毫秒时刻，横轴按它摆；文字已按币种位数格式化。 |
| `benchmark` | `{ name, values }` | — | 与 points 一一对应的基准数值；不给就不画。 |
| `axis / formatTime` | `(n) => string` | — | 纵轴刻度与基准读数、横轴默认刻度的写法。 |
| `xTicks` | `(start, end) => { time, label }[]` | — | 宿主自己给整点 / 整日刻度（按显示时区）；不给就在窗口里均分 5 个。 |
| `labels` | `object` | — | 回撤、时刻列头、线性 / 对数、概览条三个手柄、右上三件的文字。 |
| `onWindowChange` | `(window) => void` | — | 拖概览条改窗口后回调，宿主可把别的表跟着筛。 |
| `onExport / onFullscreen` | `() => void` | — | 不给就不画那个按钮；表格视图总有。 |

## States

- 默认：全段，线性轴，末点标最终值。
- 悬停或聚焦后 ←→：十字线与 LCD tooltip 写序号时刻、权益、基准、回撤。
- 对数轴：权益与基准都大于 0 才能切；有 ≤ 0 的值时按钮禁用。
- 没有回撤（一直创新高）：下区只留 0 线。

## Don't

- 不要把回撤画成实色面：用纹理。
- 不要在线与面上用涨跌色：涨跌色只给文字。
- 不要标除末点以外的数值。

## Composition

```
EquityCurve
  头（标题 · 图例 · 线性/对数 · 表格视图/导出/全屏）
  上区（网格 · 基准 · 权益线 · 末点 · 十字线与 LCD tooltip）
  下区（镜像回撤纹理）
  横轴 · 概览刷选条 · 来源行
```

## Keyboard

- `← →`：在图上扫读一点（Shift 三点）
- `Home / End`：扫读到头 / 尾
- `Esc`：清除扫读点
