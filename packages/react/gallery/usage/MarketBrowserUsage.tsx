// SPDX-License-Identifier: MIT
import { useState } from 'react'
import { MarketBrowser, type MarketRow } from '../../src/quotes'

// 演示数据（固定，不是行情）。
const row = (symbol: string, name: string, last: number, changePct: number): MarketRow => ({
  id: symbol,
  symbol,
  name,
  last,
  change: Number((last - last / (1 + changePct / 100)).toFixed(4)),
  changePct,
})

const ROWS: readonly MarketRow[] = [
  { ...row('BTC-USDT', '比特币', 94820.5, 1.62), favorite: true },
  row('ETH-USDT', '以太坊', 3312.4, -0.84),
  { ...row('SOL-USDT', 'Solana', 214.18, 3.27), favorite: true },
  row('DOGE-USDT', '狗狗币', 0.3921, -2.15),
  row('XRP-USDT', '瑞波币', 2.4417, 0.42),
]
const inGroup = (ids: readonly string[]) => ROWS.filter((item) => ids.includes(item.id))

const price = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })

export function MarketBrowserUsage() {
  const [stars, setStars] = useState(new Set(ROWS.filter((item) => item.favorite).map((item) => item.id)))
  const [picked, setPicked] = useState('')
  const mark = (rows: readonly MarketRow[]) => rows.map((item) => ({ ...item, favorite: stars.has(item.id) }))
  return (
    <div style={{ width: 420 }}>
      <MarketBrowser
        categories={[
          { id: 'favorites', label: '自选', rows: mark(ROWS).filter((item) => item.favorite) },
          { id: 'all', label: '全部', rows: mark(ROWS) },
          { id: 'major', label: '主流币', rows: mark(inGroup(['BTC-USDT', 'ETH-USDT', 'SOL-USDT'])) },
          { id: 'meme', label: 'Meme', rows: mark(inGroup(['DOGE-USDT'])) },
        ]}
        defaultValue="all"
        formatPrice={price.format}
        labels={{
          search: '搜索币对',
          categories: '市场分类',
          list: '市场',
          columns: { symbol: '币对', last: '最新价', change: '24h 涨跌' },
          empty: '还没有自选，点行首的星标添加。',
          noResults: '没有匹配的币对。',
          favorite: (item) => `自选 ${item.symbol}`,
        }}
        onToggleFavorite={(item, favorite) =>
          setStars((prev) => {
            const next = new Set(prev)
            if (favorite) next.add(item.id)
            else next.delete(item.id)
            return next
          })
        }
        onSelect={(item) => setPicked(item.symbol)}
      />
      <p data-gallery-picked={picked} style={{ margin: '8px 0 0', fontSize: 12 }}>
        {picked ? `已选：${picked}` : '点一行选品种'}
      </p>
    </div>
  )
}
