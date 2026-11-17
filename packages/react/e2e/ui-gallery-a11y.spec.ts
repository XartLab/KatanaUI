// SPDX-License-Identifier: MIT
import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'
import { PAGES } from '../gallery/registry.ts'
import known from './ui-gallery-a11y-known.json' with { type: 'json' }

// 文档站每页在 Console 与 Graphite 下的 axe 与控制台检查（#1950）：违规数为 0、没有 pageerror 与 console.error。
// 页列表取自 registry 的 PAGES，新加一页自动被覆盖。规则集同 KATANAview 的 e2e/a11y.ts（WCAG 2.0 / 2.1 的 A 与 AA）。
// 当场修不了的违规列在 ui-gallery-a11y-known.json（只许减：条目在它的页与主题里一个节点都没匹配上就失败，要求删掉）。

const THEMES = ['console', 'graphite'] as const
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']

type Known = { page: string; theme?: (typeof THEMES)[number]; rule: string; reason: string }
const knownList = known as readonly Known[]

// 清单只许减：条目数不许超过现在的数；修好一条就删一条并把这个数调小。
const KNOWN_CAP = 4
test('已知清单只减不增', () => {
  expect(knownList.length).toBeLessThanOrEqual(KNOWN_CAP)
})

test.use({ viewport: { width: 1100, height: 1500 } })

const settle = (page: Page) =>
  page.evaluate(() =>
    Promise.all(
      document
        .getAnimations()
        .filter((animation) => animation.effect?.getComputedTiming().endTime !== Infinity)
        .map((animation) => animation.finished.catch(() => undefined)),
    ),
  )

for (const theme of THEMES) {
  for (const doc of PAGES) {
    test(`文档站 ${doc.id}（${theme}）：axe 无违规、控制台无错误`, async ({ page }) => {
      const errors: string[] = []
      page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`))
      page.on('console', (message) => {
        if (message.type() === 'error') errors.push(`console.error: ${message.text()}`)
      })
      await page.goto(`/?theme=${theme}#/${doc.id}`)
      await page.locator(`[data-gallery="${doc.id}"]`).waitFor()
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme)
      await settle(page)

      const result = await new AxeBuilder({ page }).withTags(TAGS).analyze()
      const entries = knownList.filter((entry) => entry.page === doc.id && (entry.theme ?? theme) === theme)
      const problems: string[] = []
      for (const violation of result.violations) {
        if (entries.some((entry) => entry.rule === violation.id)) continue
        for (const node of violation.nodes)
          problems.push(
            `${violation.id}（${violation.impact}）${node.target.join(' >> ')}：${node.failureSummary?.replace(/\s+/g, ' ').trim()}`,
          )
      }
      for (const entry of entries)
        if (!result.violations.some((violation) => violation.id === entry.rule))
          problems.push(
            `已知清单过期：${entry.page} ${entry.rule} 已经没有了，把这条从 ui-gallery-a11y-known.json 删掉`,
          )
      expect(problems).toEqual([])
      expect(errors).toEqual([])
    })
  }
}
