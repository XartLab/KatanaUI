// SPDX-License-Identifier: MIT
// 功能地图 features/rating-panel.md：切周期换数（点与键盘），悬停或 Tab 聚焦一个仪表出读数；周期之间用方向键走。
export default {
  title: 'RatingPanel 技术评级三联：切周期、悬停与聚焦出读数',
  page: 'rating-panel',
  async run({ page, section, step, expect, aria }) {
    // 页上有两块评级（三联与窄栏 280px），都叫「技术评级」：只看带周期切换的那块。
    const panel = section
      .getByRole('group', { name: '技术评级', exact: true })
      .filter({ has: page.getByRole('group', { name: '周期', exact: true }) })
    const frames = panel.getByRole('group', { name: '周期', exact: true })
    const frame = (name) => frames.getByRole('button', { name, exact: true })
    const meter = (name) => panel.getByRole('meter', { name, exact: true })
    const readout = (name) => meter(name).locator('[data-slot="rating-panel-readout"]')
    const opacity = (locator) => locator.evaluate((el) => Number(getComputedStyle(el).opacity))
    const pressed = async () =>
      (await frames.getByRole('button', { pressed: true }).allInnerTexts()).map((t) => t.trim())
    const focused = () =>
      page.evaluate(() => document.activeElement?.getAttribute('aria-label') ?? document.activeElement?.textContent)

    await step('打开 rating-panel 页：三个仪表，汇总放大，默认周期 1D', async () => {
      await expect(panel.getByRole('meter')).toHaveCount(3)
      await expect(frame('1D')).toHaveAttribute('aria-pressed', 'true')
      // 演示数据 1D：汇总 卖 2、中性 5、买 19 → (19 − 2) / 26 = +0.65，强烈买入。
      await expect(meter('汇总')).toHaveAttribute('aria-valuetext', '强烈买入, +0.65; 卖出 2, 中性 5, 买入 19')
      await expect(meter('汇总')).toHaveClass(/is-primary/)
      await expect(section.getByTestId('rating-panel-frame')).toHaveText('1D')
      await aria(panel, 'rating-panel-default.aria.yml')
      return { pressed: await pressed(), summary: await meter('汇总').getAttribute('aria-valuetext') }
    })
    await step('点周期「1m」：1m 按下、1D 弹起，三个仪表换成 1m 的数', async () => {
      await frame('1m').click()
      await expect(frame('1m')).toHaveAttribute('aria-pressed', 'true')
      await expect(frame('1D')).toHaveAttribute('aria-pressed', 'false')
      await expect(section.getByTestId('rating-panel-frame')).toHaveText('1m')
      await expect(meter('汇总')).toHaveAttribute('aria-valuetext', '强烈卖出, -0.58; 卖出 18, 中性 5, 买入 3')
      return { pressed: await pressed(), summary: await meter('汇总').getAttribute('aria-valuetext') }
    })
    await step('焦点在「1m」上按 → 再按 Enter：焦点到 5m 并选中，数换成 5m 的', async () => {
      await expect(frame('1m')).toBeFocused()
      // 周期一排是一个 Tab 停靠点，方向键在周期之间走。
      await page.keyboard.press('ArrowRight')
      await expect(frame('5m')).toBeFocused()
      // 焦点过去不选中：Enter 才换周期。
      await expect(frame('1m')).toHaveAttribute('aria-pressed', 'true')
      await page.keyboard.press('Enter')
      await expect(frame('5m')).toHaveAttribute('aria-pressed', 'true')
      await expect(section.getByTestId('rating-panel-frame')).toHaveText('5m')
      // 5m：汇总 卖 14、中性 6、买 6 → (6 − 14) / 26 = −0.31，卖出。
      await expect(meter('汇总')).toHaveAttribute('aria-valuetext', '卖出, -0.31; 卖出 14, 中性 6, 买入 6')
      return {
        pressed: await pressed(),
        focus: await focused(),
        summary: await meter('汇总').getAttribute('aria-valuetext'),
      }
    })
    await step('指针移到「汇总」上：名字那一行换成读数「-0.31 卖出」', async () => {
      await expect.poll(() => opacity(readout('汇总'))).toBe(0)
      await meter('汇总').hover()
      await expect.poll(() => opacity(readout('汇总'))).toBe(1)
      await expect(readout('汇总')).toHaveText('-0.31卖出')
      return { readout: await readout('汇总').textContent(), opacity: await opacity(readout('汇总')) }
    })
    await step('指针移到页上的说明字：读数收起', async () => {
      await section.getByTestId('rating-panel-frame').hover()
      await expect.poll(() => opacity(readout('汇总'))).toBe(0)
      return { opacity: await opacity(readout('汇总')) }
    })
    await step('焦点还在「5m」上按一下 Tab：跳出周期一排，落到「摆动指标」，它出读数「-0.27 卖出」', async () => {
      // 悬停不挪焦点：焦点仍在上一步按 Enter 的那个周期上。
      await expect(frame('5m')).toBeFocused()
      await page.keyboard.press('Tab')
      await expect(meter('摆动指标')).toBeFocused()
      await expect.poll(() => opacity(readout('摆动指标'))).toBe(1)
      await expect(readout('摆动指标')).toHaveText('-0.27卖出')
      return { focus: await focused(), readout: await readout('摆动指标').textContent() }
    })
    await step('再按 Tab：焦点到「汇总」，汇总出读数，摆动指标的收起', async () => {
      await page.keyboard.press('Tab')
      await expect(meter('汇总')).toBeFocused()
      await expect.poll(() => opacity(readout('汇总'))).toBe(1)
      await expect.poll(() => opacity(readout('摆动指标'))).toBe(0)
      return {
        focus: await focused(),
        summary: await opacity(readout('汇总')),
        oscillators: await opacity(readout('摆动指标')),
      }
    })
  },
}
