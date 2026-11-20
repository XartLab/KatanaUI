// SPDX-License-Identifier: MIT
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vite-plus/test'
import * as base from '../src/index'
import * as blocks from '../src/blocks'
import * as cn from '../src/cn'
import * as quant from '../src/quant'
import { DEMOS } from './demos'
import { GENERATED, resolveParts } from './props'
import { usageName, usageOf } from './usage'
import { GROUPS, NON_COMPONENT_EXPORTS, PAGES } from './registry'

// 文档站与包的出口对账（#1860）：每个导出的件都有页，每页写的件都存在，每页都有预览。属性表读 props.generated.json（pnpm docs:props 生成，过期由 lint:ds 拦），每页还要有「用法」例子（#1902）。

const exported = [...Object.keys(base), ...Object.keys(quant), ...Object.keys(cn), ...Object.keys(blocks)]
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
      expect(resolveParts(page).length, `${page.id} 的属性表`).toBeGreaterThan(0)
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

describe('属性表与用法（#1902）', () => {
  it('每页的属性部件要么对得上生成的条目，要么只是带说明的标题', () => {
    for (const page of PAGES.filter((item) => item.propParts)) {
      for (const part of page.propParts!) {
        const symbol = part.symbol ?? part.part
        expect(
          GENERATED[symbol] !== undefined || Boolean(part.note),
          `${page.id}/${part.part}：不是导出名，又没有 note`,
        ).toBe(true)
      }
    }
  })

  it('页上显示的每个属性都有英文说明（JSDoc 第一句），没有中文', () => {
    const bad: string[] = []
    for (const page of PAGES) {
      for (const part of resolveParts(page)) {
        if (!page.propParts) continue
        for (const row of part.rows) {
          if (!row.description || /[\u4e00-\u9fff]/.test(row.description)) bad.push(`${part.part}.${row.name}`)
        }
      }
    }
    expect(bad, '这些属性缺 JSDoc 或第一句不是英文（写在组件源码里，再跑 pnpm docs:props）').toEqual([])
  })

  it('页上写的每个部件、函数都在生成的条目里', () => {
    const missing = PAGES.flatMap((page) =>
      page.exports.filter((name) => !GENERATED[name]).map((name) => `${page.id}/${name}`),
    )
    expect(missing).toEqual([])
  })

  it('每页都有用法：文件名对得上、源码引的是包名、能渲染', () => {
    for (const page of PAGES) {
      const usage = usageOf(page.id)
      expect(usage, `${page.id} 缺 gallery/usage/${usageName(page.id)}.tsx`).toBeDefined()
      expect(usage!.source, `${page.id} 的用法没有包外写法的引入`).toMatch(/from '@katana-ui\/react(\/[a-z/]+)?'/)
      expect(usage!.source, `${page.id} 的用法还留着包内相对路径`).not.toMatch(/from '\.\.\/\.\.\/src/)
      expect(renderToStaticMarkup(<usage.Usage />).length, `${page.id} 的用法`).toBeGreaterThan(10)
    }
  })
})
