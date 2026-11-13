// SPDX-License-Identifier: AGPL-3.0-only
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vite-plus/test'
import * as ui from '../src/index'
import { DEMOS } from './demos'
import { GROUPS, NON_COMPONENT_EXPORTS, PAGES } from './registry'

// 文档站与包的出口对账（#1860）：每个导出的件都有页，每页写的件都存在，每页都有预览。属性表是手写的，这里只能核对名字，核对不了类型。

const exported = Object.keys(ui)
const documented = PAGES.flatMap((page) => page.exports)

describe('组件文档站的目录', () => {
  it('包的每个导出（除了类名工具）都在恰好一页上', () => {
    const missing = exported.filter((name) => !NON_COMPONENT_EXPORTS.includes(name) && !documented.includes(name))
    expect(missing, '这些导出没有文档页').toEqual([])
    const repeated = documented.filter((name, index) => documented.indexOf(name) !== index)
    expect(repeated, '这些导出写在了不止一页').toEqual([])
  })

  it('每页写的件都真的从包里导出', () => {
    expect(documented.filter((name) => !exported.includes(name))).toEqual([])
    expect(NON_COMPONENT_EXPORTS.filter((name) => !exported.includes(name))).toEqual([])
  })

  it('页 id 不重复，分组存在，每页有预览与说明', () => {
    const ids = PAGES.map((page) => page.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const page of PAGES) {
      expect(
        GROUPS.some((group) => group.id === page.group),
        `${page.id} 的分组`,
      ).toBe(true)
      expect(page.summary.length, `${page.id} 的说明`).toBeGreaterThan(0)
      expect(page.props.length, `${page.id} 的属性表`).toBeGreaterThan(0)
      expect(DEMOS[page.id], `${page.id} 的预览`).toBeDefined()
    }
    expect(Object.keys(DEMOS).toSorted()).toEqual(ids.toSorted())
  })

  it('每页的预览都能渲染出内容', () => {
    for (const page of PAGES) {
      const Demo = DEMOS[page.id]
      expect(renderToStaticMarkup(<Demo />).length, `${page.id} 的预览`).toBeGreaterThan(20)
    }
  })
})
