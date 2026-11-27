// SPDX-License-Identifier: MIT
import { expect, test, type Locator, type Page } from '@playwright/test'

// 交易输入框的输入法保护（#208）：组字中的 Enter（选字）、Esc（取消候选词）、上下键（选候选）不是「提交 / 取消 / 改价」。
// 真键盘敲不出组字事件，这里用合成的 keydown，两种情形各跑一遍，各自只给一半证据，证明两半判断都起作用：
//   - isComposing：只有 isComposing 为 true，keyCode 是这个键本来的值（Chrome / Firefox 组字中的样子去掉 229 后剩下的那一半）
//   - keyCode229：isComposing 为 false，只有 keyCode 为 229（Safari 上屏那一下）
// 再用真按键确认正常路径照旧。返回值是 defaultPrevented：被组件当成「提交 / 取消 / 改价」会为 true。
// 修的是 orders-table 改价框、replay-transport 的跳转与跳 tick 框、decimal-field 的上下键与调用方 onKeyDown、whiteboard 便签的 Esc。

test.use({ viewport: { width: 1200, height: 1400 } })

const open = async (page: Page, id: string) => {
  await page.goto(`/?theme=graphite#/${id}`)
  const area = page.locator(`[data-gallery="${id}"]`)
  await area.waitFor()
  return area
}

type Ime = 'isComposing' | 'keyCode229'

const KEY_CODE: Record<string, number> = { Enter: 13, Escape: 27, ArrowUp: 38, ArrowDown: 40 }

const imeKey = (field: Locator, key: string, ime: Ime) =>
  field.evaluate(
    (el, args) => {
      const event = new KeyboardEvent('keydown', {
        key: args.key,
        bubbles: true,
        cancelable: true,
        isComposing: args.ime === 'isComposing',
      })
      Object.defineProperty(event, 'keyCode', { value: args.ime === 'keyCode229' ? 229 : args.code })
      el.dispatchEvent(event)
      return event.defaultPrevented
    },
    { key, ime, code: KEY_CODE[key] ?? 0 },
  )

const IMES: readonly Ime[] = ['isComposing', 'keyCode229']

// 每个用例按两种情形各跑一条：失败时一眼看出是哪一半判断没起作用。
for (const ime of IMES) {
  test(`OrdersTable 改价框 [${ime}]：组字中 Enter 不提交、Esc 不取消也不外传；组字结束后 Enter 提交、Esc 取消`, async ({
    page,
  }) => {
    const area = await open(page, 'orders-table')
    const table = area.locator('[data-slot="orders-table"]').first()
    const row = table.locator('[data-order="o-1001"]')
    const last = area.getByTestId('ord-last')
    // 外层（document）能不能看到 Esc：组字中的 Esc 不该冒泡出去（React 层 stopPropagation 后到不了 document）。
    await page.evaluate(() => {
      ;(window as unknown as { escSeen: number }).escSeen = 0
      document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') (window as unknown as { escSeen: number }).escSeen++
      })
    })
    await row.locator('button[data-action="amend"]').click()
    const input = row.getByRole('textbox')
    await expect(input).toBeFocused()
    await input.fill('63900.5')
    expect(await imeKey(input, 'Enter', ime)).toBe(false)
    expect(await imeKey(input, 'Escape', ime)).toBe(false)
    expect(await page.evaluate(() => (window as unknown as { escSeen: number }).escSeen)).toBe(0)
    // 框还在、字还在、没有回调。
    await expect(input).toBeVisible()
    await expect(input).toHaveValue('63900.5')
    await expect(last).not.toContainText('改价')
    // 组字结束后的真 Enter 才提交。
    await input.press('Enter')
    await expect(last).toContainText('改价 o-1001 → 63900.5')
    await expect(row.getByRole('textbox')).toHaveCount(0)

    // 同理 Esc：组字中不取消，组字结束后取消。
    await row.locator('button[data-action="amend"]').click()
    const again = row.getByRole('textbox')
    await again.fill('64000')
    expect(await imeKey(again, 'Escape', ime)).toBe(false)
    await expect(again).toBeVisible()
    await again.press('Escape')
    await expect(row.getByRole('textbox')).toHaveCount(0)
    await expect(last).toContainText('改价 o-1001 → 63900.5')
  })

  test(`ReplayTransport 跳转与跳 tick 框 [${ime}]：组字中 Enter 不提交，真 Enter 提交`, async ({ page }) => {
    const area = await open(page, 'replay-transport')
    const transport = area.locator('[data-slot="replay-transport"]').first()
    const jump = transport.getByRole('textbox', { name: '跳到时刻' })
    await jump.fill('不是时刻')
    expect(await imeKey(jump, 'Enter', ime)).toBe(false)
    // 提交了的话，格式不对会出提示。
    await expect(transport.getByRole('alert')).toHaveCount(0)
    await jump.press('Enter')
    await expect(transport.getByRole('alert')).toContainText('时刻格式不对')

    // 跳 tick 框：组字中的 Enter 同样不触发（合成事件没被 preventDefault 即没走提交）。
    const skip = transport.getByRole('textbox', { name: '跳过 tick 数' })
    await skip.fill('5')
    expect(await imeKey(skip, 'Enter', ime)).toBe(false)
    await expect(skip).toHaveValue('5')
  })

  test(`DecimalField [${ime}]：组字中的上下键不改价，也不传给调用方的 onKeyDown；真键照旧`, async ({ page }) => {
    const area = await open(page, 'decimal-field')
    const price = area.getByRole('textbox', { name: '价格', exact: true })
    await price.focus()
    const before = await price.inputValue()
    expect(await imeKey(price, 'ArrowUp', ime)).toBe(false)
    expect(await imeKey(price, 'ArrowDown', ime)).toBe(false)
    await expect(price).toHaveValue(before)
    await page.keyboard.press('ArrowUp')
    await expect(price).not.toHaveValue(before)

    // 调用方在框上自己接 Enter 下单：组字中的 Enter 到不了它，真 Enter 才到。
    const entry = area.getByRole('textbox', { name: '回车下单价' })
    const placed = area.getByTestId('decimal-placed-out')
    await expect(placed).toHaveText('0')
    await imeKey(entry, 'Enter', ime)
    await expect(placed).toHaveText('0')
    await entry.focus()
    await entry.press('Enter')
    await expect(placed).toHaveText('1')
  })

  test(`Whiteboard 便签 [${ime}]：组字中的 Esc 不收起编辑，真 Esc 收起`, async ({ page }) => {
    await page.goto('/?theme=graphite#/whiteboard')
    const area = page.locator('[data-gallery="whiteboard"]')
    await area.waitFor()
    const note = area.getByTestId('wb-frame').getByTestId('wb').getByTestId('rf__node-memo')
    await note.locator('.k-wb-note-text').dblclick()
    const edit = note.locator('textarea')
    await expect(edit).toBeFocused()
    expect(await imeKey(edit, 'Escape', ime)).toBe(false)
    await expect(edit).toBeVisible()
    await edit.press('Escape')
    await expect(edit).toHaveCount(0)
  })
}
