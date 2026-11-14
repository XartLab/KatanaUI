// SPDX-License-Identifier: MIT
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vite-plus/test'
import { SmallMultiples } from './small-multiples.tsx'

// #1917：SmallMultiples 的结构。扫读同步（指针与键盘）在 e2e/ui-gallery.spec.ts 里用真浏览器验。

const items = [
  { key: 'a', label: 'A', values: [1, 2, 3, 4] },
  { key: 'b', label: 'B', values: [4, 3, 2, 1] },
  { key: 'c', label: 'C', values: [2, 3, 3, 2] },
]
const render = (props: Partial<Parameters<typeof SmallMultiples>[0]> = {}) =>
  renderToStaticMarkup(<SmallMultiples items={items} label="示例" formatValue={(v) => `v${v}`} {...props} />)

describe('SmallMultiples', () => {
  it('每个品种一张，头尾比定涨跌平，值写最新一格', () => {
    const html = render()
    expect(html.match(/data-slot="small-multiple"/g)).toHaveLength(3)
    expect(html).toContain('data-key="a" data-tone="up"')
    expect(html).toContain('data-key="b" data-tone="down"')
    expect(html).toContain('data-key="c" data-tone="flat"')
    expect(html).toContain('>v4<')
    expect(html).toContain('>v1<')
  })

  it('each 与 shared：each 时每条线上下贴边，shared 时范围小的线不贴边', () => {
    const ys = (html: string, key: string) => {
      const block = html.slice(html.indexOf(`data-key="${key}"`))
      const d = /data-slot="small-multiple-line" d="([^"]*)"/.exec(block)![1]!
      return [...d.matchAll(/,([\d.]+)/g)].map((m) => Number(m[1]))
    }
    const each = ys(render({ yScale: 'each', height: 56 }), 'c')
    expect([Math.min(...each), Math.max(...each)]).toEqual([4, 52])
    const shared = ys(render({ yScale: 'shared', height: 56 }), 'c')
    expect(Math.min(...shared)).toBeGreaterThan(4)
    expect(Math.max(...shared)).toBeLessThan(52)
  })

  it('给了 onSelect 标题是按钮，没给是普通块；formatX 决定有没有读数行', () => {
    expect(render({ onSelect: () => {} }).match(/<button/g)).toHaveLength(3)
    expect(render()).not.toContain('<button')
    expect(render()).not.toContain('small-multiples-readout')
    expect(render({ formatX: String })).toContain('small-multiples-readout')
  })

  it('没有任何数据：不报错，值写破折号', () => {
    const html = render({ items: [{ key: 'x', label: 'X', values: [] }] })
    expect(html).toContain('>—<')
  })
})
