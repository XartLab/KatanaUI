// SPDX-License-Identifier: MIT
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vite-plus/test'
import { MoveFeed } from './move-feed.tsx'
import {
  clockText,
  filterMoves,
  freshIds,
  moveTone,
  moveValue,
  sortFeed,
  toggleType,
  typeCounts,
  type MoveItem,
} from './move-feed-model.ts'

// #110 第 2 批第 6 项：异动时间流。示例数据，股票与数值都是虚构的。
const ITEMS: MoveItem[] = [
  { id: '1', time: '09:31:05', name: '示例甲', code: '000001', type: 'rocket', value: 3.2 },
  { id: '2', time: '09:45', name: '示例乙', type: 'sealUp', value: 10 },
  { id: '3', time: '09:45', name: '示例丙', type: 'bigSell', value: 1.2e7, unit: 'amount' },
  { id: '4', time: '10:02:30', name: '示例丁', type: 'dive', value: -4.5 },
  { id: '5', time: '乱写', name: '示例戊', type: 'rocket', value: null },
]

describe('异动流的纯函数', () => {
  it('moveTone：涨 / 跌 / 量 / 板，不认识的按量（中性）', () => {
    expect(moveTone('rocket')).toBe('up')
    expect(moveTone('dive')).toBe('down')
    expect(moveTone('bigSell')).toBe('volume')
    expect(moveTone('sealUp')).toBe('board')
    expect(moveTone('自定义')).toBe('volume')
    expect(moveTone('自定义', [{ key: '自定义', label: 'x', tone: 'down' }])).toBe('down')
  })

  it('sortFeed：从新到旧；同一时刻后传入的在上；写不对的时刻沉底；不改原数组', () => {
    const copy = [...ITEMS]
    expect(sortFeed(ITEMS).map((item) => item.id)).toEqual(['4', '3', '2', '1', '5'])
    expect(ITEMS).toEqual(copy)
  })

  it('filterMoves：一个都没选是全部，多选取并集', () => {
    expect(filterMoves(ITEMS, [])).toHaveLength(5)
    expect(filterMoves(ITEMS, ['rocket']).map((item) => item.id)).toEqual(['1', '5'])
    expect(filterMoves(ITEMS, ['rocket', 'dive']).map((item) => item.id)).toEqual(['1', '4', '5'])
    expect(toggleType(['a'], 'b')).toEqual(['a', 'b'])
    expect(toggleType(['a', 'b'], 'a')).toEqual(['b'])
  })

  it('typeCounts 按随包次序给条数；没出现的类型不列', () => {
    expect(typeCounts(ITEMS)).toEqual([
      { type: 'rocket', count: 2 },
      { type: 'dive', count: 1 },
      { type: 'bigSell', count: 1 },
      { type: 'sealUp', count: 1 },
    ])
  })

  it('moveValue：百分数带正负号与方向，金额写万 / 亿，取不到写「—」', () => {
    expect(moveValue({ value: 3.2 })).toEqual({ text: '+3.20%', direction: 'up' })
    expect(moveValue({ value: -4.5 })).toEqual({ text: '-4.50%', direction: 'down' })
    expect(moveValue({ value: 0.001 })).toEqual({ text: '0.00%', direction: 'flat' })
    expect(moveValue({ value: 1.2e7, unit: 'amount' }).text).toBe('1,200万')
    expect(moveValue({ value: null })).toEqual({ text: '—', direction: 'flat' })
  })

  it('clockText 补秒；freshIds 首次渲染没有新的，之后只列没见过的', () => {
    expect(clockText('09:45')).toBe('09:45:00')
    expect(clockText('09:31:05')).toBe('09:31:05')
    expect(clockText('乱写')).toBe('乱写')
    expect(freshIds(null, ITEMS).size).toBe(0)
    expect([...freshIds(new Set(['1', '2']), ITEMS)]).toEqual(['3', '4', '5'])
  })
})

describe('MoveFeed', () => {
  it('一行一条：时间、名称、类型胶囊、数值；新的在顶上', () => {
    const html = renderToStaticMarkup(<MoveFeed items={ITEMS} />)
    const ids = [...html.matchAll(/data-slot="move-row" data-id="(\d)"/g)].map((m) => m[1])
    expect(ids).toEqual(['4', '3', '2', '1', '5'])
    expect(html).toContain('10:02:30')
    expect(html).toContain('data-slot="move-type" data-tone="down">高台跳水<')
    expect(html).toContain('data-slot="move-type" data-tone="board">封涨停板<')
    expect(html).toContain('data-slot="move-type" data-tone="volume">大笔卖出<')
    expect(html).toContain('data-slot="move-value" data-direction="up">+3.20%<')
  })

  it('默认选中某类型时只列那一类，筛选按钮带条数并标按下', () => {
    const html = renderToStaticMarkup(<MoveFeed items={ITEMS} defaultSelectedTypes={['rocket']} />)
    expect(html.match(/data-slot="move-row"/g)).toHaveLength(2)
    expect(html).toContain('火箭发射 2')
    expect(html).toContain('共 2 条')
    expect(html).toMatch(/data-type="rocket"[^>]*aria-pressed="true"/)
    expect(html).toMatch(/data-type="dive"[^>]*aria-pressed="false"/)
  })

  it('给了 onSelect 行是按钮，selectedId 那一行带联动标记；没条目写空态', () => {
    const html = renderToStaticMarkup(<MoveFeed items={ITEMS} onSelect={() => {}} selectedId="2" />)
    expect(html.match(/class="k-move-row"/g)).toHaveLength(5)
    expect(html).toMatch(/data-id="2"[^>]*data-selected="true"/)
    expect(renderToStaticMarkup(<MoveFeed items={[]} />)).toContain('暂无异动')
  })
})
