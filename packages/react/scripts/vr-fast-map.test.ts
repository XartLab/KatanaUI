// SPDX-License-Identifier: MIT
import { describe, expect, it } from 'vitest'
import { onlyNames, parseDemoFiles, parseReexports, selectPages, type MapContext } from './vr-fast-map.ts'

const pages = [
  { id: 'button', exports: ['Button', 'buttonVariants'] },
  { id: 'data-grid', exports: ['DataGrid'] },
  { id: 'sparkline', exports: ['Sparkline'] },
  { id: 'metric-card', exports: ['MetricCard'] },
  { id: 'dialog', exports: ['Dialog'] },
  { id: 'input', exports: ['Input'] },
]
const ctx: MapContext = {
  pages,
  exportFiles: new Map([
    ['src/primitives/button.tsx', ['Button', 'buttonVariants']],
    ['src/katana/sparkline.tsx', ['Sparkline']],
    ['src/katana/metric-card.tsx', ['MetricCard']],
    ['src/quant/data-grid.tsx', ['DataGrid']],
    ['src/katana/helper.ts', []],
  ]),
  dependents: new Map([
    ['src/katana/sparkline.tsx', ['src/katana/metric-card.tsx']],
    ['src/katana/helper.ts', ['src/katana/sparkline.tsx']],
    ['src/katana/metric-card.tsx', ['gallery/pages/quotes.tsx']],
    ['gallery/pages/quotes.tsx', ['gallery/pages/more.tsx']],
  ]),
  demoFiles: new Map([['gallery/pages/sparkline-gallery.tsx', ['sparkline']]]),
}
const P = 'packages/react/'

describe('parseReexports', () => {
  it('转出口：去掉 type、取 as 后的名字、跳过 index', () => {
    const source = "export { Button, type ButtonProps, cn as cx } from './katana/button.tsx'\nexport * from './x'"
    expect(parseReexports('src/', source)).toEqual([['src/katana/button.tsx', ['Button', 'ButtonProps', 'cx']]])
  })
})

describe('parseDemoFiles', () => {
  it('demos.tsx 的引入与页 id 对上', () => {
    const source =
      "import { SparklineDemo } from './pages/sparkline-gallery.tsx'\nconst DEMOS = {\n  sparkline: SparklineDemo,\n  'x-y': Missing,\n}"
    expect(parseDemoFiles(source)).toEqual(new Map([['gallery/pages/sparkline-gallery.tsx', ['sparkline']]]))
  })
})

describe('selectPages', () => {
  it('组件源码 → 它自己的页，加上引了它的件的页', () => {
    expect(selectPages([`${P}src/katana/sparkline.tsx`], ctx).ids).toEqual(['metric-card', 'sparkline'])
  })
  it('间接引用也算', () => {
    expect(selectPages([`${P}src/katana/helper.ts`], ctx).ids).toEqual(['metric-card', 'sparkline'])
  })
  it('usage 文件 → 一页', () => {
    expect(selectPages([`${P}gallery/usage/DataGridUsage.tsx`], ctx).ids).toEqual(['data-grid'])
  })
  it('demo 文件 → 用它的页', () => {
    expect(selectPages([`${P}gallery/pages/sparkline-gallery.tsx`], ctx).ids).toEqual(['sparkline'])
  })
  it('theme 样式、令牌包 → 共用层', () => {
    expect(selectPages([`${P}src/theme/quote.css`], ctx).shared).toBe(true)
    expect(selectPages(['packages/tokens/src/tokens.json'], ctx).shared).toBe(true)
  })
  it('测试、文档、注册表、工作流不影响截图', () => {
    const none = selectPages(
      [
        `${P}src/katana/button.test.ts`,
        `${P}gallery/registry.ts`,
        `${P}gallery/guidance/forms.ts`,
        'AGENTS.md',
        '.github/workflows/ci.yml',
      ],
      ctx,
    )
    expect(none).toEqual({ ids: [], shared: false, foundation: false, unmapped: [] })
  })
  it('认不出的文件按共用层，并列出来', () => {
    const result = selectPages([`${P}src/katana/orphan.tsx`], ctx)
    expect(result.shared).toBe(true)
    expect(result.unmapped).toEqual([`${P}src/katana/orphan.tsx`])
  })
  it('反查出太多页也当共用层', () => {
    const many = Array.from({ length: 30 }, (_, i) => ({ id: `p${i}`, exports: [`C${i}`] }))
    const wide: MapContext = {
      ...ctx,
      pages: many,
      exportFiles: new Map(many.map((page) => [`src/a/${page.id}.tsx`, page.exports])),
      dependents: new Map([['src/a/base.tsx', many.map((page) => `src/a/${page.id}.tsx`)]]),
    }
    expect(selectPages([`${P}src/a/base.tsx`], wide).shared).toBe(true)
  })
})

describe('onlyNames', () => {
  const all = new Set(pages.map((page) => page.id))
  it('只给具体页', () => {
    expect(onlyNames({ ids: ['button'], shared: false, foundation: false, unmapped: [] }, all)).toEqual([
      'graphite--button',
    ])
  })
  it('共用层追加代表页与基础页外壳', () => {
    const names = onlyNames({ ids: [], shared: true, foundation: false, unmapped: [] }, all)
    expect(names).toContain('graphite--data-grid')
    expect(names).toContain('graphite--shell-foundation')
  })
})
