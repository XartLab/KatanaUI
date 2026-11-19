// SPDX-License-Identifier: MIT
// MarketHeatmap 的公开类型：格子数据、大小与着色指标、文案、属性。从 market-heatmap.tsx 拆出（G5），名字与形状不变。
import type { RowAction } from '../quotes/row-actions.tsx'

type HeatmapItemFields = {
  name: string
  /** 分组（行业）；不给的归到 labels.other。 */
  group?: string
  /** 品种徽标的图片地址；不给就画字母圆标。 */
  logo?: string
  price?: number
  /** 各个大小指标的值，键是 HeatmapSizeBy.key。不是正数的格子不画。 */
  size: Record<string, number>
  /** 各个着色指标的值，键是 HeatmapColorBy.key。null 是没有数（画中性灰）。 */
  value: Record<string, number | null>
}

/** 一格的数据。品种字段叫 symbol（G5 统一）；旧名 code 留一个版本（@deprecated，运行时映射到 symbol）。 */
export type HeatmapItem = HeatmapItemFields &
  (
    | {
        /** 品种代码，列表里唯一。 */
        symbol: string
        /** @deprecated 用 `symbol`（G5 统一品种字段名）；下一个版本删。 */
        code?: string
      }
    | {
        symbol?: undefined
        /** @deprecated 用 `symbol`（G5 统一品种字段名）；下一个版本删。 */
        code: string
      }
  )

/** 件内部用的一格：symbol 已从旧名 code 补上。 */
export type HeatmapEntry = HeatmapItem & { symbol: string }

export type HeatmapSizeBy = {
  key: string
  label: string
  /** 等大：每格一样大，不读 size。 */
  equal?: boolean
  /** 大小写成什么样；不给用 formatVolume（835.49 K、2.95 M、7.29 B）。 */
  format?: (value: number) => string
}

export type HeatmapColorBy = {
  key: string
  label: string
  /** 单位，接在数后面（「%」）。 */
  unit?: string
  /** 小数位，默认 2。 */
  digits?: number
  /** 整个写法自己定（覆盖 unit 与 digits）。 */
  format?: (value: number) => string
  /** 一档的宽（指标的单位）。不给就按这批值的最大绝对值自动取好数（载入或切指标时重算）；固定写成 1 就是 TradingView 的 ±3%。 */
  step?: number
}

export type HeatmapScheme = 'classic' | 'mono'

export type MarketHeatmapLabels = {
  sizeBy: string
  colorBy: string
  view: string
  grouped: string
  flat: string
  /** 面包屑的根（放大前是「全部」）。 */
  all: string
  /** 没有分组的品种归到这个名字下。 */
  other: string
  price: string
  group: string
  /** 顶上汇总读数的名字：只数、上涨、下跌。 */
  summary: { count: string; up: string; down: string }
  /** 图例一档的读屏名，range 是写好的值边界，例「隐藏 -2.5% ~ -1.5% 的格子」。 */
  segment: (range: string) => string
  /** 整张图的读屏名。 */
  list: string
  empty: string
  /** 格子右键菜单的读屏名（传了 cellActions 才用）；省略时用英文。 */
  cellMenu?: string
  /**
   * 显示开关的文字（照 TradingView 热图的 logo、标题、格内数值三个开关，帮助中心「TradingView heatmaps」2026-11-15 读）；
   * 不传就没有这一组开关，格子照旧（徽标 + 代码 + 着色指标的读数）。
   */
  display?: HeatmapDisplayLabels
  /** 全屏按钮的读屏名与提示（容器 requestFullscreen，TradingView 热图有全屏）；不传就没有这个按钮。 */
  fullscreen?: string
  /** 数据集下拉的读屏名（传了 datasets 才用）。 */
  dataset?: string
  /** 「在选股器打开」按钮的字（传了 onOpenInScreener 才用）。 */
  openInScreener?: string
}

export type HeatmapDisplayLabels = {
  logo: string
  /** 标题：无 / 代码 / 全名。 */
  title: { label: string; none: string; code: string; name: string }
  /** 格内数值：无 / 价格 / 当前大小指标的值（成交量、成交额…，等大时没有这项）/ 着色指标的读数（涨跌幅）。 */
  value: { label: string; none: string; price: string; size: string; change: string }
}

export type HeatmapTitleMode = 'none' | 'code' | 'name'
export type HeatmapValueMode = 'none' | 'price' | 'size' | 'change'

export type MarketHeatmapProps = {
  items: readonly HeatmapItem[]
  sizeBy: readonly HeatmapSizeBy[]
  colorBy: readonly HeatmapColorBy[]
  labels: MarketHeatmapLabels
  defaultSizeBy?: string
  defaultColorBy?: string
  /** 一开始分不分组（有分组数据时）；默认分组。 */
  defaultGrouped?: boolean
  /** 配色：classic 涨跌色（跟 data-updown）、mono 单色灰阶。色盲友好第二步做。 */
  scheme?: HeatmapScheme
  /** 价格怎么写；不给按 2 位小数。 */
  formatPrice?: (value: number) => string
  selected?: string | null
  onSelect?: (code: string) => void
  /** 格子的右键菜单（#23，一般传 symbolMenu(...)）：右键、菜单键、Shift+F10 出同一份品种菜单；不传就没有。格子小，不画悬停按钮。 */
  cellActions?: (item: HeatmapEntry) => readonly RowAction[]
  /**
   * 工具条：dropdowns（默认）= 数据集、大小、颜色、分组四个下拉（照 TradingView 热图，用户 2026-11-15 实测），
   * segments = 每个指标一排分段按钮（指标少、想一眼看全时用）。
   */
  toolbar?: 'dropdowns' | 'segments'
  /** 数据集（标普 500、纳斯达克 100…）：传了就在工具条最左出一个下拉，换了调 onDatasetChange（数据由调用方换）。 */
  datasets?: readonly { key: string; label: string }[]
  dataset?: string
  onDatasetChange?: (key: string) => void
  /** 工具条最右的「在选股器打开」按钮；调用方决定怎么打开。 */
  onOpenInScreener?: () => void
  className?: string
}
