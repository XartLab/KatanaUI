// SPDX-License-Identifier: MIT
import { describe, expect, it } from 'vite-plus/test'
import { nearestRow } from '../../lib/proximity-highlight.ts'
import {
  buildSections,
  countByCategory,
  createIntentDetector,
  cycleCategory,
  detectIntent,
  flattenRows,
  isImeEvent,
  intentStrength,
  isScopable,
  matchRange,
  pushRecentItem,
  rowHint,
  splitMatch,
  stepCategory,
  type OmniboxItem,
} from './omnibox-model.ts'

// #224：纯规则。键盘、异步、预览、滑动在 e2e/omnibox.spec.ts 与组件截图里用真浏览器验。
const categories = [
  { id: 'all', label: 'All' },
  { id: 'symbol', label: 'Symbols' },
  { id: 'command', label: 'Commands' },
]
const symbol = (n: number): OmniboxItem => ({ id: `s${n}`, category: 'symbol', kind: 'object', label: `SYM${n}` })
const command = (n: number): OmniboxItem => ({ id: `c${n}`, category: 'command', label: `Run ${n}` })
const base = { categories, scoped: false, recent: [], empty: false, perCategory: 2 }

describe('buildSections', () => {
  const items = [symbol(1), symbol(2), symbol(3), command(1)]
  it('全部：每类前 perCategory 条，多的给「显示全部」行，没超的不给', () => {
    const sections = buildSections({ ...base, items, category: 'all' })
    expect(sections.map((s) => [s.id, s.heading, s.rows.map((r) => r.key)])).toEqual([
      ['symbol', 'Symbols', ['s1', 's2', 'more:symbol']],
      ['command', 'Commands', ['c1']],
    ])
    expect(sections[0]!.rows.at(-1)).toMatchObject({ type: 'more', category: 'symbol', count: 3 })
  })
  it('单个类别：那一类的全部，不截断也没有「显示全部」', () => {
    const sections = buildSections({ ...base, items, category: 'symbol' })
    expect(sections).toHaveLength(1)
    expect(sections[0]!.rows.map((r) => r.key)).toEqual(['s1', 's2', 's3'])
  })
  it('空查询才有最近，最近的行 key 带前缀、不与类别里的同一条撞值', () => {
    const withRecent = buildSections({ ...base, items, category: 'all', recent: [symbol(1)], empty: true })
    expect(withRecent[0]).toMatchObject({ id: 'recent', recent: true })
    expect(withRecent[0]!.rows[0]).toMatchObject({ key: 'recent:s1', recent: true })
    const keys = [...flattenRows(withRecent).keys()]
    expect(new Set(keys).size).toBe(keys.length)
    expect(buildSections({ ...base, items, category: 'all', recent: [symbol(1)], empty: false })[0]!.id).toBe('symbol')
    // 单个类别页签里不显示最近。
    expect(buildSections({ ...base, items, category: 'symbol', recent: [symbol(1)], empty: true })[0]!.id).toBe(
      'symbol',
    )
  })
  it('作用域下是一整串动作，不分类也不截断', () => {
    const actions: OmniboxItem[] = [1, 2, 3, 4].map((n) => ({ id: `a${n}`, label: `Act ${n}` }))
    const sections = buildSections({
      ...base,
      items: actions,
      category: 'all',
      scoped: true,
      recent: [symbol(1)],
      empty: true,
    })
    expect(sections).toHaveLength(1)
    expect(sections[0]!.rows).toHaveLength(4)
  })
  it('类别没登记的条目放最后，不丢', () => {
    const stray: OmniboxItem = { id: 'x', label: 'X', category: 'plugin' }
    const sections = buildSections({ ...base, items: [command(1), stray], category: 'all' })
    expect(sections.map((s) => s.id)).toEqual(['command', ''])
  })
  it('countByCategory 数每类条数', () => {
    expect(countByCategory([symbol(1), symbol(2), command(1), { id: 'z', label: 'Z' }])).toEqual({
      symbol: 2,
      command: 1,
      '': 1,
    })
  })
})

describe('页签轮转与最近', () => {
  it('cycleCategory 首尾相接，向前向后都行', () => {
    const ids = ['all', 'a', 'b']
    expect(cycleCategory(ids, 'all', 1)).toBe('a')
    expect(cycleCategory(ids, 'b', 1)).toBe('all')
    expect(cycleCategory(ids, 'all', -1)).toBe('b')
    expect(cycleCategory([], 'x', 1)).toBe('x')
  })
  it('pushRecentItem 放最前、按 id 去重、限长', () => {
    expect(pushRecentItem([symbol(1), symbol(2)], symbol(2), 5).map((i) => i.id)).toEqual(['s2', 's1'])
    expect(pushRecentItem([symbol(1), symbol(2)], symbol(3), 2).map((i) => i.id)).toEqual(['s3', 's1'])
    expect(pushRecentItem([symbol(1)], symbol(2), 0)).toEqual([])
  })
})

describe('stepCategory（Tab 到头把焦点放出去）', () => {
  const ids = ['all', 'a', 'b']
  it('向前向后走一格，到头是 null', () => {
    expect(stepCategory(ids, 'all', 1)).toBe('a')
    expect(stepCategory(ids, 'b', -1)).toBe('a')
    expect(stepCategory(ids, 'b', 1)).toBeNull()
    expect(stepCategory(ids, 'all', -1)).toBeNull()
  })
})

describe('命中段', () => {
  it('不分大小写取第一段，空词与没命中不切', () => {
    expect(matchRange('AAPL', 'ap')).toEqual([1, 3])
    expect(matchRange('AAPL', ' ')).toBeNull()
    expect(splitMatch('Apple Inc.', 'inc')).toEqual({ before: 'Apple ', hit: 'Inc', after: '.' })
    expect(splitMatch('Apple', 'zz')).toEqual({ before: 'Apple', hit: '', after: '' })
  })
})

