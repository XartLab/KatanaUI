// SPDX-License-Identifier: MIT
import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Locator, type Page } from '@playwright/test'

// TagCombobox（#193）在文档站 #/tag-combobox 页上真点真按：对着票的六条判据逐条断言（点开、点选、过滤高亮、退格两次删、换行弹层下移、axe）。
// 演示数据（gallery/pages/tag-combobox.tsx）：评审人字段默认选了 Aisha Khan、Elena Petrova，候选 16 人，每人带头像缩写与角色。

test.use({ viewport: { width: 1100, height: 1500 } })

const open = async (page: Page, theme: 'graphite' | 'console' = 'graphite') => {
  await page.goto(`/?theme=${theme}#/tag-combobox`)
  const area = page.locator('[data-gallery="tag-combobox"]')
  await area.waitFor()
  const field = area.getByRole('combobox', { name: '评审人', exact: true })
  const tags = area.locator('[data-slot="tag-combobox"]').first().locator('.k-tagcb-tag')
  return { area, field, tags }
}
const listbox = (page: Page) => page.getByRole('listbox', { name: '评审人', exact: true })
const option = (page: Page, name: string) => listbox(page).getByRole('option', { name: new RegExp(`^${name}`) })
const tagNames = async (tags: Locator) => (await tags.locator('.k-tagcb-tag-text').allInnerTexts()).map((t) => t.trim())

test('TagCombobox（#/tag-combobox）1：点字段，列表开，光标在框里', async ({ page }) => {
  const { field } = await open(page)
  await expect(field).toHaveAttribute('aria-expanded', 'false')
  await expect(listbox(page)).toHaveCount(0)
  // 点框里的空白处（不是输入框本身）也要开、并把焦点给输入框。
  const box = (await field.locator('xpath=..').boundingBox())!
  await page.mouse.click(box.x + box.width - 60, box.y + 6)
  await expect(field).toBeFocused()
  await expect(field).toHaveAttribute('aria-expanded', 'true')
  await expect(listbox(page)).toBeVisible()
  await expect(listbox(page)).toHaveAttribute('aria-multiselectable', 'true')
  // 开着的时候输入框指向列表与高亮行。
  const controls = await field.getAttribute('aria-controls')
  await expect(page.locator(`[id="${controls}"]`)).toHaveAttribute('role', 'listbox')
  const active = await field.getAttribute('aria-activedescendant')
  await expect(page.locator(`[id="${active}"]`)).toHaveAttribute('role', 'option')
})

test('TagCombobox（#/tag-combobox）2：点两项，两个标签进框，两行有勾，列表仍开', async ({ page }) => {
  const { area, field, tags } = await open(page)
  await field.click()
  await expect(tags).toHaveCount(2)
  await option(page, 'Ben Carter').click()
  await option(page, 'Hiro Tanaka').click()
  await expect(tags).toHaveCount(4)
  expect(await tagNames(tags)).toEqual(['Aisha Khan', 'Elena Petrova', 'Ben Carter', 'Hiro Tanaka'])
  await expect(option(page, 'Ben Carter')).toHaveAttribute('aria-selected', 'true')
  await expect(option(page, 'Hiro Tanaka')).toHaveAttribute('aria-selected', 'true')
  await expect(option(page, 'Ana Panto')).toHaveAttribute('aria-selected', 'false')
  await expect(option(page, 'Ben Carter').locator('.k-tagcb-check svg')).toHaveCount(1)
  await expect(listbox(page)).toBeVisible()
  await expect(field).toBeFocused()
  await expect(field).toHaveValue('')
  await expect(area.getByTestId('tag-combobox-value')).toHaveText(
    '4 人：aisha-khan elena-petrova ben-carter hiro-tanaka',
  )
  // 点标签上的 ×：移除，列表不变，焦点仍在输入框。
  await area.getByRole('button', { name: '移除 Ben Carter' }).click()
  await expect(tags).toHaveCount(3)
  await expect(option(page, 'Ben Carter')).toHaveAttribute('aria-selected', 'false')
  await expect(field).toBeFocused()
})

test('TagCombobox（#/tag-combobox）3：打 an，只剩含 an 的行，命中的字加强', async ({ page }) => {
  const { field } = await open(page)
  await field.click()
  await field.pressSequentially('an')
  const rows = listbox(page).getByRole('option')
  const texts = (await rows.allInnerTexts()).map((t) => t.replace(/\s+/g, ' ').toLowerCase())
  expect(texts.length).toBeGreaterThan(0)
  expect(texts.length).toBeLessThan(16)
  for (const text of texts) expect(text).toContain('an')
  const hits = listbox(page).locator('[data-hit]')
  expect(await hits.count()).toBeGreaterThan(0)
  for (const hit of await hits.all()) expect((await hit.innerText()).toLowerCase()).toBe('an')
  // 命中的字比同一行的其余字粗。
  const weight = (el: Locator) => el.evaluate((node) => Number.parseInt(getComputedStyle(node).fontWeight, 10))
  const label = rows.first().locator('.k-tagcb-label')
  expect(await weight(hits.first())).toBeGreaterThan(await weight(label))
  // 搜不到的词：列表换成「没有匹配」，输入框不再指向列表。
  await field.fill('zzzz')
  await expect(page.getByRole('status').filter({ hasText: '没有匹配的人' })).toBeVisible()
  await expect(listbox(page)).toHaveCount(0)
  await expect(field).not.toHaveAttribute('aria-controls', /.+/)
})

