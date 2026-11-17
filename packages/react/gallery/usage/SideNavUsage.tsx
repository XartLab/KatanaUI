// SPDX-License-Identifier: MIT
import { useState } from 'react'
import { SideNav } from '../../src/index'

const GROUPS = [
  {
    id: 'markets',
    title: 'Markets',
    items: [
      { id: 'watchlist', label: 'Watchlist', href: '#watchlist' },
      { id: 'heatmap', label: 'Heatmap', href: '#heatmap' },
      { id: 'screener', label: 'Screener', href: '#screener' },
    ],
  },
  {
    id: 'trading',
    title: 'Trading',
    items: [
      { id: 'positions', label: 'Positions', href: '#positions' },
      { id: 'orders', label: 'Orders', href: '#orders' },
      { id: 'bots', label: 'Bots', href: '#bots', keywords: 'automation strategies' },
    ],
  },
]

// 件不管路由：这里用点击记住当前项；应用里 current 来自路由。
export function SideNavUsage() {
  const [current, setCurrent] = useState('heatmap')
  return (
    <div
      style={{ height: 360, width: 280 }}
      onClickCapture={(event) => {
        const id = (event.target as HTMLElement).closest('a')?.getAttribute('href')?.slice(1)
        if (id) {
          event.preventDefault()
          setCurrent(id)
        }
      }}
    >
      <SideNav groups={GROUPS} current={current} searchLabel="Search" emptyLabel="No match" aria-label="Workspace" />
    </div>
  )
}
