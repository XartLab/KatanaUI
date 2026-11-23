# NetBuyBar

开盘啦「实时 / 深度龙虎榜」对照（#11）：一行一只上榜票：徽标与代码、涨跌幅、零轴居中的净买条（净买往右、净卖往左，6px 高）、净买额（带正负号）、买入与卖出合计，行下一行小字写上榜原因；点开一行摊开席位对照：左买入前几、右卖出前几，每席一根 4px 条（按这只票的席位最大额）与金额，机构席位带「机构」描边 Tag。零轴条与对称刻度照 AttributionBars 的模型（刻度 = 最大 |净买| 向上取到一位有效数字）。

## Provide

`*` marks a required prop.

### NetBuyBar

上榜个股 DragonTigerItem、席位 DragonSeat 见类型；净买额由调用方给（买入 − 卖出），件不重算。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `items` * | `readonly DragonTigerItem[]` | — | Stocks in the caller's order (usually by net buy). |
| `labels` * | `NetBuyBarLabels` | — | Texts. |
| `formatAmount` | `(value: number) => string` | `formatVolume` | How an amount is written (sign included for net); defaults to the short volume form. |
| `expanded` | `string \| null` | — | Code of the opened row (controlled); null for none. |
| `defaultExpanded` | `string \| null` | `null` | Uncontrolled: the row open at first. |
| `onExpandedChange` | `(code: string \| null) => void` | — | Called when a row is opened or closed. |
| `className` | `string` | — | Extra class name on the root. |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { NetBuyBar, type DragonTigerItem } from '@katana-ui/react/blocks'

// 演示数据：上榜个股、金额与席位名都是编出来的，不是真实的龙虎榜。
export const DRAGON_ITEMS: readonly DragonTigerItem[] = [
  {
    code: '300401',
    name: '示例减速器',
    net: 1.86e8,
    buy: 4.12e8,
    sell: 2.26e8,
    change: 20.0,
    reason: '日涨幅偏离值达 7%',
    seats: {
      buy: [
        { name: '机构专用', amount: 1.21e8, institution: true },
        { name: '示例证券 某某路营业部', amount: 9.8e7 },
        { name: '沪股通专用', amount: 8.4e7 },
        { name: '示例证券 某某大道营业部', amount: 6.1e7 },
        { name: '机构专用', amount: 4.8e7, institution: true },
      ],
      sell: [
        { name: '示例证券 某某街营业部', amount: 7.6e7 },
        { name: '机构专用', amount: 5.9e7, institution: true },
        { name: '示例证券 某某东路营业部', amount: 4.2e7 },
        { name: '示例证券 某某西路营业部', amount: 2.6e7 },
        { name: '示例证券 某某中路营业部', amount: 2.3e7 },
      ],
    },
  },
  {
    code: '000402',
    name: '示例光模块',
    net: 6.4e7,
    buy: 2.9e8,
    sell: 2.26e8,
    change: 10.01,
    reason: '连续三日涨幅偏离 20%',
  },
  {
    code: '600403',
    name: '示例服务器',
    net: -9.3e7,
    buy: 1.1e8,
    sell: 2.03e8,
    change: -6.42,
    reason: '日跌幅偏离值达 7%',
  },
  { code: '002404', name: '示例飞控', net: -2.1e7, buy: 8.8e7, sell: 1.09e8, change: 4.3, reason: '日换手率达 20%' },
]

export function NetBuyBarUsage() {
  return (
    <div style={{ width: '100%', maxWidth: 720 }}>
      <NetBuyBar
        items={DRAGON_ITEMS}
        defaultExpanded="300401"
        labels={{
          list: '龙虎榜净买（演示数据）',
          columns: { name: '名称', change: '涨跌幅', net: '净买', buy: '买入', sell: '卖出' },
          seats: { buy: '买入前五', sell: '卖出前五' },
          institution: '机构',
          scale: (max) => `刻度 ±${(max / 1e8).toFixed(1)} 亿`,
          empty: '今天没有上榜',
        }}
        formatAmount={(v) => `${(v / 1e8).toFixed(2)} 亿`}
      />
    </div>
  )
}
```

## States

- 颜色：净买与买入席位 --k-tone-up，净卖与卖出席位 --k-tone-down；根上 data-updown="cn" 时就是买红卖绿。条用 60% 混透明，数字实色。
- 展开：行底换选中色、左侧 2px 主文字色竖条，aria-expanded 报状态；没有席位数据的行点了不展开。
- 刻度说明写在列头中间（labels.scale），只写一处。
- 空：items 为空时画空态文字。

## Don't

- 买卖颜色不要写死红绿，走 tone（data-updown 切）。
- 不要把席位排序塞进件里，席位次序照调用方给的。

## Composition

```
NetBuyBar
  列头：名称 | 涨跌幅 | 刻度说明 | 净买 | 买入 | 卖出
  list
    行（button，aria-expanded）：徽标 + 代码 + 名称 | 涨跌幅 | 零轴条 | 净买 | 买入 | 卖出
    上榜原因
    席位对照：买入前五 | 卖出前五（席位名 + 机构 Tag | 条 | 金额）
```

## Keyboard

- `Tab`：在行间移动
- `Enter / Space`：展开或收起这一行的席位
