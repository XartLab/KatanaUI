// SPDX-License-Identifier: MIT
// 市场浏览器（#245 模块 2）的演示。数据都是演示用的固定值。
import { MarketBrowserUsage } from '../usage/MarketBrowserUsage.tsx'
import { Row } from './parts'

export function MarketBrowserDemo() {
  return (
    <Row name="搜索 · 分类页签（自选 / 全部 / 主流币 / Meme）· 星标 · 点价格或涨跌列头排序 · 点行选品种">
      <MarketBrowserUsage />
    </Row>
  )
}
