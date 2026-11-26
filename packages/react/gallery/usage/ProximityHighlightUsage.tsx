// SPDX-License-Identifier: MIT
import { useRef } from 'react'
import { useProximityHighlight } from '../../src/index'

const ROWS = ['AAPL', 'AMD', 'BTC-USDT', 'TSLA']

export function ProximityHighlightUsage() {
  const ref = useRef<HTMLUListElement>(null)
  // 容器要 position: relative；底色元素放在容器里排第一个，行（position: relative）盖在它上面，行自己不画悬停底色。
  const { highlightRef } = useProximityHighlight(ref, { itemSelector: '[data-row]' })
  return (
    <ul
      ref={ref}
      aria-label="演示列表"
      style={{ position: 'relative', margin: 0, padding: 6, listStyle: 'none', width: 220 }}
    >
      <div ref={highlightRef} aria-hidden="true" className="k-proximity-highlight" />
      {ROWS.map((row) => (
        <li
          key={row}
          data-row=""
          style={{ position: 'relative', height: 32, display: 'flex', alignItems: 'center', padding: '0 8px' }}
        >
          {row}
        </li>
      ))}
    </ul>
  )
}
