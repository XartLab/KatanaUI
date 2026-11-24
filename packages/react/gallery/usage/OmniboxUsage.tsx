// SPDX-License-Identifier: MIT
import { BookOpenIcon, PlayIcon, WalletIcon } from 'lucide-react'
import { Omnibox, SymbolMark, type OmniboxItem } from '../../src/index'

// 演示数据，不是行情。品种是对象：选中后变成输入框里的标签，结果换成对它的操作。
const ITEMS: readonly OmniboxItem[] = [
  {
    id: 'AAPL',
    category: 'symbol',
    kind: 'object',
    type: 'symbol',
    label: 'AAPL',
    description: 'Apple Inc.',
    icon: <SymbolMark symbol="AAPL" name="Apple Inc." size="sm" />,
    meta: 'NASDAQ',
    preview: <strong>AAPL 189.84 +1.26%</strong>,
  },
  {
    id: 'AMD',
    category: 'symbol',
    kind: 'object',
    type: 'symbol',
    label: 'AMD',
    description: 'Advanced Micro Devices',
    icon: <SymbolMark symbol="AMD" name="Advanced Micro Devices" size="sm" />,
    meta: 'NASDAQ',
    preview: <strong>AMD 141.20 -0.84%</strong>,
  },
  { id: 'backtest', category: 'command', label: '收盘后跑回测', icon: <PlayIcon size={16} />, meta: '命令' },
  { id: 'book', category: 'command', label: '打开订单簿', icon: <BookOpenIcon size={16} />, meta: '命令' },
  { id: 'positions', category: 'page', kind: 'page', label: '持仓', icon: <WalletIcon size={16} />, meta: '交易' },
]

const ACTIONS: readonly OmniboxItem[] = [
  { id: 'chart', label: '开图' },
  { id: 'ticket', label: '下单草稿' },
  { id: 'news', label: '看新闻' },
]

export function OmniboxUsage() {
  return (
    <div style={{ width: 560 }}>
      <Omnibox
        categories={[
          { id: 'all', label: '全部' },
          { id: 'symbol', label: '品种' },
          { id: 'command', label: '命令' },
          { id: 'page', label: '页面' },
        ]}
        debounceMs={0}
        recent={[ITEMS[0]!]}
        onQuery={(query, scope) => {
          const needle = query.trim().toLowerCase()
          const pool = scope ? ACTIONS : ITEMS
          return pool.filter((item) => `${item.label} ${item.description ?? ''}`.toLowerCase().includes(needle))
        }}
        onSelect={() => {}}
        onAsk={() => {}}
        labels={{
          title: '万能框',
          placeholder: '搜品种、命令、页面，或直接提问',
          categories: '类别',
          recent: '最近',
          empty: '没有匹配项',
          loading: '搜索中…',
          removeScope: (name) => `移除 ${name}`,
          scopeHeading: (name) => `${name} 的操作`,
          hintRun: '运行',
          hintOpen: '打开',
          hintViewOptions: '查看选项',
          ask: '问',
          footer: { navigate: '导航', select: '选择', newTab: '新标签', close: '关闭' },
        }}
      />
    </div>
  )
}
