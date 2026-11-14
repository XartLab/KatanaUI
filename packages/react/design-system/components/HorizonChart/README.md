# HorizonChart

十几个品种的日内收益叠成窄带，一屏看完：每行把正负值折成几条叠起来的带，颜色越深值越大，涨跌色跟涨跌配色走。所有行共用一个扫读位置。功能参照 Arc 的 Horizon chart。

## Provide

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

## States

- 默认：每行涨色带在基线上方叠起、跌色带同一基线叠起，右边写最新值。
- 扫读：每行同一根竖线，右边一列写那一格的值，读数行写时间。
- 共用刻度：小行只有浅带；各自刻度：每行都填满。
- 一行全是 0 或没数据：画成空行，值写「—」或 0。

## Don't

- 不要拿它读精确值：颜色深浅只是量级，精确值在右边一列与读数里。
- 不要在 scale 为 row 时比较不同行的高低：每行的满刻度不一样。
- 不要超过十来行：行高 24px，几十行用 SmallMultiples 或表。

## Composition

```
HorizonChart
  div[role=group]
    每行：名字 · 窄带 svg（正、负各 bands 条 path）· 值
  读数行（aria-live）
```

## Keyboard

- `← →`：选中前后一格；没选中时先落到最新一格
- `Shift + ← →`：一次三格
- `Home / End`：第一格 / 最后一格
- `Esc`：清掉选中
