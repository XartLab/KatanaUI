// SPDX-License-Identifier: MIT
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vite-plus/test'
import { TickerTape, type TickerItem } from './ticker-tape.tsx'

const items: TickerItem[] = [
  { id: 'a', symbol: 'BTCUSD', last: 63978, change: -900, changePct: -1.39, currency: 'USD' },
  { id: 'b', symbol: 'ETHUSD', last: 1794.6, change: 10, changePct: 0.56 },
]
const labels = { region: '行情跑马灯', pause: '暂停滚动', resume: '继续滚动' }

describe('TickerTape', () => {
  it('滚动时画两遍，第二遍 aria-hidden + inert；暂停钮必有', () => {
    const html = renderToStaticMarkup(<TickerTape items={items} labels={labels} />)
    expect(html.match(/data-slot="ticker-item"/g)).toHaveLength(4)
    expect(html).toMatch(/data-copy="true"[^>]*aria-hidden="true"[^>]*inert=""/)
    expect(html).toContain('aria-label="暂停滚动"')
    expect(html).toContain('+0.56%')
    expect(html).toContain('USD')
  })

  it('static：只画一遍、没有暂停钮、滚动区可聚焦；给 onSelect 每项是按钮', () => {
    const html = renderToStaticMarkup(
      <TickerTape items={items} labels={labels} mode="static" onSelect={() => {}} layout="inline" />,
    )
    expect(html.match(/data-slot="ticker-item"/g)).toHaveLength(2)
    expect(html).not.toContain('ticker-toggle')
    expect(html).toContain('tabindex="0"')
    expect(html).toContain('<button type="button" class="k-ticker-item"')
  })
})
