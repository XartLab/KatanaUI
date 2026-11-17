# Live

数据在动时的四个钩子，照行情终端（TradingView、Bloomberg、同花顺）的做法：useValueFlash 数值变了给涨 / 跌方向（闪 600ms，同一格 1 秒内最多一次）；useEnterMarks 认出新来的条目（高亮 1200ms）；useFlipList 顺序变了让行平滑换位（FLIP，240ms）；useStatusFlash 状态变了给一次性的闪（炸板这类用警示色）。皮肤是 ui.css 里的 .k-live-flash / .k-live-enter / .k-live-alert，涨跌色跟「涨跌颜色」设置走；时长是 token --dur-flash / --dur-enter / --dur-reorder。RollingText、MarketHeatmap、Watchlist 已经走这一层。

## Provide

`*` marks a required prop.

### live

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `useValueFlash(value, { enabled?, gapMs? })` | `{ flash: "up" \| "down" \| null, key: number }` | — | 变大 up、变小 down；key 每闪一次加一，放在元素的 key 上让动画重放。首次渲染、null / NaN、1 秒内的第二次变化都不闪；闪完 flash 自己回到 null。 |
| `useEnterMarks(ids)` | `ReadonlySet<string>` | — | 本次新出现的 id。首次渲染的全算旧的；1200ms 后自动清掉；走了又回来的算新的。 |
| `useFlipList(containerRef, ids)` | `void` | — | ids 的顺序变了，让容器里带 data-live-id 的子元素从旧位置平滑移到新位置（transform，240ms，--ease-snappy）。没渲染的行与新行跳过。 |
| `useStatusFlash(status)` | `{ flash: boolean, key: number }` | — | 状态字符串变了，flash 为 true 约 600ms；key 每变一次加一。首次渲染与 null 不闪；不节流。 |
| `LIVE_FLASH_MS / LIVE_ENTER_MS / LIVE_REORDER_MS / LIVE_FLASH_GAP_MS` | `number` | — | 600 / 1200 / 240 / 1000：毫秒数，与 token 一致（单测盯着）；最后一个只有 JS 用。 |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { useRef } from 'react'
import { Button, cn, useEnterMarks, useFlipList, useStatusFlash, useValueFlash } from '@katana-ui/react'
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
```

## States

- 数值闪：data-flash="up" | "down" 的 .k-live-flash，背景从涨 / 跌色的弱化档淡到透明
- 新条目：.k-live-enter，左侧 2px 强调线加底色高亮，1200ms 淡出
- 状态警示：.k-live-alert，炸板这类用琥珀（data-tone="negative" 用跌红）闪两下
- 没有动画的环境（单测、服务端渲染）：钩子照常给出状态，只是没人播

## Don't

- 不要自己再写一套 @keyframes 闪烁：时长与颜色都从这一层取
- 不要给每一格都加高亮：只有变了的才闪，同一格 1 秒内最多一次
- 用户滚离顶部时不要把新条目插进视野：只计数，点「新增 n 条」再合入（插入会把正在读的内容顶走）
- 不要为重排动画去改 DOM 顺序之外的东西：useFlipList 只写 transform，不碰 className 与 style

## Composition

```
useValueFlash / useStatusFlash（返回 flash 与 key）
  .k-live-flash / .k-live-alert
useEnterMarks（返回新 id 集合）
  .k-live-enter
useFlipList（容器 ref + ids，子元素 data-live-id）
```
