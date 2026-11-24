// SPDX-License-Identifier: MIT
import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

// 研究资料与日历（#226）：日历事件点与洞察（四个日历）、资料导入、模板库。在文档站的页上真点真按，断言用户看到的与 ARIA。

test.use({ viewport: { width: 1100, height: 1500 } })

const open = async (page: Page, id: string) => {
  await page.goto(`/?theme=graphite#/${id}`)
  const area = page.locator(`[data-gallery="${id}"]`)
  await area.waitFor()
  return area
}

/** 模拟输入法组字时的按键：isComposing 为真、keyCode 229（Playwright 的按键发不出这种）。 */
const composingKey = (page: Page, key: string, extra: { metaKey?: boolean; ctrlKey?: boolean } = {}) =>
  page.evaluate(
    ([k, e]) => {
      const el = document.activeElement!
      el.dispatchEvent(
        new KeyboardEvent('keydown', {
          key: k,
          isComposing: true,
          keyCode: 229,
          bubbles: true,
          cancelable: true,
          ...e,
        }),
      )
    },
    [key, extra] as const,
  )

const axe = async (page: Page, include: string) => {
  await page.mouse.move(0, 0) // 鼠标停在页签上时是悬停态，不是要量的静止态
  await page.waitForTimeout(600) // 页签的底块与弹层的入场走完再量，免得量到半透明的中间态
  const result = await new AxeBuilder({ page })
    .include(include)
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze()
  expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(' | ')}`)).toEqual([])
}

// 示例事件在 2026-11：12 CPI、19 财报、20 期权到期 + 除权、25 除权、27 半日市。
const NOVEMBER_EVENT_DAYS = 5

test('日历事件点：DateTimeInput 的弹层里有事件的格子带点与描述，悬停与聚焦读出，洞察行在', async ({ page }) => {
  const area = await open(page, 'date-time-input')
  await area.getByRole('button', { name: '选回放起点的日期' }).click()
  const pop = page.locator('.k-dt-pop')
  await expect(pop.locator('[data-has-events]')).toHaveCount(NOVEMBER_EVENT_DAYS)
  await expect(pop.locator('.k-cal-insight')).toContainText('已避开 11-27 美股半日市')
  // 11-20 有两件事：两个点，描述里读出两件。
  const twentieth = pop.locator('[data-has-events]').filter({ hasText: /^20/ }).first()
  await expect(twentieth.locator('.k-cal-dot')).toHaveCount(2)
  const describedBy = await twentieth.getAttribute('aria-describedby')
  await expect(page.locator(`[id="${describedBy}"]`)).toHaveText('期权到期和600519 除权')
  // 悬停 11-27：读数行写出当天的事，移开后回到选中日（11-20）的事。
  const readout = pop.locator('.k-cal-readout')
  await pop.locator('[data-has-events]').last().hover()
  await expect(readout).toContainText('美股半日市')
  await page.mouse.move(0, 0)
  await expect(readout).toContainText('期权到期')
  // 键盘聚焦在 11-25 上：读数行跟过去。
  await twentieth.focus()
  await page.keyboard.press('ArrowRight')
  await page.keyboard.press('ArrowRight')
  await page.keyboard.press('ArrowRight')
  await page.keyboard.press('ArrowRight')
  await page.keyboard.press('ArrowRight')
  await expect(readout).toContainText('000001 除权')
  await axe(page, '.k-dt-pop')
})

test('日历事件点：没传 events 与 insight 的日历没有点也没有脚', async ({ page }) => {
  const area = await open(page, 'date-time-input')
  const second = area.locator('.k-dt').nth(1)
  await second.getByRole('button', { name: '选截止的日期' }).click()
  const pop = page.locator('.k-dt-pop')
  await expect(pop.locator('.k-cal-dot, .k-cal-foot, [data-has-events]')).toHaveCount(0)
})

test('日历事件点：单独的 Calendar、DateRangePicker、TradingDatePicker 都能带事件与洞察', async ({ page }) => {
  const cal = await open(page, 'calendar')
  const card = cal.locator('.k-cal-card').filter({ has: page.locator('.k-cal-foot') })
  await expect(card.locator('[data-has-events]')).toHaveCount(NOVEMBER_EVENT_DAYS)
  await expect(card.locator('.k-cal-insight')).toBeVisible()
  await axe(page, '.k-cal-card:has(.k-cal-foot)')

  const range = await open(page, 'date-range-picker')
  await range.getByRole('button', { name: '选区间' }).last().click()
  const rpop = page.locator('.k-dr-pop')
  await expect(rpop.locator('[data-has-events]').first()).toBeVisible()
  await expect(rpop.locator('.k-cal-insight')).toContainText('11-27')

  const trading = await open(page, 'trading-date-picker')
  await trading.getByRole('button', { name: '选交易日' }).last().click()
  const tpop = page.locator('.k-tdp-pop')
  await expect(tpop.locator('[data-has-events]').first()).toBeVisible()
  await expect(tpop.locator('.k-cal-insight')).toBeVisible()
})

test('资料导入：多文件进度、失败重试与移除、粘贴与链接回调', async ({ page }) => {
  const area = await open(page, 'file-import')
  const list = area.getByRole('list', { name: '已添加的资料' })
  await expect(list.getByRole('listitem')).toHaveCount(4)
  const uploading = list.locator('[data-status="uploading"]')
  await expect(uploading).toContainText('62% 上传中')
  await expect(uploading.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '62')
  const failed = list.locator('[data-status="failed"]')
  await expect(failed.getByRole('alert')).toContainText('网络中断')
  // 并发多文件：一次选两份，两行同时在上传。
  await area.locator('input[type="file"]').setInputFiles([
    { name: 'a.csv', mimeType: 'text/csv', buffer: Buffer.from('a\n1\n') },
    { name: 'b.parquet', mimeType: 'application/octet-stream', buffer: Buffer.from('PAR1') },
  ])
  await expect(list.locator('[data-status="uploading"]')).toHaveCount(3)
  await area.getByRole('button', { name: '进度 +25%' }).click()
  await expect(list.locator('[data-item-id]').filter({ hasText: 'a.csv' })).toContainText('25% 上传中')
  // 重试：失败行回到上传中，回调带 id。
  await failed.getByRole('button', { name: '重试 backtest_result.parquet' }).click()
  await expect(area.locator('[data-gallery-import-log]')).toContainText('重试 r3')
  await expect(list.locator('[data-item-id="r3"]')).toHaveAttribute('data-status', 'uploading')
  // 失败行与移除：标失败后移除，焦点接给相邻行。
  await area.getByRole('button', { name: '上传中的标失败' }).click()
  await expect(list.locator('[data-status="failed"]')).toHaveCount(4)
  const target = list.locator('[data-item-id="r2"]')
  await target.getByRole('button', { name: '移除 factors_2026.csv' }).click()
  await expect(list.locator('[data-item-id="r2"]')).toHaveCount(0)
  await expect(area.locator('[data-gallery-import-log]')).toContainText('移除 r2')
  await expect(list.locator('[data-item-id]:focus-within')).toHaveCount(1)
  // 粘贴与链接。
  await area.getByRole('tab', { name: '粘贴' }).click()
  const box = area.getByRole('textbox', { name: '粘贴的文字' })
  await box.fill('半导体周报：库存去化')
  await composingKey(page, 'Enter', { metaKey: true })
  await expect(area.locator('[data-gallery-import-log]')).not.toContainText('粘贴了')
  await box.press('Control+Enter')
  await expect(area.locator('[data-gallery-import-log]')).toContainText('粘贴了 10 个字')
  await expect(box).toHaveValue('')
  await area.getByRole('tab', { name: '链接' }).click()
  const link = area.getByRole('textbox', { name: '资料链接' })
  await link.fill('ftp://example.com/x')
  await link.press('Enter')
  await expect(link).toHaveAttribute('aria-invalid', 'true')
  await expect(area.getByRole('alert').filter({ hasText: 'http' })).toBeVisible()
  await link.fill('https://example.com/semis')
  await composingKey(page, 'Enter')
  await expect(area.locator('[data-gallery-import-log]')).not.toContainText('链接 https')
  await link.press('Enter')
  await expect(area.locator('[data-gallery-import-log]')).toContainText('链接 https://example.com/semis')
  await axe(page, '[data-gallery="file-import"]')
})

test('模板库：搜索过滤树并高亮，键盘走树，选中、复制、使用回调带 id', async ({ page }) => {
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write'])
  const area = await open(page, 'template-library')
  const tree = area.getByRole('treegrid', { name: '模板' })
  await expect(tree.getByRole('row', { name: '动量策略' }).first()).toBeVisible()
  // 搜索：只剩命中的，命中的字高亮；变体命中时父模板留着。
  const search = area.getByRole('searchbox', { name: '搜索模板' })
  await search.fill('周频')
  await expect(tree.getByRole('row')).toHaveCount(3) // 我的模板、动量策略、动量策略 · 周频
  await expect(tree.locator('mark')).toHaveText('周频')
  await expect(area.locator('.k-tpl-side [role="status"]')).toHaveText('1 个模板匹配')
  await search.fill('zzz')
  await expect(area.getByText('没有匹配的模板')).toBeVisible()
  await search.press('Escape')
  await expect(search).toHaveValue('')
  // 键盘：焦点到树上，↓ 走到下一行，Enter 选中，详情跟着换。
  await tree.getByRole('row', { name: '回测配置 · 日线' }).click()
  await expect(area.getByRole('heading', { name: /回测配置/ })).toBeVisible()
  await tree.getByRole('row', { name: '均值回归' }).focus()
  await page.keyboard.press('Enter')
  await expect(area.getByRole('heading', { name: '均值回归' })).toBeVisible()
  // 内置只读：没有可点的正文按钮。
  await expect(area.getByRole('button', { name: /^模板正文/ })).toHaveCount(0)
  // ← 收起 / → 展开：动量策略带两个变体。
  const parent = tree.getByRole('row', { name: '动量策略', exact: true })
  await parent.focus()
  await expect(parent).toHaveAttribute('aria-expanded', 'false')
  await page.keyboard.press('ArrowRight')
  await expect(parent).toHaveAttribute('aria-expanded', 'true')
  await page.keyboard.press('ArrowLeft')
  await expect(parent).toHaveAttribute('aria-expanded', 'false')
  await page.keyboard.press('Enter')
  // 复制与使用。
  await area.getByRole('button', { name: '复制', exact: true }).click()
  await expect(area.locator('[data-gallery-template-log]')).toContainText('复制了 my-momentum')
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain('标的池：沪深 300')
  await area.getByRole('button', { name: '使用模板' }).click()
  await expect(area.locator('[data-gallery-template-log]')).toContainText('使用模板 my-momentum')
  await area.getByRole('button', { name: '复制为我的模板' }).click()
  await expect(area.locator('[data-gallery-template-log]')).toContainText('复制为我的模板 my-momentum')
  await axe(page, '[data-gallery="template-library"]')
})

test('模板库：正文就地编辑——⌘↵ 保存、Esc 取消、组字时的 Enter / Esc / ⌘↵ 不误触', async ({ page }) => {
  const area = await open(page, 'template-library')
  const body = area.getByRole('button', { name: /^模板正文/ })
  const log = area.locator('[data-gallery-template-log]')
  // Esc 取消：改了字也退回。
  await body.click()
  const field = area.getByRole('textbox', { name: '模板正文' })
  await field.fill('临时改动')
  await page.keyboard.press('Escape')
  await expect(area.getByRole('button', { name: /^模板正文/ })).toContainText('标的池：沪深 300')
  await expect(log).toContainText('还没有回调')
  // 组字时：Esc、⌘↵、Enter 都不动。
  await area.getByRole('button', { name: /^模板正文/ }).click()
  await area.getByRole('textbox', { name: '模板正文' }).fill('组字中')
  await composingKey(page, 'Escape')
  await composingKey(page, 'Enter', { metaKey: true })
  await composingKey(page, 'Enter')
  await expect(area.getByRole('textbox', { name: '模板正文' })).toHaveValue('组字中')
  await expect(log).toContainText('还没有回调')
  // ⌘↵（Ctrl+Enter）保存：回调带 id 与字段，正文换成新字。
  await area.getByRole('textbox', { name: '模板正文' }).press('Control+Enter')
  await expect(log).toContainText('保存 my-momentum：正文')
  await expect(area.getByRole('button', { name: /^模板正文/ })).toContainText('组字中')
  // 标题：Esc 放弃、Enter 保存（InlineEdit），组字时的 Enter 不保存。
  await area.getByRole('button', { name: /^模板名/ }).click()
  const title = area.getByRole('textbox', { name: '模板名' })
  await title.fill('新标题')
  await composingKey(page, 'Enter')
  await expect(title).toBeVisible()
  await title.press('Enter')
  await expect(log).toContainText('保存 my-momentum：标题')
  await expect(area.getByRole('heading', { name: /新标题/ })).toBeVisible()
  await axe(page, '[data-gallery="template-library"]')
})
