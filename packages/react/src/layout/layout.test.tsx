// SPDX-License-Identifier: MIT
import { readFileSync } from 'node:fs'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vite-plus/test'
import tokens from '../tokens-json.ts'
import { Cluster } from './cluster.tsx'
import { Grid, GRID_MIN } from './grid.tsx'
import { Reel } from './reel.tsx'
import { Sidebar, SIDEBAR_CONTENT_MIN, SIDEBAR_SIDE_WIDTH } from './sidebar.tsx'
import { SPACE_STEPS } from './space.ts'
import { Stack } from './stack.tsx'
import { Switcher, SWITCHER_THRESHOLD } from './switcher.tsx'

// 排版原语（#115）：间距只收刻度名，原语只管位置与间距。真实的换行、变竖排要在浏览器里量，见 e2e/layout.spec.ts；
// 这里量的是原语写给样式的东西（类名、自定义属性、data 属性）与样式本身的规则。

const layoutCss = readFileSync(new URL('../theme/layout.css', import.meta.url), 'utf8')

describe('间距刻度', () => {
  it('SPACE_STEPS 跟 tokens.json 的 space-* 刻度一一对得上（刻度改名或加减，这里要跟着改）', () => {
    const spacing = (tokens as { spacing: { tokens: { name: string }[] } }).spacing.tokens
    const scale = spacing.map((token) => token.name).filter((name) => name.startsWith('space-'))
    expect([...SPACE_STEPS].toSorted()).toEqual(scale.toSorted())
  })

  it('每个原语把刻度名写成 var(--space-*)，不收数字', () => {
    const html = [
      renderToStaticMarkup(<Stack gap="space-4" />),
      renderToStaticMarkup(<Cluster gap="space-4" />),
      renderToStaticMarkup(<Sidebar gap="space-4" />),
      renderToStaticMarkup(<Switcher gap="space-4" />),
      renderToStaticMarkup(<Grid gap="space-4" />),
      renderToStaticMarkup(<Reel gap="space-4" />),
    ]
    for (const item of html) expect(item).toContain('--k-gap:var(--space-4)')
    // 类型层面也拦：数字、不在刻度里的名字过不了 tsc。
    // @ts-expect-error 间距只收刻度名
    renderToStaticMarkup(<Stack gap={12} />)
    // @ts-expect-error 不在刻度里的名字
    renderToStaticMarkup(<Stack gap="space-7" />)
  })
})

describe('Stack', () => {
  it('类名与默认间距；as 换元素；className 与 style 照常透传', () => {
    expect(renderToStaticMarkup(<Stack />)).toBe('<div class="k-stack" style="--k-gap:var(--space-3)"></div>')
    const html = renderToStaticMarkup(
      <Stack as="ul" gap="space-hair" className="extra" style={{ width: 10 }} aria-label="列表" />,
    )
    expect(html).toMatch(/^<ul /)
    expect(html).toContain('class="k-stack extra"')
    expect(html).toContain('width:10px')
    expect(html).toContain('--k-gap:var(--space-hair)')
    expect(html).toContain('aria-label="列表"')
  })

  it('样式：竖排的 flex，间距读 --k-gap', () => {
    expect(layoutCss).toMatch(/\.k-stack \{[^}]*flex-direction: column;[^}]*gap: var\(--k-gap\);/)
  })
})

