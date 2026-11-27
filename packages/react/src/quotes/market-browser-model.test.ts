// SPDX-License-Identifier: MIT
import { describe, expect, it } from 'vite-plus/test'
import { filterMarketRows, neighborId } from './market-browser-model.ts'

const rows = [
  { symbol: 'BTC-USDT-SWAP', name: 'Bitcoin', keywords: ['比特币', 'digital gold'] },
  { symbol: 'ETH-USDT-SWAP', name: 'Ethereum' },
  { symbol: 'AAPL' },
]

describe('filterMarketRows', () => {
  it('空词与只有空格返回全部（新数组，不是原数组）', () => {
    expect(filterMarketRows(rows, '')).toEqual(rows)
    expect(filterMarketRows(rows, '   ')).toEqual(rows)
    expect(filterMarketRows(rows, '')).not.toBe(rows)
  })

  it('代码、名称、别名里含有就留下，不分大小写，两头空格去掉', () => {
    expect(filterMarketRows(rows, 'btc').map((r) => r.symbol)).toEqual(['BTC-USDT-SWAP'])
    expect(filterMarketRows(rows, ' ETHEREUM ').map((r) => r.symbol)).toEqual(['ETH-USDT-SWAP'])
    expect(filterMarketRows(rows, '比特').map((r) => r.symbol)).toEqual(['BTC-USDT-SWAP'])
    expect(filterMarketRows(rows, 'usdt')).toHaveLength(2)
  })

  it('没有名称与别名的行只按代码找；找不到返回空数组', () => {
    expect(filterMarketRows(rows, 'aap').map((r) => r.symbol)).toEqual(['AAPL'])
    expect(filterMarketRows(rows, 'zzz')).toEqual([])
  })
})

describe('neighborId', () => {
  it('先下一行，没有下一行取上一行，只剩自己或找不到是 null', () => {
    expect(neighborId(['a', 'b', 'c'], 'a')).toBe('b')
    expect(neighborId(['a', 'b', 'c'], 'b')).toBe('c')
    expect(neighborId(['a', 'b', 'c'], 'c')).toBe('b')
    expect(neighborId(['a'], 'a')).toBeNull()
    expect(neighborId(['a', 'b'], 'x')).toBeNull()
  })
})
