// SPDX-License-Identifier: MIT
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vite-plus/test'
import { LogoProvider, useHasLogoProvider, useLogo } from './react.tsx'
import { selfHosted } from './resolve.ts'
import { web3icons } from './web3icons.ts'

function Probe({ symbol }: { symbol: string }) {
  const logo = useLogo({ symbol })
  return <i data-src={logo.src ?? ''} data-status={logo.status} data-has={String(useHasLogoProvider())} />
}

describe('LogoProvider / useLogo', () => {
  it('没有 Provider：什么都不解析', () => {
    expect(renderToStaticMarkup(<Probe symbol="AAPL" />)).toBe(
      '<i data-src="" data-status="none" data-has="false"></i>',
    )
  })

  it('字符串候选直接给 src；载入函数的候选先是 loading（服务端渲染不等它）', () => {
    const providers = [web3icons(), selfHosted({ baseUrl: '/logos' })]
    const html = renderToStaticMarkup(
      <LogoProvider providers={providers}>
        <Probe symbol="600519.SH" />
        <Probe symbol="BTCUSDT" />
      </LogoProvider>,
    )
    expect(html).toContain('data-src="/logos/600519.XSHG.svg" data-status="ready" data-has="true"')
    expect(html).toContain('data-src="" data-status="loading"')
  })
})
