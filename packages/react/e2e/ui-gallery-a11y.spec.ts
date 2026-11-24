// SPDX-License-Identifier: MIT
import AxeBuilder from '@axe-core/playwright'
import { expect, test as base, type Page } from '@playwright/test'
import { PAGES } from '../gallery/registry.ts'
import known from './ui-gallery-a11y-known.json' with { type: 'json' }

// 文档站每页在 Console 与 Graphite 下的 axe 与控制台检查（#1950）：违规数为 0、没有 pageerror 与 console.error。
// 页列表取自 registry 的 PAGES，新加一页自动被覆盖。规则集同 KATANAview 的 e2e/a11y.ts（WCAG 2.0 / 2.1 的 A 与 AA）。
// 当场修不了的违规列在 ui-gallery-a11y-known.json（只许减：条目在它的页与主题里一个节点都没匹配上就失败，要求删掉）。

const THEMES = ['console', 'graphite'] as const
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']

// timing：违规只在动画没走完时出现（量的时机决定有没有），这类条目不做「过期」检查，免得测试随机红。
type Known = { page: string; theme?: (typeof THEMES)[number]; rule: string; reason: string; timing?: boolean }
const knownList = known as readonly Known[]

// 清单只许减：条目数不许超过现在的数；修好一条就删一条并把这个数调小。
const KNOWN_CAP = 4
base('已知清单只减不增', () => {
  expect(knownList.length).toBeLessThanOrEqual(KNOWN_CAP)
})

// 每个 worker 只开一个页面、只加载一次文档站：换页走 hash（单页应用，不重新下载 4MB 的包），换主题才重新加载。
// 以前每条用例都 goto 一次整站，451 条里大半时间花在加载上（2026-11-18：全量 e2e 27 分钟里这份约占一半）。
type Shared = { shared: { page: Page; theme: string | null } }
const test = base.extend<object, Shared>({
  shared: [
    async ({ browser }, use) => {
      // axe 要求页面来自 browser.newContext()（不能用 browser.newPage()）。
      const context = await browser.newContext({ viewport: { width: 1100, height: 1500 } })
      const page = await context.newPage()
      await use({ page, theme: null })
      await context.close()
    },
    { scope: 'worker' },
  ],
})

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
    test(`文档站 ${doc.id}（${theme}）：axe 无违规、控制台无错误`, async ({ shared }, testInfo) => {
      const { page } = shared
      const errors: string[] = []
      const onError = (error: Error) => errors.push(`pageerror: ${error.message}`)
      const onConsole = (message: import('@playwright/test').ConsoleMessage) => {
        if (message.type() === 'error') errors.push(`console.error: ${message.text()}`)
      }
      page.on('pageerror', onError)
      page.on('console', onConsole)
      try {
        if (shared.theme !== theme) {
          await page.goto(`${testInfo.project.use.baseURL}/?theme=${theme}#/${doc.id}`)
          shared.theme = theme
        } else await page.evaluate((id) => (location.hash = `#/${id}`), doc.id)
        await page.locator(`[data-gallery="${doc.id}"]`).waitFor()
        await expect(page.locator('html')).toHaveAttribute('data-theme', theme)
        await settle(page)

        // 只扫这页的预览区：侧栏、页头、属性表、说明文字每页都一样，由下面「外壳」那几条整页扫一次就够（省掉每页约七成的扫描量）。
        const result = await new AxeBuilder({ page }).withTags(TAGS).include(`[data-gallery="${doc.id}"]`).analyze()
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
          if (!entry.timing && !result.violations.some((violation) => violation.id === entry.rule))
            problems.push(
              `已知清单过期：${entry.page} ${entry.rule} 已经没有了，把这条从 ui-gallery-a11y-known.json 删掉`,
            )
        expect(problems).toEqual([])
        expect(errors).toEqual([])
      } finally {
        page.off('pageerror', onError)
        page.off('console', onConsole)
      }
    })
  }
}

// 文档站外壳：整页扫（侧栏、页头、属性表、说明文字）。挑三类页：组件页、基础页、组合页，两个主题。
for (const theme of THEMES)
  for (const id of ['input', 'color', 'data-grid'])
    base(`文档站外壳 ${id}（${theme}）：整页 axe 无违规`, async ({ page }) => {
      // 预览区已由上面逐页的用例扫过，这里只扫外壳（侧栏、页头、属性表、说明）：data-grid 这类大预览区重复扫一遍要 30 秒上下（run 45399485013，重跑也超）。
      // 排除后沙箱里 5–12 秒，color 页最慢；CI 上四个并行时留余量，超时给 3 倍（90 秒），不再给 120 秒。
      base.slow()
      await page.goto(`/?theme=${theme}#/${id}`)
      await page.locator('.gal-page-body').waitFor()
      await settle(page)
      const result = await new AxeBuilder({ page }).withTags(TAGS).exclude('[data-gallery]').analyze()
      const entries = knownList.filter((entry) => entry.page === id && (entry.theme ?? theme) === theme)
      const problems = result.violations
        .filter((violation) => !entries.some((entry) => entry.rule === violation.id))
        .flatMap((violation) => violation.nodes.map((node) => `${violation.id} ${node.target.join(' >> ')}`))
      expect(problems).toEqual([])
    })
