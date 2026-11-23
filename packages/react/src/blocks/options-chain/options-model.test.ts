// SPDX-License-Identifier: MIT
import { describe, expect, it } from 'vite-plus/test'
import { atmStrike, formatOptionField, isItm, sortedRows, wingFields } from './options-model.ts'

describe('atmStrike', () => {
  const strikes = [60000, 62000, 64000, 66000, 68000]
  it('取离标的价最近的行权价', () => {
    expect(atmStrike(strikes, 64250)).toBe(64000)
    expect(atmStrike(strikes, 65100)).toBe(66000)
  })
  it('一样近取低的', () => {
    expect(atmStrike(strikes, 65000)).toBe(64000)
  })
  it('标的价在范围外取最近的一端', () => {
    expect(atmStrike(strikes, 1)).toBe(60000)
    expect(atmStrike(strikes, 99999)).toBe(68000)
  })
  it('行权价乱序也对；没有行权价或价格非法是 null', () => {
    expect(atmStrike([66000, 60000, 64000], 63000)).toBe(64000)
    expect(atmStrike([], 100)).toBeNull()
    expect(atmStrike(strikes, Number.NaN)).toBeNull()
  })
})

describe('isItm', () => {
  it('认购：行权价低于标的价是实值；认沽相反', () => {
    expect(isItm('call', 62000, 64250)).toBe(true)
    expect(isItm('call', 66000, 64250)).toBe(false)
    expect(isItm('put', 66000, 64250)).toBe(true)
    expect(isItm('put', 62000, 64250)).toBe(false)
  })
  it('行权价等于标的价两边都不是实值', () => {
    expect(isItm('call', 64000, 64000)).toBe(false)
    expect(isItm('put', 64000, 64000)).toBe(false)
  })
})

describe('wingFields', () => {
  it('认购翼镜像，认沽翼原样；输入不被改', () => {
    const fields = ['bid', 'ask', 'last'] as const
    expect(wingFields('call', fields)).toEqual(['last', 'ask', 'bid'])
    expect(wingFields('put', fields)).toEqual(['bid', 'ask', 'last'])
    expect(fields).toEqual(['bid', 'ask', 'last'])
  })
})

describe('sortedRows', () => {
  it('按行权价从低到高，不改输入', () => {
    const rows = [{ strike: 3 }, { strike: 1 }, { strike: 2 }]
    expect(sortedRows(rows).map((row) => row.strike)).toEqual([1, 2, 3])
    expect(rows.map((row) => row.strike)).toEqual([3, 1, 2])
  })
})

describe('formatOptionField', () => {
  it('各字段的默认写法', () => {
    expect(formatOptionField('bid', 1234.5)).toBe('1234.50')
    expect(formatOptionField('iv', 62.44)).toBe('62.4%')
    expect(formatOptionField('delta', -0.4321)).toBe('-0.43')
    expect(formatOptionField('openInterest', 12345.6)).toBe('12,346')
  })
  it('没有值写破折号', () => {
    expect(formatOptionField('bid', null)).toBe('—')
    expect(formatOptionField('bid', undefined)).toBe('—')
    expect(formatOptionField('bid', Number.NaN)).toBe('—')
  })
})
