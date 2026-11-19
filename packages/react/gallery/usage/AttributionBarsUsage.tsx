// SPDX-License-Identifier: MIT
import { useState } from 'react'
import { AttributionBars, type AttributionItem } from '../../src/blocks'

const SAMPLE_MARK_SRC = `data:image/svg+xml;utf8,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><circle cx="16" cy="16" r="16" fill="#2a2a2a"/></svg>',
)}`

const money = (value: number) => `${value > 0 ? '+' : ''}${value.toLocaleString('en-US')}`

const ATTR_SYMBOLS: AttributionItem[] = [
  {
    key: '300750',
    label: '300750 宁德时代',
    value: 73_920,
    icon: {},
    detail: [
      { label: '持仓', value: '3' },
      { label: '账户', value: 'A B' },
    ],
  },
  { key: '00700', label: '00700 腾讯控股', value: 14_300, icon: {} },
  { key: '002475', label: '002475 立讯精密', value: 8_760, icon: {}, closed: '已平 09-18' },
  // 示意图标：自绘的 SVG，演示有图的样子。
  { key: 'BTC', label: 'BTC 比特币', value: 3_100, icon: { src: SAMPLE_MARK_SRC } },
  { key: '601012', label: '601012 隆基绿能', value: 1_640, icon: {} },
  { key: '688981', label: '688981 中芯国际', value: 480, icon: {} },
  { key: '000333', label: '000333 美的集团', value: 200, icon: {} },
  { key: '600519', label: '600519 贵州茅台', value: -11_200, icon: {} },
  { key: 'IF2510', label: 'IF2510 沪深300 期货', value: -32_580, icon: {} },
  { key: 'fee', label: '费用 · 税', value: -2_000, kind: 'fee' },
]

const ATTR_ACCOUNTS: AttributionItem[] = [
  { key: 'A', label: '账户 A', value: 38_200 },
  { key: 'B', label: '账户 B', value: 9_400 },
  { key: 'F', label: '账户 F', value: -1_160 },
  { key: 'fee', label: '费用 · 税', value: -2_000, kind: 'fee' },
]

const ATTR_STRATEGIES: AttributionItem[] = [
  { key: 'trend', label: '趋势跟随', value: 52_300 },
  { key: 'mean', label: '均值回归', value: 4_200 },
  { key: 'hedge', label: '对冲', value: -9_600 },
  { key: 'fee', label: '费用 · 税', value: -2_000, kind: 'fee' },
]

const ATTR_CLASSES: AttributionItem[] = [
  { key: 'stock', label: '股票', value: 63_400 },
  { key: 'future', label: '期货', value: -17_000 },
  { key: 'fee', label: '费用 · 税', value: -2_000, kind: 'fee' },
]

const ATTR_BY_DIM: Record<string, AttributionItem[]> = {
  symbol: ATTR_SYMBOLS,
  account: ATTR_ACCOUNTS,
  strategy: ATTR_STRATEGIES,
  asset: ATTR_CLASSES,
}

export function AttributionBarsUsage() {
  const [dim, setDim] = useState('symbol')
  const [range, setRange] = useState('today')
  const [focus, setFocus] = useState<string | undefined>('300750')
  const items = ATTR_BY_DIM[dim] ?? ATTR_SYMBOLS
  const pos = items.reduce((sum, item) => sum + Math.max(0, item.value), 0)
  const neg = items.reduce((sum, item) => sum + Math.min(0, item.value), 0)
  return (
    <>
      <div className="gal-wide" data-gallery-attribution style={{ maxWidth: 760 }}>
        <AttributionBars
          items={items}
          title="P&L ATTRIBUTION"
          meta={(max) => `归因 · 今日 · 账户 A B · CNY · 刻度 ±${max.toLocaleString('en-US')}`}
          label="今日盈亏归因（示例）"
          dimensions={{
            label: '维度',
            value: dim,
            onValueChange: (key) => key && setDim(key),
            options: [
              { key: 'symbol', label: '品种' },
              { key: 'account', label: '账户' },
              { key: 'strategy', label: '策略' },
              { key: 'asset', label: '资产类别' },
            ],
          }}
          ranges={{
            label: '区间',
            value: range,
            onValueChange: (key) => key && setRange(key),
            options: [
              { key: 'today', label: '今日' },
              { key: 'week', label: '本周' },
              { key: 'month', label: '本月' },
            ],
          }}
          formatValue={money}
          labels={{ other: (n) => `其他 ×${n}`, share: '占比' }}
          formatShare={(x) => `${(x * 100).toFixed(1)}%`}
          readouts={[
            { key: 'sum', label: '今日合计', text: money(pos + neg), value: pos + neg },
            { key: 'pos', label: '正贡献', text: money(pos), value: pos },
            { key: 'neg', label: '负贡献', text: money(neg), value: neg },
          ]}
          focusKey={focus}
          onSelect={setFocus}
          heads={{ index: 'IDX', item: '品种', value: '贡献', share: '占比 |贡献|', shareTitle: '占总贡献绝对值之和' }}
          footer={{
            count: `${items.length} 项`,
            source: 'SOURCE · 台账成交 + 行情估值 · 演示数据',
            note: '研究账本不计入',
          }}
          actionLabels={{ group: '图工具', table: '表格视图', exportCsv: '导出 CSV', fullscreen: '全屏' }}
          onExport={() => {}}
        />
      </div>
    </>
  )
}
