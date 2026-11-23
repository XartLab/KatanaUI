// SPDX-License-Identifier: MIT
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vite-plus/test'
import { SentimentGauge, sentimentLevel } from './sentiment-gauge.tsx'

// #110 第 1 批第 5 项：情绪温度。示例数字，不是行情。
describe('SentimentGauge', () => {
  it('五档：每档 20 分，100 分在最高档，越界按边，取不到是 null', () => {
    expect([0, 19.9, 20, 45, 79.9, 80, 100, 130, -5].map(sentimentLevel)).toEqual([0, 0, 1, 2, 3, 4, 4, 4, 0])
    expect(sentimentLevel(null)).toBeNull()
    expect(sentimentLevel(Number.NaN)).toBeNull()
  })

  it('读数落在哪一档：档名、当前档全亮、标记位置按分数', () => {
    const html = renderToStaticMarkup(<SentimentGauge score={62} />)
    expect(html).toContain('data-level="3"')
    expect(html).toContain('>62</b>')
    expect(html).toContain('<span class="k-sentiment-level" data-slot="sentiment-level">升温</span>')
    expect(html).toContain('data-seg="3" data-current="true"')
    expect(html.match(/data-current="true"/g)).toHaveLength(1)
    expect(html.match(/data-seg=/g)).toHaveLength(5)
    expect(html).toContain('style="left:62%"')
    for (const name of ['冰点', '低迷', '中性', '升温', '高潮']) expect(html).toContain(`<span>${name}</span>`)
    expect(html).toContain('aria-label="情绪温度 62，升温"')
  })

  it('口径说明由调用方写，下注在色带下面', () => {
    const html = renderToStaticMarkup(<SentimentGauge score={50} basis="示例口径 · 未历史校准" />)
    expect(html).toContain('<p class="k-sentiment-basis" data-slot="sentiment-basis">示例口径 · 未历史校准</p>')
    expect(renderToStaticMarkup(<SentimentGauge score={50} />)).not.toContain('sentiment-basis')
  })

  it('取不到写「—」、不画标记、没有当前档，原因放悬停，不写 0', () => {
    const html = renderToStaticMarkup(<SentimentGauge score={null} reason="示例：数据没到" />)
    expect(html).toContain('title="示例：数据没到"')
    expect(html).toContain('>—</b>')
    expect(html).not.toContain('k-sentiment-marker')
    expect(html).not.toContain('data-current')
    expect(html).not.toContain('data-level=')
  })

  it('今昨对比两列：涨停、跌停、封率（百分数）、开板；缺的写「—」带原因', () => {
    const html = renderToStaticMarkup(
      <SentimentGauge
        score={30}
        today={{ limitUp: 30, limitDown: 62, sealRate: 62.54, broken: { value: null, reason: '示例：盘中未知' } }}
        yesterday={{ limitUp: 23, limitDown: 68, sealRate: 48, broken: 24 }}
      />,
    )
    expect(html).toContain('<th scope="col">今日</th><th scope="col">昨日</th>')
    expect(html).toContain(
      'data-key="limitUp"><th scope="row">涨停</th><td data-col="today">30</td><td data-col="yesterday">23</td>',
    )
    expect(html).toContain('<td data-col="today">62.5%</td><td data-col="yesterday">48.0%</td>')
    expect(html).toContain('data-col="today" data-unavailable="true" title="示例：盘中未知">—</td>')
    expect(renderToStaticMarkup(<SentimentGauge score={30} />)).not.toContain('sentiment-compare')
  })
})
