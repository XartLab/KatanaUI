// SPDX-License-Identifier: MIT
import { Bell, Camera, Maximize2, Settings, X } from 'lucide-react'
import { useState } from 'react'
import {
  ColumnPicker,
  DataGrid,
  DataGridHostProvider,
  DecisionQueue,
  EmptyState,
  EstimateBadge,
  HypothesisLedger,
  NewsFeed,
  NewsReader,
  SystemMonitor,
  PanelFrame,
  PanelFrameBody,
  PanelFrameHeader,
  StatusBar,
  ToolButton,
  Toolbar,
  ToolbarGroup,
  ToolSlot,
  WorkspaceTabs,
  type ColumnSet,
  type DataGridHost,
  type DecisionItem,
  type DecisionQueueLabels,
  type GridColumn,
  type GridColumnLayout,
  type Hypothesis,
  type HypothesisLedgerLabels,
  type WatchRow,
  type NewsFeedLabels,
  type MonitorEvent,
  type MonitorLink,
  type MonitorStrategy,
  type NewsFacet,
  type NewsItem,
  type StrategyAction,
  type SystemMonitorLabels,
  type SystemMonitorMetric,
  type SortSpec,
  type StatusItem,
  type WorkspaceTab,
} from '../../src/blocks/index.ts'
import { ConsensusBlock } from '../../src/quant/index.ts'
import { Button, Splitter, ToggleGroup, ToggleGroupItem, symbolMenu, usePersistedState } from '../../src/index.ts'
import { ActionLog, Row, SAMPLE_MARK_SRC, demoSymbolActions } from './parts.tsx'

// 积木层（@katana-ui/react/blocks，#1869）的演示。表里的数据都是写死的示例数据，不是行情。

type Example = {
  id: string
  symbol: { code: string; venue: string; name?: string; icon?: { src?: string } }
  side: 'buy' | 'sell'
  price: number
  qty: number
  pnl: number
  change: number
  at: number
  note: string
  fills: string
}

const EXAMPLES: readonly Example[] = [
  {
    id: 'a',
    symbol: { code: 'BTCUSDT', venue: 'BINANCE', name: 'Bitcoin', icon: { src: SAMPLE_MARK_SRC } },
    side: 'buy',
    price: 64250.5,
    qty: 0.25,
    pnl: 125.4,
    change: 1.234,
    at: Date.UTC(2026, 10, 14, 1, 2, 3),
    note: 'swing',
    fills: '3',
  },
  {
    id: 'b',
    symbol: { code: '600519', venue: 'SSE', name: '贵州茅台', icon: {} },
    side: 'sell',
    price: 1688,
    qty: 1200,
    pnl: -310.75,
    change: -0.5,
    at: Date.UTC(2026, 10, 14, 2, 30, 0),
    note: 'scalp',
    fills: '12',
  },
  {
    id: 'c',
    symbol: { code: 'ES', venue: 'CME' },
    side: 'buy',
    price: 4500.25,
    qty: 15000,
    pnl: 0,
    change: 0,
    at: Date.UTC(2026, 10, 14, 9, 15, 45),
    note: 'hedge',
    fills: '1',
  },
]

const COLUMNS: readonly GridColumn<Example>[] = [
  { id: 'symbol', type: 'symbol', value: (row) => row.symbol },
  { id: 'side', type: 'side', value: (row) => row.side },
  {
    id: 'price',
    type: 'price',
    value: (row) => row.price,
    format: (row) => ({ tick: row.symbol.code === 'ES' ? 0.25 : 0.01 }),
  },
  { id: 'qty', type: 'quantity', value: (row) => row.qty },
  { id: 'pnl', type: 'pnl', value: (row) => row.pnl, format: { suffix: 'USDT' } },
  { id: 'change', type: 'change', value: (row) => row.change },
  { id: 'at', type: 'time', value: (row) => row.at },
  { id: 'fills', type: 'number', value: (row) => row.fills },
  { id: 'note', type: 'text', value: (row) => row.note },
]

const LAYOUT: readonly GridColumnLayout[] = [
  { id: 'symbol', label: 'Symbol', width: 190, visible: true },
  { id: 'side', label: 'Side', width: 60, visible: true },
  { id: 'price', label: 'Price', width: 100, visible: true },
  { id: 'qty', label: 'Qty', width: 80, visible: true },
  { id: 'pnl', label: 'PnL', width: 110, visible: true },
  { id: 'change', label: 'Chg %', width: 80, visible: true },
  { id: 'at', label: 'Time (UTC)', width: 160, visible: true },
  { id: 'fills', label: 'Fills', width: 60, visible: true },
  { id: 'note', label: 'Note', width: 80, visible: true },
]

// 自定义列与子行：fills 列画任意内容（标签加成交笔数、按钮），点不到整行；有成交的行按 → 展开成交明细（示例数据）。
const DETAIL_COLUMNS: readonly GridColumn<Example>[] = [
  { id: 'symbol', type: 'symbol', value: (row) => row.symbol },
  { id: 'pnl', type: 'pnl', value: (row) => row.pnl, format: { suffix: 'USDT' } },
  {
    id: 'fills',
    type: 'custom',
    text: (row) => `${row.note} ${row.fills}`,
    cell: (row) => (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
        <b>{row.note}</b>
        <span>{row.fills} fills</span>
        <Button size="sm" aria-label={`Close ${row.symbol.code}`}>
          Close
        </Button>
      </span>
    ),
  },
]

const DETAIL_LAYOUT: readonly GridColumnLayout[] = [
  { id: 'symbol', label: 'Symbol', width: 140, visible: true },
  { id: 'pnl', label: 'PnL', width: 130, visible: true },
  { id: 'fills', label: 'Strategy', width: 260, visible: true },
]

const HOST: DataGridHost = {
  texts: { copy: 'Copy', save: 'Export CSV…', resetColumns: 'Reset columns' },
}

const COLUMN_SETS: readonly ColumnSet[] = [
  { id: 'overview', label: 'Overview', columns: ['symbol', 'side', 'price', 'pnl', 'change'] },
  { id: 'execution', label: 'Execution', columns: ['symbol', 'side', 'qty', 'at', 'fills'] },
  { id: 'all', label: 'All', columns: LAYOUT.map((column) => column.id) },
]

