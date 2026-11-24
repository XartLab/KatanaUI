// SPDX-License-Identifier: MIT
import { expect, test, type Locator, type Page } from '@playwright/test'

// Agent 单次运行详情与运行列表（KatanaUI #196）：在文档站的页上真点真按，断言用户看到的值与 ARIA。
// 页：agent-run-detail（可点那份 main：阻塞 → 确认 → 在跑；在跑、完成、暂停、失败各一份）、agent-run-list。

test.use({ viewport: { width: 1100, height: 1900 } })

const open = async (page: Page, id: string, theme: 'graphite' | 'console' = 'graphite') => {
  await page.goto(`/?theme=${theme}#/${id}`)
  const area = page.locator(`[data-gallery="${id}"]`)
  await area.waitFor()
  return area
}
const demo = (area: Locator, name: string) => area.locator(`[data-gallery-ard="${name}"]`)
const bg = (node: Locator) => node.evaluate((el) => getComputedStyle(el).backgroundColor)

test('三种状态：进度条、时间行、动作钮按状态变', async ({ page }) => {
  const area = await open(page, 'agent-run-detail')

  // 在跑：62%，24 根亮、1 根当前；左写已用右写约剩；右上「暂停」；没有问题卡。
  const running = demo(area, 'running')
  const bar = running.getByRole('progressbar', { name: '运行进度' })
  await expect(bar).toHaveAttribute('aria-valuenow', '62')
  await expect(bar.locator('[data-tick="lit"]')).toHaveCount(24)
  await expect(bar.locator('[data-tick="current"]')).toHaveCount(1)
  await expect(running.locator('[data-slot="run-time"]')).toHaveText('已用 6 分 12 秒约剩 4 分钟')
  await expect(running.getByRole('button', { name: '暂停' })).toBeVisible()
  await expect(running.locator('[data-slot="run-question"]')).toHaveCount(0)
  await expect(running.locator('[data-slot="run-state"]')).toHaveText('在跑')

  // 阻塞（可点那份的初始状态）：没有当前刻度、只写阻塞多久、问题卡在、右上「取消」。
  const main = demo(area, 'main')
  await expect(main.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '76')
  await expect(main.locator('[data-tick="current"]')).toHaveCount(0)
  await expect(main.locator('[data-slot="run-time"]')).toHaveText('阻塞于 58 分钟前')
  await expect(main.locator('[data-slot="run-question"]')).toContainText('示例源 B 缺少访问密钥')
  await expect(main.getByRole('button', { name: '取消' })).toBeVisible()
  await expect(main.locator('[data-slot="run-state"]')).toHaveText('要你确认')
  // 阻塞的那步名字 warn 色，跟在跑那步的颜色不同。
  const blockedStep = main.locator('[data-slot="run-steps"] li[data-status="blocked"] .k-ard-step-name')
  const doneStep = main.locator('[data-slot="run-steps"] li[data-status="done"] .k-ard-step-name').first()
  const color = (node: Locator) => node.evaluate((el) => getComputedStyle(el).color)
  expect(await color(blockedStep)).not.toBe(await color(doneStep))

  // 完成：100%，刻度全亮，写用时，右上「再跑一次」，有「接着跑」。
  const done = demo(area, 'done')
  await expect(done.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100')
  await expect(done.locator('[data-tick="lit"]')).toHaveCount(40)
  await expect(done.locator('[data-slot="run-time"]')).toHaveText('用时 3 分 17 秒')
  await expect(done.getByRole('button', { name: '再跑一次' })).toBeVisible()
  await expect(done.locator('[data-slot="run-next"] button')).toHaveCount(2)

  // 三种状态的亮刻度颜色各不相同（强调色、warn、ok），暗刻度比亮刻度淡。
  const lit = (scope: Locator) => bg(scope.locator('[data-tick="lit"]').first())
  const colors = new Set([await lit(running), await lit(main), await lit(done)])
  expect(colors.size).toBe(3)
  expect(await bg(running.locator('[data-tick="dark"]').first())).not.toBe(await lit(running))
  // 当前刻度亮正文主色（不同于状态色）。
  expect(await bg(running.locator('[data-tick="current"]'))).not.toBe(await lit(running))
})

test('标题层级：运行名 h2，分组标题与问题标题 h3；列表标题 h2、分组标题 h3（默认，按页面大纲可传）', async ({
  page,
}) => {
  const area = await open(page, 'agent-run-detail')
  const main = demo(area, 'main')
  await expect(main.getByRole('heading', { level: 2, name: '接入新数据源' })).toBeVisible()
  await expect(main.getByRole('heading', { level: 3, name: '详情' })).toBeVisible()
  await expect(main.getByRole('heading', { level: 3, name: '示例源 B 缺少访问密钥' })).toBeVisible()
  await expect(main.getByRole('heading', { level: 4 })).toHaveCount(0)
  const list = await open(page, 'agent-run-list')
  await expect(list.getByRole('heading', { level: 2, name: '运行' })).toBeVisible()
  await expect(list.getByRole('heading', { level: 3, name: '进行中' })).toBeVisible()
})

test('进度条是 progressbar，带 aria-valuenow；刻度只是装饰', async ({ page }) => {
  const area = await open(page, 'agent-run-detail')
  const running = demo(area, 'running')
  const bar = running.getByRole('progressbar')
  await expect(bar).toHaveAttribute('aria-valuemin', '0')
  await expect(bar).toHaveAttribute('aria-valuemax', '100')
  await expect(bar).toHaveAttribute('aria-valuenow', '62')
  // 进度条的读法是百分比加状态词，由 labels 拼（件里不写连接的字）。
  await expect(bar).toHaveAttribute('aria-valuetext', '62%，在跑')
  await expect(demo(area, 'main').getByRole('progressbar')).toHaveAttribute('aria-valuetext', '76%，要你确认')
  await expect(bar.locator('i')).toHaveCount(40)
  await expect(bar.locator('i:not([aria-hidden="true"])')).toHaveCount(0)
  // 读屏树里进度条没有 40 个子节点（装饰刻度不进树）。
  const tree = await bar.ariaSnapshot()
  expect(tree.split('\n').length).toBeLessThan(4)
})

test('阻塞问题卡的确认钮：点了回调被调用（运行放行、问题卡消失、动作钮变暂停）', async ({ page }) => {
  const area = await open(page, 'agent-run-detail')
  const main = demo(area, 'main')
  // 阻塞时右上「取消」是 danger 样式；「确认」用 aria-describedby 指向问题（标题与说明）。
  await expect(main.getByRole('button', { name: '取消' })).toHaveAttribute('data-variant', 'danger')
  await expect(main.getByRole('button', { name: '确认' })).toHaveAccessibleDescription(
    /示例源 B 缺少访问密钥.*要继续，需要我用保险库里的备用密钥吗？/,
  )
  await main.getByRole('button', { name: '确认' }).click()
  await expect(main.locator('[data-slot="run-state"]')).toHaveText('在跑')
  await expect(main.locator('[data-slot="run-question"]')).toHaveCount(0)
  await expect(main.locator('[data-tick="current"]')).toHaveCount(1)
  await expect(main.getByRole('button', { name: '暂停' })).toBeVisible()
  // 动作钮继续随状态变：暂停 → 继续 → 在跑。
  await main.getByRole('button', { name: '暂停' }).click()
  await expect(main.locator('[data-slot="run-state"]')).toHaveText('已暂停')
  await expect(main.getByRole('button', { name: '继续' })).toBeVisible()
  await main.getByRole('button', { name: '继续' }).click()
  await expect(main.locator('[data-slot="run-state"]')).toHaveText('在跑')
})

test('完成态：点建议动作，回调带上它的 id；点「再跑一次」走动作回调', async ({ page }) => {
  const area = await open(page, 'agent-run-detail')
  const done = demo(area, 'done')
  const picked = done.locator('[data-gallery-ard="picked"]')
  await expect(picked).toHaveText('还没选建议动作')
  const send = done.locator('[data-slot="run-next"] button[data-id="send"]')
  await expect(send).toContainText('发送报告给研究组')
  await expect(send).toContainText('约 2 分钟')
  await send.click()
  await expect(picked).toHaveText('选了：发送报告给研究组')
  await done.locator('[data-slot="run-next"] button[data-id="schedule"]').click()
  await expect(picked).toHaveText('选了：30 天后再回补一次')
  await done.getByRole('button', { name: '再跑一次' }).click()
  await expect(picked).toHaveText('选了：再跑一次')
})

test('详情与步骤用键盘收起展开（aria-expanded），收起的内容 hidden="until-found"，查找命中会展开', async ({ page }) => {
  const area = await open(page, 'agent-run-detail')
  const running = demo(area, 'running')
  const head = (name: string) => running.getByRole('button', { name, exact: true })
  const panel = (id: string) => running.locator(`[data-section="${id}"] .k-ard-panel`)

  for (const [name, id] of [
    ['详情', 'details'],
    ['步骤', 'steps'],
  ] as const) {
    const button = head(name)
    await expect(button).toHaveAttribute('aria-expanded', 'true')
    await button.focus()
    await page.keyboard.press('Enter')
    await expect(button).toHaveAttribute('aria-expanded', 'false')
    await expect(panel(id)).toHaveAttribute('hidden', 'until-found')
    await expect(panel(id)).toHaveJSProperty('hidden', 'until-found')
    await page.keyboard.press('Space')
    await expect(button).toHaveAttribute('aria-expanded', 'true')
    await expect(panel(id)).not.toHaveAttribute('hidden')
    await expect(button).toHaveAttribute('aria-controls', (await panel(id).getAttribute('id'))!)
  }

  // 浏览器内查找命中收起的内容时先发 beforematch：按钮跟着变成展开。
  const steps = head('步骤')
  await steps.focus()
  await page.keyboard.press('Enter')
  await expect(steps).toHaveAttribute('aria-expanded', 'false')
  await panel('steps').evaluate((el) => {
    el.removeAttribute('hidden')
    el.dispatchEvent(new Event('beforematch', { bubbles: true }))
  })
  await expect(steps).toHaveAttribute('aria-expanded', 'true')

  // 一开始就收起的分组（暂停那份的详情）。
  const paused = demo(area, 'paused')
  await expect(paused.getByRole('button', { name: '详情', exact: true })).toHaveAttribute('aria-expanded', 'false')
})

test('步骤：状态图标形状不同、右边写耗时或状态字，在跑那步 aria-current', async ({ page }) => {
  const area = await open(page, 'agent-run-detail')
  const steps = demo(area, 'running').locator('[data-slot="run-steps"] li')
  await expect(steps).toHaveCount(5)
  await expect(steps.nth(0).locator('.k-ard-step-meta')).toHaveText('46 秒')
  // 完成步骤的耗时读屏读得到；在跑那步右边的状态词对读屏隐藏（跟读屏词重复）。
  await expect(steps.nth(0).locator('.k-ard-step-meta')).not.toHaveAttribute('aria-hidden')
  await expect(steps.nth(2).locator('.k-ard-step-meta')).toHaveAttribute('aria-hidden', 'true')
  expect(await steps.nth(0).ariaSnapshot()).toMatch(/连接数据源 完成[\s\S]*46 秒/)
  expect(await steps.nth(2).ariaSnapshot()).not.toContain('在跑 在跑')
  await expect(steps.nth(2).locator('.k-ard-step-meta')).toHaveText('在跑')
  await expect(steps.nth(2)).toHaveAttribute('aria-current', 'step')
  await expect(steps.nth(3).locator('.k-ard-step-meta')).toHaveText('')
  // 勾、转圈、空圈各是不同的图形。
  await expect(steps.nth(0).locator('svg')).toHaveCount(1)
  await expect(steps.nth(2).locator('svg.k-status-spin')).toHaveCount(1)
  await expect(steps.nth(3).locator('svg')).toHaveCount(0)
  // 失败那份：叉与失败字，名字 danger 色。
  const failed = demo(area, 'failed').locator('li[data-status="failed"]')
  await expect(failed.locator('.k-ard-step-meta')).toHaveText('失败')
  await expect(failed.locator('svg')).toHaveCount(1)
})

test('在 Console 主题下三种状态的刻度也各是不同的颜色', async ({ page }) => {
  const area = await open(page, 'agent-run-detail', 'console')
  const lit = (name: string) => bg(demo(area, name).locator('[data-tick="lit"]').first())
  expect(new Set([await lit('running'), await lit('main'), await lit('done')]).size).toBe(3)
})

test('AgentRunList：行带名字、状态字、时间；点行或键盘 Enter 打开，选中的行 aria-current', async ({ page }) => {
  const area = await open(page, 'agent-run-list')
  // 分组标题是真标题（读屏按 H 键能跳），分组用 aria-labelledby 指向它。
  await expect(area.getByRole('heading', { name: '进行中' })).toBeVisible()
  await expect(area.getByRole('group', { name: '本周' })).toBeVisible()
  const rows = area.locator('[data-slot="run-row"]')
  await expect(rows).toHaveCount(5)
  const blocked = area.locator('[data-slot="run-row"][data-id="source-b"]')
  await expect(blocked).toHaveAttribute('aria-current', 'true')
  await expect(blocked).toHaveAttribute('aria-label', '接入新数据源, 示例源 B · 日线, 要你确认, 1 小时前阻塞')
  await expect(area.locator('[data-gallery-arl="opened"]')).toHaveText('已打开：接入新数据源')
  // 状态字颜色跟着状态：阻塞与完成不同。
  const stateColor = (row: Locator) => row.locator('.k-arl-state').evaluate((el) => getComputedStyle(el).color)
  const doneRow = area.locator('[data-slot="run-row"][data-id="review"]')
  expect(await stateColor(blocked)).not.toBe(await stateColor(doneRow))
  // 点一行：它被选中、上一行放开。
  await doneRow.click()
  await expect(doneRow).toHaveAttribute('aria-current', 'true')
  await expect(blocked).not.toHaveAttribute('aria-current')
  await expect(area.locator('[data-gallery-arl="opened"]')).toHaveText('已打开：复核回补结果')
  // 键盘：Tab 到下一行按 Enter 打开。
  await page.keyboard.press('Tab')
  await expect(rows.nth(3)).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(rows.nth(3)).toHaveAttribute('aria-current', 'true')
  await expect(area.locator('[data-gallery-arl="opened"]')).toHaveText('已打开：重算动量因子')
})
