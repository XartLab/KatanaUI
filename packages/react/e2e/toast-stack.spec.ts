// SPDX-License-Identifier: MIT
import { expect, test, type Locator, type Page } from '@playwright/test'

// ToastStack 叠放提示（#195）：在文档站的页上真点真按，对票里的判据：收拢、悬停展开、滑动关、撤销就地变状态、键盘展开。

test.use({ viewport: { width: 1100, height: 1200 } })

const open = async (page: Page, id: string) => {
  await page.goto(`/?theme=graphite#/${id}`)
  const area = page.locator(`[data-gallery="${id}"]`)
  await area.waitFor()
  return area
}

const region = (page: Page) => page.getByRole('region', { name: '叠放提示演示', exact: true })
const items = (page: Page) => region(page).locator('[data-slot="toast-stack-item"]')
type Box = { x: number; y: number; width: number; height: number }

/** 等位置不再变（弹簧停下）再读各条的盒子，从旧到新。 */
const settled = async (page: Page, count: number): Promise<Box[]> => {
  await expect(items(page)).toHaveCount(count)
  let last = ''
  await expect
    .poll(async () => {
      const now = JSON.stringify(await boxes(page))
      const same = now === last
      last = now
      return same
    })
    .toBe(true)
  return boxes(page)
}
const boxes = async (page: Page): Promise<Box[]> =>
  items(page).evaluateAll((els) =>
    els.map((el) => {
      const r = el.getBoundingClientRect()
      return { x: r.x, y: r.y, width: r.width, height: r.height }
    }),
  )
const opacity = (el: Locator) => el.evaluate((node) => Number(getComputedStyle(node).opacity))

const pushThree = async (page: Page) => {
  await page.getByRole('button', { name: '连推三条' }).click()
  await page.mouse.move(2, 2)
  return settled(page, 3)
}

test('ToastStack：连推三条，只有最新一条完整，后面两层缩小、上移、变淡，露出边', async ({ page }) => {
  await open(page, 'toast-stack')
  const [oldest, middle, front] = await pushThree(page)
  await expect(items(page).nth(2).locator('[data-slot="toast-title"]')).toContainText('告警 3')
  // 最前面一条原大小；后面每层上移（露出的边约 5px、10px）并缩小。
  expect(front!.y - middle!.y).toBeGreaterThan(3)
  expect(front!.y - middle!.y).toBeLessThan(12)
  expect(middle!.y - oldest!.y).toBeGreaterThan(3)
  expect(middle!.width).toBeLessThan(front!.width)
  expect(oldest!.width).toBeLessThan(middle!.width)
  // 容器只有前面一条那么高：后面的压成同一个高度，不会从下面探出来。
  expect(middle!.y + middle!.height).toBeLessThanOrEqual(front!.y + front!.height + 1)
  const [o0, o1, o2] = [
    await opacity(items(page).nth(0)),
    await opacity(items(page).nth(1)),
    await opacity(items(page).nth(2)),
  ]
  expect(o2).toBe(1)
  expect(o1).toBeLessThan(1)
  expect(o0).toBeLessThan(o1)
  await expect(region(page)).not.toHaveAttribute('data-expanded', '')
})

test('ToastStack：指针移入展开成列表（间距 8px），移出收回', async ({ page }) => {
  await open(page, 'toast-stack')
  const [, , collapsedFront] = await pushThree(page)
  await items(page)
    .nth(2)
    .hover({ position: { x: 40, y: 10 } })
  await expect(region(page)).toHaveAttribute('data-expanded', '')
  const [a, b, c] = await settled(page, 3)
  expect(Math.abs(a!.width - c!.width)).toBeLessThan(0.5)
  expect(Math.abs(b!.y + b!.height + 8 - c!.y)).toBeLessThan(1.5)
  expect(Math.abs(a!.y + a!.height + 8 - b!.y)).toBeLessThan(1.5)
  // 最新的那条贴着原来的位置不动。
  expect(Math.abs(c!.y + c!.height - (collapsedFront!.y + collapsedFront!.height))).toBeLessThan(1.5)
  for (const index of [0, 1, 2]) expect(await opacity(items(page).nth(index))).toBe(1)
  await page.mouse.move(2, 2)
  await expect(region(page)).not.toHaveAttribute('data-expanded', '')
  const [, , after] = await settled(page, 3)
  expect(after!.height).toBe(collapsedFront!.height)
  expect(await opacity(items(page).nth(0))).toBeLessThan(1)
})

