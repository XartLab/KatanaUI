// SPDX-License-Identifier: MIT
import { expect, test, type Page } from '@playwright/test'

// FloatingWindow 悬浮窗（#245 模块 2）：在文档站的页上真点真拖。两条路径都走：
// 没有 Document Picture-in-Picture 时的页内浮层（删掉 API），和有 PiP 时的真小窗（桩一个 requestWindow，返回真的弹出窗口，样式复制、点击、关窗都是真的）。

test.use({ viewport: { width: 1100, height: 900 } })

const open = async (page: Page) => {
  await page.goto('/?theme=graphite#/floating-window')
  const area = page.locator('[data-gallery="floating-window"]')
  await area.waitFor()
  return area
}

test('FloatingWindow：没有 PiP 时是页内浮层——顶层、可拖、方向键移动、Esc 与关闭钮关，内容与状态回到原处', async ({
  page,
}) => {
  await page.addInitScript(() => {
    // Chrome 里它是 window 上的只读属性，赋值与 delete 都无效：用 defineProperty 盖成 undefined，件按「取不到 API」处理。
    Object.defineProperty(window, 'documentPictureInPicture', { value: undefined, configurable: true })
  })
  const area = await open(page)
  const toggle = area.getByRole('button', { name: '在悬浮窗中交易' })
  await expect(area.getByRole('button', { name: '买入' })).toBeVisible() // 原处
  await toggle.click()

  const layer = page.getByRole('dialog', { name: '下单' })
  await expect(layer).toBeVisible()
  await expect(layer.getByRole('button', { name: '买入' })).toBeVisible() // 内容搬进浮层
  await expect(area.getByText('下单区已在悬浮窗中。')).toBeVisible() // 原位是占位
  await expect(area.getByRole('button', { name: '放回原处' })).toHaveAttribute('aria-pressed', 'true')
  expect(await layer.evaluate((el) => el.matches(':popover-open'))).toBe(true) // 进了浏览器顶层
  await expect(layer).toHaveCSS('position', 'fixed')

  // 子树没有重挂载：在浮层里改的输入与点的计数，关窗后还在。
  await layer.getByRole('textbox', { name: '价格' }).fill('95000')
  await layer.getByRole('button', { name: '买入' }).click()
  await expect(layer.getByText('已下 1 单')).toBeVisible()

  // 拖标题栏：位置变了，且没出视口。
  const handle = layer.getByRole('button', { name: /移动悬浮窗/ })
  const before = (await layer.boundingBox())!
  const bar = (await handle.boundingBox())!
  await page.mouse.move(bar.x + 20, bar.y + 10)
  await page.mouse.down()
  await page.mouse.move(bar.x - 180, bar.y - 140, { steps: 4 })
  await page.mouse.up()
  const dragged = (await layer.boundingBox())!
  expect(Math.round(before.x - dragged.x)).toBe(200)
  expect(Math.round(before.y - dragged.y)).toBe(150)
  // 往视口外拖：夹在边上。
  await page.mouse.move(dragged.x + 20, dragged.y + 10)
  await page.mouse.down()
  await page.mouse.move(-500, -500, { steps: 4 })
  await page.mouse.up()
  const clamped = (await layer.boundingBox())!
  expect([Math.round(clamped.x), Math.round(clamped.y)]).toEqual([0, 0])

  // 方向键：8px，Shift 32px。
  await handle.focus()
  await page.keyboard.press('ArrowRight')
  expect(Math.round((await layer.boundingBox())!.x)).toBe(8)
  await page.keyboard.press('Shift+ArrowDown')
  expect(Math.round((await layer.boundingBox())!.y)).toBe(32)

  // Esc 关：内容回到原处，输入与计数还在。
  await page.keyboard.press('Escape')
  await expect(layer).toHaveCount(0)
  await expect(area.getByText('下单区已在悬浮窗中。')).toHaveCount(0)
  await expect(area.getByRole('textbox', { name: '价格' })).toHaveValue('95000')
  await expect(area.getByText('已下 1 单')).toBeVisible()
  await expect(toggle).toHaveAttribute('aria-pressed', 'false')

  // 关闭钮也能关。
  await toggle.click()
  await page.getByRole('button', { name: '关闭悬浮窗' }).click()
  await expect(page.getByRole('dialog', { name: '下单' })).toHaveCount(0)
  await expect(area.getByText('已下 1 单')).toBeVisible()
})