describe('Cluster', () => {
  it('默认纵向居中、靠左；align 与 justify 写成 data 属性，样式按它定', () => {
    const html = renderToStaticMarkup(<Cluster />)
    expect(html).toContain('data-align="center"')
    expect(html).toContain('data-justify="start"')
    const custom = renderToStaticMarkup(<Cluster align="baseline" justify="between" />)
    expect(custom).toContain('data-align="baseline"')
    expect(custom).toContain('data-justify="between"')
    expect(layoutCss).toMatch(/\.k-cluster \{[^}]*flex-wrap: wrap;/)
    expect(layoutCss).toMatch(/\.k-cluster\[data-justify='between'\] \{\s*justify-content: space-between;/)
    expect(layoutCss).toMatch(/\.k-cluster\[data-align='baseline'\] \{\s*align-items: baseline;/)
  })
})

describe('Sidebar', () => {
  it('窄的那块的宽度：刻度名按刻度，数字按 px，不给用默认；宽的至少占 contentMin', () => {
    expect(renderToStaticMarkup(<Sidebar />)).toContain(`--k-side-width:${SIDEBAR_SIDE_WIDTH}px`)
    expect(renderToStaticMarkup(<Sidebar />)).toContain(`--k-content-min:${SIDEBAR_CONTENT_MIN * 100}%`)
    expect(renderToStaticMarkup(<Sidebar sideWidth="space-8" />)).toContain('--k-side-width:var(--space-8)')
    expect(renderToStaticMarkup(<Sidebar sideWidth={320} contentMin={0.6} />)).toContain('--k-side-width:320px')
    expect(renderToStaticMarkup(<Sidebar sideWidth={320} contentMin={0.6} />)).toContain('--k-content-min:60%')
  })

  it('side 决定哪一个子节点是窄的（样式按 data-side 选第一个或最后一个）', () => {
    expect(renderToStaticMarkup(<Sidebar />)).toContain('data-side="start"')
    expect(renderToStaticMarkup(<Sidebar side="end" />)).toContain('data-side="end"')
    expect(layoutCss).toMatch(
      /\.k-sidebar\[data-side='start'\] > :first-child,\s*\.k-sidebar\[data-side='end'\] > :last-child \{/,
    )
    // 宽的那块有最小宽度，不够就换行：这是「放不下时上下叠」的来源
    expect(layoutCss).toMatch(/min-inline-size: var\(--k-content-min\)/)
    expect(layoutCss).toMatch(/\.k-sidebar \{[^}]*flex-wrap: wrap;/)
  })
})

describe('Switcher', () => {
  it('阈值写成 --k-threshold（px）；样式把它换成「窄于阈值整体竖排」的 flex-basis', () => {
    expect(renderToStaticMarkup(<Switcher />)).toContain(`--k-threshold:${SWITCHER_THRESHOLD}px`)
    expect(renderToStaticMarkup(<Switcher threshold={600} />)).toContain('--k-threshold:600px')
    expect(layoutCss).toMatch(/\.k-switcher > \* \{[^}]*flex-basis: calc\(\(var\(--k-threshold\) - 100%\) \* 999\);/)
    expect(layoutCss).toMatch(/\.k-switcher \{[^}]*flex-wrap: wrap;/)
  })
})

describe('Grid', () => {
  it('每格最小宽写成 --k-grid-min（px），默认 240；样式是「放得下几列就几列」', () => {
    expect(GRID_MIN).toBe(240)
    expect(renderToStaticMarkup(<Grid />)).toContain('--k-grid-min:240px')
    expect(renderToStaticMarkup(<Grid min={160} />)).toContain('--k-grid-min:160px')
    expect(layoutCss).toMatch(/repeat\(auto-fit, minmax\(min\(var\(--k-grid-min\), 100%\), 1fr\)\)/)
  })
})

describe('Reel', () => {
  it('是能聚焦的滚动区（键盘能滚），tabIndex 可以改；子节点不缩', () => {
    expect(renderToStaticMarkup(<Reel aria-label="题材" />)).toContain('tabindex="0"')
    expect(renderToStaticMarkup(<Reel tabIndex={-1} />)).toContain('tabindex="-1"')
    expect(layoutCss).toMatch(/\.k-reel \{[^}]*overflow-x: auto;/)
    expect(layoutCss).toMatch(/\.k-reel > \* \{\s*flex: 0 0 auto;/)
  })

  it('滚动条 4px、平时透明，悬停或聚焦才显出来', () => {
    expect(layoutCss).toMatch(/\.k-reel::-webkit-scrollbar \{\s*height: 4px;/)
    expect(layoutCss).toMatch(/\.k-reel::-webkit-scrollbar-thumb \{\s*background: transparent;/)
    expect(layoutCss).toMatch(
      /\.k-reel:hover::-webkit-scrollbar-thumb,\s*\.k-reel:focus-visible::-webkit-scrollbar-thumb \{\s*background: var\(--line-200\);/,
    )
    // Chrome 121 起写了 scrollbar-width / scrollbar-color 就不认 ::-webkit-scrollbar：标准属性只能放在「没有 ::-webkit-scrollbar」的分支里
    const outsideSupports = layoutCss
      .replaceAll(/\/\*[\s\S]*?\*\//g, '')
      .replace(/@supports not selector\(::-webkit-scrollbar\) \{[\s\S]*?\n\}\n/, '')
    // 例外是退回 auto（#126）：rendering.css 在 :root 上的 scrollbar-color 会继承下来，继承来的也让 Chrome 不认 ::-webkit-scrollbar，所以 .k-reel 要显式写 auto。
    expect(outsideSupports).not.toMatch(/scrollbar-(?:width|color):(?!\s*auto;)/)
    expect(outsideSupports).toMatch(/\.k-reel \{[^}]*scrollbar-color: auto;/)
  })
})

describe('只管位置与间距', () => {
  it('layout.css 里没有边框、底色、阴影、圆角，也没有写死的间距数字', () => {
    // 滚动条的轨道与滑块（::-webkit-scrollbar*）是浏览器给的零件，要涂色才看得见，不算「画」了这个原语。
    const rules = layoutCss
      .replaceAll(/\/\*[\s\S]*?\*\//g, '')
      .replaceAll(/[^{}]*::-webkit-scrollbar[^{}]*\{[^}]*\}/g, '')
    // 属性名：border、border-radius、background、box-shadow（box-sizing: border-box 是值，不算）
    expect(rules).not.toMatch(/(?:^|[;{\s])(?:border|background|box-shadow)[a-z-]*\s*:/)
    // 六个原语各一条 gap，都只读 --k-gap
    expect([...rules.matchAll(/\bgap:\s*([^;]+);/g)].map((m) => m[1])).toEqual(Array(6).fill('var(--k-gap)'))
    expect(rules).not.toMatch(/\b(?:padding|margin)[a-z-]*:/)
  })
})
