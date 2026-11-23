// SPDX-License-Identifier: MIT
import { useRef } from 'react'
import { Button, cn, useEnterMarks, useFlipList, useStatusFlash, useValueFlash } from '../../src/index'
import { LiveToggle } from '../LiveToggle'
import { chance, pick, randomInt, randomWalk, useLiveTicker, type Rng } from '../live-sim'

type Quote = { id: string; name: string; prev: number; price: number; status: '封板' | '炸板' | '回封' }

const POOL = ['云端科技', '蓝海能源', '启明半导体', '远山医药', '星河传媒', '北辰新材', '海潮航运', '听雨软件']
const START: Quote[] = [
  { id: '600101', name: '长风电力', prev: 12.4, price: 12.52, status: '封板' },
  { id: '600202', name: '瀚海重工', prev: 8.9, price: 8.86, status: '封板' },
  { id: '600303', name: '金石化工', prev: 21.3, price: 21.58, status: '封板' },
  { id: '600404', name: '澄明生物', prev: 33.8, price: 33.49, status: '封板' },
  { id: '600505', name: '朗月光电', prev: 5.6, price: 5.63, status: '封板' },
]
const MAX_ROWS = 7
const pct = (q: Quote) => ((q.price - q.prev) / q.prev) * 100

/** 一个节拍：价格随机游走；偶尔来一只新的；偶尔某只封板的炸板、炸板的回封；最后按涨幅从高到低排。 */
function step(rows: Quote[], rng: Rng, tick: number): Quote[] {
  let next = rows.map((q) => {
    const moved = randomWalk(q.price, rng, 0.006)
    const price = moved === q.price ? Math.round((q.price + (rng() < 0.5 ? -0.01 : 0.01)) * 100) / 100 : moved
    return { ...q, price }
  })
  if (chance(rng, 0.35)) {
    const i = randomInt(rng, next.length)
    const q = next[i]!
    next[i] = { ...q, status: q.status === '炸板' ? '回封' : '炸板' }
  }
  if (chance(rng, 0.3)) {
    const prev = Math.round((4 + rng() * 40) * 100) / 100
    const fresh: Quote = {
      id: String(600600 + tick),
      name: pick(rng, POOL),
      prev,
      price: Math.round(prev * (1 + (rng() - 0.3) * 0.08) * 100) / 100,
      status: '封板',
    }
    next = [...next, fresh]
  }
  next.sort((a, b) => pct(b) - pct(a))
  // 太多就丢掉涨幅最低的一行，但刚来的那只不丢（至少让它被看见一次）。
  const newcomer = next.find((q) => q.id === String(600600 + tick))
  while (next.length > MAX_ROWS) {
    const drop = next.map((q) => q !== newcomer).lastIndexOf(true)
    next.splice(drop, 1)
  }
  return next
}

function Row({ q, entering }: { q: Quote; entering: boolean }) {
  const price = useValueFlash(q.price)
  const status = useStatusFlash(q.status)
  const change = pct(q)
  return (
    <div
      role="row"
      data-live-id={q.id}
      className={cn('live-row', entering && 'k-live-enter')}
      data-entering={entering || undefined}
      style={{ display: 'grid', gridTemplateColumns: '64px 1fr 72px 72px 56px', gap: 8, padding: '4px 8px' }}
    >
      <span role="cell" style={{ color: 'var(--ink-300)', font: 'var(--text-data) var(--font-num)' }}>
        {q.id}
      </span>
      <span role="cell">{q.name}</span>
      <span
        key={`price-${price.key}`}
        role="cell"
        className="k-live-flash"
        data-flash={price.flash ?? undefined}
        data-slot="live-price"
        style={{ textAlign: 'right', font: 'var(--text-data) var(--font-num)' }}
      >
        {q.price.toFixed(2)}
      </span>
      <span
        role="cell"
        style={{
          textAlign: 'right',
          font: 'var(--text-data) var(--font-num)',
          color: change >= 0 ? 'var(--pnl-up)' : 'var(--pnl-down)',
        }}
      >
        {change >= 0 ? '+' : ''}
        {change.toFixed(2)}%
      </span>
      <span
        key={`status-${status.key}`}
        role="cell"
        // 炸板是要人去看的事，用警示色闪两下；回封是好消息，只闪一下涨色。
        className={cn(status.flash && (q.status === '炸板' ? 'k-live-alert' : 'k-live-flash'))}
        data-flash={status.flash && q.status !== '炸板' ? 'up' : undefined}
        data-slot="live-status"
        style={{ textAlign: 'center' }}
      >
        {q.status}
      </span>
    </div>
  )
}

// 一个小报价表：开着实时，价格变了闪涨跌色，行按涨幅重排（FLIP 换位），偶尔来一只新的高亮一阵，某只状态变「炸板」警示闪。
export function LiveUsage() {
  const { state: rows, advance } = useLiveTicker(START, step, { intervalMs: 1400 })
  const list = useRef<HTMLDivElement>(null)
  const ids = rows.map((q) => q.id)
  const entering = useEnterMarks(ids)
  useFlipList(list, ids)
  return (
    <div style={{ display: 'grid', gap: 12, width: 480 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <LiveToggle labels={{ group: '数据刷新', live: '实时', paused: '暂停' }} />
        <Button size="sm" onClick={advance}>
          走一步
        </Button>
      </div>
      <div role="table" aria-label="涨停板报价" ref={list} data-slot="live-table">
        {rows.map((q) => (
          <Row key={q.id} q={q} entering={entering.has(q.id)} />
        ))}
      </div>
    </div>
  )
}