// 列头右键菜单、拖动重排、ColumnPicker（#27）：layout 经 usePersistedState 存进 localStorage（示例的 key 与版本写在这里，换版本就丢旧存档）。
function ColumnsDemo() {
  const [sort, setSort] = useState<SortSpec | null>(null)
  const [layout, setLayout, resetLayout] = usePersistedState<GridColumnLayout[]>(
    'katana-ui-gallery:grid-columns',
    [...LAYOUT],
    {
      version: 1,
    },
  )
  return (
    <>
      <p className="gal-note">
        列头右键：排序、固定、隐藏、左右移、重置；拖动列头换位置；右上角「Columns」勾选列或整套切换列集。列摆法存在
        localStorage。
      </p>
      <div data-testid="grid-columns" style={{ width: '100%', maxWidth: 780 }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', paddingBottom: 6 }}>
          <ColumnPicker
            layout={layout}
            onLayoutChange={setLayout}
            sets={COLUMN_SETS}
            labels={{ trigger: 'Columns', sets: 'Column sets', columns: 'Columns' }}
          />
        </div>
        <div style={{ display: 'flex', height: 150 }}>
          <DataGridHostProvider value={HOST}>
            <DataGrid
              columns={COLUMNS}
              layout={layout}
              onLayoutChange={setLayout}
              rows={EXAMPLES}
              rowId={(row) => row.id}
              label="Example columns"
              sort={sort}
              onSortChange={setSort}
              onResetColumns={() => {
                setSort(null)
                resetLayout()
              }}
              timeZone="utc"
            />
          </DataGridHostProvider>
        </div>
      </div>
    </>
  )
}

export function DataGridDemo() {
  const [sort, setSort] = useState<SortSpec | null>(null)
  const [log, setLog] = useState('')
  return (
    <>
      <p className="gal-note">
        示例数据：每种列类型一列；点表头排序，右键看菜单；悬停或用上下键走到一行，右端浮出行快捷按钮（rowActions，#23）。品种列前是徽标：BTCUSDT
        用自绘的示意图标（不是真实标志），600519 是字母圆标。
      </p>
      <div data-testid="grid-demo" style={{ display: 'flex', height: 190, width: '100%', maxWidth: 780 }}>
        <DataGridHostProvider value={HOST}>
          <DataGrid
            columns={COLUMNS}
            layout={LAYOUT}
            rows={EXAMPLES}
            rowId={(row) => row.id}
            label="Example rows"
            sort={sort}
            onSortChange={setSort}
            onResetColumns={() => setSort(null)}
            onExport={() => {}}
            exportName="example"
            timeZone="utc"
            rowActions={(row) => demoSymbolActions(row.symbol.code, setLog)}
          />
        </DataGridHostProvider>
      </div>
      <ActionLog text={log} />
      <ColumnsDemo />
      <p className="gal-note">无表头、只读、紧凑行高的变体：</p>
      <div style={{ width: 300 }}>
        <DataGrid
          columns={COLUMNS.filter((column) => column.id === 'symbol' || column.id === 'pnl')}
          layout={LAYOUT.filter((column) => column.id === 'symbol' || column.id === 'pnl')}
          rows={EXAMPLES}
          rowId={(row) => row.id}
          label="Compact example"
          sort={null}
          onSortChange={() => {}}
          density="compact"
          hideHeader
          interactive={false}
          fit
        />
      </div>
      <p className="gal-note">
        示例数据：custom 列（格子里放任意内容）、rowProps（给行加 data-* 与提示）、可展开的子行。点进表后 ↓ 选一行，→
        展开、← 收起。
      </p>
      <div data-testid="grid-detail" style={{ width: '100%', maxWidth: 560 }}>
        <DataGrid
          columns={DETAIL_COLUMNS}
          layout={DETAIL_LAYOUT}
          rows={EXAMPLES}
          rowId={(row) => row.id}
          label="Example rows with detail"
          rowProps={(row) => ({ 'data-example': row.id, title: row.symbol.code })}
          renderSubRow={(row) =>
            row.fills === '1' ? null : (
              <div style={{ padding: '6px 8px 8px', color: 'var(--ink-300)' }}>
                Fills detail for {row.symbol.code}: {row.fills} fills, last at 2026-11-14.
              </div>
            )
          }
          density="relaxed"
          autoRowHeight
          selectable={false}
          ruled
          stretch
          fit
        />
      </div>
    </>
  )
}

export function EmptyStateDemo() {
  return (
    <EmptyState tag="NO DATA" title="Nothing selected" actions={<Button variant="primary">Pick a symbol</Button>}>
      <p>Connect a data source first. No sample data is drawn.</p>
    </EmptyState>
  )
}

export function ToolbarDemo() {
  const [on, setOn] = useState(false)
  return (
    <div style={{ height: 36, width: '100%', maxWidth: 480, display: 'flex' }}>
      <Toolbar label="Example toolbar">
        <ToolbarGroup side="left">
          <ToolSlot tool="bell">
            <ToolButton label="Alerts" onClick={() => {}}>
              <Bell />
            </ToolButton>
          </ToolSlot>
          <ToolSlot tool="draw" separator>
            <ToolButton label="Draw" pressed={on} onClick={() => setOn(!on)}>
              <Settings />
            </ToolButton>
          </ToolSlot>
        </ToolbarGroup>
        <ToolbarGroup side="right">
          <ToolSlot tool="shot">
            <ToolButton label="Screenshot" title="Take a screenshot" disabled onClick={() => {}}>
              <Camera />
            </ToolButton>
          </ToolSlot>
        </ToolbarGroup>
      </Toolbar>
    </div>
  )
}

export function EstimateBadgeDemo() {
  return (
    <Row name="估算">
      <EstimateBadge label="Estimated from bars" title="Fills are estimated from closed 1-minute bars." />
    </Row>
  )
}

export function PanelFrameDemo() {
  const [focused, setFocused] = useState(true)
  return (
    <div className="gal-stack" style={{ width: '100%', maxWidth: 560 }}>
      <p className="gal-note">焦点面板（带角括号）、折叠、固定联动、未连接与加载的内容区。点面板切换焦点。</p>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ width: 270, height: 150 }} data-testid="frame-focus" onPointerDown={() => setFocused(!focused)}>
          <PanelFrame focused={focused} brackets={focused} aria-label="Chart panel">
            <PanelFrameHeader
              heading="Chart"
              object="· BTCUSDT · 1h"
              linkGroup="A"
              linkLabel="Link group A"
              actions={
                <>
                  <Button variant="icon" aria-label="Maximize">
                    <Maximize2 />
                  </Button>
                  <Button variant="icon" aria-label="Close">
                    <X />
                  </Button>
                </>
              }
            />
            <PanelFrameBody>
              <p className="gal-note" style={{ padding: 8 }}>
                Panel content decides its own density.
              </p>
            </PanelFrameBody>
          </PanelFrame>
        </div>
        <div style={{ width: 270, height: 150 }}>
          <PanelFrame aria-label="Collapsible panel">
            <PanelFrameHeader
              heading="Watchlist"
              object="· Core · 24"
              linkGroup="B"
              linkLabel="Link group B, pinned"
              pinned
              collapsible
              collapseLabel="Collapse"
              expandLabel="Expand"
            />
            <PanelFrameBody>
              <p className="gal-note" style={{ padding: 8 }}>
                Collapse leaves only the title bar.
              </p>
            </PanelFrameBody>
          </PanelFrame>
        </div>
        <div style={{ width: 270, height: 150 }}>
          <PanelFrame aria-label="Orders panel">
            <PanelFrameHeader heading="Orders" linkGroup={null} linkLabel="No link group" />
            <PanelFrameBody
              state="disconnected"
              view={{ tag: 'OFFLINE', title: 'Not connected', description: 'Connect an account to see orders.' }}
            />
          </PanelFrame>
        </div>
        <div style={{ width: 270, height: 150 }}>
          <PanelFrame aria-label="Trades panel">
            <PanelFrameHeader heading="Trades" />
            <PanelFrameBody state="loading" loadingLabel="Loading" />
          </PanelFrame>
        </div>
      </div>
    </div>
  )
}

