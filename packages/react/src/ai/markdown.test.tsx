// SPDX-License-Identifier: MIT
// 安全的 Markdown（#132）：用例搬自 KATANAview src/ui/Markdown.test.tsx，语言包那条改成 labels；另补文档模式。
import { describe, expect, it } from 'vite-plus/test'
import { docHeadings, markdownSlot, renderDoc, renderMarkdown } from './markdown.tsx'

describe('Markdown：模型写的话', () => {
  it('常用的写法照常画：粗体、列表、表格、代码', () => {
    const html = renderMarkdown('**波动**大\n\n- 一\n- 二\n\n| a | b |\n|---|---|\n| 1 | 2 |\n\n`code`')
    expect(html).toContain('<strong>波动</strong>')
    expect(html).toContain('<li>一</li>')
    expect(html).toContain('<table>')
    expect(html).toContain('<code>code</code>')
  })

  it('HTML 原样当字写出来，不执行', () => {
    const html = renderMarkdown('<img src=x onerror=alert(1)><script>alert(1)</script>')
    expect(html).not.toContain('<img')
    expect(html).not.toContain('<script')
    expect(html).toContain('&lt;script&gt;')
  })

  it('不画图片，只写说明', () => {
    const html = renderMarkdown('![走势](https://example.com/x.png?q=secret)')
    expect(html).not.toContain('<img')
    expect(html).not.toContain('example.com')
    expect(html).toContain('[图片：走势]')
    expect(renderMarkdown('![](https://example.com/x.png)')).toContain('[图片]')
  })

  it('图片说明的文案里带 HTML 也当字写出来（文案可以来自用户导入的语言包）', () => {
    const html = renderMarkdown('![走势<b>](https://example.com/x.png)', 0, {
      image: (alt) => `<img src=x onerror=alert(1)>${alt}`,
    })
    expect(html).not.toContain('<img')
    expect(html).not.toContain('<b>')
    expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;')
  })

  it('链接只认 http(s)，新标签页打开、不带来源', () => {
    expect(renderMarkdown('[看](https://example.com)')).toContain(
      '<a href="https://example.com" target="_blank" rel="noopener noreferrer">看</a>',
    )
    expect(renderMarkdown('[坏](javascript:alert(1))')).not.toContain('<a')
    expect(renderMarkdown('[本地](/api/secret)')).not.toContain('<a')
  })

  it('占位符的位置留一个槽（角标画在里面）；序号超出槽数的当没有', () => {
    const html = renderMarkdown(`涨停 58 家${markdownSlot(0)}，**加粗**${markdownSlot(1)}。`, 2)
    expect(html).toContain('58 家<span class="k-md-slot" data-slot="0"></span>，')
    expect(html).toContain('<strong>加粗</strong><span class="k-md-slot" data-slot="1"></span>。')
    expect(renderMarkdown(`甲${markdownSlot(5)}乙`, 1)).toBe('<p>甲乙</p>\n')
    expect(renderMarkdown(`甲${markdownSlot(0)}乙`)).toBe('<p>甲乙</p>\n')
  })
})

describe('Markdown：帮助文档', () => {
  const resolve = (href: string) => (href.endsWith('.md') ? `doc:${href}` : null)

  it('标题带锚点，重名加序号；docHeadings 给出同一套锚点', () => {
    const text = '# 快速上手\n\n## 下单 `F9`\n\n## 下单 `F9`'
    const html = renderDoc(text, resolve)
    expect(html).toContain('<h1 data-anchor="快速上手">')
    expect(html).toContain('<h2 data-anchor="下单-f9">')
    expect(html).toContain('<h2 data-anchor="下单-f9-1">')
    expect(docHeadings(text)).toEqual([
      { level: 1, text: '快速上手', anchor: '快速上手' },
      { level: 2, text: '下单 F9', anchor: '下单-f9' },
      { level: 2, text: '下单 F9', anchor: '下单-f9-1' },
    ])
  })

  it('认得的相对链接写成 data-target，不认得的只留文字；外链仍新标签页', () => {
    const html = renderDoc('[设置](./settings.md) [源码](../src/x.ts) [官网](https://example.com)', resolve)
    expect(html).toContain('<a href="#" data-target="doc:./settings.md">设置</a>')
    expect(html).toContain(' 源码 ')
    expect(html).not.toContain('x.ts')
    expect(html).toContain('<a href="https://example.com" target="_blank" rel="noopener noreferrer">官网</a>')
  })

  it('文档模式仍不渲染 HTML、不画图片', () => {
    const html = renderDoc('<b>粗</b> ![图](./a.png)', resolve)
    expect(html).not.toContain('<b>')
    expect(html).not.toContain('<img')
    expect(html).toContain('[图片：图]')
  })
})