test('FloatingWindow：页内浮层里焦点在内容的输入框上，按 Esc 也能关窗，内容回到原处', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'documentPictureInPicture', { value: undefined, configurable: true })
  })
  const area = await open(page)
  await area.getByRole('button', { name: '在悬浮窗中交易' }).click()
  const layer = page.getByRole('dialog', { name: '下单' })
  const price = layer.getByRole('textbox', { name: '价格' })
  await price.fill('95000')
  await price.focus() // 子树经 portal 挂在浮层里：焦点在这里，不在标题栏或关闭钮上
  await expect(price).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(layer).toHaveCount(0)
  await expect(area.getByRole('textbox', { name: '价格' })).toHaveValue('95000')
  await expect(area.getByRole('button', { name: '在悬浮窗中交易' })).toHaveAttribute('aria-pressed', 'false')
})

test('FloatingWindow：有 PiP 时开真小窗——样式与主题复制过去、窗里点击回到主页面的状态、关窗内容回到原处', async ({
  page,
}) => {
  await page.addInitScript(() => {
    const w = window as unknown as { __pipCalls?: unknown[] }
    w.__pipCalls = []
    Object.defineProperty(window, 'documentPictureInPicture', {
      configurable: true,
      value: {
        requestWindow: async (options: unknown) => {
          w.__pipCalls!.push(options)
          // 弹出窗口代替 PiP 窗：同源、空文档、能关，行为够用。
          return window.open('', 'katana-pip', 'popup,width=340,height=240')!
        },
      },
    })
  })
  await page.goto('/?theme=console#/floating-window') // 主题用 console：验证 data-theme 被复制
  const area = page.locator('[data-gallery="floating-window"]')
  await area.waitFor()

  const popupOpened = page.waitForEvent('popup')
  await area.getByRole('button', { name: '在悬浮窗中交易' }).click()
  const popup = await popupOpened
  await popup.waitForLoadState()

  expect(await page.evaluate(() => (window as unknown as { __pipCalls: unknown[] }).__pipCalls)).toEqual([
    { width: 340, height: 240 },
  ])
  await expect(popup).toHaveTitle('下单')
  // 子树搬进了小窗，原处是占位，没有页内浮层。
  await expect(popup.getByRole('button', { name: '买入' })).toBeVisible()
  await expect(area.getByText('下单区已在悬浮窗中。')).toBeVisible()
  await expect(page.getByRole('dialog', { name: '下单' })).toHaveCount(0)
  await expect(area.locator('[data-slot="floating-window"]')).toHaveAttribute('data-mode', 'pip')

  // 样式与主题：根元素带 data-theme=console，token 变量读得到，按钮真的有皮肤（不是浏览器默认）。
  expect(await popup.evaluate(() => document.documentElement.dataset.theme)).toBe('console')
  expect(
    await popup.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--bg-300').trim()),
  ).not.toBe('')
  const skinned = await popup.getByRole('button', { name: '买入' }).evaluate((el) => {
    const style = getComputedStyle(el)
    return { radius: style.borderRadius, height: style.height }
  })
  expect(skinned.height).toBe('30px')
  expect(skinned.radius).not.toBe('0px')

  // 窗里点击：React 事件在小窗的文档里照常触发，状态在主页面的树里。
  await popup.getByRole('button', { name: '买入' }).click()
  await expect(popup.getByText('已下 1 单')).toBeVisible()

  // 主文档切主题：小窗的 data-theme 跟着变。
  await page.evaluate(() => {
    document.documentElement.dataset.theme = 'graphite'
  })
  await expect.poll(() => popup.evaluate(() => document.documentElement.dataset.theme)).toBe('graphite')

  // 用户关小窗：onClose → 内容回到原处，计数还在。
  await popup.close()
  await expect(area.getByText('下单区已在悬浮窗中。')).toHaveCount(0)
  await expect(area.getByText('已下 1 单')).toBeVisible()
  await expect(area.getByRole('button', { name: '在悬浮窗中交易' })).toHaveAttribute('aria-pressed', 'false')
})

test('FloatingWindow：PiP 请求被拒（比如没有刚操作过）就退到页内浮层', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'documentPictureInPicture', {
      configurable: true,
      value: { requestWindow: () => Promise.reject(new DOMException('no activation', 'NotAllowedError')) },
    })
  })
  const area = await open(page)
  await area.getByRole('button', { name: '在悬浮窗中交易' }).click()
  await expect(page.getByRole('dialog', { name: '下单' })).toBeVisible()
  await expect(area.locator('[data-slot="floating-window"]')).toHaveAttribute('data-mode', 'overlay')
})