const STATUS_ITEMS: readonly StatusItem[] = [
  { id: 'quote', label: 'QUOTE', value: '42 ms', led: 'ok', ledLabel: 'OK', priority: 3, onClick: () => {} },
  { id: 'exec', label: 'EXEC', value: '118 ms', led: 'warn', ledLabel: 'Slow', priority: 3, onClick: () => {} },
  { id: 'live', label: 'LIVE', value: 'IBKR U123', live: true, led: 'on', ledLabel: 'Live account' },
  { id: 'link', label: 'LINK', value: 'A · BTCUSDT', priority: 1, onClick: () => {} },
  { id: 'mode', label: 'MODE', value: 'QUIET', priority: 0 },
  { id: 'clock', value: '09:30:12', priority: 4 },
]

export function StatusBarDemo() {
  const [width, setWidth] = useState(720)
  const items = STATUS_ITEMS
  return (
    <div className="gal-stack" style={{ width: '100%', maxWidth: 760 }}>
      <p className="gal-note">项由数据声明；条变窄时先收优先级低的进「…」，实盘（琥珀框）与 pinned 的项不收。</p>
      <div style={{ width }} data-testid="status-demo">
        <StatusBar
          label="Status bar"
          moreLabel="More status items"
          left={items.slice(0, 3)}
          center={items.slice(3, 5)}
          right={items.slice(5)}
        />
      </div>
      <Row name="宽度">
        <Button onClick={() => setWidth(720)}>720</Button>
        <Button onClick={() => setWidth(420)}>420</Button>
        <Button onClick={() => setWidth(260)}>260</Button>
      </Row>
    </div>
  )
}

export function SplitterDemo() {
  const [ratio, setRatio] = useState(0.4)
  return (
    <div className="gal-stack" style={{ width: '100%', maxWidth: 560 }}>
      <p className="gal-note">
        拖动、方向键（8px，Shift 32px）、Home / End、双击或 Enter 复位到 50%；靠近 1/3、1/2、2/3 吸附。
      </p>
      <div
        data-testid="splitter-demo"
        style={{
          display: 'grid',
          gridTemplateColumns: `minmax(0, ${ratio}fr) 8px minmax(0, ${1 - ratio}fr)`,
          height: 120,
        }}
      >
        <div style={{ background: 'var(--bg-200)', minWidth: 0 }}>
          <p className="gal-note" style={{ padding: 8 }}>
            {Math.round(ratio * 100)}%
          </p>
        </div>
        <Splitter
          axis="row"
          ratio={ratio}
          minFirst={80}
          minSecond={80}
          onPreview={() => {}}
          onChange={setRatio}
          label="Resize panes"
          valueText={(value) => `First pane ${Math.round(value * 100)}%`}
        />
        <div style={{ background: 'var(--bg-200)', minWidth: 0 }}>
          <p className="gal-note" style={{ padding: 8 }}>
            {100 - Math.round(ratio * 100)}%
          </p>
        </div>
      </div>
    </div>
  )
}

const TABS: readonly WorkspaceTab[] = [
  { id: 'overview', name: 'Overview', hotkey: '⌘1' },
  { id: 'desk', name: 'Desk', hotkey: '⌘2' },
  { id: 'lab', name: 'Lab', hotkey: '⌘3' },
  { id: 'portfolio', name: 'Portfolio', hotkey: '⌘4' },
  { id: 'runs', name: 'Runs', hotkey: '⌘5' },
  { id: 'my-long-workspace-name', name: 'My very long workspace name' },
]

export function WorkspaceTabsDemo() {
  const [tabs, setTabs] = useState(TABS)
  const [active, setActive] = useState('desk')
  const [renamed, setRenamed] = useState<string | null>(null)
  return (
    <div className="gal-stack" style={{ width: '100%', maxWidth: 640 }}>
      <p className="gal-note">
        点切换、拖或 Alt+← / → 排序、双击或 F2 改名、「+」新建；放不下的标签收进「…」下拉，当前标签始终可见。
      </p>
      <div style={{ width: 520 }} data-testid="tabs-demo">
        <WorkspaceTabs
          workspaces={tabs}
          activeId={active}
          label="Workspaces"
          createLabel="New workspace"
          moreLabel="More workspaces"
          onSelect={setActive}
          onRename={setRenamed}
          onCreate={() => setTabs((prev) => [...prev, { id: `ws${prev.length}`, name: `Workspace ${prev.length}` }])}
          onReorder={(id, target) =>
            setTabs((prev) => {
              const from = prev.findIndex((item) => item.id === id)
              const to = prev.findIndex((item) => item.id === target)
              if (from < 0 || to < 0) return prev
              const next = [...prev]
              next.splice(to, 0, ...next.splice(from, 1))
              return next
            })
          }
        />
      </div>
      <p className="gal-note" data-testid="tabs-rename">
        {renamed ? `Rename requested: ${renamed}` : 'No rename requested'}
      </p>
    </div>
  )
}

