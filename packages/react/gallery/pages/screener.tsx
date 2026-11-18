// SPDX-License-Identifier: MIT
import { SearchIcon } from 'lucide-react'
import { useMemo, useState } from 'react'
import { LiveToggle } from '../LiveToggle.tsx'
import { chance, useLiveTicker } from '../live-sim.ts'
import { ColumnPicker, ColumnSetTabs, DataGrid, NewsReader, type GridColumnLayout } from '../../src/blocks/index.ts'
import {
  FilterBar,
  ToggleGroup,
  ToggleGroupItem,
  ViewSwitcher,
  applyFilters,
  type FilterBarLabels,
  type FilterCondition,
  type FilterField,
} from '../../src/index.ts'
import { STOCKS, STOCK_COLUMNS, STOCK_LAYOUT, STOCK_SETS, type Stock } from './screener-data.tsx'

// 选股器的演示（FilterBar + ColumnSetTabs + DataGrid comfortable 档，#90）：股票、代码、数字全是编出来的，不是行情；数据与列在 screener-data.tsx。

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
  const [layout, setLayout] = useState<GridColumnLayout[]>([...STOCK_LAYOUT])
  const [locale, setLocale] = useState('en-US')
  const [sort, setSort] = useState<{ id: string; desc: boolean } | null>(null)
  const rows = useMemo(
    () =>
      applyFilters(STOCKS, conditions, (row, field) => {
        const value = row[field as keyof Stock]
        return typeof value === 'number' || typeof value === 'string' ? value : undefined
      }),
    [conditions],
  )
  // 代码列的表头第二行写总数（TradingView 选股器的「N 个」）。
  const shownLayout = useMemo(
    () =>
      layout.map((column) =>
        column.id === 'symbol' ? { ...column, sub: `${rows.length} / ${STOCKS.length}` } : column,
      ),
    [layout, rows.length],
  )
  return (
    <div className="gal-stack" style={{ width: '100%', maxWidth: 1180 }}>
      <p className="gal-note">
        演示数据（16
        只虚构股票，徽标是自绘示意图，不是真实标志）。标题是已保存筛选的下拉；点过滤胶囊选预设或手动设；左边的撤销与重做按钮管过滤条件；「+」加字段；「⋯」重置。表是
        comfortable 档（整页表）；列集「走势」「分红」里有迷你图、52 周区间、股息率与财报日。
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <ColumnSetTabs layout={layout} onLayoutChange={setLayout} sets={STOCK_SETS} label="列集" />
        <ToggleGroup size="sm" aria-label="数字缩写" value={locale} onValueChange={(v) => v && setLocale(v)}>
          <ToggleGroupItem value="en-US">K / M / B</ToggleGroupItem>
          <ToggleGroupItem value="zh-CN">万 / 亿</ToggleGroupItem>
        </ToggleGroup>
      </div>
      <div style={{ display: 'flex', height: 560 }} data-testid="screener-grid">
        <DataGrid
          columns={STOCK_COLUMNS}
          layout={shownLayout}
          rows={rows}
          rowId={(row) => row.code}
          label="选股结果"
          sort={sort}
          onSortChange={setSort}
          density="comfortable"
          locale={locale}
          timeZone="utc"
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
              sets={STOCK_SETS}
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
