// SPDX-License-Identifier: MIT
import { describe, expect, it } from 'vite-plus/test'
import { formatSymbolList, parseSymbolList } from './symbol-list.ts'

// 自选表的文本导入导出（#22）：逗号分隔、带交易所前缀；###节名是分节（待核对）。示例代码，不是行情。

describe('parseSymbolList', () => {
  it('逗号与换行都能分；转大写；分节；同一个品种只收一次', () => {
    const parsed = parseSymbolList(
      '###Crypto,binance:btcusdt, BINANCE:ETHUSDT\n###Stocks,NASDAQ:NVDA,nasdaq:nvda,NYSE:BRK.B',
    )
    expect(parsed.entries).toEqual([
      { kind: 'section', name: 'Crypto' },
      { kind: 'symbol', exchange: 'BINANCE', symbol: 'BTCUSDT' },
      { kind: 'symbol', exchange: 'BINANCE', symbol: 'ETHUSDT' },
      { kind: 'section', name: 'Stocks' },
      { kind: 'symbol', exchange: 'NASDAQ', symbol: 'NVDA' },
      { kind: 'symbol', exchange: 'NYSE', symbol: 'BRK.B' },
    ])
    expect(parsed.unknown).toEqual([])
  })

  it('没有交易所前缀、空节名、带空格的怪项进 unknown，不丢', () => {
    const parsed = parseSymbolList('﻿AAPL,###,CME:ES1!,NAS DAQ:QQQ,:X')
    expect(parsed.entries).toEqual([{ kind: 'symbol', exchange: 'CME', symbol: 'ES1!' }])
    expect(parsed.unknown).toEqual(['AAPL', '###', 'NAS DAQ:QQQ', ':X'])
  })
})

describe('formatSymbolList', () => {
  it('写回逗号分隔，读回来一样；节名里的逗号换成空格', () => {
    const text = formatSymbolList([
      { kind: 'section', name: 'Index, US' },
      { kind: 'symbol', exchange: 'sp', symbol: 'spx' },
      { kind: 'symbol', exchange: 'NASDAQ', symbol: 'QQQ' },
    ])
    expect(text).toBe('###Index  US,SP:SPX,NASDAQ:QQQ')
    expect(parseSymbolList(text).entries).toHaveLength(3)
  })
})
