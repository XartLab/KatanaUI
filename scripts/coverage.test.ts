// SPDX-License-Identifier: MIT
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vite-plus/test'
import * as base from '../src/index'
import * as quant from '../src/quant'
import { summarize, type CoverageMap } from '../docs/coverage-core'
import { packageExports, problems, readCards, render } from './coverage.mjs'

// 设计稿覆盖表的对账脚本（#1870）：每种红法都要真的红，真实映射要真的过。

const real = JSON.parse(readFileSync(new URL('../docs/coverage-map.json', import.meta.url), 'utf8')) as CoverageMap
const cards = new Map([
  ['Alpha', '甲'],
  ['Beta', '乙'],
])
const exported = new Set(['Button', 'Lcd'])
const entry = (patch: object) => ({ kind: '基础件', status: '已做', at: ['Button'], ...patch })
const map = (cardsMap: object) => ({ cards: cardsMap }) as unknown as CoverageMap

describe('覆盖表对账', () => {
  it('映射完整、落点真实时没有问题', () => {
    expect(problems(map({ Alpha: entry({}), Beta: entry({ status: '没做', at: [] }) }), cards, exported)).toEqual([])
  })

  it('卡没有映射、映射对不上卡，都红', () => {
    const found = problems(map({ Alpha: entry({}), Gone: entry({}) }), cards, exported)
    expect(found).toContain('卡 Beta 没有映射（coverage-map.json 里加一条）')
    expect(found).toContain('映射里的 Gone 在设计稿里没有这张卡')
  })

  it('落点不是出口名、路径不存在，都红', () => {
    const found = problems(
      map({ Alpha: entry({ at: ['Nope'] }), Beta: entry({ at: ['src/panels/not-there'] }) }),
      cards,
      exported,
    )
    expect(found.join('\n')).toContain('Nope 不是包的出口名')
    expect(found.join('\n')).toContain('路径 src/panels/not-there 不存在')
  })

  it('归属或状态不在规定里、已做没有落点、没做却有落点，都红', () => {
    const found = problems(
      map({ Alpha: entry({ kind: '杂项', status: '差不多' }), Beta: entry({ at: [] }) }),
      cards,
      exported,
    ).join('\n')
    expect(found).toContain('归属「杂项」不在')
    expect(found).toContain('状态「差不多」不在')
    expect(found).toContain('at 不能空')
    expect(problems(map({ Alpha: entry({ status: '没做' }), Beta: entry({}) }), cards, exported).join('\n')).toContain(
      '没做的卡不该有现有落点',
    )
  })

  it('计划里写的名字已经在包里，提醒挪进 at', () => {
    const found = problems(map({ Alpha: entry({ planned: ['Lcd'] }), Beta: entry({}) }), cards, exported)
    expect(found.join('\n')).toContain('Lcd 已经在包里了')
  })
})

describe('真实的覆盖表', () => {
  it('105 张卡每张都有映射，落点都存在', () => {
    const cardList = readCards()
    expect(cardList.size).toBe(105)
    expect(problems(real, cardList, packageExports())).toEqual([])
  })

  it('扫出来的出口名与包真实的运行时出口一致', () => {
    const scanned = packageExports()
    const runtime = [...Object.keys(base), ...Object.keys(quant)]
    expect(runtime.filter((name) => !scanned.has(name))).toEqual([])
  })

  it('汇总的总数等于卡数，生成的表头数字与汇总一致', () => {
    const summary = summarize(real)
    expect(summary.reduce((sum, item) => sum + item.total, 0)).toBe(105)
    const text = render(real, readCards())
    for (const item of summary)
      expect(text).toContain(`| ${item.kind} | ${item.done} | ${item.partial} | ${item.none} |`)
  })
})
