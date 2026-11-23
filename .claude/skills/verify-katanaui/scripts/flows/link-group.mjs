// SPDX-License-Identifier: MIT
// 功能地图 features/link-group.md：联动组页上的两段演示。
// 前一大半走标题栏选组件 LinkGroupPicker（#150）：同组跟着换、菜单读每组的品种、进有值的组、进空组带着品种走、不联动、键盘选组、Esc 不换组；
// 最后两步走 #22 的自选与图：自选换品种两张图跟着换，在一张图上移动指针，另一张同时画十字线。
export default {
  title: '联动组：选组件选组与同步，自选与十字线同步',
  page: 'link-group',
  async run({ page, section, step, expect, aria }) {
    const panel = (name) => section.getByRole('region', { name, exact: true })
    // 一张小件现在显示的品种：内容区「换品种」那排里按下的那个，与标题栏的「· 品种」。
    const symbolOf = async (name) => {
      const pressed = panel(name)
        .getByRole('group', { name: `${name}：换品种` })
        .getByRole('button', { pressed: true })
      return (await pressed.innerText()).trim()
    }
    const symbols = async () => ({
      报价: await symbolOf('报价'),
      迷你图: await symbolOf('迷你图'),
      说明: await symbolOf('说明'),
    })
    const expectSymbols = async (want) => {
      for (const [name, symbol] of Object.entries(want)) {
        await expect(
          panel(name)
            .getByRole('group', { name: `${name}：换品种` })
            .getByRole('button', { name: symbol, exact: true }),
        ).toHaveAttribute('aria-pressed', 'true')
        await expect(panel(name).locator('.k-panel-object')).toHaveText(`· ${symbol}`)
      }
    }
    const choose = (name, symbol) =>
      panel(name)
        .getByRole('group', { name: `${name}：换品种` })
        .getByRole('button', { name: symbol, exact: true })
        .click()
    // 选组件：读屏名是「联动组: 当前组名」，名字随组变，所以按 data-slot 收到这张件标题栏里那一个。
    // 菜单开着时 Radix 给菜单以外的内容挂 aria-hidden，按角色找不到件（region），所以这里按演示的 data-gallery-link-panel 收。
    const picker = (name) => section.locator(`[data-gallery-link-panel="${name}"] [data-slot="link-group-picker"]`)
    const menu = page.getByRole('menu', { name: '联动组' })
    const item = (name) => menu.getByRole('menuitemradio', { name: new RegExp(`^${name}`) })
    const hint = (name) => item(name).locator('[data-slot="link-group-symbol"]')
    const focused = () =>
      page.evaluate(() => {
        const el = document.activeElement
        return el
          ? `${el.tagName.toLowerCase()}「${el.getAttribute('aria-label') ?? (el.textContent ?? '').trim().slice(0, 20)}」`
          : null
      })

    await step('打开 link-group 页：报价、迷你图在组 A（AAA），说明在组 B（CCC）', async () => {
      await expect(picker('报价')).toHaveAttribute('aria-label', '联动组: 组 A')
      await expect(picker('迷你图')).toHaveAttribute('aria-label', '联动组: 组 A')
      await expect(picker('说明')).toHaveAttribute('aria-label', '联动组: 组 B')
      await expectSymbols({ 报价: 'AAA', 迷你图: 'AAA', 说明: 'CCC' })
      return { symbols: await symbols() }
    })
    await step('在报价里点 BBB：同组的迷你图跟着换，组 B 的说明不动', async () => {
      await choose('报价', 'BBB')
      await expectSymbols({ 报价: 'BBB', 迷你图: 'BBB', 说明: 'CCC' })
      return { symbols: await symbols() }
    })
    await step('点说明标题栏的灯：组菜单打开，组 B 打勾，每组行尾是这组现在的品种', async () => {
      await picker('说明').click()
      await expect(menu).toBeVisible()
      await expect(picker('说明')).toHaveAttribute('aria-expanded', 'true')
      await expect(item('组 B')).toHaveAttribute('aria-checked', 'true')
      await expect(item('组 A')).toHaveAttribute('aria-checked', 'false')
      await expect(hint('组 A')).toHaveText('BBB')
      await expect(hint('组 B')).toHaveText('CCC')
      await expect(hint('组 C')).toHaveCount(0)
      await expect(menu.getByRole('menuitemradio', { name: '不联动', exact: true })).toBeVisible()
      await aria(menu, 'link-group-menu.aria.yml')
      return {
        items: (await menu.getByRole('menuitemradio').allInnerTexts()).map((t) => t.replace(/\s+/g, ' ').trim()),
        checked: (await menu.getByRole('menuitemradio', { checked: true }).innerText()).trim(),
      }
    })
    await step('选「组 A」：菜单收起，焦点回到灯，说明改看组 A 的 BBB', async () => {
      await item('组 A').click()
      await expect(menu).toHaveCount(0)
      await expect(picker('说明')).toHaveAttribute('aria-label', '联动组: 组 A')
      await expect(picker('说明')).toBeFocused()
      await expectSymbols({ 说明: 'BBB' })
      return { symbols: await symbols(), focus: await focused() }
    })
    await step('在说明里点 DDD：现在同组的报价、迷你图都跟着换', async () => {
      await choose('说明', 'DDD')
      await expectSymbols({ 报价: 'DDD', 迷你图: 'DDD', 说明: 'DDD' })
      return { symbols: await symbols() }
    })
    await step('迷你图选进空的「组 C」：它留着 DDD（组 C 取了它的品种）；之后组 A 换品种它不跟', async () => {
      await picker('迷你图').click()
      await expect(hint('组 C')).toHaveCount(0)
      await item('组 C').click()
      await expect(picker('迷你图')).toHaveAttribute('aria-label', '联动组: 组 C')
      await expectSymbols({ 迷你图: 'DDD' })
      await choose('报价', 'AAA')
      await expectSymbols({ 报价: 'AAA', 说明: 'AAA', 迷你图: 'DDD' })
      await picker('迷你图').click()
      await expect(hint('组 C')).toHaveText('DDD')
      await expect(hint('组 A')).toHaveText('AAA')
      await page.keyboard.press('Escape')
      await expect(menu).toHaveCount(0)
      return { symbols: await symbols() }
    })
    await step('说明选「不联动」：灯变空环，说明回到它自己起头的 CCC；组 A 再换品种它不跟', async () => {
      await picker('说明').click()
      await menu.getByRole('menuitemradio', { name: '不联动', exact: true }).click()
      await expect(picker('说明')).toHaveAttribute('aria-label', '联动组: 不联动')
      await expect(picker('说明')).toHaveAttribute('data-group', 'none')
      await expectSymbols({ 说明: 'CCC' })
      await choose('报价', 'BBB')
      await expectSymbols({ 报价: 'BBB', 说明: 'CCC', 迷你图: 'DDD' })
      // 反过来：不联动的件自己换，组 A 不动。
      await choose('说明', 'AAA')
      await expectSymbols({ 报价: 'BBB', 说明: 'AAA' })
      return { symbols: await symbols() }
    })
    await step('键盘：焦点在报价的灯上按 Enter 开菜单，↓ 走到「组 C」按 Enter：报价进组 C，改看 DDD', async () => {
      await picker('报价').focus()
      await page.keyboard.press('Enter')
      await expect(menu).toBeVisible()
      await expect(item('组 A')).toBeFocused()
      // 菜单有进场动效：等它走完再按键，每按一次读一次焦点。
      await menu.evaluate((el) => Promise.all(el.getAnimations({ subtree: true }).map((a) => a.finished)))
      await page.keyboard.press('ArrowDown')
      await expect(item('组 B')).toBeFocused()
      await page.keyboard.press('ArrowDown')
      await expect(item('组 C')).toBeFocused()
      await page.keyboard.press('Enter')
      await expect(menu).toHaveCount(0)
      await expect(picker('报价')).toHaveAttribute('aria-label', '联动组: 组 C')
      await expect(picker('报价')).toBeFocused()
      await expectSymbols({ 报价: 'DDD', 迷你图: 'DDD' })
      const focus = await focused()
      // 组 C 现在有报价与迷你图两张：在报价里换，迷你图跟着。
      await choose('报价', 'CCC')
      await expectSymbols({ 报价: 'CCC', 迷你图: 'CCC' })
      return { symbols: await symbols(), focusAfterPick: focus }
    })
    await step('键盘：开菜单按 End 走到「不联动」再按 Esc：菜单收起，焦点回到灯，组不换', async () => {
      await picker('迷你图').focus()
      await page.keyboard.press('Enter')
      await expect(menu).toBeVisible()
      await page.keyboard.press('End')
      await expect(menu.getByRole('menuitemradio', { name: '不联动', exact: true })).toBeFocused()
      await page.keyboard.press('Escape')
      await expect(menu).toHaveCount(0)
      await expect(picker('迷你图')).toBeFocused()
      await expect(picker('迷你图')).toHaveAttribute('aria-label', '联动组: 组 C')
      await expectSymbols({ 迷你图: 'CCC' })
      return { symbols: await symbols(), focus: await focused() }
    })

    // #22 的演示（页上第一段）：自选与图 1、图 2 都在 A 组，用的是另一张联动表，跟上面三张小件不串组。
    const watch = section.getByRole('group', { name: '自选', exact: true })
    const chart = (name) => section.getByRole('region', { name, exact: true })
    const objectOf = async (name) => (await chart(name).locator('.k-panel-object').innerText()).trim()
    await step('自选点 NVDA：A 组的图 1、图 2 标题栏都换成 NVDA', async () => {
      await watch.getByRole('button', { name: 'NVDA', exact: true }).click()
      await expect(watch.getByRole('button', { name: 'NVDA', exact: true })).toHaveAttribute('aria-pressed', 'true')
      await expect(chart('图 1').locator('.k-panel-object')).toHaveText('NVDA')
      await expect(chart('图 2').locator('.k-panel-object')).toHaveText('NVDA')
      return { 图1: await objectOf('图 1'), 图2: await objectOf('图 2') }
    })
    await step('指针移到图 1 的灰条上：图 2 同时画十字线，两张图的读数一样', async () => {
      const readout = (name) => chart(name).locator('[data-slot="crosshair-readout"]')
      await expect(readout('图 2')).toHaveText('十字线：—')
      await chart('图 1').locator('[data-slot="crosshair-strip"]').hover()
      await expect(readout('图 2')).not.toHaveText('十字线：—')
      const one = (await readout('图 1').innerText()).trim()
      await expect(readout('图 2')).toHaveText(one)
      return { 图1: one, 图2: (await readout('图 2').innerText()).trim() }
    })
  },
}
