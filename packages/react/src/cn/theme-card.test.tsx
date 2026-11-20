// SPDX-License-Identifier: MIT
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vite-plus/test'
import { cnLabelsZh } from './labels.ts'
import { ThemeCard, ThemeCards, themeCardFigures, type ThemeCardData } from './theme-card.tsx'

// #110 第 1 批第 2 项：题材卡。
const PCB: ThemeCardData = {
  key: 'pcb',
  name: '示例题材',
  catalyst: { text: '示例催化：某行业协会发布供应链警报', source: '示例来源' },
  members: [
    { code: '000001', name: '示例甲', time: '09:36:12', streak: 2 },
    { code: '000002', name: '示例乙', time: '09:36', streak: 1 },
    { code: '000003', name: '示例丙', time: null, streak: null },
  ],
}

describe('ThemeCard', () => {
  it('卡头：序号 01、题材名、「3涨停」「2板」两枚胶囊（涨停数不给就数成员，最高板取成员里的）', () => {
    const html = renderToStaticMarkup(<ThemeCard theme={PCB} index={1} />)
    expect(html).toContain('<span class="k-theme-index">01</span>')
    expect(html).toContain('<h3 class="k-theme-name">示例题材</h3>')
    expect(html).toContain('data-slot="theme-count">3涨停<')
    expect(html).toContain('data-slot="theme-board">2板<')
    expect(themeCardFigures({ ...PCB, members: [] })).toEqual({ count: 0, highest: null })
    expect(themeCardFigures({ ...PCB, limitUpCount: null, highestBoard: 5 })).toEqual({ count: null, highest: 5 })
  })

  it('催化一行带来源：全文与来源放悬停；没有写「—」与原因', () => {
    const html = renderToStaticMarkup(<ThemeCard theme={PCB} />)
    expect(html).toContain('title="示例催化：某行业协会发布供应链警报\n来源：示例来源"')
    const none = renderToStaticMarkup(
      <ThemeCard theme={{ ...PCB, catalyst: null, catalystReason: '示例：今日无催化' }} />,
    )
    expect(none).toContain('data-unavailable="true"')
    expect(none).toContain('title="示例：今日无催化"')
    expect(none).toContain('>—</p>')
  })

  it('成员表：时间（秒去掉，没有写 —）、名称、连板徽标；卡脚「查看 3 只涨停」；给了回调才是按钮', () => {
    const html = renderToStaticMarkup(<ThemeCard theme={PCB} />)
    expect(html).toContain('<span class="k-theme-time">09:36</span><span class="k-theme-member-name">示例甲</span>')
    expect(html).toContain('<span class="k-theme-time">—</span>')
    expect(html.match(/data-slot="theme-member"/g)).toHaveLength(3)
    expect(html).toContain('data-slot="streak-badge" data-level="2"')
    expect(html).toContain('>查看 3 只涨停<')
    expect(html).not.toContain('<button')
    const withHandlers = renderToStaticMarkup(<ThemeCard theme={PCB} onOpen={() => {}} onSelectMember={() => {}} />)
    expect(withHandlers.match(/<button/g)).toHaveLength(4)
  })

  it('文字走 labels，可整份换', () => {
    const html = renderToStaticMarkup(
      <ThemeCard
        theme={PCB}
        labels={{ ...cnLabelsZh.themeCard, limitUpCount: (n) => `${n} limit-up`, viewAll: (n) => `View ${n}` }}
      />,
    )
    expect(html).toContain('3 limit-up')
    expect(html).toContain('View 3')
  })
})

describe('ThemeCards', () => {
  it('多张卡横排，序号按显示次序，排序由调用方', () => {
    const second = { ...PCB, key: 'b', name: '示例题材乙' }
    const html = renderToStaticMarkup(<ThemeCards themes={[PCB, second]} />)
    expect(html.match(/data-slot="theme-card"/g)).toHaveLength(2)
    expect(html.indexOf('01')).toBeLessThan(html.indexOf('02'))
    expect(html).toContain('role="list"')
  })
})