describe('detectIntent', () => {
  it('问号（半角与全角）结尾是问句', () => {
    expect(detectIntent('下周哪些持仓有财报？')).toBe(true)
    expect(detectIntent('which positions report next week?')).toBe(true)
  })
  it('疑问词开头且不止一个词；单个词与代码不算', () => {
    expect(detectIntent('what is my exposure')).toBe(true)
    expect(detectIntent('how')).toBe(false)
    expect(detectIntent('怎么看回撤')).toBe(true)
    expect(detectIntent('AAPL')).toBe(false)
    expect(detectIntent('600519.XSHG')).toBe(false)
    expect(detectIntent('BTC-USDT 永续')).toBe(false)
  })
  it('够长或词多算问句，阈值可调', () => {
    expect(detectIntent('open order book for aapl perpetual futures now')).toBe(true)
    expect(detectIntent('open order book')).toBe(false)
    expect(createIntentDetector({ minWords: 3 })('open order book')).toBe('weak')
    expect(createIntentDetector({ minLength: 5 })('abcdef')).toBe('weak')
  })
  it('长名字只算弱意图（搜到结果就不该当问句），问号与疑问词是强意图', () => {
    expect(intentStrength('Taiwan Semiconductor Manufacturing')).toBe('weak')
    expect(intentStrength('Berkshire Hathaway Inc Class B common stock')).toBe('weak')
    expect(intentStrength('下周哪些持仓有财报？')).toBe('strong')
    expect(intentStrength('what is my exposure')).toBe('strong')
    expect(intentStrength('AAPL')).toBeNull()
    expect(createIntentDetector()('Taiwan Semiconductor Manufacturing')).toBe('weak')
    expect(createIntentDetector()('怎么看回撤')).toBe(true)
    expect(createIntentDetector()('AAPL')).toBe(false)
  })
  it('中文疑问词在句中任意位置都认，不止开头', () => {
    expect(intentStrength('我的持仓有哪些风险')).toBe('strong')
    expect(intentStrength('茅台现在多少钱')).toBe('strong')
    expect(intentStrength('AAPL 是否值得买')).toBe('strong')
    expect(intentStrength('帮我看下有没有异常')).toBe('strong')
    expect(intentStrength('贵州茅台')).toBeNull()
  })
  it('空与全空白不是', () => {
    expect(detectIntent('')).toBe(false)
    expect(detectIntent('   ')).toBe(false)
  })
})

describe('输入法', () => {
  it('isComposing 或 keyCode 229 都算在组字', () => {
    expect(isImeEvent({ nativeEvent: { isComposing: true } })).toBe(true)
    expect(isImeEvent({ nativeEvent: { isComposing: false }, keyCode: 229 })).toBe(true)
    expect(isImeEvent({ nativeEvent: { isComposing: false }, keyCode: 13 })).toBe(false)
    expect(isImeEvent({ isComposing: true })).toBe(true)
  })
})

describe('行尾提示', () => {
  const labels = { run: 'Run', open: 'Open', viewOptions: 'View options', newTab: 'New tab' }
  it('对象查看选项、页面打开、命令运行；自带的 hint 优先；按住修饰键是新标签', () => {
    expect(rowHint(symbol(1), false, labels)).toBe('View options')
    expect(rowHint({ id: 'p', label: 'P', kind: 'page' }, false, labels)).toBe('Open')
    expect(rowHint(command(1), false, labels)).toBe('Run')
    expect(rowHint({ ...command(1), hint: 'Go' }, false, labels)).toBe('Go')
    expect(rowHint(symbol(1), true, labels)).toBe('New tab')
    expect(rowHint(command(1), true, { run: 'Run' })).toBe('Run')
  })
  it('isScopable：对象默认变标签，scope=false 或别的种类不变', () => {
    expect(isScopable(symbol(1))).toBe(true)
    expect(isScopable({ ...symbol(1), scope: false })).toBe(false)
    expect(isScopable(command(1))).toBe(false)
  })
})

describe('nearestRow（接近度悬停）', () => {
  const rows = [
    { top: 0, bottom: 30 },
    { top: 34, bottom: 64 },
    { top: 68, bottom: 98 },
  ]
  it('在行里就是它，在缝里取最近的', () => {
    expect(nearestRow(rows, 10)).toBe(0)
    expect(nearestRow(rows, 32)).toBe(0) // 缝 30–34：离第一行近（2）与第二行（2）平手，取先出现的
    expect(nearestRow(rows, 33)).toBe(1)
    expect(nearestRow(rows, 80)).toBe(2)
  })
  it('离得超过 reach 算没有，没有行是 null', () => {
    expect(nearestRow(rows, 300)).toBeNull()
    expect(nearestRow(rows, -5)).toBe(0)
    expect(nearestRow(rows, -50)).toBeNull()
    expect(nearestRow([], 10)).toBeNull()
  })
  it('reach 0：只认指针底下那一行，缝里没有', () => {
    expect(nearestRow(rows, 10, { reach: 0 })).toBe(0)
    expect(nearestRow(rows, 32, { reach: 0 })).toBeNull()
    expect(nearestRow(rows, 80, { reach: 0 })).toBe(2)
  })
  it('迟滞：离开当前行的上下沿不超过 hysteresis 不换', () => {
    expect(nearestRow(rows, 35, { current: 0, hysteresis: 6 })).toBe(0)
    expect(nearestRow(rows, 40, { current: 0, hysteresis: 6 })).toBe(1)
    expect(nearestRow(rows, 33, { current: 1, hysteresis: 2 })).toBe(1)
  })
})
