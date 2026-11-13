// SPDX-License-Identifier: MIT
import { describe, expect, it } from 'vite-plus/test'
import { EMPTY_SELECTION, clickSelection, compareDecimal, moveCursor, tableCsv, tableTsv } from './model'

const ORDER = ['a', 'b', 'c', 'd']

describe('行选择与键盘', () => {
  const none = { range: false, toggle: false }
  it('普通点击只选一行；Ctrl 点选加减；Shift 选一段', () => {
    const one = clickSelection(ORDER, EMPTY_SELECTION, 'b', none)
    expect([...one.selected]).toEqual(['b'])
    const two = clickSelection(ORDER, one, 'd', { range: false, toggle: true })
    expect([...two.selected].sort()).toEqual(['b', 'd'])
    expect([...clickSelection(ORDER, two, 'b', { range: false, toggle: true }).selected]).toEqual(['d'])
    const span = clickSelection(ORDER, one, 'd', { range: true, toggle: false })
    expect([...span.selected]).toEqual(['b', 'c', 'd'])
    expect(span.anchor).toBe('b')
    expect([...clickSelection(ORDER, span, 'a', { range: true, toggle: false }).selected]).toEqual(['a', 'b'])
  })

  it('上下移动在两头停住；没有所在行时从头（往上从尾）开始', () => {
    expect(moveCursor(ORDER, 'b', 'down')).toBe('c')
    expect(moveCursor(ORDER, 'd', 'down')).toBe('d')
    expect(moveCursor(ORDER, 'a', 'up')).toBe('a')
    expect(moveCursor(ORDER, null, 'down')).toBe('a')
    expect(moveCursor(ORDER, null, 'up')).toBe('d')
    expect(moveCursor(ORDER, 'c', 'first')).toBe('a')
    expect(moveCursor(ORDER, 'a', 'last')).toBe('d')
    expect(moveCursor([], 'a', 'down')).toBeNull()
  })
})

describe('复制与导出的文字', () => {
  it('CSV：含逗号、引号、换行的格子加引号；公式开头的补单引号；负数原样', () => {
    const csv = tableCsv(
      ['品种', '备注', '盈亏'],
      [
        ['BTC,USDT', 'say "hi"\nok', '-5.5'],
        ['=SUM(A1)', '@x', '+3'],
      ],
    )
    expect(csv).toBe('品种,备注,盈亏\n"BTC,USDT","say ""hi""\nok",-5.5\n\'=SUM(A1),\'@x,+3\n')
  })

  it('TSV：制表符分列，格子里的制表符和换行换成空格', () => {
    expect(tableTsv(['a', 'b'], [['x\ty', 'z\nw']])).toBe('a\tb\nx y\tz w')
  })
})

describe('十进制字符串的比较', () => {
  it('按数值比，不转双精度；符号、位数、小数部分都认', () => {
    const sorted = ['10', '-2', '0.5', '-0.50', '2', '1.25', '1.3', '-10', '0', '123456789012345678901.5']
    expect([...sorted].sort(compareDecimal)).toEqual([
      '-10',
      '-2',
      '-0.50',
      '0',
      '0.5',
      '1.25',
      '1.3',
      '2',
      '10',
      '123456789012345678901.5',
    ])
  })

  it('位数超过双精度也分得出大小', () => {
    expect(compareDecimal('9007199254740993', '9007199254740992')).toBe(1)
    expect(compareDecimal('0.1000000000000000001', '0.1')).toBe(1)
  })

  it('末尾的零、负零不影响相等；不是普通十进制写法的当没有，排在有数的前面（升序时最前）', () => {
    expect(compareDecimal('1.50', '1.5')).toBe(0)
    expect(compareDecimal('-0', '0')).toBe(0)
    expect(compareDecimal('1,000', '5')).toBe(-1)
    expect(compareDecimal('5', '1e3')).toBe(1)
    expect(compareDecimal('x', 'y')).toBe(0)
    expect(compareDecimal(undefined, '0')).toBe(-1)
  })
})
