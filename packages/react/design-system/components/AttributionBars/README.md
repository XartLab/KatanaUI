# AttributionBars

今天（或选中区间）的钱从哪来：工作台顶行（宽体标题、维度与区间分段、表格 / 导出），点阵元信息与列头，每行编号加零轴条形（正在右、负在左，条是点阵纹理不用红绿，只有数字用涨跌色），已平仓的行整行删除线并在名称后挂点阵小标签，元信息行下面一行汇总（合计大号左带 2px 强调竖条，正负贡献小一号）；按 |贡献| 正负分组降序，超过 7 项折「其他 ×n」，费用·税永远在最底。对设计稿的 PnLAttribution 卡（卡明写不用瀑布图），语言同 SeriesExplorer。

## Provide

### AttributionBars

数据只有 items；维度与区间切换由调用方做（换 items），组件只画分段并上报。文字全从 props 来。外观读 CSS 变量，见 theme/chart-kit.css 开头。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `items` | `{ key, label, value, kind?, detail? }[]` | — | kind 为 fee 的是费用·税，永远单独一行放最底；closed 是名称后的点阵小标签（整行删除线）；detail 是 tooltip 里多写的几行。 |
| `formatValue / formatShare` | `(n) => string` | — | 贡献与占比写成什么字。 |
| `otherLabel / shareLabel` | `(n) => string / string` | — | 「其他 ×n」与占比那一行的标签。 |
| `title / meta` | `string / (scale) => string` | — | 标题（宽体大写英文）与下一行点阵元信息；刻度 ±max 只在元信息里写一次。 |
| `dimensions / ranges` | `{ label, options, value, onChange }` | — | 顶行的两组分段；换了就换 items，同一位置的条长会过渡。 |
| `readouts` | `{ key, label, text, value? }[]` | — | 汇总行：第一个是合计（大号，左 2px 强调竖条），其余小一号跟在右边；标签点阵小字，value 决定涨跌色。 |
| `focusKey / onSelect` | `string / (key) => void` | — | 联动的品种：它的条转强调色纹理；点击或 Enter 写联动上下文。 |
| `footer` | `{ count, source?, note? }` | — | 页脚一行：左边点阵 SOURCE，右端「项数 · 声明」（研究账本不计入）。 |
| `actionLabels / heads` | `object` | — | 顶行按钮的读屏名与列头（编号、项、贡献、占比，可带 shareTitle 写明分母；点阵小字）；导出与全屏的回调不给就不画那个按钮，表格视图总有。 |
| `maxItems` | `number` | `7` | 超过几项折进「其他」（含「其他」这一行）。 |

## States

- 默认：正组在上、负组在下，各按 |贡献| 降序；刻度 ±max 写在页脚。
- 焦点：focusKey 对应的条转强调色纹理。
- 悬停或聚焦一行：LCD tooltip 写数值、占比与明细。
- 表格视图：右上角第一个按钮切到表格，键盘可达（无障碍兜底）。

## Don't

- 不要用瀑布图：阅读要跟踪累计基线，认知负荷高。
- 不要用颜色区分账户或策略：标签说清楚就够。
- 不要在条上用涨跌色：涨跌色不上面积，只有右侧数字用。
- 不要在这里拆已实现 / 未实现：这里只回答「谁贡献了多少」。
- 不要做庆祝性反馈（实时更新只让数字滚动、条跟随）。

## Composition

```
AttributionBars
  Toolbar 顶行（标题 · 维度 / 区间分段 · 表格 / 导出 / 全屏）
  点阵元信息
  汇总行（合计 · 正贡献 · 负贡献）
  列头 + ul 每行（编号 · 标签 + 平仓小标签 · 零轴 + 条 · 数字 · 占比；悬停出 LCD tooltip）
  页脚一行（SOURCE · 项数与声明）
```

## Keyboard

- `Enter`：点击当前行（写联动）
- `Esc`：收起 tooltip
