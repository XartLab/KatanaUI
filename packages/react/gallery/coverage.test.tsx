// SPDX-License-Identifier: MIT
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vite-plus/test'
import { KINDS, summarize, type CoverageMap } from '../docs/coverage-core'
import map from '../docs/coverage-map.json'
import { SALT_STATUSES, summarizeSalt, type SaltMap } from '../docs/salt-core'
import saltMap from '../docs/salt-map.json'
import { CoveragePage } from './coverage'
import { PAGES } from './registry'

// 「覆盖」页（#1870）：每个归属的「已做 / 总数」与汇总逻辑一致，每张卡都在表里。

describe('覆盖页', () => {
  const html = renderToStaticMarkup(<CoveragePage />)

  it('五个归属各一行「已做 / 总数」，数字取自汇总', () => {
    for (const item of summarize(map as CoverageMap)) {
      expect(html).toMatch(
        new RegExp(
          `data-kind="${item.kind}"[^>]*><th scope="row">${item.kind}</th><td data-cell="ratio">${item.done} / ${item.total}</td>`,
        ),
      )
    }
    expect(KINDS).toHaveLength(5)
  })

  it('每张卡出现一次，带状态', () => {
    for (const [name, entry] of Object.entries((map as CoverageMap).cards)) {
      expect(html).toContain(`data-card="${name}" data-status="${entry.status}"`)
    }
  })
})

// 「对照 Salt」（#104）：表里写的页 id 都真实存在，状态与页、备注自洽，汇总数与页上一致。
describe('对照 Salt', () => {
  const salt = saltMap as SaltMap
  const html = renderToStaticMarkup(<CoveragePage />)
  const ids = new Set(PAGES.map((page) => page.id))

  it('每个 Salt 组件只出现一次，状态是三态之一', () => {
    const slugs = salt.components.map((entry) => entry.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
    for (const entry of salt.components) expect(SALT_STATUSES).toContain(entry.status)
  })

  it('表里写的页 id 在文档站里都真实存在', () => {
    const missing = salt.components.flatMap((entry) =>
      entry.pages.filter((id) => !ids.has(id)).map((id) => `${entry.name} -> ${id}`),
    )
    expect(missing).toEqual([])
  })

  it('有、部分必须落到页；没有不能写页；部分与没有必须写备注', () => {
    for (const entry of salt.components) {
      if (entry.status === '没有') expect(entry.pages, entry.name).toHaveLength(0)
      else expect(entry.pages.length, entry.name).toBeGreaterThan(0)
      if (entry.status !== '有') expect(entry.note?.trim(), entry.name).toBeTruthy()
    }
  })

  it('读清单的日期是 YYYY-MM-DD', () => {
    expect(salt.readOn).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('覆盖页有这一节：汇总数取自 summarizeSalt，每一行带状态', () => {
    const counts = summarizeSalt(salt)
    expect(counts.有 + counts.部分 + counts.没有).toBe(salt.components.length)
    for (const status of SALT_STATUSES) expect(html).toContain(`<td data-cell="${status}">${counts[status]}</td>`)
    for (const entry of salt.components)
      expect(html).toContain(`data-salt="${entry.slug}" data-status="${entry.status}"`)
  })
})