test('TagCombobox（#/tag-combobox）4：输入空时退格，最后标签先高亮、再按才删，行上的勾消失', async ({ page }) => {
  const { field, tags } = await open(page)
  await field.click()
  await expect(option(page, 'Elena Petrova')).toHaveAttribute('aria-selected', 'true')
  await field.pressSequentially('an')
  await field.fill('')
  await page.keyboard.press('Backspace')
  await expect(tags.last()).toHaveAttribute('data-picked', '')
  await expect(tags).toHaveCount(2)
  await page.keyboard.press('Backspace')
  await expect(tags).toHaveCount(1)
  expect(await tagNames(tags)).toEqual(['Aisha Khan'])
  await expect(option(page, 'Elena Petrova')).toHaveAttribute('aria-selected', 'false')
  await expect(field).toBeFocused()
  // ← 选中标签、→ 回输入框、Delete 删选中的。
  await page.keyboard.press('ArrowLeft')
  await expect(tags.first()).toHaveAttribute('data-picked', '')
  await page.keyboard.press('ArrowRight')
  await expect(tags.first()).not.toHaveAttribute('data-picked', '')
  await page.keyboard.press('ArrowLeft')
  await page.keyboard.press('Delete')
  await expect(tags).toHaveCount(0)
})

test('TagCombobox（#/tag-combobox）5：标签多到换行，字段长高，弹层跟着下移不遮字段', async ({ page }) => {
  const { field, tags } = await open(page)
  await field.click()
  const fieldBox = field.locator('xpath=..')
  const before = (await fieldBox.boundingBox())!
  const popup = page.locator('[data-slot="popover-content"]')
  const popupTop = async () => (await popup.boundingBox())!.y
  const topBefore = await popupTop()
  // 一个个选，直到换成两行以上。
  for (const name of [
    'Ben Carter',
    'Camille Girard',
    'Chloe Martin',
    'Daniel Foster',
    'Elif Demir',
    'Fatima Al-Sayed',
  ]) {
    await option(page, name).click()
  }
  await expect(tags).toHaveCount(8)
  const after = (await fieldBox.boundingBox())!
  expect(after.height).toBeGreaterThan(before.height + 10)
  await expect(listbox(page)).toBeVisible()
  // 弹层的上沿在字段的下沿之下（不压住字段），并且比字段没长高时更靠下。
  await expect.poll(async () => (await popupTop()) >= after.y + after.height - 1).toBe(true)
  expect(await popupTop()).toBeGreaterThan(topBefore)
})

test('TagCombobox（#/tag-combobox）：键盘 ↓ Enter 选、Esc 收，高亮行在超高的列表里滚进视野', async ({ page }) => {
  const { field, tags } = await open(page)
  await field.focus()
  // 只靠 Tab 或聚焦不开列表；↓ 才开。
  await expect(field).toHaveAttribute('aria-expanded', 'false')
  await page.keyboard.press('ArrowDown')
  await expect(field).toHaveAttribute('aria-expanded', 'true')
  const first = option(page, 'Aisha Khan')
  await expect(first).toHaveAttribute('data-active', '')
  await page.keyboard.press('ArrowDown')
  await expect(option(page, 'Amara Okafor')).toHaveAttribute('data-active', '')
  await page.keyboard.press('Enter')
  await expect(option(page, 'Amara Okafor')).toHaveAttribute('aria-selected', 'true')
  await expect(tags).toHaveCount(3)
  await expect(listbox(page)).toBeVisible()
  await expect(field).toHaveValue('')
  // 一路往下，高亮行始终在列表的可见范围里（列表 280 高，16 行放不下）。
  for (let step = 0; step < 12; step += 1) {
    await page.keyboard.press('ArrowDown')
    const inView = await page.evaluate(() => {
      const list = document.querySelector('[role="listbox"]')!
      const row = list.querySelector('[data-active]')!.getBoundingClientRect()
      const box = list.getBoundingClientRect()
      return row.top >= box.top - 1 && row.bottom <= box.bottom + 1
    })
    expect(inView).toBe(true)
  }
  expect(await listbox(page).evaluate((el) => el.scrollTop)).toBeGreaterThan(0)
  // ↑ 在首项再往上是最后一项（首尾相接）。
  await page.keyboard.press('Escape')
  await expect(listbox(page)).toHaveCount(0)
  await expect(field).toBeFocused()
})

