// SPDX-License-Identifier: MIT
import { SearchIcon } from 'lucide-react'
import { useMemo, useState } from 'react'
import { LiveToggle } from '../LiveToggle.tsx'
import { chance, useLiveTicker } from '../live-sim.ts'
import { RatingText, formatVolume, type RatingLevel } from '../../src/quant/index.ts'
import {
  ColumnPicker,
  ColumnSetTabs,
  DataGrid,
  NewsReader,
  type ColumnSet,
  type GridColumn,
  type GridColumnLayout,
} from '../../src/blocks/index.ts'
import {
  FilterBar,
  ViewSwitcher,
  applyFilters,
  type FilterBarLabels,
  type FilterCondition,
  type FilterField,
} from '../../src/index.ts'

// 选股器的演示（FilterBar + ColumnSetTabs + DataGrid）：股票、代码、数字全是编出来的，不是行情。

type Stock = {
  code: string
  name: string
  price: number
  change: number
  mcap: number
  pe: number
  sector: string
  yield: number
  rating: RatingLevel
}

const STOCKS: readonly Stock[] = [
  {
    code: 'ALFA',
    name: '示例阿尔法科技',
    price: 356.27,
    change: 1.82,
    mcap: 5.18e12,
    pe: 34.1,
    sector: '科技',
    yield: 0.6,
    rating: 'strong-buy',
  },
  {
    code: 'BETA',
    name: '示例贝塔零售',
    price: 142.5,
    change: -0.74,
    mcap: 3.4e11,
    pe: 21.4,
    sector: '消费',
    yield: 1.9,
    rating: 'buy',
  },
  {
    code: 'GAMA',
    name: '示例伽马半导体',
    price: 612.9,
    change: 3.15,
    mcap: 1.1e12,
    pe: 48.7,
    sector: '科技',
    yield: 0.2,
    rating: 'strong-buy',
  },
  {
    code: 'DELT',
    name: '示例德尔塔能源',
    price: 48.6,
    change: -1.2,
    mcap: 8.8e10,
    pe: 9.3,
    sector: '能源',
    yield: 4.8,
    rating: 'sell',
  },
  {
    code: 'EPSI',
    name: '示例艾普西隆汽车',
    price: 17.35,
    change: 0.4,
    mcap: 5.6e10,
    pe: 12.8,
    sector: '工业',
    yield: 2.7,
    rating: 'neutral',
  },
  {
    code: 'ZETA',
    name: '示例泽塔矿业',
    price: 9.12,
    change: -2.6,
    mcap: 1.9e10,
    pe: 7.1,
    sector: '材料',
    yield: 5.9,
    rating: 'strong-sell',
  },
  {
    code: 'ETAX',
    name: '示例伊塔生物',
    price: 74.0,
    change: 0.0,
    mcap: 2.4e10,
    pe: 0,
    sector: '医疗',
    yield: 0,
    rating: 'neutral',
  },
  {
    code: 'THET',
    name: '示例西塔金融',
    price: 211.8,
    change: 0.95,
    mcap: 4.6e11,
    pe: 14.2,
    sector: '金融',
    yield: 3.1,
    rating: 'buy',
  },
]

const RATING_ORDER: readonly RatingLevel[] = ['strong-sell', 'sell', 'neutral', 'buy', 'strong-buy']
const RATING_TEXT: Record<RatingLevel, string> = {
  'strong-sell': '强力卖出',
  sell: '卖出',
  neutral: '中性',
  buy: '买入',
  'strong-buy': '强力买入',
}

const COLUMNS: readonly GridColumn<Stock>[] = [
  { id: 'symbol', type: 'symbol', value: (row) => ({ code: row.code, venue: '', name: row.name }) },
  { id: 'price', type: 'price', value: (row) => row.price },
  { id: 'change', type: 'change', value: (row) => row.change },
  { id: 'mcap', type: 'number', value: (row) => row.mcap, text: (row) => `${formatVolume(row.mcap)} USD` },
  { id: 'pe', type: 'number', value: (row) => row.pe, text: (row) => (row.pe ? row.pe.toFixed(1) : '—') },
  { id: 'yield', type: 'number', value: (row) => row.yield, text: (row) => `${row.yield.toFixed(1)}%` },
  {
    id: 'rating',
    type: 'custom',
    sort: (row) => RATING_ORDER.indexOf(row.rating),
    text: (row) => RATING_TEXT[row.rating],
    cell: (row) => <RatingText level={row.rating}>{RATING_TEXT[row.rating]}</RatingText>,
  },
  { id: 'sector', type: 'text', value: (row) => row.sector },
]

