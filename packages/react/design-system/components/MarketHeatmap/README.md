# MarketHeatmap

照 TradingView 的股票热力图：格子面积是所选的大小指标（市值、成交额或等大），颜色是所选指标落在七档色阶的哪一档，按行业分组或平铺。顶上一行汇总读数（只数、上涨、下跌），工具条用分段控件切大小、颜色、视图；点组名放大到只看这一组（面包屑返回，Esc 也行）；悬停出这只票的价格与各项读数；底部图例写出每一档的值边界，点一档就隐藏这一档的格子。A 股、港股、美股、加密共用，只换数据与分组；不认数据集，品种、指标、文字都由调用方传。排布与着色档用包里矩形树图的 layoutTreemap、colorStep。

## Provide

### MarketHeatmap

放在 PanelFrame 里用，件自己撑满容器的高度（排布按真实像素算，随容器改变重排）。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `items` | `HeatmapItem[]` | — | { code, name, group?, logo?, price?, size: Record<键, number>, value: Record<键, number | null> }。size 里不是正数的格子不画；value 是 null 画成灰（没有数）；没有 group 的品种归到 labels.other，所有品种都没有 group 就不分组、也不出视图切换。 |
| `sizeBy` | `HeatmapSizeBy[]` | — | 大小指标：{ key, label, equal?, format? }。key 对 item.size 的键；equal 为真是等大，不读 size；format 不给用 formatVolume。 |
| `colorBy` | `HeatmapColorBy[]` | — | 着色指标：{ key, label, unit?, digits?, format?, step? }。key 对 item.value 的键。step 是一档的宽（指标的单位），不给就按这批值的最大绝对值除以 3 再向上取到好数，载入与切指标时重算；写 1 就是 ±3%。 |
| `labels` | `MarketHeatmapLabels` | — | 工具条、面包屑、汇总读数、悬停卡片、图例读屏名、空态的文字，由调用方传。 |
| `defaultSizeBy / defaultColorBy` | `string` | — | 一开始用哪个大小、着色指标；默认各自的第一个。 |
| `defaultGrouped` | `boolean` | `true` | 一开始分不分组（有分组数据时）。 |
| `scheme` | `'classic' \| 'mono'` | `'classic'` | 配色。classic 涨跌色（跟 data-updown 互换）加中性灰；mono 同一灰阶从暗到亮。色盲友好第二步做。 |
| `formatPrice` | `(value: number) => string` | — | 悬停卡片上的价格写法；不给写 2 位小数。 |
| `selected` | `string \| null` | — | 选中的代码；选中的格子画 2px 白色内圈。 |
| `onSelect` | `(code: string) => void` | — | 点格子，或焦点在格子上按 Enter / Space。 |
| `cellActions` | `(item: HeatmapItem) => RowAction[]` | — | 格子的右键菜单（#23，一般传 symbolMenu(...)）：右键、菜单键、Shift+F10 出同一份品种菜单。格子小，不画悬停按钮。读屏名取 labels.cellMenu（可选）。不传就没有。 |

## States

- 色阶七档（−3…+3）：档 0 是以零为中心的中性灰，边界在 (k ± 0.5) × 档宽；最外两档一头开口。
- 格子够大才写字：宽 ≥ 40、高 ≥ 24 写代码，高 ≥ 40 再写一行读数；更小的靠悬停。字色按底色亮度现算黑白。
- 图例点一档：这一档的格子隐藏（位置保留，不重排），色块变淡、边界值划线；再点恢复。切着色指标时全部恢复。
- 放大：只剩这一组，大小与颜色设置保留；面包屑的「全部」或 Esc 返回。

## Don't

- 不要在件里写死中文、币种或数据集字段；指标、单位、文字都由调用方传。
- 没有数据时传空数组，件画空态，不要放样本格子。
- 不要用橙色表示数据；这件里没有橙色。

## Composition

```
MarketHeatmap（figure）
  汇总读数（只数 | 上涨 | 下跌）+ 面包屑
  工具条（大小 | 颜色 | 视图，分段控件）
  图（group）
    组块（组名按钮）
      格子（button：代码 + 读数）
    悬停卡片（徽标 + 代码 + 名称；价格、各着色指标、大小指标、分组）
  图例（七个按钮：色块 + 档中心值）
```

## Keyboard

- `Tab`：在组之间走（每组一个停靠点，组名按钮也是）
- `← → ↑ ↓`：在组内的格子间走，焦点所在格子出悬停卡片
- `Enter / Space`：选中当前格子
- `Esc`：放大状态下返回全部