test('TagCombobox（#/tag-combobox）：输入法上屏的 Enter 与 Backspace（keyCode 229，isComposing 已为 false）不切换行、不选标签', async ({
  page,
}) => {
  const { field, tags } = await open(page)
  await field.click()
  await expect(tags).toHaveCount(2)
  // Safari：compositionend 先于 keydown，keydown 里 isComposing 是 false，只剩 keyCode 229。
  await field.evaluate((input) => {
    for (const key of ['Enter', 'Backspace'])
      input.dispatchEvent(new KeyboardEvent('keydown', { key, keyCode: 229, bubbles: true, cancelable: true }))
  })
  await expect(tags).toHaveCount(2)
  await expect(tags.last()).not.toHaveAttribute('data-picked', '')
  await expect(option(page, 'Aisha Khan')).toHaveAttribute('aria-selected', 'true')
})

test('TagCombobox（#/tag-combobox）：点列表的空白处（内边距、没有匹配的提示）焦点不离开输入框，键盘照常管用', async ({
  page,
}) => {
  const { field, tags } = await open(page)
  await field.click()
  const b = (await listbox(page).boundingBox())!
  await page.mouse.click(b.x + 2, b.y + 2)
  await expect(field).toBeFocused()
  await expect(field).toHaveAttribute('aria-expanded', 'true')
  await page.keyboard.press('ArrowDown')
  await page.keyboard.press('Enter')
  await expect(tags).toHaveCount(3)
  // 没有匹配时点那句提示。
  await field.fill('zzzz')
  await page.getByRole('status').filter({ hasText: '没有匹配的人' }).click()
  await expect(field).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(field).toHaveAttribute('aria-expanded', 'false')
})

test('TagCombobox（#/tag-combobox）：过滤后按 Enter 选中靠后的一项，输入清空、列表变全，高亮行滚进视野', async ({
  page,
}) => {
  const { field } = await open(page)
  await field.click()
  await field.pressSequentially('Jonas')
  await page.keyboard.press('Enter')
  await expect(field).toHaveValue('')
  await expect(option(page, 'Jonas Weber')).toHaveAttribute('aria-selected', 'true')
  await expect(option(page, 'Jonas Weber')).toHaveAttribute('data-active', '')
  await expect
    .poll(() =>
      page.evaluate(() => {
        const list = document.querySelector('[role="listbox"]')!
        const row = list.querySelector('[data-active]')!.getBoundingClientRect()
        const box = list.getBoundingClientRect()
        return row.top >= box.top - 1 && row.bottom <= box.bottom + 1
      }),
    )
    .toBe(true)
})

test('TagCombobox（#/tag-combobox）：放在 form 里，列表开着 Enter 不提交（没有匹配、正选着标签也一样），关着照常提交；Esc 只回调一次', async ({
  page,
}) => {
  const { area } = await open(page)
  const field = area.getByRole('combobox', { name: '表单里的策略', exact: true })
  const submits = area.getByTestId('tag-combobox-submits')
  const calls = area.getByTestId('tag-combobox-open-calls')
  await expect(submits).toHaveText('提交 0 次')
  await field.click()
  await expect(field).toHaveAttribute('aria-expanded', 'true')
  // 没有匹配：Enter 不提交。
  await field.pressSequentially('zzzz')
  await page.keyboard.press('Enter')
  await expect(submits).toHaveText('提交 0 次')
  await field.fill('')
  // 正选着标签：Enter 不提交，标签也不删。
  await page.keyboard.press('Backspace')
  await expect(area.locator('form [data-tag="momentum"]')).toHaveAttribute('data-picked', '')
  await page.keyboard.press('Enter')
  await expect(submits).toHaveText('提交 0 次')
  await expect(area.locator('form [data-tag="momentum"]')).toHaveCount(1)
  // 有行可选：Enter 切换，也不提交。
  await page.keyboard.press('ArrowRight')
  await page.keyboard.press('Enter')
  await expect(submits).toHaveText('提交 0 次')
  // Esc 收列表：onOpenChange 只收到一次 false（前面只开过一次）。
  await page.keyboard.press('Escape')
  await expect(field).toHaveAttribute('aria-expanded', 'false')
  await expect(calls).toHaveText('开关')
  // 列表关着：Enter 交给浏览器，表单提交。
  await page.keyboard.press('Enter')
  await expect(submits).toHaveText('提交 1 次')
})

for (const theme of ['graphite', 'console'] as const) {
  test(`TagCombobox（#/tag-combobox）6：列表打开、有高亮行与已选行时 axe（含 best-practice）无违规（${theme}）`, async ({
    browser,
  }) => {
    const context = await browser.newContext({ viewport: { width: 1100, height: 1500 } })
    const page = await context.newPage()
    const { field } = await open(page, theme)
    await field.click()
    await field.pressSequentially('a')
    await page.keyboard.press('ArrowDown')
    await expect(listbox(page)).toBeVisible()
    await page.evaluate(() =>
      Promise.all(
        document
          .getAnimations()
          .filter((animation) => animation.effect?.getComputedTiming().endTime !== Infinity)
          .map((animation) => animation.finished.catch(() => undefined)),
      ),
    )
    const result = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'])
      .include('[data-gallery="tag-combobox"]')
      .include('[data-slot="popover-content"]')
      .analyze()
    expect(
      result.violations.flatMap((v) => v.nodes.map((n) => `${v.id} ${n.target.join(' >> ')} ${n.failureSummary}`)),
    ).toEqual([])
    await context.close()
  })
}
