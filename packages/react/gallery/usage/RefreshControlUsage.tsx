// SPDX-License-Identifier: MIT
import { useState } from 'react'
import { RefreshControl } from '../../src/index'

// 照 TradingView 筛选器的三档：10 秒 / 1 分钟 / 不刷新（演示里「刷新」等 600ms 假装在拉数据）。
const OPTIONS = [
  { value: 10_000, label: '10 秒' },
  { value: 60_000, label: '1 分钟' },
  { value: 0, label: '不刷新' },
]

export function RefreshControlUsage() {
  const [interval, setRefreshInterval] = useState(10_000)
  const [last, setLast] = useState<number | null>(() => Date.now())
  const [refreshing, setRefreshing] = useState(false)
  const [count, setCount] = useState(0)
  const refresh = () => {
    setRefreshing(true)
    setTimeout(() => {
      setLast(Date.now())
      setCount((n) => n + 1)
      setRefreshing(false)
    }, 600)
  }
  return (
    <div data-gallery-refresh data-count={count}>
      <RefreshControl
        options={OPTIONS}
        interval={interval}
        onIntervalChange={setRefreshInterval}
        lastRefreshed={last}
        onRefresh={refresh}
        refreshing={refreshing}
        labels={{ interval: '自动刷新', refresh: '立即刷新', last: '上次', next: '下次' }}
      />
    </div>
  )
}