const dragRight = async (page: Page, target: Locator, fraction: number) => {
  const box = (await target.boundingBox())!
  const y = box.y + 12
  const x = box.x + 40
  await page.mouse.move(x, y)
  await page.mouse.down()
  const steps = 8
  for (let i = 1; i <= steps; i++) await page.mouse.move(x + (box.width * fraction * i) / steps, y)
  // 松手前停一下，让速度归零：测的是「拖过多远」，不是甩。
  await page.waitForTimeout(150)
  await page.mouse.up()
}

test('ToastStack：往右拖最下面那条过半，它滑走，其余补位；拖得不够弹回', async ({ page }) => {
  await open(page, 'toast-stack')
  await pushThree(page)
  await items(page)
    .nth(2)
    .hover({ position: { x: 40, y: 10 } })
  const [, , front] = await settled(page, 3)
  const second = items(page).nth(1)

  // 不够：拖 20% 松手，弹回原位，条数不变。
  await dragRight(page, items(page).nth(2), 0.2)
  await expect(items(page)).toHaveCount(3)
  await expect.poll(async () => Math.round((await boxes(page))[2]!.x)).toBe(Math.round(front!.x))

  // 过半：拖 60% 松手。它滑走，条数 3 → 2，剩下的补位：次新的那条落到最前面的位置。
  await dragRight(page, items(page).nth(2), 0.6)
  await expect(items(page)).toHaveCount(2)
  await expect(region(page).getByText('告警 3')).toHaveCount(0)
  await expect(second.locator('[data-slot="toast-title"]')).toContainText('告警 2')
  await page.mouse.move(2, 2)
  const [, now] = await settled(page, 2)
  expect(Math.abs(now!.y + now!.height - (front!.y + front!.height))).toBeLessThan(1.5)
})

test('ToastStack：点「撤销」，那一条原地变成功态，不新增条目，过一会儿自己消失', async ({ page }) => {
  await open(page, 'toast-stack')
  await page.getByRole('button', { name: '推一条带撤销的' }).click()
  await page.mouse.move(2, 2)
  const item = items(page).first()
  await expect(items(page)).toHaveCount(1)
  await expect(item.locator('[data-slot="toast"]')).toHaveAttribute('data-tone', 'neutral')
  await item.getByRole('button', { name: '撤销' }).click()
  await page.mouse.move(2, 2)
  await expect(items(page)).toHaveCount(1) // 不新增
  await expect(item.locator('[data-slot="toast-title"]')).toHaveText('已恢复')
  await expect(item.locator('[data-slot="toast"]')).toHaveAttribute('data-tone', 'ok')
  await expect(item.getByRole('button', { name: '撤销' })).toHaveCount(0)
  // 点完以后焦点没有丢：落在同一条的关闭钮上。
  await expect(item.getByRole('button', { name: '关掉这条提示' })).toBeFocused()
  // 结果态停 2.4 秒后自己收。
  await expect(items(page)).toHaveCount(0, { timeout: 6000 })
})