// 新闻流的演示数据是虚构的（标题、来源都不是真实机构），时间固定在 NEWS_NOW，不随真实时钟走。
const NEWS_NOW = Date.UTC(2026, 10, 15, 9, 30, 0)
const MIN = 60_000
const NEWS_SOURCES = [
  { value: 'wire', label: '演示通讯社' },
  { value: 'desk', label: '演示研究台' },
  { value: 'exch', label: '演示交易所公告' },
]
const NEWS_CHANNELS = [
  { value: 'flash', label: '快讯' },
  { value: 'top', label: '要闻' },
]
const NEWS_ITEMS: NewsItem[] = [
  {
    id: 'n1',
    time: NEWS_NOW - 3 * MIN,
    channel: 'flash',
    source: 'wire',
    title: '星河锂业披露一季度产能爬坡进度，超出此前指引',
    summary: '公司称新产线良率已升至 92%，二季度有望满产；管理层同时提示原料价格波动风险。',
    symbols: [{ code: '600001', name: '星河锂业' }],
    important: true,
    facets: { market: ['stocks'], activity: ['notice'], country: ['cn'] },
  },
  {
    id: 'n2',
    time: NEWS_NOW - 12 * MIN,
    channel: 'top',
    source: 'desk',
    title: '北辰半导体与海岚电子签署三年期供货框架协议',
    summary: '协议涵盖车规级芯片，首年预计供货量约 400 万颗，具体价格以季度谈判为准。',
    symbols: [
      { code: '600002', name: '北辰半导体' },
      { code: '000003', name: '海岚电子' },
    ],
  },
  {
    id: 'n3',
    time: NEWS_NOW - 26 * MIN,
    channel: 'flash',
    source: 'exch',
    title: '演示交易所：下周起调整两只指数成分股，名单见公告',
    summary: '本次调整涉及 6 只成分股，生效日为下周一收盘后。',
    symbols: [{ code: 'DEMOIDX' }],
  },
  {
    id: 'n4',
    time: NEWS_NOW - 58 * MIN,
    channel: 'top',
    source: 'wire',
    title: '云岭能源董事会通过回购方案，金额上限 8 亿元',
    summary: '回购股份拟用于员工持股计划，实施期限十二个月。',
    symbols: [{ code: '600004', name: '云岭能源' }],
    important: true,
  },
  {
    id: 'n5',
    time: NEWS_NOW - 3 * 60 * MIN,
    channel: 'flash',
    source: 'desk',
    title: '研究台：三季度出口链景气度环比改善，细分行业分化加大',
    symbols: [],
  },
  {
    id: 'n6',
    time: NEWS_NOW - 5 * 60 * MIN,
    channel: 'top',
    source: 'exch',
    title: '演示交易所发布新版交易日历，节假日安排有微调',
    summary: '新版日历自下月起适用，不影响已挂出的合约。',
  },
]
const NEWS_LABELS: NewsFeedLabels = {
  all: '全部',
  feed: '新闻流',
  channels: '频道',
  sources: '来源',
  clearSources: '清除来源筛选',
  search: '搜索关键词',
  layout: '排法',
  layoutList: '列表',
  layoutCard: '卡片',
  pause: '暂停',
  resume: '继续',
  newItems: (n) => `${n} 条新消息`,
  ago: (s) => (s < 60 ? `${s} 秒前` : s < 3600 ? `${Math.floor(s / 60)} 分钟前` : `${Math.floor(s / 3600)} 小时前`),
  absolute: (t) => new Date(t).toISOString().replace('T', ' ').slice(0, 16) + ' UTC',
  important: '重要',
  empty: '没有符合筛选的新闻',
  facets: { group: '组合过滤', add: '添加过滤', reset: '重置', remove: '移除', none: '无' },
  read: (n) => `${n} 分钟阅读`,
  views: { trigger: '已保存的新闻过滤', save: '另存为…' },
  collapse: '收起过滤',
  expand: '展开过滤',
}

const NEWS_FACETS: readonly NewsFacet[] = [
  {
    key: 'market',
    label: '市场',
    shown: true,
    options: [
      { value: 'stocks', label: '股票' },
      { value: 'crypto', label: '加密' },
    ],
  },
  {
    key: 'activity',
    label: '公司事件',
    options: [
      { value: 'earnings', label: '财报' },
      { value: 'notice', label: '公告' },
    ],
  },
  {
    key: 'country',
    label: '国家',
    options: [
      { value: 'cn', label: '甲国' },
      { value: 'us', label: '乙国' },
    ],
  },
]

const NEWS_VIEWS = [
  { key: 'full', label: '全部新闻' },
  { key: 'stocks', label: '只看股票' },
]

/** 并排阅读窗（宽度够时左列表右阅读窗，不够时盖在列表上）：已保存视图下拉、收起过滤、阅读分钟数、重叠的品种徽标。 */
function NewsFeedSplit() {
  const [saved, setSaved] = useState(NEWS_VIEWS)
  const [view, setView] = useState('full')
  const [wide, setWide] = useState(true)
  return (
    <div style={{ display: 'grid', gap: 8 }}>
      <ToggleGroup
        variant="sm"
        aria-label="宽度"
        value={wide ? 'wide' : 'narrow'}
        onValueChange={(v) => setWide(v === 'wide')}
      >
        <ToggleGroupItem value="wide">宽 1000px</ToggleGroupItem>
        <ToggleGroupItem value="narrow">窄 640px</ToggleGroupItem>
      </ToggleGroup>
      <div style={{ height: 460, width: wide ? 1000 : 640 }}>
        <NewsFeed
          key={view}
          items={NEWS_ITEMS.map((item, index) => ({ ...item, readMinutes: 1 + (index % 4) }))}
          channels={NEWS_CHANNELS}
          sources={NEWS_SOURCES}
          now={NEWS_NOW}
          labels={NEWS_LABELS}
          facets={NEWS_FACETS.map((f) => (view === 'stocks' && f.key === 'market' ? { ...f, shown: true } : f))}
          views={saved}
          view={view}
          onViewChange={setView}
          onSaveView={() => {
            const key = `saved-${saved.length}`
            setSaved([...saved, { key, label: `未命名过滤 ${saved.length - 1}` }])
            setView(key)
          }}
          reader={(item, { close }) => (
            <NewsReader
              title={item.title}
              source="演示通讯社"
              meta={`${NEWS_LABELS.ago(Math.floor((NEWS_NOW - item.time) / 1000))} · 演示通讯社 · ${NEWS_LABELS.read!(item.readMinutes ?? 2)}`}
              symbols={(item.symbols ?? []).map((s, i) => ({ ...s, change: i === 0 ? 1.24 : -0.59 }))}
              keyPoints={item.summary ? [item.summary] : []}
              labels={{ reader: '新闻阅读', keyPoints: '要点', close: '关闭', report: '举报', copyLink: '复制链接' }}
              onClose={close}
            >
              <p>以上内容是演示文字，公司、数字与来源都是虚构的。</p>
            </NewsReader>
          )}
        />
      </div>
    </div>
  )
}

