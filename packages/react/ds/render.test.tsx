// SPDX-License-Identifier: MIT
import { describe, expect, it } from 'vite-plus/test'
import { OPEN_DEMOS } from '../gallery/demos'
import { cardGroup, componentReadme, folderName, pages, renderPreviewBody } from './render'

describe('设计系统包的件（读文档站的页数据）', () => {
  it('每页一个件：文件夹名不重复，分组存在，卡片高度是正数', () => {
    expect(new Set(pages.map((page) => folderName(page.id))).size).toBe(pages.length)
    for (const page of pages) {
      expect(cardGroup(page), page.id).toMatch(/^[A-Z][a-zA-Z]+$/)
      expect(page.cardHeight, page.id).toBeGreaterThan(0)
    }
  })

  it('每页都写了状态与不要怎么用', () => {
    for (const page of pages) {
      expect(page.states.length, `${page.id} 的状态`).toBeGreaterThan(0)
      expect(page.donts.length, `${page.id} 的不要`).toBeGreaterThan(0)
    }
  })

  it('README 以件名与说明开头，写了属性与组成', () => {
    for (const page of pages) {
      const readme = componentReadme(page)
      expect(readme.startsWith(`# ${folderName(page.id)}\n\n${page.summary}\n`), page.id).toBe(true)
      expect(readme).toContain('## Provide')
      expect(readme).toContain('## States')
      expect(readme).toContain("## Don't")
      expect(readme).toContain('## Composition')
    }
  })

  it('预览有内容，style 属性里没有裸色值与写死的字体族（用 token）', () => {
    for (const page of pages) {
      const html = renderPreviewBody(page)
      expect(html.startsWith('<!doctype html>'), page.id).toBe(true)
      expect(html.length, page.id).toBeGreaterThan(300)
      const styles = [...html.matchAll(/style="([^"]*)"/g)].map((m) => m[1]).join(';')
      expect(styles, page.id).not.toMatch(/#[0-9a-fA-F]{3,8}\b|rgba?\(|font-family\s*:\s*(?!var\()/)
    }
  })

  it('浮层类的页摆出打开的样子：触发器之外还有打开状态的内容', () => {
    expect(Object.keys(OPEN_DEMOS).toSorted()).toEqual(
      ['alert-dialog', 'context-menu', 'dialog', 'dropdown-menu', 'popover', 'select', 'tooltip'].toSorted(),
    )
    for (const page of pages.filter((item) => OPEN_DEMOS[item.id])) {
      const html = renderPreviewBody(page)
      const open = html.slice(html.indexOf('class="ds-open"'))
      expect(open.length, page.id).toBeGreaterThan(0)
      expect(open, `${page.id} 的打开内容`).toMatch(/role="(?:tooltip|dialog|alertdialog|menu|listbox)"/)
    }
  })
})
