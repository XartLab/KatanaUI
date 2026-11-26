// SPDX-License-Identifier: MIT
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vite-plus/test'
import { DERIVATIVES_DEMO } from '../../../gallery/usage/DerivativesBoardUsage.tsx'
import { DerivativesBoard } from './derivatives-board.tsx'
import { DerivativesCard } from './derivatives-card.tsx'
import { DERIVATIVES_KINDS } from './derivatives-model.ts'

const html = (node: React.ReactElement) => renderToStaticMarkup(node)
const count = (text: string, pattern: RegExp) => [...text.matchAll(pattern)].length

describe('DerivativesBoard', () => {
  it('六张卡，次序同 OKX，每张带标题、信息钮和自己的周期按钮', () => {
    const out = html(<DerivativesBoard data={DERIVATIVES_DEMO} />)
    const kinds = [...out.matchAll(/data-slot="derivatives-card" data-kind="(\w+)"/g)].map((m) => m[1])
    expect(kinds).toEqual([...DERIVATIVES_KINDS])
    expect(count(out, /data-slot="derivatives-info"/g)).toBe(6)
    expect(count(out, /data-slot="derivatives-periods"/g)).toBe(6)
    expect(out).toContain('持仓量及成交量')
    expect(out).toContain('近 7 天')
    expect(out).not.toContain('data-empty="true"')
  })

  it('kinds 选画哪几张', () => {
    const out = html(<DerivativesBoard kinds={['basis', 'fundingRate']} data={DERIVATIVES_DEMO} />)
    expect(count(out, /data-slot="derivatives-card"/g)).toBe(2)
    expect(out.indexOf('data-kind="basis"')).toBeLessThan(out.indexOf('data-kind="fundingRate"'))
  })

  it('缺数据的卡显示自己的空态，别的卡照画；不画假数', () => {
    const out = html(
      <DerivativesBoard
        data={{
          fundingRate: DERIVATIVES_DEMO.fundingRate,
          takerVolume: [],
          basis: [{ time: 1, contract: null, index: null }],
        }}
      />,
    )
    expect(count(out, /data-slot="derivatives-empty"/g)).toBe(5)
    expect(count(out, /data-slot="derivatives-chart"/g)).toBe(1)
    expect(out).toContain('暂无数据')
  })

  it('周期受控：选中的按钮 aria-pressed；资金费率默认第一档', () => {
    const out = html(
      <DerivativesBoard kinds={['fundingRate', 'basis']} data={DERIVATIVES_DEMO} period={{ basis: '1d' }} />,
    )
    const fund = out.slice(out.indexOf('data-kind="fundingRate"'), out.indexOf('data-kind="basis"'))
    expect(fund).toMatch(/aria-pressed="true"[^>]*>(?:<[^>]*>)*近 7 天/)
    const basis = out.slice(out.indexOf('data-kind="basis"'))
    expect(basis).toMatch(/aria-pressed="true"[^>]*>(?:<[^>]*>)*1 天/)
  })
})

describe('DerivativesCard 的画法', () => {
  it('资金费率：正负柱各按 data-tone 分色，有零线', () => {
    const out = html(<DerivativesCard kind="fundingRate" data={DERIVATIVES_DEMO.fundingRate} />)
    expect(out).toContain('data-tone="up"')
    expect(out).toContain('data-tone="down"')
    expect(out).toContain('k-deriv-zero')
    expect(count(out, /data-slot="derivatives-bar"/g)).toBe(DERIVATIVES_DEMO.fundingRate.length)
  })

  it('持仓量及成交量：柱（成交量）加线（持仓量），左右轴都有刻度', () => {
    const out = html(<DerivativesCard kind="openInterestVolume" data={DERIVATIVES_DEMO.openInterestVolume} />)
    expect(count(out, /data-slot="derivatives-bar"/g)).toBe(24)
    expect(count(out, /data-slot="derivatives-line"/g)).toBe(1)
    expect(out).toContain('data-slot="derivatives-rtick"')
    expect(out).toContain('data-slot="plot-ytick"')
  })

  it('多空账户比：每格多空两段堆满 100%，加比值折线；缺值那一格没有柱', () => {
    const data = DERIVATIVES_DEMO.longShortRatio.map((point, i) => (i === 3 ? { ...point, long: null } : point))
    const out = html(<DerivativesCard kind="longShortRatio" data={data} />)
    expect(count(out, /data-slot="derivatives-bar"/g)).toBe((data.length - 1) * 2)
    expect(count(out, /data-slot="derivatives-line"/g)).toBe(1)
  })

  it('合约基差：两个面板，两条线加基差柱', () => {
    const out = html(<DerivativesCard kind="basis" data={DERIVATIVES_DEMO.basis} />)
    expect(count(out, /data-slot="derivatives-panel"/g)).toBe(2)
    expect(count(out, /data-slot="derivatives-line"/g)).toBe(2)
    expect(count(out, /data-slot="derivatives-bar"/g)).toBe(24)
  })

  it('主动买卖量：买入、卖出各一组柱', () => {
    const out = html(<DerivativesCard kind="takerVolume" data={DERIVATIVES_DEMO.takerVolume} />)
    expect(count(out, /data-slot="derivatives-bar"/g)).toBe(48)
  })

  it('读屏名写卡名与最新值，图例写字', () => {
    const out = html(<DerivativesCard kind="basis" data={DERIVATIVES_DEMO.basis} />)
    expect(out).toMatch(/aria-label="合约基差，最新 基差 [-\d.,]+"/)
    expect(out).toContain('合约价')
    expect(out).toContain('指数价')
  })

  it('文字走 labels；formatTime 与 formatAmount 可换', () => {
    const labels = {
      region: 'Trading data',
      cards: Object.fromEntries(DERIVATIVES_KINDS.map((kind) => [kind, { title: kind, info: 'hint' }])),
      periods: { '7d': '7D', '14d': '14D' },
      periodGroup: (title: string) => `${title} period`,
      infoButton: (title: string) => `About ${title}`,
      series: {
        openInterest: 'OI',
        volume: 'Vol',
        rate: 'Rate',
        buy: 'Buy',
        sell: 'Sell',
        long: 'Long',
        short: 'Short',
        ratio: 'Ratio',
        contract: 'Swap',
        index: 'Index',
        basis: 'Basis',
      },
      empty: 'No data',
      plotAria: (title: string, latest: string) => `${title}: ${latest}`,
      noLatest: 'n/a',
    } as unknown as Parameters<typeof DerivativesBoard>[0]['labels']
    const out = html(
      <DerivativesCard kind="fundingRate" data={DERIVATIVES_DEMO.fundingRate} labels={labels} formatTime={() => 'T'} />,
    )
    expect(out).toContain('7D')
    expect(out).toContain('fundingRate period')
    expect(out).not.toContain('近 7 天')
  })
})
