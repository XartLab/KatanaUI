// SPDX-License-Identifier: MIT
// 功能地图 features/agent-run-detail.md：Agent 单次运行详情的三种状态、阻塞问题卡确认、完成态建议动作、详情与步骤键盘收起展开、进度条语义。
export default {
  title: 'AgentRunDetail 运行详情：三态、确认、接着跑、键盘收起、进度条',
  page: 'agent-run-detail',
  async run({ page, section, step, expect, aria }) {
    const demo = (name) => section.locator(`[data-gallery-ard="${name}"]`)
    const state = (scope) => scope.locator('[data-slot="run-state"]')
    const time = async (scope) => (await scope.locator('[data-slot="run-time"]').innerText()).replace(/\s+/g, ' ').trim()
    const count = (scope, tick) => scope.locator(`[data-tick="${tick}"]`).count()

    await step('在跑那份：62%，24 根亮、1 根当前，已用与约剩，右上「暂停」', async () => {
      const running = demo('running')
      const bar = running.getByRole('progressbar', { name: '运行进度' })
      await expect(bar).toHaveAttribute('aria-valuenow', '62')
      await expect(running.getByRole('button', { name: '暂停' })).toBeVisible()
      await aria(bar, 'agent-run-progress.aria.yml')
      return {
        valuenow: await bar.getAttribute('aria-valuenow'),
        lit: await count(running, 'lit'),
        current: await count(running, 'current'),
        time: await time(running),
        state: (await state(running).innerText()).trim(),
      }
    })
    await step('阻塞那份（可点那份的初始状态）：没有当前刻度，写阻塞多久，问题卡在，右上「取消」', async () => {
      const main = demo('main')
      await expect(main.locator('[data-slot="run-question"]')).toBeVisible()
      await expect(main.getByRole('button', { name: '取消' })).toBeVisible()
      return {
        valuenow: await main.getByRole('progressbar').getAttribute('aria-valuenow'),
        current: await count(main, 'current'),
        time: await time(main),
        state: (await state(main).innerText()).trim(),
        question: (await main.locator('[data-slot="run-question"]').innerText()).replace(/\s+/g, ' ').trim(),
      }
    })
    await step('完成那份：100%，40 根全亮，写用时，右上「再跑一次」，有「接着跑」两个建议', async () => {
      const done = demo('done')
      await expect(done.getByRole('button', { name: '再跑一次' })).toBeVisible()
      return {
        valuenow: await done.getByRole('progressbar').getAttribute('aria-valuenow'),
        lit: await count(done, 'lit'),
        time: await time(done),
        suggestions: await done.locator('[data-slot="run-next"] button').count(),
      }
    })
    await step('点阻塞卡的「确认」：回调放行，运行变在跑，问题卡消失，动作钮变「暂停」', async () => {
      const main = demo('main')
      await main.getByRole('button', { name: '确认' }).click()
      await expect(state(main)).toHaveText('在跑')
      await expect(main.locator('[data-slot="run-question"]')).toHaveCount(0)
      await expect(main.getByRole('button', { name: '暂停' })).toBeVisible()
      return {
        state: (await state(main).innerText()).trim(),
        question: await main.locator('[data-slot="run-question"]').count(),
        current: await count(main, 'current'),
      }
    })
    await step('完成态点建议动作「发送报告给研究组」：回调带它的 id，下面一行写选了哪个', async () => {
      const done = demo('done')
      const picked = done.locator('[data-gallery-ard="picked"]')
      await done.locator('[data-slot="run-next"] button[data-id="send"]').click()
      await expect(picked).toHaveText('选了：发送报告给研究组')
      return { picked: (await picked.innerText()).trim() }
    })
    await step('在跑那份的「详情」标题上按 Enter 收起、Space 展开（aria-expanded），收起时内容 hidden=until-found', async () => {
      const running = demo('running')
      const head = running.getByRole('button', { name: '详情', exact: true })
      const panel = running.locator('[data-section="details"] .k-ard-panel')
      await head.focus()
      await page.keyboard.press('Enter')
      await expect(head).toHaveAttribute('aria-expanded', 'false')
      const folded = { expanded: await head.getAttribute('aria-expanded'), hidden: await panel.getAttribute('hidden') }
      await page.keyboard.press('Space')
      await expect(head).toHaveAttribute('aria-expanded', 'true')
      return { folded, unfolded: { expanded: await head.getAttribute('aria-expanded'), hidden: await panel.getAttribute('hidden') } }
    })
  },
}