export function NewsFeedDemo() {
  const [items, setItems] = useState(NEWS_ITEMS)
  const [picked, setPicked] = useState('—')
  const push = () =>
    setItems((prev) => [
      {
        id: `n${prev.length + 1}`,
        time: NEWS_NOW + prev.length * 1000,
        channel: 'flash',
        source: 'wire',
        title: `演示快讯 ${prev.length + 1}：虚构公司发布示例公告`,
        symbols: [{ code: '600001', name: '星河锂业' }],
      },
      ...prev,
    ])
  return (
    <div className="gal-stack" style={{ width: '100%' }}>
      <p className="gal-note">
        演示数据（标题与来源都是虚构的，时间固定）。点「模拟新消息」看新到条目；点品种胶囊：{picked}。
      </p>
      <Button data-testid="news-push" onClick={push}>
        模拟新消息
      </Button>
      <div style={{ height: 420 }} data-testid="news-frame">
        <PanelFrame aria-label="News panel">
          <PanelFrameHeader heading="News" object="· 演示数据" />
          <PanelFrameBody>
            <div style={{ height: '100%', padding: 8 }}>
              <NewsFeed
                items={items}
                channels={NEWS_CHANNELS}
                sources={NEWS_SOURCES}
                now={NEWS_NOW}
                labels={NEWS_LABELS}
                facets={NEWS_FACETS}
                onSymbolPick={(s) => setPicked(s.code)}
                itemActionsLabel="新闻操作"
                itemActions={(item) =>
                  item.symbols?.length
                    ? symbolMenu({
                        openChart: { label: '打开图表', onSelect: () => setPicked(`图表 ${item.symbols![0]!.code}`) },
                        copyCode: { label: '复制代码', onSelect: () => setPicked(`复制 ${item.symbols![0]!.code}`) },
                      })
                    : []
                }
              />
            </div>
          </PanelFrameBody>
        </PanelFrame>
      </div>
      <div style={{ overflow: 'auto' }} data-testid="news-split">
        <NewsFeedSplit />
      </div>
      <div style={{ height: 420 }} data-testid="news-cards">
        <NewsFeed
          items={NEWS_ITEMS}
          channels={NEWS_CHANNELS}
          sources={NEWS_SOURCES}
          now={NEWS_NOW}
          labels={NEWS_LABELS}
          defaultLayout="card"
        />
      </div>
    </div>
  )
}

// 建议队列的演示数据是虚构的（品种、策略、来源都不是真实的），时间固定在 DQ_NOW，靠「快进」按钮推进。
const DQ_NOW = Date.UTC(2026, 10, 15, 9, 30, 0)
const DQ_ITEMS: DecisionItem[] = [
  {
    id: 'd1',
    action: '买入',
    target: '星河锂业',
    targetTag: '600001',
    rationale: '产能爬坡超出指引，回测中同类事件后 20 日超额收益为正；仓位建议不超过组合的 3%。',
    confidence: 0.72,
    basis: '事件回测 2023-2026，样本 38 次，胜率 63%',
    sources: [
      { label: '演示通讯社 · 产能公告', href: 'https://example.com/demo/capacity' },
      { label: '回测报告 #12', href: 'https://example.com/demo/backtest-12' },
    ],
    createdAt: DQ_NOW - 4 * 60_000,
    expiresAt: DQ_NOW + 5 * 60_000,
    status: 'pending',
  },
  {
    id: 'd2',
    action: '停策略',
    target: '动量轮动 A',
    targetTag: '策略',
    rationale: '近 20 日回撤超过限额的 80%，且与大盘的相关性升到 0.9，已失去分散作用。',
    confidence: 0.58,
    basis: '风控监控，滚动 20 日',
    sources: [{ label: '风控面板 · 回撤', href: 'https://example.com/demo/risk' }],
    createdAt: DQ_NOW - 9 * 60_000,
    expiresAt: DQ_NOW + 50_000,
    status: 'pending',
  },
  {
    id: 'd3',
    action: '调参数',
    target: '均值回归 B',
    targetTag: '策略',
    rationale: '入场阈值从 2.0 降到 1.6，样本外夏普由 0.8 升到 1.1；换手率增加约 15%。',
    basis: '参数扫描 6 组，样本外 2025-2026',
    sources: [{ label: '参数扫描结果', href: 'https://example.com/demo/sweep' }],
    createdAt: DQ_NOW - 30 * 60_000,
    status: 'snoozed',
  },
  {
    id: 'd4',
    action: '调仓',
    target: '半导体篮子',
    rationale: '把权重从 12% 降到 8%：行业拥挤度处于近三年高位。',
    confidence: 0.64,
    sources: [{ label: '拥挤度数据', href: 'https://example.com/demo/crowd' }],
    createdAt: DQ_NOW - 2 * 3600_000,
    expiresAt: DQ_NOW + 3600_000,
    status: 'accepted',
    resolvedBy: '演示用户',
    resolvedAt: DQ_NOW - 3600_000,
  },
  {
    id: 'd5',
    action: '买入',
    target: '云岭能源',
    targetTag: '600004',
    rationale: '回购公告后的短期反弹，但成交额不足以承接仓位。',
    confidence: 0.41,
    sources: [{ label: '演示通讯社 · 回购', href: 'https://example.com/demo/buyback' }],
    createdAt: DQ_NOW - 5 * 3600_000,
    status: 'rejected',
    resolvedBy: '演示用户',
    resolvedAt: DQ_NOW - 4 * 3600_000,
  },
  {
    id: 'd6',
    action: '卖出',
    target: '海岚电子',
    targetTag: '000003',
    rationale: '触及止盈线；建议分两笔减仓。',
    sources: [{ label: '持仓监控', href: 'https://example.com/demo/position' }],
    createdAt: DQ_NOW - 8 * 3600_000,
    expiresAt: DQ_NOW - 7 * 3600_000,
    status: 'pending',
  },
]
const DQ_LABELS: DecisionQueueLabels = {
  queue: '建议队列',
  filters: '状态筛选',
  filter: { pending: '待处理', accepted: '已接受', rejected: '已拒绝', expired: '已过期' },
  accept: '接受',
  reject: '拒绝',
  snooze: '稍后',
  acceptHint: '按住 1 秒确认接受',
  accepted: '已接受',
  snoozed: '已推后',
  status: { pending: '待处理', snoozed: '稍后', accepted: '已接受', rejected: '已拒绝', expired: '已过期' },
  confidence: (p) => `置信 ${p}%`,
  basis: '依据',
  sources: '来源',
  details: '执行前检查',
  createdAgo: (s) => `生成于 ${s < 3600 ? `${Math.floor(s / 60)} 分钟` : `${Math.floor(s / 3600)} 小时`}前`,
  expiresIn: (s) => `还剩 ${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`,
  expired: '已过期',
  resolvedBy: (by, ago) => `${by} · ${ago}`,
  ago: (s) => (s < 3600 ? `${Math.floor(s / 60)} 分钟前` : `${Math.floor(s / 3600)} 小时前`),
  absolute: (t) => new Date(t).toISOString().replace('T', ' ').slice(0, 16) + ' UTC',
  empty: {
    pending: '没有待处理的建议',
    accepted: '还没有接受过的建议',
    rejected: '还没有拒绝过的建议',
    expired: '没有过期的建议',
  },
}