const LAYOUT: readonly GridColumnLayout[] = [
  { id: 'symbol', label: '代码', width: 200, visible: true },
  { id: 'price', label: '价格', width: 100, visible: true },
  { id: 'change', label: '涨跌幅', width: 90, visible: true },
  { id: 'mcap', label: '市值', width: 120, visible: true },
  { id: 'pe', label: '市盈率', sub: 'TTM', width: 90, visible: true },
  { id: 'yield', label: '股息率', sub: 'TTM', width: 90, visible: false },
  { id: 'rating', label: '分析师评级', width: 130, visible: true },
  { id: 'sector', label: '板块', width: 90, visible: true },
]

const SETS: readonly ColumnSet[] = [
  { id: 'overview', label: '概览', columns: ['symbol', 'price', 'change', 'mcap', 'pe', 'rating', 'sector'] },
  { id: 'valuation', label: '估值', columns: ['symbol', 'price', 'pe', 'mcap'] },
  { id: 'dividends', label: '分红', columns: ['symbol', 'price', 'yield', 'sector'] },
]

const NUM_OPS = [
  { value: 'gt', label: '大于' },
  { value: 'lt', label: '小于' },
  { value: 'between', label: '介于（下限..上限）' },
]

const FIELDS: readonly FilterField[] = [
  {
    key: 'price',
    label: '价格',
    group: '市场数据',
    shown: true,
    operators: NUM_OPS,
    presets: [
      { key: 'p-high', label: '高于 100', hint: '高价股', op: 'gt', value: '100' },
      { key: 'p-mid', label: '10 到 100', hint: '中价股', op: 'between', value: '10..100' },
      { key: 'p-low', label: '低于 10', hint: '低价股', op: 'lt', value: '10' },
    ],
  },
  {
    key: 'change',
    label: '涨跌幅',
    group: '市场数据',
    shown: true,
    operators: NUM_OPS,
    presets: [
      { key: 'c-up', label: '上涨', hint: '涨跌幅大于 0', op: 'gt', value: '0' },
      { key: 'c-big', label: '涨超 2%', hint: '强势', op: 'gt', value: '2' },
    ],
  },
  {
    key: 'mcap',
    label: '市值',
    group: '市场数据',
    shown: true,
    operators: NUM_OPS,
    presets: [
      { key: 'm-large', label: '大盘股', hint: '高于 1000 亿', op: 'gt', value: '1e11' },
      { key: 'm-small', label: '小盘股', hint: '低于 300 亿', op: 'lt', value: '3e10' },
    ],
  },
  { key: 'pe', label: '市盈率', group: '估值', shown: true, operators: NUM_OPS },
  { key: 'yield', label: '股息率', group: '分红', operators: NUM_OPS },
  {
    key: 'sector',
    label: '板块',
    group: '证券信息',
    shown: true,
    input: 'text',
    operators: [{ value: 'eq', label: '等于' }],
    presets: ['科技', '消费', '能源', '金融'].map((v) => ({ key: v, label: v, op: 'eq', value: v })),
  },
]

const BAR_LABELS: FilterBarLabels = {
  bar: '过滤条',
  add: '添加过滤',
  more: '更多',
  reset: '重置全部过滤',
  search: '搜索',
  noMatch: '没有匹配项',
  presets: '预设条件',
  manual: '手动设置',
  operator: '运算符',
  value: '值',
  apply: '应用',
  remove: '移除过滤',
  clear: '清除条件',
  back: '返回',
  otherGroup: '其他',
  undo: '撤销',
  redo: '重做',
}

const COLUMN_PICKER_LABELS = { trigger: '添加列', sets: '列集', columns: '列' }

const SAVED_SCREENS: Record<string, { label: string; conditions: FilterCondition[] }> = {
  all: { label: '全部股票', conditions: [] },
  dividend: {
    label: '高股息',
    conditions: [{ id: 'v-div', field: 'yield', op: 'gt', value: '2.5', label: '高于 2.5%' }],
  },
  large: {
    label: '大盘科技',
    conditions: [
      { id: 'v-mcap', field: 'mcap', op: 'gt', value: '1e11', label: '大盘股' },
      { id: 'v-sector', field: 'sector', op: 'eq', value: '科技', label: '科技' },
    ],
  },
}

