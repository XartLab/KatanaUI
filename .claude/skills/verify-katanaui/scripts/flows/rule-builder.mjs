// SPDX-License-Identifier: MIT
// 功能地图 features/rule-builder.md：条件树的样子与回读、切 And / Or、同组换序（Alt+↑↓ 与拖动，跨组不落）、校验、动作与撤销、动作多参数、点状态栏跳到第一个问题、含锁定条件的组删不掉、换一份规则。
export default {
  title: 'RuleBuilder 规则构建器：建树、切组合、同组换序、校验、动作与撤销',
  page: 'rule-builder',
  async run({ page, section, step, expect, aria }) {
    // 页上有两份：「选股告警」那份（预览与用法各渲一次，取预览里第一份）与「校验」那份。
    const main = section.locator('[data-gallery-rule="main"]').first()
    const broken = section.locator('[data-gallery-rule="broken"]')
    const swap = section.locator('[data-gallery-rule="switch"]')
    const json = async () => JSON.parse(await main.locator('[data-gallery-rule-json]').textContent())
    const order = (id) => main.locator(`[data-list="${id}"]`).evaluate((ul) => [...ul.children].map((li) => li.querySelector('[data-id]')?.getAttribute('data-id')))
    const handle = (id) => main.locator(`[data-id="${id}"] [data-part="handle"]`)
    const readback = async () => (await main.locator('[data-slot="rule-text"]').textContent()).trim()
    const live = () => main.locator('[data-slot="rule-live"]')

    await step('打开页：锁定条件、一条、一组，连线上两个 And / Or，顶行回读整棵规则', async () => {
      await expect(main.locator('[data-id="market"]').getByRole('img', { name: 'Locked' })).toBeVisible()
      await expect(main.locator('[data-id="market"] [data-slot="rule-remove"]')).toHaveCount(0)
      await expect(main.locator('[data-list="root"] + [data-slot="rule-mode"]')).toHaveText('And')
      await expect(main.locator('[data-list="liquidity"] + [data-slot="rule-mode"]')).toHaveText('Or')
      await aria(main, 'rule-builder-default.aria.yml')
      return { root: await order('root'), group: await order('liquidity'), readback: await readback() }
    })
    await step('点嵌套组的「Or」：变 And，回读与 JSON 一起变', async () => {
      await main.locator('[data-list="liquidity"] + [data-slot="rule-mode"]').click()
      await expect(main.locator('[data-list="liquidity"] + [data-slot="rule-mode"]')).toHaveText('And')
      await expect(live()).toHaveText('Group now combines with And')
      const rule = await json()
      expect(rule.when.children[3].mode).toBe('and')
      expect(await readback()).toContain('(Turnover > 500 M and Turnover rate > 3%)')
      return { mode: rule.when.children[3].mode, readback: await readback() }
    })
    await step('焦点在「Turnover」的把手上按 Alt+↓：在组里换到第二；再按 Alt+↓ 不动，不跑出组', async () => {
      await handle('turnover').focus()
      await page.keyboard.press('Alt+ArrowDown')
      expect(await order('liquidity')).toEqual(['rate', 'turnover'])
      await expect(handle('turnover')).toBeFocused()
      await expect(live()).toHaveText('Moved Turnover > 500 M to position 2 of 2')
      await page.keyboard.press('Alt+ArrowDown')
      expect(await order('liquidity')).toEqual(['rate', 'turnover'])
      expect(await order('root')).toEqual(['market', 'sector', 'cross', 'liquidity'])
      return { group: await order('liquidity'), root: await order('root') }
    })
    await step('拖「Turnover rate」的把手到组外的 Sector 行上：整件变「不落」，松手后什么都没变', async () => {
      const before = JSON.stringify(await json())
      const from = await handle('rate').boundingBox()
      const target = await main.locator('[data-id="sector"]').boundingBox()
      await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2)
      await page.mouse.down()
      await page.mouse.move(from.x + from.width / 2, from.y - 8, { steps: 3 })
      await page.mouse.move(from.x + from.width / 2, target.y + target.height / 2, { steps: 10 })
      await expect(main.locator('[data-slot="rule-builder"]').first()).toHaveAttribute('data-drag', 'blocked')
      await page.mouse.up()
      expect(JSON.stringify(await json())).toBe(before)
      return { group: await order('liquidity'), root: await order('root') }
    })
    await step('把「Turnover」的把手拖到同组「Turnover rate」上面：换序，落点线先出现', async () => {
      const from = await handle('turnover').boundingBox()
      const target = await main.locator('[data-id="rate"]').boundingBox()
      await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2)
      await page.mouse.down()
      await page.mouse.move(from.x + from.width / 2, from.y + 6, { steps: 3 })
      await page.mouse.move(from.x + from.width / 2, target.y + 2, { steps: 10 })
      await expect(main.locator('[data-list="liquidity"] > li').nth(0)).toHaveAttribute('data-drop', 'before')
      await page.mouse.up()
      expect(await order('liquidity')).toEqual(['turnover', 'rate'])
      return { group: await order('liquidity') }
    })
    await step('「Turnover rate」填 130：这一行红框，原因接到输入框，顶行写「1 issue」；改回 3 恢复', async () => {
      const row = main.locator('[data-id="rate"]')
      const input = row.locator('input[data-part="value"]')
      await input.fill('130')
      await expect(row).toHaveAttribute('data-invalid', '')
      await expect(input).toHaveAttribute('aria-invalid', 'true')
      const reason = await page.locator(`[id="${await input.getAttribute('aria-describedby')}"]`).textContent()
      expect(reason).toBe('Must be between 0 and 100')
      await expect(main.locator('[data-slot="rule-status"]')).toHaveText('1 issue')
      await input.fill('3')
      await expect(main.locator('[data-slot="rule-status"]')).toHaveText('Ready')
      return { reason }
    })
    await step('「校验」那份：顶行 6 issues（按钮），每个出错的行下面写原因；点它，焦点到第一个出错的格子', async () => {
      await expect(broken.locator('[data-slot="rule-status"]')).toHaveText('6 issues')
      await aria(broken, 'rule-builder-broken.aria.yml')
      const lines = await broken.locator('[data-slot="rule-issue"]').allInnerTexts()
      await broken.getByRole('button', { name: /6 issues: show all/ }).click()
      await expect(broken.locator('[data-id="rate"] input[data-part="value"]')).toBeFocused()
      return lines
    })
    await step('下单草稿的三个参数：数量填 500 只有数量红；改成 Sell、25 后 JSON 与回读都对', async () => {
      const draft = main.locator('[data-id="draft"]')
      const box = (key) => draft.locator(`[data-part="param"][data-key="${key}"]`)
      await box('quantity').fill('500')
      await expect(box('quantity')).toHaveAttribute('aria-invalid', 'true')
      await expect(box('side')).not.toHaveAttribute('aria-invalid')
      await box('side').click()
      await page.getByRole('option', { name: 'Sell' }).click()
      await box('quantity').fill('25')
      const rule = await json()
      expect(rule.ifTrue[1].params).toEqual({ side: 'sell', quantity: 25, price: 'limit' })
      expect(await readback()).toContain('Draft order Sell 25 lots at Limit')
      return rule.ifTrue[1]
    })
    await step('Alt+↓ 落在「Sector」的字段下拉上：整行下挪，下拉不打开', async () => {
      await main.locator('[data-id="sector"] [data-part="field"]').focus()
      await page.keyboard.press('Alt+ArrowDown')
      expect(await order('root')).toEqual(['market', 'cross', 'sector', 'liquidity'])
      await expect(page.getByRole('listbox')).toHaveCount(0)
      await page.keyboard.press('Alt+ArrowUp')
      expect(await order('root')).toEqual(['market', 'sector', 'cross', 'liquidity'])
      return { root: await order('root') }
    })
    await step('「换一份规则」那份：含锁定条件的组删不掉（按钮禁用、Delete 不动并播报）；加一个新组可以删', async () => {
      const head = swap.locator('.k-rb-grouphead[data-id="guard"]')
      await expect(head.locator('[data-slot="rule-remove"]')).toHaveAttribute('aria-disabled', 'true')
      await head.locator('[data-slot="rule-remove"]').click({ force: true })
      await head.locator('[data-part="handle"]').focus()
      await page.keyboard.press('Delete')
      await expect(swap.locator('[data-list="guard"]')).toHaveCount(1)
      const said = await swap.locator('[data-slot="rule-live"]').textContent()
      await swap.locator('[data-add="root"]').getByRole('button', { name: 'Add group' }).click()
      await swap.locator('.k-rb-grouphead').last().locator('[data-slot="rule-remove"]').click()
      await expect(swap.locator('.k-rb-grouphead')).toHaveCount(1)
      return said
    })
    await step('在规则 A 里改 rate、撤销一步，点 Load rule B：rate 的 130 不红，撤销与重做都禁用', async () => {
      const input = swap.locator('[data-id="rate"] input[data-part="value"]')
      await input.fill('7')
      await swap.locator('[data-id="rate"] [data-part="handle"]').focus()
      await page.keyboard.press('Control+z')
      await swap.locator('[data-switch="b"]').click()
      await expect(input).toHaveValue('130')
      await expect(swap.locator('[data-id="rate"]')).not.toHaveAttribute('data-invalid', '')
      await expect(swap.locator('[data-slot="rule-undo"]')).toBeDisabled()
      await expect(swap.locator('[data-slot="rule-redo"]')).toBeDisabled()
      return { status: await swap.locator('[data-slot="rule-status"]').textContent() }
    })
    await step('若为真、若为假各加一个动作：JSON 里 ifTrue 与 ifFalse 各多一个；撤销两次回到加动作之前', async () => {
      const initial = await json()
      await main.locator('[data-add="ifTrue"]').getByRole('button', { name: 'Add action' }).click()
      await main.locator('[data-add="ifFalse"]').getByRole('button', { name: 'Add action' }).click()
      const rule = await json()
      expect(rule.ifTrue.length).toBe(initial.ifTrue.length + 1)
      expect(rule.ifFalse.length).toBe(initial.ifFalse.length + 1)
      await main.locator('[data-slot="rule-undo"]').click()
      await main.locator('[data-slot="rule-undo"]').click()
      // 撤销两次：回到两个动作都没加的时候（前面切 Or、换序、改数字的改动还在）。
      expect((await json()).ifTrue.length).toBe(initial.ifTrue.length)
      return { ifTrue: rule.ifTrue.length, ifFalse: rule.ifFalse.length }
    })
  },
}