test('ToastStack：Tab 进叠层就展开，能用键盘点到每条的钮', async ({ page }) => {
  await open(page, 'toast-stack')
  for (let i = 0; i < 3; i++) await page.getByRole('button', { name: '推一条带撤销的' }).click()
  await page.mouse.move(2, 2)
  await settled(page, 3)
  await expect(region(page)).not.toHaveAttribute('data-expanded', '')
  await page.getByRole('button', { name: '清空' }).focus()
  await page.keyboard.press('Tab')
  await expect(region(page)).toHaveAttribute('data-expanded', '')
  // 依次 Tab：每条的「撤销」与关闭钮都走得到（共 6 个钮）。
  const seen: string[] = []
  for (let i = 0; i < 6; i++) {
    seen.push(
      await page.evaluate(() => {
        const el = document.activeElement
        return `${el?.getAttribute('aria-label') ?? el?.textContent}|${el?.closest('[data-toast-id]')?.getAttribute('data-toast-id')}`
      }),
    )
    await page.keyboard.press('Tab')
  }
  expect(seen.filter((s) => s.startsWith('撤销')).length).toBe(3)
  expect(seen.filter((s) => s.startsWith('关掉这条提示')).length).toBe(3)
  expect(new Set(seen.map((s) => s.split('|')[1])).size).toBe(3)
  // 走出叠层，收回。
  await expect(region(page)).not.toHaveAttribute('data-expanded', '')
  // 回到第二条的「撤销」，Enter：原地变结果态。
  await page.keyboard.press('Shift+Tab') // 回到最后一个钮之后的上一个
  await expect(items(page)).toHaveCount(3)
  const second = items(page).nth(1)
  await second.getByRole('button', { name: '撤销' }).focus()
  await page.keyboard.press('Enter')
  await expect(second.locator('[data-slot="toast-title"]')).toHaveText('已恢复')
  await expect(items(page)).toHaveCount(3)
})

test('ToastStack：展开时暂停计时，走开后接着走', async ({ page }) => {
  await open(page, 'toast-stack')
  await page.getByRole('button', { name: '推一条（2 秒后收）' }).click()
  await items(page)
    .first()
    .hover({ position: { x: 40, y: 10 } })
  await page.waitForTimeout(3000) // 过了 2 秒，指针在上面，还在
  await expect(items(page)).toHaveCount(1)
  await page.mouse.move(2, 2)
  await expect(items(page)).toHaveCount(0, { timeout: 4000 })
})

test('ToastStack：超过 5 条，最旧的先收', async ({ page }) => {
  await open(page, 'toast-stack')
  for (let i = 0; i < 7; i++) await page.getByRole('button', { name: '推一条', exact: true }).click()
  await page.mouse.move(2, 2)
  await expect(items(page)).toHaveCount(5)
  await expect(region(page).getByText('告警 1：')).toHaveCount(0)
  await expect(region(page).getByText('告警 7：')).toHaveCount(1)
})

test('ToastStack：减弱动效时不缩放、不滑，收拢只留最前面一条，拖动不关', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await open(page, 'toast-stack')
  await pushThree(page)
  const scales = await items(page).evaluateAll((els) => els.map((el) => getComputedStyle(el).transform))
  for (const transform of scales) expect(['none', 'matrix(1, 0, 0, 1, 0, 0)']).toContain(transform)
  expect(await opacity(items(page).nth(2))).toBe(1)
  expect(await opacity(items(page).nth(1))).toBe(0)
  expect(await opacity(items(page).nth(0))).toBe(0)
  await items(page)
    .nth(2)
    .hover({ position: { x: 40, y: 10 } })
  await expect.poll(() => opacity(items(page).nth(0))).toBe(1)
  await dragRight(page, items(page).nth(2), 0.7)
  await page.waitForTimeout(500)
  await expect(items(page)).toHaveCount(3)
})

test('ToastStack：受控——条目表在调用方手里，关一条、压一条都经 onItemsChange', async ({ page }) => {
  await open(page, 'toast-stack')
  const count = page.getByTestId('controlled-count')
  await expect(count).toContainText('3 条')
  await page.getByRole('button', { name: '调用方压一条' }).click()
  await expect(count).toContainText('4 条')
  const controlled = page.getByRole('region', { name: '受控的叠放提示演示' })
  // 上角：DOM 次序是视觉次序，最新的在最上、排第一。
  await controlled
    .locator('[data-slot="toast-stack-item"]')
    .first()
    .hover({ position: { x: 40, y: 10 } })
  await controlled.getByRole('button', { name: '关掉这条提示' }).first().click()
  await expect(count).toContainText('3 条')
})
