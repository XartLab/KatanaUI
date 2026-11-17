// SPDX-License-Identifier: MIT
// 关键数据：标题（带「›」，可点）加三列网格，每项一个灰色小标签（带「›」，可点）、一个大号数值（可带单位小字）、可选一枚徽标。
// 布局参照 TradingView 品种页的 Key stats（主会话 2026-11-15 在真实浏览器里实测 /symbols/NASDAQ-AAPL/，只取布局，不抄代码）；
// 数值是字符串或数字时，变了闪一下涨跌色（共用层 lib/live-readout.tsx）；徽标（如 MEGA CAP）用中性灰胶囊，不用 TV 的紫色。文字、数值与单位都由调用方写好传来，件不算。
import type { ReactNode } from 'react'
import { cn } from '../lib/cn.ts'
import { ReadoutFlash } from '../lib/live-readout.tsx'

export type KeyStatItem = {
  key: string
  label: string
  /** 已经格式化好的数值；没有写「—」或不给（画「—」）。 */
  value?: ReactNode
  /** 数值后面的小字单位（USD、%）。 */
  unit?: string
  /** 数值下面的徽标（如 MEGA CAP）。 */
  badge?: string
}

export type KeyStatsProps = {
  title: string
  items: readonly KeyStatItem[]
  /** 给了：标题与每一项的标签带「›」、可点。 */
  onTitle?: () => void
  onItem?: (item: KeyStatItem) => void
  columns?: number
  className?: string
}

const Chevron = () => (
  <span className="k-keystats-chev" aria-hidden="true">
    ›
  </span>
)

export function KeyStats({ title, items, onTitle, onItem, columns = 3, className }: KeyStatsProps) {
  return (
    <section className={cn('k-keystats', className)} data-slot="key-stats" aria-label={title}>
      <h3 className="k-keystats-title">
        {onTitle ? (
          <button type="button" onClick={onTitle}>
            {title}
            <Chevron />
          </button>
        ) : (
          title
        )}
      </h3>
      <dl className="k-keystats-grid" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
        {items.map((item) => (
          <div key={item.key} className="k-keystats-item" data-slot="key-stat" data-key={item.key}>
            <dt>
              {onItem ? (
                <button type="button" onClick={() => onItem(item)}>
                  {item.label}
                  <Chevron />
                </button>
              ) : (
                item.label
              )}
            </dt>
            <dd>
              <span className="k-keystats-value">
                {typeof item.value === 'string' || typeof item.value === 'number' ? (
                  <ReadoutFlash text={item.value} />
                ) : (
                  (item.value ?? '—')
                )}
              </span>
              {item.unit ? <small>{item.unit}</small> : null}
              {item.badge ? <span className="k-keystats-badge">{item.badge}</span> : null}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
