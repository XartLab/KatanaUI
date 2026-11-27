// SPDX-License-Identifier: MIT
// 全市场清单：CSV（表头 symbol,venue,name,domain[,assetClass]，可加引号）或 JSON 数组。A 股、美股、港股、加密币放一份里。
import type { AssetClass } from '../normalize.ts'

export type MarketItem = { symbol: string; venue?: string; name?: string; domain?: string; assetClass?: AssetClass }

/** 拆一行 CSV（支持双引号与引号里的逗号、两个双引号转义）。 */
export function csvRow(line: string): string[] {
  const out: string[] = []
  let cur = ''
  let quoted = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]!
    if (quoted) {
      if (ch === '"' && line[i + 1] === '"') {
        cur += '"'
        i++
      } else if (ch === '"') quoted = false
      else cur += ch
    } else if (ch === '"') quoted = true
    else if (ch === ',') {
      out.push(cur.trim())
      cur = ''
    } else cur += ch
  }
  out.push(cur.trim())
  return out
}

export function parseMarketList(text: string): MarketItem[] {
  const trimmed = text.replace(/^﻿/, '').trim()
  const items: MarketItem[] = trimmed.startsWith('[')
    ? (JSON.parse(trimmed) as MarketItem[])
    : (() => {
        const lines = trimmed.split(/\r?\n/).filter((l) => l.trim() && !l.trim().startsWith('#'))
        const header = csvRow(lines[0] ?? '').map((h) => h.toLowerCase())
        if (!header.includes('symbol')) throw new Error('清单 CSV 要有表头：symbol,venue,name,domain')
        return lines.slice(1).map((line) => {
          const cells = csvRow(line)
          return Object.fromEntries(
            header.map((h, i) => [h === 'assetclass' ? 'assetClass' : h, cells[i] ?? '']),
          ) as MarketItem
        })
      })()
  return items
    .filter((it) => it.symbol?.trim())
    .map((it) => {
      const out: MarketItem = { symbol: it.symbol.trim() }
      if (it.venue?.trim()) out.venue = it.venue.trim()
      if (it.name?.trim()) out.name = it.name.trim()
      if (it.domain?.trim()) out.domain = it.domain.trim()
      if (it.assetClass) out.assetClass = it.assetClass
      return out
    })
}
