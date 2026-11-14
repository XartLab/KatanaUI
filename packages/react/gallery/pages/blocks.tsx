// SPDX-License-Identifier: MIT
import { Bell, Camera, Maximize2, Settings, X } from 'lucide-react'
import { useState } from 'react'
import {
  DataGrid,
  DataGridHostProvider,
  EmptyState,
  EstimateBadge,
  NewsFeed,
  PanelFrame,
  PanelFrameBody,
  PanelFrameHeader,
  StatusBar,
  ToolButton,
  Toolbar,
  ToolbarGroup,
  ToolSlot,
  WorkspaceTabs,
  type DataGridHost,
  type GridColumn,
  type GridColumnLayout,
  type NewsFeedLabels,
  type NewsItem,
  type SortSpec,
  type StatusItem,
  type WorkspaceTab,
} from '../../src/blocks/index.ts'
import { Button, Splitter } from '../../src/index.ts'
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
                onSymbolPick={(s) => setPicked(s.code)}
              />
            </div>
          </PanelFrameBody>
        </PanelFrame>
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
