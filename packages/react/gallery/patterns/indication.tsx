// SPDX-License-Identifier: MIT
import { BadgeGroup, Led, StatusIcon, UptimeBars, type UptimeCell } from '../../src/index'
import type { Pattern } from './types'

// 演示数据：连接状态是编的，不是真实的链路。
const CELLS: UptimeCell[] = Array.from({ length: 30 }, (_, i) => ({
  id: String(i),
  status: i === 6 ? 'down' : i === 19 || i === 20 ? 'degraded' : 'up',
  label: `第 ${i + 1} 天`,
}))
const ACTIONS = { group: '图的操作', table: '表格视图', exportCsv: '导出 CSV', fullscreen: '全屏' }

const rowStyle = { display: 'flex', alignItems: 'center', gap: 8 } as const

function Demo() {
  return (
    <div className="gal-stack" style={{ width: '100%', maxWidth: 560 }}>
      <p className="gal-note">演示数据。</p>
      <div style={rowStyle}>
        <Led state="ok" label="行情已连接" /> 行情 42 ms
        <Led state="warn" label="下单变慢" /> 下单 318 ms
        <Led state="danger" label="交易所 B 已断开" /> 交易所 B 断开
      </div>
      <div style={rowStyle}>
        <StatusIcon tone="ok" label="已同步" /> 已同步
        <StatusIcon tone="pending" label="同步中" /> 同步中
        <StatusIcon tone="danger" label="同步失败" /> 同步失败
      </div>
      <div style={rowStyle}>
        示例股票 <BadgeGroup items={[{ id: 'star', label: '科', text: '科创板：涨跌幅 20%' }]} />
      </div>
      <UptimeBars
        cells={CELLS}
        label="近 30 天链路可用性"
        actionLabels={ACTIONS}
        tableLabel="逐日可用表"
        tableHead={['日期', '状态']}
        source="来源 / 演示数据 · 非真实链路"
      />
    </div>
  )
}

const pattern: Pattern = {
  id: 'indication',
  title: '状态指示',
  summary: '用最小的东西说清「现在好不好」：灯看连接，图标看任务，上标徽标看品种风险，条带看一段时间的健康度。',
  Demo,
  use: ['常驻的连接和系统健康（行情、下单、策略引擎）：Led', '一件事的进展和结果（同步中、成功、失败）：StatusIcon'],
  avoid: [
    '要解释原因或给下一步：用 Alert 或 Toast，别只放一个灯',
    '品种身上的长期属性（板块、风险标记）：上标徽标，不要用状态灯',
  ],
  parts: [
    { page: 'led', role: '连接与健康：on / ok / warn / danger / off' },
    { page: 'status-icon', role: '任务状态：success / error / warning / info / pending' },
    { page: 'badge', role: '品种名后的上标徽标，悬停给全称' },
    { page: 'uptime-bars', role: '一段时间的可用性条带，一格一天或一小时' },
    { page: 'status-bar', role: '把一排灯收在底部状态栏，窄了自动折叠' },
    { page: 'system-monitor', role: '系统健康的完整面板：链路、策略、事件' },
  ],
  rules: [
    '状态不只靠颜色：灯旁边必须有字（「行情 42 ms」），或灯本身带 label 给读屏',
    '四态固定含义：ok 绿 = 正常，warn 琥珀 = 变慢 / 降级，danger 红 = 断开 / 失败，off = 未启用；橙色 on 专指「实盘开着」',
    '灯 8px、小灯 6px；一排灯之间间距 8px，同一排不超过 6 个，多了收进状态栏的「更多」',
    '每个灯可点：点开看延迟、最近心跳、错误原文，灯本身不闪烁',
    '图标表示过程：pending 转圈，结束后换成 success 或 error，不要同时显示两个',
    '一段时间的健康度用 UptimeBars：一格一天，断开红、降级琥珀、无数据灰，格子悬停写具体时间',
    '数据过期要标出来：超过 3 个心跳没更新，灯降为 warn 并写「N 秒前」',
  ],
  source: { label: 'Salt · Indication', href: 'https://www.saltdesignsystem.com/salt/patterns/indication' },
}
export default pattern