export function DecisionQueueDemo() {
  const [items, setItems] = useState(DQ_ITEMS)
  const [now, setNow] = useState(DQ_NOW)
  const [log, setLog] = useState('—')
  const settle = (id: string, status: DecisionItem['status'], what: string) => {
    setLog(`${what} ${id}`)
    setItems((prev) =>
      prev.map((i) =>
        i.id === id
          ? { ...i, status, ...(status === 'snoozed' ? {} : { resolvedBy: '演示用户', resolvedAt: now }) }
          : i,
      ),
    )
  }
  return (
    <div className="gal-stack" style={{ width: '100%' }}>
      <p className="gal-note">
        演示数据（品种、策略、来源都是虚构的，时间固定）。接受要按住 1 秒；点「快进 2
        分钟」看倒计时与过期；最近一次回调：
        <span data-testid="dq-log">{log}</span>
      </p>
      <Button data-testid="dq-ff" onClick={() => setNow((n) => n + 120_000)}>
        快进 2 分钟
      </Button>
      <div style={{ height: 520 }} data-testid="dq-frame">
        <PanelFrame aria-label="Decision panel">
          <PanelFrameHeader heading="Decisions" object="· 演示数据" />
          <PanelFrameBody>
            <div style={{ height: '100%', padding: 8 }}>
              <DecisionQueue
                items={items}
                now={now}
                labels={DQ_LABELS}
                holdMs={1000}
                onAccept={(i) => settle(i.id, 'accepted', '接受')}
                onReject={(i) => settle(i.id, 'rejected', '拒绝')}
                onSnooze={(i) => settle(i.id, 'snoozed', '稍后')}
                renderDetail={(i) =>
                  i.id === 'd1' ? (
                    <ConsensusBlock
                      label="执行前检查"
                      intent="买入 · 600001 × 2,000"
                      parties={[
                        { key: 'gw', label: 'GATEWAY', state: 'pass', message: '整手 ✓' },
                        { key: 'risk', label: 'RISK', state: 'warn', message: '集中度 58 / 60' },
                      ]}
                      verdict="warn"
                      verdictText="可提交"
                    />
                  ) : null
                }
              />
            </div>
          </PanelFrameBody>
        </PanelFrame>
      </div>
    </div>
  )
}

// 系统监控的演示数据是虚构的（连接、账户、策略名都不是真实的），时间固定在 MON_NOW。里面有一个出错连接与一个出错策略。
const MON_NOW = Date.UTC(2026, 10, 15, 9, 30, 0)
const SEC = 1000
const MON_LINKS: MonitorLink[] = [
  { id: 'l1', name: '演示交易所 A', group: '交易所 API', state: 'ok', latencyMs: 42, lastBeat: MON_NOW - 2 * SEC },
  { id: 'l2', name: '演示行情源', group: '行情源', state: 'ok', latencyMs: 18, lastBeat: MON_NOW - 1 * SEC },
  {
    id: 'l3',
    name: '演示交易所 B',
    group: '交易所 API',
    state: 'error',
    latencyMs: null,
    lastBeat: MON_NOW - 95 * SEC,
    detail: '签名校验失败（演示）',
  },
  { id: 'l4', name: '策略引擎', group: '引擎', state: 'degraded', latencyMs: 310, lastBeat: MON_NOW - 6 * SEC },
]
const MON_STRATEGIES: MonitorStrategy[] = [
  {
    id: 's1',
    name: '均值回归 · 演示',
    account: '演示账户 1',
    symbol: '600001',
    status: 'running',
    position: '+1,200 股',
    pnl: 1830.5,
    pnlText: '+1,830.50',
    quota: 0.42,
    quotaText: '42%',
    lastTradeAt: MON_NOW - 48 * SEC,
  },
  {
    id: 's2',
    name: '突破跟随 · 演示',
    account: '演示账户 2',
    symbol: 'DEMO-PERP',
    status: 'error',
    position: '−0.8',
    pnl: -420.1,
    pnlText: '−420.10',
    quota: 0.93,
    quotaText: '93%',
    lastTradeAt: MON_NOW - 12 * 60 * SEC,
    error: '下单被拒：签名校验失败',
  },
  {
    id: 's3',
    name: '对冲篮子 · 演示',
    account: '演示账户 1',
    symbol: 'DEMOIDX',
    status: 'paused',
    position: '0',
    pnl: 0,
    pnlText: '0.00',
    quota: 0.1,
    quotaText: '10%',
    lastTradeAt: null,
  },
  { id: 's4', name: '网格 · 演示', account: '演示账户 2', symbol: 'DEMO-SPOT', status: 'stopped', quota: null },
]
const MON_METRICS: SystemMonitorMetric[] = [
  {
    key: 'lat',
    label: 'LATENCY',
    value: '42',
    unit: 'ms',
    series: [38, 40, 39, 44, 41, 52, 47, 43, 42],
    sparkLabel: '延迟走势，最近 9 次',
    note: '近 9 次',
  },
  {
    key: 'err',
    label: 'ERROR RATE',
    value: '2.4',
    unit: '%',
    series: [0, 0, 1, 0, 2, 3, 2, 4, 3, 2],
    sparkLabel: '错误率走势，最近 10 次',
    state: 'near',
    threshold: 4,
    note: '接近阈值（演示 4%）',
  },
]
const MON_EVENTS: MonitorEvent[] = [
  {
    id: 'e1',
    at: MON_NOW - 20 * SEC,
    severity: 'error',
    kind: 'reject',
    text: '突破跟随 · 演示：委托被拒（签名校验失败）',
  },
  { id: 'e2', at: MON_NOW - 48 * SEC, severity: 'info', kind: 'fill', text: '均值回归 · 演示：成交 200 股 @ 演示价' },
  { id: 'e3', at: MON_NOW - 95 * SEC, severity: 'error', kind: 'disconnect', text: '演示交易所 B：连接断开，心跳超时' },
  { id: 'e4', at: MON_NOW - 6 * 60 * SEC, severity: 'warn', kind: 'risk', text: '演示账户 2：额度占用越过预警线' },
  { id: 'e5', at: MON_NOW - 9 * 60 * SEC, severity: 'info', kind: 'order', text: '均值回归 · 演示：下单 200 股' },
  { id: 'e6', at: MON_NOW - 14 * 60 * SEC, severity: 'info', kind: 'reconnect', text: '策略引擎：重连成功' },
]
const MON_KINDS = [
  { value: 'order', label: '下单' },
  { value: 'fill', label: '成交' },
  { value: 'reject', label: '拒单' },
  { value: 'disconnect', label: '断线' },
  { value: 'reconnect', label: '重连' },
  { value: 'risk', label: '风控' },
]
const MON_LABELS: SystemMonitorLabels = {
  monitor: '交易系统监控',
  heading: '系统监控',
  notConnected: '未连接',
  links: '连接状态',
  strategies: '策略实例',
  metrics: '延迟与错误率',
  events: '事件流',
  linkState: { ok: '正常', degraded: '变慢', error: '出错', offline: '断开' },
  strategyStatus: { running: '运行', paused: '暂停', stopped: '停止', error: '出错' },
  severity: { info: '信息', warn: '警告', error: '错误' },
  ago: (s) => (s < 60 ? `${s} 秒前` : s < 3600 ? `${Math.floor(s / 60)} 分钟前` : `${Math.floor(s / 3600)} 小时前`),
  latency: (ms) => `${ms} ms`,
  heartbeat: '心跳',
  noBeat: '无',
  columns: {
    name: '策略',
    account: '账户',
    symbol: '品种',
    status: '状态',
    position: '持仓',
    pnl: '今日盈亏',
    quota: '额度',
    lastTrade: '最后一笔',
    actions: '操作',
  },
  actions: { start: '启动', pause: '暂停', stop: '停止' },
  emergencyStop: '急停',
  emergencyHint: '按住 2 秒，停止全部策略',
  emergencyDone: '已急停',
  eventKinds: '事件类别',
  eventSeverity: '严重程度',
  all: '全部',
  clearKinds: '清除类别筛选',
  noEvents: '没有符合筛选的事件',
  quotaUsed: (p) => `额度已用 ${p}%`,
}

