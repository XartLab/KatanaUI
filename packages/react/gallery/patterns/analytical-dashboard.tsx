// SPDX-License-Identifier: MIT
import {
  DataGrid,
  PanelFrame,
  PanelFrameBody,
  PanelFrameHeader,
  type GridColumn,
  type GridColumnLayout,
} from '../../src/blocks'
import { Sparkline } from '../../src/index'
import { SparkTile } from '../../src/quant'
import type { Pattern } from './types'

// 演示数据：全是编的，不是行情或账户。
const NAV = [100, 101.2, 100.6, 102.4, 103.1, 102.2, 104.0, 105.3, 104.8, 106.1]
const TILES = [
  { label: 'NET ASSET', value: '2.42M', series: NAV, delta: 1.31, note: '今日' },
  {
    label: 'DRAWDOWN',
    value: '-3.1%',
    series: [4, 8, 6, 12, 10, 16, 12, 18, 14],
    delta: undefined,
    note: '峰值 -6.8%',
  },
  { label: 'TURNOVER', value: '0.62', series: [10, 12, 9, 14, 11, 13, 10, 12, 11], delta: -0.8, note: '近 9 期' },
  { label: 'EXPOSURE', value: '131%', series: [16, 14, 15, 10, 11, 8, 9, 5, 4], delta: 2.1, note: '上限 150%' },
]

type Row = { id: string; symbol: string; pnl: number; qty: number }
const ROWS: readonly Row[] = [
  { id: 'a', symbol: '示例 A', pnl: 1250.4, qty: 1200 },
  { id: 'b', symbol: '示例 B', pnl: -310.75, qty: 800 },
  { id: 'c', symbol: '示例 C', pnl: 88.2, qty: 300 },
]
const COLUMNS: readonly GridColumn<Row>[] = [
  { id: 'symbol', type: 'text', value: (r) => r.symbol },
  { id: 'qty', type: 'quantity', value: (r) => r.qty },
  { id: 'pnl', type: 'pnl', value: (r) => r.pnl },
]
const LAYOUT: readonly GridColumnLayout[] = [
  { id: 'symbol', label: '品种', width: 120, visible: true },
  { id: 'qty', label: '数量', width: 90, visible: true },
  { id: 'pnl', label: '盈亏', width: 100, visible: true },
]

function Demo() {
  return (
    <div className="gal-stack" style={{ width: '100%', maxWidth: 900 }}>
      <p className="gal-note">演示数据。</p>
      <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
        {TILES.map((t) => (
          <SparkTile key={t.label} {...t} sparkLabel={`${t.label} 走势`} />
        ))}
      </div>
      <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
        <div style={{ height: 200 }}>
          <PanelFrame aria-label="净值走势">
            <PanelFrameHeader heading="净值" object="· 近 10 日" />
            <PanelFrameBody>
              <div style={{ padding: 12 }}>
                <Sparkline values={NAV} label="近 10 日净值，上升" />
              </div>
            </PanelFrameBody>
          </PanelFrame>
        </div>
        <div style={{ height: 200 }}>
          <PanelFrame aria-label="持仓">
            <PanelFrameHeader heading="持仓" object="· 3 个" />
            <PanelFrameBody>
              <DataGrid columns={COLUMNS} layout={LAYOUT} rows={ROWS} rowId={(r) => r.id} label="持仓" />
            </PanelFrameBody>
          </PanelFrame>
        </div>
      </div>
    </div>
  )
}

const pattern: Pattern = {
  id: 'analytical-dashboard',
  title: '分析看板',
  summary: '一屏回答「现在怎么样」：上面一排指标卡给结论，下面是图和表给依据，栅格随宽度自动换行。',
  Demo,
  use: ['每天打开第一眼看的总览：账户、策略组、市场情绪', '指标、曲线、明细要同屏对照，但不需要在屏内互相联动'],
  avoid: [
    '单个对象的深挖（一只票的全部信息）：用单品种页，不是看板',
    '要拖拽自定义布局：先用固定栅格，别一上来做可拖拽',
  ],
  parts: [
    { page: 'spark-tile', role: '顶部指标卡：标签、大数、迷你线、变化' },
    { page: 'panel-frame', role: '每块图和表的外框：标题栏、对象名、焦点态' },
    { page: 'sparkline', role: '面板里的轻量走势' },
    { page: 'data-grid', role: '明细表，放在图旁边' },
    { page: 'metric-card', role: '指标要带多个区间和来源时换成它' },
  ],
  rules: [
    '三层：指标卡 → 图 → 表；指标卡一排 4–6 张，宽 ≥ 180px，用 auto-fit 自动换行',
    '图和表的栅格 minmax(320px, 1fr)，间距统一 12px；不要出现嵌套的卡片套卡片',
    '每个面板用 PanelFrame，标题写「对象 · 范围」，状态（加载、断线）画在面板里，不在整屏盖遮罩',
    '全屏只放一个主题：想加第 7 张指标卡就该拆成第二个看板',
    '所有数字带来源和更新时间；演示和实盘数据必须能一眼分开',
    '看板里不放确认类操作；要动手的按钮放进面板标题栏右侧，一块最多 2 个',
  ],
  source: {
    label: 'Salt · Analytical dashboard',
    href: 'https://www.saltdesignsystem.com/salt/patterns/analytical-dashboard',
  },
}
export default pattern