export function ScreenerDemo() {
  const [screen, setScreen] = useState('all')
  const [saved, setSaved] = useState<readonly { key: string; label: string }[]>(
    Object.entries(SAVED_SCREENS).map(([key, v]) => ({ key, label: v.label })),
  )
  const [conditions, setConditions] = useState<FilterCondition[]>([])
  const [layout, setLayout] = useState<GridColumnLayout[]>([...LAYOUT])
  const [sort, setSort] = useState<{ id: string; desc: boolean } | null>(null)
  const rows = useMemo(() => applyFilters(STOCKS, conditions, (row, field) => row[field as keyof Stock]), [conditions])
  // 代码列的表头第二行写总数（TradingView 选股器的「N 个」）。
  const shownLayout = useMemo(
    () =>
      layout.map((column) =>
        column.id === 'symbol' ? { ...column, sub: `${rows.length} / ${STOCKS.length}` } : column,
      ),
    [layout, rows.length],
  )
  return (
    <div className="gal-stack" style={{ width: '100%', maxWidth: 900 }}>
      <p className="gal-note">
        演示数据（股票是虚构的）。标题是已保存筛选的下拉；点过滤胶囊选预设或手动设；左边的撤销与重做按钮管过滤条件；「+」加字段；「⋯」重置。
      </p>
      <ViewSwitcher
        views={saved}
        value={screen}
        onValueChange={(key) => {
          setScreen(key)
          setConditions(SAVED_SCREENS[key]?.conditions ?? [])
        }}
        onSave={() => {
          const key = `saved-${saved.length}`
          setSaved([...saved, { key, label: `未命名筛选 ${saved.length - 2}` }])
          setScreen(key)
        }}
        labels={{ trigger: '已保存的筛选', save: '另存为…' }}
      />
      <FilterBar fields={FIELDS} value={conditions} onValueChange={setConditions} labels={BAR_LABELS} />
      <ColumnSetTabs layout={layout} onLayoutChange={setLayout} sets={SETS} label="列集" />
      <div style={{ display: 'flex', height: 320 }} data-testid="screener-grid">
        <DataGrid
          columns={COLUMNS}
          layout={shownLayout}
          rows={rows}
          rowId={(row) => row.code}
          label="选股结果"
          // 列由用户用列集与「加列」自己挑：不替他按优先级收起（#122），放不下就横向滚动
          collapseColumns={false}
          sort={sort}
          onSortChange={setSort}
          headExtra={(id) =>
            id === 'symbol' ? (
              <span className="k-grid-head-icon" role="img" aria-label="搜索代码">
                <SearchIcon size={12} aria-hidden="true" />
              </span>
            ) : null
          }
          headEnd={
            <ColumnPicker
              layout={layout}
              onLayoutChange={setLayout}
              sets={SETS}
              labels={COLUMN_PICKER_LABELS}
              iconOnly
            />
          }
        />
      </div>
    </div>
  )
}

export function NewsReaderDemo() {
  // 实时模拟：阅读中的这一条偶尔被改（标题加「更新 n」、多一段更正）；第一拍必改，手动步进有确定结果。
  const { state } = useLiveTicker(
    { rev: 0 },
    (s, rng, tick) => (tick === 0 || chance(rng, 0.35) ? { rev: s.rev + 1 } : s),
    { intervalMs: 4000 },
  )
  return (
    <div style={{ width: '100%', maxWidth: 560, display: 'grid', gap: 8 }}>
      <LiveToggle labels={{ group: '数据刷新', live: '实时', paused: '暂停' }} />
      <NewsReader
        title={`演示：虚构公司公布季度业绩，营收好于预期${state.rev > 0 ? `（更新 ${state.rev}）` : ''}`}
        version={state.rev}
        source="演示通讯社"
        meta="7 分钟前 · 演示通讯社 · 2 分钟阅读"
        symbols={[
          { code: 'ALFA', name: '示例阿尔法科技', change: 1.82 },
          { code: 'BETA', name: '示例贝塔零售', change: -0.59 },
        ]}
        keyPoints={['营收同比增长 12%，高于市场预期的 9%', '管理层上调全年指引', '盘后股价上涨']}
        labels={{
          reader: '新闻阅读',
          keyPoints: '要点',
          close: '关闭',
          report: '举报',
          copyLink: '复制链接',
          updated: '已更新',
        }}
        onClose={() => undefined}
        onReport={() => undefined}
        onCopyLink={() => undefined}
      >
        <p>以上内容是演示文字，公司、数字与来源都是虚构的。</p>
        <p>正文由调用方传入，品种胶囊可以用 NewsSymbolChip 内联在正文里。</p>
        {state.rev > 0 && <p>更正：第 {state.rev} 次修订，数字与表述已更新（演示）。</p>}
      </NewsReader>
    </div>
  )
}
