// SPDX-License-Identifier: MIT
// 功能地图 features/research-calendar.md 的「模板库」：搜索过滤并高亮、键盘走树、就地编辑保存与取消、复制、使用回调带 id。
export default {
  title: '模板库：搜索、键盘走树、就地编辑、复制、使用',
  page: 'template-library',
  async run({ page, section, step, expect, aria }) {
    const tree = section.getByRole('treegrid', { name: '模板' })
    const search = section.getByRole('searchbox', { name: '搜索模板' })
    const log = section.locator('[data-gallery-template-log]')

    await step('打开页：默认选中「动量策略」，右边是它的标题、元信息与正文', async () => {
      await expect(section.getByRole('heading', { name: '动量策略' })).toBeVisible()
      await expect(section.getByRole('button', { name: /^模板正文/ })).toContainText('标的池：沪深 300')
      await aria(section, 'template-library.aria.yml')
      return { rows: await tree.getByRole('row').count() }
    })
    await step('搜索「周频」：树只剩「我的模板 → 动量策略 → 动量策略 · 周频」，命中的字高亮，播报 1 个匹配', async () => {
      await search.fill('周频')
      await expect(tree.getByRole('row')).toHaveCount(3)
      await expect(tree.locator('mark')).toHaveText('周频')
      await expect(section.locator('.k-tpl-side [role="status"]')).toHaveText('1 个模板匹配')
      return { rows: await tree.getByRole('row').allInnerTexts() }
    })
    await step('搜「zzz」：写「没有匹配的模板」；Esc 清空搜索', async () => {
      await search.fill('zzz')
      await expect(section.getByText('没有匹配的模板')).toBeVisible()
      await search.press('Escape')
      await expect(search).toHaveValue('')
      return { value: await search.inputValue() }
    })
    await step('键盘：焦点在「动量策略」行，→ 展开、← 收起', async () => {
      const parent = tree.getByRole('row', { name: '动量策略', exact: true })
      await parent.focus()
      await expect(parent).toHaveAttribute('aria-expanded', 'false')
      await page.keyboard.press('ArrowRight')
      await expect(parent).toHaveAttribute('aria-expanded', 'true')
      await page.keyboard.press('ArrowLeft')
      await expect(parent).toHaveAttribute('aria-expanded', 'false')
      return { expanded: await parent.getAttribute('aria-expanded') }
    })
    await step('选「均值回归」（内置）：详情换了，正文不可编辑', async () => {
      const row = tree.getByRole('row', { name: '均值回归' })
      await row.focus()
      await page.keyboard.press('Enter')
      await expect(section.getByRole('heading', { name: '均值回归' })).toBeVisible()
      await expect(section.getByRole('button', { name: /^模板正文/ })).toHaveCount(0)
      return { selected: await row.getAttribute('aria-selected') }
    })
    await step('回到「动量策略」，点正文：Esc 取消，改的字退回', async () => {
      await tree.getByRole('row', { name: '动量策略', exact: true }).click()
      await section.getByRole('button', { name: /^模板正文/ }).click()
      await section.getByRole('textbox', { name: '模板正文' }).fill('临时改动')
      await page.keyboard.press('Escape')
      await expect(section.getByRole('button', { name: /^模板正文/ })).toContainText('标的池：沪深 300')
      return { log: await log.innerText() }
    })
    await step('再点正文：Ctrl+Enter 保存，回调带 id 与字段，正文换成新字', async () => {
      await section.getByRole('button', { name: /^模板正文/ }).click()
      const field = section.getByRole('textbox', { name: '模板正文' })
      await field.fill('改过的正文')
      await field.press('Control+Enter')
      await expect(log).toContainText('保存 my-momentum：正文')
      await expect(section.getByRole('button', { name: /^模板正文/ })).toContainText('改过的正文')
      return { log: await log.innerText() }
    })
    await step('点「使用模板」「复制为我的模板」：回调带 id', async () => {
      await section.getByRole('button', { name: '使用模板' }).click()
      await expect(log).toContainText('使用模板 my-momentum')
      await section.getByRole('button', { name: '复制为我的模板' }).click()
      await expect(log).toContainText('复制为我的模板 my-momentum')
      return { log: await log.innerText() }
    })
  },
}
