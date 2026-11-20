// SPDX-License-Identifier: MIT
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vite-plus/test'
import { LimitUpTimeline } from './limit-up-timeline.tsx'
import {
  filterByTheme,
  groupStations,
  phaseSummary,
  snakeRows,
  themeCounts,
  type TimelineItem,
} from './timeline-model.ts'

// #110 第 1 批第 4 项：涨停时间线。示例数据，不是行情。
const ITEMS: TimelineItem[] = [
  { code: '000001', name: '甲', time: '09:20:03', streak: 1, themes: ['题材一'], amount: 5.6e7 },
  { code: '000002', name: '乙', time: '09:36:10', streak: 2, themes: ['题材一', '题材二'], amount: 3.2e8 },
  { code: '000003', name: '丙', time: '09:36:40', streak: 1, themes: ['题材二'], amount: 9_000, board: 'gem' },
  { code: '000004', name: '丁', time: '11:20', streak: { boards: 3, days: 4 }, themes: ['题材一'], amount: null },
  { code: '000005', name: '戊', time: '13:11', streak: 1, themes: ['题材三'], amount: 1.4e8, board: 'star' },
  { code: '000006', name: '己', time: '14:49', streak: 1, themes: ['题材三'] },
  { code: '000007', name: '庚', time: null, streak: 1 },
]

describe('时间线的纯函数', () => {
  it('同一分钟的票并成一站；最新在前或最早在前；没有时刻的不上轴', () => {
    const latest = groupStations(ITEMS, 'latest')
    expect(latest.stations.map((s) => s.key)).toEqual(['14:49', '13:11', '11:20', '09:36', '09:20'])
    expect(latest.stations[3]!.items.map((i) => i.name)).toEqual(['乙', '丙'])
    expect(latest.untimed.map((i) => i.name)).toEqual(['庚'])
    expect(groupStations(ITEMS, 'earliest').stations.map((s) => s.key)[0]).toBe('09:20')
  })

  it('时段：竞价 / 早盘 / 午盘 / 尾盘各自的站数与只数', () => {
    const summary = phaseSummary(groupStations(ITEMS, 'latest').stations)
    expect(summary).toEqual({
      auction: { stations: 1, stocks: 1 },
      morning: { stations: 2, stocks: 3 },
      afternoon: { stations: 1, stocks: 1 },
      late: { stations: 1, stocks: 1 },
    })
  })

  it('题材 chip：按票数排，筛选只留带这个题材的票', () => {
    expect(themeCounts(ITEMS).map((c) => `${c.name}${c.count}`)).toEqual(['题材一3', '题材二2', '题材三2'])
    expect(filterByTheme(ITEMS, '题材二').map((i) => i.name)).toEqual(['乙', '丙'])
    expect(filterByTheme(ITEMS, null)).toHaveLength(7)
  })

  it('蛇形分行：奇数行左到右、偶数行右到左，屏幕上偶数行是序列的反面', () => {
    const rows = snakeRows([1, 2, 3, 4, 5, 6, 7], 3)
    expect(rows.map((r) => r.flow)).toEqual(['ltr', 'rtl', 'ltr'])
    expect(rows[1]!.sequence).toEqual([4, 5, 6])
    expect(rows[1]!.display).toEqual([6, 5, 4])
    expect(rows[2]!.display).toEqual([7])
  })
})

describe('LimitUpTimeline', () => {
  const html = (props: Partial<Parameters<typeof LimitUpTimeline>[0]> = {}) =>
    renderToStaticMarkup(<LimitUpTimeline items={ITEMS} perRow={3} {...props} />)

  it('站点：时间胶囊、按时段着色、同分钟的两只挂在同一站', () => {
    const out = html()
    expect(out.match(/data-slot="timeline-station"/g)).toHaveLength(5)
    expect(out).toContain('data-key="09:36" data-phase="morning"')
    expect(out).toContain('data-key="14:49" data-phase="late"')
    expect(out).toContain('data-key="09:20" data-phase="auction"')
    expect(out).toContain('>09:36</span>')
    expect(out.match(/data-slot="timeline-card"/g)).toHaveLength(6)
  })

  it('蛇形：每行 perRow 站，行尾拐弯、箭头指向较新的时刻、写「越来越早」，第二行从右往左', () => {
    const out = html()
    expect(out.match(/data-slot="timeline-row"/g)).toHaveLength(2)
    expect(out).toContain('data-flow="ltr"')
    expect(out).toContain('data-flow="rtl"')
    expect(out.match(/class="k-tl-turn"/g)).toHaveLength(1)
    expect(out).toContain('越来越早')
    // 最新在前、第一行向右流：较新的在序列前面，箭头向左；第二行反过来。
    expect(out).toContain('<i class="k-tl-arrow" data-dir="left"')
    expect(out).toContain('<i class="k-tl-arrow" data-dir="right"')
    expect(out).toContain('R1 14:49 — 11:20')
    const earliest = html({ order: 'earliest' })
    expect(earliest).toContain('越来越晚')
    expect(earliest.indexOf('data-key="09:20"')).toBeLessThan(earliest.indexOf('data-key="14:49"'))
  })

  it('卡：名称、连板徽标、第一个题材、成交额（万 / 亿，取不到 —）、20cm 标记', () => {
    const out = html()
    expect(out).toContain('data-slot="streak-badge" data-level="3"')
    expect(out).toContain('>4天3板<')
    expect(out).toContain('<span class="k-tl-card-amount">3.20亿</span>')
    expect(out).toContain('<span class="k-tl-card-amount">—</span>')
    expect(out).toContain('data-kind="gem"')
    expect(out.match(/data-slot="board-mark"/g)).toHaveLength(2)
    expect(out).toContain('>20cm<')
  })

  it('顶上：排序切换、时段图例带计数、题材 chip 带票数；筛选后站点只剩那个题材', () => {
    const out = html()
    expect(out).toContain('>最新在前<')
    expect(out).toContain('>最早在前<')
    expect(out).toContain('<b>1站 1只</b>')
    expect(out).toContain('<b>2站 3只</b>')
    expect(out).toContain('>题材一 3<')
    expect(out).toContain('aria-pressed="true">全部<')
    const filtered = html({ theme: '题材三' })
    expect(filtered.match(/data-slot="timeline-station"/g)).toHaveLength(2)
    expect(filtered).toContain('aria-pressed="true">题材三 2<')
  })

  it('没有时刻的票不上轴，只报数；没有票写空态', () => {
    expect(html()).toContain('1 只没有封板时刻，未上轴')
    expect(renderToStaticMarkup(<LimitUpTimeline items={[]} />)).toContain('data-slot="timeline-empty"')
  })
})
