// SPDX-License-Identifier: MIT
import { NetBuyBar, type DragonTigerItem } from '../../src/blocks'

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
