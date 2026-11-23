// SPDX-License-Identifier: MIT
// 功能地图 features/symbol-note.md：悬停预览、点击钉住、编辑后保存、存空就是删除、Esc 收起与放弃草稿。
export default {
  title: 'SymbolNote 品种备注：预览、钉住、编辑保存、存空删除、Esc',
  page: 'symbol-note',
  async run({ page, section, step, expect, aria }) {
    const list = section.getByRole('list', { name: '示例自选', exact: true })
    const row = (symbol) => list.getByRole('listitem').filter({ hasText: symbol })
    // 有备注时图标叫「备注」，没有时叫「添加备注」。
    const icon = (symbol, name = '备注') => row(symbol).getByRole('button', { name, exact: true })
    // 浮层关着时是 display:none，不在无障碍树里：用 data-slot 找，开没开看 :popover-open。
    const popup = (symbol) => row(symbol).locator('[data-slot="symbol-note-popup"]')
    const isOpen = (symbol) => popup(symbol).evaluate((el) => el.matches(':popover-open'))
    const state = (symbol) => row(symbol).locator('[data-slot="symbol-note"]').getAttribute('data-state')
    const noteText = (symbol) => popup(symbol).locator('[data-slot="symbol-note-text"]')
    const field = (symbol) => popup(symbol).getByRole('textbox', { name: '备注', exact: true })
    const selected = section.getByTestId('symbol-note-selected')
    const saved = section.getByTestId('symbol-note-saved')
    const away = () => saved.hover()
    const focused = () =>
      page.evaluate(() => {
        const el = document.activeElement
        return el
          ? `${el.tagName.toLowerCase()}「${el.getAttribute('aria-label') ?? (el.textContent ?? '').trim()}」`
          : null
      })

    await step('指针停在 AAPL 的便签图标上：200ms 后出预览，全文两行', async () => {
      await icon('AAPL').hover()
      await expect.poll(() => isOpen('AAPL')).toBe(true)
      await expect(popup('AAPL')).toBeVisible()
      await expect(noteText('AAPL')).toHaveText('财报 11-28 盘后。\n守 220 不破就拿着，破了减半。')
      await expect(icon('AAPL')).toHaveAttribute('aria-expanded', 'true')
      expect(await state('AAPL')).toBe('preview')
      await aria(popup('AAPL'), 'symbol-note-preview.aria.yml')
      return { state: await state('AAPL'), text: await noteText('AAPL').textContent() }
    })
    await step('指针移开到页上的说明字：预览收起', async () => {
      await away()
      await expect.poll(() => isOpen('AAPL')).toBe(false)
      await expect(icon('AAPL')).toHaveAttribute('aria-expanded', 'false')
      return { state: await state('AAPL'), open: await isOpen('AAPL') }
    })
    await step('点 BTCUSDT 的图标：钉住，行没被选中，指针移开也不收', async () => {
      await icon('BTCUSDT').click()
      await expect.poll(() => isOpen('BTCUSDT')).toBe(true)
      expect(await state('BTCUSDT')).toBe('pinned')
      await expect(selected).toHaveText('AAPL')
      await away()
      // 证明「不收」只能等过收起的延时（150ms）再看：这里等 400ms。
      await page.waitForTimeout(400)
      expect(await isOpen('BTCUSDT')).toBe(true)
      return { state: await state('BTCUSDT'), selected: await selected.textContent(), open: await isOpen('BTCUSDT') }
    })
    await step('点「编辑」，补一句，Ctrl+Enter 保存：调用方收到新全文，浮层回到全文、焦点在「编辑」', async () => {
      await popup('BTCUSDT').getByRole('button', { name: '编辑', exact: true }).click()
      await expect(field('BTCUSDT')).toBeFocused()
      await expect(field('BTCUSDT')).toHaveValue('等回踩 95k 再看，别追。')
      await page.keyboard.type(' 跌破 90k 止损。')
      await page.keyboard.press('Control+Enter')
      await expect(saved).toHaveText('BTCUSDT：等回踩 95k 再看，别追。 跌破 90k 止损。')
      await expect(noteText('BTCUSDT')).toHaveText('等回踩 95k 再看，别追。 跌破 90k 止损。')
      await expect(popup('BTCUSDT').getByRole('button', { name: '编辑', exact: true })).toBeFocused()
      // 编辑框里打的空格没有冒泡到行上：选中的行还是 AAPL。
      await expect(selected).toHaveText('AAPL')
      return { saved: await saved.textContent(), focus: await focused() }
    })
    await step('按 Esc：浮层收起，焦点回到 BTCUSDT 的图标', async () => {
      await page.keyboard.press('Escape')
      await expect.poll(() => isOpen('BTCUSDT')).toBe(false)
      await expect(icon('BTCUSDT')).toBeFocused()
      return { open: await isOpen('BTCUSDT'), focus: await focused() }
    })
    await step('焦点在图标上按 Enter：键盘也能钉住；点「编辑」改一半按 Esc：草稿丢掉，回到原文', async () => {
      await page.keyboard.press('Enter')
      await expect.poll(() => isOpen('BTCUSDT')).toBe(true)
      expect(await state('BTCUSDT')).toBe('pinned')
      await popup('BTCUSDT').getByRole('button', { name: '编辑', exact: true }).click()
      await expect(field('BTCUSDT')).toBeFocused()
      await page.keyboard.type('不要存这句')
      await page.keyboard.press('Escape')
      // 编辑时 Esc 只放弃草稿，浮层还开着，焦点回「编辑」。
      expect(await isOpen('BTCUSDT')).toBe(true)
      await expect(noteText('BTCUSDT')).toHaveText('等回踩 95k 再看，别追。 跌破 90k 止损。')
      await expect(popup('BTCUSDT').getByRole('button', { name: '编辑', exact: true })).toBeFocused()
      await expect(saved).toHaveText('BTCUSDT：等回踩 95k 再看，别追。 跌破 90k 止损。')
      return { open: await isOpen('BTCUSDT'), text: await noteText('BTCUSDT').textContent(), focus: await focused() }
    })
    await step('再点「编辑」，清空后点「保存」：存空就是删掉，浮层关上，图标变「添加备注」', async () => {
      await popup('BTCUSDT').getByRole('button', { name: '编辑', exact: true }).click()
      await expect(field('BTCUSDT')).toBeFocused()
      await page.keyboard.press('Control+A')
      await page.keyboard.press('Backspace')
      await expect(field('BTCUSDT')).toHaveValue('')
      await popup('BTCUSDT').getByRole('button', { name: '保存', exact: true }).click()
      await expect(saved).toHaveText('BTCUSDT：（已删除）')
      await expect.poll(() => isOpen('BTCUSDT')).toBe(false)
      await expect(icon('BTCUSDT', '添加备注')).toBeFocused()
      await expect(icon('BTCUSDT', '备注')).toHaveCount(0)
      return { saved: await saved.textContent(), focus: await focused() }
    })
    await step('NVDA 没有备注：点加号直接进编辑，打字后按 Esc，草稿丢掉、什么都没存', async () => {
      await icon('NVDA', '添加备注').click()
      await expect.poll(() => isOpen('NVDA')).toBe(true)
      await expect(field('NVDA')).toBeFocused()
      await page.keyboard.type('先观望')
      await page.keyboard.press('Escape')
      await expect.poll(() => isOpen('NVDA')).toBe(false)
      await expect(icon('NVDA', '添加备注')).toBeFocused()
      await expect(saved).toHaveText('BTCUSDT：（已删除）')
      return { open: await isOpen('NVDA'), saved: await saved.textContent(), focus: await focused() }
    })
  },
}
