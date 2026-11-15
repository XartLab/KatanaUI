# RatingText

分析师评级、技术评级结论的单元格写法：图标加文字，强力买入双上箭头、买入单上箭头、中性等号、卖出单下箭头、强力卖出双下箭头；买入档取涨色、卖出档取跌色（跟 data-updown），中性不着色。照 TradingView 选股器「分析师评级」列（主会话 2026-11-15 登录态实测），实现原创。放进 DataGrid 的 custom 列里用（见 FilterBar 页的选股器）。

## Provide

`*` marks a required prop.

### RatingText

其余属性透传给 span。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `level` | `'strong-sell' \| 'sell' \| 'neutral' \| 'buy' \| 'strong-buy'` | — | 五档。 |
| `children` | `string` | — | 档名，由调用方传（包里不带语言）。 |

## Usage

```tsx

```

## States

- 买入、强力买入：涨色；卖出、强力卖出：跌色；中性：继承周围字色。
- 方向不只靠颜色：图标一至两层箭头表示强弱。

## Don't

- 不要自己拼箭头字符着色；用这个件，涨跌色才会跟 data-updown。

## Composition

```
RatingText（内部：lucide 图标）；放在 DataGrid 的 custom 列 cell 里
```
