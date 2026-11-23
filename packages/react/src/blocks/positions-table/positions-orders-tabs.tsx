// SPDX-License-Identifier: MIT
/**
 * Tab shell that puts PositionsTable and OrdersTable in one panel ("positions | working orders"), each tab carrying its count.
 * 持仓与委托共用的页签外壳（#104）：「持仓 3 | 委托 5」两页，页签上带数量；两件各自照常用，这里只是把它们摆进同一个面板。
 * 件不替调用方收数据：两件的 props 原样透传（positions 与 orders 在各自的 props 里）。
 */
import { useState } from 'react'
import { cn } from '../../lib/cn.ts'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../primitives/tabs.tsx'
import { OrdersTable, type OrdersTableProps } from '../orders-table/orders-table.tsx'
import { PositionsTable, type PositionsTableProps } from './positions-table.tsx'

export type PositionsOrdersTab = 'positions' | 'orders'

/** Texts of the shell. */
export type PositionsOrdersTabsLabels = {
  /** Accessible name of the tab list. 页签组的读屏名。 */
  tabs: string
  /** Tab names with the count (「持仓 3」). 页签上的字，带数量。 */
  positions: (count: number) => string
  orders: (count: number) => string
}

export type PositionsOrdersTabsProps = {
  /** Props of the positions tab, passed on to PositionsTable. */
  positions: PositionsTableProps
  /** Props of the orders tab, passed on to OrdersTable. */
  orders: OrdersTableProps
  /** Texts of the shell. */
  labels: PositionsOrdersTabsLabels
  /** Controlled tab; omit for uncontrolled. */
  tab?: PositionsOrdersTab
  /** Tab shown first when uncontrolled. */
  defaultTab?: PositionsOrdersTab
  /** Called when the tab changes. */
  onTabChange?: (tab: PositionsOrdersTab) => void
  /** Extra class name on the root. */
  className?: string
}

export function PositionsOrdersTabs({
  positions,
  orders,
  labels,
  tab,
  defaultTab = 'positions',
  onTabChange,
  className,
}: PositionsOrdersTabsProps) {
  const [inner, setInner] = useState<PositionsOrdersTab>(defaultTab)
  const current = tab ?? inner
  return (
    <Tabs
      className={cn('k-pot', className)}
      data-slot="positions-orders-tabs"
      value={current}
      onValueChange={(next) => {
        setInner(next as PositionsOrdersTab)
        onTabChange?.(next as PositionsOrdersTab)
      }}
    >
      <TabsList variant="line" aria-label={labels.tabs}>
        <TabsTrigger value="positions">{labels.positions(positions.positions.length)}</TabsTrigger>
        <TabsTrigger value="orders">{labels.orders(orders.orders.length)}</TabsTrigger>
      </TabsList>
      <TabsContent value="positions">
        <PositionsTable {...positions} />
      </TabsContent>
      <TabsContent value="orders">
        <OrdersTable {...orders} />
      </TabsContent>
    </Tabs>
  )
}
