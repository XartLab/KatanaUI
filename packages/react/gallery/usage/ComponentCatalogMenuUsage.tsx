// SPDX-License-Identifier: MIT
import { useState } from 'react'
import { ComponentCatalog, type CatalogItem } from '../../src/blocks'

const CATEGORIES = [
  { id: 'market', name: '市场信息' },
  { id: 'orders', name: '订单与仓位' },
  { id: 'trade', name: '交易面板' },
]

// 演示目录，不是库自带的组件清单。
const ITEMS: CatalogItem[] = [
  { id: 'chart', name: '图表', category: 'market', recommended: true },
  { id: 'book', name: '订单簿', category: 'market', pairsWith: ['chart'] },
  { id: 'trades', name: '最新成交', category: 'market', pairsWith: ['chart'] },
  { id: 'company', name: '公司', category: 'market', unavailable: '组件不适用于当前市场' },
  { id: 'open-orders', name: '当前委托', category: 'orders' },
  { id: 'positions', name: '当前仓位', category: 'orders' },
  { id: 'assets', name: '资产', category: 'orders' },
  { id: 'ticket', name: '交易', category: 'trade' },
]

export function ComponentCatalogMenuUsage() {
  const [used, setUsed] = useState<readonly string[]>(['chart', 'ticket'])
  return (
    <div style={{ width: 220 }}>
      <ComponentCatalog
        variant="menu"
        items={ITEMS.map((item) => ({ ...item, inUse: used.includes(item.id) }))}
        categories={CATEGORIES}
        context="chart"
        onToggle={(id) => setUsed((list) => [...list, id])}
        labels={{
          title: '添加组件',
          search: '搜索组件',
          all: '全部',
          recommended: '推荐',
          empty: '没有可添加的组件',
          inUse: '已添加此组件',
        }}
      />
    </div>
  )
}
