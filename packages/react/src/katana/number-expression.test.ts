// SPDX-License-Identifier: MIT
import { describe, expect, it } from 'vite-plus/test'
import { evaluateInput, parseExpression, typedLive } from './number-expression'

const range = { min: 0, max: 1000 }
const signed = { min: -100, max: 1000 }

describe('parseExpression', () => {
  it('四则、括号、优先级、后缀百分号', () => {
    expect(parseExpression('2+3*4')).toBe(14)
    expect(parseExpression('(2+3)*4')).toBe(20)
    expect(parseExpression('100*1.5')).toBe(150)
    expect(parseExpression('-5+2')).toBe(-3)
    expect(parseExpression('50%')).toBe(0.5)
    expect(parseExpression('200 * 10%')).toBeCloseTo(20)
  })
  it('语法错与除以零是 null', () => {
    for (const bad of ['', '2+', '*3', '(2', '2)', '1/0', 'abc', '2 3', '1..2', '2**3'])
      expect(parseExpression(bad), bad).toBeNull()
  })
})

describe('evaluateInput', () => {
  it('+ * / 开头是对当前值的相对运算', () => {
    expect(evaluateInput('+10', 100, range)).toBe(110)
    expect(evaluateInput('*2', 100, range)).toBe(200)
    expect(evaluateInput('/4', 100, range)).toBe(25)
    expect(evaluateInput('+2*3', 100, range)).toBe(106)
  })
  it('百分比：+10% 是 ×1.1，-10% 是 ×0.9，单独 50% 是一半', () => {
    expect(evaluateInput('+10%', 200, range)).toBe(220)
    expect(evaluateInput('-10%', 200, range)).toBe(180)
    expect(evaluateInput('-10%', 200, signed)).toBe(180)
    expect(evaluateInput('50%', 200, range)).toBe(100)
  })
  it('- 开头：最小值 ≥ 0 时相对（减），否则是负数', () => {
    expect(evaluateInput('-5', 100, range)).toBe(95)
    expect(evaluateInput('-5', 100, signed)).toBe(-5)
  })
  it('完整算式按字面算，结果夹进范围、去浮点尾巴', () => {
    expect(evaluateInput('100*1.5', 7, range)).toBe(150)
    expect(evaluateInput('*100', 50, range)).toBe(1000)
    expect(evaluateInput('0.1+0.2', 7, range)).toBe(0.3)
    expect(evaluateInput('-5', 3, { min: -2, max: 9 })).toBe(-2)
  })
  it('写不成算式是 null', () => {
    expect(evaluateInput('', 1, range)).toBeNull()
    expect(evaluateInput('+', 1, range)).toBeNull()
    expect(evaluateInput('/0', 1, range)).toBeNull()
    expect(evaluateInput('abc', 1, range)).toBeNull()
  })
})

describe('typedLive', () => {
  it('纯数字边打边生效，带运算符的不生效', () => {
    expect(typedLive('12.5', range)).toBe(12.5)
    expect(typedLive('+1', range)).toBeNull()
    expect(typedLive('*2', range)).toBeNull()
    expect(typedLive('1+1', range)).toBeNull()
    expect(typedLive('-5', range)).toBeNull()
    expect(typedLive('-5', signed)).toBe(-5)
  })
})