export function SystemMonitorDemo() {
  const [strategies, setStrategies] = useState(MON_STRATEGIES)
  const [log, setLog] = useState('—')
  const act = (s: MonitorStrategy, a: StrategyAction) => {
    setLog(`${a} ${s.id}`)
    const status = a === 'pause' ? 'paused' : a === 'stop' ? 'stopped' : 'running'
    setStrategies((prev) => prev.map((x) => (x.id === s.id ? { ...x, status, error: undefined } : x)))
  }
  return (
    <div className="gal-stack" style={{ width: '100%' }}>
      <p className="gal-note">
        演示数据（连接与策略都是虚构的，时间固定）：一个连接出错、一个策略出错。启停只回调，这里把状态改回去；急停要按住。最后一次操作：
        <span data-testid="mon-log">{log}</span>
      </p>
      <div style={{ height: 760 }} data-testid="mon-frame">
        <PanelFrame aria-label="System monitor panel">
          <PanelFrameHeader heading="Monitor" object="· 演示数据" />
          <PanelFrameBody>
            <div style={{ height: '100%', padding: 8 }}>
              <SystemMonitor
                links={MON_LINKS}
                strategies={strategies}
                metrics={MON_METRICS}
                events={MON_EVENTS}
                eventKinds={MON_KINDS}
                now={MON_NOW}
                labels={MON_LABELS}
                quotaWarnAt={0.9}
                onStrategyAction={act}
                onEmergencyStop={() => {
                  setLog('急停')
                  setStrategies((prev) => prev.map((x) => ({ ...x, status: 'stopped', error: undefined })))
                }}
              />
            </div>
          </PanelFrameBody>
        </PanelFrame>
      </div>
      <div style={{ height: 200 }} data-testid="mon-empty">
        <SystemMonitor
          links={[]}
          strategies={[]}
          metrics={[]}
          events={[]}
          eventKinds={MON_KINDS}
          now={MON_NOW}
          labels={MON_LABELS}
        />
      </div>
    </div>
  )
}

