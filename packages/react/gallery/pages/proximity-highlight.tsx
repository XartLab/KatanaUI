// SPDX-License-Identifier: MIT
// 接近度悬停（#224）的演示：一张普通列表与一个普通菜单共用同一个钩子，高亮底色在行间滑动；数据是编的示例。
import { useRef } from 'react'
import { useProximityHighlight } from '../../src/index.ts'

const ROWS = [
  'AAPL · Apple Inc.',
  'AMD · Advanced Micro Devices',
  '600519.XSHG · 贵州茅台',
  'BTC-USDT · 永续',
  'TSLA · Tesla, Inc.',
]

function ProximityList({ label }: { label: string }) {
  const ref = useRef<HTMLUListElement>(null)
  const { highlightRef } = useProximityHighlight(ref, {
    itemSelector: '[data-row]',
    activeSelector: '[data-row][data-active]',
  })
  return (
    <ul
      ref={ref}
      aria-label={label}
      data-testid="proximity-list"
      style={{
        position: 'relative',
        margin: 0,
        padding: 6,
        listStyle: 'none',
        width: 260,
        borderRadius: 10,
        border: '1px solid var(--k-separable-subtle-borderColor)',
      }}
    >
      <div ref={highlightRef} aria-hidden="true" className="k-proximity-highlight" />
      {ROWS.map((row) => (
        <li
          key={row}
          data-row=""
          className="k-text-data"
          style={{
            position: 'relative',
            zIndex: 1,
            height: 32,
            display: 'flex',
            alignItems: 'center',
            padding: '0 8px',
          }}
        >
          {row}
        </li>
      ))}
    </ul>
  )
}

export function ProximityHighlightDemo() {
  return (
    <div className="gal-stack">
      <ProximityList label="示例列表" />
      <p className="gal-note">指针在行间移动，底色滑过去；快速划过不抖。数据是编的示例。</p>
    </div>
  )
}
