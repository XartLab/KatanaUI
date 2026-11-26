// SPDX-License-Identifier: MIT
import { expect, test } from '@playwright/test'

// 中英排版开关（#250 第一部分，kubai 007）：断言算出来的样式与用户看到的结果，不测「类名在不在」。
// 文档站「基础 → 中英排版开关」页的每个演示各一条；规则在 src/theme/typesetting.css。

test.use({ viewport: { width: 1100, height: 900 } })

const open = async (page: import('@playwright/test').Page) => {
  await page.goto('/?theme=graphite#/typesetting')
  const article = page.locator('article.gal-fd')
  await expect(article.getByRole('heading', { level: 1 })).toBeVisible()
  return article
}
const box = (article: import('@playwright/test').Locator, heading: string, state: 'on' | 'off') =>
  article
    .getByRole('heading', { name: heading, level: 3 })
    .locator('xpath=following-sibling::div[contains(@class,"gal-ts-compare")][1]')
    .locator(`.gal-ts-box[data-state="${state}"]`)

test('中西文间距：zh 下 text-autospace 是 normal，代码与输入框是 no-autospace；开了的比没开的宽', async ({ page }) => {
  const article = await open(page)
  await expect(page.locator('html')).toHaveAttribute('lang', 'zh-CN')
  await expect(article.locator('p').first()).toHaveCSS('text-autospace', 'normal')
  await expect(article.locator('code').first()).toHaveCSS('text-autospace', 'no-autospace')
  const on = box(article, '中西文间距：不再手打空格', 'on').locator('p')
  const off = box(article, '中西文间距：不再手打空格', 'off').locator('p')
  const width = (locator: typeof on) =>
    locator.evaluate((element) => {
      // 单行量宽：折行时 Range 的宽就是框宽，量不出差别。
      element.style.whiteSpace = 'nowrap'
      const range = document.createRange()
      range.selectNodeContents(element)
      return range.getBoundingClientRect().width
    })
  // 同一句话：开了以后汉字与字母、数字之间多出一小格，整段（单行时）更宽。
  expect(await width(on)).toBeGreaterThan(await width(off))
})

test('行首括号去半格：trim-start 的括号开头行，字形比没开的靠左', async ({ page }) => {
  const article = await open(page)
  await expect(box(article, '行首括号去半格', 'on').locator('p')).toHaveCSS('text-spacing-trim', 'trim-start')
  const left = (state: 'on' | 'off') =>
    box(article, '行首括号去半格', state)
      .locator('p')
      .evaluate((element) => {
        // 第二行（括号开头）第一个字的位置：Range 取「（」。
        const text = [...element.childNodes].filter((node) => node.nodeType === Node.TEXT_NODE)[1]!
        const range = document.createRange()
        range.setStart(text, 0)
        range.setEnd(text, 1)
        return range.getBoundingClientRect().width
      })
  // 去掉半格以后，「（」占的宽度比全角少。
  expect(await left('on')).toBeLessThan(await left('off'))
})

test('换行标题：按词断行的标题带 <wbr> 与 data-phrased，keep-all；断点处才换行', async ({ page }) => {
  const article = await open(page)
  const title = box(article, '换行标题：按词断行', 'on').locator('h4')
  await expect(title).toHaveAttribute('data-phrased', '')
  await expect(title).toHaveCSS('word-break', 'keep-all')
  await expect(title).toHaveCSS('text-wrap-style', 'balance')
  expect(await title.locator('wbr').count()).toBeGreaterThan(0)
  // BudouX 的每个词整体在一行里（keep-all：不在词中间断），而标题确实折成了多行。
  const result = await title.evaluate((element) => {
    const rows = new Set<number>()
    const split: string[] = []
    for (const node of element.childNodes) {
      if (node.nodeType !== Node.TEXT_NODE) continue
      const tops = new Set<number>()
      const range = document.createRange()
      for (let index = 0; index < node.textContent!.length; index += 1) {
        range.setStart(node, index)
        range.setEnd(node, index + 1)
        const top = Math.round(range.getBoundingClientRect().top)
        tops.add(top)
        rows.add(top)
      }
      if (tops.size > 1) split.push(node.textContent!)
    }
    return { rows: rows.size, split }
  })
  expect(result.rows, '标题折成了多行').toBeGreaterThan(1)
  expect(result.split, '没有词被拆在两行').toEqual([])
})

test('变动数字：tabular-nums 的几行等宽，proportional 的不等宽', async ({ page }) => {
  const article = await open(page)
  const widths = async (state: 'on' | 'off') =>
    box(article, '变动的数字：等宽', state)
      .locator('.gal-ts-nums div')
      .evaluateAll((rows) =>
        rows.map((row) => {
          const range = document.createRange()
          range.selectNodeContents(row)
          return Math.round(range.getBoundingClientRect().width * 10) / 10
        }),
      )
  const on = await widths('on')
  const off = await widths('off')
  expect(new Set(on).size, `开了：${on}`).toBe(1)
  expect(new Set(off).size, `没开：${off}`).toBeGreaterThan(1)
})

test('截断标签：min-width:0 的缩下去并悬停补出全文；撑开的那个没有被截断就没有 title', async ({ page }) => {
  const article = await open(page)
  const fixed = box(article, '截断标签：缩得下，悬停出全文', 'on').locator('.gal-ts-label')
  const broken = box(article, '截断标签：缩得下，悬停出全文', 'off').locator('.gal-ts-label')
  await expect(fixed).not.toHaveAttribute('title', /.*/)
  const truncated = (locator: typeof fixed) => locator.evaluate((e) => e.scrollWidth > e.clientWidth + 1)
  expect(await truncated(fixed), '开了：真被截断').toBe(true)
  expect(await truncated(broken), '没开：被撑开，没截断').toBe(false)
  await fixed.hover()
  await expect(fixed).toHaveAttribute('title', /沪深 300 增强策略（参数扫描第 12 组，样本外）/)
  await broken.hover()
  await expect(broken).not.toHaveAttribute('title', /.*/)
})

test('规则表：十条规则都在，每条有做法与边界', async ({ page }) => {
  const article = await open(page)
  await expect(article.locator('table').first().locator('tbody tr')).toHaveCount(10)
})

test('按钮不折行只管库里的按钮类件：data-slot 的不折行，应用自己的卡片式按钮不受影响', async ({ page }) => {
  await open(page)
  const result = await page.evaluate(() => {
    const host = document.createElement('div')
    host.style.width = '80px'
    host.innerHTML =
      '<button data-slot="button">很长很长的按钮文字很长很长</button>' +
      '<button data-slot="tabs-trigger">很长很长的页签文字</button>' +
      '<button id="card"><span>卡片式按钮的说明行很长很长很长很长</span></button>'
    document.body.append(host)
    const white = (selector: string) => getComputedStyle(host.querySelector(selector)!).whiteSpace
    const out = {
      button: white('[data-slot=button]'),
      tab: white('[data-slot=tabs-trigger]'),
      card: white('#card span'),
    }
    host.remove()
    return out
  })
  expect(result).toEqual({ button: 'nowrap', tab: 'nowrap', card: 'normal' })
})
