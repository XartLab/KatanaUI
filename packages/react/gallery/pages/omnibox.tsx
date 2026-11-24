// SPDX-License-Identifier: MIT
// 万能框（#224）的演示：品种、策略、命令、页面、插件放在一个入口里；选一个对象变成标签；打问句切成「问 ↵」。数据都是编的示例，不是行情。
import {
  ActivityIcon,
  BarChart3Icon,
  BellIcon,
  BookOpenIcon,
  LayoutDashboardIcon,
  LayoutGridIcon,
  ListOrderedIcon,
  NewspaperIcon,
  PauseIcon,
  PlayIcon,
  PlugIcon,
  StarIcon,
  WalletIcon,
} from 'lucide-react'
import { useState } from 'react'
import {
  Button,
  OmniboxDialog,
  SymbolMark,
  type OmniboxCategory,
  type OmniboxItem,
  type OmniboxLabels,
  type OmniboxSelectInfo,
} from '../../src/index.ts'

const mark = (symbol: string, name: string) => <SymbolMark symbol={symbol} name={name} size="sm" />

/** 悬停预览卡：品种的代码、名称、最新价与涨跌（示例数字，由调用方渲染）。 */
const quote = (symbol: string, name: string, last: string, change: string, up: boolean) => (
  <div style={{ display: 'grid', gap: 8 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <SymbolMark symbol={symbol} name={name} size="md" />
      <div style={{ display: 'grid', gap: 2 }}>
        <strong className="k-text-data" style={{ color: 'var(--k-content-primary-foreground)' }}>
          {symbol}
        </strong>
        <span className="k-text-caption" style={{ color: 'var(--k-content-secondary-foreground)' }}>
          {name}
        </span>
      </div>
    </div>
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
      <span className="k-text-title" style={{ color: 'var(--k-content-primary-foreground)' }}>
        {last}
      </span>
      <span className="k-text-data" style={{ color: up ? 'var(--pnl-up)' : 'var(--pnl-down)' }}>
        {change}
      </span>
    </div>
    <span className="k-text-caption" style={{ color: 'var(--k-content-secondary-foreground)' }}>
      示例数字，不是行情
    </span>
  </div>
)

export const OMNIBOX_CATEGORIES: readonly OmniboxCategory[] = [
  { id: 'all', label: '全部' },
  { id: 'symbol', label: '品种' },
  { id: 'strategy', label: '策略' },
  { id: 'command', label: '命令' },
  { id: 'page', label: '页面' },
  { id: 'plugin', label: '插件' },
]

export const OMNIBOX_ITEMS: readonly OmniboxItem[] = [
  {
    id: 'sym:AAPL',
    category: 'symbol',
    kind: 'object',
    type: 'symbol',
    label: 'AAPL',
    description: 'Apple Inc.',
    icon: mark('AAPL', 'Apple Inc.'),
    meta: 'NASDAQ',
    preview: quote('AAPL', 'Apple Inc.', '189.84', '+1.26%', true),
  },
  {
    id: 'sym:AMD',
    category: 'symbol',
    kind: 'object',
    type: 'symbol',
    label: 'AMD',
    description: 'Advanced Micro Devices',
    icon: mark('AMD', 'Advanced Micro Devices'),
    meta: 'NASDAQ',
    preview: quote('AMD', 'Advanced Micro Devices', '141.20', '-0.84%', false),
  },
  {
    id: 'sym:600519',
    category: 'symbol',
    kind: 'object',
    type: 'symbol',
    label: '600519.XSHG',
    description: '贵州茅台',
    icon: mark('600519', '贵州茅台'),
    meta: 'SSE',
    preview: quote('600519', '贵州茅台', '1,688.00', '+0.52%', true),
  },
  {
    id: 'sym:BTC',
    category: 'symbol',
    kind: 'object',
    type: 'symbol',
    label: 'BTC-USDT',
    description: '永续',
    icon: mark('BTC', 'Bitcoin'),
    meta: 'Binance',
    preview: quote('BTC-USDT', 'Bitcoin 永续', '67,420.5', '+2.10%', true),
  },
  {
    id: 'sym:TSLA',
    category: 'symbol',
    kind: 'object',
    type: 'symbol',
    label: 'TSLA',
    description: 'Tesla, Inc.',
    icon: mark('TSLA', 'Tesla'),
    meta: 'NASDAQ',
    preview: quote('TSLA', 'Tesla, Inc.', '242.10', '-2.31%', false),
  },
  {
    id: 'sym:NVDA',
    category: 'symbol',
    kind: 'object',
    type: 'symbol',
    label: 'NVDA',
    description: 'NVIDIA Corp.',
    icon: mark('NVDA', 'NVIDIA'),
    meta: 'NASDAQ',
    preview: quote('NVDA', 'NVIDIA Corp.', '478.60', '+0.90%', true),
  },
  {
    id: 'sym:TSM',
    category: 'symbol',
    kind: 'object',
    type: 'symbol',
    label: 'TSM',
    description: 'Taiwan Semiconductor Manufacturing',
    icon: mark('TSM', 'Taiwan Semiconductor Manufacturing'),
    meta: 'NYSE',
    preview: quote('TSM', 'Taiwan Semiconductor Manufacturing', '104.30', '+0.37%', true),
  },
  {
    id: 'str:momo',
    category: 'strategy',
    kind: 'object',
    type: 'strategy',
    label: '动量轮动',
    description: '日频 · 运行中',
    icon: <ActivityIcon size={16} />,
  },
  {
    id: 'str:pairs',
    category: 'strategy',
    kind: 'object',
    type: 'strategy',
    label: '配对套利',
    description: '分钟频 · 已暂停',
    icon: <ActivityIcon size={16} />,
  },
  { id: 'cmd:backtest', category: 'command', label: '收盘后跑回测', icon: <PlayIcon size={16} />, meta: '命令' },
  { id: 'cmd:book', category: 'command', label: '打开订单簿', icon: <BookOpenIcon size={16} />, meta: '命令' },
  { id: 'cmd:layout', category: 'command', label: '切换布局', icon: <LayoutGridIcon size={16} />, meta: '命令' },
  { id: 'cmd:alert', category: 'command', label: '新建价格提醒', icon: <BellIcon size={16} />, meta: '命令' },
  { id: 'page:positions', category: 'page', kind: 'page', label: '持仓', icon: <WalletIcon size={16} />, meta: '交易' },
  {
    id: 'page:orders',
    category: 'page',
    kind: 'page',
    label: '订单',
    icon: <ListOrderedIcon size={16} />,
    meta: '交易',
  },
  {
    id: 'page:lab',
    category: 'page',
    kind: 'page',
    label: '研究台',
    icon: <LayoutDashboardIcon size={16} />,
    meta: '研究',
  },
  {
    id: 'plug:news',
    category: 'plugin',
    kind: 'page',
    label: '新闻流',
    description: '示例插件',
    icon: <PlugIcon size={16} />,
  },
  {
    id: 'plug:options',
    category: 'plugin',
    kind: 'page',
    label: '期权链',
    description: '示例插件',
    icon: <PlugIcon size={16} />,
  },
  {
    id: 'plug:risk',
    category: 'plugin',
    kind: 'page',
    label: '风控台',
    description: '未安装，不能打开',
    icon: <PlugIcon size={16} />,
    disabled: true,
  },
]

/** 按对象类型给动作（调用方的事，不在组件里）。 */
export function scopeActions(scope: OmniboxItem): OmniboxItem[] {
  if (scope.type === 'symbol') {
    return [
      { id: 'act:chart', label: '开图', icon: <BarChart3Icon size={16} /> },
      { id: 'act:ticket', label: '下单草稿', icon: <ListOrderedIcon size={16} /> },
      { id: 'act:news', label: '看新闻', icon: <NewspaperIcon size={16} /> },
      { id: 'act:options', label: '看期权链', icon: <PlugIcon size={16} /> },
      { id: 'act:watch', label: '加入自选', icon: <StarIcon size={16} /> },
    ]
  }
  return [
    { id: 'act:run', label: '跑回测', icon: <PlayIcon size={16} /> },
    { id: 'act:curve', label: '看净值', icon: <ActivityIcon size={16} /> },
    { id: 'act:params', label: '编辑参数', icon: <LayoutGridIcon size={16} /> },
    { id: 'act:pause', label: '暂停', icon: <PauseIcon size={16} /> },
  ]
}

const delay = (ms: number, signal: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    const timer = setTimeout(resolve, ms)
    signal.addEventListener('abort', () => {
      clearTimeout(timer)
      reject(signal.reason)
    })
  })

const matches = (item: OmniboxItem, needle: string) =>
  needle === '' || `${item.label} ${item.description ?? ''}`.toLowerCase().includes(needle)

/** 演示用的搜索：作用域下给该对象的动作（按词过滤）；全局按名称与说明包含（结尾的问号不算），品种代码前缀排前面；故意延迟 120ms。 */
export async function demoQuery(query: string, scope: OmniboxItem | null, signal: AbortSignal) {
  await delay(120, signal)
  const needle = query
    .trim()
    .toLowerCase()
    .replace(/[?？]+$/, '')
  if (scope) return scopeActions(scope).filter((item) => matches(item, needle))
  const hit = OMNIBOX_ITEMS.filter((item) => matches(item, needle))
  return [
    ...hit.filter((item) => item.label.toLowerCase().startsWith(needle)),
    ...hit.filter((item) => !item.label.toLowerCase().startsWith(needle)),
  ]
}

export const OMNIBOX_LABELS: OmniboxLabels = {
  title: '万能框',
  placeholder: '搜品种、命令、页面，或直接提问',
  scopedPlaceholder: '对它做什么…',
  categories: '类别',
  recent: '最近',
  clearRecent: '清除',
  empty: '没有匹配项',
  loading: '搜索中…',
  error: '搜索出错，稍后再试',
  showAll: (count, label) => `显示全部 ${count} 个${label}`,
  scopeHeading: (name) => `${name} 的操作`,
  removeScope: (name) => `移除 ${name}`,
  hintRun: '运行',
  hintOpen: '打开',
  hintViewOptions: '查看选项',
  hintNewTab: '新标签打开',
  ask: '问',
  searchInstead: '改为搜索',
  askInstead: (text) => `回车把「${text}」拿去问`,
  categorySet: (label, count) => `${label}，${count} 个结果`,
  footer: { navigate: '导航', select: '选择', newTab: '新标签', close: '关闭' },
  resultCount: (count) => `${count} 个结果`,
  scopeSet: (name) => `已选中 ${name}，下面是可做的操作`,
  scopeCleared: '已回到全局搜索',
}

export const OMNIBOX_EXAMPLES = ['AAPL 期权链', '收盘后跑回测', '打开订单簿', '下周哪些持仓有财报？']

/** omnibox 页：按钮打开对话框；页面记下最后一次选择、提问与是否新标签。 */
export function OmniboxDemo() {
  const [open, setOpen] = useState(false)
  const [log, setLog] = useState('还没有选择')
  const [asked, setAsked] = useState('还没有提问')
  const onSelect = (item: OmniboxItem, info: OmniboxSelectInfo) =>
    setLog(`${info.scope ? `${info.scope.label} → ` : ''}${item.label}${info.newTab ? '（新标签）' : ''}`)
  return (
    <div className="gal-stack" style={{ width: '100%', maxWidth: 640 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <Button size="sm" onClick={() => setOpen(true)} data-testid="omnibox-open">
          打开万能框
        </Button>
      </div>
      <p className="gal-note" data-testid="omnibox-log">
        选择：{log}
      </p>
      <p className="gal-note" data-testid="omnibox-asked">
        提问：{asked}
      </p>
      <p className="gal-note">
        演示数据是编的，不是行情；搜索故意延迟 120ms。试试：直接打 AAPL
        回车、空框退格删标签、打「下周哪些持仓有财报？」、按 Tab 换类别、按住 Ctrl 回车。
      </p>
      <OmniboxDialog
        open={open}
        onOpenChange={setOpen}
        categories={OMNIBOX_CATEGORIES}
        placeholders={OMNIBOX_EXAMPLES}
        labels={OMNIBOX_LABELS}
        onQuery={demoQuery}
        onSelect={onSelect}
        onAsk={(text, scope) => setAsked(`${scope ? `${scope.label} · ` : ''}${text}`)}
      />
    </div>
  )
}
