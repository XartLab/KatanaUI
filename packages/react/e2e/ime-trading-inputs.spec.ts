// SPDX-License-Identifier: MIT
import { expect, test, type Locator, type Page } from '@playwright/test'

// 交易输入框的输入法保护（#208）：组字中的 Enter（选字）、Esc（取消候选词）、上下键（选候选）不是「提交 / 取消 / 改价」。
// 真键盘敲不出组字事件，这里用合成的 keydown：
//   - 组字中：isComposing 为 true
//   - Safari 上屏那一下：isComposing 已是 false，keyCode 仍是 229
// 再用真按键确认正常路径照旧。返回值是 defaultPrevented：被组件当成「提交 / 取消 / 改价」会为 true。
// 修的是 orders-table 改价框、replay-transport 的跳转与跳 tick 框、decimal-field 的上下键、whiteboard 便签的 Esc。

test.use({ viewport: { width: 1200, height: 1400 } })

const open = async (page: Page, id: string) => {
  await page.goto(`/?theme=graphite#/${id}`)
  const area = page.locator(`[data-gallery="${id}"]`)
  await area.waitFor()
  return area
}

type Ime = 'composing' | 'safari-commit'

const imeKey = (field: Locator, key: string, ime: Ime) =>
  field.evaluate(
    (el, args) => {
      const event = new KeyboardEvent('keydown', {
        key: args.key,
        bubbles: true,
        cancelable: true,
        isComposing: args.ime === 'composing',
      })
      Object.defineProperty(event, 'keyCode', { value: 229 })
      el.dispatchEvent(event)
      return event.defaultPrevented
    },
    { key, ime },
  )

const IMES: readonly Ime[] = ['composing', 'safari-commit']

test('OrdersTable 改价框：组字中的 Enter 不提交、Esc 不取消；组字结束后 Enter 提交、Esc 取消', async ({ page }) => {
  const area = await open(page, 'orders-table')
  const table = area.locator('[data-slot="orders-table"]').first()
  const row = table.locator('[data-order="o-1001"]')
  const last = area.getByTestId('ord-last')
  await row.locator('button[data-action="amend"]').click()
  const input = row.getByRole('textbox')
  await expect(input).toBeFocused()
  await input.fill('63900.5')
  for (const ime of IMES) {
    expect(await imeKey(input, 'Enter', ime)).toBe(false)
    expect(await imeKey(input, 'Escape', ime)).toBe(false)
    // 框还在、字还在、没有回调。
    await expect(input).toBeVisible()
    await expect(input).toHaveValue('63900.5')
    await expect(last).not.toContainText('改价')
  }
  // 组字结束后的真 Enter 才提交。
  await input.press('Enter')
  await expect(last).toContainText('改价 o-1001 → 63900.5')
  await expect(row.getByRole('textbox')).toHaveCount(0)

  // 同理 Esc：组字中不取消，组字结束后取消。
  await row.locator('button[data-action="amend"]').click()
  const again = row.getByRole('textbox')
  await again.fill('64000')
  expect(await imeKey(again, 'Escape', 'composing')).toBe(false)
  await expect(again).toBeVisible()
  await again.press('Escape')
  await expect(row.getByRole('textbox')).toHaveCount(0)
  await expect(last).toContainText('改价 o-1001 → 63900.5')
})

test('ReplayTransport 跳转与跳 tick 框：组字中的 Enter 不提交，真 Enter 提交', async ({ page }) => {
  const area = await open(page, 'replay-transport')
  const transport = area.locator('[data-slot="replay-transport"]').first()
  const jump = transport.getByRole('textbox', { name: '跳到时刻' })
  await jump.fill('不是时刻')
  for (const ime of IMES) {
    expect(await imeKey(jump, 'Enter', ime)).toBe(false)
    // 提交了的话，格式不对会出提示。
    await expect(transport.getByRole('alert')).toHaveCount(0)
  }
  await jump.press('Enter')
  await expect(transport.getByRole('alert')).toContainText('时刻格式不对')

  // 跳 tick 框：组字中的 Enter 同样不触发（合成事件没被 preventDefault 即没走提交）。
  const skip = transport.getByRole('textbox', { name: '跳过 tick 数' })
  await skip.fill('5')
  for (const ime of IMES) expect(await imeKey(skip, 'Enter', ime)).toBe(false)
  expect(await skip.evaluate((el) => (el as HTMLInputElement).value)).toBe('5')
})

test('DecimalField：组字中的上下键不改价，真方向键照旧', async ({ page }) => {
  const area = await open(page, 'decimal-field')
  const price = area.getByRole('textbox', { name: '价格', exact: true })
  await price.focus()
  const before = await price.inputValue()
  for (const ime of IMES) {
    expect(await imeKey(price, 'ArrowUp', ime)).toBe(false)
    expect(await imeKey(price, 'ArrowDown', ime)).toBe(false)
    await expect(price).toHaveValue(before)
  }
  await page.keyboard.press('ArrowUp')
  await expect(price).not.toHaveValue(before)
})

test('Whiteboard 便签：组字中的 Esc 不收起编辑，真 Esc 收起', async ({ page }) => {
  await page.goto('/?theme=graphite#/whiteboard')
  const area = page.locator('[data-gallery="whiteboard"]')
  await area.waitFor()
  const note = area.getByTestId('wb-frame').getByTestId('wb').getByTestId('rf__node-memo')
  await note.locator('.k-wb-note-text').dblclick()
  const edit = note.locator('textarea')
  await expect(edit).toBeFocused()
  for (const ime of IMES) {
    expect(await imeKey(edit, 'Escape', ime)).toBe(false)
    await expect(edit).toBeVisible()
  }
  await edit.press('Escape')
  await expect(edit).toHaveCount(0)
})
