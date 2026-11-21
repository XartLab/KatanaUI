// SPDX-License-Identifier: MIT
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vite-plus/test'
import { EMPHASIS_LEVELS, EmphasisProvider, useEmphasis, type Emphasis } from './emphasis.tsx'

// 分量（#115）：三档，默认 standard，往下继承，里层盖住外层。

function Probe() {
  return <i>{useEmphasis()}</i>
}
/** 页面上每个 Probe 读到的分量，按出现次序。 */
const read = (node: React.ReactNode) =>
  [...renderToStaticMarkup(node).matchAll(/<i>(.*?)<\/i>/g)].map((match) => match[1]).join(' ')

describe('EmphasisProvider 与 useEmphasis', () => {
  it('三档：hero、standard、compact', () => {
    expect(EMPHASIS_LEVELS).toEqual(['hero', 'standard', 'compact'])
  })

  it('不包就是 standard', () => {
    expect(read(<Probe />)).toBe('standard')
  })

  it('包了就读到包的那一档，三档都对', () => {
    for (const level of EMPHASIS_LEVELS satisfies readonly Emphasis[])
      expect(
        read(
          <EmphasisProvider value={level}>
            <Probe />
          </EmphasisProvider>,
        ),
      ).toBe(level)
  })

  it('往下继承（隔着别的元素也读得到），里层的 Provider 盖住外层', () => {
    expect(
      read(
        <EmphasisProvider value="hero">
          <div>
            <Probe />
          </div>
        </EmphasisProvider>,
      ),
    ).toBe('hero')
    expect(
      read(
        <EmphasisProvider value="hero">
          <EmphasisProvider value="compact">
            <Probe />
          </EmphasisProvider>
          <Probe />
        </EmphasisProvider>,
      ),
    ).toBe('compact hero')
  })
})
