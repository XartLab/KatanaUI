// SPDX-License-Identifier: MIT
// 自选表的行序与旗标（#77 G7）：DataGrid 的拖行 / Alt+↑↓ / 分节标题行，FlagMark + useFlags + FlagFilter。
// 照 TradingView 自选表（主会话 2026-11-18 实看：行左端燕尾旗，右键菜单头一项 Flag/Unflag 加一排色点，列表上方旗标按钮过滤，Add section 分节）。
// #87：分节可收起、标题写行数与本节平均涨跌、按列排序时标题不动；Alt+Enter 给键盘所在的行插旗 / 拔旗（经 useHotkeys，只在表有焦点时登记为可用）。
// 数据是写死的示例，不是行情。
import { useState } from 'react'
import {
  DataGrid,
  DataGridHostProvider,
  useRowOrder,
  type DataGridHost,
  type GridColumn,
  type GridColumnLayout,
  type GridMenuEntry,
  type SortSpec,
} from '../../src/blocks'
import { FlagFilter, FlagMark, useFlags, useHotkeys, type FlagDef, type Flags } from '../../src/index.ts'
import { FlagMarkUsage } from '../usage/FlagMarkUsage.tsx'

type WatchRow = { id: string; symbol: string; last: number; chg: number; section?: string }

const ROWS: readonly WatchRow[] = [
  { id: 'sec-crypto', symbol: '', last: 0, chg: 0, section: 'Crypto' },
  { id: 'BTCUSDT', symbol: 'BTCUSDT', last: 63971.2, chg: -1.45 },
  { id: 'ETHUSDT', symbol: 'ETHUSDT', last: 1789.3, chg: -1.91 },
  { id: 'SOLUSDT', symbol: 'SOLUSDT', last: 74.09, chg: -1.38 },
  { id: 'sec-stocks', symbol: '', last: 0, chg: 0, section: 'Stocks' },
  { id: 'NVDA', symbol: 'NVDA', last: 159.55, chg: -1.26 },
  { id: 'QQQ', symbol: 'QQQ', last: 660.71, chg: -0.89 },
  { id: 'XAUUSD', symbol: 'XAUUSD', last: 3760.2, chg: -2.46 },
]

export const WATCH_FLAGS: readonly FlagDef[] = [
  { id: 'red', label: 'Watch', color: 'danger' },
  { id: 'amber', label: 'Setup', color: 'warn' },
  { id: 'green', label: 'Held', color: 'ok' },
  { id: 'gray', label: 'Later', color: 'neutral' },
]

const LAYOUT: readonly GridColumnLayout[] = [
  { id: 'flag', label: '', width: 24, visible: true },
  { id: 'symbol', label: 'Symbol', width: 120, visible: true },
  { id: 'last', label: 'Last', width: 100, visible: true },
  { id: 'chg', label: 'Chg%', width: 80, visible: true },
]

const HOST: DataGridHost = {
  labels: { copy: 'Copy', save: 'Export CSV…', resetColumns: 'Reset columns' },
}

const columnsFor = (flags: Flags): GridColumn<WatchRow>[] => [
  {
    id: 'flag',
    type: 'custom',
    text: (row) => flags.flagOf(row.id)?.label ?? '',
    cell: (row) => (
      <FlagMark
        flag={flags.flagOf(row.id)}
        onToggle={() => flags.toggle(row.id)}
        label={`Flag ${row.symbol}`}
        focusable={false}
      />
    ),
  },
  { id: 'symbol', type: 'text', value: (row) => row.symbol },
  { id: 'last', type: 'price', value: (row) => row.last },
  { id: 'chg', type: 'change', value: (row) => row.chg },
]

/** DataGrid 页上的自选表演示：拖行、Alt+↑↓、分节、旗标与按旗过滤。 */
export function WatchlistOrderDemo() {
  const [sort, setSort] = useState<SortSpec | null>(null)
  const flags = useFlags({ flags: WATCH_FLAGS, defaultValue: { ETHUSDT: 'red', NVDA: 'green' } })
  const isSection = (id: string) => id.startsWith('sec-')
  const rowOrder = useRowOrder({ ids: ROWS.map((row) => row.id), isSection })
  const rows = flags.filter === null ? ROWS : flags.filterRows(ROWS, (row) => row.id)
  // Alt+Enter 插旗（TradingView 自选表的键）：作用在键盘所在的行；表没焦点时这条不可用，键留给别处。
  const [cursor, setCursor] = useState<string | null>(null)
  const [focused, setFocused] = useState(false)
  useHotkeys([
    {
      id: 'watchlist-flag',
      combo: 'Alt+Enter',
      label: 'Flag / unflag',
      scope: 'watchlist',
      enabled: focused && cursor !== null && !isSection(cursor),
      handler: () => {
        if (cursor !== null) flags.toggle(cursor)
      },
    },
  ])
  const flagMenu = (target: WatchRow[]): GridMenuEntry[] =>
    target.length === 1 && !target[0].section
      ? flags.menu(target[0].id, 'Unflag').map((item) => ({ type: 'item', ...item }))
      : []
  return (
    <>
      <p className="gal-note">
        示例数据：拖一行换位置（选中几行一起拖，拖到一半 Esc 取消），或选中后 Alt+↑ /
        Alt+↓；拖分节标题（CRYPTO、STOCKS）整节一起走。 行左端点一下插旗（再点拔掉），或选中一行按
        Alt+Enter；右键菜单里选色；上方旗标按钮按旗过滤。分节标题左端的三角收起这一节（键盘：在标题行上按 ← / → /
        Enter），标题写行数，Chg%
        列下写本节平均涨跌（sectionAggregates）。点表头排序后不能挪行，标题行不跟着排、各节在节内排。
      </p>
      <div
        data-testid="grid-order"
        style={{ width: '100%', maxWidth: 420 }}
        onFocus={() => setFocused(true)}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false)
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 6 }}>
          <FlagFilter flags={flags} label="Filter by flag" showEmpty />
          <span className="gal-note" data-testid="grid-order-value" style={{ margin: 0 }}>
            {rowOrder.order.filter((id) => !isSection(id)).join(' ')}
          </span>
        </div>
        <DataGridHostProvider value={HOST}>
          <DataGrid
            columns={columnsFor(flags)}
            layout={LAYOUT}
            rows={rows}
            rowId={(row) => row.id}
            label="Watchlist"
            sort={sort}
            onSortChange={setSort}
            {...rowOrder.gridProps}
            rowSection={(row) => row.section}
            sectionAggregates={{ chg: 'avg' }}
            onCursorChange={setCursor}
            menu={flagMenu}
            extrasFirst
            fit
          />
        </DataGridHostProvider>
      </div>
    </>
  )
}

/** FlagMark 页：四面旗的样子、没插的空心旗、只读标记，加最小用法。 */
export function FlagMarkDemo() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div data-testid="flag-states" style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        {WATCH_FLAGS.map((flag) => (
          <span key={flag.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
            <FlagMark flag={flag} label={flag.label} />
            <span className="gal-note" style={{ margin: 0 }}>
              {flag.label}
            </span>
          </span>
        ))}
        <FlagMark onToggle={() => {}} label="Flag" alwaysShown />
      </div>
      <FlagMarkUsage />
    </div>
  )
}
