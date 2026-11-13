// SPDX-License-Identifier: MIT
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vite-plus/test'
import { KINDS, summarize, type CoverageMap } from '../docs/coverage-core'
import map from '../docs/coverage-map.json'
import { CoveragePage } from './coverage'

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
