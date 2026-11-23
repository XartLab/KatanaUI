// SPDX-License-Identifier: MIT
import { describe, expect, it } from 'vite-plus/test'
import {
  amendDecision,
  canAmend,
  canCancel,
  cancellable,
  fillRatio,
  parseAmendPrice,
  type Order,
} from './orders-model.ts'

const order: Order = {
  id: 'o1',
  symbol: 'X',
  side: 'buy',
  type: 'limit',
  price: 100,
  quantity: 4,
  filled: 1,
  status: 'partial',
  time: 0,
}

describe('fillRatio', () => {
  it('已成交占委托量，夹在 0 到 1', () => {
    expect(fillRatio(order)).toBeCloseTo(0.25)
    expect(fillRatio({ quantity: 4, filled: 9 })).toBe(1)
    expect(fillRatio({ quantity: 4, filled: -1 })).toBe(0)
  })
  it('委托量不是正数给 0', () => {
    expect(fillRatio({ quantity: 0, filled: 0 })).toBe(0)
    expect(fillRatio({ quantity: 4, filled: Number.NaN })).toBe(0)
  })
})

describe('canAmend / canCancel', () => {
  it('限价单与带价的条件单能改价，市价单与撤单中的不能', () => {
    expect(canAmend(order)).toBe(true)
    expect(canAmend({ ...order, type: 'conditional', status: 'pending' })).toBe(true)
    expect(canAmend({ ...order, type: 'market', price: null })).toBe(false)
    expect(canAmend({ ...order, type: 'conditional', price: null })).toBe(false)
    expect(canAmend({ ...order, status: 'canceling' })).toBe(false)
  })
  it('撤单中的单不能再撤', () => {
    expect(canCancel(order)).toBe(true)
    expect(canCancel({ status: 'canceling' })).toBe(false)
  })
  it('全部撤单的范围去掉撤单中的', () => {
    const list = [
      order,
      { ...order, id: 'o2', status: 'canceling' as const },
      { ...order, id: 'o3', status: 'open' as const },
    ]
    expect(cancellable(list).map((item) => item.id)).toEqual(['o1', 'o3'])
  })
})

describe('parseAmendPrice', () => {
  it('正数通过，去掉空白与千分位逗号', () => {
    expect(parseAmendPrice(' 101.5 ')).toBe(101.5)
    expect(parseAmendPrice('64,250.5')).toBe(64250.5)
  })
  it('空、非数、零、负数是 null', () => {
    expect(parseAmendPrice('')).toBeNull()
    expect(parseAmendPrice('abc')).toBeNull()
    expect(parseAmendPrice('0')).toBeNull()
    expect(parseAmendPrice('-3')).toBeNull()
    expect(parseAmendPrice('−3')).toBeNull()
    expect(parseAmendPrice('Infinity')).toBeNull()
  })
})

describe('amendDecision', () => {
  it('新价格提交', () => {
    expect(amendDecision(order, '101.25')).toEqual({ kind: 'submit', price: 101.25 })
  })
  it('价格没变只关编辑框，不发回调', () => {
    expect(amendDecision(order, '100')).toEqual({ kind: 'unchanged' })
    expect(amendDecision(order, '100.00')).toEqual({ kind: 'unchanged' })
  })
  it('非法输入留在编辑框里报错', () => {
    expect(amendDecision(order, 'x')).toEqual({ kind: 'invalid' })
    expect(amendDecision(order, '')).toEqual({ kind: 'invalid' })
  })
})