// 假说账的演示数据是虚构的：假说、机构、文章、日期都不是真实的，不含任何真实数字；时间固定在 HL_NOW，靠「快进」推进。
const HL_NOW = Date.UTC(2026, 10, 15)
const HL_DAY = 86_400_000
const hlEv = (
  id: string,
  kind: 'scholar' | 'policy' | 'data' | 'filing',
  stance: 'support' | 'oppose',
  source: string,
  daysAgo: number,
  summary: string,
) => ({
  id,
  kind,
  stance,
  source,
  href: `https://example.com/demo/${id}`,
  publishedAt: HL_NOW - daysAgo * HL_DAY,
  summary,
})
const HL_ITEMS: Hypothesis[] = [
  {
    id: 'h1',
    claim: '政策倾斜假说：资源持续向自主可控的先进制造倾斜，相关产业先拿到信贷与财政支持',
    layer: 'strategy',
    status: 'pending',
    failure: '连续两个季度，产业专项的新增信贷与补贴投向不再向该方向倾斜，或相关表述从规划中撤下。',
    deadline: HL_NOW + 45 * HL_DAY,
    evidence: [
      hlEv(
        'e1',
        'policy',
        'support',
        '演示政策文本 · 产业规划摘要',
        30,
        '规划把先进制造列为首要方向，并写明配套资金安排。',
      ),
      hlEv('e2', 'scholar', 'support', '演示研究所 · 产业政策评论', 21, '认为产业政策重心已从总量刺激转向结构倾斜。'),
      hlEv('e3', 'data', 'oppose', '演示数据库 · 信贷投向', 8, '最近一期新增信贷里，该方向占比环比没有上升。'),
    ],
    assets: [{ label: '先进制造主题篮子', tag: '演示' }],
  },
  {
    id: 'h2',
    claim: '海外配置分流假说：居民与机构增加海外配置，分走一部分境内权益的增量资金',
    layer: 'crossborder',
    status: 'pending',
    failure: '跨境资金净流出连续两个月转为净流入，且境内权益的新增份额不降反升。',
    deadline: HL_NOW + 9 * HL_DAY,
    evidence: [
      hlEv('e4', 'data', 'support', '演示数据库 · 跨境资金流向', 5, '跨境渠道的净流出方向连续出现。'),
      hlEv('e5', 'filing', 'support', '演示基金公司 · 季报', 12, '季报披露海外资产的配置比例较上季提高。'),
    ],
    assets: [
      { label: '海外配置基金', tag: '演示' },
      { label: '境内宽基指数', tag: '演示' },
    ],
  },
  {
    id: 'h3',
    claim: '避险假说：不确定性上升期，资金先流向收益权稳定的资产',
    layer: 'haven',
    status: 'supported',
    failure: '不确定性指标上升的月份里，稳定收益资产的资金流入没有高于其他类别。',
    deadline: HL_NOW - 20 * HL_DAY,
    evidence: [
      hlEv('e6', 'data', 'support', '演示数据库 · 资金流向', 40, '三次不确定性上升期，稳定收益类资产都有净流入。'),
      hlEv('e7', 'scholar', 'support', '演示研究所 · 避险资产综述', 35, '综述归纳了类似的历史规律。'),
    ],
    assets: [{ label: '稳定收益资产篮子', tag: '演示' }],
  },
  {
    id: 'h4',
    claim: '信用供给假说：新增信用主要流向财政与融资平台，而不是民营制造业',
    layer: 'credit',
    status: 'refuted',
    failure: '民营制造业的新增贷款占比连续两个季度上升，且高于平台类。',
    deadline: HL_NOW - 10 * HL_DAY,
    evidence: [
      hlEv('e8', 'data', 'oppose', '演示数据库 · 贷款结构', 14, '民营制造业的新增贷款占比已连续上升，失败条件被触发。'),
      hlEv('e9', 'scholar', 'support', '演示研究所 · 信用观察', 90, '早期观点认为信用向平台集中。'),
    ],
  },
  {
    id: 'h5',
    claim: '利润归属假说：上游涨价的利润被中游吃掉，终端环节拿不到',
    layer: 'profit',
    status: 'pending',
    failure: '终端环节的毛利连续两个季度随上游价格同步改善。',
    deadline: HL_NOW - 6 * HL_DAY,
    evidence: [hlEv('e10', 'filing', 'support', '演示公司 · 半年报', 50, '中游毛利改善，终端毛利持平。')],
    assets: [{ label: '中游材料龙头', tag: '演示' }],
  },
  {
    id: 'h6',
    claim: '财政分配假说：专项债与补贴的使用向基建之外的产业升级倾斜',
    layer: 'fiscal',
    status: 'pending',
    failure: '下一轮预算执行报告里，产业升级类支出占比低于基建类。',
    deadline: HL_NOW + 120 * HL_DAY,
    evidence: [],
  },
]
const HL_WATCH: WatchRow[] = [
  {
    layer: 'strategy',
    evidence: '规划与会议原文里的表述变化、配套资金安排',
    confusion: '口号式表述和有预算的安排不是一回事',
  },
  { layer: 'credit', evidence: '新增信贷的投向结构、利率走势', confusion: '总量宽松不等于流向目标产业' },
  { layer: 'fiscal', evidence: '预算执行、专项债与补贴的使用方向', confusion: '计划额度和实际拨付之间有时间差' },
  { layer: 'crossborder', evidence: '跨境资金净流向、海外配置比例', confusion: '汇率变动造成的账面变化不是资金流动' },
  { layer: 'industry', evidence: '订单、产能利用率、资本开支', confusion: '订单预期和已经确认的收入要分开看' },
  { layer: 'profit', evidence: '各环节毛利、价格传导的先后', confusion: '收入增长不等于利润落到该环节' },
  { layer: 'allocation', evidence: '基金份额变化、机构持仓披露', confusion: '被动跟踪的资金流入不代表主动看好' },
  { layer: 'haven', evidence: '不确定性指标上升期的资金去向', confusion: '短期恐慌性抛售和中期配置调整混在一起' },
]
const HL_LABELS: HypothesisLedgerLabels = {
  ledger: '假说账',
  views: '视图',
  viewLedger: '假说',
  viewWatch: '观察表',
  statusFilter: '状态筛选',
  layerFilter: '传导层筛选',
  clearLayers: '清除层筛选',
  all: '全部',
  layer: {
    strategy: '国家战略',
    credit: '信用供给',
    fiscal: '财政分配',
    crossborder: '跨境流动',
    industry: '产业承接',
    profit: '利润归属',
    allocation: '资产配置',
    haven: '避险',
  },
  status: { pending: '待验证', supported: '有支持', refuted: '被否定', expired: '过期' },
  kind: { scholar: '学者观点', policy: '政策原文', data: '数据', filing: '财报' },
  stance: { support: '支持', oppose: '反对' },
  failure: '失败条件',
  evidence: '证据',
  assets: '关联',
  noEvidence: '还没有证据',
  tally: (s, o) => `${s} 支持 · ${o} 反对`,
  deadlineIn: (d) => (d === 0 ? '今天到期' : `还剩 ${d} 天`),
  overdueBy: (d) => `已过期 ${d} 天`,
  date: (t) => new Date(t).toISOString().slice(0, 10),
  empty: '没有符合条件的假说',
  watchLayer: '传导层',
  watchEvidence: '核心证据',
  watchConfusion: '最容易混淆的地方',
}

export function HypothesisLedgerDemo() {
  const [now, setNow] = useState(HL_NOW)
  return (
    <div className="gal-stack" style={{ width: '100%' }}>
      <p className="gal-note">
        演示数据（假说、机构、文章与日期都是虚构的，不含真实数字，时间固定在{' '}
        <span data-testid="hl-now">2026-11-15</span>
        ）。点一行展开失败条件与证据；点「快进 10 天」看倒计时与自动过期。
      </p>
      <Button data-testid="hl-ff" onClick={() => setNow((n) => n + 10 * HL_DAY)}>
        快进 10 天
      </Button>
      <div style={{ height: 560 }} data-testid="hl-frame">
        <PanelFrame aria-label="Hypothesis panel">
          <PanelFrameHeader heading="Hypotheses" object="· 演示数据" />
          <PanelFrameBody>
            <div style={{ height: '100%', padding: 8 }}>
              <HypothesisLedger items={HL_ITEMS} watch={HL_WATCH} now={now} labels={HL_LABELS} />
            </div>
          </PanelFrameBody>
        </PanelFrame>
      </div>
    </div>
  )
}
