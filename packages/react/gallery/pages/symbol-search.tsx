// SPDX-License-Identifier: MIT
// 品种搜索的演示（#77 第 1 条）：代码、名称、交易所是写死的演示数据，不是行情；onQuery 故意延迟 150ms，好看到加载态。
import { useRef, useState } from 'react'
import {
  SymbolSearchDialog,
  type SymbolSearchItem,
  type SymbolSearchLabels,
  type SymbolSearchSegment,
} from '../../src/blocks/index.ts'
import { useTypeToSearch } from '../../src/index.ts'
import { focusRing } from '../../src/lib/focus.ts'

export const DEMO_SYMBOLS: readonly SymbolSearchItem[] = [
  {
    id: 'BINANCE:BTCUSDT',
    symbol: 'BTCUSDT',
    name: 'Bitcoin / TetherUS',
    exchange: 'Binance',
    market: 'crypto',
    type: '现货',
  },
  {
    id: 'OKX:BTCUSDT.P',
    symbol: 'BTCUSDT.P',
    name: 'BTCUSDT 永续合约',
    exchange: 'OKX',
    market: 'crypto',
    type: '永续',
  },
  {
    id: 'BINANCE:ETHUSDT',
    symbol: 'ETHUSDT',
    name: 'Ethereum / TetherUS',
    exchange: 'Binance',
    market: 'crypto',
    type: '现货',
  },
  {
    id: 'BINANCE:ADAUSDT',
    symbol: 'ADAUSDT',
    name: 'Cardano / TetherUS',
    exchange: 'Binance',
    market: 'crypto',
    type: '现货',
  },
  { id: 'NASDAQ:AAPL', symbol: 'AAPL', name: 'Apple Inc.', exchange: 'NASDAQ', market: 'stock', type: '股票' },
  {
    id: 'NASDAQ:AMD',
    symbol: 'AMD',
    name: 'Advanced Micro Devices',
    exchange: 'NASDAQ',
    market: 'stock',
    type: '股票',
  },
  { id: 'NASDAQ:NVDA', symbol: 'NVDA', name: 'NVIDIA Corporation', exchange: 'NASDAQ', market: 'stock', type: '股票' },
  { id: 'SSE:600519', symbol: '600519', name: '贵州茅台', exchange: 'SSE', market: 'stock', type: '股票' },
  { id: 'SZSE:000001', symbol: '000001', name: '平安银行', exchange: 'SZSE', market: 'stock', type: '股票' },
  { id: 'NASDAQ:QQQ', symbol: 'QQQ', name: 'Invesco QQQ Trust', exchange: 'NASDAQ', market: 'fund', type: 'ETF' },
  { id: 'AMEX:SPY', symbol: 'SPY', name: 'SPDR S&P 500 ETF', exchange: 'AMEX', market: 'fund', type: 'ETF' },
  { id: 'CME:ES1!', symbol: 'ES1!', name: 'E-mini S&P 500 连续', exchange: 'CME', market: 'futures', type: '期货' },
  { id: 'COMEX:GC1!', symbol: 'GC1!', name: '黄金期货 连续', exchange: 'COMEX', market: 'futures', type: '期货' },
  { id: 'SP:SPX', symbol: 'SPX', name: 'S&P 500 指数', exchange: 'S&P', market: 'index', type: '指数' },
  { id: 'SSE:000300', symbol: '000300', name: '沪深 300', exchange: 'SSE', market: 'index', type: '指数' },
]

export const DEMO_SEGMENTS: readonly SymbolSearchSegment[] = [
  { id: 'all', label: '全部' },
  { id: 'stock', label: '股票' },
  { id: 'fund', label: '基金' },
  { id: 'futures', label: '期货' },
  { id: 'crypto', label: '加密' },
  { id: 'index', label: '指数' },
]

export const DEMO_LABELS: SymbolSearchLabels = {
  title: '品种搜索',
  placeholder: '代码或名称',
  segments: '市场',
  recent: '最近搜索',
  results: '结果',
  empty: '没有匹配的品种',
  loading: '搜索中…',
  error: '搜索出错，稍后再试',
  clear: '清空',
  resultCount: (count) => `${count} 个结果`,
}

/** 演示用的搜索：代码前缀优先，再名称包含；按分段过滤，最多 20 条。 */
export function demoQuery(query: string, segment: string): SymbolSearchItem[] {
  const needle = query.trim().toLowerCase()
  const pool = DEMO_SYMBOLS.filter((item) => segment === 'all' || item.market === segment)
  if (!needle) return pool.slice(0, 8)
  const prefix = pool.filter((item) => item.symbol.toLowerCase().startsWith(needle))
  const rest = pool.filter(
    (item) =>
      !prefix.includes(item) &&
      (item.symbol.toLowerCase().includes(needle) || (item.name ?? '').toLowerCase().includes(needle)),
  )
  return [...prefix, ...rest].slice(0, 20)
}

const delay = (ms: number, signal: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    const timer = setTimeout(resolve, ms)
    signal.addEventListener('abort', () => {
      clearTimeout(timer)
      reject(signal.reason)
    })
  })

export function SymbolSearchDemo() {
  const area = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [initial, setInitial] = useState('')
  const [picked, setPicked] = useState<SymbolSearchItem | null>(null)
  const [recent, setRecent] = useState<SymbolSearchItem[]>([])
  useTypeToSearch(area, {
    enabled: !open,
    onOpen: (key) => {
      setInitial(key)
      setOpen(true)
    },
  })
  return (
    <div className="gal-stack" style={{ width: '100%', maxWidth: 640 }}>
      <div
        ref={area}
        tabIndex={0}
        role="group"
        aria-label="演示图表：在这里直接打字打开品种搜索"
        data-testid="symbol-search-area"
        className={focusRing}
        // 文档站的页不在 Tailwind 的扫描范围里（theme.css 只 @source 包内目录），版面用内联样式。
        style={{
          height: 180,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 10,
          border: '1px solid var(--k-separable-subtle-borderColor)',
          background: 'var(--k-surface-sunken-background)',
        }}
      >
        <span className="k-text-data" style={{ color: 'var(--k-content-secondary-foreground)' }}>
          {picked ? `${picked.exchange}:${picked.symbol}` : '点一下这里，再直接打字（比如 a、btc、600）'}
        </span>
      </div>
      <p className="gal-note" data-testid="symbol-search-picked">
        {picked ? `已选：${picked.id}` : '还没有选品种'}
      </p>
      <p className="gal-note">演示数据：代码、名称、交易所都是写死的，不是行情；搜索故意延迟 150ms。</p>
      <SymbolSearchDialog
        open={open}
        onOpenChange={setOpen}
        defaultQuery={initial}
        segments={DEMO_SEGMENTS}
        recent={recent}
        onRecentChange={setRecent}
        labels={DEMO_LABELS}
        onQuery={async (query, segment, signal) => {
          await delay(150, signal)
          return demoQuery(query, segment)
        }}
        onSelect={setPicked}
      />
    </div>
  )
}
