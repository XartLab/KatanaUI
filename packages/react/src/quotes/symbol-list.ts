// SPDX-License-Identifier: MIT
/**
 * Watchlist text import / export: comma-separated EXCHANGE:SYMBOL entries, sections written as ###name.
 * 自选表的文本导入导出（#22「自选与行情表」导入 / 导出 .txt）：逗号分隔、每项带交易所前缀（EXCHANGE:SYMBOL）。
 * 出处：TradingView 帮助中心「Mastering the TradingView watchlists」（2026-11-23 读）只写了「上传 .txt，带交易所前缀、逗号分隔」；
 * 分节写成「###节名」是 TradingView 导出文件的写法，页面没写，待核对。认不出的项不丢、原样交回，由调用方提示用户。
 */

/** 列表里的一项：一个品种，或一个分节标题。 */
export type SymbolListEntry = { kind: 'symbol'; exchange: string; symbol: string } | { kind: 'section'; name: string }

export type ParsedSymbolList = {
  /** 认出来的项，按文件里的先后（同一个品种第二次出现不再收）。 */
  entries: SymbolListEntry[]
  /** 认不出的项（原样、去掉首尾空白），给调用方列出来。 */
  unknown: string[]
}

/** 交易所与代码：字母、数字与 . _ - ! 这几个符号（代码里有 BRK.B、ES1!、BTC-PERP 这类）。 */
const PART = /^[A-Za-z0-9._!-]+$/

/**
 * 读一段自选文本：逗号或换行分隔；「EXCHANGE:SYMBOL」是品种（交易所与代码都转大写），「###节名」是分节；空项跳过，别的进 unknown。
 * 没写交易所前缀的项也进 unknown（TradingView 要前缀才认得出是哪个市场的同名代码）。
 */
export function parseSymbolList(text: string): ParsedSymbolList {
  const entries: SymbolListEntry[] = []
  const unknown: string[] = []
  const seen = new Set<string>()
  for (const raw of text.replace(/^﻿/, '').split(/[,\r\n]+/)) {
    const item = raw.trim()
    if (item === '') continue
    if (item.startsWith('###')) {
      const name = item.slice(3).trim()
      if (name) entries.push({ kind: 'section', name })
      else unknown.push(item)
      continue
    }
    const at = item.indexOf(':')
    const exchange = at > 0 ? item.slice(0, at) : ''
    const symbol = at > 0 ? item.slice(at + 1) : ''
    if (!PART.test(exchange) || !PART.test(symbol)) {
      unknown.push(item)
      continue
    }
    const key = `${exchange}:${symbol}`.toUpperCase()
    if (seen.has(key)) continue
    seen.add(key)
    entries.push({ kind: 'symbol', exchange: exchange.toUpperCase(), symbol: symbol.toUpperCase() })
  }
  return { entries, unknown }
}

/** 写成导出文本：逗号分隔，品种写「EXCHANGE:SYMBOL」，分节写「###节名」（节名里的逗号换成空格，免得读回来被拆开）。 */
export function formatSymbolList(entries: readonly SymbolListEntry[]): string {
  return entries
    .map((entry) =>
      entry.kind === 'section'
        ? `###${entry.name.replace(/[,\r\n]+/g, ' ').trim()}`
        : `${entry.exchange.toUpperCase()}:${entry.symbol.toUpperCase()}`,
    )
    .join(',')
}
