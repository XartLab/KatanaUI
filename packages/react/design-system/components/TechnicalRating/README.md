# TechnicalRating

照 TradingView 的 Technicals 仪表：三个半圆仪表（振荡指标、总评、均线，总评居中放大），五档刻度文字，指针按 −1…1 的分数转到所在档（分界 −0.5、−0.1、0.1、0.5），下面一行大字写档名，再一行「卖 n · 中性 n · 买 n」与指标总数；底下是指标明细表（名称、读数、单项结论胶囊），顶上是时间周期分段控件。组件只画不算：分数、个数、读数与结论都由调用方传；档名、列名、免责一句也由调用方传，件只留位置。颜色走涨跌语义色与中性灰，不用橙色。放在 PanelFrame 里用。

## Provide

### TechnicalRating

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `groups` | `RatingGroup[]` | — | { key, label, value（−1…1）, counts: { sell, neutral, buy } }；通常三组。空数组画空态。 |
| `rows` | `RatingRow[]` | — | 指标明细：{ key, name, group?（对 groups 的 key，按组分节）, reading?（写好的文字，没有写「—」）, verdict }；不给就只画仪表。 |
| `labels` | `TechnicalRatingLabels` | — | 五档名（从卖到买）、卖 / 中性 / 买、指标总数文字、列名、周期控件与整件的读屏名、空态文字。 |
| `primary` | `string` | — | 放大居中的那一组的 key；不给取中间那一组。窄于 440px 时它独占一行。 |
| `timeframes / timeframe / onTimeframeChange` | `TechnicalRatingTimeframe[] / string / (value) => void` | — | 时间周期分段控件的选项、当前值与回调；不给 timeframes 就没有这一条。切周期后传新的 groups 与 rows。 |
| `disclaimer` | `ReactNode` | — | 免责一句，画在仪表与明细之间；不给就不画。 |

## States

- 档：分数小于 −0.5 强卖，−0.5 到 −0.1 卖，−0.1 到 0.1 中性，0.1 到 0.5 买，大于 0.5 强买；正好落在 ±0.1 算中性，落在 ±0.5 算卖 / 买。分数 −1 指针在最左，1 在最右，0 竖直。
- 所在档的弧与刻度字全亮，其余弧 30% 不透明；指针与亮档用 gentle 弹簧过渡。小仪表只留两端的刻度字。
- 明细行悬停整行提亮；结论是低饱和胶囊（买取涨色、卖取跌色、中性灰），涨跌色跟 data-updown。

## Don't

- 不要把评级当买卖建议；免责一句由调用方写，别删这个位置。
- 不要在件里算评级或写死中文；分数、个数、文字都由调用方传。
- 没有数据时传空数组，件画空态，不要放样本读数。

## Composition

```
TechnicalRating（group）
  时间周期（分段控件）
  仪表（figure ×3）：组名 | 半圆五档弧 + 刻度字 + 指针 | 档名 | 卖 n · 中性 n · 买 n | 共 n 项指标
  免责一句
  明细表：列头 | 节（组名 + 项数）| 行（指标 | 读数 | 结论）
```

## Keyboard

- `Tab`：依次到周期控件的按钮（← → 在其中移动，Space / Enter 选）
