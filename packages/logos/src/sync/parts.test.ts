// SPDX-License-Identifier: MIT
import { describe, expect, it } from 'vite-plus/test'
import { csvRow, parseMarketList } from './list.ts'
import { iconLinks, websiteCandidates } from './website.ts'
import { chunk, commonsFileUrl, parseWikidata, wikidataQuery } from './wikidata.ts'

describe('全市场清单', () => {
  it('CSV：表头、引号、注释；A 股、美股、港股、加密币放一份', () => {
    expect(csvRow('a,"b, c","d ""e"""')).toEqual(['a', 'b, c', 'd "e"'])
    const items = parseMarketList(
      '﻿symbol,venue,name,domain\n# 注释\n600519,XSHG,"贵州茅台",moutaichina.com\nAAPL,XNAS,Apple,apple.com\n00700,XHKG,腾讯控股,\nBTCUSDT,,,\n',
    )
    expect(items).toEqual([
      { symbol: '600519', venue: 'XSHG', name: '贵州茅台', domain: 'moutaichina.com' },
      { symbol: 'AAPL', venue: 'XNAS', name: 'Apple', domain: 'apple.com' },
      { symbol: '00700', venue: 'XHKG', name: '腾讯控股' },
      { symbol: 'BTCUSDT' },
    ])
    expect(parseMarketList('[{"symbol":"430047","venue":"XBSE"}]')).toEqual([{ symbol: '430047', venue: 'XBSE' }])
    expect(() => parseMarketList('a,b\n1,2')).toThrow('表头')
  })
})

describe('官网图标', () => {
  it('SVG 优先，再 apple-touch-icon，再 icon 按 sizes 从大到小；相对地址补全', () => {
    const html = `<head>
      <link rel="icon" href="/favicon-32.png" sizes="32x32">
      <link rel="stylesheet" href="/a.css">
      <link rel="icon" sizes="192x192" href="/icon-192.png">
      <link rel="apple-touch-icon" href="/apple.png">
      <link rel="icon" type="image/svg+xml" href="/logo.svg">
      <link rel=icon href=//cdn.example.com/x.png sizes=96x96>
    </head>`
    expect(iconLinks(html, 'https://www.example.com/').map((l) => l.url)).toEqual([
      'https://www.example.com/logo.svg',
      'https://www.example.com/apple.png',
      'https://www.example.com/icon-192.png',
      'https://cdn.example.com/x.png',
      'https://www.example.com/favicon-32.png',
    ])
  })

  it('候选顺序：首页图标 → /apple-touch-icon.png → /favicon.ico → Google s2；没首页 HTML 从固定路径起', () => {
    expect(websiteCandidates('<link rel="icon" href="/i.svg">', 'example.com')).toEqual([
      'https://example.com/i.svg',
      'https://example.com/apple-touch-icon.png',
      'https://example.com/favicon.ico',
      'https://www.google.com/s2/favicons?domain=example.com&sz=64',
    ])
    expect(websiteCandidates(undefined, 'https://www.moutaichina.com/zh/')).toEqual([
      'https://www.moutaichina.com/apple-touch-icon.png',
      'https://www.moutaichina.com/favicon.ico',
      'https://www.google.com/s2/favicons?domain=moutaichina.com&sz=64',
    ])
  })
})

describe('Wikidata', () => {
  it('查询按 MIC + 代码（P414 / P249），交易所靠 MIC 属性认；北交所可映射别名', () => {
    const q = wikidataQuery(
      [
        ['600519', 'XSHG'],
        ['430047', 'BJSE'],
      ],
      { micAliases: { BJSE: 'XBSE' } },
    )
    expect(q).toContain('VALUES (?mic ?ticker) { ("XSHG" "600519") ("XBSE" "430047") }')
    expect(q).toContain('wdt:P7534 ?mic')
    expect(q).toContain('pq:P249 ?ticker')
    expect(q).toContain('wdt:P154 ?logo')
    expect(wikidataQuery([['A', 'XNAS']], { micProperty: 'P9999' })).toContain('wdt:P9999')
  })

  it('解析结果：代码.MIC → 徽标与官网；别名反查回规整的 MIC；多行取有徽标的', () => {
    const b = (mic: string, ticker: string, logo?: string, website?: string) => ({
      mic: { value: mic },
      ticker: { value: ticker },
      item: { value: 'http://www.wikidata.org/entity/Q1' },
      ...(logo ? { logo: { value: logo } } : {}),
      ...(website ? { website: { value: website } } : {}),
    })
    const hits = parseWikidata(
      {
        results: {
          bindings: [
            b('XSHG', '600519', undefined, 'https://www.moutaichina.com'),
            b('XSHG', '600519', 'http://commons.wikimedia.org/wiki/Special:FilePath/Moutai.svg'),
            b('XBSE', '430047', 'http://commons.wikimedia.org/wiki/Special:FilePath/X.png'),
          ],
        },
      },
      { micAliases: { BJSE: 'XBSE' } },
    )
    expect(hits.get('600519.XSHG')).toEqual({
      item: 'http://www.wikidata.org/entity/Q1',
      logo: 'https://commons.wikimedia.org/wiki/Special:FilePath/Moutai.svg',
      website: 'https://www.moutaichina.com',
    })
    expect(hits.get('430047.BJSE')?.logo).toContain('X.png')
    expect(commonsFileUrl('https://c/Special:FilePath/X.png')).toBe('https://c/Special:FilePath/X.png?width=256')
    expect(commonsFileUrl('https://c/Special:FilePath/X.svg')).toBe('https://c/Special:FilePath/X.svg')
    expect(chunk(Array.from({ length: 450 }, (_, i) => i)).map((c) => c.length)).toEqual([200, 200, 50])
  })
})
