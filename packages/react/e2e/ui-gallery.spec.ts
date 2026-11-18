// SPDX-License-Identifier: MIT
import { expect, test, type Locator, type Page } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { summarize, type CoverageMap } from '../docs/coverage-core'
import coverageMap from '../docs/coverage-map.json' with { type: 'json' }
import propsGenerated from '../gallery/props.generated.json' with { type: 'json' }
import aiGuidance from '../gallery/guidance/ai'
import blocksGuidance from '../gallery/guidance/blocks'
import feedbackGuidance from '../gallery/guidance/feedback'
import formsGuidance from '../gallery/guidance/forms'
import layoutGuidance from '../gallery/guidance/layout'
import overlaysGuidance from '../gallery/guidance/overlays'
import quantGuidance from '../gallery/guidance/quant'
import quotesGuidance from '../gallery/guidance/quotes'
import readoutsGuidance from '../gallery/guidance/readouts'
import motionFxGuidance from '../gallery/guidance/motion-fx'
import motionTextGuidance from '../gallery/guidance/motion-text'
import smoothuiBGuidance from '../gallery/guidance/smoothui-b'
import { GROUPS, PAGES } from '../gallery/registry'

// 指南按组分文件；gallery/guidance/index.ts 用 import.meta.glob 合并（Vite 才有），Playwright 的 Node 里没有，这里逐个引进来合并。
const GUIDANCE: Record<string, { use?: readonly string[]; avoid?: readonly string[] }> = Object.assign(
  {},
  aiGuidance,
  blocksGuidance,
  feedbackGuidance,
  formsGuidance,
  layoutGuidance,
  overlaysGuidance,
  quantGuidance,
  quotesGuidance,
  readoutsGuidance,
  smoothuiBGuidance,
  motionTextGuidance,
  motionFxGuidance,
)
const guidanceOf = (id: string) => GUIDANCE[id] ?? {}

// @katana-ui/react 的组件文档站（packages/react/gallery，入口 index.html，#1838、#1860）：在真浏览器里看用户看到的。
// 每个件在 Console 与 Graphite 两个主题下各跑一遍：看得见、有尺寸；悬停与按下底色真的变；勾选与开关点了翻转；
// 菜单键盘 ↓ Enter 选中、子菜单 → 开 ← 关、位置对；对话框 Esc 关、焦点回到触发处；Tailwind 的类压得过旧样式；入场动效是我们的。
//（#1777 的 components-gallery.spec.ts 里基础件与动效的断言并到这里；任务清单样板没有搬，它的断言一并去掉。）

test.use({ viewport: { width: 1100, height: 1500 } })

const THEMES = ['console', 'graphite'] as const

// 文档站（#1860）：一页一个组件，地址 #/<件名>，预览容器带 data-gallery=<件名>。?theme= 指定主题（不带是 Graphite）。
const open = async (page: Page, theme: (typeof THEMES)[number], id = 'button') => {
  await page.goto(`/?theme=${theme}#/${id}`)
  await page.locator(`[data-gallery="${id}"]`).waitFor()
  await expect(page.locator('html')).toHaveAttribute('data-theme', theme)
}
/** 换到另一页：点左侧目录的链接（单页应用，不重载，主题与页面状态都留着）。 */
/** 目录（SideNav）里某一页的链接：可见名是「Button 按钮」这类展示名，按地址找；限定 .k-sidenav-link，顶上品牌面包屑也指向第一页，不限定会撞上。 */
const navLink = (page: Page, id: string) =>
  page.getByRole('navigation', { name: '文档目录' }).locator(`a.k-sidenav-link[href="#/${id}"]`)
/** 组件页的页签：示例 / 怎么用 / 无障碍 / 属性，切过去才有那一页签里的内容（别的页签的面板不渲染）。 */
const docTab = (page: Page, name: '示例' | '怎么用' | '无障碍' | '属性') =>
  page.getByRole('tablist', { name: '这一页的内容' }).getByRole('tab', { name }).click()
const show = async (page: Page, id: string) => {
  await navLink(page, id).click()
  await page.locator(`[data-gallery="${id}"]`).waitFor()
}
const section = (page: Page, id: string) => page.locator(`[data-gallery="${id}"]`)
/** 热图工具条的下拉：点开名为 label 的下拉，选名为 option 的项。 */
const heatPick = async (page: Page, map: Locator, label: string, option: string) => {
  await map.getByRole('combobox', { name: label }).click()
  await page.getByRole('option', { name: option, exact: true }).click()
  // 选完焦点回到触发器（Radix 异步还）：等它回来，后面的键盘操作才不被抢走焦点。
  // 换数据集会让热图整个重建，焦点没处还，不等。
  if (label !== '数据集') await expect(map.getByRole('combobox', { name: label })).toBeFocused()
}
const bg = (locator: Locator) => locator.evaluate((element) => getComputedStyle(element).backgroundColor)
const token = (page: Page, name: string) =>
  page.evaluate((variable) => {
    const probe = document.createElement('i')
    probe.style.backgroundColor = `var(${variable})`
    document.body.append(probe)
    const color = getComputedStyle(probe).backgroundColor
    probe.remove()
    return color
  }, name)
const radius = (page: Page, name: string) =>
  page.evaluate((variable) => {
    const probe = document.createElement('i')
    probe.style.borderTopLeftRadius = `var(${variable})`
    document.body.append(probe)
    const value = getComputedStyle(probe).borderTopLeftRadius
    probe.remove()
    return value
  }, name)
/** 任何 CSS 颜色写法（rgb、oklab、color-mix 的结果）统一画到一个像素上读出 [r, g, b, a]：Tailwind 的 border-white/7 算出来是 oklab，旧 CSS 写的是 rgba，同一个颜色。 */
const rgba = (page: Page, color: string) =>
  page.evaluate((value) => {
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = 1
    const context = canvas.getContext('2d', { willReadFrequently: true })!
    context.fillStyle = value
    context.fillRect(0, 0, 1, 1)
    const [r, g, b, a] = context.getImageData(0, 0, 1, 1).data
    return [r, g, b, Math.round((a! / 255) * 100) / 100]
  }, color)
/** 把一条 CSS 声明（可以带 var()）放到探针上，读它算出来的值（fontSize：em 单位的值按这个字号算，字距就是）：旧皮肤写的是 token，和菜单上算出来的比。 */
const resolved = (page: Page, property: string, value: string, fontSize = '') =>
  page.evaluate(
    ([property, value, fontSize]) => {
      const probe = document.createElement('i')
      if (fontSize) probe.style.fontSize = fontSize
      probe.style.setProperty(property!, value!)
      document.body.append(probe)
      const out = getComputedStyle(probe).getPropertyValue(property!)
      probe.remove()
      return out
    },
    [property, value, fontSize],
  )
/** 一个元素某条属性算出来的颜色，画到一个像素上读成 [r, g, b, a]（color-mix 的结果可能是 color(srgb …)，直接比字符串不稳）。 */
const colorAt = (page: Page, locator: Locator, property: string) =>
  locator
    .evaluate((element, name) => getComputedStyle(element).getPropertyValue(name), property)
    .then((value) => rgba(page, value))
const settled = (page: Page) =>
  page.waitForFunction(() => document.getAnimations().every((a) => a.playState !== 'running'))

/**
 * 入场中途取样：弹层一出现就把入场动画停在 15% 处，读那一帧的 opacity 与 translate，再让它走完。
 * 只看 animation-name 和放完的样子，keyframes 改空也绿；这里量的是动画真的在动。（opacity 取 0 与 1 之间，上移量取 0 与起点之间。）
 */
const armMidFrame = (page: Page, selector: string, animationName: string) =>
  page.evaluate(
    ([selector, animationName]) => {
      const w = window as unknown as { __mid?: unknown }
      w.__mid = undefined
      const observer = new MutationObserver(() => {
        const el = document.querySelector<HTMLElement>(selector)
        const animation = el?.getAnimations().find((a) => (a as CSSAnimation).animationName === animationName)
        if (!el || !animation) return
        observer.disconnect()
        animation.pause()
        animation.currentTime = Number(animation.effect!.getComputedTiming().duration) * 0.15
        const style = getComputedStyle(el)
        const lift = /([\d.]+)px\)?\s*$/.exec(style.translate)
        w.__mid = { opacity: Number(style.opacity), lift: lift ? Number(lift[1]) : null, translate: style.translate }
        animation.finish()
      })
      observer.observe(document.body, { childList: true, subtree: true, attributes: true })
    },
    [selector, animationName],
  )
const midFrame = async (page: Page) => {
  const handle = await page.waitForFunction(() => (window as unknown as { __mid?: unknown }).__mid)
  return (await handle.jsonValue()) as { opacity: number; lift: number | null; translate: string }
}

/**
 * 逐帧采样（#1861）：在页面里开一个 requestAnimationFrame 采样，采 ms 毫秒，返回每一帧读到的值。先调它、再做动作、再 await 它：
 * 动作发生在采样中间，断言看到的是动效中途的样子，不是起点与终点。读什么由 kind 定：
 * attr 一个属性；angle 元素当前的旋转角（度）；width 元素宽；count 匹配元素的个数；dash 笔画的 stroke-dasharray 第一个数（motion 的 pathLength 写在这里）；bgx 背景位置的横向值；
 * x、y 元素左上角的位置；bgw 背景图尺寸的横向值（百分数，第二批的划线用它）。
 */
type SampleSpec =
  | { kind: 'attr'; selector: string; name: string }
  | { kind: 'angle' | 'width' | 'count' | 'dash' | 'bgx' | 'x' | 'y' | 'bgw'; selector: string }
function sample(page: Page, spec: Extract<SampleSpec, { kind: 'attr' }>, ms: number): Promise<string[]>
function sample(page: Page, spec: Exclude<SampleSpec, { kind: 'attr' }>, ms: number): Promise<number[]>
function sample(page: Page, spec: SampleSpec, ms: number): Promise<(string | number)[]> {
  return page.evaluate(
    ({ spec, ms }) =>
      new Promise<(string | number)[]>((resolve) => {
        const out: (string | number)[] = []
        const start = performance.now()
        const read = (): string | number => {
          if (spec.kind === 'count') return document.querySelectorAll(spec.selector).length
          const el = document.querySelector<SVGElement | HTMLElement>(spec.selector)
          if (!el) return Number.NaN
          if (spec.kind === 'attr') return el.getAttribute(spec.name) ?? ''
          if (spec.kind === 'width') return Math.round(el.getBoundingClientRect().width * 10) / 10
          if (spec.kind === 'dash') return Number.parseFloat(el.getAttribute('stroke-dasharray') ?? '1')
          if (spec.kind === 'bgx') return Number.parseFloat(getComputedStyle(el).backgroundPositionX)
          if (spec.kind === 'bgw') return Number.parseFloat(getComputedStyle(el).backgroundSize)
          if (spec.kind === 'x') return Math.round(el.getBoundingClientRect().x * 10) / 10
          if (spec.kind === 'y') return Math.round(el.getBoundingClientRect().y * 10) / 10
          const matrix = new DOMMatrix(getComputedStyle(el).transform)
          return Math.round(Math.atan2(matrix.b, matrix.a) * (180 / Math.PI) * 100) / 100
        }
        const tick = () => {
          out.push(read())
          if (performance.now() - start < ms) requestAnimationFrame(tick)
          else resolve(out)
        }
        tick()
      }),
    { spec, ms },
  )
}

for (const theme of THEMES) {
  test.describe(`组件文档站 · ${theme}`, () => {
    test('每一页的预览都看得见、有尺寸，每个能点的件都有尺寸，页上没有报错', async ({ page }) => {
      // 要逐页点目录、量尺寸，页数过百，默认 30 秒不够。
      test.setTimeout(300_000) // 页数已过 230，逐页走一遍约 1.7 分钟
      const errors: string[] = []
      page.on('pageerror', (error) => errors.push(error.message))
      page.on('console', (message) => message.type() === 'error' && errors.push(message.text()))
      await open(page, theme, PAGES[0].id)
      // 每个能点的件：按钮、勾选、开关、触发器、页签、折叠标题，逐个量尺寸。
      const selector =
        '[data-slot="button"], [data-slot="checkbox"], [data-slot="switch"], [data-slot="dropdown-menu-trigger"], [data-slot="tabs-trigger"], [data-slot="accordion-trigger"]'
      let count = 0
      for (const { id } of PAGES) {
        await show(page, id)
        const box = await section(page, id).boundingBox()
        expect(box?.width, `${id} 的宽`).toBeGreaterThan(200)
        expect(box?.height, `${id} 的高`).toBeGreaterThan(40)
        const controls = section(page, id).locator(selector)
        const here = await controls.count()
        count += here
        for (let index = 0; index < here; index++) {
          const controlBox = await controls.nth(index).boundingBox()
          expect(controlBox && controlBox.width > 0 && controlBox.height > 0, `${id} 第 ${index} 个控件有尺寸`).toBe(
            true,
          )
        }
      }
      expect(count).toBeGreaterThan(25)
      // 提示默认开着：里面有字、有底色。
      await show(page, 'tooltip')
      const tip = page.locator('[data-slot="tooltip-content"]')
      await expect(tip).toBeVisible()
      expect(await bg(tip)).not.toBe('rgba(0, 0, 0, 0)')
      expect(errors).toEqual([])
    })

    test('按钮：Tailwind 的类压得过旧样式；悬停和按下底色各变一次；禁用的不响应', async ({ page }) => {
      await open(page, theme, 'button')
      const button = section(page, 'button').getByRole('button', { name: 'default', exact: true })
      // 30 高、圆角取 token（不是浏览器原生按钮的样子：没有灰底、没有 2px 凸边框）。
      expect(Math.round((await button.boundingBox())!.height)).toBe(30)
      await expect(button).toHaveCSS('border-top-width', '1px')
      // 字号档 k-text-data（tokens.css：500 12px/16px）。档类被 cn 误删时按钮会退回祖先的 13px/400。
      await expect(button).toHaveCSS('font-size', '12px')
      await expect(button).toHaveCSS('font-weight', '500')
      const rest = await bg(button)
      expect(rest).toMatch(/\/ 0\.04\)$|, 0\.04\)$/)
      await button.hover()
      await settled(page)
      const hover = await bg(button)
      expect(hover).not.toBe(rest)
      await page.mouse.down()
      await settled(page)
      const pressed = await bg(button)
      expect(pressed).not.toBe(hover)
      await expect(button).toHaveCSS('scale', '0.97')
      await page.mouse.up()
      // 主按钮的底是主题的 ink-100，两个主题各一个色；
      const primary = section(page, 'button').getByRole('button', { name: 'primary', exact: true })
      const ink = await token(page, '--ink-100')
      expect(await bg(primary)).toBe(ink)
      // 禁用的：悬停也不变底色。
      const disabled = section(page, 'button').getByRole('button', { name: 'default 禁用' })
      await expect(disabled).toBeDisabled()
      const before = await bg(disabled)
      await disabled.hover({ force: true })
      await settled(page)
      expect(await bg(disabled)).toBe(before)
    })

    test('按钮的密度：default 高 26 / 30 / 36、左内距 8 / 12 / 16，图标按钮 24 / 28 / 36（#1943）', async ({
      page,
    }) => {
      await open(page, theme, 'button')
      for (const [density, height, left, icon] of [
        ['high', '26px', '8px', '24px'],
        ['medium', '30px', '12px', '28px'],
        ['low', '36px', '16px', '36px'],
      ] as const) {
        const row = section(page, 'button').locator(`[data-density="${density}"]`)
        const plain = row.getByRole('button', { name: `default · ${density}` })
        await expect(plain).toBeVisible()
        await expect(plain).toHaveCSS('height', height)
        await expect(plain).toHaveCSS('padding-left', left)
        const iconButton = row.getByRole('button', { name: `icon · ${density}` })
        await expect(iconButton).toHaveCSS('width', icon)
        await expect(iconButton).toHaveCSS('height', icon)
      }
      // 默认密度（不挂 data-density）下的按钮与 medium 一样：30 高。
      await expect(section(page, 'button').getByRole('button', { name: 'default', exact: true })).toHaveCSS(
        'height',
        '30px',
      )
    })

    test('键盘 Tab 到按钮有焦点环（取 --focus-ring，2px）', async ({ page }) => {
      await open(page, theme)
      // 点一下预览卡的内边距（把键盘的起点放在预览里；页头的源码链接、页签都排在预览前面，从标题起 Tab 会先落到它们），再按 Tab：落到第一个按钮上（键盘到达的焦点才画焦点环）。
      await section(page, 'button').click({ position: { x: 4, y: 4 } })
      await page.keyboard.press('Tab')
      const focused = page.locator(':focus')
      await expect(focused).toHaveAttribute('data-slot', 'button')
      await expect(focused).toHaveCSS('outline-style', 'solid')
      await expect(focused).toHaveCSS('outline-width', '2px')
      const ring = await page.evaluate(() => {
        const probe = document.createElement('i')
        probe.style.color = 'var(--focus-ring)'
        document.body.append(probe)
        const color = getComputedStyle(probe).color
        probe.remove()
        return color
      })
      await expect(focused).toHaveCSS('outline-color', ring)
    })

    test('勾选与开关：点了翻转，开关的圆钮真的挪过去，轨道换成亮中性（不是品牌橙）', async ({ page }) => {
      await open(page, theme, 'checkbox')
      const boxes = section(page, 'checkbox')
      const check = boxes.getByRole('checkbox', { name: '未勾', exact: true })
      await expect(check).toHaveAttribute('aria-checked', 'false')
      const checkRest = await bg(check)
      await check.click()
      await expect(check).toHaveAttribute('aria-checked', 'true')
      await settled(page)
      expect(await bg(check)).not.toBe(checkRest)
      // 组件卡的样子：勾上后中心一块 6 × 6 的深色方块，框是亮中性（ink-100）底，不是勾，也不是橙。
      const led = check.locator('[data-slot="checkbox-indicator"]')
      const ledBox = (await led.boundingBox())!
      const checkBox = (await check.boundingBox())!
      expect([Math.round(checkBox.width), Math.round(checkBox.height)]).toEqual([14, 14])
      expect([Math.round(ledBox.width), Math.round(ledBox.height)]).toEqual([6, 6])
      expect(Math.abs(ledBox.x + 3 - (checkBox.x + 7))).toBeLessThanOrEqual(0.5)
      expect(Math.abs(ledBox.y + 3 - (checkBox.y + 7))).toBeLessThanOrEqual(0.5)
      expect(await bg(led)).toBe(await token(page, '--bg-000'))
      expect(await bg(check)).toBe(await token(page, '--ink-100'))
      expect(await bg(check)).not.toBe(await token(page, '--signal-orange'))
      // 发光只给状态灯（Precision Instrument §9）：勾选的方块是控件的「选中」，不发光。
      await expect(led).toHaveCSS('box-shadow', 'none')
      await expect(check.locator('svg')).toHaveCount(0)
      await check.click()
      await expect(check).toHaveAttribute('aria-checked', 'false')
      // 键盘空格也能翻。
      await check.focus()
      await page.keyboard.press('Space')
      await expect(check).toHaveAttribute('aria-checked', 'true')

      await show(page, 'switch')
      const toggle = section(page, 'switch').getByRole('switch', { name: '关', exact: true })
      const thumb = toggle.locator('[data-slot="switch-thumb"]')
      const place = async () => (await thumb.boundingBox())!.x - (await toggle.boundingBox())!.x
      await expect(toggle).toHaveAttribute('aria-checked', 'false')
      const trackOf = toggle.locator('[data-slot="switch-track"]')
      const off = { x: await place(), track: await bg(trackOf) }
      await toggle.click()
      await expect(toggle).toHaveAttribute('aria-checked', 'true')
      await settled(page)
      // 圆钮右移 16px（轨道 34、圆钮 14、两边各留 2），轨道是强调色。
      expect(Math.round((await place()) - off.x)).toBe(16)
      const orange = await token(page, '--signal-orange')
      await page.mouse.move(0, 0)
      await settled(page)
      expect(await bg(trackOf)).toBe(await token(page, '--ink-100'))
      expect(await bg(trackOf)).not.toBe(orange)
      expect(await bg(trackOf)).not.toBe(off.track)
      // 外层盒 40 × 28（行高与焦点环按它，#1838 迁移不变），里面可见的轨道 34 × 18。
      const outer = (await toggle.boundingBox())!
      const track = (await trackOf.boundingBox())!
      expect([Math.round(outer.width), Math.round(outer.height)]).toEqual([40, 28])
      expect([Math.round(track.width), Math.round(track.height)]).toEqual([34, 18])
    })

    test('下拉菜单：键盘 ↓ Enter 选中；子菜单 → 开、← 关，位置照 #1832', async ({ page }) => {
      await open(page, theme, 'dropdown-menu')
      const trigger = section(page, 'dropdown-menu').getByRole('button', { name: '菜单', exact: true })
      const triggerBox = (await trigger.boundingBox())!
      await trigger.focus()
      await page.keyboard.press('Enter')
      const menu = page.getByRole('menu')
      await expect(menu).toBeVisible()
      // 顶层菜单：触发器下方 2px，行 30 高。
      await settled(page)
      const menuBox = (await menu.boundingBox())!
      expect(Math.round(menuBox.y - (triggerBox.y + triggerBox.height))).toBe(2)
      const first = menu.getByRole('menuitem', { name: '添加组件' })
      await expect(first).toBeFocused()
      expect(Math.round((await first.boundingBox())!.height)).toBe(30)
      // ↓ ↓ 走过已禁用的一项落到「显示网格」，Enter 选中：菜单收起、焦点回触发器、再开时它的勾没了。
      await page.keyboard.press('ArrowDown')
      await expect(menu.getByRole('menuitem', { name: '编辑布局' })).toBeFocused()
      await page.keyboard.press('ArrowDown')
      const grid = menu.getByRole('menuitemcheckbox', { name: '显示网格' })
      await expect(grid).toBeFocused()
      await expect(grid).toHaveAttribute('aria-checked', 'true')
      await page.keyboard.press('Enter')
      await expect(menu).toHaveCount(0)
      await expect(trigger).toBeFocused()
      await page.keyboard.press('Enter')
      await expect(first).toBeFocused()
      await expect(page.getByRole('menuitemcheckbox', { name: '显示网格' })).toHaveAttribute('aria-checked', 'false')
      // 单选：走到「紧凑」Enter，再开它被选中。
      const compact = page.getByRole('menuitemradio', { name: '紧凑' })
      for (const name of ['编辑布局', '显示网格', '正常', '紧凑']) {
        await page.keyboard.press('ArrowDown')
        await expect(
          page
            .getByRole('menuitem', { name })
            .or(page.getByRole('menuitemcheckbox', { name }))
            .or(page.getByRole('menuitemradio', { name })),
        ).toBeFocused()
      }
      await expect(compact).toBeFocused()
      await page.keyboard.press('Enter')
      await expect(menu).toHaveCount(0)
      // 同上：焦点回到触发器再按 Enter 重开（Radix 收完菜单才还焦点）
      await expect(trigger).toBeFocused()
      await page.keyboard.press('Enter')
      await expect(first).toBeFocused()
      await expect(page.getByRole('menuitemradio', { name: '紧凑' })).toHaveAttribute('aria-checked', 'true')

      // 子菜单：走到「更多」，→ 打开，第一项拿焦点；位置是父项（不是菜单边）右边 2px、第一项与父项同一行（alignOffset -7）。
      const parent = menu.getByRole('menuitem', { name: '更多' })
      for (const name of ['编辑布局', '显示网格', '正常', '紧凑']) {
        await page.keyboard.press('ArrowDown')
        await expect(
          page.getByRole(
            name === '显示网格' ? 'menuitemcheckbox' : name === '编辑布局' ? 'menuitem' : 'menuitemradio',
            { name },
          ),
        ).toBeFocused()
      }
      await page.keyboard.press('ArrowDown')
      await expect(parent).toBeFocused()
      await page.keyboard.press('ArrowRight')
      const sub = page.getByRole('menuitem', { name: '导出为图片' })
      await expect(sub).toBeVisible()
      await expect(sub).toBeFocused()
      await settled(page)
      const [parentBox, subBox, subMenuBox] = [
        (await page.locator('[data-slot="dropdown-menu-sub-trigger"]').boundingBox())!,
        (await sub.boundingBox())!,
        (await page.locator('[data-slot="dropdown-menu-sub-content"]').boundingBox())!,
      ]
      expect(Math.round(subMenuBox.x - (parentBox.x + parentBox.width))).toBe(2)
      // 实测差 1.25px（alignOffset -7 是 #1832 的值，边框与内边距合起来不是整 7），容差 1.5。
      expect(Math.abs(subBox.y - parentBox.y)).toBeLessThanOrEqual(1.5)
      // ← 关子菜单，焦点回到父项。
      await page.keyboard.press('ArrowLeft')
      await expect(sub).toHaveCount(0)
      await expect(parent).toBeFocused()
      await page.keyboard.press('Escape')
      await expect(menu).toHaveCount(0)
    })

    test('菜单皮肤：每个数一项项对旧皮肤（旧值取自 main 的 src/ui/ui.css，行号为 2026-11-13 的 ca7ef061）', async ({
      page,
    }) => {
      await open(page, theme, 'dropdown-menu')
      await section(page, 'dropdown-menu').getByRole('button', { name: '菜单', exact: true }).click()
      const menu = page.getByRole('menu')
      await expect(menu).toBeVisible()
      await settled(page)
      const css = (target: Locator, props: string[]) =>
        target.evaluate((element, names) => {
          const style = getComputedStyle(element)
          return Object.fromEntries(names.map((name) => [name, style.getPropertyValue(name)]))
        }, props)
      // 弹层：.k-pop（ui.css:453）。min-width 180（:454）· padding 6（:457）· 圆角 --radius-overlay（:460）· 底 --bg-400（:458）· 字色 --ink-200（:464）·
      // 边框 1px 7% 白（:459）· 阴影 0 16 48 + 0 2 8（:461-463）· 字号 body 13（:465）· line-height 1（:466）。
      const pop = await css(menu, [
        'min-width',
        'padding-top',
        'padding-left',
        'border-top-left-radius',
        'background-color',
        'color',
        'border-top-width',
        'border-top-color',
        'box-shadow',
        'font-size',
        'line-height',
      ])
      expect(pop['min-width']).toBe('180px')
      expect([pop['padding-top'], pop['padding-left']]).toEqual(['6px', '6px'])
      expect(pop['border-top-left-radius']).toBe(await radius(page, '--radius-overlay'))
      expect(pop['background-color']).toBe(await token(page, '--bg-400'))
      expect(pop.color).toBe(await token(page, '--ink-200'))
      expect(pop['border-top-width']).toBe('1px')
      expect(await rgba(page, pop['border-top-color']!)).toEqual(await rgba(page, 'rgba(255, 255, 255, 0.07)'))
      expect(pop['box-shadow']).toContain('rgba(0, 0, 0, 0.55) 0px 16px 48px 0px')
      expect(pop['box-shadow']).toContain('rgba(0, 0, 0, 0.3) 0px 2px 8px 0px')
      expect(pop['font-size']).toBe('13px')
      expect(pop['line-height']).toBe('13px')

      // 行：.k-pop-item（ui.css:487）。高 30（:492）· padding 0 8（:493）· 圆角 6（:494）· 间距 12（:491，来自 :474 的变量）· 不换行（:497）· 指针手形（:496）· 过渡 background-color、color 0.1s（:499-501）。
      const row = menu.getByRole('menuitem', { name: '编辑布局' })
      const item = await css(row, [
        'height',
        'padding-left',
        'padding-top',
        'border-top-left-radius',
        'column-gap',
        'white-space',
        'cursor',
        'display',
        'justify-content',
        'transition-property',
        'transition-duration',
        'color',
      ])
      expect(item.height).toBe('30px')
      expect([item['padding-left'], item['padding-top']]).toEqual(['8px', '0px'])
      expect(item['border-top-left-radius']).toBe('6px')
      expect(item['column-gap']).toBe('12px')
      expect([item['white-space'], item.cursor, item.display, item['justify-content']]).toEqual([
        'nowrap',
        'pointer',
        'flex',
        'space-between',
      ])
      expect(item['transition-property']).toBe('background-color, color')
      expect(item['transition-duration']).toBe('0.1s')
      expect(item.color).toBe(await token(page, '--ink-200'))

      // 悬停：[data-highlighted]（:503）4% 白底、字色 --ink-100（:504-505）。
      await row.hover()
      await expect(row).toHaveAttribute('data-highlighted', '')
      await page.waitForFunction(() => document.getAnimations().every((a) => a.playState !== 'running'))
      expect(await rgba(page, await bg(row))).toEqual(await rgba(page, 'rgba(255, 255, 255, 0.04)'))
      await expect(row).toHaveCSS('color', await token(page, '--ink-100'))

      // 禁用：[data-disabled]（:522）opacity .6 · 字色 --ink-300 · 手形 default（:523-526）。
      const disabled = await css(menu.getByRole('menuitem', { name: '已禁用的一项' }), ['opacity', 'color', 'cursor'])
      expect(disabled).toEqual({ opacity: '0.6', color: await token(page, '--ink-300'), cursor: 'default' })

      // 勾选行选中：[data-checked]（:518）字色 --ink-100（:519）· 500（:520）；勾选列 .k-pop-check（:562）宽 10（:564）· 色 --signal-orange（:565）· 字号 caption（:566）。
      const grid = menu.getByRole('menuitemcheckbox', { name: '显示网格' })
      const checked = await css(grid, ['color', 'font-weight'])
      expect(checked).toEqual({ color: await token(page, '--ink-100'), 'font-weight': '500' })
      const check = await css(grid.locator('.k-pop-check'), ['width', 'color', 'font-size'])
      expect(check.width).toBe('10px')
      expect(check.color).toBe(await token(page, '--ink-100'))
      expect(check['font-size']).toBe('11px')

      // 分隔线：.k-pop-sep（:568）高 1（:569）· 上下外边距 4、左右 -6（:570）· 7% 白（:571）。
      const sep = await css(menu.locator('.k-pop-sep').first(), [
        'height',
        'margin-top',
        'margin-left',
        'background-color',
      ])
      expect({ ...sep, 'background-color': await rgba(page, sep['background-color']!) }).toEqual({
        height: '1px',
        'margin-top': '4px',
        'margin-left': '-6px',
        'background-color': await rgba(page, 'rgba(255, 255, 255, 0.07)'),
      })

      // 分组小标题：.k-pop-group（:574）padding 8 8 4（:575）· --ink-200（:576）· micro 10 · sans 字族（:577）· line-height 1.5（:578）· 字距 --text-micro-tracking（:579）· 大写（:580）。
      const group = await css(menu.locator('.k-pop-group'), [
        'padding-top',
        'padding-left',
        'padding-bottom',
        'color',
        'font-size',
        'text-transform',
        'letter-spacing',
        'line-height',
        'font-family',
      ])
      expect(group).toEqual({
        'padding-top': '8px',
        'padding-left': '8px',
        'padding-bottom': '4px',
        color: await token(page, '--ink-200'),
        'font-size': '10px',
        'text-transform': 'uppercase',
        'letter-spacing': await resolved(page, 'letter-spacing', 'var(--text-micro-tracking)', '10px'),
        'line-height': '15px',
        'font-family': await resolved(page, 'font-family', 'var(--font-sans)'),
      })

      // 快捷键方块：.k-kbd（:586）min 宽 20 · 高 20 · padding 0 4 · 圆角 4 · 6% 白底 · 12% 白边 · 500。
      const kbd = await css(menu.locator('.k-kbd'), [
        'min-width',
        'height',
        'padding-left',
        'border-top-left-radius',
        'background-color',
        'border-top-color',
        'font-weight',
      ])
      expect({
        ...kbd,
        'background-color': await rgba(page, kbd['background-color']!),
        'border-top-color': await rgba(page, kbd['border-top-color']!),
      }).toEqual({
        'min-width': '20px',
        height: '20px',
        'padding-left': '4px',
        'border-top-left-radius': '4px',
        'background-color': await rgba(page, 'rgba(255, 255, 255, 0.06)'),
        'border-top-color': await rgba(page, 'rgba(255, 255, 255, 0.12)'),
        'font-weight': '500',
      })

      // 二级触发器行尾的箭头：.k-pop-more（:549）--ink-300（:552）· 13px（:558-560）。
      const arrow = menu.getByRole('menuitem', { name: '更多' }).locator('.k-pop-more')
      expect(await css(arrow, ['color'])).toEqual({ color: await token(page, '--ink-300') })
      const svg = (await arrow.locator('svg').boundingBox())!
      expect([Math.round(svg.width), Math.round(svg.height)]).toEqual([13, 13])
    })

    test('菜单入场：从触发处轻升（淡入加上移的弹簧），不是从中心长出来', async ({ page }) => {
      await open(page, theme, 'dropdown-menu')
      await armMidFrame(page, '[role="menu"]', 'kc-pop-in')
      await section(page, 'dropdown-menu').getByRole('button', { name: '菜单', exact: true }).click()
      const menu = page.getByRole('menu')
      await expect(menu).toBeVisible()
      // 中途那一帧：半透明、已经上移了一部分但还没到位（keyframes 是 opacity 0 → 1、translate 0 4px → 0）。
      const mid = await midFrame(page)
      expect(mid.opacity, '入场中途 opacity 在 0 与 1 之间').toBeGreaterThan(0)
      expect(mid.opacity).toBeLessThan(1)
      expect(mid.lift, `入场中途还差一点上移（translate: ${mid.translate}）`).toBeGreaterThan(0)
      expect(mid.lift).toBeLessThan(4)
      await expect(menu).toHaveCSS('animation-name', 'kc-pop-in')
      // 起点在触发处那一侧（Radix 的 --radix-popper-transform-origin），不是元素中心。
      expect(await menu.evaluate((el) => getComputedStyle(el).transformOrigin)).not.toBe('50% 50%')
      await settled(page)
      await expect(menu).toHaveCSS('opacity', '1')
      await expect(menu).toHaveCSS('scale', /^(none|1)$/)
    })

    test('右键菜单：右键开、行与皮肤同下拉菜单；→ 开二级、Esc 只关二级、再 Esc 关整个菜单', async ({ page }) => {
      await open(page, theme, 'context-menu')
      const area = page.locator('[data-gallery-ctx]')
      await area.click({ button: 'right' })
      const menu = page.getByRole('menu', { name: '面板菜单' })
      await expect(menu).toBeVisible()
      await settled(page)
      // 行 30 高，皮肤与下拉菜单一样（取同一份样式）。
      const row = menu.getByRole('menuitem', { name: '克隆面板' })
      expect(Math.round((await row.boundingBox())!.height)).toBe(30)
      await expect(menu).toHaveCSS('padding-top', '6px')
      expect(await menu.evaluate((el) => getComputedStyle(el).boxShadow)).toContain('rgba(0, 0, 0, 0.55) 0px 16px 48px')
      // 键盘：↓ 走到「更多」，→ 开二级（开在右边 2px），Esc 只关二级、焦点回到「更多」。
      await page.keyboard.press('ArrowDown')
      await expect(row).toBeFocused()
      await page.keyboard.press('ArrowDown')
      await expect(menu.getByRole('menuitemcheckbox', { name: '显示网格' })).toBeFocused()
      await page.keyboard.press('ArrowDown')
      const parent = menu.getByRole('menuitem', { name: '更多' })
      await expect(parent).toBeFocused()
      await page.keyboard.press('ArrowRight')
      const sub = page.getByRole('menuitem', { name: '导出为图片' })
      await expect(sub).toBeFocused()
      await settled(page)
      const parentBox = (await parent.boundingBox())!
      const subMenu = page.getByRole('menu', { name: '更多' })
      expect(Math.round((await subMenu.boundingBox())!.x - (parentBox.x + parentBox.width))).toBe(2)
      expect(Math.abs((await sub.boundingBox())!.y - parentBox.y)).toBeLessThanOrEqual(1.5)
      await page.keyboard.press('Escape')
      await expect(subMenu).toHaveCount(0)
      await expect(menu).toBeVisible()
      await expect(parent).toBeFocused()
      await page.keyboard.press('Escape')
      await expect(menu).toHaveCount(0)
    })

    test('菜单项的 onSelect 一次点击只叫一次（下拉、右键、二级里的项）', async ({ page }) => {
      await open(page, theme, 'dropdown-menu')
      const calls = async () => JSON.parse((await page.locator('[data-gallery-calls]').textContent()) ?? '{}')
      // 下拉：鼠标点。Radix 在 pointerup 上选中，后到的 click 不该再叫一次。
      await section(page, 'dropdown-menu').getByRole('button', { name: '菜单', exact: true }).click()
      await page.getByRole('menuitem', { name: '添加组件' }).click()
      await expect(page.getByRole('menu')).toHaveCount(0)
      expect(await calls()).toEqual({ 添加组件: 1 })
      // 下拉：键盘 Enter。
      await section(page, 'dropdown-menu').getByRole('button', { name: '菜单', exact: true }).focus()
      await page.keyboard.press('Enter')
      await page.keyboard.press('Enter')
      await expect(page.getByRole('menu')).toHaveCount(0)
      expect(await calls()).toEqual({ 添加组件: 2 })
      // 右键菜单的一项、二级里的一项。
      await show(page, 'context-menu')
      await page.locator('[data-gallery-ctx]').click({ button: 'right' })
      await page.getByRole('menuitem', { name: '克隆面板' }).click()
      await expect(page.getByRole('menu')).toHaveCount(0)
      await page.locator('[data-gallery-ctx]').click({ button: 'right' })
      await page.getByRole('menuitem', { name: '更多' }).hover()
      await page.getByRole('menuitem', { name: '导出为图片' }).click()
      await expect(page.getByRole('menu')).toHaveCount(0)
      expect(await calls()).toEqual({ 添加组件: 2, 克隆面板: 1, '导出为图片（右键）': 1 })
    })

    test('代码打开的对话框（没有触发器）：Esc 关后焦点回到打开前的按钮；Tab 与 Shift+Tab 走一圈焦点不出对话框', async ({
      page,
    }) => {
      await open(page, theme, 'dialog')
      const opener = section(page, 'dialog').getByRole('button', { name: '代码开的对话框', exact: true })
      // 真实按键：Tab 走到按钮、回车打开（鼠标点也行，但键盘用户走的是这条路）。
      await opener.focus()
      await page.keyboard.press('Enter')
      const dialog = page.getByRole('dialog', { name: '由代码打开' })
      await expect(dialog).toBeVisible()
      // 焦点陷阱：Tab 走一圈（对话框里 4 个可聚焦件：输入、关闭钮、取消、确定，多按几圈），每一步焦点都还在对话框里。
      const inside = () => dialog.evaluate((el) => el.contains(document.activeElement))
      const seen = new Set<string>()
      for (let step = 0; step < 10; step++) {
        await page.keyboard.press('Tab')
        expect(await inside(), `Tab 第 ${step + 1} 下焦点在对话框里`).toBe(true)
        seen.add(
          await page.evaluate(
            () => document.activeElement?.getAttribute('aria-label') ?? document.activeElement?.textContent ?? '',
          ),
        )
      }
      expect(seen.size, 'Tab 绕着对话框里的件转').toBeGreaterThanOrEqual(3)
      for (let step = 0; step < 10; step++) {
        await page.keyboard.press('Shift+Tab')
        expect(await inside(), `Shift+Tab 第 ${step + 1} 下焦点在对话框里`).toBe(true)
      }
      await page.keyboard.press('Escape')
      await expect(dialog).toHaveCount(0)
      await expect(opener, '没有 DialogTrigger，焦点靠 DialogContent 记下的打开前焦点回位').toBeFocused()
    })

    test('对话框里的提示刚收起就按 Esc：一下就关对话框（收起中的提示不吞 Esc）', async ({ page }) => {
      await open(page, theme, 'dialog')
      await section(page, 'dialog').getByRole('button', { name: '代码开的对话框', exact: true }).click()
      const dialog = page.getByRole('dialog', { name: '由代码打开' })
      await expect(dialog).toBeVisible()
      const button = dialog.getByRole('button', { name: '带提示的按钮' })
      await button.hover()
      await expect(page.locator('[data-slot="tooltip-content"]')).toBeVisible()
      // 点按钮：提示立刻转 closed 开始收起，紧接着按 Esc（不等）。提示若还带着退场动画，它仍是最上层，会吞掉这一下。
      await button.click()
      await page.keyboard.press('Escape')
      await expect(dialog).toHaveCount(0, { timeout: 1000 })
    })

    test('对话框：升起、居中；Esc 关；焦点回到触发处', async ({ page }) => {
      await open(page, theme, 'dialog')
      const trigger = section(page, 'dialog').getByRole('button', { name: '对话框', exact: true })
      await armMidFrame(page, '[role="dialog"]', 'kc-dialog-in')
      await trigger.click()
      const dialog = page.getByRole('dialog', { name: '恢复默认布局' })
      await expect(dialog).toBeVisible()
      // 中途那一帧：半透明，且比放完的位置低一点（keyframes 是 opacity 0 → 1、translate 往下 8px → 0）。
      const mid = await midFrame(page)
      expect(mid.opacity, '入场中途 opacity 在 0 与 1 之间').toBeGreaterThan(0)
      expect(mid.opacity).toBeLessThan(1)
      expect(mid.lift, `入场中途还差一点上移（translate: ${mid.translate}）`).toBeGreaterThan(0)
      expect(mid.lift).toBeLessThan(8)
      await expect(dialog).toHaveCSS('animation-name', 'kc-dialog-in')
      await settled(page)
      const box = (await dialog.boundingBox())!
      expect(Math.abs(box.x + box.width / 2 - 550)).toBeLessThan(2)
      expect(box.width).toBe(560)
      // 标题栏 50 高，关闭钮有名字。
      expect(Math.round((await dialog.locator('[data-slot="dialog-header"]').boundingBox())!.height)).toBe(50)
      await expect(dialog.getByRole('button', { name: '关闭' })).toBeVisible()
      await page.keyboard.press('Escape')
      await expect(dialog).toHaveCount(0)
      await expect(trigger).toBeFocused()
      // 点「取消」也关。
      await trigger.click()
      await page.getByRole('dialog').getByRole('button', { name: '取消' }).click()
      await expect(page.getByRole('dialog')).toHaveCount(0)
    })

    test('对话框皮肤：逐项对旧皮肤（旧值取自 main 的 src/ui/ui.css，ca7ef061）', async ({ page }) => {
      await open(page, theme, 'dialog')
      await section(page, 'dialog').getByRole('button', { name: '对话框', exact: true }).click()
      const dialog = page.getByRole('dialog', { name: '恢复默认布局' })
      await expect(dialog).toBeVisible()
      await settled(page)
      const css = (target: Locator, props: string[]) =>
        target.evaluate((element, names) => {
          const style = getComputedStyle(element)
          return Object.fromEntries(names.map((name) => [name, style.getPropertyValue(name)]))
        }, props)
      // .k-dlg（ui.css:611）：宽 min(560, 100vw-24)（:619）· 圆角 14（:623）· 底 --bg-300（:621）· 9% 白边（:622）· 阴影 0 2 4 + 0 24 70（:624-626）· 字色 --ink-100（:628）· line-height 1.45（:630）· z-index 41（:613）。
      const box = await css(dialog, [
        'width',
        'border-top-left-radius',
        'background-color',
        'border-top-color',
        'border-top-width',
        'box-shadow',
        'color',
        'line-height',
        'z-index',
        'overflow',
      ])
      expect(box.width).toBe('560px')
      expect(box['border-top-left-radius']).toBe('14px')
      expect(box['background-color']).toBe(await token(page, '--bg-300'))
      expect(await rgba(page, box['border-top-color']!)).toEqual(await rgba(page, 'rgba(255, 255, 255, 0.09)'))
      expect(box['border-top-width']).toBe('1px')
      expect(box['box-shadow']).toContain('rgba(0, 0, 0, 0.5) 0px 2px 4px 0px')
      expect(box['box-shadow']).toContain('rgba(0, 0, 0, 0.45) 0px 24px 70px 0px')
      expect(box.color).toBe(await token(page, '--ink-100'))
      expect(box['z-index']).toBe('41')
      expect(box.overflow).toBe('hidden')
      // 背板 .k-dlg-backdrop（:600）：45% 黑（:604）· z-index 40（:603）。
      const backdrop = await css(page.locator('[data-slot="dialog-overlay"]'), ['background-color', 'z-index'])
      expect(await rgba(page, backdrop['background-color']!)).toEqual(await rgba(page, 'rgba(0, 0, 0, 0.45)'))
      expect(backdrop['z-index']).toBe('40')
      // 标题栏 .k-dlg-head（:647）：高 50 · padding 0 12 0 16（含关闭钮留的位置：旧值右 12，新的右 48 给关闭钮绝对定位）· 下边线 6% 白（:654）· 高 50（:652）· padding（:653）。
      const head = await css(dialog.locator('[data-slot="dialog-header"]'), [
        'height',
        'padding-left',
        'column-gap',
        'border-bottom-color',
      ])
      expect([head.height, head['padding-left'], head['column-gap']]).toEqual(['50px', '16px', '12px'])
      expect(await rgba(page, head['border-bottom-color']!)).toEqual(await rgba(page, 'rgba(255, 255, 255, 0.06)'))
      // 正文 .k-dlg-body（:672）padding 16 24 24（:676）· gap 8（:679）；脚 .k-dlg-foot（:681）padding 12 16（:687）· gap 8（:684）· 右对齐（:685）· 上边线 6% 白（:688）。
      const body = await css(dialog.locator('[data-slot="dialog-body"]'), [
        'padding-top',
        'padding-left',
        'padding-bottom',
        'row-gap',
      ])
      expect(body).toEqual({
        'padding-top': '16px',
        'padding-left': '24px',
        'padding-bottom': '24px',
        'row-gap': '8px',
      })
      const foot = await css(dialog.locator('[data-slot="dialog-footer"]'), [
        'padding-top',
        'padding-left',
        'column-gap',
        'justify-content',
        'border-top-color',
      ])
      expect({ ...foot, 'border-top-color': await rgba(page, foot['border-top-color']!) }).toEqual({
        'padding-top': '12px',
        'padding-left': '16px',
        'column-gap': '8px',
        'justify-content': 'flex-end',
        'border-top-color': await rgba(page, 'rgba(255, 255, 255, 0.06)'),
      })
    })

    test('弹层与提示：入场用我们的弹簧动画，从触发处长出来，放完是清楚的原大小', async ({ page }) => {
      await open(page, theme, 'popover')
      await armMidFrame(page, '[data-slot="popover-content"]', 'kc-pop-in')
      await section(page, 'popover').getByRole('button', { name: '弹层', exact: true }).click()
      const popover = page.locator('[data-slot="popover-content"]')
      await expect(popover).toBeVisible()
      const mid = await midFrame(page)
      expect(mid.opacity, '入场中途 opacity 在 0 与 1 之间').toBeGreaterThan(0)
      expect(mid.opacity).toBeLessThan(1)
      expect(mid.lift, `入场中途还差一点上移（translate: ${mid.translate}）`).toBeGreaterThan(0)
      expect(mid.lift).toBeLessThan(4)
      await expect(popover).toHaveCSS('animation-name', 'kc-pop-in')
      expect(await popover.evaluate((el) => getComputedStyle(el).transformOrigin)).not.toBe('50% 50%')
      await settled(page)
      await expect(popover).toHaveCSS('opacity', '1')
      await expect(popover).toHaveCSS('scale', /^(none|1)$/)
      expect(await bg(popover)).not.toBe('rgba(0, 0, 0, 0)')
      await page.keyboard.press('Escape')
      await expect(popover).toHaveCount(0)
    })

    test('字号档：按钮、sm 按钮、页签、提示、菜单行与分组标题、对话框标题都是 token 里的字号与字重', async ({
      page,
    }) => {
      await open(page, theme, 'button')
      const font = async (target: Locator) =>
        target.evaluate((el) => {
          const style = getComputedStyle(el)
          return [style.fontSize, style.fontWeight]
        })
      // tokens.css：title 600 15 / body 400 13 / data 500 12 / caption 400 11 / micro 600 10。
      expect(await font(section(page, 'button').getByRole('button', { name: 'default', exact: true }))).toEqual([
        '12px',
        '500',
      ])
      expect(await font(section(page, 'button').getByRole('button', { name: 'default sm', exact: true }))).toEqual([
        '11px',
        '600',
      ])
      // 间距刻度钉在 4px 一格（应用根字号是 13px，Tailwind 默认的 rem 会让 px-2 变 6.5px）。
      await expect(section(page, 'button').getByRole('button', { name: 'default sm', exact: true })).toHaveCSS(
        'padding-left',
        '8px',
      )
      expect(await font(section(page, 'button').getByRole('button', { name: 'primary', exact: true }))).toEqual([
        '12px',
        '700',
      ])
      await show(page, 'tabs')
      expect(await font(section(page, 'tabs').getByRole('tab', { name: '成交额榜', exact: true }))).toEqual([
        '12px',
        '500',
      ])
      await show(page, 'tooltip')
      expect(await font(page.locator('[data-slot="tooltip-content"]'))).toEqual(['12px', '400'])
      await show(page, 'dropdown-menu')
      const trigger = section(page, 'dropdown-menu').getByRole('button', { name: '菜单', exact: true })
      await trigger.click()
      expect(await font(page.getByRole('menuitem', { name: '编辑布局' }))).toEqual(['13px', '400'])
      expect(await font(page.locator('[data-slot="dropdown-menu-label"]'))).toEqual(['10px', '600'])
      expect(await font(page.locator('[data-slot="dropdown-menu-shortcut"]'))).toEqual(['11px', '500'])
      await page.keyboard.press('Escape')
      await show(page, 'dialog')
      await section(page, 'dialog').getByRole('button', { name: '对话框', exact: true }).click()
      expect(await font(page.locator('[data-slot="dialog-title"]'))).toEqual(['15px', '600'])
    })

    test('子菜单悬停延迟：悬停不到 100ms 不开，超过 100ms 开（Radix 默认）', async ({ page }) => {
      // 悬停延迟是 Radix 的 setTimeout：用假时钟一格一格走，停多久由测试定，不被机器忙不忙拖成真实的几百毫秒（4 个 worker 并跑时真等 40 ms 会漂过 100 ms）。
      await page.clock.install()
      await open(page, theme, 'dropdown-menu')
      await section(page, 'dropdown-menu').getByRole('button', { name: '菜单', exact: true }).click()
      const parent = page.locator('[data-slot="dropdown-menu-sub-trigger"]')
      const box = (await parent.boundingBox())!
      const sub = page.getByRole('menuitem', { name: '导出为图片' })
      // 菜单已开：时钟停住，之后只按测试给的毫秒数往前走。
      await page.clock.pauseAt(new Date(Date.now() + 10_000))
      // 进到「更多」后马上离开（路过）：不开。
      await page.mouse.move(box.x + 10, box.y + 5)
      await page.clock.runFor(40)
      await page.mouse.move(box.x + 10, box.y - 60)
      await page.clock.runFor(250)
      await expect(sub).toHaveCount(0)
      // 停住：不到 100 ms 还没开，过了 100 ms 开。
      await page.mouse.move(box.x + 10, box.y + 5)
      await page.clock.runFor(40)
      await expect(sub).toHaveCount(0)
      await page.clock.runFor(100)
      await expect(sub).toBeVisible()
    })

    // 安全三角（#1832「0 关，靠自带的安全三角防误收」）：指针从「更多」斜着朝二级走，路上压过下面一行「删除看板」，
    // 二级不收、那一行不亮；对照：从「更多」直着往下到同一行（背离二级），二级收起、那一行亮。真人移动是一串 pointermove，不瞬移，所以逐步移。
    test('子菜单安全三角：斜着朝二级走、路过下一行不误收；直着往下走就收', async ({ page }) => {
      await open(page, theme, 'dropdown-menu')
      await section(page, 'dropdown-menu').getByRole('button', { name: '菜单', exact: true }).click()
      const parent = page.locator('[data-slot="dropdown-menu-sub-trigger"]')
      const below = page.getByRole('menuitem', { name: '删除看板' })
      const csv = page.getByRole('menuitem', { name: '导出为 CSV' })
      const from = (await parent.boundingBox())!
      const start = { x: from.x + 12, y: from.y + from.height / 2 }
      await page.mouse.move(start.x, start.y, { steps: 4 })
      await expect(csv).toBeVisible({ timeout: 1000 })
      const target = (await csv.boundingBox())!
      const row = (await below.boundingBox())!
      // 终点在二级末项的下半截：斜率够缓，直线才会先压过下面一行再进二级
      const end = { x: target.x + 8, y: target.y + target.height - 6 }
      // 前提：这条直线真的压过「删除看板」那一行（在那一行的高度上，x 还在菜单里），不然测不到「路过下一行」。
      const yMid = row.y + row.height / 2
      const xAtRow = start.x + ((end.x - start.x) * (yMid - start.y)) / (end.y - start.y)
      expect(yMid, '「删除看板」在起点与终点之间').toBeGreaterThan(start.y)
      expect(yMid).toBeLessThan(end.y + 1)
      expect(xAtRow, '直线在那一行的高度上还在菜单里').toBeLessThan(row.x + row.width - 2)

      const steps = 12
      let crossed = false
      for (let i = 1; i <= steps; i += 1) {
        const x = start.x + ((end.x - start.x) * i) / steps
        const y = start.y + ((end.y - start.y) * i) / steps
        await page.mouse.move(x, y)
        if (x < row.x + row.width && y > row.y && y < row.y + row.height) crossed = true
        await expect(csv, `第 ${i} 步：二级还开着`).toBeVisible({ timeout: 50 })
        await expect(below, `第 ${i} 步：路过的「删除看板」不亮`).not.toHaveAttribute('data-highlighted', /.*/, {
          timeout: 50,
        })
      }
      expect(crossed, '至少有一步落在「删除看板」那一行上').toBe(true)
      await expect(csv).toHaveAttribute('data-highlighted', /.*/)

      // 对照：回到「更多」，直着往下到「删除看板」（背离二级）：二级收起，那一行亮。
      await page.mouse.move(start.x, start.y, { steps: 6 })
      await expect(page.getByRole('menuitem', { name: '导出为 CSV' })).toBeVisible({ timeout: 1000 })
      await page.mouse.move(start.x, yMid, { steps: 6 })
      await expect(page.getByRole('menuitem', { name: '导出为 CSV' }), '背离二级：收起').toHaveCount(0, {
        timeout: 400,
      })
      await expect(below).toHaveAttribute('data-highlighted', /.*/)
    })

    test('页签与折叠：点页签换内容，底块滑到它底下；折叠标题点了收起展开', async ({ page }) => {
      await open(page, theme, 'tabs')
      const nav = section(page, 'tabs')
      const tab = (name: string) => nav.getByRole('tab', { name, exact: true })
      const pill = nav.locator('[data-slot="tabs-pill"]')
      await expect(tab('涨幅榜')).toHaveAttribute('aria-selected', 'true')
      const first = (await tab('涨幅榜').boundingBox())!
      await expect.poll(async () => Math.round((await pill.boundingBox())!.x)).toBe(Math.round(first.x))
      await expect(pill).toHaveCSS('transition-property', 'translate, width')
      await tab('换手榜').click()
      await expect(tab('换手榜')).toHaveAttribute('aria-selected', 'true')
      await expect(nav.getByText('换手榜的内容')).toBeVisible()
      await expect(nav.getByText('涨幅榜的内容')).toHaveCount(0)
      const third = (await tab('换手榜').boundingBox())!
      await expect.poll(async () => Math.round((await pill.boundingBox())!.x)).toBe(Math.round(third.x))
      // 禁用的页签点不动。
      await expect(tab('已禁用')).toBeDisabled()
      // 折叠。
      await show(page, 'accordion')
      const accordion = section(page, 'accordion')
      const head = accordion.getByRole('button', { name: '数据从哪来' })
      await expect(head).toHaveAttribute('aria-expanded', 'true')
      await head.click()
      await expect(head).toHaveAttribute('aria-expanded', 'false')
      await expect(accordion.getByText('A 股公开数据连接')).toBeHidden()
      await head.click()
      await expect(accordion.getByText('A 股公开数据连接')).toBeVisible()
    })

    // 控件换新（#1794 #1795 #1796）：样子照改前的皮肤，数值取自 xart/main（2f063a43）的 src/ui/ui.css，行号为改前。
    const css = (locator: Locator, props: string[]) =>
      locator.evaluate((node, names) => {
        const style = getComputedStyle(node)
        return names.map((name) => style.getPropertyValue(name))
      }, props)
    const colorOf = (locator: Locator) => locator.evaluate((node) => getComputedStyle(node).color)

    test('输入：默认与 sm 的高、内边距、圆角、字族字号字重行高、颜色等于改前 .k-in', async ({ page }) => {
      await open(page, theme, 'input')
      const fields = section(page, 'input')
      const input = fields.getByRole('textbox', { name: '输入', exact: true })
      const small = fields.getByRole('textbox', { name: '输入 sm' })
      // .k-in（ui.css 118-129）：30 高 · 内边 8 · 1px 边 · 圆角 6 · 13px/18px 400 · 字色 ink-100 · sans 字族（系统界面字体栈，含 Segoe UI）。
      expect(
        await css(input, ['height', 'padding-left', 'padding-top', 'border-top-width', 'border-top-left-radius']),
      ).toEqual(['30px', '8px', '0px', '1px', '6px'])
      expect(await css(input, ['font-size', 'font-weight', 'line-height'])).toEqual(['13px', '400', '18px'])
      expect((await css(input, ['font-family']))[0]).toContain('Segoe UI')
      expect(await colorOf(input)).toBe(await token(page, '--ink-100'))
      expect(await bg(input)).toMatch(/0\.04\)$/)
      // .k-in.sm（ui.css 140-145）：26 高 · 内边 6 · 圆角 6 · 字号 12px，字重与行高、字族仍是 .k-in 的 400 / 18px / 系统界面字体栈。
      expect(await css(small, ['height', 'padding-left', 'padding-top', 'border-top-left-radius'])).toEqual([
        '26px',
        '6px',
        '0px',
        '6px',
      ])
      expect(await css(small, ['font-size', 'font-weight', 'line-height', 'font-style'])).toEqual([
        '12px',
        '400',
        '18px',
        'normal',
      ])
      expect((await css(small, ['font-family']))[0]).toContain('Segoe UI')
      expect(await colorOf(small)).toBe(await token(page, '--ink-100'))
      // :focus（ui.css 134-136）：边框提亮到 22% 白。
      await input.focus()
      await expect(input).toHaveCSS('border-top-color', /0\.22\)$/)
    })

    test('下拉触发器与列表项：圆角、字号字重、颜色、边色、内边距等于改前 .k-sel*', async ({ page }) => {
      await open(page, theme, 'select')
      const select = section(page, 'select').getByRole('combobox', { name: '图表类型' })
      // .k-sel（ui.css 250-262）：30 高 · 内边 8 · 圆角 control · 12px 500 line-height 1（:258）· 字色 ink-100 · 2.4% 白底 · 9% 白边 · 两端对齐。
      expect(await css(select, ['height', 'padding-left', 'border-top-width', 'justify-content', 'min-width'])).toEqual(
        ['30px', '8px', '1px', 'space-between', '120px'],
      )
      expect(await css(select, ['font-size', 'font-weight', 'line-height'])).toEqual(['12px', '500', '12px'])
      expect(await css(select, ['border-top-left-radius'])).toEqual([await radius(page, '--radius-control')])
      expect(await colorOf(select)).toBe(await token(page, '--ink-100'))
      expect(await bg(select)).toMatch(/0\.024\)$/)
      await expect(select).toHaveCSS('border-top-color', /0\.09\)$/)
      await select.click()
      const list = page.locator('[data-slot="select-content"]')
      await expect(list).toBeVisible()
      await settled(page)
      // .k-sel-pop（ui.css 287-300）：4 内边 · 圆角 7 · 9% 白边 · 底 bg-400（surface-4）。
      expect(await css(list, ['padding-left', 'border-top-left-radius', 'border-top-width'])).toEqual([
        '4px',
        '7px',
        '1px',
      ])
      expect(await bg(list)).toBe(await token(page, '--bg-400'))
      // .k-sel-opt（ui.css 310-324）：6px 8px · 圆角 inner · 11px/16px→行高 1.4 · 字色 ink-300；当前项（:328-332）9% 白底 · ink-100 · 600。
      const other = page.getByRole('option', { name: 'K 线' })
      expect(await css(other, ['padding-top', 'padding-left', 'font-size', 'font-weight'])).toEqual([
        '6px',
        '8px',
        '11px',
        '400',
      ])
      expect(await css(other, ['border-top-left-radius'])).toEqual([await radius(page, '--radius-inner')])
      expect(await colorOf(other)).toBe(await token(page, '--ink-300'))
      const current = page.getByRole('option', { name: '折线' })
      expect(await bg(current)).toMatch(/0\.09\)$/)
      expect(await colorOf(current)).toBe(await token(page, '--ink-100'))
      expect((await css(current, ['font-weight']))[0]).toBe('600')
      // 悬停（:325-327）：5% 白。
      await other.hover()
      await expect.poll(() => bg(other)).toMatch(/0\.05\)$/)
    })

    test('多选弹层：内边、圆角、边、阴影、最大高与滚动、项的样式等于改前 .k-sel-pop / .k-sel-opt', async ({ page }) => {
      await open(page, theme, 'multi-select')
      await section(page, 'multi-select').getByRole('combobox', { name: '显示的列' }).click()
      const list = page.getByRole('listbox', { name: '显示的列' })
      await expect(list).toBeVisible()
      await settled(page)
      const pop = page.locator('[data-slot="popover-content"]')
      // .k-sel-pop（ui.css 287-300）：4 内边 · 圆角 7 · 9% 白边 · 阴影 0 8 24 · overflow auto · max-height min(可用高, 100dvh-16)。
      expect(await css(pop, ['padding-left', 'border-top-left-radius', 'border-top-width', 'overflow-y'])).toEqual([
        '4px',
        '7px',
        '1px',
        'auto',
      ])
      await expect(pop).toHaveCSS('border-top-color', /0\.09\)$/)
      expect((await css(pop, ['box-shadow']))[0]).toContain('24px')
      expect(await bg(pop)).toBe(await token(page, '--bg-400'))
      const maxHeight = parseFloat((await css(pop, ['max-height']))[0])
      expect(maxHeight).toBeGreaterThan(0)
      expect(maxHeight).toBeLessThanOrEqual(1500 - 16)
      // .k-sel-opt（ui.css 310-324）：6px 8px · 11px · ink-300；选中项（:328-332）9% 白底 · ink-100 · 600。
      const off = list.getByRole('option', { name: '值' })
      expect(await css(off, ['padding-top', 'padding-left', 'font-size', 'font-weight'])).toEqual([
        '6px',
        '8px',
        '11px',
        '400',
      ])
      expect(await colorOf(off)).toBe(await token(page, '--ink-300'))
      const on = list.getByRole('option', { name: '名称' })
      expect(await bg(on)).toMatch(/0\.09\)$/)
      expect((await css(on, ['font-weight']))[0]).toBe('600')
      // 打字跳项：焦点在列表里时打 v，焦点跳到「Volume」。
      await on.focus()
      await page.keyboard.press('v')
      await expect(list.getByRole('option', { name: 'Volume' })).toBeFocused()
    })

    test('按钮：danger、link、禁用 0.45、sm 圆角 8、带图标的按钮、图标按钮等于改前 .k-btn / .k-icon-btn', async ({
      page,
    }) => {
      await open(page, theme, 'button')
      const buttons = section(page, 'button')
      const by = (name: string) => buttons.getByRole('button', { name, exact: true })
      // .k-btn.dan（ui.css 44-51）：字色 signal-red · 边 30% 红；悬停底 8% 红。
      const danger = by('danger')
      expect(await colorOf(danger)).toBe(await token(page, '--signal-red'))
      await expect(danger).toHaveCSS('border-top-color', /0\.3\)$/)
      await danger.hover()
      await expect.poll(() => bg(danger)).toMatch(/0\.08\)$/)
      // .k-btn.lnk（ui.css 52-66）：高 auto · 内边 2px 4px · ink-300 · 400 · 下划线偏移 3px。
      const link = by('link')
      expect(await css(link, ['padding-top', 'padding-left', 'font-weight', 'text-underline-offset'])).toEqual([
        '2px',
        '4px',
        '400',
        '3px',
      ])
      expect(await colorOf(link)).toBe(await token(page, '--ink-300'))
      expect((await css(link, ['text-decoration-line']))[0]).toBe('underline')
      expect(Math.round((await link.boundingBox())!.height)).toBeLessThan(26)
      // .k-btn:disabled（ui.css 67-70）：不透明度 0.45。
      await expect(by('default 禁用')).toHaveCSS('opacity', '0.45')
      // .k-btn.sm（ui.css 71-77）：26 高 · 内边 8 · 圆角 8 · 11px 600。
      const small = by('default sm')
      expect(
        await css(small, ['height', 'padding-left', 'border-top-left-radius', 'font-size', 'font-weight']),
      ).toEqual(['26px', '8px', '8px', '11px', '600'])
      // .k-btn svg.lucide（ui.css 78-82）：13px；带图标的按钮里图标与字隔 6px（:6-25 gap）。
      const withIcon = by('带图标')
      expect((await css(withIcon.locator('svg'), ['width']))[0]).toBe('13px')
      expect((await css(withIcon, ['column-gap']))[0]).toBe('6px')
      // .k-icon-btn（ui.css 83-116）：28 见方 · 圆角 control · ink-300 · 透明 · svg 15px；悬停 ink-100；按下不缩放。
      const icon = by('图标按钮')
      expect(await colorOf(icon)).toBe(await token(page, '--ink-300'))
      expect(await css(icon, ['border-top-left-radius'])).toEqual([await radius(page, '--radius-control')])
      expect((await css(icon.locator('svg'), ['width', 'height'])).join()).toBe('15px,15px')
      await icon.hover()
      await settled(page)
      expect(await colorOf(icon)).toBe(await token(page, '--ink-100'))
      const hovered = await bg(icon)
      await page.mouse.down()
      await settled(page)
      await expect(icon).toHaveCSS('scale', '1')
      expect(await bg(icon)).toBe(hovered)
      await page.mouse.up()
    })

    test('分段：默认态圆角、未选中项字色、选中项字重等于改前 .k-seg', async ({ page }) => {
      await open(page, theme, 'toggle-group')
      const normal = section(page, 'toggle-group').locator('[data-slot="toggle-group"]').nth(0)
      // .k-seg（ui.css 358-365）：圆角 control · 5% 白底 · 10% 白边；按钮（:366-383）圆角 inner · 12px 500 · 未选中字色 ink-200。
      expect(await css(normal, ['border-top-left-radius'])).toEqual([await radius(page, '--radius-control')])
      await expect(normal).toHaveCSS('border-top-color', /0\.1\)$/)
      expect(await bg(normal)).toMatch(/0\.05\)$/)
      const off = normal.getByRole('button', { name: '周' })
      expect(await css(off, ['border-top-left-radius', 'font-size', 'font-weight'])).toEqual([
        await radius(page, '--radius-inner'),
        '12px',
        '500',
      ])
      expect(await colorOf(off)).toBe(await token(page, '--ink-200'))
      // 选中（:387-391）：--seg-on-ink 字色。
      expect(await colorOf(normal.getByRole('button', { name: '日' }))).toBe(await token(page, '--seg-on-ink'))
    })

    test('分段：点另一项选中跟过去；sm 的选中块滑过去；禁用的点不动', async ({ page }) => {
      await open(page, theme, 'toggle-group')
      const small = section(page, 'toggle-group').locator('[data-slot="toggle-group"]').nth(1)
      const pill = small.locator('[data-slot="toggle-group-pill"]')
      const week = small.getByRole('button', { name: '周' })
      const month = small.getByRole('button', { name: '月' })
      await expect(week).toHaveAttribute('aria-pressed', 'true')
      const from = (await pill.boundingBox())!.x
      // 点下去以后逐帧记选中块的左边：弹簧走过的路上有一帧落在起点与终点之间（没有 layoutId 就一步跳到终点）。
      const trail = month.evaluate(
        (node) =>
          new Promise<number[]>((resolve) => {
            const xs: number[] = []
            const started = performance.now()
            const tick = () => {
              const pill = node.closest('[data-slot="toggle-group"]')!.querySelector('[data-slot="toggle-group-pill"]')
              if (pill) xs.push(pill.getBoundingClientRect().x)
              if (performance.now() - started < 600) requestAnimationFrame(tick)
              else resolve(xs)
            }
            requestAnimationFrame(tick)
          }),
      )
      await month.click()
      await expect(month).toHaveAttribute('aria-pressed', 'true')
      await expect(week).toHaveAttribute('aria-pressed', 'false')
      const target = (await month.boundingBox())!.x
      expect((await trail).some((x) => x > from + 2 && x < target - 2)).toBe(true)
      // 选中块从上一项滑到这一项（snappy 弹簧）：落点是「月」那一格的左边。
      await expect
        .poll(async () => Math.round((await pill.boundingBox())!.x))
        .toBe(Math.round((await month.boundingBox())!.x))
      expect((await pill.boundingBox())!.x).toBeGreaterThan(from)
      // 再点已选中的项不取消。
      await month.click()
      await expect(month).toHaveAttribute('aria-pressed', 'true')
      await expect(section(page, 'toggle-group').getByRole('button', { name: '禁用', exact: true })).toBeDisabled()
    })

    test('下拉：列表贴在触发器下面，选一项换值、列表收起；当前项加粗', async ({ page }) => {
      await open(page, theme, 'select')
      const select = section(page, 'select').getByRole('combobox', { name: '图表类型' })
      await expect(select).toContainText('折线')
      const trigger = (await select.boundingBox())!
      await select.click()
      const list = page.locator('[data-slot="select-content"]')
      await expect(list).toBeVisible()
      await settled(page)
      const pop = (await list.boundingBox())!
      expect(Math.abs(pop.y - (trigger.y + trigger.height + 2))).toBeLessThan(2)
      // .k-sel-pop（ui.css 287-300）：4 内边 · 圆角 7；当前项 600（:328）。
      expect(await list.evaluate((n) => getComputedStyle(n).paddingLeft)).toBe('4px')
      expect(await list.evaluate((n) => getComputedStyle(n).borderTopLeftRadius)).toBe('7px')
      await expect(page.getByRole('option', { name: '折线' })).toHaveCSS('font-weight', '600')
      await page.getByRole('option', { name: 'K 线' }).click()
      await expect(list).toHaveCount(0)
      await expect(select).toContainText('K 线')
    })

    test('多选：点一项只切这一项、列表不收；触发器写已选项的名字；键盘 ↓ 走到下一项、Space 切换', async ({ page }) => {
      await open(page, theme, 'multi-select')
      const trigger = section(page, 'multi-select').getByRole('combobox', { name: '显示的列' })
      await expect(trigger).toContainText('名称')
      await trigger.click()
      const list = page.getByRole('listbox', { name: '显示的列' })
      await expect(list).toBeVisible()
      const option = (name: string) => list.getByRole('option', { name })
      await expect(option('名称')).toHaveAttribute('aria-selected', 'true')
      await expect(option('值')).toHaveAttribute('aria-selected', 'false')
      await option('值').click()
      await expect(list).toBeVisible()
      await expect(trigger).toContainText('名称、值')
      await option('名称').click()
      await expect(trigger).not.toContainText('名称')
      await option('值').click()
      await expect(trigger).toContainText('隐藏')
      await option('值').focus()
      await page.keyboard.press('ArrowDown')
      await expect(option('线形图')).toBeFocused()
      await page.keyboard.press('Space')
      await expect(option('线形图')).toHaveAttribute('aria-selected', 'true')
      await expect(trigger).toContainText('线形图')
      await page.keyboard.press('Escape')
      await expect(list).toHaveCount(0)
    })

    test('滑块：卡上的样子；拖动时把手跟手；松手吸附到步进；← → 走一格', async ({ page }) => {
      await open(page, theme, 'slider')
      const fields = section(page, 'slider')
      const root = fields.locator('[data-slot="slider"]').first()
      const thumb = root.locator('[data-slot="slider-thumb"]')
      // 组件卡 Controls「Slider」：把手 14 · 强调色（不发光，发光只给状态灯）；轨 6 高 · 凹槽阴影；填充是竖纹点阵。
      expect(await bg(thumb)).toBe(await token(page, '--ink-100'))
      await expect(thumb).toHaveCSS('box-shadow', 'none')
      await expect(thumb).toHaveCSS('width', '14px')
      expect(await thumb.evaluate((n) => parseFloat(getComputedStyle(n).borderTopLeftRadius))).toBeGreaterThanOrEqual(7)
      await expect(root.locator('[data-slot="slider-track"]')).toHaveCSS('height', '6px')
      expect(await root.locator('[data-slot="slider-track"]').evaluate((n) => getComputedStyle(n).boxShadow)).not.toBe(
        'none',
      )
      expect(
        await root
          .locator('[data-slot="slider-fill"]')
          .first()
          .evaluate((n) => getComputedStyle(n).backgroundImage),
      ).toContain('repeating-linear-gradient')
      const out = fields.getByTestId('slider-value')
      await expect(out).toHaveText('40')
      const box = (await root.boundingBox())!
      const y = box.y + box.height / 2
      const x = (fraction: number) => box.x + 7 + fraction * (box.width - 14)
      const center = async () => {
        const rect = (await thumb.boundingBox())!
        return rect.x + rect.width / 2
      }
      // 拖到 34% 处：值吸到 30，但把手跟在手上，不在 30% 的位置。
      await page.mouse.move(x(0.4), y)
      await page.mouse.down()
      await page.mouse.move(x(0.33), y, { steps: 4 })
      await expect(out).toHaveText('30')
      expect(Math.abs((await center()) - x(0.33))).toBeLessThan(3)
      expect(Math.abs((await center()) - x(0.3))).toBeGreaterThan(2)
      // 松手：走 settle 弹簧吸回 30% 的位置。
      // 逐帧记把手中心：弹簧走过的路上有帧落在松手处与终点之间（硬跳就一步到终点）。
      const trail = thumb.evaluate(
        (node) =>
          new Promise<number[]>((resolve) => {
            const xs: number[] = []
            const started = performance.now()
            const tick = () => {
              const rect = node.getBoundingClientRect()
              xs.push(rect.x + rect.width / 2)
              if (performance.now() - started < 900) requestAnimationFrame(tick)
              else resolve(xs)
            }
            requestAnimationFrame(tick)
          }),
      )
      const released = await center()
      await page.mouse.up()
      await expect(fields.getByTestId('slider-committed')).toHaveText('30')
      const finalX = x(0.3)
      expect(
        (await trail).some((c) => Math.abs(c - finalX) > 1 && Math.abs(c - finalX) < Math.abs(released - finalX) - 1),
      ).toBe(true)
      // 松手后把手中心与目标差约 -0.009px，取整得 -0；toBe 用 Object.is 判 -0 与 0 不等，所以先取绝对值。
      await expect.poll(async () => Math.abs(Math.round((await center()) - x(0.3)))).toBe(0)
      // 键盘：← 减一格，→ 加一格。
      await root.getByRole('slider', { name: '音量' }).focus()
      await page.keyboard.press('ArrowLeft')
      await expect(out).toHaveText('20')
      await page.keyboard.press('ArrowRight')
      await page.keyboard.press('ArrowRight')
      await expect(out).toHaveText('40')
      // 两个把手：填充两端对着把手中心（Radix 的 Range 差最多 7px）。
      const pair = fields.locator('[data-slot="slider"]').nth(1)
      const [fillBox, startBox, endBox] = await Promise.all([
        pair.locator('[data-slot="slider-fill"]').boundingBox(),
        pair.getByRole('slider', { name: '起' }).boundingBox(),
        pair.getByRole('slider', { name: '止' }).boundingBox(),
      ])
      expect(Math.abs(fillBox!.x - (startBox!.x + startBox!.width / 2))).toBeLessThan(1)
      expect(Math.abs(fillBox!.x + fillBox!.width - (endBox!.x + endBox!.width / 2))).toBeLessThan(1)
      await expect(fields.getByRole('slider', { name: '禁用的滑块' })).toHaveAttribute('data-disabled', '')
    })

    // 下面九条是从 src/ui 搬进包的 KATANA 自有件（#1860）：样子没改，断言的值就是搬家前 main 上 src/ui/ui.css 的值（行号是搬家前的）。
    test('状态灯：8 见方的圆点，on 橙色发光，小灯 6，空心 1px 边，联动组用组的颜色（等于改前 .k-led）', async ({
      page,
    }) => {
      await open(page, theme, 'led')
      const led = (name: string) => section(page, 'led').getByRole('img', { name })
      // .k-led（ui.css 118-127）：8×8 · 全圆角 · 底色 led-off。
      await expect(led('状态 off')).toHaveCSS('width', '8px')
      await expect(led('状态 off')).toHaveCSS('height', '8px')
      await expect(led('状态 off')).toHaveCSS('border-top-left-radius', await radius(page, '--radius-pill'))
      await expect(led('状态 off')).toHaveCSS('background-color', await token(page, '--led-off'))
      // .on（:134-137）橙底 + glow-orange；.ok（:138-141）绿底 + 0 0 6px 同色。
      await expect(led('状态 accent')).toHaveCSS('background-color', await token(page, '--accent'))
      await expect(led('状态 accent')).toHaveCSS('box-shadow', await resolved(page, 'box-shadow', 'var(--glow-orange)'))
      await expect(led('状态 ok')).toHaveCSS('background-color', await token(page, '--signal-green'))
      await expect(led('状态 danger')).toHaveCSS('background-color', await token(page, '--signal-red'))
      // .link-a（:158-161）、.sm（:174-177）、.hollow（:178-182）。
      await expect(led('联动组 A')).toHaveCSS('background-color', await token(page, '--link-a'))
      await expect(led('小灯')).toHaveCSS('width', '6px')
      await expect(led('空心灯')).toHaveCSS('border-top-width', '1px')
      await expect(led('空心灯')).toHaveCSS('border-top-color', await token(page, '--line-200'))
      await expect(led('空心灯')).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)')
      // .bare（:130-132）：熄灭灯画一圈环，不是近乎看不见的暗点。
      await expect(led('旁边没有文字的熄灭灯')).toHaveCSS(
        'box-shadow',
        await resolved(page, 'box-shadow', 'inset 0 0 0 1px var(--ink-300)'),
      )
    })

    test('LCD 读数窗：纵向排，标签点阵字、数字 LCD 字、小字 10px；涨跌与警告改数字颜色；没有数据是「—」（等于改前 .k-lcd）', async ({
      page,
    }) => {
      await open(page, theme, 'lcd')
      const lcd = section(page, 'lcd')
      const pnl = lcd.locator('.k-lcd').filter({ hasText: 'PNL' }).first()
      // .k-lcd（ui.css 176-187）：inline-flex（在 flex 行里被块化成 flex，所以不断言 display）纵向 · gap 2 · 内边 6 12 · 数字用 font-lcd；.t（:188-194）点阵字 tag 档、不加字距；.v（:195-201）lcd 档 · 行高 20 · 500。
      await expect(pnl).toHaveCSS('flex-direction', 'column')
      await expect(pnl).toHaveCSS('row-gap', '2px')
      await expect(pnl).toHaveCSS('padding', '6px 12px')
      await expect(pnl.locator('.t')).toHaveCSS('font-size', await resolved(page, 'font-size', 'var(--text-tag-size)'))
      await expect(pnl.locator('.t')).toHaveCSS('letter-spacing', 'normal')
      await expect(pnl.locator('.v')).toHaveCSS('font-size', await resolved(page, 'font-size', 'var(--text-lcd-size)'))
      await expect(pnl.locator('.v')).toHaveCSS('line-height', '20px')
      await expect(pnl.locator('.v')).toHaveCSS('font-weight', '500')
      // 色调（:215-226）。
      await expect(pnl.locator('.v')).toHaveCSS('color', await token(page, '--pnl-up'))
      await expect(lcd.locator('.k-lcd').filter({ hasText: 'DD' }).locator('.v')).toHaveCSS(
        'color',
        await token(page, '--pnl-down'),
      )
      await expect(lcd.locator('.k-lcd').filter({ hasText: 'FOCUS' }).locator('.v')).toHaveCSS(
        'color',
        await token(page, '--signal-orange'),
      )
      await expect(lcd.locator('.k-lcd').filter({ hasText: 'WARN' }).locator('.v')).toHaveCSS(
        'color',
        await token(page, '--signal-amber'),
      )
      const empty = lcd.locator('.k-lcd.is-empty')
      await expect(empty.locator('.v')).toHaveText('—')
      await expect(empty.locator('.v')).toHaveCSS('color', await token(page, '--ink-300'))
      // .n（:202-210）10px 灰字；.inline（:236-242）横排 · 内边 2 6；.fill（:227-235）撑满 · 内边 6 8。
      await expect(lcd.locator('.k-lcd .n')).toHaveCSS(
        'font-size',
        await resolved(page, 'font-size', 'var(--text-micro-size)'),
      )
      await expect(lcd.locator('.k-lcd.inline').first()).toHaveCSS('flex-direction', 'row')
      await expect(lcd.locator('.k-lcd.inline').first()).toHaveCSS('padding', '2px 6px')
      await expect(lcd.locator('.k-lcd.fill')).toHaveCSS('padding', '6px 8px')
    })

    test('点阵：4 实 2 空的方点（点 4、点距 6），颜色可换', async ({ page }) => {
      await open(page, theme, 'dot-matrix')
      const area = section(page, 'dot-matrix')
      // DotMatrix.tsx 原有的 DOT_SIZE = 4、DOT_PITCH = 6。
      await expect(area.locator('#gal-dots-default')).toHaveAttribute('width', '6')
      await expect(area.locator('#gal-dots-default')).toHaveAttribute('height', '6')
      await expect(area.locator('#gal-dots-default .k-dot-tile')).toHaveAttribute('width', '4')
      await expect(area.locator('#gal-dots-default .k-dot-tile')).toHaveCSS('fill', await token(page, '--k-heat-3'))
      await expect(area.locator('#gal-dots-deep .k-dot-tile')).toHaveCSS('fill', await token(page, '--k-heat-5'))
    })

    test('滚动数字（里程表式）：涨一下转轮上依次经过中间的数字、整串闪涨色，文本里只有新的整串数字；中途取样转轮与新字同步在动', async ({
      page,
    }) => {
      await open(page, theme, 'rolling-text')
      const area = section(page, 'rolling-text')
      const roll = area.locator('[data-gallery-price] .k-roll')
      await expect(roll).toHaveText('106,977.4')
      await expect(roll).toHaveCSS('display', 'inline-block')
      // 点涨 8（106,977.4 到 106,985.4）：十位 7 到 8 走一格，个位 7 到 5 往上走八格（8 9 0 1 2 3 4 5）。点击与取样在同一个 evaluate 里：点完马上停在动画 50% 处读转轮与新字的位移。
      const mid = await page.evaluate(async () => {
        const hostSelector = '[data-gallery="rolling-text"] [data-gallery-price] .k-roll'
        const button = [...document.querySelectorAll<HTMLButtonElement>('[data-gallery="rolling-text"] button')].find(
          (item) => item.textContent === '涨 8',
        )!
        button.click()
        // 每次变化换 key，整个 .k-roll 是新元素，等一帧渲染完再取。
        await new Promise(requestAnimationFrame)
        const host = document.querySelector<HTMLElement>(hostSelector)!
        const slots = [...host.querySelectorAll<HTMLElement>('.k-roll-slot[data-from]')]
        const ones = slots.at(-1)!
        const animations = ones.getAnimations({ subtree: true })
        const wheel = animations.find((a) => (a.effect as KeyframeEffect).pseudoElement === '::before')!
        const incoming = animations.find(
          (a) => (a.effect as KeyframeEffect).target === ones.querySelector('.k-roll-in'),
        )!
        const total = Number(wheel.effect!.getComputedTiming().duration)
        for (const a of animations) {
          a.pause()
          a.currentTime = total * 0.5
        }
        const line = ones.getBoundingClientRect().height
        const read = (el: Element, pseudo?: string) => new DOMMatrix(getComputedStyle(el, pseudo).transform).f
        const out = {
          strips: slots.map((slot) => slot.dataset.strip),
          steps: slots.map((slot) => slot.style.getPropertyValue('--roll-steps')),
          durations: slots.map((slot) => getComputedStyle(slot.querySelector('.k-roll-in')!).animationDuration),
          direction: host.dataset.direction,
          flash: getComputedStyle(host).animationName,
          flashDirection: host.dataset.flash,
          flashDuration: getComputedStyle(host).animationDuration,
          inName: getComputedStyle(ones.querySelector('.k-roll-in')!).animationName,
          line,
          wheelY: read(ones, '::before'),
          charY: read(ones.querySelector('.k-roll-in')!),
          wheelEnd: incoming.effect !== null,
          text: host.textContent,
        }
        for (const a of animations) a.finish()
        return out
      })
      expect(mid.text).toBe('106,985.4')
      expect(mid.direction).toBe('up')
      // 整串闪涨色走共用层（.k-live-flash，live.ts 的 useValueFlash）：方向在 data-flash，时长是 --dur-flash（600ms）。
      expect(mid.flash).toBe('k-live-flash')
      expect(mid.flashDirection).toBe('up')
      expect(mid.flashDuration).toBe('0.6s')
      expect(mid.inName).toBe('k-roll-in-up')
      expect(mid.strips, '十位只经过旧字；个位从 7 往上数到 4，再落到新字 5').toEqual(['7', '7\n8\n9\n0\n1\n2\n3\n4'])
      expect(mid.steps).toEqual(['1', '8'])
      // 转得越远用得越久：120ms 加每格 20ms。
      expect(mid.durations).toEqual(['0.14s', '0.28s'])
      // 50% 处：转轮往上走了一部分（负），新字还在下面（正）；两者始终相隔八个行高，转轮才是连着的。
      expect(mid.wheelY).toBeLessThan(-mid.line)
      expect(mid.wheelY).toBeGreaterThan(-8 * mid.line)
      expect(mid.charY).toBeGreaterThan(0)
      expect(mid.charY).toBeLessThan(8 * mid.line)
      expect(mid.charY - mid.wheelY).toBeCloseTo(8 * mid.line, 0)
      // 滚完：旧字都不在了，文本不变；DOM 文字里没有转轮上的数字（innerText 只有当前的整串）。
      await expect(roll).toHaveText('106,985.4')
      await expect.poll(() => roll.evaluate((el) => (el as HTMLElement).innerText)).toBe('106,985.4')
      // 距上次滚动不到 1 秒：再涨 0.2 直接换字，不带方向、不转。
      await area.getByRole('button', { name: '涨 0.2' }).click()
      await expect(roll).toHaveText('106,985.6')
      await expect(roll).not.toHaveAttribute('data-direction', /.*/)
      await expect(roll.locator('.k-roll-slot[data-from]')).toHaveCount(0)
    })

    test('滚动数字：跌往下转，列表从上到下写、旧字在最下，新字从上面落下来', async ({ page }) => {
      await open(page, theme, 'rolling-text')
      const area = section(page, 'rolling-text')
      const roll = area.locator('[data-gallery-price] .k-roll')
      await area.getByRole('button', { name: '跌 8' }).click()
      await expect(roll).toHaveText('106,969.4')
      await expect(roll).toHaveAttribute('data-direction', 'down')
      // 个位 7 到 9：往下数 6 5 4 3 2 1 0 9 ——八格，从上到下写、旧字 7 在最下。
      await expect(roll.locator('.k-roll-slot[data-from]').last()).toHaveAttribute('data-from', '7')
      const strip = (await roll.locator('.k-roll-slot[data-from]').last().getAttribute('data-strip'))!.split('\n')
      expect(strip.at(-1), '旧字在最下').toBe('7')
      expect(strip[0]).toBe('0')
      await expect(roll.locator('.k-roll-in').first()).toHaveCSS('animation-name', 'k-roll-in-down')
      await expect(roll).toHaveCSS('animation-name', 'k-live-flash')
      await expect(roll).toHaveAttribute('data-flash', 'down')
    })

    test('徽标：上标小字，次要文字色，悬停写全称，读屏名是全称；没有徽标什么都不画', async ({ page }) => {
      await open(page, theme, 'badge')
      const area = section(page, 'badge')
      const star = area.getByRole('img', { name: '科创板：涨跌幅 20%' })
      // .k-badge（ui.css 591-602）：micro 档 · 次要文字色 · 行高 1 · 指针 help；.k-badges 间距 space-1。
      await expect(star).toHaveText('科')
      await expect(star).toHaveAttribute('title', '科创板：涨跌幅 20%')
      await expect(star).toHaveCSS('color', await token(page, '--ink-300'))
      await expect(star).toHaveCSS('font-size', await resolved(page, 'font-size', 'var(--text-micro-size)'))
      await expect(star).toHaveCSS('cursor', 'help')
      await expect(area.locator('.k-badges').nth(1)).toHaveCSS(
        'column-gap',
        await resolved(page, 'column-gap', 'var(--space-1)'),
      )
      await expect(area.locator('.k-badges')).toHaveCount(2)
    })

    test('小标签 Tag：四种语气的字取 --k-status-*；填充底取 background、描边边取字色；sm 是 micro 字号、md 是 caption 500', async ({
      page,
    }) => {
      await open(page, theme, 'tag')
      for (const tone of ['neutral', 'ok', 'warn', 'danger'] as const) {
        const fg = await token(page, `--k-status-${tone}-foreground`)
        const filled = page.getByTestId(`tag-${tone}`)
        await expect(filled).toHaveCSS('color', fg)
        await expect(filled).toHaveCSS('background-color', await token(page, `--k-status-${tone}-background`))
        await expect(filled).toHaveCSS('font-weight', '500')
        const outlined = page.getByTestId(`tag-${tone}-outlined`)
        await expect(outlined).toHaveCSS('border-top-color', fg)
        await expect(outlined).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)')
        await expect(page.getByTestId(`tag-${tone}-sm`)).toHaveCSS(
          'font-size',
          await resolved(page, 'font-size', 'var(--text-micro-size)'),
        )
      }
      // 估算标记就是 warn · 描边 · md 的 Tag：琥珀字、同色 1px 边、透明底（等于改前 .k-estimate）。
      await open(page, theme, 'estimate-badge')
      const estimate = section(page, 'estimate-badge').getByText('Estimated from bars')
      await expect(estimate).toHaveAttribute('data-slot', 'estimate-badge')
      await expect(estimate).toHaveCSS('color', await token(page, '--signal-amber'))
      await expect(estimate).toHaveCSS('border-top-color', await token(page, '--signal-amber'))
      await expect(estimate).toHaveCSS('border-top-width', '1px')
      await expect(estimate).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)')
    })

    test('JSON 查看器：树是 treegrid，→ 展开 ← 收起；查找命中高亮、祖先自动展开，命中数在 role=status 里', async ({
      page,
    }) => {
      await open(page, theme, 'json-viewer')
      const area = section(page, 'json-viewer')
      const tree = area.getByRole('treegrid', { name: '消息' })
      await expect(tree).toBeVisible()
      // 默认只开根：orders 是收着的，里面的 FILL-0231 看不见。
      await expect(tree.getByText('FILL-0231')).toHaveCount(0)
      const orders = tree.getByRole('row', { name: /orders/ }).first()
      await orders.focus()
      await page.keyboard.press('ArrowRight')
      await expect(orders).toHaveAttribute('aria-expanded', 'true')
      await page.keyboard.press('ArrowLeft')
      await expect(orders).toHaveAttribute('aria-expanded', 'false')
      const search = area.getByRole('searchbox', { name: '在 JSON 里查找' }).first()
      await search.fill('FILL-0240')
      await expect(tree.locator('mark.k-json-hit')).toHaveText('FILL-0240')
      await expect(area.getByRole('status').first()).toHaveText('1 处命中')
      await search.fill('')
      await expect(tree.getByText('FILL-0240')).toHaveCount(0)
    })

    test('快捷键方块：20 高、圆角 4、6% 白底 12% 白边、500 字重（等于改前 .k-kbd）', async ({ page }) => {
      await open(page, theme, 'kbd')
      const area = section(page, 'kbd')
      const group = area.getByLabel('Ctrl+Shift+H')
      await expect(group.locator('.k-kbd')).toHaveText(['Ctrl', 'Shift', 'H'])
      // .k-keys（ui.css 451-454）gap 4；.k-kbd（:456-470）。
      await expect(group).toHaveCSS('column-gap', '4px')
      const key = group.locator('.k-kbd').first()
      await expect(key).toHaveCSS('height', '20px')
      await expect(key).toHaveCSS('padding', '0px 4px')
      await expect(key).toHaveCSS('border-top-left-radius', '4px')
      await expect(key).toHaveCSS('background-color', 'rgba(255, 255, 255, 0.06)')
      await expect(key).toHaveCSS('border-top-color', 'rgba(255, 255, 255, 0.12)')
      await expect(key).toHaveCSS('font-weight', '500')
      await expect(key).toHaveCSS('color', await token(page, '--ink-200'))
    })

    test('数字框：30 高、3% 白底 12% 白边；打字、方向键、拖动改值；sm 26、禁用 0.45、非法红边（等于改前 .k-num）', async ({
      page,
    }) => {
      await open(page, theme, 'number-input')
      const area = section(page, 'number-input')
      const box = area.locator('.k-num').first()
      const field = area.getByRole('spinbutton', { name: '线宽' })
      // .k-num（ui.css 8-22）：30 高 · 圆角 control · 3% 白底 12% 白边 · 指针 ew-resize；值 500；.k-unit 在右。
      await expect(box).toHaveCSS('height', '30px')
      await expect(box).toHaveCSS('width', '96px')
      await expect(box).toHaveCSS('background-color', 'rgba(255, 255, 255, 0.03)')
      await expect(box).toHaveCSS('border-top-color', 'rgba(255, 255, 255, 0.12)')
      await expect(box).toHaveCSS('border-top-left-radius', await radius(page, '--radius-control'))
      await expect(box).toHaveCSS('cursor', 'ew-resize')
      await expect(field).toHaveCSS('font-weight', '500')
      await expect(field).toHaveCSS('padding-left', '12px')
      await expect(box.locator('.k-unit')).toHaveText('px')
      await expect(box.locator('.k-unit')).toHaveCSS('color', await token(page, '--ink-300'))
      // .sm 26 高；.dis 0.45 · not-allowed；.err 红边：G2 起与 Input 的 aria-invalid 同为 --k-status-danger-foreground（原写死 55% 浅红）。
      await expect(area.locator('.k-num.sm')).toHaveCSS('height', '26px')
      await expect(area.getByRole('spinbutton', { name: '禁用' }).locator('..')).toHaveCSS('opacity', '0.45')
      await expect(area.getByRole('spinbutton', { name: '非法' }).locator('..')).toHaveCSS(
        'border-top-color',
        await token(page, '--k-status-danger-foreground'),
      )
      // 聚焦（:35-38）：边变亮、指针变打字的 I 形。
      await field.focus()
      await expect(box).toHaveCSS('border-top-color', 'rgba(255, 255, 255, 0.22)')
      await expect(box).toHaveCSS('cursor', 'text')
      // 方向键按步长改；打字越界夹进范围（1–40）。
      const shown = area.locator('[data-gallery-number]')
      await page.keyboard.press('ArrowUp')
      await expect(shown).toHaveText('15')
      await page.keyboard.press('Shift+ArrowDown')
      await expect(shown).toHaveText('5')
      await field.fill('99')
      await expect(shown).toHaveText('40')
      // 自动：值等于哨兵时框里写「自动」。
      await expect(area.getByRole('spinbutton', { name: '根数' })).toHaveValue('自动')
      // 按住往左拖 20px：每 4px 一档，向左变小（40 → 35）。
      await field.blur()
      const edge = (await box.boundingBox())!
      await page.mouse.move(edge.x + 40, edge.y + 15)
      await page.mouse.down()
      await page.mouse.move(edge.x + 40 - 20, edge.y + 15, { steps: 5 })
      await expect(box).toHaveClass(/scrubbing/)
      await page.mouse.up()
      await expect(shown).toHaveText('35')
    })

    test('日期时间框：分段打字、日历按钮打开日历选日、范围外的日子点不了（外框等于改前 .k-dt-input）', async ({
      page,
    }) => {
      await open(page, theme, 'date-time-input')
      const area = section(page, 'date-time-input')
      const shown = area.locator('[data-gallery-datetime]')
      await expect(shown).toHaveText('2026-11-14 09:30')
      const input = area.locator('.k-dt-date .k-dt-input').first()
      // .k-dt-input（ui.css 618-632）：30 高 · 内边 0 8 · 4% 白底 8% 白边 · 圆角 6；sm（:640-644）26 高 · 内边 0 6。
      await expect(input).toHaveCSS('height', '30px')
      await expect(input).toHaveCSS('padding', '0px 8px')
      await expect(input).toHaveCSS('background-color', 'rgba(255, 255, 255, 0.04)')
      await expect(input).toHaveCSS('border-top-color', 'rgba(255, 255, 255, 0.08)')
      await expect(input).toHaveCSS('border-top-left-radius', '6px')
      await expect(area.locator('.k-dt.sm .k-dt-input')).toHaveCSS('height', '26px')
      // 分段：聚焦的那一段橙暗底（:651-654，28% 橙）；打字改值（月 → 12）。
      const month = area.locator('.k-dt-date .k-dt-seg').nth(1)
      await month.click()
      await expect
        .poll(() => colorAt(page, month, 'background-color'))
        .toEqual(await rgba(page, await resolved(page, 'background-color', 'var(--alpha-white-10)')))
      await page.keyboard.type('12')
      await expect(shown).toHaveText('2026-12-14 09:30')
      // 日历：按钮打开，选中日橙底（:719-723），范围外的日子（min / max 只在「带秒」那一行）点不了。
      await area.getByRole('button', { name: '选起点的日期' }).click()
      const cal = page.locator('.k-cal')
      await expect(cal).toBeVisible()
      await expect(cal.locator('.k-cal-cell[data-selected]')).toHaveCSS(
        'background-color',
        await token(page, '--ink-100'),
      )
      await cal
        .getByRole('button', { name: /12月20日/ })
        .first()
        .click()
      await expect(cal).toHaveCount(0)
      await expect(shown).toHaveText('2026-12-20 09:30')
    })

    test('加载骨架：点阵条（12 高、bg-200、line-200 边、圆角 control），纵向 gap 8、内边 space-3；读屏是 role=status', async ({
      page,
    }) => {
      await open(page, theme, 'skeleton')
      const area = section(page, 'skeleton')
      const line = area.locator('.k-loading-line').first()
      // .k-loading-line（ui.css 757-767）：12 高 · bg-200 · 1px line-200 边 · 圆角 control；.k-loading（:747-752）纵向 gap 8 · 内边 space-3。
      await expect(line).toHaveCSS('height', '12px')
      await expect(line).toHaveCSS('background-color', await token(page, '--bg-200'))
      await expect(line).toHaveCSS('border-top-color', await token(page, '--line-200'))
      await expect(line).toHaveCSS('border-top-left-radius', await radius(page, '--radius-control'))
      await expect(area.locator('.k-loading').first()).toHaveCSS('row-gap', '8px')
      await expect(area.locator('.k-loading').first()).toHaveCSS(
        'padding-left',
        await resolved(page, 'padding-left', 'var(--space-3)'),
      )
      await expect(area.getByRole('status').first()).toHaveAttribute('aria-busy', 'true')
      // 读屏文字用 Tailwind 的 sr-only（原来是应用里的 .kc-visually-hidden）：包的样式表里要真有这条类，文字才不露出来。
      await expect(area.getByRole('status').first().locator('.sr-only')).toHaveCSS('width', '1px')
    })

    test('加载态（Loading 单入口）：phase 钉住各段；caption 亮强调色灯，超时是琥珀条（--k-status-warn-*）加重试；pending 等 500ms 才出骨架，到了换成内容', async ({
      page,
    }) => {
      await open(page, theme, 'loading')
      const area = section(page, 'loading')
      // caption（:786-788）：LED accent + 文案；超时（:792-799）：琥珀条 + 重试按钮靠右。
      await expect(area.getByText('加载 涨停池 · 本机服务')).toBeVisible()
      await expect(area.locator('.k-loading-caption .k-led').first()).toHaveCSS(
        'background-color',
        await token(page, '--accent'),
      )
      await expect(area.getByText('仍在加载 · 本机服务')).toBeVisible()
      const bar = area.locator('.k-loading-bar')
      await expect(bar).toContainText('点重试 · 本机服务 10 秒无回应')
      await expect(bar.getByRole('img', { name: '没有回应' })).toBeVisible()
      await expect
        .poll(() => colorAt(page, bar, 'border-top-color'))
        .toEqual(await rgba(page, await resolved(page, 'border-top-color', 'var(--k-status-warn-borderColor)')))
      const retry = bar.getByRole('button', { name: '重试' })
      const [barBox, retryBox] = await Promise.all([bar.boundingBox(), retry.boundingBox()])
      expect(retryBox!.x + retryBox!.width).toBeGreaterThan(barBox!.x + barBox!.width - 16)
      // Loading：等了 500ms 才出骨架；数据到了换成内容。
      const wait = area.locator('[data-gallery-toggle]')
      await expect(area.locator('.k-loading-wait').last().locator('.k-loading-line').first()).toBeVisible()
      await wait.click()
      await expect(area.locator('[data-gallery-loaded]')).toBeVisible()
    })

    test('量出来的骨架（MeasuredSkeleton）：加载态有骨架条与读屏名，切到已加载标题与按钮的位置不跳（≤1px）', async ({
      page,
    }) => {
      await open(page, theme, 'measured-skeleton')
      const area = section(page, 'measured-skeleton')
      // 读屏：role=status 带名字（包里不带文字，名字由调用方给）。
      await expect(area.getByRole('status').filter({ hasText: '正在载入文章卡片' })).toHaveCount(1)
      // 500ms 后骨架条才露出（之前不可见层占位）：等到 is-wait 去掉。
      await expect(area.locator('.k-measured:not(.is-wait)')).toHaveCount(1)
      const bars = area.locator('[skullet-rect]')
      expect(await bars.count()).toBeGreaterThan(0)
      // 骨架底色 line-200（bg-200 在面板底上看不见），不脉冲。
      await expect(bars.first()).toHaveCSS('background-color', await token(page, '--line-200'))
      const rects = await bars.evaluateAll((nodes) =>
        nodes.map((node) => {
          const r = node.getBoundingClientRect()
          return { x: r.x, y: r.y, width: r.width, height: r.height }
        }),
      )
      // 加载态下真组件在 aria-hidden 的不可见层里量版，按角色找要带 includeHidden。
      const button = area.getByRole('button', { name: '查看全文', includeHidden: true })
      const title = area.getByRole('heading', { includeHidden: true })
      const [buttonLoading, titleLoading] = [await button.boundingBox(), await title.boundingBox()]
      // 加载态下按钮在不可见层里（visibility 隐藏但占位）：骨架块与它同位同大小。
      const block = rects.find(
        (r) =>
          Math.abs(r.x - buttonLoading!.x) <= 1 &&
          Math.abs(r.y - buttonLoading!.y) <= 1 &&
          Math.abs(r.width - buttonLoading!.width) <= 1 &&
          Math.abs(r.height - buttonLoading!.height) <= 1,
      )
      expect(block, '按钮有一块位置大小一致的骨架块').toBeDefined()
      // 标题两行：两条文字条，左边与标题对齐，落在标题框里。
      const lines = rects.filter(
        (r) => r.y >= titleLoading!.y - 1 && r.y + r.height <= titleLoading!.y + titleLoading!.height + 1,
      )
      expect(lines.length).toBe(2)
      for (const line of lines) expect(Math.abs(line.x - titleLoading!.x)).toBeLessThanOrEqual(1)

      await area.getByRole('button', { name: '已加载' }).click()
      await expect(area.getByRole('heading')).toContainText('营收好于预期')
      await expect(area.getByRole('status').filter({ hasText: '正在载入文章卡片' })).toHaveCount(0)
      // 骨架退场后（淡出结束）只剩真内容；位置对骨架块不动。
      await expect(bars).toHaveCount(0)
      const [buttonLoaded, titleLoaded] = [await button.boundingBox(), await title.boundingBox()]
      for (const key of ['x', 'y', 'width', 'height'] as const) {
        expect(Math.abs(buttonLoaded![key] - block![key]), `按钮 ${key}`).toBeLessThanOrEqual(1)
        expect(Math.abs(titleLoaded![key] - titleLoading![key]), `标题 ${key}`).toBeLessThanOrEqual(1)
      }
      for (const line of lines) {
        expect(Math.abs(line.x - titleLoaded!.x)).toBeLessThanOrEqual(1)
        expect(line.y).toBeGreaterThanOrEqual(titleLoaded!.y - 1)
        expect(line.y + line.height).toBeLessThanOrEqual(titleLoaded!.y + titleLoaded!.height + 1)
      }
    })

    test('量化：涨跌色读 pnl-up / pnl-down；根上设 data-updown="cn" 互换；方向不只靠颜色；三类市场的价格写法', async ({
      page,
    }) => {
      await open(page, theme, 'change-text')
      const change = section(page, 'change-text')
      const up = change.getByTestId('quant-up')
      const down = change.getByTestId('quant-down')
      const color = (locator: Locator) => locator.evaluate((element) => getComputedStyle(element).color)
      // 默认绿涨红跌：算出来的颜色就是 token 的值，两个不一样。
      await expect.poll(() => color(up)).toBe(await token(page, '--pnl-up'))
      await expect.poll(() => color(down)).toBe(await token(page, '--pnl-down'))
      const before = { up: await color(up), down: await color(down) }
      expect(before.up).not.toBe(before.down)
      // 零不着色：继承周围的字色，不是涨也不是跌的颜色。
      const flat = await color(change.getByTestId('quant-flat'))
      expect(flat).not.toBe(before.up)
      expect(flat).not.toBe(before.down)
      // 文字自带符号，箭头是另加的。
      await expect(up).toHaveText('+1.23%')
      await expect(down).toHaveText('-0.50%')
      await expect(change.getByTestId('quant-arrow-up')).toContainText('\u25B2')
      await expect(change.getByTestId('quant-arrow-down')).toContainText('\u25BC')
      await show(page, 'pnl-text')
      const pnl = section(page, 'pnl-text')
      await expect.poll(() => color(pnl.getByTestId('quant-pnl-up'))).toBe(before.up)
      await expect.poll(() => color(pnl.getByTestId('quant-pnl-down'))).toBe(before.down)
      // 红涨绿跌：涨的颜色变成原来跌的，跌的变成原来涨的，件没改。
      await page.evaluate(() => document.documentElement.setAttribute('data-updown', 'cn'))
      await expect.poll(() => color(pnl.getByTestId('quant-pnl-up'))).toBe(before.down)
      await expect.poll(() => color(pnl.getByTestId('quant-pnl-down'))).toBe(before.up)
      await show(page, 'quant-format')
      const format = section(page, 'quant-format')
      await expect(format.getByTestId('quant-price-ashare')).toHaveText('1,688.00')
      await expect(format.getByTestId('quant-price-future')).toHaveText('4,500.25')
      await expect(format.getByTestId('quant-price-crypto')).toHaveText('0.00000123')
    })

    test('量化第二批：KPI 瓦片的颜色读 token、涨跌随 data-updown、没数据是空态；阈值虚线与接近上限的边框', async ({
      page,
    }) => {
      await open(page, theme, 'spark-tile')
      const row = section(page, 'spark-tile').getByTestId('spark-row')
      const tiles = row.locator('.k-spark-tile')
      await expect(tiles).toHaveCount(5)
      const first = tiles.nth(0)
      await expect(first.locator('.k-spark-tile-tag')).toHaveText('NET ASSET')
      await expect(first.locator('.k-spark-tile-value')).toHaveText('2.42M')
      const color = (locator: Locator) => locator.evaluate((element) => getComputedStyle(element).color)
      const delta = first.locator('[data-slot="change-text"]')
      await expect(delta).toHaveText('▲+1.31%')
      await expect.poll(() => color(delta)).toBe(await token(page, '--pnl-up'))
      // 迷你线真的画出来：有尺寸，颜色是 ink-100，末点跟线同色。
      const line = first.locator('polyline')
      const box = await line.boundingBox()
      expect(box!.width).toBeGreaterThan(40)
      expect(box!.height).toBeGreaterThan(8)
      await expect
        .poll(() => line.evaluate((element) => getComputedStyle(element).stroke))
        .toBe(await token(page, '--ink-100'))
      await expect.poll(() => bg(first.locator('.k-spark-tile-end'))).toBe(await token(page, '--ink-100'))
      // 越低越好的指标：线用 ink-300。
      await expect
        .poll(() =>
          tiles
            .nth(1)
            .locator('polyline')
            .evaluate((element) => getComputedStyle(element).stroke),
        )
        .toBe(await token(page, '--ink-300'))
      // 接近上限：边框是暗橙，说明写着字且转琥珀，阈值虚线在线的上面。
      const near = tiles.nth(3)
      await expect
        .poll(() => near.evaluate((element) => getComputedStyle(element).borderTopColor))
        .toBe(await token(page, '--signal-orange-dim'))
      await expect(near.locator('.k-spark-tile-note')).toHaveText('接近上限')
      await expect.poll(() => color(near.locator('.k-spark-tile-note'))).toBe(await token(page, '--signal-amber'))
      const limit = await near.locator('.k-spark-tile-limit').boundingBox()
      const nearLine = await near.locator('polyline').boundingBox()
      expect(limit!.width).toBeGreaterThan(40)
      expect(limit!.y).toBeLessThan(nearLine!.y + nearLine!.height)
      // 没有数据：数值写 —，不画折线、不画样本。
      const empty = tiles.nth(4)
      await expect(empty.locator('.k-spark-tile-value')).toHaveText('—')
      await expect(empty.locator('polyline')).toHaveCount(0)
      // 红涨绿跌：涨幅的颜色换成原来跌的颜色。
      const down = await token(page, '--pnl-down')
      await page.evaluate(() => document.documentElement.setAttribute('data-updown', 'cn'))
      await expect.poll(() => color(delta)).toBe(down)
      await page.evaluate(() => document.documentElement.removeAttribute('data-updown'))
      // 可点：点一下数值加一。
      const clickable = section(page, 'spark-tile').locator('button.k-spark-tile')
      await clickable.click()
      await expect(clickable.locator('.k-spark-tile-value')).toHaveText('1')
    })

    test('量化第二批：仪表的填充长度与读数一致、warn 转琥珀、刻度与 sync 大百分比', async ({ page }) => {
      await open(page, theme, 'meter')
      const meters = section(page, 'meter')
      const bars = meters.getByTestId('meter-bars').locator('.k-meter')
      const fill = async (meter: Locator) => {
        const track = (await meter.locator('.k-meter-track').boundingBox())!
        const filled = (await meter.locator('.k-meter-fill').boundingBox())!
        return filled.width / (track.width - 2)
      }
      // 长度编码量：72% 就是约 72% 的槽宽。弹簧还在走时等它停。
      await expect.poll(async () => Math.round((await fill(bars.nth(0))) * 100)).toBe(72)
      await expect.poll(async () => Math.round((await fill(bars.nth(1))) * 100)).toBe(38)
      await expect(bars.nth(0).locator('.k-meter-value')).toHaveText('72%')
      // warn：数转琥珀、名字里写着原因；上限刻度在 60% 的位置。
      const warn = bars.nth(1)
      await expect
        .poll(() => warn.locator('.k-meter-value').evaluate((element) => getComputedStyle(element).color))
        .toBe(await token(page, '--signal-amber'))
      await expect(warn.locator('.k-meter-label')).toContainText('超过 60% 上限')
      const track = (await warn.locator('.k-meter-track').boundingBox())!
      const mark = (await warn.locator('.k-meter-mark').boundingBox())!
      expect((mark.x - track.x) / track.width).toBeGreaterThan(0.55)
      expect((mark.x - track.x) / track.width).toBeLessThan(0.65)
      await expect.poll(() => bg(warn.locator('.k-meter-mark'))).toBe(await token(page, '--signal-amber'))
      // 读屏：role=meter 带当前值。
      await expect(bars.nth(0).getByRole('meter')).toHaveAttribute('aria-valuenow', '72')
      // 刻度：五个刻度字，弱势的指针是红色。
      const gauges = meters.getByTestId('meter-gauges').locator('.k-meter')
      await expect(gauges.nth(0).locator('.k-meter-ticks span')).toHaveText(['0', '25', '50', '75', '100'])
      await expect.poll(() => bg(gauges.nth(1).locator('.k-meter-pin'))).toBe(await token(page, '--signal-red'))
      await expect.poll(() => bg(gauges.nth(0).locator('.k-meter-pin'))).toBe(await token(page, '--ink-100'))
      // sync：右侧大百分比，字比条上的数大得多；评估点刻度画在最右。
      const sync = meters.getByTestId('meter-sync').locator('.k-meter').first()
      await expect(sync.locator('.k-meter-big')).toHaveText('70%')
      const big = await sync
        .locator('.k-meter-big')
        .evaluate((element) => parseFloat(getComputedStyle(element).fontSize))
      expect(big).toBeGreaterThan(20)
      const syncTrack = (await sync.locator('.k-meter-track').boundingBox())!
      const syncMark = (await sync.locator('.k-meter-mark').boundingBox())!
      expect(syncMark.x - syncTrack.x).toBeGreaterThan(syncTrack.width - 6)
    })

    test('量化第二批：订单流仪表的条按读数画在中线两侧、不用涨跌色；N/A 不画条、估算灰显', async ({ page }) => {
      await open(page, theme, 'flow-gauges')
      const flow = section(page, 'flow-gauges').locator('.k-flow').first()
      const boxes = flow.locator('.k-flow-cell-box')
      await expect(boxes).toHaveCount(4)
      const pressure = boxes.nth(0)
      await expect(pressure.locator('.k-flow-value')).toHaveText('+62')
      const zero = (await pressure.locator('.k-flow-zero').boundingBox())!
      const bar = (await pressure.locator('.k-flow-zero i').boundingBox())!
      // +62：从中线往右、占半宽的 62%（31% 的槽宽）。
      expect(bar.x).toBeGreaterThan(zero.x + zero.width / 2 - 3)
      expect(bar.width / zero.width).toBeGreaterThan(0.29)
      expect(bar.width / zero.width).toBeLessThan(0.33)
      await expect.poll(() => bg(pressure.locator('.k-flow-zero i'))).toBe(await token(page, '--series-1'))
      // −18：在中线左边，颜色是 series-2，不是跌的红。
      const change = boxes.nth(1)
      const negZero = (await change.locator('.k-flow-zero').boundingBox())!
      const neg = (await change.locator('.k-flow-zero i').boundingBox())!
      expect(neg.x + neg.width).toBeLessThan(negZero.x + negZero.width / 2 + 3)
      await expect.poll(() => bg(change.locator('.k-flow-zero i'))).toBe(await token(page, '--series-2'))
      await page.evaluate(() => document.documentElement.setAttribute('data-updown', 'cn'))
      await expect.poll(() => bg(change.locator('.k-flow-zero i'))).toBe(await token(page, '--series-2'))
      await page.evaluate(() => document.documentElement.removeAttribute('data-updown'))
      // 挂单柱：十档里最高的一档占满。矩阵：四个周期各一行，最后一行写 N/A、没有 LED。
      const bars = boxes.nth(2).locator('.k-flow-depth i')
      await expect(bars).toHaveCount(8)
      await expect(boxes.nth(2).locator('.k-flow-note')).toHaveText('Bid 71% · Ask 29%')
      const rows = boxes.nth(3).locator('.k-flow-matrix-row')
      await expect(rows).toHaveCount(4)
      await expect(rows.nth(3)).toContainText('N/A')
      await expect(rows.nth(3).locator('.k-flow-led')).toHaveCount(0)
      await expect(rows.nth(0).locator('.k-flow-led')).toHaveCount(6)
      // 窗口不足：写 N/A、不画条；估算：写估算字、整格变淡。
      const lacking = section(page, 'flow-gauges').locator('.k-flow').nth(1).locator('.k-flow-cell-box')
      await expect(lacking.nth(0).locator('.k-flow-value')).toHaveText('N/A')
      await expect(lacking.nth(0).locator('.k-flow-zero i')).toHaveCount(0)
      await expect(lacking.nth(1).locator('.k-flow-est')).toHaveText('估算')
      await expect
        .poll(() =>
          lacking
            .nth(1)
            .locator('.k-flow-zero')
            .evaluate((element) => getComputedStyle(element).opacity),
        )
        .toBe('0.55')
    })

    test('量化第二批：状态带的段色读 series token、宽度按时间；点图例高亮一个状态；估算段带斜纹', async ({ page }) => {
      await open(page, theme, 'regime-strip')
      const strip = section(page, 'regime-strip').getByTestId('regime-strip')
      const band = (await strip.locator('.k-regime-band').boundingBox())!
      const first = strip.locator('.k-regime-band i').first()
      await expect.poll(() => bg(first)).toBe(await token(page, '--series-1'))
      const firstBox = (await first.boundingBox())!
      // 第一段占 12/100 的带宽，从最左边起。
      expect(firstBox.x).toBeLessThan(band.x + 2)
      expect(firstBox.width / band.width).toBeGreaterThan(0.11)
      expect(firstBox.width / band.width).toBeLessThan(0.13)
      await expect
        .poll(() => bg(strip.locator('.k-regime-band i[data-state="crisis"]')))
        .toBe(await token(page, '--series-7'))
      // 图例：名字都写着，色块跟带上同色。
      const legend = strip.locator('.k-regime-legend')
      await expect(legend).toContainText('趋势上')
      await expect(legend).toContainText('危机')
      await expect
        .poll(() => bg(legend.locator('li[data-state="vol"] .k-regime-swatch')))
        .toBe(await token(page, '--series-4'))
      await expect(legend.locator('li[data-current]')).toContainText('当前')
      // 估算段：斜纹是背景图，不是换色。
      const estimated = strip.locator('.k-regime-band i[data-estimated]')
      await expect
        .poll(() => estimated.evaluate((element) => getComputedStyle(element).backgroundImage))
        .toContain('repeating-linear-gradient')
      await expect.poll(() => first.evaluate((element) => getComputedStyle(element).backgroundImage)).toBe('none')
      await expect(legend).toContainText('估（尚未确认）')
      // 点「危机」：别的状态变淡，危机还在；再点取消。
      const crisis = legend.getByRole('button', { name: /危机/ })
      await crisis.click()
      await expect(crisis).toHaveAttribute('aria-pressed', 'true')
      await expect.poll(() => first.evaluate((element) => getComputedStyle(element).opacity)).toBe('0.25')
      await expect
        .poll(() =>
          strip
            .locator('.k-regime-band i[data-state="crisis"]')
            .evaluate((element) => getComputedStyle(element).opacity),
        )
        .toBe('1')
      await crisis.click()
      await expect.poll(() => first.evaluate((element) => getComputedStyle(element).opacity)).toBe('1')
    })

    test('量化第二批：必要条件块的阻止项有文字、每格有状态字、不可提交的结论是红的、点开看详情', async ({ page }) => {
      await open(page, theme, 'consensus-block')
      const doc = section(page, 'consensus-block')
      const color = (locator: Locator) => locator.evaluate((element) => getComputedStyle(element).color)
      // 不可推进：未过那一格写着「未过」与原因，结论是红色的「不可推进」，hash 写 —。
      const blocked = doc.getByTestId('consensus-blocked')
      const gate = blocked.locator('.k-consensus-party[data-state="blocked"]')
      await expect(gate).toContainText('未过')
      await expect(gate).toContainText('偏离门未过 19.4%')
      await expect(gate.locator('.k-consensus-lamp')).toBeVisible()
      const verdict = blocked.locator('.k-consensus-verdict')
      await expect(verdict).toHaveText('不可推进')
      await expect.poll(() => color(verdict)).toBe(await token(page, '--signal-red'))
      await expect(blocked.locator('.k-consensus-summary')).toContainText('1 通过 · 0 接近 · 1 未过 · 1 未填')
      await expect(blocked.locator('.k-consensus-hash')).toHaveText('—')
      await expect(blocked.locator('.k-consensus-party[data-state="unknown"]')).toContainText('未返回')
      // 超时、失效、评估中：各有自己的字，没有一格只剩一个灯。
      const stale = doc.getByTestId('consensus-stale')
      await expect(stale.locator('.k-consensus-party[data-state="timeout"]')).toContainText('超时')
      await expect(stale.locator('.k-consensus-party[data-state="stale"]')).toContainText('需重检')
      await expect(stale.locator('.k-consensus-party[data-state="pending"]')).toContainText('评估中')
      for (const party of await stale.locator('.k-consensus-party').all()) {
        expect(((await party.locator('.k-consensus-state').textContent()) ?? '').trim().length).toBeGreaterThan(0)
      }
      // 可提交：接近那一格是琥珀字；点开才看到详情；点 hash 是按钮。
      const ok = doc.getByTestId('consensus-ok')
      const near = ok.locator('.k-consensus-party[data-state="warn"]')
      await expect.poll(() => color(near.locator('.k-consensus-msg'))).toBe(await token(page, '--signal-amber'))
      await expect(ok.locator('.k-consensus-detail')).toHaveCount(0)
      await near.click()
      await expect(near).toHaveAttribute('aria-expanded', 'true')
      await expect(ok.locator('.k-consensus-detail')).toContainText('单票集中度上限 60%')
      await near.click()
      await expect(ok.locator('.k-consensus-detail')).toHaveCount(0)
      await expect(ok.getByRole('button', { name: '7f3a' })).toBeVisible()
      // 斜切壳：clip-path 是有值的多边形。
      await expect
        .poll(() => ok.locator('.k-consensus-shell').evaluate((element) => getComputedStyle(element).clipPath))
        .toContain('polygon')
    })

    test('十进制框：↑ 按 tick 走一格（先对齐），Shift 十格，只读与禁用不动；点 − / + 生效；warning 没有 aria-invalid', async ({
      page,
    }) => {
      await open(page, theme, 'decimal-field')
      const field = section(page, 'decimal-field')
      const price = field.getByRole('textbox', { name: '价格', exact: true })
      const priceOut = field.getByTestId('decimal-price-out')
      // 67000.3 不在 0.5 的格上：↑ 先对齐到 67000.5，再 ↑ 到 67001。
      await price.focus()
      await page.keyboard.press('ArrowUp')
      await expect(price).toHaveValue('67000.5')
      await expect(priceOut).toHaveText('67000.5')
      await page.keyboard.press('ArrowUp')
      await expect(price).toHaveValue('67001')
      await page.keyboard.press('ArrowDown')
      await expect(price).toHaveValue('67000.5')
      await page.keyboard.press('Shift+ArrowUp')
      await expect(price).toHaveValue('67005.5')
      // 点 − / +：生效，名字是调用方传的。
      await field.getByRole('button', { name: '加一格' }).first().click()
      await expect(price).toHaveValue('67006')
      await field.getByRole('button', { name: '减一格' }).first().click()
      await expect(price).toHaveValue('67005.5')
      // 空框从 base（1）起，步长 0.001；框里右侧有单位。
      const qty = field.getByRole('textbox', { name: '数量', exact: true })
      await qty.focus()
      await page.keyboard.press('ArrowDown')
      await expect(qty).toHaveValue('0.999')
      await expect(field.locator('[data-slot="decimal-field-unit"]')).toHaveText('BTC')
      // 只读：方向键不改，按钮禁用，字还在。
      const readOnly = field.getByRole('textbox', { name: '只读价格' })
      await readOnly.focus()
      await page.keyboard.press('ArrowUp')
      await page.keyboard.press('Shift+ArrowUp')
      await expect(readOnly).toHaveValue('100.5')
      await expect(readOnly).toHaveAttribute('readonly', '')
      const disabled = field.getByRole('textbox', { name: '禁用价格' })
      await expect(disabled).toBeDisabled()
      // 按钮依次是：价格、数量、只读、禁用；后两组的 + 都灰掉。
      await expect(field.getByRole('button', { name: '加一格' }).nth(2)).toBeDisabled()
      await expect(field.getByRole('button', { name: '加一格' }).nth(3)).toBeDisabled()
      // error 报无效，warning 不报；两者边色都不是默认边色。
      const borderOf = (locator: Locator) => locator.evaluate((element) => getComputedStyle(element).borderTopColor)
      const plain = await borderOf(price)
      await expect(field.getByRole('textbox', { name: '错误价格' })).toHaveAttribute('aria-invalid', 'true')
      const warning = field.getByRole('textbox', { name: '警告价格' })
      await expect(warning).not.toHaveAttribute('aria-invalid')
      expect(await borderOf(warning)).not.toBe(plain)
      expect(await borderOf(field.getByRole('textbox', { name: '错误价格' }))).not.toBe(plain)
    })

    test('积木：数据表每种列类型一列，数字右对齐，盈亏与涨跌幅的颜色读 pnl-up / pnl-down 并在 data-updown="cn" 下互换，点表头排序', async ({
      page,
    }) => {
      await open(page, theme, 'data-grid')
      const grid = section(page, 'data-grid').getByTestId('grid-demo')
      const first = grid.getByRole('row').nth(1)
      const cell = (name: string) => first.locator(`[data-col="${name}"]`)
      await expect(cell('symbol')).toContainText('BTCUSDT')
      await expect(cell('symbol')).toContainText('BINANCE')
      await expect(cell('side')).toHaveText('Buy')
      await expect(cell('price')).toHaveText('64,250.50')
      await expect(cell('qty')).toHaveText('0.250')
      await expect(cell('pnl')).toHaveText('+125.40 USDT')
      await expect(cell('change')).toHaveText('+1.23%')
      await expect(cell('at')).toHaveText('2026-11-14 01:02:03')
      // 数字列靠右、等宽数字；文字列靠左。
      await expect(cell('price')).toHaveCSS('justify-content', 'flex-end')
      await expect(cell('price')).toHaveCSS('font-variant-numeric', 'tabular-nums')
      await expect(cell('note')).toHaveCSS('justify-content', 'normal')
      const color = (locator: Locator) => locator.evaluate((element) => getComputedStyle(element).color)
      const gain = cell('pnl').locator('[data-tone]')
      const loss = grid.getByRole('row').nth(2).locator('[data-col="pnl"] [data-tone]')
      const [upColor, downColor] = [await token(page, '--pnl-up'), await token(page, '--pnl-down')]
      expect(upColor).not.toBe(downColor)
      await expect.poll(() => color(gain)).toBe(upColor)
      await expect.poll(() => color(loss)).toBe(downColor)
      await page.evaluate(() => document.documentElement.setAttribute('data-updown', 'cn'))
      await expect.poll(() => color(gain)).toBe(downColor)
      await expect.poll(() => color(loss)).toBe(upColor)
      // 点表头排序：盈亏升序，亏的那行排到最前。
      await grid.getByRole('columnheader', { name: 'PnL' }).getByRole('button').click()
      await expect(grid.getByRole('columnheader', { name: 'PnL' })).toHaveAttribute('aria-sort', 'ascending')
      await expect(grid.getByRole('row').nth(1).locator('[data-col="symbol"]')).toContainText('600519')
    })

    test('积木：数据表双击列头右缘把手、或右键「适应内容」，列宽按列头与数据里最宽的字调整，文字不被截断', async ({
      page,
    }) => {
      await open(page, theme, 'data-grid')
      const grid = section(page, 'data-grid').getByTestId('grid-columns')
      const head = (name: string) => grid.getByRole('columnheader', { name })
      const width = async (name: string) => (await head(name).boundingBox())!.width
      // 内容被省略号截掉时 scrollWidth 大于 clientWidth：格子、品种代码、列头名都查。
      const clipped = () =>
        grid.locator('.k-grid-cell, .k-grid-name, .k-grid-head-name > span').evaluateAll((els) =>
          els
            .filter((el) => el.scrollWidth > el.clientWidth)
            .map((el) => `${el.className}|${el.textContent}|${el.scrollWidth}>${el.clientWidth}`)
            .join(';'),
        )
      // 先把「Chg %」拖到最窄，再双击把手：宽度应该长回来，刚好放下内容。
      const handle = grid.getByRole('separator', { name: /Chg %/ })
      const box = (await handle.boundingBox())!
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
      await page.mouse.down()
      await page.mouse.move(box.x - 200, box.y + box.height / 2, { steps: 5 })
      await page.mouse.up()
      await expect.poll(() => width('Chg %')).toBeLessThan(40)
      await handle.dblclick()
      await expect.poll(() => width('Chg %')).toBeGreaterThan(40)
      await expect.poll(() => width('Chg %')).toBeLessThan(120)
      // 右键「适应内容」：Time 列原本 160 宽，内容只要一百出头。
      await head('Time (UTC)').click({ button: 'right' })
      await page.getByRole('menuitem', { name: 'Fit column to content' }).click()
      await expect.poll(() => width('Time (UTC)')).toBeLessThan(160)
      // 全部列适应内容：任何格子、列头都不被截断。
      await head('Symbol').click({ button: 'right' })
      await page.getByRole('menuitem', { name: 'Fit all columns to content' }).click()
      await expect.poll(clipped).toBe('')
    })

    test('量化：日历——周条选日、合并同时同国、现在线、类别与国家筛选、行详情、财报意外与排序', async ({ page }) => {
      await open(page, theme, 'event-calendar')
      const cal = section(page, 'event-calendar').locator('[data-slot="event-calendar"]')
      await expect(cal).toBeVisible()
      const rowIds = () =>
        cal.locator('[data-slot="ecal-row"]').evaluateAll((els) => els.map((el) => el.getAttribute('data-id')))
      const card = (day: string) => cal.locator(`.k-ecal-daycard[data-day="${day}"]`)
      const css = (selector: string, prop: 'color' | 'fontWeight') =>
        cal
          .locator(selector)
          .first()
          .evaluate((el, p) => getComputedStyle(el)[p], prop)
      const up = await token(page, '--pnl-up')
      const down = await token(page, '--pnl-down')
      // 周条：周一到周日七张日卡，选中的是今天（11-17），今天带下划线，卡上列出当天各类别的条数。
      await expect(cal.locator('.k-ecal-daycard')).toHaveCount(7)
      await expect(card('2026-11-17')).toHaveAttribute('aria-pressed', 'true')
      await expect(card('2026-11-17')).toHaveAttribute('data-today', 'true')
      await expect(card('2026-11-17')).toContainText('经济 5')
      await expect(card('2026-11-17')).toContainText('财报 3')
      await expect(card('2026-11-16')).not.toContainText('财报')
      // 一天：日期分隔行粘顶，表头的数字列名在它右侧；现在线（09:30）在已发布的 09:00 与未发布的 17:00 之间。
      await expect(cal.locator('[data-slot="ecal-day-head"]')).toHaveCSS('position', 'sticky')
      await expect(cal.locator('[data-slot="ecal-day-head"]')).toContainText('实际')
      expect(
        await cal
          .locator('[data-slot="ecal-row"], [data-slot="ecal-now"]')
          .evaluateAll((els) => els.map((el) => el.getAttribute('data-id') ?? 'now')),
      ).toEqual(['b2', 'b1', 'now', 'b3', 'b4', 'b5'])
      await expect(cal.locator('[data-slot="ecal-now"]')).toContainText('09:30')
      // 实际值只加粗、不上涨跌色；缺值「—」带倒计时；已发布与未发布区分。
      expect(Number(await css('[data-id="b1"] .k-ecal-actual', 'fontWeight'))).toBeGreaterThanOrEqual(600)
      expect(await css('[data-id="b1"] .k-ecal-actual', 'color')).not.toBe(up)
      expect(await css('[data-id="b1"] .k-ecal-actual', 'color')).not.toBe(down)
      await expect(cal.locator('[data-id="b3"] .k-ecal-actual')).toContainText('—')
      await expect(cal.locator('[data-id="b3"] .k-ecal-wait')).toHaveText('7 小时 30 分后')
      await expect(cal.locator('[data-id="b1"]')).toHaveAttribute('data-state', 'released')
      await expect(cal.locator('[data-id="b3"]')).toHaveAttribute('data-state', 'upcoming')
      // 同一时间同一国家合并：b4 写时间与国家，b5 左边留空。
      await expect(cal.locator('[data-id="b4"] .k-ecal-time')).toHaveText('21:30')
      await expect(cal.locator('[data-id="b5"] .k-ecal-time')).toHaveText('')
      await expect(cal.locator('[data-id="b5"] .k-ecal-region')).toHaveText('')
      await expect(cal.locator('[data-id="b5"]')).toHaveAttribute('data-repeat', 'true')
      await expect(cal.locator('[data-id="b2"] .k-ecal-level i.is-on')).toHaveCount(1)
      // 点日卡换天；上一周翻到 11-09 起，今天按钮回来。
      await card('2026-11-18').click()
      expect(await rowIds()).toEqual(['c1', 'c2', 'c3'])
      await cal.getByRole('button', { name: '上一周' }).click()
      await expect(card('2026-11-10')).toBeVisible()
      await cal.getByRole('button', { name: '今天', exact: true }).click()
      expect(await rowIds()).toEqual(['b2', 'b1', 'b3', 'b4', 'b5'])
      // 重要性是单开关：按下只剩 3 档；再按恢复。
      await cal.getByRole('button', { name: '只看高重要' }).click()
      await card('2026-11-18').click()
      expect(await rowIds()).toEqual(['c2', 'c3'])
      await cal.getByRole('button', { name: '只看高重要' }).click()
      // 经济类别下拉：只留「就业」。
      await cal.getByRole('combobox', { name: '经济类别' }).click()
      await page.getByRole('option', { name: '就业' }).click()
      expect(await rowIds()).toEqual(['c1', 'c2'])
      await cal.getByRole('combobox', { name: '经济类别' }).click()
      await page.getByRole('option', { name: '全部类别' }).click()
      // 行详情：点开 a1（11-16）出说明、来源、下次发布与历史值小图；再点收起；没详情的行点了没反应。
      await card('2026-11-16').click()
      await cal.locator('[data-id="a1"]').click()
      const detail = cal.locator('[data-slot="ecal-detail"][data-for="a1"]')
      await expect(detail).toContainText('示例统计局')
      await expect(detail).toContainText('11/30')
      await expect(detail.locator('svg.k-spark')).toBeVisible()
      await expect(cal.locator('[data-id="a1"] .k-ecal-name-btn')).toHaveAttribute('aria-expanded', 'true')
      await cal.locator('[data-id="a1"]').click()
      await expect(detail).toHaveCount(0)
      await cal.locator('[data-id="a2"]').click()
      await expect(cal.locator('[data-slot="ecal-detail"]')).toHaveCount(0)
      // 国家选择框：模态，按地区分组，预设与取消 / 应用；只选 JP 应用后，11-17 只剩 b2。
      await card('2026-11-17').click()
      await cal.getByRole('button', { name: '全部国家' }).click()
      const dialog = page.getByRole('dialog', { name: '选择国家' })
      await expect(dialog.getByText('ASIA')).toBeVisible()
      await dialog.getByRole('checkbox', { name: /丙国/ }).click()
      await dialog.getByRole('button', { name: '取消' }).first().click()
      expect(await rowIds()).toHaveLength(5)
      await cal.getByRole('button', { name: '全部国家' }).click()
      await dialog.getByRole('checkbox', { name: /丙国/ }).click()
      await dialog.getByRole('button', { name: '应用' }).click()
      expect(await rowIds()).toEqual(['b2'])
      await cal.getByRole('button', { name: '1 个国家' }).click()
      await dialog.getByRole('button', { name: '全球' }).click()
      await dialog.getByRole('button', { name: '应用' }).click()
      expect(await rowIds()).toHaveLength(5)
      // 财报页：EPS 意外 +% 涨色、−% 跌色，实际值不上色；时段图标；营收后带币种小字；列头按市值排序。
      const tabs = cal.getByRole('tablist', { name: '日历类别' })
      await tabs.getByRole('tab', { name: '财报' }).click()
      expect(await rowIds()).toEqual(['e1', 'e2', 'e3'])
      expect(await css('[data-id="e1"] .k-ecal-surprise', 'color')).toBe(up)
      await expect(cal.locator('[data-id="e1"] .k-ecal-surprise').first()).toHaveText('+8.40%')
      expect(await css('[data-id="e2"] .k-ecal-surprise', 'color')).toBe(down)
      expect(await css('[data-id="e1"] .k-ecal-actual', 'color')).not.toBe(up)
      await expect(cal.locator('[data-id="e1"] [aria-label="盘前"]')).toBeVisible()
      await expect(cal.locator('[data-id="e3"] [aria-label="盘后"]')).toBeVisible()
      await expect(cal.locator('[data-id="e1"]')).toContainText('18.40 B USD')
      await expect(cal.locator('[data-id="e3"] .k-ecal-actual').first()).toHaveText('—')
      await expect(cal.locator('[data-slot="ecal-links"][data-for="e1"]')).toContainText('电话会')
      await expect(cal.locator('[data-slot="ecal-links"][data-for="e3"]')).toHaveCount(0)
      const cap = cal.getByRole('columnheader', { name: /市值/ })
      await cap.click()
      expect(await rowIds()).toEqual(['e3', 'e1', 'e2'])
      await expect(cap).toHaveAttribute('aria-sort', 'descending')
      await cap.click()
      expect(await rowIds()).toEqual(['e2', 'e1', 'e3'])
      await cap.click()
      expect(await rowIds()).toEqual(['e1', 'e2', 'e3'])
      await tabs.getByRole('tab', { name: '分红' }).click()
      await expect(cal.locator('[data-id="d-1"]')).toContainText('$0.25')
      await card('2026-11-18').click()
      await expect(cal.locator('[data-id="d-2"]')).toContainText('3.41%')
      await tabs.getByRole('tab', { name: 'IPO' }).click()
      await expect(cal.locator('[data-id="i-1"]')).toContainText('14.00 – 16.00')
      await expect(cal.locator('[data-id="i-1"]')).toContainText('已定价')
    })

    test('行快捷操作（#23）：DataGrid 悬停出按钮且列宽不变，右键出同一份菜单，点「Copy code」回调收到这一行，键盘落到行上按钮可见、菜单键与 Shift+F10 开菜单', async ({
      page,
    }) => {
      await open(page, theme, 'data-grid')
      const grid = section(page, 'data-grid').getByTestId('grid-demo')
      const log = section(page, 'data-grid').getByTestId('row-action-log')
      const first = grid.getByRole('row').nth(1)
      const strip = first.locator('[data-slot="row-actions"]')
      const opacity = (locator: Locator) => locator.evaluate((el) => Number(getComputedStyle(el).opacity))
      const widths = () =>
        grid.getByRole('columnheader').evaluateAll((heads) => heads.map((head) => head.getBoundingClientRect().width))
      const before = await widths()
      // 没悬停：透明；悬停：出现，最多三颗按钮，都有名字。
      await page.mouse.move(0, 0)
      expect(await opacity(strip)).toBe(0)
      await first.hover()
      await expect.poll(() => opacity(strip)).toBe(1)
      await expect(strip.getByRole('button')).toHaveCount(3)
      await expect(strip.getByRole('button', { name: 'Open chart' })).toBeVisible()
      expect(await widths()).toEqual(before)
      // 按钮浮在行内右端，没有伸出行。
      const [rowBox, stripBox] = [await first.boundingBox(), await strip.boundingBox()]
      expect(stripBox!.width).toBeGreaterThan(40)
      expect(stripBox!.x + stripBox!.width).toBeLessThanOrEqual(rowBox!.x + rowBox!.width + 1)
      // 表比容器宽、横向滚着时，按钮条也在可视区里（不是在滚出去的行尾）。
      const viewport = await grid.locator('.k-grid-scroll').boundingBox()
      expect(stripBox!.x + stripBox!.width).toBeLessThanOrEqual(viewport!.x + viewport!.width + 1)
      expect(stripBox!.x).toBeGreaterThanOrEqual(viewport!.x)
      // 点按钮：回调收到这一行，且没有把行点成「打开」。
      await strip.getByRole('button', { name: 'Open chart' }).click()
      await expect(log).toHaveText('Last action: Open chart · BTCUSDT')
      // 右键：整份菜单在最前，点 Copy code 回调收到右键的那一行。
      const second = grid.getByRole('row').nth(2)
      await second.click({ button: 'right' })
      const menu = page.getByRole('menu', { name: 'Example rows menu' })
      await expect(menu.getByRole('menuitem').nth(0)).toHaveText(/Open chart/)
      await expect(menu.getByRole('menuitem', { name: /Add to watchlist/ })).toContainText('Alt+W')
      await menu.getByRole('menuitem', { name: 'Copy code' }).click()
      await expect(log).toHaveText('Last action: Copy code · 600519')
      // 键盘：焦点到表上，↓ 走到一行，那一行的按钮可见；Shift+F10 开菜单，Esc 关。
      await page.mouse.move(0, 0)
      // 键盘走进去（脚本 focus() 沿用上一次鼠标的来由，不算 :focus-visible）。
      await grid.getByRole('grid').focus()
      await page.keyboard.press('Shift+Tab')
      await page.keyboard.press('Tab')
      await expect(grid.getByRole('grid')).toBeFocused()
      await page.keyboard.press('ArrowDown')
      await expect.poll(() => opacity(grid.locator('.k-grid-row.is-cursor [data-slot="row-actions"]'))).toBe(1)
      await page.keyboard.press('Shift+F10')
      await expect(menu.getByRole('menuitem', { name: 'Add to watchlist' })).toBeVisible()
      await page.keyboard.press('Escape')
      await expect(menu).toHaveCount(0)
      await page.keyboard.press('ContextMenu')
      await expect(menu.getByRole('menuitem', { name: 'New alert' })).toBeVisible()
      await page.keyboard.press('Escape')
    })

    test('行快捷操作（#23）：连板天梯悬停出按钮、右键出菜单，热力图格子右键出同一份菜单，传了才有', async ({
      page,
    }) => {
      await open(page, theme, 'limit-ladder')
      const ladder = section(page, 'limit-ladder')
      const log = ladder.getByTestId('row-action-log')
      const row = ladder.locator('[data-slot="ladder-row"]').first()
      const strip = row.locator('[data-slot="row-actions"]')
      const opacity = (locator: Locator) => locator.evaluate((el) => Number(getComputedStyle(el).opacity))
      await page.mouse.move(0, 0)
      expect(await opacity(strip)).toBe(0)
      await row.hover()
      await expect.poll(() => opacity(strip)).toBe(1)
      await strip.locator('[data-action="add-to-watchlist"]').click()
      await expect(log).toContainText('Add to watchlist · ')
      await row.click({ button: 'right' })
      await page.getByRole('menuitem', { name: 'Copy code' }).click()
      await expect(log).toContainText('Copy code · ')
      // 焦点在行上：按钮可见；菜单键开菜单。
      await page.mouse.move(0, 0)
      const tabbable = ladder.locator('[data-slot="ladder-row"][tabindex="0"]')
      await tabbable.focus()
      await page.keyboard.press('Shift+Tab')
      await page.keyboard.press('Tab')
      await expect(tabbable).toBeFocused()
      await expect.poll(() => opacity(tabbable.locator('[data-slot="row-actions"]'))).toBe(1)
      await page.keyboard.press('Shift+F10')
      await expect(page.getByRole('menuitem', { name: 'New alert' })).toBeVisible()
      await page.keyboard.press('Escape')

      await show(page, 'market-heatmap')
      const heat = section(page, 'market-heatmap')
      const cell = heat.locator('[data-slot="heatmap-cell"]').first()
      const code = await cell.getAttribute('data-code')
      await cell.click({ button: 'right' })
      await expect(page.getByRole('menuitem')).toHaveCount(4)
      await page.getByRole('menuitem', { name: 'Open chart' }).click()
      await expect(heat.getByTestId('row-action-log')).toHaveText(`Last action: Open chart · ${code}`)
    })

    test('量化：连板天梯——层按板位从高到低，晋级率，炸板行文字淡显，选中行左侧有强调条', async ({ page }) => {
      await open(page, theme, 'limit-ladder')
      const ladder = section(page, 'limit-ladder').locator('[data-slot="limit-ladder"]')
      await expect(ladder).toBeVisible()
      const boards = await ladder.locator('[data-slot="ladder-board"]').allTextContents()
      // 层号是粗体无衬线，不是点阵字。
      await expect(ladder.locator('[data-slot="ladder-board"]').first()).not.toHaveCSS('font-family', /Doto/)
      expect(boards).toEqual(['5', '4', '3', '1'])
      await expect(ladder.locator('[data-board="4"] [data-slot="ladder-promote"]')).toContainText('晋级 1/2')
      await expect(ladder.locator('[data-board="1"] [data-slot="ladder-promote"]')).toContainText('晋级 6/31')
      // 晋级条的填充宽度按比例：1/2 约一半。
      const fill = ladder.locator('[data-board="4"] .k-ladder-promote-bar i')
      const [bar, filled] = await Promise.all([
        ladder.locator('[data-board="4"] .k-ladder-promote-bar').boundingBox(),
        fill.boundingBox(),
      ])
      expect(filled!.width / bar!.width).toBeCloseTo(0.5, 1)
      // 炸板、跌停行的代码退到 ink-300，封住行是 ink-100；不用透明度（透明度会把对比度压到 4.5:1 以下）。
      const colorOf = (code: string, part: string) =>
        ladder
          .locator(`[data-code="${code}"] ${part}`)
          .first()
          .evaluate((el) => getComputedStyle(el).color)
      const ink = async (name: string) =>
        page.evaluate((v) => {
          const probe = document.createElement('i')
          probe.style.color = `var(${v})`
          document.body.append(probe)
          const color = getComputedStyle(probe).color
          probe.remove()
          return color
        }, name)
      expect(await colorOf('600002', '.k-ladder-symbol')).toBe(await ink('--ink-100'))
      expect(await colorOf('000003', '.k-ladder-symbol')).toBe(await ink('--ink-300'))
      expect(await colorOf('603007', '.k-ladder-symbol')).toBe(await ink('--ink-300'))
      // 数值列是界面无衬线加等宽数字，不是等宽字体族。
      // 品种格：代码是主、名称是次（名称更淡更小）；封单额写成「520.00 M」，缺数据写「—」。
      const sym = ladder.locator('[data-code="600002"]')
      await expect(sym.locator('.k-ladder-symbol')).toHaveText('600002')
      await expect(sym.locator('.k-ladder-sub')).toHaveText('示例电力')
      expect(
        await sym.locator('.k-ladder-sub').evaluate((el) => parseFloat(getComputedStyle(el).fontSize)),
      ).toBeLessThan(await sym.locator('.k-ladder-symbol').evaluate((el) => parseFloat(getComputedStyle(el).fontSize)))
      await expect(ladder.locator('[data-code="600001"] .k-ladder-num').nth(2)).toHaveText('520.00 M')
      await expect(ladder.locator('[data-code="603007"] .k-ladder-num').nth(2)).toHaveText('—')
      await expect(ladder.locator('[data-code="600001"] .k-ladder-num').first()).toHaveText('+10.00%')
      const numStyle = await ladder
        .locator('[data-code="600002"] .k-ladder-num')
        .nth(1)
        .evaluate((el) => ({ family: getComputedStyle(el).fontFamily, nums: getComputedStyle(el).fontVariantNumeric }))
      expect(numStyle.family).not.toMatch(/mono/i)
      expect(numStyle.family).toMatch(/Inter|sans/i)
      expect(numStyle.nums).toContain('tabular-nums')
      // 汇总读数：涨停 5 只（封住的），最高 5 板，整体晋级率 10/38 约 26%。
      const summary = ladder.locator('[data-slot="ladder-summary"]')
      await expect(summary).toContainText('涨停')
      await expect(summary.locator('dd').nth(0)).toHaveText('5')
      await expect(summary.locator('dd').nth(1)).toHaveText('5')
      await expect(summary.locator('dd').nth(2)).toHaveText('26%')
      // 状态标签：封住取涨色，跌停取跌色，炸板是琥珀。
      const labelColor = (code: string) =>
        ladder.locator(`[data-code="${code}"] .k-ladder-status`).evaluate((el) => getComputedStyle(el).color)
      const tokenColor = (name: string) =>
        page.evaluate((variable) => {
          const probe = document.createElement('i')
          probe.style.color = `var(${variable})`
          document.body.append(probe)
          const color = getComputedStyle(probe).color
          probe.remove()
          return color
        }, name)
      // A 股件：本页根上是 data-updown="cn"（红涨绿跌，评审 #78），封住是红、跌停是绿。
      await expect(page.locator('html')).toHaveAttribute('data-updown', 'cn')
      expect(await labelColor('600002')).toBe(await tokenColor('--pnl-up'))
      expect(await labelColor('600002')).toBe(await tokenColor('--signal-red'))
      expect(await labelColor('603007')).toBe(await tokenColor('--pnl-down'))
      expect(await labelColor('603007')).toBe(await tokenColor('--signal-green'))
      expect(await labelColor('000003')).toBe(await tokenColor('--signal-amber'))
      // 选中行左侧 2px 强调条；点另一行，条跟着走。
      const shadow = (code: string) =>
        ladder.locator(`[data-code="${code}"]`).evaluate((el) => getComputedStyle(el).boxShadow)
      const orange = await tokenColor('--ink-100')
      await expect(ladder.locator('[data-code="300004"]')).toHaveAttribute('aria-selected', 'true')
      expect(await shadow('300004')).toBe(`${orange} 2px 0px 0px 0px inset`)
      expect(await shadow('002005')).toBe('none')
      await ladder.locator('[data-code="002005"]').click()
      await expect(ladder.locator('[data-code="002005"]')).toHaveAttribute('aria-selected', 'true')
      expect(await shadow('002005')).toBe(`${orange} 2px 0px 0px 0px inset`)
      expect(await shadow('300004')).toBe('none')
      // 键盘：↓ 移到下一行，Enter 选中。
      await ladder.locator('[data-code="002005"]').focus()
      await page.keyboard.press('ArrowDown')
      await page.keyboard.press('Enter')
      await expect(ladder.locator('[data-code="601006"]')).toHaveAttribute('aria-selected', 'true')
      // 离开这一页，根上的 data-updown 还原（文档站默认绿涨红跌）。
      await navLink(page, 'market-heatmap').click()
      await page.locator('[data-gallery="market-heatmap"]').waitFor()
      await expect(page.locator('html')).not.toHaveAttribute('data-updown', /.+/)
    })

    test('量化：市场热力图——显示开关：logo、标题（无 / 代码 / 全名）、格内数值（价格 / 成交额 / 涨跌幅 / 无）与全屏', async ({
      page,
    }) => {
      await page.setViewportSize({ width: 1400, height: 900 })
      await open(page, theme, 'market-heatmap')
      const map = section(page, 'market-heatmap').locator('[data-slot="market-heatmap"]')
      await heatPick(page, map, '视图', '平铺')
      await map.evaluate((el) => Promise.all(el.getAnimations({ subtree: true }).map((a) => a.finished)))
      const cells = map.locator('[data-slot="heatmap-cell"]')
      const big = cells.first()
      const count = (selector: string) => map.locator(`[data-slot="heatmap-cell"] ${selector}`).count()
      // 默认：有 logo、代码、涨跌幅。
      expect(await count('.k-mheat-logo')).toBeGreaterThan(0)
      expect(await count('.k-mheat-code')).toBeGreaterThan(0)
      await expect(big.locator('.k-mheat-value')).toContainText('%')
      // 关 logo：格子里没有徽标，代码还在。
      await map.getByRole('switch', { name: 'Logo' }).click()
      expect(await count('.k-mheat-logo')).toBe(0)
      expect(await count('.k-mheat-code')).toBeGreaterThan(0)
      await map.getByRole('switch', { name: 'Logo' }).click()
      // 标题：无 → 没有代码字；全名 → 代码位写名称。
      const title = map.getByRole('group', { name: '标题' })
      await title.getByRole('button', { name: '无' }).click()
      expect(await count('.k-mheat-code')).toBe(0)
      await title.getByRole('button', { name: '全名' }).click()
      const code = await big.getAttribute('data-code')
      const named = await big.locator('.k-mheat-code').first().textContent()
      expect(named).not.toBe(code)
      await title.getByRole('button', { name: '代码' }).click()
      await expect(big.locator('.k-mheat-code').first()).toHaveText(code!)
      // 格内数值：价格（不带 %）、成交额、无。
      const value = map.getByRole('group', { name: '格内数值' })
      await value.getByRole('button', { name: '价格' }).click()
      await expect(big.locator('.k-mheat-value')).not.toContainText('%')
      await value.getByRole('button', { name: '成交额' }).click()
      await expect(big.locator('.k-mheat-value')).toContainText(/[KMB]/)
      await value.getByRole('button', { name: '无' }).click()
      expect(await count('.k-mheat-value')).toBe(0)
      // 全屏钮在，且点了会请求全屏（无头浏览器里 requestFullscreen 可能被拒，只断言按钮与调用）。
      await expect(map.getByRole('button', { name: '全屏' })).toBeVisible()
    })

    test('量化：市场热力图——工具条是四个下拉加「在选股器打开」；格子分四档：徽标 + 代码 + 读数、代码 + 读数、只有徽标、只有色块', async ({
      page,
    }) => {
      await page.setViewportSize({ width: 1400, height: 900 })
      await open(page, theme, 'market-heatmap')
      const demo = section(page, 'market-heatmap')
      const map = demo.locator('[data-slot="market-heatmap"]')
      for (const name of ['数据集', '大小', '颜色', '视图'])
        await expect(map.getByRole('combobox', { name })).toBeVisible()
      await heatPick(page, map, '数据集', '不分组的加密')
      await expect(map.locator('[data-slot="heatmap-cell"]')).toHaveCount(30)
      await heatPick(page, map, '数据集', '分行业的股票')
      await map.getByRole('button', { name: '在选股器打开' }).click()
      await expect(demo).toContainText('在选股器打开：分行业的股票')
      await heatPick(page, map, '视图', '平铺')
      await map.evaluate((el) => Promise.all(el.getAnimations({ subtree: true }).map((a) => a.finished)))
      const tiers = await map.locator('[data-slot="heatmap-cell"]').evaluateAll((nodes) =>
        nodes.map((n) => ({
          logo: n.querySelectorAll('[data-slot="symbol-mark"]').length,
          code: n.querySelectorAll('.k-mheat-code').length,
          value: n.querySelectorAll('.k-mheat-value').length,
        })),
      )
      expect(tiers.some((t) => t.logo === 1 && t.code === 1 && t.value === 1)).toBe(true)
      expect(tiers.some((t) => t.logo === 0 && t.code === 1)).toBe(true)
      expect(tiers.some((t) => t.logo === 1 && t.code === 0 && t.value === 0)).toBe(true)
      expect(tiers.some((t) => t.logo === 0 && t.code === 0)).toBe(true)
    })

    test('量化：市场热力图——面积跟大小成正比，颜色落在对应档，点组名放大，图例点一档隐藏，小格子不写字', async ({
      page,
    }) => {
      await open(page, theme, 'market-heatmap')
      const map = section(page, 'market-heatmap').locator('[data-slot="market-heatmap"]')
      const cells = map.locator('[data-slot="heatmap-cell"]')
      await expect(cells).toHaveCount(60)
      await expect(map.locator('[data-slot="heatmap-group"]')).toHaveCount(8)
      const sizeOf = (cell: Locator) => cell.getAttribute('data-size').then(Number)
      // 面积跟市值成正比：平铺（所有格子一个密度）后抽两格比；每格四周各让出 1px 缝，量到的宽高各补 2px 才是排布的那一格。
      await heatPick(page, map, '视图', '平铺')
      await expect(map.locator('[data-slot="heatmap-group"]')).toHaveCount(0)
      await map.evaluate((el) => Promise.all(el.getAnimations({ subtree: true }).map((a) => a.finished)))
      const area = (cell: Locator) => cell.boundingBox().then((b) => (b!.width + 2) * (b!.height + 2))
      const ranked = await cells.evaluateAll((nodes) =>
        nodes
          .map((n) => ({ code: (n as HTMLElement).dataset.code!, size: Number((n as HTMLElement).dataset.size) }))
          .sort((a, b) => b.size - a.size),
      )
      const bigCode = ranked[0]!.code
      const big = map.locator(`[data-slot="heatmap-cell"][data-code="${bigCode}"]`)
      const mid = map.locator(`[data-slot="heatmap-cell"][data-code="${ranked[5]!.code}"]`)
      const bigFlat = await area(big)
      const ratio = bigFlat / (await area(mid))
      const expected = (await sizeOf(big)) / (await sizeOf(mid))
      expect(ratio / expected).toBeGreaterThan(0.96)
      expect(ratio / expected).toBeLessThan(1.04)
      await heatPick(page, map, '视图', '分组')
      await expect(map.locator('[data-slot="heatmap-group"]')).toHaveCount(8)
      // 颜色落在对应档：格子的涨跌幅（固定一档 1%）算出档号，底色等于图例里那一档的色块。
      const swatch = (step: number) => map.locator(`[data-slot="heatmap-swatch"][data-step="${step}"]`)
      for (const index of [0, 7, 19, 33, 50]) {
        const cell = cells.nth(index)
        const change = Number(/([+-]?\d+\.\d+)%$/.exec((await cell.getAttribute('aria-label')) ?? '')![1])
        const step = Math.max(-3, Math.min(3, Math.round(change)))
        await expect(cell).toHaveAttribute('data-step', String(step))
        expect(await colorAt(page, cell, 'background-color')).toEqual(
          await colorAt(page, swatch(step), 'background-color'),
        )
      }
      // 涨跌两端不同色（涨的是 pnl-up、跌的是 pnl-down 与底色的混合，不是同一个灰）。
      expect(await bg(swatch(3))).not.toBe(await bg(swatch(-3)))
      expect(await bg(swatch(0))).not.toBe(await bg(swatch(3)))
      // 字色按底色亮度算：有字的格子，字与底的对比（Graphite 不低于 4.5）。
      const contrast = await cells.evaluateAll((nodes) => {
        const ctx = document.createElement('canvas').getContext('2d', { willReadFrequently: true })!
        ctx.canvas.width = ctx.canvas.height = 1
        const lum = (css: string) => {
          ctx.clearRect(0, 0, 1, 1)
          ctx.fillStyle = css
          ctx.fillRect(0, 0, 1, 1)
          const [r, g, b] = Array.from(ctx.getImageData(0, 0, 1, 1).data).map((c) => {
            const v = c / 255
            return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
          })
          return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!
        }
        return nodes
          .filter((n) => (n as HTMLElement).dataset.labelled === 'true' && (n as HTMLElement).dataset.step !== 'na')
          .map((n) => {
            const style = getComputedStyle(n)
            const [a, b] = [lum(style.color), lum(style.backgroundColor)].sort((x, y) => y - x)
            return (a! + 0.05) / (b! + 0.05)
          })
      })
      expect(contrast.length).toBeGreaterThan(10)
      // 件在深字（bg-000）与浅字（ink-100）里挑对比度高的；Console 的两端是暖色近黑与米白，最差的一档到不了 4.5，所以它只要 4。
      expect(Math.min(...contrast)).toBeGreaterThanOrEqual(theme === 'graphite' ? 4.5 : 4)
      // 小格子不写字，大格子写代码；有字的格子不小于阈值。
      const sizes = await cells.evaluateAll((nodes) =>
        nodes.map((n) => {
          const r = n.getBoundingClientRect()
          return { w: r.width, h: r.height, text: n.querySelector('.k-mheat-code')?.textContent ?? '' }
        }),
      )
      const small = sizes.filter((c) => c.w < 40 || c.h < 24)
      const large = sizes.filter((c) => c.w >= 70 && c.h >= 24)
      expect(small.length).toBeGreaterThan(0)
      expect(large.length).toBeGreaterThan(0)
      expect(small.every((c) => c.text === '')).toBe(true)
      expect(large.every((c) => c.text !== '')).toBe(true)
      // 写出来的代码不被截断：有字的格子都放得下它。
      expect(sizes.filter((c) => c.text !== '').every((c) => c.w >= c.text.length * 7 + 8)).toBe(true)
      // 悬停出卡片：代码、价格、两个着色指标、大小指标。
      await big.hover()
      const card = map.locator('[data-slot="heatmap-card"]')
      await expect(card).toBeVisible()
      await expect(card).toContainText(await big.getAttribute('data-code').then((c) => c!))
      for (const text of ['价格', '涨跌幅', '周表现', '市值', '行业']) await expect(card).toContainText(text)
      await page.mouse.move(0, 0)
      await expect(card).not.toHaveAttribute('data-open', 'true')
      // 点图例一档：这一档的格子隐藏，别的不动；再点恢复。
      const stepCells = (step: number) => map.locator(`[data-slot="heatmap-cell"][data-step="${step}"]`)
      let picked = 0
      for (const step of [1, 0, -1, 2, -2]) {
        if ((await stepCells(step).count()) > 0) {
          picked = step
          break
        }
      }
      const inStep = await stepCells(picked).count()
      const segment = map.locator(`[data-slot="heatmap-segment"][data-step="${picked}"]`)
      await segment.click()
      await expect(segment).toHaveAttribute('aria-pressed', 'true')
      await expect(stepCells(picked).first()).toBeHidden()
      expect(await map.locator('[data-slot="heatmap-cell"]:visible').count()).toBe(60 - inStep)
      await segment.click()
      await expect(stepCells(picked).first()).toBeVisible()
      expect(await map.locator('[data-slot="heatmap-cell"]:visible').count()).toBe(60)
      // 点组名放大：只剩这一组，面包屑出现，大小与颜色设置保留；面包屑的「全部」回来。
      // 没放大时没有面包屑；组头带平均涨跌；够大的格子画徽标，传了图的格子里是图片。
      await expect(map.locator('[data-slot="heatmap-crumb"]')).toHaveCount(0)
      await expect(map.locator('[data-slot="heatmap-group-avg"]').first()).toHaveText(/^[+-]?\d+\.\d{2}%$/)
      expect(await map.locator('[data-slot="heatmap-cell"] [data-slot="symbol-mark"]').count()).toBeGreaterThan(0)
      expect(await map.locator('[data-slot="symbol-mark"][data-kind="image"]').count()).toBeGreaterThan(0)
      const head = map.locator('[data-slot="heatmap-group"]').first()
      const name = (await head.getAttribute('data-group'))!
      const before = await area(cells.first())
      await head.click()
      const inGroup = await cells.count()
      expect(inGroup).toBeLessThan(60)
      expect(inGroup).toBeGreaterThanOrEqual(7)
      await expect(map.locator('[data-slot="heatmap-group"]')).toHaveCount(0)
      await expect(map.locator('[data-slot="heatmap-crumb"]')).toContainText(name)
      await expect(map.getByRole('combobox', { name: '大小' })).toHaveText('市值')
      await expect.poll(() => area(cells.first())).toBeGreaterThan(before)
      await map.locator('[data-slot="heatmap-crumb"]').getByRole('button', { name: '全部' }).click()
      await expect(cells).toHaveCount(60)
      await map.locator('[data-slot="heatmap-group"]').first().click()
      await page.keyboard.press('Escape')
      await expect(cells).toHaveCount(60)
    })

    test('量化：市场热力图——悬停卡片跟着鼠标、在相邻格子间不消失，悬停组头与图例有预览', async ({ page }) => {
      await open(page, theme, 'market-heatmap')
      const map = section(page, 'market-heatmap').locator('[data-slot="market-heatmap"]')
      const cells = map.locator('[data-slot="heatmap-cell"]:visible')
      const card = map.locator('[data-slot="heatmap-card"]')
      const centre = async (code: string) => {
        const box = (await map.locator(`[data-slot="heatmap-cell"][data-code="${code}"]`).boundingBox())!
        return { x: box.x + box.width / 2, y: box.y + box.height / 2, box }
      }
      const first = (await cells.nth(0).getAttribute('data-code'))!
      const a = await centre(first)
      await page.mouse.move(a.x, a.y)
      await expect(card).toHaveAttribute('data-open', 'true')
      // 卡片出现在鼠标附近（右侧或翻到左侧，相距不超过一张卡片的宽加边距）。
      await expect
        .poll(async () => {
          const c = (await card.boundingBox())!
          return Math.min(Math.abs(c.x - a.x), Math.abs(c.x + c.width - a.x)) < 40 && Math.abs(c.y - a.y) < 400
        })
        .toBe(true)
      // 在格子之间一路移到相邻格子：途中卡片一直开着，只换内容。
      const nextCode = (await cells.nth(1).getAttribute('data-code'))!
      const b = await centre(nextCode)
      await page.mouse.move(b.x, b.y, { steps: 12 })
      await expect(card).toHaveAttribute('data-open', 'true')
      await expect(card).toContainText(nextCode)
      // 悬停组头：整组描边出现，别的格子变暗；离开恢复。
      await map.locator('[data-slot="heatmap-group"]').first().hover()
      await expect(map.locator('[data-slot="heatmap-group-ring"]')).toHaveCount(1)
      expect(await map.locator('[data-slot="heatmap-cell"][data-dim="group"]').count()).toBeGreaterThan(0)
      await page.mouse.move(0, 0)
      await expect(map.locator('[data-slot="heatmap-group-ring"]')).toHaveCount(0)
      // 悬停图例一档：只有这一档的格子不变暗；没点就没隐藏。
      await map.locator('[data-slot="heatmap-segment"]').nth(1).hover()
      await expect(map.locator('[data-slot="heatmap-cell"][data-dim="legend"]').first()).toBeAttached()
      expect(await map.locator('[data-slot="heatmap-cell"][data-hidden]').count()).toBe(0)
    })

    test('量化：市场热力图——切大小与颜色、平铺、单色、不分组的加密，键盘在组间与组内走', async ({ page }) => {
      await open(page, theme, 'market-heatmap')
      const demo = section(page, 'market-heatmap')
      const map = demo.locator('[data-slot="market-heatmap"]')
      const cells = map.locator('[data-slot="heatmap-cell"]')
      // 汇总读数：只数 60，上涨加下跌不超过 60。
      const reads = map.locator('[data-slot="heatmap-summary"] dd')
      await expect(reads.nth(0)).toHaveText('60')
      const [up, down] = [Number(await reads.nth(1).textContent()), Number(await reads.nth(2).textContent())]
      expect(up + down).toBeLessThanOrEqual(60)
      expect(up).toBeGreaterThan(0)
      expect(down).toBeGreaterThan(0)
      // 等大：每格差不多大（组块内的格子面积相同，跨组块可能略有差别，所以平铺后再比）。
      await heatPick(page, map, '视图', '平铺')
      await heatPick(page, map, '大小', '等大')
      await expect(map.locator('[data-slot="heatmap-group"]')).toHaveCount(0)
      // 位置与大小是过渡过去的：等动画走完再量。
      await map.evaluate((el) => Promise.all(el.getAnimations({ subtree: true }).map((a) => a.finished)))
      const areas = await cells.evaluateAll((nodes) =>
        nodes.map((n) => {
          const r = n.getBoundingClientRect()
          return r.width * r.height
        }),
      )
      expect(Math.max(...areas) / Math.min(...areas)).toBeLessThan(1.6)
      // 周表现：档宽自动取好数，图例的数跟着变（涨跌幅固定 1%，周表现不是）。
      const legend = map.locator('[data-slot="heatmap-legend"]')
      await expect(legend).not.toContainText('+9%')
      await heatPick(page, map, '颜色', '周表现')
      await expect(legend).toContainText('+9%')
      await expect(map.getByRole('combobox', { name: '颜色' })).toHaveText('周表现')
      // 单色：格子的底色是灰（红绿蓝相等），不带涨跌色。
      await demo.getByRole('button', { name: '单色' }).click()
      await expect(map).toHaveAttribute('data-scheme', 'mono')
      for (const step of [-3, 0, 3]) {
        const [r, g, b] = await colorAt(
          page,
          map.locator(`[data-slot="heatmap-swatch"][data-step="${step}"]`),
          'background-color',
        )
        expect(Math.abs(r! - g!)).toBeLessThanOrEqual(20)
        expect(Math.abs(g! - b!)).toBeLessThanOrEqual(20)
      }
      await demo.getByRole('button', { name: '经典' }).click()
      // 键盘：先分组；Tab 进某组的格子，方向键在组内走（落点还在同一组），再 Tab 到下一个组名。
      await heatPick(page, map, '视图', '分组')
      const firstHead = map.locator('[data-slot="heatmap-group"]').first()
      await firstHead.focus()
      await page.keyboard.press('Tab')
      const first = page.locator(':focus')
      await expect(first).toHaveAttribute('data-slot', 'heatmap-cell')
      const block = map.locator('[data-slot="heatmap-group-block"]').first()
      const firstCode = await first.getAttribute('data-code')
      let moved = firstCode
      for (const key of ['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp']) {
        await page.keyboard.press(key)
        const now = await page.locator(':focus').getAttribute('data-code')
        if (now !== firstCode) moved = now
      }
      expect(moved).not.toBe(firstCode)
      expect(await block.locator(`[data-code="${moved}"]`).count()).toBe(1)
      // 焦点所在格子出悬停卡片，Enter 选中。
      await expect(map.locator('[data-slot="heatmap-card"]')).toBeVisible()
      await page.keyboard.press('Enter')
      await expect(page.locator(':focus')).toHaveAttribute('aria-pressed', 'true')
      await page.keyboard.press('Tab')
      await expect(page.locator(':focus')).toHaveAttribute('data-slot', 'heatmap-group')
      expect(await page.locator(':focus').getAttribute('data-group')).not.toBe(
        await firstHead.getAttribute('data-group'),
      )
      // 不分组的加密：没有组名，也没有视图切换，三十格。
      await heatPick(page, map, '数据集', '不分组的加密')
      await expect(cells).toHaveCount(30)
      await expect(map.locator('[data-slot="heatmap-group"]')).toHaveCount(0)
      await expect(map.getByRole('combobox', { name: '视图' })).toHaveCount(0)
      await expect(map.getByRole('combobox', { name: '大小' })).toHaveText('市值')
    })

    test('量化：技术评级——指针角度对应分数，档名随分数跨档，个数文字正确，切周期仪表真的动', async ({ page }) => {
      await open(page, theme, 'technical-rating')
      const rating = section(page, 'technical-rating').locator('[data-slot="technical-rating"]')
      const dials = rating.locator('[data-slot="rating-dial"]')
      await expect(dials).toHaveCount(3)
      await expect(rating.locator('[data-slot="rating-row"]')).toHaveCount(20)
      // 免责一句与「演示数据」标识都在。
      await expect(rating.locator('[data-slot="rating-disclaimer"]')).toHaveText(
        'Ratings only summarise indicator readings; they are not trading advice.',
      )
      // 十个周期，选中一个。
      await expect(rating.locator('[data-slot="rating-timeframe"] button')).toHaveCount(10)
      // 两张明细表并排（同一行、不同列），枢轴点表整宽在它们下面，七行，缺值写「—」。
      const cards = rating.locator('[data-slot="rating-section"]')
      await expect(cards).toHaveCount(2)
      const [c0, c1, pv] = await Promise.all([
        cards.nth(0).boundingBox(),
        cards.nth(1).boundingBox(),
        rating.locator('[data-slot="rating-pivots"]').boundingBox(),
      ])
      expect(Math.abs(c0!.y - c1!.y)).toBeLessThan(2)
      expect(c1!.x).toBeGreaterThan(c0!.x + c0!.width - 2)
      expect(pv!.y).toBeGreaterThan(c0!.y + c0!.height - 2)
      expect(pv!.width).toBeGreaterThan(c0!.width * 1.8)
      await expect(rating.locator('[data-slot="pivot-row"]')).toHaveText([
        /^R3/,
        /^R2/,
        /^R1/,
        /^P/,
        /^S1/,
        /^S2/,
        /^S3/,
      ])
      await expect(rating.locator('[data-slot="rating-pivots"] thead th')).toContainText([
        'Classic',
        'Fibonacci',
        'Camarilla',
        'Woodie',
        'DM',
      ])
      await expect(rating.locator('[data-slot="rating-pivots"] td', { hasText: '—' }).first()).toBeVisible()
      // 弧：两端是涨跌色，中段是灰。
      const stroke = (i: number) =>
        dials
          .nth(1)
          .locator(`.k-trating-zone.is-z${i}`)
          .evaluate((n) => getComputedStyle(n).stroke)
      expect(await rgba(page, await stroke(0))).toEqual(await rgba(page, await token(page, '--pnl-down')))
      expect(await rgba(page, await stroke(4))).toEqual(await rgba(page, await token(page, '--pnl-up')))
      for (const i of [1, 2, 3]) {
        const c = await rgba(page, await stroke(i))
        expect(c).not.toEqual(await rgba(page, await token(page, '--pnl-down')))
        expect(c).not.toEqual(await rgba(page, await token(page, '--pnl-up')))
      }
      const zoneOf = (v: number) => (v < -0.5 ? 0 : v < -0.1 ? 1 : v <= 0.1 ? 2 : v <= 0.5 ? 3 : 4)
      const WORDS = ['Strong sell', 'Sell', 'Neutral', 'Buy', 'Strong buy']
      // 每个仪表：个数文字里的卖 / 买算出分数，针的实际旋转（读算出来的 transform）等于 分数 × 90°，大字是所在档；总数与明细行数对得上。
      const check = async () => {
        for (let i = 0; i < 3; i += 1) {
          const dial = dials.nth(i)
          const text = (await dial.locator('[data-slot="rating-counts"]').textContent())!
          const [sell, neutral, buy] = [...text.matchAll(/(\d+)/g)].map((m) => Number(m[1]))
          const value = (buy! - sell!) / (sell! + neutral! + buy!)
          await expect(dial.locator('[data-slot="rating-word"]')).toHaveText(WORDS[zoneOf(value)]!)
          await expect(dial).toContainText(`${sell! + neutral! + buy!} indicators`)
          await expect
            .poll(async () =>
              dial.locator('[data-slot="rating-needle"]').evaluate((node) => {
                const m = new DOMMatrix(getComputedStyle(node).transform)
                return (Math.atan2(m.b, m.a) * 180) / Math.PI
              }),
            )
            .toBeCloseTo(value * 90, 0)
        }
      }
      await check()
      // 总评居中放大：宽度与大字都比小仪表大。
      const widths = await dials.evaluateAll((nodes) => nodes.map((n) => n.getBoundingClientRect().width))
      expect(widths[1]).toBeGreaterThan(widths[0]!)
      const size = (i: number) =>
        dials
          .nth(i)
          .locator('[data-slot="rating-word"]')
          .evaluate((n) => parseFloat(getComputedStyle(n).fontSize))
      expect(await size(1)).toBeGreaterThan(await size(0))
      // 总评上看得见中间三档的刻度字（两端靠弧色与大字），小仪表不画刻度字。
      await expect(dials.nth(1).locator('[data-slot="rating-tick"]')).toHaveText(WORDS.slice(1, 4))
      await expect(dials.nth(0).locator('[data-slot="rating-tick"]').first()).toBeHidden()
      // 颜色：买档的大字是涨色、卖档是跌色，中性不是这两个色。
      const up = await token(page, '--pnl-up')
      const down = await token(page, '--pnl-down')
      // 切周期：分段控件点一下，仪表读数跟着变（针与个数），再回来。
      const before = await dials.nth(1).locator('[data-slot="rating-counts"]').textContent()
      const seen = new Set<string>([before!])
      for (const name of ['1 minute', '1 month']) {
        await rating.getByRole('button', { name }).click()
        await expect(rating.getByRole('button', { name })).toHaveAttribute('aria-pressed', 'true')
        await check()
        seen.add((await dials.nth(1).locator('[data-slot="rating-counts"]').textContent())!)
        for (let i = 0; i < 3; i += 1) {
          const dial = dials.nth(i)
          const z = Number(await dial.getAttribute('data-zone'))
          const c = await colorAt(page, dial.locator('[data-slot="rating-word"]'), 'color')
          if (z >= 3) expect(c).toEqual(await rgba(page, up))
          if (z <= 1) expect(c).toEqual(await rgba(page, down))
        }
      }
      expect(seen.size).toBeGreaterThan(1)
      // 明细：结论胶囊的字色按结论取涨跌色；行悬停整行提亮。
      const buyPill = rating.locator('[data-slot="rating-row"][data-verdict="buy"] .k-trating-verdict').first()
      await expect(buyPill).toBeVisible()
      expect(await colorAt(page, buyPill, 'color')).toEqual(await rgba(page, up))
      // 纯文字上色：没有填色底。
      expect((await colorAt(page, buyPill, 'background-color'))[3]).toBe(0)
      const row = rating.locator('[data-slot="rating-row"]').first()
      const idle = await bg(row)
      await row.hover()
      await expect.poll(() => bg(row)).not.toBe(idle)
    })

    test('积木：数据表的子行与自定义列：↓ 选一行、→ 展开、← 收起（aria-expanded 跟着变），没有子行的行按 → 没反应，行属性写到行上', async ({
      page,
    }) => {
      await open(page, theme, 'data-grid')
      const detail = section(page, 'data-grid').getByTestId('grid-detail')
      const grid = detail.getByRole('treegrid', { name: 'Example rows with detail' })
      const btc = detail.locator('[data-example="a"]')
      const es = detail.locator('[data-example="c"]')
      // 自定义列画出按钮；行属性：data-example 与悬停提示。
      await expect(btc.getByRole('button', { name: 'Close BTCUSDT' })).toBeVisible()
      await expect(btc).toHaveAttribute('title', 'BTCUSDT')
      await expect(btc).toHaveAttribute('aria-expanded', 'false')
      await expect(es).not.toHaveAttribute('aria-expanded')
      await expect(detail.getByText('Fills detail for BTCUSDT')).toHaveCount(0)
      await grid.focus()
      await page.keyboard.press('ArrowDown')
      await page.keyboard.press('ArrowRight')
      await expect(btc).toHaveAttribute('aria-expanded', 'true')
      const note = detail.getByText('Fills detail for BTCUSDT: 3 fills')
      await expect(note).toBeVisible()
      // 子行在这一行下面、跨满整行宽、有高度。
      const [rowBox, noteBox, nextBox] = await Promise.all([
        btc.boundingBox(),
        note.boundingBox(),
        detail.locator('[data-example="b"]').boundingBox(),
      ])
      expect(noteBox!.y).toBeGreaterThanOrEqual(rowBox!.y + rowBox!.height - 1)
      expect(nextBox!.y).toBeGreaterThanOrEqual(noteBox!.y + noteBox!.height - 1)
      expect(noteBox!.height).toBeGreaterThan(10)
      await page.keyboard.press('ArrowLeft')
      await expect(btc).toHaveAttribute('aria-expanded', 'false')
      await expect(note).toHaveCount(0)
      // 没有子行的行（ES）：按 → 没反应。
      await page.keyboard.press('End')
      await page.keyboard.press('ArrowRight')
      await expect(es).not.toHaveAttribute('aria-expanded')
      await expect(detail.getByText('Fills detail for')).toHaveCount(0)
    })

    test('量化：指标卡——数值与变化、分段切走势线真的变、阶段带按当前值亮档、空态写「—」', async ({ page }) => {
      await open(page, theme, 'metric-card')
      const area = section(page, 'metric-card')
      const global = area.getByTestId('metric-global')
      await expect(global.locator('[data-slot="metric-card"]')).toHaveCount(4)
      await expect(area.getByTestId('metric-ashare').locator('[data-slot="metric-card"]')).toHaveCount(4)
      const fear = global.locator('[data-slot="metric-card"]').first()
      // 大号数值看得见且比标题大；四个变化都带符号与箭头。
      const value = fear.locator('[data-slot="metric-value"]')
      await expect(value).toHaveText(/^\d+$/)
      expect(await value.evaluate((n) => parseFloat(getComputedStyle(n).fontSize))).toBeGreaterThan(20)
      const changes = fear.locator('[data-slot="change-text"]')
      await expect(changes).toHaveCount(4)
      await expect(changes.first()).toHaveText(/^[▲▼]?\s*[+-]?\d+\.\d{2}%$/)
      // 阶段带：当前档的名字与数值落的档一致，且只有这一档全亮（其余 35%）。
      const n = Number(await value.textContent())
      const names = ['极度恐惧', '恐惧', '中性', '贪婪', '极度贪婪']
      const idx = n < 25 ? 0 : n < 45 ? 1 : n < 55 ? 2 : n < 75 ? 3 : 4
      await expect(fear.locator('[data-slot="metric-stage"]')).toHaveText(names[idx]!)
      const opacities = await fear
        .locator('.k-metric-seg')
        .evaluateAll((els) => els.map((e) => getComputedStyle(e).opacity))
      expect(
        opacities
          .map(Number)
          .map((o, i) => (o > 0.9 ? i : -1))
          .filter((i) => i >= 0),
      ).toEqual([idx])
      // 共用分段：卡上不再有自己的分段控件；点墙顶的「1 年」，这面墙每张卡的走势线都变成 250 点，另一面墙不动。
      await expect(fear.getByRole('button', { name: '1 年' })).toHaveCount(0)
      const points = (card: Locator) => card.locator('.k-spark .k-spark-line').getAttribute('data-points')
      expect(Number(await points(fear))).toBe(21)
      await global.getByRole('button', { name: '1 年' }).click()
      await expect(global.getByRole('button', { name: '1 年' })).toHaveAttribute('aria-pressed', 'true')
      for (const card of await global.locator('[data-slot="metric-card"]').all())
        await expect.poll(async () => Number(await points(card))).toBe(250)
      expect(Number(await points(area.getByTestId('metric-ashare').locator('[data-slot="metric-card"]').first()))).toBe(
        21,
      )
      // 走势线色：neutral（恐惧贪婪）不是涨跌色；inverse（VIX）与头尾涨跌相反；单位是小号灰色无衬线。
      const strokeOf = (card: Locator) =>
        card.locator('.k-spark .k-spark-line').evaluate((e) => getComputedStyle(e).stroke)
      const up = await rgba(page, await token(page, '--pnl-up'))
      const down = await rgba(page, await token(page, '--pnl-down'))
      const neutral = await rgba(page, await strokeOf(fear))
      expect(neutral).not.toEqual(up)
      expect(neutral).not.toEqual(down)
      const vix = global.locator('[data-slot="metric-card"]').nth(1)
      // 线路径是 M x y L x y …：取第一个与最后一个点的 y。y 向下为大：末点 y 比首点小就是涨；inverse 下涨取跌色。
      const vixPath = (await vix.locator('.k-spark .k-spark-line').getAttribute('d'))!
      const vixY = [...vixPath.matchAll(/[ML]\s*(-?[\d.]+)\s+(-?[\d.]+)/g)].map((m) => Number(m[2]))
      const rose = vixY[vixY.length - 1]! < vixY[0]!
      expect(await rgba(page, await strokeOf(vix))).toEqual(rose ? down : up)
      const unit = area.getByTestId('metric-ashare').locator('[data-slot="metric-value"] small').first()
      await expect(unit).toHaveText('只')
      expect(await unit.evaluate((n) => getComputedStyle(n).fontSize)).toBe('12px')
      expect(await unit.evaluate((n) => getComputedStyle(n).fontFamily)).not.toMatch(/dot/i)
      // 空态：数值、变化与走势线都写「—」，没有样本线。
      const empty = area.getByTestId('metric-empty').locator('[data-slot="metric-card"]')
      await expect(empty.locator('[data-slot="metric-value"]')).toHaveText('—')
      await expect(empty.locator('.k-metric-change dd')).toHaveText('—')
      await expect(empty.locator('.k-spark-line')).toHaveCount(0)
      await expect(empty.locator('.k-spark-empty')).toHaveText('—')
    })

    test('积木：空态、工具条按钮与估算标记', async ({ page }) => {
      await open(page, theme, 'empty-state')
      await expect(section(page, 'empty-state').getByRole('status')).toContainText('Nothing selected')
      await expect(section(page, 'empty-state').getByRole('heading', { name: 'Nothing selected' })).toBeVisible()
      await show(page, 'toolbar')
      const bar = section(page, 'toolbar').getByRole('toolbar', { name: 'Example toolbar' })
      const draw = bar.getByRole('button', { name: 'Draw' })
      await expect(draw).toHaveAttribute('aria-pressed', 'false')
      await draw.click()
      await expect(draw).toHaveAttribute('aria-pressed', 'true')
      // 悬停时按钮是亮白字（跟别的工具一样），挪开才看得到「开着」的橙色。
      await page.mouse.move(0, 0)
      await expect
        .poll(() => draw.evaluate((node) => getComputedStyle(node).color))
        .toBe(await token(page, '--ink-100'))
      await show(page, 'estimate-badge')
      await expect(section(page, 'estimate-badge').getByText('Estimated from bars')).toBeVisible()
    })

    // 下面十条是 #1870 补的标准件：每件至少一条用户看得见的断言（打开、键盘、焦点回还）。
    test('弹出提示：键盘弹出，窗口右下角的读屏区域，两条出「全部关掉」，叉与全部关掉都收起并摘掉节点', async ({
      page,
    }) => {
      await open(page, theme, 'toast')
      const area = section(page, 'toast')
      const viewport = page.getByTestId('toast-viewport')
      await expect(viewport).toHaveAttribute('role', 'region')
      await expect(viewport).toHaveAttribute('aria-live', 'assertive')
      const add = area.getByRole('button', { name: '弹一条提示' })
      await add.focus()
      await page.keyboard.press('Enter')
      const toasts = page.getByTestId('toast')
      await expect(toasts).toHaveCount(1)
      // 进来的过渡播完：不透明、没有起点属性。
      await expect(toasts.first()).toHaveCSS('opacity', '1')
      await expect(toasts.first()).not.toHaveAttribute('data-starting-style', '')
      // 贴着右下角：离右边与下边各 16px。
      const size = page.viewportSize()!
      const box = (await viewport.boundingBox())!
      expect(Math.round(size.width - (box.x + box.width))).toBe(16)
      expect(Math.round(size.height - (box.y + box.height))).toBe(16)
      await expect(page.getByRole('button', { name: /^全部关掉/ })).toHaveCount(0)
      await page.keyboard.press('Enter')
      await expect(toasts).toHaveCount(2)
      await expect(page.getByRole('button', { name: '全部关掉（2）' })).toBeVisible()
      // 新的在前、在下面时贴着窗口边：第一条的底边比第二条低。
      const [first, second] = [(await toasts.nth(0).boundingBox())!, (await toasts.nth(1).boundingBox())!]
      expect(first.y).toBeGreaterThan(second.y)
      // 键盘关第一条：焦点到叉，回车；收起后节点摘掉。
      const close = toasts.nth(0).getByRole('button', { name: '关掉这条提示' })
      await close.focus()
      await page.keyboard.press('Enter')
      await expect(toasts).toHaveCount(1)
      await page.keyboard.press('Shift+Tab')
      await add.focus()
      await page.keyboard.press('Enter')
      await page.keyboard.press('Enter')
      await expect(toasts).toHaveCount(3)
      await page.getByRole('button', { name: '全部关掉（3）' }).click()
      await expect(toasts).toHaveCount(0)
    })

    test('弹出提示的语气：色条与图标取 --k-status-*；neutral 色条是主文字色、图标是强调色；说明文字用 ink-2（对比度够）', async ({
      page,
    }) => {
      await open(page, theme, 'toast')
      const area = section(page, 'toast')
      const neutral = area.locator('[data-slot="toast"]').first()
      await expect(neutral).toHaveAttribute('data-tone', 'neutral')
      await expect(neutral).toHaveCSS('border-left-color', await token(page, '--k-content-primary-foreground'))
      await expect(neutral.locator('[data-slot="toast-icon"]')).toHaveCSS('color', await token(page, '--accent'))
      await expect(neutral.locator('[data-slot="toast-description"]')).toHaveCSS(
        'color',
        await token(page, '--k-content-body-foreground'),
      )
      for (const tone of ['ok', 'warn', 'danger'] as const) {
        const toast = page.getByTestId(`toast-${tone}`)
        const color = await token(page, `--k-status-${tone}-foreground`)
        await expect(toast).toHaveCSS('border-left-color', color)
        await expect(toast.locator('[data-slot="toast-icon"]')).toHaveCSS('color', color)
      }
    })

    test('行内提示：warn 与 danger 是 alert、其余是 status；左边 2px 色条取语气的颜色；图标在左', async ({ page }) => {
      await open(page, theme, 'alert')
      const area = section(page, 'alert')
      await expect(area.getByTestId('alert-default')).toHaveAttribute('role', 'status')
      await expect(area.getByTestId('alert-ok')).toHaveAttribute('role', 'status')
      await expect(area.getByTestId('alert-warn')).toHaveAttribute('role', 'alert')
      await expect(area.getByTestId('alert-danger')).toHaveAttribute('role', 'alert')
      const danger = area.getByTestId('alert-danger')
      await expect(danger).toHaveCSS('border-left-width', '2px')
      await expect(danger).toHaveCSS('border-left-color', await token(page, '--signal-red'))
      await expect(area.getByTestId('alert-ok')).toHaveCSS('border-left-color', await token(page, '--signal-green'))
      await expect(area.getByTestId('alert-warn')).toHaveCSS('border-left-color', await token(page, '--signal-amber'))
      // 有图标的那条：svg 在标题左边（x 更小），16px 见方。
      const icon = (await danger.locator('svg').boundingBox())!
      const title = (await danger.getByText('下单被拒').boundingBox())!
      expect(icon.x + icon.width).toBeLessThanOrEqual(title.x)
      expect(Math.round(icon.width)).toBe(16)
    })

    test('进度条：aria-valuenow 跟值，填充比例对，点一下变；不知道进度是不确定态一块 40% 的滑条', async ({ page }) => {
      await open(page, theme, 'progress')
      const area = section(page, 'progress')
      const bar = area.getByTestId('progress')
      const fraction = () =>
        bar.evaluate((track) => {
          const fill = track.firstElementChild!.getBoundingClientRect()
          const rect = track.getBoundingClientRect()
          return Math.round(((fill.right - rect.left) / rect.width) * 100) / 100
        })
      await expect(bar).toHaveAttribute('aria-valuenow', '30')
      await expect(bar).toHaveCSS('height', '4px')
      await expect.poll(fraction).toBe(0.3)
      await area.getByRole('button', { name: '加 20' }).click()
      await expect(bar).toHaveAttribute('aria-valuenow', '50')
      await expect.poll(fraction).toBe(0.5)
      await expect(area.getByTestId('progress-ok').locator('[data-slot=progress-indicator]')).toHaveCSS(
        'background-color',
        await token(page, '--signal-green'),
      )
      const indeterminate = area.getByTestId('progress-indeterminate')
      await expect(indeterminate).not.toHaveAttribute('aria-valuenow', /.*/)
      await expect(indeterminate).toHaveAttribute('data-state', 'indeterminate')
      await expect(indeterminate.locator('[data-slot=progress-indicator]')).toHaveCSS(
        'animation-name',
        'kc-progress-slide',
      )
    })

    test('抽屉：键盘打开贴着右边（宽 360、满高），焦点锁在里面，Esc 关，焦点回触发器；左边的贴左', async ({ page }) => {
      await open(page, theme, 'sheet')
      const area = section(page, 'sheet')
      const trigger = area.getByRole('button', { name: '右侧抽屉' })
      await trigger.focus()
      await page.keyboard.press('Enter')
      const sheet = page.getByRole('dialog', { name: '品种详情' })
      await expect(sheet).toBeVisible()
      await expect(page.locator('[data-slot=sheet-overlay]')).toBeVisible()
      await expect
        .poll(async () => Math.round((await sheet.boundingBox())!.x + (await sheet.boundingBox())!.width))
        .toBe(page.viewportSize()!.width)
      const box = (await sheet.boundingBox())!
      expect(Math.round(box.width)).toBe(360)
      expect(Math.round(box.height)).toBe(page.viewportSize()!.height)
      // 焦点陷阱：Tab 走多圈，焦点一直在抽屉里。
      const inside = () => sheet.evaluate((el) => el.contains(document.activeElement))
      for (let step = 0; step < 8; step++) {
        await page.keyboard.press('Tab')
        expect(await inside(), `Tab 第 ${step + 1} 下焦点在抽屉里`).toBe(true)
      }
      await page.keyboard.press('Escape')
      await expect(sheet).toBeHidden()
      await expect(trigger).toBeFocused()
      // 左边：贴着窗口左边，点叉关。
      await area.getByRole('button', { name: '左侧抽屉' }).click()
      const left = page.getByRole('dialog', { name: '筛选' })
      await expect(left).toBeVisible()
      await expect.poll(async () => Math.round((await left.boundingBox())!.x)).toBe(0)
      await left.getByRole('button', { name: '关闭抽屉' }).click()
      await expect(left).toBeHidden()
    })

    test('悬停卡：指针停在触发器上出卡、移开收；键盘焦点到触发器也出，Esc 收', async ({ page }) => {
      await open(page, theme, 'hover-card')
      const area = section(page, 'hover-card')
      const trigger = area.getByTestId('hover-trigger')
      const card = page.getByTestId('hover-content')
      await expect(card).toHaveCount(0)
      await trigger.hover()
      await expect(card).toBeVisible()
      await expect(card).toContainText('BTCUSDT 永续')
      await page.mouse.move(5, 5)
      await expect(card).toHaveCount(0)
      await trigger.focus()
      await expect(card).toBeVisible()
      await page.keyboard.press('Escape')
      await expect(card).toHaveCount(0)
    })

    test('命令：打字过滤（含别名）、↑↓ 移动高亮、回车执行、没有匹配写原因；对话框 Esc 关、焦点回按钮', async ({
      page,
    }) => {
      await open(page, theme, 'command')
      const area = section(page, 'command')
      const input = area.getByRole('combobox', { name: '演示命令' })
      const options = area.getByRole('option')
      await input.focus()
      await expect(options).toHaveCount(4)
      await expect(options.first()).toHaveAttribute('data-selected', 'true')
      await page.keyboard.press('ArrowDown')
      await expect(options.nth(1)).toHaveAttribute('data-selected', 'true')
      await expect(options.first()).toHaveAttribute('data-selected', 'false')
      await page.keyboard.press('Enter')
      await expect(area.getByTestId('command-last')).toHaveText('斐波那契回撤')
      // 别名：keywords 里的 time zone 匹配到「显示时区」。
      await input.fill('time zone')
      await expect(options).toHaveCount(1)
      await expect(options.first()).toHaveText('显示时区')
      await input.fill('不存在的命令')
      await expect(area.getByText('没有匹配的命令')).toBeVisible()
      // 禁用的行不可选。
      await input.fill('声音')
      await expect(options.first()).toHaveAttribute('data-disabled', 'true')
      // 对话框：按钮打开，输入框拿焦点，回车执行并关，焦点回按钮；再开一次 Esc 关。
      const opener = area.getByRole('button', { name: '打开命令面板' })
      await opener.focus()
      await page.keyboard.press('Enter')
      const dialog = page.getByRole('dialog', { name: '命令面板' })
      await expect(dialog).toBeVisible()
      await expect(dialog.getByRole('combobox', { name: '命令面板' })).toBeFocused()
      await page.keyboard.type('告警')
      await expect(dialog.getByRole('option')).toHaveCount(1)
      await page.keyboard.press('Enter')
      await expect(dialog).toBeHidden()
      await expect(area.getByTestId('command-last')).toHaveText('新建告警')
      await expect(opener).toBeFocused()
      await page.keyboard.press('Enter')
      await expect(dialog).toBeVisible()
      await page.keyboard.press('Escape')
      await expect(dialog).toBeHidden()
      await expect(opener).toBeFocused()
    })

    test('可搜索下拉：键盘打开焦点在搜索框，打字过滤，回车选中并收起、焦点回触发器；多选点一项不收', async ({
      page,
    }) => {
      await open(page, theme, 'combobox')
      const area = section(page, 'combobox')
      const trigger = area.getByRole('combobox', { name: '周期', exact: true })
      await expect(trigger).toHaveText('1 小时')
      await expect(trigger).toHaveAttribute('aria-expanded', 'false')
      await trigger.focus()
      await page.keyboard.press('Enter')
      await expect(trigger).toHaveAttribute('aria-expanded', 'true')
      const search = page.getByRole('combobox', { name: '搜周期' })
      await expect(search).toBeFocused()
      const options = page.getByRole('option')
      await expect(options).toHaveCount(6)
      // 当前选中的 1 小时前面有勾。
      await expect(options.filter({ hasText: '1 小时' })).toHaveAttribute('data-checked', '')
      await page.keyboard.type('周')
      await expect(options).toHaveCount(1)
      await page.keyboard.press('Enter')
      await expect(trigger).toHaveAttribute('aria-expanded', 'false')
      await expect(area.getByTestId('combobox-value')).toHaveText('1w')
      await expect(trigger).toHaveText('周线')
      await expect(trigger).toBeFocused()
      // 方向键选：重开，↓ 一次，回车。
      await page.keyboard.press('Enter')
      await expect(search).toBeFocused()
      await page.keyboard.press('ArrowDown')
      await page.keyboard.press('Enter')
      await expect(area.getByTestId('combobox-value')).not.toHaveText('1w')
      await expect(trigger).toBeFocused()
      // Esc 收起也回触发器。
      await page.keyboard.press('Enter')
      await expect(search).toBeFocused()
      await page.keyboard.press('Escape')
      await expect(trigger).toBeFocused()
      // 多选：点两项，列表不收，触发器写已选个数。
      const many = area.getByRole('combobox', { name: '常用周期' })
      await many.click()
      await page.getByRole('option', { name: '1 分钟' }).click()
      await page.getByRole('option', { name: '日线' }).click()
      await expect(page.getByRole('combobox', { name: '搜常用周期' })).toBeVisible()
      await page.keyboard.press('Escape')
      await expect(many).toHaveText('已选 3 个')
    })

    test('分隔线：横的 1px 高、竖的 1px 宽，取 line 色；默认读屏不报，decorative=false 是 separator', async ({
      page,
    }) => {
      await open(page, theme, 'separator')
      const area = section(page, 'separator')
      const horizontal = area.getByTestId('separator-h')
      await expect(horizontal).toHaveCSS('height', '1px')
      await expect(horizontal).toHaveCSS('background-color', await token(page, '--line-100'))
      expect((await horizontal.boundingBox())!.width).toBeGreaterThan(100)
      const vertical = area.getByTestId('separator-v')
      await expect(vertical).toHaveCSS('width', '1px')
      expect((await vertical.boundingBox())!.height).toBeGreaterThan(10)
      await expect(horizontal).toHaveAttribute('role', 'none')
      const semantic = area.getByRole('separator')
      await expect(semantic).toHaveCount(1)
      await expect(semantic).toHaveAttribute('aria-orientation', 'vertical')
    })

    test('滚动区：平时没有滚动条，指到才出 4px 的线；滚轮与键盘都能滚', async ({ page }) => {
      await open(page, theme, 'scroll-area')
      const area = section(page, 'scroll-area')
      const box = area.getByTestId('scroll-area')
      const viewport = box.locator('[data-slot=scroll-area-viewport]')
      const bar = box.locator('[data-slot=scroll-area-scrollbar][data-orientation=vertical]')
      await expect(bar).toHaveCount(0)
      await box.hover()
      await expect(bar).toBeVisible()
      expect(Math.round((await bar.boundingBox())!.width)).toBe(4)
      await page.mouse.wheel(0, 200)
      await expect.poll(() => viewport.evaluate((el) => el.scrollTop)).toBeGreaterThan(0)
      // 键盘：Tab 聚焦，方向键与 End 滚。
      await viewport.evaluate((el) => {
        el.scrollTop = 0
      })
      await viewport.focus()
      await expect(viewport).toBeFocused()
      await page.keyboard.press('ArrowDown')
      await expect.poll(() => viewport.evaluate((el) => el.scrollTop)).toBeGreaterThan(0)
      const before = await viewport.evaluate((el) => el.scrollTop)
      await page.keyboard.press('ArrowDown')
      await expect.poll(() => viewport.evaluate((el) => el.scrollTop)).toBeGreaterThan(before)
    })

    test('字段：点标签聚焦控件；说明进 aria-describedby；出错时 aria-invalid、错误 role=alert 进 describedby、标签变危险色', async ({
      page,
    }) => {
      await open(page, theme, 'field')
      const area = section(page, 'field')
      const field = area.getByTestId('field')
      const input = field.getByRole('textbox')
      await field.getByText('止损距离').click()
      await expect(input).toBeFocused()
      const description = field.getByText('单位是价格的最小变动价位。')
      const describedBy = await input.getAttribute('aria-describedby')
      expect(describedBy).toBe(await description.getAttribute('id'))
      await expect(input).not.toHaveAttribute('aria-invalid', 'true')
      await expect(field.getByRole('alert')).toHaveCount(0)
      const label = field.getByText('止损距离')
      const normal = await label.evaluate((el) => getComputedStyle(el).color)
      // 出错：键盘切换。
      await area.getByRole('button', { name: '切换出错' }).focus()
      await page.keyboard.press('Enter')
      const error = field.getByRole('alert')
      await expect(error).toHaveText('请输入数字。')
      await expect(input).toHaveAttribute('aria-invalid', 'true')
      await expect(input).toHaveAttribute('aria-describedby', new RegExp(`(^| )${await error.getAttribute('id')}( |$)`))
      await expect(input).toHaveAttribute(
        'aria-describedby',
        new RegExp(`(^| )${await description.getAttribute('id')}( |$)`),
      )
      await expect(label).toHaveCSS('color', await token(page, '--signal-red'))
      expect(normal).not.toBe(await label.evaluate((el) => getComputedStyle(el).color))
      // 横向的字段：点标签勾上/取消勾选框。
      const box = area.getByRole('checkbox')
      await expect(box).toBeChecked()
      await area.getByText('下单前确认').click()
      await expect(box).not.toBeChecked()
    })

    // —— #1861：学 rare-ui 的交互、本仓库重写的六件。动效用逐帧采样验：点之前在页面里开一个 rAF 采样，点完取回每一帧读到的值，断言中途的样子（不是起点与终点）。
    test('密钥输入：默认遮住；点眼睛显示，输入框不丢焦点与选区，眼睑中途真的在睁开；再点遮回去；禁用时按钮不可点', async ({
      page,
    }) => {
      await open(page, theme, 'password-input')
      const area = section(page, 'password-input')
      const input = area.getByLabel('API 密钥')
      const toggle = area.getByRole('button', { name: '显示密钥' })
      await expect(input).toHaveAttribute('type', 'password')
      await expect(toggle).toHaveAttribute('aria-pressed', 'false')
      // 样子照 Input：30 高；眼睛按钮底色透明、字色 ink-3，不是浏览器默认的灰底按钮。
      expect((await input.boundingBox())?.height).toBe(30)
      await expect(toggle).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)')
      await expect(toggle).toHaveCSS('color', await token(page, '--ink-300'))
      // 选中 2 到 5 位，再点眼睛。
      await input.focus()
      await input.evaluate((el: HTMLInputElement) => el.setSelectionRange(2, 5))
      const lid = sample(
        page,
        { kind: 'attr', selector: '[data-gallery="password-input"] [data-slot="password-input-eye"] path', name: 'd' },
        700,
      )
      await toggle.click()
      await expect(input).toHaveAttribute('type', 'text')
      await expect(toggle).toHaveAttribute('aria-pressed', 'true')
      await expect(input).toHaveValue('demo-secret-0123456789')
      await expect(input).toBeFocused()
      await expect
        .poll(() => input.evaluate((el: HTMLInputElement) => [el.selectionStart, el.selectionEnd]))
        .toEqual([2, 5])
      await expect(area.locator('[data-gallery-visible]')).toHaveText('显示中')
      const shapes = [...new Set(await lid)]
      expect(shapes[0], '起点是合上的一条线').toBe('M2 12C6 12 18 12 22 12C18 12 6 12 2 12Z')
      expect(shapes.at(-1), '终点是睁开的杏仁').toBe('M2 12C6 4 18 4 22 12C18 20 6 20 2 12Z')
      expect(shapes.length, '中间有过渡帧').toBeGreaterThan(3)
      await toggle.click()
      await expect(input).toHaveAttribute('type', 'password')
      await expect(toggle).toHaveAttribute('aria-pressed', 'false')
      await expect(area.getByRole('button', { name: '显示', exact: true })).toBeDisabled()
    })

    test('原地确认：点一下只展开不执行，宽度弹簧撑开，焦点落在取消；Esc、点外面、Tab 走开都取消；点勾才执行', async ({
      page,
    }) => {
      await open(page, theme, 'delete-button')
      const area = section(page, 'delete-button')
      const root = area.locator('[data-slot="delete-button"]').first()
      const trash = area.getByRole('button', { name: '删除工作区' })
      const confirm = area.getByRole('button', { name: '确认删除' })
      const count = area.locator('[data-gallery-delete]')
      await expect(count).toHaveText('删除 0 次 · 取消 0 次')
      expect((await root.boundingBox())?.width).toBe(30)
      const widths = sample(
        page,
        { kind: 'width', selector: '[data-gallery="delete-button"] [data-slot="delete-button"]' },
        700,
      )
      await trash.click()
      await expect(trash).toHaveAttribute('aria-expanded', 'true')
      await expect(confirm).toBeVisible()
      await expect(area.getByRole('button', { name: '取消' })).toBeFocused()
      const spread = await widths
      expect(spread[0]).toBe(30)
      expect(spread.at(-1)).toBe(86)
      expect(
        spread.some((w) => w > 32 && w < 84),
        '宽度中途在过渡',
      ).toBe(true)
      // 点原按钮只是展开：没有执行删除。
      await expect(count).toHaveText('删除 0 次 · 取消 0 次')
      // Esc：取消，焦点回到原按钮。
      await page.keyboard.press('Escape')
      await expect(count).toHaveText('删除 0 次 · 取消 1 次')
      await expect(trash).toBeFocused()
      await expect(confirm).toHaveCount(0)
      await expect.poll(async () => (await root.boundingBox())?.width).toBe(30)
      // 点外面：取消。
      await trash.click()
      await expect(confirm).toBeVisible()
      await page.getByRole('heading', { level: 1 }).click()
      await expect(count).toHaveText('删除 0 次 · 取消 2 次')
      // Tab 走开：取消。
      await trash.click()
      await expect(area.getByRole('button', { name: '取消' })).toBeFocused()
      await page.keyboard.press('Tab')
      await expect(count).toHaveText('删除 0 次 · 取消 3 次')
      // 点勾：执行一次，按钮上留一个对勾，过一会儿回到待命。
      await expect(root).toHaveAttribute('data-phase', 'idle')
      await trash.click()
      await confirm.click()
      await expect(count).toHaveText('删除 1 次 · 取消 3 次')
      await expect(root).toHaveAttribute('data-phase', 'done')
      await expect(root).toHaveAttribute('data-phase', 'idle')
    })

    test('提醒铃：数变多铃摆一下再回正，变少、清零不摆；角标 0 时没有，超过上限写「+」，数字滚动；圆点不带数字', async ({
      page,
    }) => {
      await open(page, theme, 'notification-bell')
      const area = section(page, 'notification-bell')
      const bells = area.locator('[data-slot="notification-bell"]')
      const bell = bells.first()
      const badge = bell.locator('[data-slot="notification-bell-badge"]')
      const swing = {
        kind: 'angle',
        selector: '[data-gallery="notification-bell"] [data-slot="notification-bell-icon"]',
      } as const
      await expect(bell).toHaveAccessibleName('提醒，0 条未读')
      await expect(badge).toHaveCount(0)
      let run = sample(page, swing, 1100)
      await area.getByRole('button', { name: '来 1 条' }).click()
      await expect(badge).toHaveText('1')
      await expect(bell).toHaveAccessibleName('提醒，1 条未读')
      const angles = await run
      expect(Math.max(...angles.map(Math.abs)), '摆出去了').toBeGreaterThan(6)
      expect(Math.abs(angles.at(-1)!), '摆完回正').toBeLessThan(1)
      // 来 5 条：数字从 1 滚到 6，中途新旧两个数字同时在。
      const digits = sample(
        page,
        { kind: 'count', selector: '[data-gallery="notification-bell"] [data-slot="notification-bell-text"]' },
        600,
      )
      await area.getByRole('button', { name: '来 5 条' }).click()
      await expect(badge).toHaveText('6')
      expect(Math.max(...(await digits)), '滚动中新旧数字同在').toBeGreaterThanOrEqual(2)
      // 变少：不摆。
      run = sample(page, swing, 800)
      await area.getByRole('button', { name: '读 1 条' }).click()
      await expect(badge).toHaveText('5')
      expect(Math.max(...(await run).map(Math.abs)), '变少不摆').toBeLessThan(0.5)
      // 清零：角标收起，不摆。
      run = sample(page, swing, 800)
      // 同一节下面还有实时演示（也有「全部已读」），这里点的是第一个、原来那个铃。
      await area.getByRole('button', { name: '全部已读' }).first().click()
      await expect(badge).toHaveCount(0)
      expect(Math.max(...(await run).map(Math.abs)), '清零不摆').toBeLessThan(0.5)
      // 超过上限：写「99+」；第二个铃上限 9 写「9+」；圆点没有数字。
      await area.getByRole('button', { name: '120 条' }).click()
      await expect(badge).toHaveText('99+')
      await expect(bells.nth(1).locator('[data-slot="notification-bell-badge"]')).toHaveText('9+')
      const dot = bells.nth(2).locator('[data-slot="notification-bell-badge"]')
      await expect(dot).toHaveText('')
      await expect.poll(async () => (await dot.boundingBox())?.width).toBe(8)
      await expect(badge).toHaveCSS('background-color', await token(page, '--signal-orange'))
    })

    test('状态图标：五种各有名字与颜色；进行中的弧在转；换到成功时对勾一笔画出来（中途取样）', async ({ page }) => {
      await open(page, theme, 'status-icon')
      const area = section(page, 'status-icon')
      const tones = {
        ok: '--k-status-ok-foreground',
        danger: '--k-status-danger-foreground',
        warn: '--k-status-warn-foreground',
        info: '--k-status-info-foreground',
        neutral: '--k-status-neutral-foreground',
        pending: '--k-content-secondary-foreground',
      }
      for (const [tone, variable] of Object.entries(tones)) {
        const icon = area.getByRole('img', { name: `状态 ${tone}` })
        await expect(icon).toHaveAttribute('data-tone', tone)
        await expect(icon).toHaveCSS('color', await token(page, variable))
        expect((await icon.boundingBox())?.width).toBe(16)
      }
      const live = area.locator('[data-gallery-status] [data-slot="status-icon"]')
      await expect(live).toHaveAttribute('data-tone', 'pending')
      // 进行中：弧在转（角度中途取样）。
      const turn = await sample(page, { kind: 'angle', selector: '[data-gallery-status] svg g' }, 500)
      expect(new Set(turn.map((angle) => Math.round(angle))).size, '转动中角度在变').toBeGreaterThan(5)
      // 采样窗口 900 毫秒会在弹簧落定前结束（点击要几十到几百毫秒才发出，实测这台 2 核机器上末值常读到 0.985，16 次红 8 次）：
      // 放宽到 1800 毫秒，断言（画到一半、末值 > 0.99）原样不动。
      const draw = sample(page, { kind: 'dash', selector: '[data-gallery-status] svg path' }, 1800)
      await area.getByRole('button', { name: '成功' }).click()
      await expect(live).toHaveAttribute('data-tone', 'ok')
      const strokes = (await draw).filter((value) => !Number.isNaN(value))
      expect(
        strokes.some((value) => value > 0.05 && value < 0.95),
        '对勾画到一半',
      ).toBe(true)
      expect(strokes.at(-1)).toBeGreaterThan(0.99)
      await area.getByRole('button', { name: '失败' }).click()
      await expect(live).toHaveAttribute('data-tone', 'danger')
      await expect(live).toHaveCSS('color', await token(page, '--k-status-danger-foreground'))
      await expect(live.locator('path')).toHaveCount(2)
    })

    test('行内 AI 状态：进行中文字有流光（在动）、带耗时；换状态时新旧文字同在、宽度弹簧过渡；结束后流光停、耗时收起', async ({
      page,
    }) => {
      await open(page, theme, 'ai-status')
      const area = section(page, 'ai-status')
      const row = area.locator('[data-slot="ai-status"]').first()
      const label = row.locator('[data-slot="ai-status-label"]')
      await expect(row).toHaveAttribute('role', 'status')
      await expect(row).toHaveAttribute('data-state', 'thinking')
      await expect(label).toHaveText('思考中')
      await expect(label).toHaveCSS('animation-name', 'k-ai-shimmer')
      await expect(row.locator('[data-slot="ai-status-elapsed"]')).toHaveText(/^\d+s$/)
      // 流光在动：背景位置随时间变。
      const positions = await sample(
        page,
        { kind: 'bgx', selector: '[data-gallery="ai-status"] [data-slot="ai-status-label"]' },
        500,
      )
      expect(new Set(positions).size, '流光位置在变').toBeGreaterThan(5)
      // 思考到完成：文字短了，宽度中途在过渡，新旧文字有一帧同在。
      const widths = sample(
        page,
        { kind: 'width', selector: '[data-gallery="ai-status"] [data-slot="ai-status"] > div' },
        900,
      )
      const labels = sample(
        page,
        { kind: 'count', selector: '[data-gallery="ai-status"] [data-slot="ai-status"] [data-slot="ai-status-label"]' },
        900,
      )
      await area.getByRole('button', { name: 'done', exact: true }).click()
      await expect(label.last()).toHaveText('完成')
      const span = await widths
      expect(span[0]).toBeGreaterThan(span.at(-1)!)
      expect(
        span.some((w) => w < span[0]! - 1 && w > span.at(-1)! + 1),
        '宽度中途在过渡',
      ).toBe(true)
      expect(Math.max(...(await labels)), '新旧文字同在').toBeGreaterThanOrEqual(2)
      // 结束：旧文字退完只剩一个；没有 data-active、流光停、耗时收起、对勾画满。
      await expect(label).toHaveCount(1)
      await expect(row).not.toHaveAttribute('data-active', /.*/)
      await expect(label).toHaveCSS('animation-name', 'none')
      await expect(row.locator('[data-slot="ai-status-elapsed"]')).toHaveCount(0)
      await expect
        .poll(async () =>
          (
            await sample(
              page,
              {
                kind: 'dash',
                selector: '[data-gallery="ai-status"] [data-slot="ai-status"] [data-glyph="done"] path',
              },
              50,
            )
          ).at(-1),
        )
        .toBeGreaterThan(0.99)
      // 出错：叉是红的，会抖一下。
      await area.getByRole('button', { name: 'error', exact: true }).click()
      await expect(row.locator('[data-glyph="error"] path')).toHaveCSS('animation-name', 'k-ai-shake')
      await expect(row.locator('[data-slot="ai-status-icon"] > span').last()).toHaveCSS(
        'color',
        await token(page, '--signal-red'),
      )
      // 检索：带细节。
      await area.getByRole('button', { name: 'searching', exact: true }).click()
      await expect(row.locator('[data-slot="ai-status-detail"]')).toHaveText('docs/product/README.md')
    })

    test('点阵状态球：画布缓冲跟缩放走；待命左右对称、思考不对称且在转、聆听电平高亮得多；颜色是主题的强调色', async ({
      page,
    }) => {
      await open(page, theme, 'matrix-orb')
      const area = section(page, 'matrix-orb')
      const orb = area.locator('[data-gallery-orb] canvas')
      await expect(orb).toHaveAttribute('data-state', 'idle')
      const ratio = await page.evaluate(() => window.devicePixelRatio)
      await expect.poll(() => orb.evaluate((el: HTMLCanvasElement) => el.width)).toBe(Math.round(96 * ratio))
      const read = () =>
        orb.evaluate((el: HTMLCanvasElement) => {
          const data = el.getContext('2d')!.getImageData(0, 0, el.width, el.height).data
          let left = 0
          let right = 0
          let best = 0
          let rgb = [0, 0, 0]
          for (let y = 0; y < el.height; y++)
            for (let x = 0; x < el.width; x++) {
              const i = (y * el.width + x) * 4
              const alpha = data[i + 3]!
              if (x < el.width / 2) left += alpha
              else right += alpha
              if (alpha > best) {
                best = alpha
                rgb = [data[i]!, data[i + 1]!, data[i + 2]!]
              }
            }
          return { total: left + right, skew: (left - right) / Math.max(1, left + right), rgb, best }
        })
      // 待命：画上去了、颜色是主题强调色、左右对称（亮度只跟到圆心的距离有关）。
      await expect.poll(async () => (await read()).total).toBeGreaterThan(2000)
      const idle = await read()
      expect(idle.best).toBe(255)
      const want = await rgba(page, await token(page, '--signal-orange'))
      expect(idle.rgb.every((v, i) => Math.abs(v - (want[i] as number)) <= 3)).toBe(true)
      expect(Math.abs(idle.skew)).toBeLessThan(0.03)
      // 在动：隔一会儿画面不一样。
      const before = (await read()).total
      await expect.poll(async () => (await read()).total).not.toBe(before)
      // 思考：热点绕圈，左右两侧都偏重过。
      await area.getByRole('button', { name: '思考', exact: true }).click()
      await expect(orb).toHaveAttribute('data-state', 'thinking')
      let high = 0
      let low = 0
      await expect
        .poll(
          async () => {
            const { skew } = await read()
            high = Math.max(high, skew)
            low = Math.min(low, skew)
            return high > 0.04 && low < -0.04
          },
          { timeout: 8000, intervals: [60] },
        )
        .toBe(true)
      // 聆听：输入电平拉满比压低亮得多（同一个球，只改 level）；透明度之和随缓冲像素数（ratio 的平方）涨，阈值跟着乘。
      await area.getByRole('button', { name: '聆听', exact: true }).click()
      await expect(orb).toHaveAttribute('data-state', 'listening')
      const slider = area.getByRole('slider', { name: '输入电平' })
      await slider.focus()
      await page.keyboard.press('Home')
      await expect.poll(async () => (await read()).total, { timeout: 4000 }).toBeLessThan(60000 * ratio * ratio)
      const quiet = (await read()).total
      await page.keyboard.press('End')
      await expect.poll(async () => (await read()).total, { timeout: 4000 }).toBeGreaterThan(quiet * 3)
    })

    test('像素屏：画布缓冲跟缩放走；点亮的像素是主题强调色，满不透明，数量够一行 KATANA', async ({ page }) => {
      await open(page, theme, 'arcade-pixel')
      const canvas = section(page, 'arcade-pixel').locator('[data-gallery-arcade] canvas')
      const ratio = await page.evaluate(() => window.devicePixelRatio)
      // KATANA：6 个字 * 6 列 - 1 = 35 列，每格 6px 加 1px 间隔，宽 35 * 7 - 1 = 244。
      await expect.poll(() => canvas.evaluate((el: HTMLCanvasElement) => el.width)).toBe(Math.round(244 * ratio))
      const want = await rgba(page, await token(page, '--signal-orange'))
      const lit = () =>
        canvas.evaluate((el: HTMLCanvasElement, rgb) => {
          const data = el.getContext('2d')!.getImageData(0, 0, el.width, el.height).data
          let count = 0
          for (let i = 0; i < data.length; i += 4)
            if (
              data[i + 3] === 255 &&
              Math.abs(data[i]! - rgb[0]!) <= 3 &&
              Math.abs(data[i + 1]! - rgb[1]!) <= 3 &&
              Math.abs(data[i + 2]! - rgb[2]!) <= 3
            )
              count++
          return count
        }, want as number[])
      // KATANA 约 100 格亮点，每格 36 个 CSS 像素；取一半留余量。
      await expect.poll(lit).toBeGreaterThan(1800 * ratio * ratio)
    })

    // ---- #1861 第二批 ----

    test('步进播放器：播放时当前步的填充随时间变宽，暂停停住、续播不归零，放完变重放、点重放从头来', async ({
      page,
    }) => {
      await open(page, theme, 'step-player')
      const player = page.locator('[data-gallery-player] [data-slot="step-player"]')
      const control = player.getByRole('button', { name: '播放' })
      await expect(player.locator('[data-slot="step-player-step"]')).toHaveCount(3)
      await control.click()
      await expect(player).toHaveAttribute('data-playing', 'true')
      const fill =
        '[data-gallery-player] [data-slot="step-player-step"][data-state="active"] [data-slot="step-player-fill"]'
      const run = await sample(page, { kind: 'width', selector: fill }, 300)
      expect(run.at(-1)!, '填充在变宽').toBeGreaterThan(run[0]! + 3)
      for (let i = 1; i < run.length; i++) expect(run[i]!).toBeGreaterThanOrEqual(run[i - 1]! - 0.5)
      await player.getByRole('button', { name: '暂停' }).click()
      const held = await sample(page, { kind: 'width', selector: fill }, 250)
      expect(Math.max(...held) - Math.min(...held), '暂停后不再变').toBeLessThan(1)
      expect(held[0]!, '暂停不归零').toBeGreaterThan(0)
      await player.getByRole('button', { name: '播放' }).click()
      await expect(player).toHaveAttribute('data-finished', 'true', { timeout: 6000 })
      await expect(page.locator('[data-gallery-step]')).toHaveText('第 3 步 · 放完 1 次')
      await player.getByRole('button', { name: '重放' }).click()
      await expect(player).toHaveAttribute('data-playing', 'true')
      await expect(page.locator('[data-gallery-step]')).toHaveText('第 1 步 · 放完 1 次')
    })

    test('步进播放器：可跳的那条点圆点直接去那一步，命中区至少 44 像素高，带分组读屏名', async ({ page }) => {
      await open(page, theme, 'step-player')
      const player = page.locator('[data-gallery-seek] [data-slot="step-player"]')
      const group = player.getByRole('group')
      await expect(group).toHaveAttribute('aria-label', '第 1 步，共 3 步')
      const seek = player.locator('[data-slot="step-player-seek"]')
      await expect(seek).toHaveCount(3)
      expect((await seek.nth(1).boundingBox())!.height).toBeGreaterThanOrEqual(44)
      await seek.nth(2).click()
      await expect(group).toHaveAttribute('aria-label', '第 3 步，共 3 步')
      await expect(seek.nth(2)).toHaveAttribute('aria-current', 'step')
      await expect(seek.nth(1)).toHaveAccessibleName('第二段')
    })

    test('主题选择：缩略取调色板的颜色，点一张环用弹簧滑过去，方向键、Home、End 换并移焦点，tab 只停在选中的', async ({
      page,
    }) => {
      await open(page, theme, 'theme-selector')
      const group = page.locator('[data-gallery-themes] [role="radiogroup"]')
      const items = group.getByRole('radio')
      await expect(items).toHaveCount(2)
      await expect(items.nth(0)).toBeChecked()
      // 缩略色演示里是自定义属性（var(--demo-console-rail)，预览与设计系统包不写裸色值），算出来的是调色板的颜色。
      const fillOf = (item: Locator) =>
        item
          .locator('svg rect')
          .first()
          .evaluate((el) => getComputedStyle(el).fill)
      await expect.poll(() => fillOf(items.nth(0))).toBe('rgb(20, 19, 17)')
      await expect.poll(() => fillOf(items.nth(1))).toBe('rgb(7, 7, 7)')
      await expect(items.nth(0)).toHaveAttribute('tabindex', '0')
      await expect(items.nth(1)).toHaveAttribute('tabindex', '-1')
      const ring = '[data-gallery-themes] [data-slot="theme-selector-ring"]'
      const before = (await page.locator(ring).boundingBox())!.x
      const slide = sample(page, { kind: 'x', selector: ring }, 500)
      await items.nth(1).click()
      const xs = await slide
      await expect(page.locator('output[data-gallery-theme]')).toHaveText('graphite')
      const target = xs.at(-1)!
      expect(target).toBeGreaterThan(before + 100)
      expect(
        xs.some((x) => x > before + 5 && x < target - 5),
        '环中途出现在两张之间',
      ).toBe(true)
      await items.nth(1).focus()
      await page.keyboard.press('ArrowLeft')
      await expect(items.nth(0)).toBeChecked()
      await expect(items.nth(0)).toBeFocused()
      await page.keyboard.press('ArrowLeft')
      await expect(items.nth(1), '从头往前绕到末').toBeChecked()
      await page.keyboard.press('Home')
      await expect(items.nth(0)).toBeChecked()
      await page.keyboard.press('End')
      await expect(items.nth(1)).toBeChecked()
      const disabled = page.getByRole('radiogroup', { name: '主题（禁用）' }).getByRole('radio').first()
      await expect(disabled).toBeDisabled()
    })

    test('代码块：关键字取强调色、蓝色强调的取蓝，高亮行带标记，行号选不中，复制写进剪贴板并换提示再复原', async ({
      page,
      context,
    }) => {
      await context.grantPermissions(['clipboard-read', 'clipboard-write'])
      await open(page, theme, 'code-block')
      const block = page.locator('[data-gallery-code] [data-slot="code-block"]')
      const keyword = block.locator('[data-token="keyword"]').first()
      const orange = await page.evaluate(() => {
        const probe = document.createElement('i')
        probe.style.color = 'var(--signal-orange)'
        document.body.append(probe)
        const color = getComputedStyle(probe).color
        probe.remove()
        return color
      })
      await expect(keyword).toHaveCSS('color', orange)
      const json = page.locator('[data-slot="code-block"][data-language="json"] [data-token="keyword"]').first()
      const blue = await page.evaluate(() => {
        const probe = document.createElement('i')
        probe.style.color = 'var(--signal-blue)'
        document.body.append(probe)
        const color = getComputedStyle(probe).color
        probe.remove()
        return color
      })
      await expect(json).toHaveCSS('color', blue)
      const marked = block.locator('[data-line][data-marked]')
      await expect(marked).toHaveCount(1)
      await expect(marked).toHaveAttribute('data-line', '4')
      await expect(block.locator('[data-slot="code-block-gutter"]').first()).toHaveCSS('user-select', 'none')
      const copy = block.getByRole('button', { name: '复制代码' })
      await copy.click()
      await expect(block.getByRole('button', { name: '已复制' })).toBeVisible()
      const text = await page.evaluate(() => navigator.clipboard.readText())
      expect(text).toContain('export function lastMean')
      expect(text.startsWith('\n'), '复制的是去掉首尾空行的原文').toBe(false)
      await expect(block.getByRole('button', { name: '复制代码' })).toBeVisible({ timeout: 6000 })
    })

    test('网页检索：点药丸展开来源卡、再点收起；多于三张时最后一格是「还有 N 条」；进度环随结果数补满', async ({
      page,
    }) => {
      await open(page, theme, 'web-search')
      const area = page.locator('[data-gallery-search] [data-slot="web-search"]')
      const trigger = area.locator('[data-slot="web-search-trigger"]')
      // 默认展开：点药丸收起，再点展开。
      await expect(trigger).toHaveAttribute('aria-expanded', 'true')
      await trigger.click()
      await expect(trigger).toHaveAttribute('aria-expanded', 'false')
      await trigger.click()
      await expect(trigger).toHaveAttribute('aria-expanded', 'true')
      const sources = area.locator('[data-slot="web-search-source"]')
      await expect(sources.first()).toBeVisible()
      await expect(area.locator('[data-slot="web-search-more"]')).toContainText('还有 3 条')
      await area.locator('[data-slot="web-search-more"]').click()
      await expect(area.locator('[data-slot="web-search-less"]')).toContainText('收起')
      await expect(sources).toHaveCount(6)
      await trigger.click()
      await expect(trigger).toHaveAttribute('aria-expanded', 'false')
      // 检索：开始后环在 0.08，来一条补上剩下的 30%（0.3），再来一条 0.51，完成后满并淡出。
      const section_ = section(page, 'web-search')
      const ring = '[data-gallery-search] [data-slot="web-search-ring"]'
      await section_.getByRole('button', { name: '开始检索' }).click()
      await expect(area).toHaveAttribute('data-status', 'searching')
      await expect
        .poll(async () => (await sample(page, { kind: 'dash', selector: ring }, 50)).at(-1)!, { timeout: 4000 })
        .toBeCloseTo(0.08, 1)
      await section_.getByRole('button', { name: '来一条结果' }).click()
      await expect
        .poll(async () => (await sample(page, { kind: 'dash', selector: ring }, 50)).at(-1)!, { timeout: 4000 })
        .toBeCloseTo(0.3, 1)
      await section_.getByRole('button', { name: '来一条结果' }).click()
      await expect
        .poll(async () => (await sample(page, { kind: 'dash', selector: ring }, 50)).at(-1)!, { timeout: 4000 })
        .toBeCloseTo(0.51, 1)
      await expect(area.locator('[data-slot="web-search-label"]').last()).toHaveText('检索中，已有 2 条')
      await section_.getByRole('button', { name: '检索完成' }).click()
      await expect(area).toHaveAttribute('data-status', 'done')
      await expect(area.locator('[data-slot="web-search-label"]').last()).toHaveText('已检索 2 个站点')
      await expect
        .poll(async () => Number(await page.locator(ring).evaluate((el) => getComputedStyle(el).opacity)), {
          timeout: 4000,
        })
        .toBeLessThan(0.05)
    })

    test('行内引用：悬停停约 300 毫秒才弹预览、离开约 150 毫秒后才收；Tab 聚焦立刻弹', async ({ page }) => {
      await open(page, theme, 'web-search')
      const cite = page.locator('[data-gallery-citation] [data-slot="web-search-citation"]').first()
      const chip = cite.locator('[data-slot="web-search-chip"]')
      const preview = page.locator('[data-gallery-citation] [data-slot="web-search-preview"]')
      await expect(preview).toHaveCount(0)
      const started = Date.now()
      await chip.hover()
      await expect(preview).toBeVisible()
      const waited = Date.now() - started
      expect(waited, '悬停到弹出至少约 300 毫秒').toBeGreaterThanOrEqual(280)
      await expect(preview).toContainText('Reuters')
      await expect(preview).toContainText('央行下调存款准备金率')
      await page.mouse.move(2, 2)
      await expect(preview).toHaveCount(0, { timeout: 3000 })
      await section(page, 'web-search').getByRole('button', { name: '检索完成' }).focus()
      await page.keyboard.press('Tab')
      await expect(chip).toBeFocused()
      await expect(preview).toBeVisible({ timeout: 200 })
    })

    test('任务清单：点一行对勾一笔画出、文字划线从 0 走到整行、划完沉到最后；再点回原位；读屏有播报；空格也能勾', async ({
      page,
    }) => {
      await open(page, theme, 'task-list')
      const list = page.locator('[data-gallery-tasks] [data-slot="task-list"]')
      const row = (id: string) => list.locator(`[data-task-id="${id}"]`)
      await expect(page.locator('[data-gallery-done]')).toHaveText('已完成 1 项')
      await expect(row('t4')).toHaveAttribute('aria-checked', 'true')
      const topBefore = (await row('t1').boundingBox())!.y
      const check = sample(page, { kind: 'dash', selector: '[data-gallery-tasks] [data-task-id="t1"] path' }, 600)
      const strike = sample(
        page,
        { kind: 'bgw', selector: '[data-gallery-tasks] [data-task-id="t1"] [data-slot="task-list-label"]' },
        700,
      )
      const move = sample(page, { kind: 'y', selector: '[data-gallery-tasks] [data-task-id="t1"]' }, 1100)
      await row('t1').click()
      const [c, s, m] = await Promise.all([check, strike, move])
      expect(Math.min(...c), '对勾从无到满').toBeLessThan(0.3)
      expect(c.at(-1)).toBeGreaterThan(0.95)
      expect(
        s.some((w) => w > 5 && w < 95),
        '划线中途在 0 到 100 之间',
      ).toBe(true)
      expect(s.at(-1)).toBeCloseTo(100, 0)
      expect(m.at(-1)!, '划完沉到最后一项下面').toBeGreaterThan(topBefore + 60)
      await expect(row('t1')).toHaveAttribute('aria-checked', 'true')
      await expect(page.locator('[data-gallery-done]')).toHaveText('已完成 2 项')
      await expect(list.getByRole('status')).toHaveText('读最近 20 根日线 已完成')
      // 再点：回原位。
      await row('t1').click()
      await expect(list.getByRole('status')).toHaveText('读最近 20 根日线 已重开')
      await expect.poll(async () => (await row('t1').boundingBox())!.y, { timeout: 4000 }).toBeCloseTo(topBefore, 0)
      await expect(page.locator('[data-gallery-done]')).toHaveText('已完成 1 项')
      // 键盘：空格勾上。
      await row('t3').focus()
      await page.keyboard.press('Space')
      await expect(row('t3')).toHaveAttribute('aria-checked', 'true')
    })

    test('时长选择：点笔三段弹簧分开、数字可输入；上下键加减；超上限夹住；Enter 确认、Esc 放弃；禁用的点不动', async ({
      page,
    }) => {
      await open(page, theme, 'duration-picker')
      const picker = page.locator('[data-gallery-duration] [data-slot="duration-picker"]')
      const segments = picker.locator('[data-slot="duration-picker-segment"]')
      const status = page.locator('[data-gallery-confirmed]')
      await expect(picker).not.toHaveAttribute('data-editing', /.*/)
      const rest = (await segments.nth(1).boundingBox())!.x
      const slide = page.evaluate(
        () =>
          new Promise<number[]>((resolve) => {
            const el = document.querySelector('[data-gallery-duration] [data-slot="duration-picker"]')!
            const out: number[] = []
            const start = performance.now()
            const tick = () => {
              out.push(Number.parseFloat(getComputedStyle(el).columnGap) || 0)
              if (performance.now() - start < 500) requestAnimationFrame(tick)
              else resolve(out)
            }
            tick()
          }),
      )
      await picker.getByRole('button', { name: '编辑时长' }).click()
      const xs = await slide
      await expect(picker).toHaveAttribute('data-editing', 'true')
      await expect(status).toHaveText('编辑中')
      expect(rest).toBeGreaterThan(0)
      expect(xs[0], '起点没有缝').toBe(0)
      expect(xs.at(-1)!, '终点 6 像素的缝').toBeCloseTo(6, 0)
      expect(
        xs.some((x) => x > 0.3 && x < 5.7),
        '中途出现在两个位置之间',
      ).toBe(true)
      await expect(segments.nth(1)).toHaveCSS(
        'border-top-left-radius',
        await segments.nth(0).evaluate((el) => getComputedStyle(el).borderTopLeftRadius),
      )
      const hours = picker.getByRole('textbox', { name: '小时' })
      await expect(hours).toHaveValue('2')
      await hours.focus()
      await page.keyboard.press('ArrowUp')
      await expect(hours).toHaveValue('3')
      await hours.fill('99')
      await expect(hours, '超过 24 夹成 24').toHaveValue('24')
      await page.keyboard.press('Enter')
      await expect(picker).not.toHaveAttribute('data-editing', /.*/)
      await expect(status).toHaveText('确认 24 时 30 分')
      // Esc 放弃：回到编辑前的值。
      await picker.getByRole('button', { name: '编辑时长' }).click()
      const minutes = picker.getByRole('textbox', { name: '分钟' })
      await minutes.focus()
      await minutes.fill('5')
      await page.keyboard.press('Escape')
      await expect(picker).not.toHaveAttribute('data-editing', /.*/)
      await expect(picker.getByRole('textbox', { name: '分钟' })).toHaveValue('30')
      // 禁用的：笔点不动。
      const off = page.locator('[data-slot="duration-picker"][data-disabled]')
      await expect(off.getByRole('button', { name: '编辑时长' })).toBeDisabled()
    })

    // ---- #1884 报价与行情类的件。展示页上的数据都是标明的示例。 ----

    /** 把任意 CSS 颜色（含 color-mix 与 var）放到探针上算出来，画成一个像素读 [r, g, b, a]。 */
    const swatch = (page: Page, css: string) =>
      page.evaluate((value) => {
        const probe = document.createElement('i')
        probe.style.color = value
        document.body.append(probe)
        const computed = getComputedStyle(probe).color
        probe.remove()
        const canvas = document.createElement('canvas')
        canvas.width = canvas.height = 1
        const context = canvas.getContext('2d', { willReadFrequently: true })!
        context.fillStyle = computed
        context.fillRect(0, 0, 1, 1)
        return [...context.getImageData(0, 0, 1, 1).data]
      }, css)
    const paint = (locator: Locator, property: 'stroke' | 'fill' | 'color' | 'backgroundColor') =>
      locator.evaluate((element, name) => {
        const canvas = document.createElement('canvas')
        canvas.width = canvas.height = 1
        const context = canvas.getContext('2d', { willReadFrequently: true })!
        context.fillStyle = getComputedStyle(element)[name as 'stroke']
        context.fillRect(0, 0, 1, 1)
        return [...context.getImageData(0, 0, 1, 1).data]
      }, property)

    test('迷你图：折线铺满整宽，线色按头尾涨跌取 token（涨、跌、平三种），没有数据只留「—」', async ({ page }) => {
      await open(page, theme, 'sparkline')
      const up = page.locator('[data-gallery-spark="up"] svg')
      const down = page.locator('[data-gallery-spark="down"] svg')
      const flat = page.locator('[data-gallery-spark="flat"] svg')
      await expect(up).toHaveClass(/is-up/)
      await expect(down).toHaveClass(/is-down/)
      await expect(flat).toHaveClass(/is-flat/)
      const box = (await up.boundingBox())!
      const line = (await up.locator('.k-spark-line').boundingBox())!
      expect(line.width, '折线铺满整宽（两边留放末端点的几像素）').toBeGreaterThan(box.width - 10)
      expect(box.height).toBeGreaterThan(30)
      await expect.poll(() => paint(up.locator('.k-spark-line'), 'stroke')).toEqual(await swatch(page, 'var(--pnl-up)'))
      await expect
        .poll(() => paint(down.locator('.k-spark-line'), 'stroke'))
        .toEqual(await swatch(page, 'var(--pnl-down)'))
      await expect
        .poll(() => paint(flat.locator('.k-spark-line'), 'stroke'))
        .toEqual(await swatch(page, 'var(--ink-200)'))
      const empty = page.locator('[data-gallery-spark="empty"]').getByRole('img')
      await expect(empty).toHaveText('—')
      await expect(empty).toHaveAccessibleName('示例走势：没有数据')
      await expect(page.locator('[data-gallery-spark="empty"] svg')).toHaveCount(0)
    })

    test('迷你图：五种画法都渲染；按真实像素画，viewBox 的宽高等于容器的宽高，不拉伸', async ({ page }) => {
      await open(page, theme, 'sparkline')
      const of = (id: string) => page.locator(`[data-gallery-spark="${id}"] svg`)
      await expect(of('variant-area').locator('.k-spark-area')).toHaveCount(1)
      await expect(of('variant-area').locator('.k-spark-line')).toHaveCount(1)
      await expect(of('variant-line').locator('.k-spark-line')).toHaveCount(1)
      await expect(of('variant-line').locator('.k-spark-area')).toHaveCount(0)
      // baseline：以基准切成上下两半，各有一份线与面积，上半涨色、下半跌色。
      await expect(of('variant-baseline').locator('clipPath')).toHaveCount(2)
      await expect(of('variant-baseline').locator('.k-spark-up .k-spark-line')).toHaveCount(1)
      await expect(of('variant-baseline').locator('.k-spark-down .k-spark-line')).toHaveCount(1)
      await expect
        .poll(() => paint(of('variant-baseline').locator('.k-spark-up .k-spark-line'), 'stroke'))
        .toEqual(await swatch(page, 'var(--pnl-up)'))
      await expect
        .poll(() => paint(of('variant-baseline').locator('.k-spark-down .k-spark-line'), 'stroke'))
        .toEqual(await swatch(page, 'var(--pnl-down)'))
      expect(await of('variant-bars').locator('.k-spark-bar').count()).toBeGreaterThan(20)
      expect(await of('variant-winloss').locator('.k-spark-cell').count()).toBe(24)
      for (const id of [
        'variant-area',
        'variant-line',
        'variant-baseline',
        'variant-bars',
        'variant-winloss',
        'volume',
        'table',
      ]) {
        const svg = id === 'table' ? page.locator('[data-gallery-spark="table"] svg').first() : of(id)
        const size = await svg.evaluate((el) => {
          const box = el.getBoundingClientRect()
          const [, , vw, vh] = (el.getAttribute('viewBox') ?? '').split(' ').map(Number)
          return { vw, vh, w: box.width, h: box.height, par: el.getAttribute('preserveAspectRatio') }
        })
        expect(Math.abs(size.vw! - size.w), `${id} 宽`).toBeLessThan(1)
        expect(Math.abs(size.vh! - size.h), `${id} 高`).toBeLessThan(1)
        expect(size.par, `${id} 不用 none 拉伸`).not.toBe('none')
      }
      // 线宽 1.5px、虚线基准 2 2。
      expect(
        await of('variant-line')
          .locator('.k-spark-line')
          .evaluate((el) => getComputedStyle(el).strokeWidth),
      ).toBe('1.5px')
      const base = of('base-up').locator('.k-spark-base')
      expect(await base.evaluate((el) => getComputedStyle(el).strokeDasharray)).toBe('2px, 2px')
      await expect.poll(() => paint(base, 'stroke')).toEqual(await swatch(page, 'var(--line-200)'))
    })

    test('迷你图：基准线定涨跌色；最高最低与最新值带标签；断点断开；成交量不压线', async ({ page }) => {
      await open(page, theme, 'sparkline')
      const of = (id: string) => page.locator(`[data-gallery-spark="${id}"] svg`)
      await expect(of('base-up')).toHaveClass(/is-up/)
      await expect(of('base-down')).toHaveClass(/is-down/)
      const ex = of('extremes')
      await expect(ex.locator('.k-spark-extreme')).toHaveCount(2)
      await expect(ex.locator('[data-extreme="max"] text')).toHaveText(/^\d+\.\d\d$/)
      await expect(ex.locator('.k-spark-last')).toHaveText(/^\d+\.\d\d$/)
      // 线收在最新值文字的左边，不压字。
      const lastText = (await ex.locator('.k-spark-last').boundingBox())!
      const lineBox = (await ex.locator('.k-spark-line').boundingBox())!
      expect(lineBox.x + lineBox.width).toBeLessThan(lastText.x)
      // 午休：线有两段（两个 M），面积也两块；停牌后的末端点取最后一个有效值。
      expect(((await of('gap-lunch').locator('.k-spark-line').getAttribute('d')) ?? '').match(/M/g)).toHaveLength(2)
      expect(((await of('gap-lunch').locator('.k-spark-area').getAttribute('d')) ?? '').match(/Z/g)).toHaveLength(2)
      const halt = of('gap-halt')
      const haltLine = (await halt.locator('.k-spark-line').boundingBox())!
      const haltBox = (await halt.boundingBox())!
      expect(haltLine.width, '停牌后线只画到一半多').toBeLessThan(haltBox.width * 0.75)
      const haltDot = await halt.locator('.k-spark-dot').evaluate((el) => Number(el.getAttribute('cx')))
      expect(haltDot).toBeLessThan(haltBox.width * 0.75)
      // 成交量：量柱在底部四分之一里，价格线在量柱之上。
      const vol = of('volume')
      const volBars = vol.locator('.k-spark-vol')
      expect(await volBars.count()).toBeGreaterThan(20)
      const volTop = Math.min(...(await volBars.evaluateAll((els) => els.map((el) => el.getBoundingClientRect().top))))
      const lineBottom = (await vol.locator('.k-spark-line').boundingBox())!
      expect(lineBottom.y + lineBottom.height).toBeLessThanOrEqual(volTop + 1)
      expect(volTop).toBeGreaterThan((await vol.boundingBox())!.y + (await vol.boundingBox())!.height * 0.7)
      await expect(of('volume-updown').locator('.k-spark-vol.is-up').first()).toBeAttached()
      await expect(of('curve-monotone').locator('.k-spark-line')).toHaveAttribute('d', /C/)
      await expect(of('curve-linear').locator('.k-spark-line')).not.toHaveAttribute('d', /C/)
    })

    test('迷你图（interactive）：悬停出十字线、吸附圆点与读数；键盘左右键走点，Esc 退出，读屏播报当前点', async ({
      page,
    }) => {
      await open(page, theme, 'sparkline')
      const svg = page.locator('[data-gallery-spark="hover"] svg')
      const cursor = svg.locator('.k-spark-cursor')
      await expect(cursor).toHaveCount(0)
      // 「TradingView 式」一节加在最上面后这一例在视口外，鼠标要先滚到它。
      await svg.scrollIntoViewIfNeeded()
      const box = (await svg.boundingBox())!
      await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.5)
      await expect(cursor).toHaveCount(1)
      await expect(svg.locator('.k-spark-dot.is-hover')).toHaveCount(1)
      const tip = svg.locator('.k-spark-tip-value')
      await expect(tip).toHaveText(/^\d+\.\d\d$/)
      await expect(svg.locator('.k-spark-tip-time')).toHaveText(/^\d\d:\d\d$/)
      // 十字线贴着吸附点（横向差不到一个点距），读数框不出图。
      const cx = Number(await cursor.getAttribute('x1'))
      const dotX = Number(await svg.locator('.k-spark-dot.is-hover').getAttribute('cx'))
      expect(Math.abs(cx - dotX)).toBeLessThan(1)
      const tipBox = (await svg.locator('.k-spark-tip').boundingBox())!
      expect(tipBox.x).toBeGreaterThanOrEqual(box.x - 1)
      expect(tipBox.x + tipBox.width).toBeLessThanOrEqual(box.x + box.width + 1)
      // 贴右边：读数翻到十字线左边。
      await page.mouse.move(box.x + box.width - 4, box.y + box.height * 0.5)
      await expect
        .poll(
          async () =>
            (await svg.locator('.k-spark-tip').boundingBox())!.x +
            (await svg.locator('.k-spark-tip').boundingBox())!.width,
        )
        .toBeLessThanOrEqual(box.x + box.width + 1)
      await page.mouse.move(box.x - 40, box.y - 40)
      await expect(cursor).toHaveCount(0)
      // 键盘。
      await svg.focus()
      await expect(svg).toHaveAttribute('tabindex', '0')
      await page.keyboard.press('Home')
      await expect(svg.locator('.k-spark-tip-time')).toHaveText('09:00')
      await page.keyboard.press('ArrowRight')
      await expect(svg.locator('.k-spark-tip-time')).toHaveText('09:05')
      await page.keyboard.press('ArrowLeft')
      await expect(svg.locator('.k-spark-tip-time')).toHaveText('09:00')
      await page.keyboard.press('ArrowLeft')
      await expect(svg.locator('.k-spark-tip-time')).toHaveText('09:00')
      const live = page.locator('[data-gallery-spark="hover"] [aria-live="polite"]')
      await expect(live).toContainText('09:00')
      await page.keyboard.press('End')
      await expect(svg.locator('.k-spark-tip-time')).toHaveText('12:55')
      await page.keyboard.press('Escape')
      await expect(cursor).toHaveCount(0)
      await expect(live).toHaveText('', { timeout: 2000 })
      await expect(page.locator('[data-gallery-spark="hover"] .gal-note')).toContainText('Tab')
    })

    test('迷你图（TradingView 式日内图）：线只画到现在、右边留空；午休压缩；价签等于最新价；实时往右长', async ({
      page,
    }) => {
      await open(page, theme, 'sparkline')
      const svg = page.locator('[data-gallery-spark="tv-intraday"] svg')
      await expect(svg).toHaveAttribute('data-timed', '')
      const num = async (name: string) => Number(await svg.getAttribute(name))
      const left = await num('data-plot-left')
      const right = await num('data-plot-right')
      // 与演示数据同一套时间（UTC 毫秒）：上午 9:30 到 11:30、下午 13:00 到 15:00，横轴 240 分钟加一道 4px 的缝。
      const HOUR = 3_600_000
      const open0 = Date.UTC(2026, 10, 17, 1, 30)
      const afternoon = open0 + 3.5 * HOUR
      const xOfAfternoon = (t: number) => left + ((120 + (t - afternoon) / 60_000) / 240) * (right - left - 4) + 4
      const dotX = async () => Number(await svg.locator('circle.k-spark-dot:not(.is-hover)').getAttribute('cx'))
      // 现在是 13:55（第 36 根）：最右点的 x 正是 13:55 对应的 x，右边留着一大片空。
      expect(await dotX()).toBeCloseTo(xOfAfternoon(afternoon + 55 * 60_000), 1)
      const lineBox = (await svg.locator('.k-spark-line').boundingBox())!
      const svgBox = (await svg.boundingBox())!
      expect(lineBox.x + lineBox.width, '线只画到现在，右边留空').toBeLessThan(svgBox.x + right - 40)
      const areaBox = (await svg.locator('.k-spark-area').boundingBox())!
      expect(areaBox.x + areaBox.width, '面积也只到最后一点').toBeLessThan(svgBox.x + right - 40)
      // 午休压缩：线断成两段，上午最后一点（11:30）到下午第一点（13:00）只隔那道缝。
      const d = (await svg.locator('.k-spark-line').getAttribute('d'))!
      const [, morning, afternoonRun] = d.split('M')
      const lastMorning = Number(morning!.trim().split('L').at(-1)!.split(' ')[0])
      const firstAfternoon = Number(afternoonRun!.split('L')[0]!.split(' ')[0])
      expect(firstAfternoon - lastMorning).toBeGreaterThan(0)
      expect(firstAfternoon - lastMorning).toBeLessThan(6)
      // 末端点：实心点外面套一个常驻空心环。
      const ring = svg.locator('.k-spark-ring')
      await expect(ring).toHaveCount(1)
      await expect.poll(() => ring.evaluate((el) => getComputedStyle(el).fill)).toBe('none')
      expect(Number(await ring.getAttribute('r'))).toBeGreaterThan(
        Number(await svg.locator('circle.k-spark-dot').getAttribute('r')),
      )
      expect(Number(await ring.getAttribute('cx'))).toBeCloseTo(await dotX(), 1)
      // 价签：文字等于最新价（迷你行情卡上的价同一个数），底色是涨跌色的面积 token。
      const tag = svg.locator('[data-last-tag]')
      const price = page.locator('[data-gallery-spark="tv-mini"] .k-mini-price')
      await expect(tag.locator('text')).toHaveText(/^\d,\d{3}\.\d\d$/)
      await expect(tag.locator('text')).toHaveText((await price.textContent())!)
      await expect.poll(() => paint(tag.locator('rect'), 'fill')).toEqual(await swatch(page, 'var(--pnl-up-area)'))
      // 价格刻度 4 档、时间刻度有字。
      await expect(svg.locator('.k-spark-price-tick')).toHaveCount(4)
      expect(await svg.locator('.k-spark-time-tick').count()).toBeGreaterThanOrEqual(4)
      await expect(svg.locator('.k-spark-time-tick').first()).toHaveText(/^\d\d:\d\d$/)
      // 实时：走三步，线往右长（右边的空被填一点），价签跟着最新价。
      const before = await dotX()
      await page.evaluate(() => window.__liveStep?.(3))
      await expect.poll(dotX).toBeCloseTo(xOfAfternoon(afternoon + 70 * 60_000), 1)
      expect(await dotX()).toBeGreaterThan(before)
      await expect(tag.locator('text')).toHaveText((await price.textContent())!)
    })

    test('迷你图（TradingView 式悬停）：只有竖线，读数框三行（数值、日期、时间）贴边翻转不出容器', async ({ page }) => {
      await open(page, theme, 'sparkline')
      const svg = page.locator('[data-gallery-spark="tv-intraday"] svg')
      await svg.scrollIntoViewIfNeeded()
      const box = (await svg.boundingBox())!
      const inside = async () => {
        const tip = (await svg.locator('.k-spark-tip').boundingBox())!
        expect(tip.x).toBeGreaterThanOrEqual(box.x - 1)
        expect(tip.x + tip.width).toBeLessThanOrEqual(box.x + box.width + 1)
        expect(tip.y).toBeGreaterThanOrEqual(box.y - 1)
        expect(tip.y + tip.height).toBeLessThanOrEqual(box.y + box.height + 1)
        return tip
      }
      await page.mouse.move(box.x + box.width * 0.3, box.y + box.height * 0.5)
      await expect(svg.locator('.k-spark-cursor')).toHaveCount(1)
      // 竖线：x 不变、从上到下；没有横线。
      const cursor = svg.locator('.k-spark-cursor')
      expect(await cursor.getAttribute('x1')).toBe(await cursor.getAttribute('x2'))
      await expect(svg.locator('.k-spark-hover line')).toHaveCount(1)
      await expect(svg.locator('.k-spark-dot.is-hover')).toHaveCount(1)
      const rows = svg.locator('.k-spark-tip > div')
      await expect(rows).toHaveCount(3)
      await expect(rows.nth(0)).toHaveText(/^\d,\d{3}\.\d\d$/)
      await expect(rows.nth(1)).toHaveText(/^2026-11-17$/)
      await expect(rows.nth(2)).toHaveText(/^\d\d:\d\d UTC\+8$/)
      await expect
        .poll(() => rows.nth(0).evaluate((el) => Number(getComputedStyle(el).fontWeight)))
        .toBeGreaterThanOrEqual(600)
      const mid = await inside()
      // 读数框紧挨竖线：在它右边。
      const cx = box.x + Number(await cursor.getAttribute('x1'))
      expect(mid.x).toBeGreaterThan(cx)
      // 贴右边翻到竖线左边，仍不出容器。
      await page.mouse.move(box.x + box.width - 3, box.y + box.height * 0.5)
      await expect
        .poll(async () => (await svg.locator('.k-spark-tip').boundingBox())!.x)
        .toBeLessThan(box.x + box.width - 60)
      await inside()
      // 贴左边与上边也不出容器。
      await page.mouse.move(box.x + 2, box.y + 2)
      await inside()
      // 只给了 times 没给 formatTime 的图只显示数值（迷你行情卡上没有 formatTime 的情形见 sparkline 的悬停用例）。
      await page.mouse.move(box.x - 40, box.y - 40)
      await expect(svg.locator('.k-spark-cursor')).toHaveCount(0)
    })

    test('迷你图（look=default）：默认画风的结构不变，没有仪器与字形画风的节点', async ({ page }) => {
      await open(page, theme, 'sparkline')
      const svg = page.locator('[data-gallery-spark="tv-intraday"] svg')
      await expect(svg).toHaveClass(/k-spark is-(up|down|flat)/)
      await expect(svg).not.toHaveAttribute('data-look', /.*/)
      for (const part of ['.k-spark-line', '.k-spark-area', '.k-spark-ring', '.k-spark-dot', '[data-last-tag]'])
        await expect(svg.locator(part).first()).toHaveCount(1)
      await expect(svg.locator('[class*="k-spark-ins-"]')).toHaveCount(0)
      await expect(page.locator('[data-gallery-spark="variant-area"] .k-spark-ascii')).toHaveCount(0)
      await expect
        .poll(() => paint(svg.locator('.k-spark-line'), 'stroke'))
        .toEqual(await swatch(page, 'var(--pnl-up)'))
    })

    test('迷你图（look=instrument）：有投影谱与极值批注，线是中性墨色，末端点是唯一的信号色（批注除外）', async ({
      page,
    }) => {
      await open(page, theme, 'sparkline')
      const signalPainted = (locator: Locator) =>
        locator.evaluate((root) => {
          const probe = document.createElement('i')
          probe.style.color = 'var(--accent)'
          document.body.append(probe)
          const accent = getComputedStyle(probe).color
          probe.remove()
          return [...root.querySelectorAll('*')]
            .filter((el) => {
              const style = getComputedStyle(el)
              return style.fill === accent || style.stroke === accent
            })
            .map((el) => el.getAttribute('class') ?? el.tagName)
        })
      // 小图：只画线、点阵与末端点；没有投影、角标、眉头；信号色只有末端点。
      const small = page.locator('[data-gallery-spark="instrument-small"] svg')
      await expect(small).toHaveAttribute('data-look', 'instrument')
      await expect(small.locator('.k-spark-ins-grid')).toHaveCount(1)
      await expect(small.locator('.k-spark-ins-proj, .k-spark-ins-corner, .k-spark-ins-meta')).toHaveCount(0)
      expect(await signalPainted(small)).toEqual(['k-spark-ins-dot'])
      await expect
        .poll(() => paint(small.locator('.k-spark-ins-line'), 'stroke'))
        .toEqual(await swatch(page, 'var(--ink-200)'))
      await expect
        .poll(() => small.locator('.k-spark-ins-line').evaluate((el) => getComputedStyle(el).strokeWidth))
        .toBe('1px')
      // 大图：投影谱、极值、批注、眉头与来源行都在；线不是涨跌色；信号色只有末端点与批注。
      const big = page.locator('[data-gallery-spark="instrument-big"] svg')
      await big.scrollIntoViewIfNeeded()
      await expect(big.locator('.k-spark-ins-proj')).toHaveCount(1)
      expect(await big.locator('.k-spark-ins-bar').count()).toBeGreaterThan(20)
      await expect(big.locator('.k-spark-ins-now')).toHaveCount(1)
      await expect(big.locator('[data-extreme="max"] text')).toHaveText(/^H \d,\d{3}\.\d\d$/)
      await expect(big.locator('[data-extreme="min"] text')).toHaveText(/^L \d,\d{3}\.\d\d$/)
      await expect(big.locator('[data-annotation] .k-spark-ins-circle')).toHaveCount(1)
      await expect(big.locator('[data-meta="id"]')).toHaveText(/^000300\.XSHG/)
      await expect(big.locator('[data-meta="source"]')).toContainText('SRC / SSE')
      await expect(big.locator('.k-spark-ins-corner')).toHaveCount(1)
      const accentParts = new Set(await signalPainted(big))
      expect([...accentParts].sort()).toEqual(
        ['k-spark-ins-circle', 'k-spark-ins-dot', 'k-spark-ins-lead', 'k-spark-ins-text k-spark-ins-note-text'].sort(),
      )
      const pnl = [await swatch(page, 'var(--pnl-up)'), await swatch(page, 'var(--pnl-down)')]
      expect(pnl).not.toContainEqual(await paint(big.locator('.k-spark-ins-line'), 'stroke'))
      // 投影谱与主图共享纵轴：当前值横线与末端点同一个 y。
      const dotY = Number(await big.locator('.k-spark-ins-dot').getAttribute('cy'))
      expect(Number(await big.locator('.k-spark-ins-now').getAttribute('y1'))).toBeCloseTo(dotY, 1)
      // 实时：走一步，线延伸、投影谱与当前值线跟着最新点。
      const barWidths = () =>
        big.locator('.k-spark-ins-bar').evaluateAll((els) => els.map((el) => (el as SVGElement).style.width).join())
      const before = await barWidths()
      await page.evaluate(() => window.__liveStep?.(1))
      await expect.poll(barWidths).not.toBe(before)
      await expect
        .poll(async () => Number(await big.locator('.k-spark-ins-now').getAttribute('y1')))
        .toBeCloseTo(Number(await big.locator('.k-spark-ins-dot').getAttribute('cy')), 1)
      // 悬停：横竖两条细线，不是只有竖线。
      const box = (await big.boundingBox())!
      await page.mouse.move(box.x + box.width * 0.4, box.y + box.height * 0.5)
      await expect(big.locator('.k-spark-ins-cursor')).toHaveCount(2)
      await expect(big.locator('.k-spark-tip-value')).toHaveText(/^\d,\d{3}\.\d\d$/)
    })

    test('迷你图（look=ascii）：整幅是一个 pre，字符数与列数一致；盲文与点阵字体；实时新列乱码后落定', async ({
      page,
    }) => {
      await open(page, theme, 'sparkline')
      for (const id of ['ascii-blocks-line', 'ascii-blocks', 'ascii-braille']) {
        const root = page.locator(`[data-gallery-spark="${id}"] .k-spark-ascii`)
        await expect(root).toHaveAttribute('role', 'img')
        await expect(root.locator('pre')).toHaveCount(1)
        await expect(root.locator('pre')).toHaveAttribute('aria-hidden', 'true')
        const cols = Number(await root.getAttribute('data-cols'))
        const rows = Number(await root.getAttribute('data-rows'))
        expect(cols).toBeGreaterThan(20)
        const lines = ((await root.locator('pre').textContent()) ?? '').split('\n')
        expect(lines).toHaveLength(rows)
        for (const line of lines) expect(Array.from(line)).toHaveLength(cols)
        // 同色连续字符合并：节点数远少于字符数。
        expect(await root.locator('pre *').count()).toBeLessThan(cols)
      }
      await expect(page.locator('[data-gallery-spark="ascii-blocks-line"] .k-spark-ascii')).toHaveAttribute(
        'data-rows',
        '1',
      )
      expect((await page.locator('[data-gallery-spark="ascii-blocks-line"] pre').textContent()) ?? '').toMatch(
        /^[▁▂▃▄▅▆▇█ ┄]+$/,
      )
      expect((await page.locator('[data-gallery-spark="ascii-braille"] pre').textContent()) ?? '').toMatch(
        /[\u2801-\u28ff]/,
      )
      // 最新一列用信号色，其余是中性墨色。
      const sig = page.locator('[data-gallery-spark="ascii-blocks-line"] pre .is-signal')
      await expect(sig).toHaveCount(1)
      await expect.poll(() => paint(sig, 'color')).toEqual(await swatch(page, 'var(--accent)'))
      // 实时：走一步，新列先乱码（data-scrambling）再落定为目标字形（data-last），列数不变。
      const root = page.locator('[data-gallery-spark="ascii-blocks"] .k-spark-ascii')
      await root.scrollIntoViewIfNeeded()
      const cols = Number(await root.getAttribute('data-cols'))
      await watchAttr(root, 'data-scrambling')
      await page.evaluate(() => window.__liveStep?.(1))
      await expect.poll(() => sawAttr(root)).toBe(true)
      await expect(root).not.toHaveAttribute('data-scrambling', /.*/, { timeout: 2000 })
      // 渲染出来的最新一列（信号色那一列）逐行读出来，等于目标字形。
      const rendered = await root.locator('pre').evaluate((pre) => {
        const rows = [...pre.querySelectorAll('.k-spark-ascii-row')]
        const col = rows
          .map((row) => {
            const mark = row.querySelector('.is-signal')
            return mark ? (row.textContent ?? '').indexOf(mark.textContent ?? '') : -1
          })
          .find((c) => c >= 0)
        return rows.map((row) => (col === undefined ? ' ' : (Array.from(row.textContent ?? '')[col] ?? ' '))).join('')
      })
      // 基准线 ┄ 画在空格的位置上，目标字形里那是空格。
      expect(rendered.replaceAll('┄', ' ')).toBe((await root.getAttribute('data-last')) ?? '')
      const text = ((await root.locator('pre').textContent()) ?? '').split('\n')
      for (const line of text) expect(Array.from(line)).toHaveLength(cols)
    })

    test('MiniChart 迷你行情卡：图标、代码、角标、价格与涨跌幅，走势只画到现在；可点的卡是按钮', async ({ page }) => {
      await open(page, theme, 'mini-chart')
      const up = page.locator('[data-gallery-mini="up"] .k-mini-chart')
      await expect(up.locator('.k-symbol-mark')).toBeVisible()
      await expect(up.locator('.k-mini-symbol')).toHaveText('AAA')
      await expect(up.locator('.k-mini-badge')).toHaveText('D')
      await expect(up.locator('.k-mini-price')).toHaveText('11.80')
      await expect(up.locator('.k-mini-unit')).toHaveText('USD')
      await expect(up.locator('.k-mini-change')).toContainText('+18.00%')
      await expect.poll(() => paint(up.locator('.k-mini-change'), 'color')).toEqual(await swatch(page, 'var(--pnl-up)'))
      await expect(up.locator('svg.k-spark .k-spark-ring')).toHaveCount(1)
      await expect
        .poll(() => paint(up.locator('svg.k-spark .k-spark-line'), 'stroke'))
        .toEqual(await swatch(page, 'var(--pnl-up)'))
      // 涨跌色跟 change 走：跌的卡线是跌色。
      const down = page.locator('[data-gallery-mini="down"] .k-mini-chart')
      await expect
        .poll(() => paint(down.locator('svg.k-spark .k-spark-line'), 'stroke'))
        .toEqual(await swatch(page, 'var(--pnl-down)'))
      // 图高 80：线 2px。
      await expect
        .poll(() => up.locator('svg.k-spark .k-spark-line').evaluate((el) => getComputedStyle(el).strokeWidth))
        .toBe('2px')
      // 没有数据：走势位置只留「—」。
      await expect(page.locator('[data-gallery-mini="empty"] .k-spark-empty')).toHaveText('—')
      // 可点：整张卡是按钮，名字取 labels.card。
      const button = page.getByRole('button', { name: '打开示例乙' })
      await button.click()
      await expect(page.locator('[data-gallery-picked]')).toHaveText('选中：示例乙')
      // 带时间轴的那张（沪深300）：线只画到现在，右边留空。
      const tv = page.locator('[data-gallery-spark="tv-mini"] svg.k-spark')
      const dot = Number(await tv.locator('circle.k-spark-dot').getAttribute('cx'))
      expect(dot).toBeLessThan(Number(await tv.getAttribute('data-plot-right')) - 20)
    })

    test('进度条：填充占轨道的 72%，取不到时不画填充、数换成弱色', async ({ page }) => {
      await open(page, theme, 'gauge-bar')
      const ok = page.locator('[data-gallery-gauge="ok"]')
      const track = (await ok.locator('.k-gauge-track').boundingBox())!
      await expect
        .poll(async () => (await ok.locator('.k-gauge-fill').boundingBox())!.width / track.width, { timeout: 3000 })
        .toBeCloseTo(0.72, 1)
      await expect(ok.locator('.k-gauge-value')).toHaveText('72.00%')
      const missing = page.locator('[data-gallery-gauge="missing"]')
      await expect(missing.locator('.k-gauge-fill')).toHaveCount(0)
      await expect
        .poll(() => paint(missing.locator('.k-gauge-value'), 'color'))
        .toEqual(await swatch(page, 'var(--ink-300)'))
    })

    test('矩形树图：面积按大小，涨的格子是涨色、跌的是跌色，点板块名下钻、点返回回来', async ({ page }) => {
      await open(page, theme, 'treemap')
      const map = page.locator('[data-gallery-treemap]')
      const cells = map.locator('.k-treemap-cell')
      await expect(cells).toHaveCount(5)
      const area = async (name: string) => {
        const box = (await cells.filter({ has: page.getByText(name, { exact: true }) }).boundingBox())!
        return box.width * box.height
      }
      expect(await area('示例 A')).toBeGreaterThan((await area('示例 B')) * 1.5)
      // 示例 A 涨 3.1%：封顶的涨色；示例 D 跌 2.9%：深跌色。
      await expect
        .poll(() => paint(cells.filter({ hasText: '+3.10%' }), 'backgroundColor'))
        .toEqual(await swatch(page, 'color-mix(in srgb, var(--pnl-up) 100%, var(--bg-000))'))
      await expect
        .poll(() => paint(cells.filter({ hasText: '-2.90%' }), 'backgroundColor'))
        .toEqual(await swatch(page, 'color-mix(in srgb, var(--pnl-down) 100%, var(--bg-000))'))
      await expect(map.locator('.k-treemap-legend li')).toHaveCount(7)
      await map.getByRole('button', { name: '板块二' }).click()
      await expect(cells).toHaveCount(2)
      await expect(map.getByRole('button', { name: '板块二' })).toHaveCount(0)
      await map.getByRole('button', { name: '返回全部' }).click()
      await expect(cells).toHaveCount(5)
    })

    test('行内价格标签：涨跌带三角与涨跌色，数字等宽，夹在句子里不换行', async ({ page }) => {
      await open(page, theme, 'price-tag')
      const tags = page.locator('[data-gallery="price-tag"] .k-price-tag')
      const up = tags.nth(0)
      const down = tags.nth(1)
      await expect(up.locator('.k-price-tag-glyph')).toHaveText('▲')
      await expect(down.locator('.k-price-tag-glyph')).toHaveText('▼')
      await expect(tags.nth(2).locator('.k-price-tag-glyph')).toHaveText('')
      await expect
        .poll(() => paint(up.locator('.k-price-tag-change'), 'color'))
        .toEqual(await swatch(page, 'var(--pnl-up)'))
      await expect
        .poll(() => paint(down.locator('.k-price-tag-change'), 'color'))
        .toEqual(await swatch(page, 'var(--pnl-down)'))
      await expect
        .poll(() => up.evaluate((element) => getComputedStyle(element).fontVariantNumeric))
        .toContain('tabular-nums')
      const inline = page.locator('[data-gallery-inline]')
      const tag = (await inline.locator('.k-price-tag').boundingBox())!
      const line = (await inline.boundingBox())!
      expect(tag.height, '标签没折行').toBeLessThan(24)
      expect(tag.y).toBeGreaterThanOrEqual(line.y)
    })

    test('报价卡：可点的整张卡是按钮、悬停换底、点了有反应；一排横向排开且放不下可滚动', async ({ page }) => {
      await open(page, theme, 'quote-card')
      const card = page.locator('[data-gallery-card-link] button')
      await expect(card).toBeVisible()
      const before = await bg(card)
      await card.hover()
      await expect.poll(() => bg(card)).not.toBe(before)
      await card.click()
      await expect(page.locator('[data-gallery-picked]')).toHaveText('选中：示例乙')
      const first = page.locator('[data-gallery-card] .k-quote-card')
      await expect(first.locator('.k-quote-price')).toHaveText('11.80')
      await expect(first.locator('svg.k-spark')).toBeVisible()
      await expect(first.getByRole('meter', { name: '示例当日区间' })).toBeVisible()
      await expect
        .poll(() => paint(first.locator('.k-quote-change'), 'color'))
        .toEqual(await swatch(page, 'var(--pnl-up)'))
      const strip = page.locator('[data-gallery-strip] .k-quote-strip')
      const items = strip.getByRole('listitem')
      await expect(items).toHaveCount(4)
      const ys = await items.evaluateAll((nodes) => nodes.map((node) => Math.round(node.getBoundingClientRect().y)))
      expect(new Set(ys).size, '四张卡在同一行').toBe(1)
      await expect
        .poll(() => strip.evaluate((element) => element.scrollWidth > element.clientWidth), { message: '放不下可滚动' })
        .toBe(true)
    })

    test('区间条：标记停在现价的位置，区间外贴边，没有区间不画标记', async ({ page }) => {
      await open(page, theme, 'range-bar')
      const place = async (id: string) => {
        const bar = page.locator(`[data-gallery-range="${id}"]`)
        const track = (await bar.locator('.k-range-track').boundingBox())!
        const mark = bar.locator('.k-range-mark')
        if ((await mark.count()) === 0) return null
        const at = (await mark.boundingBox())!
        return (at.x + at.width / 2 - track.x) / track.width
      }
      await expect.poll(() => place('mid'), { timeout: 3000 }).toBeCloseTo((11.8 - 9.5) / 3, 1)
      await expect.poll(() => place('edge'), { timeout: 3000 }).toBeCloseTo(1, 1)
      expect(await place('none')).toBeNull()
      const meter = page.locator('[data-gallery-range="mid"]').getByRole('meter', { name: '示例当日区间' })
      await expect(meter).toHaveAttribute('aria-valuenow', '11.8')
      await expect(meter).toContainText('9.5')
      await expect(meter).toContainText('12.5')
    })

    test('评级仪表：五段弧，指针用弹簧转到分数那一段，档位词跟着变', async ({ page }) => {
      await open(page, theme, 'rating-gauge')
      const gauge = page.locator('[data-gallery-rating] .k-rating')
      await expect(gauge.locator('.k-rating-zone')).toHaveCount(5)
      const angle = () =>
        gauge.locator('.k-rating-needle').evaluate((element) => {
          const matrix = new DOMMatrix(getComputedStyle(element).transform)
          return (Math.atan2(matrix.b, matrix.a) * 180) / Math.PI
        })
      await expect(gauge.locator('figcaption')).toHaveText('买入')
      await expect.poll(angle, { timeout: 3000 }).toBeCloseTo(0.3 * 90, 0)
      await page.locator('[data-gallery-score="-1"]').click()
      // 中途：弹簧还在走，指针在两端之间（不是一步到位）。
      const mid = await page.evaluate(
        () =>
          new Promise<number>((resolve) =>
            setTimeout(() => {
              const element = document.querySelector('[data-gallery-rating] .k-rating-needle')!
              const matrix = new DOMMatrix(getComputedStyle(element).transform)
              resolve((Math.atan2(matrix.b, matrix.a) * 180) / Math.PI)
            }, 120),
          ),
      )
      expect(mid).toBeLessThan(0.3 * 90 - 5)
      expect(mid).toBeGreaterThan(-90 + 5)
      await expect.poll(angle, { timeout: 3000 }).toBeCloseTo(-90, 0)
      await expect(gauge.locator('figcaption')).toHaveText('强烈卖出')
      await expect(gauge).toHaveAccessibleName('示例评级: 强烈卖出')
      await expect(gauge.locator('.k-rating-zone.is-active')).toHaveCount(1)
      await expect(gauge.locator('.k-rating-extra')).toContainText('买入 13')
    })

    test('分组页签行情表：页签换组、空组写说明、行可点（鼠标与回车）、价格列右对齐', async ({ page }) => {
      await open(page, theme, 'quote-table')
      const table = page.locator('[data-gallery-qtable]')
      await expect(table.getByRole('tab')).toHaveCount(3)
      await expect(table.getByRole('tab', { name: '示例一组' })).toHaveAttribute('data-state', 'active')
      const rows = table.locator('tbody tr')
      await expect(rows).toHaveCount(3)
      const rights = await table
        .locator('tbody td.is-num:not(.k-quote-rows-change)')
        .evaluateAll((nodes) => nodes.map((node) => Math.round(node.getBoundingClientRect().right)))
      expect(new Set(rights).size, '价格列右缘对齐').toBe(1)
      await expect
        .poll(() => paint(rows.nth(0).locator('.k-quote-rows-change'), 'color'))
        .toEqual(await swatch(page, 'var(--pnl-up)'))
      await expect
        .poll(() => paint(rows.nth(1).locator('.k-quote-rows-change'), 'color'))
        .toEqual(await swatch(page, 'var(--pnl-down)'))
      await rows.nth(1).click()
      await expect(page.locator('[data-gallery-opened]')).toHaveText('点开：示例乙')
      await rows.nth(2).focus()
      await page.keyboard.press('Enter')
      await expect(page.locator('[data-gallery-opened]')).toHaveText('点开：示例丙')
      await table.getByRole('tab', { name: '示例二组' }).click()
      await expect(table.locator('tbody tr')).toHaveCount(1)
      await expect(table.getByText('示例丁')).toBeVisible()
      await table.getByRole('tab', { name: '空的一组' }).click()
      await expect(table.getByText('这一组没有品种')).toBeVisible()
    })
  })
}

test('两个主题下的颜色真的不同：同一个主按钮，底色跟着主题的 token 走', async ({ page }) => {
  const colors: string[] = []
  for (const theme of THEMES) {
    await open(page, theme)
    colors.push(await bg(section(page, 'button').getByRole('button', { name: 'primary', exact: true })))
  }
  expect(colors[0]).not.toBe(colors[1])
})

test('密度演示里的主按钮：Graphite 的底是 Graphite 的 --ink-100，与 Console 不同（#1943）', async ({ page }) => {
  const colors: string[] = []
  for (const theme of ['console', 'graphite'] as const) {
    await open(page, theme)
    const button = section(page, 'button')
      .locator('[data-density="medium"]')
      .getByRole('button', { name: 'primary · medium' })
    const ink = await token(page, '--ink-100')
    await expect(button).toHaveCSS('background-color', ink)
    colors.push(ink)
  }
  expect(colors[0]).not.toBe(colors[1])
})

test('不带 ?theme= 是 Graphite；页头切到 Console，主按钮底色跟着变，地址带上 theme=console，切回去地址的 theme 去掉', async ({
  page,
}) => {
  await page.goto('/#/button')
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'graphite')
  const primary = section(page, 'button').getByRole('button', { name: 'primary', exact: true })
  const graphite = await bg(primary)
  // 顶栏的主题是下拉（combobox「主题」），不再是一组按钮。
  const themes = page.getByRole('combobox', { name: '主题' })
  await themes.click()
  await page.getByRole('option', { name: 'Console' }).click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'console')
  await expect.poll(() => bg(primary)).not.toBe(graphite)
  await expect(page).toHaveURL(/theme=console/)
  await themes.click()
  await page.getByRole('option', { name: 'Graphite' }).click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'graphite')
  await expect(page).not.toHaveURL(/theme=/)
})

test('文档站默认就是 Graphite：不带 ?theme= 时页面底色与内容面板底色是 Graphite 的 bg-000 与 bg-100（#1775）', async ({
  page,
}) => {
  await page.goto('/#/button')
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'graphite')
  // Graphite 的 bg-000 = #000000、bg-100 = #070707；Console 的 bg-100 是 #141311，默认要是 Console 就会红。
  // 目录栏现在直接贴着页面底（透明），bg-100 落在右边的内容面板上。
  await expect(page.locator('html')).toHaveCSS('background-color', 'rgb(0, 0, 0)')
  await expect(page.getByRole('navigation', { name: '文档目录' })).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)')
  await expect(page.locator('.gal-main')).toHaveCSS('background-color', 'rgb(7, 7, 7)')
  expect(await token(page, '--bg-100')).toBe('rgb(7, 7, 7)')
})

test('目录：按类分组；直接打开 #/<件名>；点链接换页、后退回上一页；没有的页写原因', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveURL(/#\/button$/)
  const nav = page.getByRole('navigation', { name: '文档目录' })
  // 组名：入门 / 基础 / Token 与主题 在组件各组之前，模式、总览在后面（foundations.tsx 带样式与 JSX，测试里不引，写死组名）。
  const titles = [
    '入门',
    '基础',
    'Token 与主题',
    ...GROUPS.filter((item) => PAGES.some((doc) => doc.group === item.id)).map((item) => item.title),
    '模式',
    '总览',
  ]
  for (const title of titles) await expect(nav.getByRole('heading', { name: title, exact: true })).toBeVisible()
  // 目录里每一页都有链接，当前页标 aria-current。
  for (const { id } of PAGES) await expect(navLink(page, id)).toBeVisible()
  await expect(navLink(page, 'button')).toHaveAttribute('aria-current', 'page')
  await show(page, 'slider')
  await expect(page).toHaveURL(/#\/slider$/)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Slider 滑块')
  await expect(navLink(page, 'slider')).toHaveAttribute('aria-current', 'page')
  await page.goBack()
  await expect(page).toHaveURL(/#\/button$/)
  await expect(section(page, 'button')).toBeVisible()
  await page.goto('/#/nope')
  await expect(page.getByRole('alert')).toContainText('没有「nope」这一页')
})

test('每一页写着属性表、组成，有键盘操作的写键盘', async ({ page }) => {
  // 每页要切三个页签，页数过百，默认 30 秒不够。
  test.setTimeout(180_000)
  for (const doc of PAGES) {
    await page.goto(`/#/${doc.id}`)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(doc.title)
    const guide = guidanceOf(doc.id)
    // 怎么用：什么时候用 / 别用、状态、组成（别用 = 指南里的 avoid + 登记的 donts）。
    await docTab(page, '怎么用')
    await expect(page.getByRole('heading', { name: '组成' })).toBeVisible()
    await expect(page.getByRole('heading', { name: '状态', exact: true })).toBeVisible()
    await expect(page.getByRole('heading', { name: '什么时候用', exact: true })).toBeVisible()
    await expect(page.getByRole('heading', { name: '什么时候别用', exact: true })).toBeVisible()
    await expect(page.locator('.gal-list li')).toHaveCount(
      (guide.use?.length ?? 0) + (guide.avoid?.length ?? 0) + doc.donts.length + doc.states.length,
    )
    // 无障碍：键盘一节每页都有；有键盘操作的列成表（一键一行），没有的写明没有。
    await docTab(page, '无障碍')
    await expect(page.getByRole('heading', { name: '键盘' })).toBeVisible()
    await expect(page.locator('.gal-keys tr')).toHaveCount(doc.keys.length)
    await expect(page.getByText('没有键盘交互')).toHaveCount(doc.keys.length > 0 ? 0 : 1)
    // 属性：每个导出各一张表。
    await docTab(page, '属性')
    await expect(page.getByRole('heading', { name: '属性', exact: true, level: 2 })).toBeVisible()
  }
})

for (const theme of THEMES) {
  test(`覆盖页（${theme}）：目录里单列「总览」，五个归属的「已做 / 总数」与映射一致，每张卡一行、点名可见`, async ({
    page,
  }) => {
    await page.goto(`/?theme=${theme}#/coverage`)
    const nav = page.getByRole('navigation', { name: '文档目录' })
    await expect(nav.getByRole('heading', { name: '总览' })).toBeVisible()
    await expect(navLink(page, 'coverage')).toHaveAttribute('aria-current', 'page')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('覆盖')
    const map = coverageMap as CoverageMap
    const summary = page.getByTestId('coverage-summary')
    for (const item of summarize(map))
      await expect(summary.locator(`tr[data-kind="${item.kind}"] [data-cell=ratio]`)).toHaveText(
        `${item.done} / ${item.total}`,
      )
    const total = Object.keys(map.cards).length
    await expect(page.locator('[data-card]')).toHaveCount(total)
    // 一张具体的卡：落点、状态、备注都写在行里；部分的卡写着缺什么。
    // 部分的卡写着缺什么：取第一张状态是「部分」的卡（数据表、面板壳先后做完过，不写死哪一张）。
    const row = page.locator('[data-card][data-status="部分"]').first()
    await expect(row).toContainText(/\S/)
    await expect(row).toBeVisible()
    await navLink(page, 'button').click()
    await expect(section(page, 'button')).toBeVisible()
  })
}

// 面板壳、状态栏、分割线、工作区标签（#1901）。
for (const theme of THEMES) {
  test(`PanelFrame（${theme}）：焦点面板有四角括号且标题提亮；折叠只剩标题栏；未连接与加载的内容区不画假数据`, async ({
    page,
  }) => {
    await open(page, theme, 'panel-frame')
    const area = section(page, 'panel-frame')
    const chart = area.getByRole('region', { name: 'Chart panel' })
    await expect(chart.locator('.k-panel-brackets i')).toHaveCount(4)
    for (const corner of await chart.locator('.k-panel-brackets i').all()) await expect(corner).toBeVisible()
    await expect(chart.getByRole('heading', { name: 'Chart' })).toHaveCSS('color', await token(page, '--ink-100'))
    await expect(chart.getByRole('img', { name: 'Link group A' })).toBeVisible()
    // 点一下切走焦点：括号没了，标题退后
    await area.getByTestId('frame-focus').click({ position: { x: 100, y: 120 } })
    await expect(chart.locator('.k-panel-brackets')).toHaveCount(0)
    await expect(chart.getByRole('heading', { name: 'Chart' })).toHaveCSS('color', await token(page, '--ink-300'))
    // 折叠
    const watch = area.getByRole('region', { name: 'Collapsible panel' })
    const body = watch.getByText('Collapse leaves only the title bar.')
    await expect(body).toBeVisible()
    const full = (await watch.boundingBox())!.height
    await watch.getByRole('button', { name: 'Collapse' }).click()
    await expect(body).toBeHidden()
    await expect(watch.getByRole('button', { name: 'Expand' })).toHaveAttribute('aria-expanded', 'false')
    expect((await watch.boundingBox())!.height).toBeLessThan(full / 2)
    await watch.getByRole('button', { name: 'Expand' }).click()
    await expect(body).toBeVisible()
    // 状态：未连接是空态，加载是骨架
    await expect(area.getByRole('region', { name: 'Orders panel' }).getByText('Not connected')).toBeVisible()
    await expect(area.getByRole('region', { name: 'Trades panel' }).getByRole('status')).toHaveAttribute(
      'aria-busy',
      'true',
    )
  })

  test(`StatusBar（${theme}）：项由数据声明；变窄时先收优先级低的进「…」，实盘项不收；可点的项触发`, async ({
    page,
  }) => {
    await open(page, theme, 'status-bar')
    const area = section(page, 'status-bar')
    const bar = area.getByRole('group', { name: 'Status bar' })
    const item = (name: string) => bar.locator(`.k-status-item:not(.k-status-ruler *)`).filter({ hasText: name })
    for (const name of ['QUOTE', 'EXEC', 'LIVE', 'LINK', 'MODE']) await expect(item(name)).toBeVisible()
    await expect(bar.getByRole('button', { name: 'More status items' })).toHaveCount(0)
    // 条高 28 含 1px 上边线（border-box），项撑满边线以内，所以是 27。
    expect((await item('LIVE').boundingBox())!.height).toBe(await bar.evaluate((node) => node.clientHeight))
    await expect(item('LIVE')).toHaveCSS('box-shadow', new RegExp(`inset`))
    await area.getByRole('button', { name: '260', exact: true }).click()
    const more = bar.getByRole('button', { name: 'More status items' })
    await expect(more).toBeVisible()
    await expect(item('MODE')).toHaveCount(0)
    await expect(item('LIVE')).toBeVisible()
    await more.click()
    await expect(page.locator('.k-status-pop').getByText('QUIET')).toBeVisible()
    await page.keyboard.press('Escape')
    // 条里放得下的项都没溢出条
    const box = (await bar.boundingBox())!
    for (const shown of await bar.locator('.k-status-item:not(.k-status-ruler *)').all()) {
      const rect = (await shown.boundingBox())!
      expect(rect.x + rect.width).toBeLessThanOrEqual(box.x + box.width + 1)
    }
  })

  test(`Splitter（${theme}）：方向键挪、Shift 加速、Home / End 到两端、Enter 与双击复位、拖动改比例`, async ({
    page,
  }) => {
    await open(page, theme, 'splitter')
    const area = section(page, 'splitter')
    const line = area.getByRole('separator', { name: 'Resize panes' })
    const now = async () => Number(await line.getAttribute('aria-valuenow'))
    await expect(line).toHaveAttribute('aria-orientation', 'vertical')
    await expect(line).toHaveAttribute('aria-valuetext', 'First pane 40%')
    await expect(line).toHaveCSS('cursor', 'col-resize')
    await line.focus()
    const start = await now()
    await page.keyboard.press('ArrowRight')
    await expect.poll(now).toBeGreaterThan(start)
    const one = await now()
    await page.keyboard.press('Shift+ArrowRight')
    await expect.poll(now).toBeGreaterThan(one + 3)
    await page.keyboard.press('ArrowLeft')
    await page.keyboard.press('Home')
    await expect.poll(now).toBe(Number(await line.getAttribute('aria-valuemin')))
    await expect.poll(now).toBeLessThan(20)
    await page.keyboard.press('End')
    await expect.poll(now).toBe(Number(await line.getAttribute('aria-valuemax')))
    await expect.poll(now).toBeGreaterThan(80)
    await page.keyboard.press('Enter')
    await expect.poll(now).toBe(50)
    // 第一块的像素宽度跟着比例走
    const grid = area.getByTestId('splitter-demo')
    const first = grid.locator('> div').first()
    const total = (await grid.boundingBox())!.width - 8
    expect((await first.boundingBox())!.width).toBeCloseTo(total / 2, 0)
    // 拖动：线挪到别处，松手提交
    const box = (await line.boundingBox())!
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
    await page.mouse.down()
    await expect(line).toHaveAttribute('data-dragging', '')
    await expect(line).toHaveCSS('cursor', 'col-resize')
    await page.mouse.move(box.x - 100, box.y + 20, { steps: 6 })
    await page.mouse.up()
    await expect(line).not.toHaveAttribute('data-dragging', '')
    await expect.poll(now).toBeLessThan(40)
    await expect.poll(now).toBeGreaterThan(20)
    await line.dblclick()
    await expect.poll(now).toBe(50)
  })

  test(`WorkspaceTabs（${theme}）：点击切换、当前标签的亮线跟着走、方向键只移焦点、Alt+方向键排序、F2 改名、放不下的收进「…」且当前标签可见`, async ({
    page,
  }) => {
    await open(page, theme, 'workspace-tabs')
    const area = section(page, 'workspace-tabs')
    const bar = area.getByRole('tablist', { name: 'Workspaces' })
    const tab = (name: string) => bar.getByRole('tab', { name })
    const mark = bar.locator('.k-wtabs-mark')
    await expect(tab('Desk')).toHaveAttribute('aria-selected', 'true')
    await expect(tab('Desk')).toHaveCSS('background-color', await token(page, '--bg-000'))
    await expect(mark).toHaveCSS('background-color', await token(page, '--ink-100'))
    const under = async (name: string) => {
      const [m, t] = await Promise.all([mark.boundingBox(), tab(name).boundingBox()])
      return Math.abs(m!.x - t!.x) < 1 && Math.abs(m!.width - t!.width) < 1
    }
    await expect.poll(() => under('Desk')).toBe(true)
    await tab('Lab').click()
    await expect(tab('Lab')).toHaveAttribute('aria-selected', 'true')
    await expect.poll(() => under('Lab')).toBe(true)
    // 键盘：箭头移焦点不切换，Enter 才切换
    await page.keyboard.press('ArrowLeft')
    await expect(tab('Desk')).toBeFocused()
    await expect(tab('Lab')).toHaveAttribute('aria-selected', 'true')
    await page.keyboard.press('Enter')
    await expect(tab('Desk')).toHaveAttribute('aria-selected', 'true')
    await page.keyboard.press('Home')
    await expect(tab('Overview')).toBeFocused()
    // 排序：Alt+→ 把 Overview 挪到 Desk 后面
    await page.keyboard.press('Alt+ArrowRight')
    const names = async () =>
      await bar
        .getByRole('tab')
        .evaluateAll((nodes) => nodes.map((node) => node.querySelector('.k-wtab-name')!.textContent))
    await expect.poll(async () => (await names()).slice(0, 2)).toEqual(['Desk', 'Overview'])
    await expect(tab('Overview')).toBeFocused()
    // 改名入口
    await page.keyboard.press('F2')
    await expect(area.getByTestId('tabs-rename')).toHaveText('Rename requested: overview')
    // 溢出：条放不下的标签收进「…」下拉，当前标签始终可见，不横向滚动
    const more = area.getByRole('button', { name: 'More workspaces' })
    await expect(more).toBeVisible()
    await expect.poll(() => bar.evaluate((node) => node.scrollWidth <= node.clientWidth)).toBe(true)
    const create = area.getByRole('button', { name: 'New workspace' })
    for (let i = 0; i < 3; i++) await create.click()
    // 点下拉里的项：它切成当前，并且进到条上（与最后一个可见的换位）
    await more.click()
    const item = page.getByRole('menuitem', { name: 'Workspace 8' })
    await expect(item).toBeVisible()
    await item.click()
    await expect(tab('Workspace 8')).toHaveAttribute('aria-selected', 'true')
    await expect(tab('Workspace 8')).toBeInViewport()
    // 条上的标签不超出条的右边界，「…」与「+」都在条内
    const box = (await bar.boundingBox())!
    for (const shown of await bar.getByRole('tab').all()) {
      const rect = (await shown.boundingBox())!
      expect(rect.x + rect.width).toBeLessThanOrEqual(box.x + box.width + 1)
    }
    // ← → 只在可见标签间走
    await tab('Workspace 8').focus()
    await page.keyboard.press('ArrowRight')
    await expect(tab('Workspace 8')).toBeFocused()
  })

  test(`新闻流（${theme}）：两种排法、频道与来源与搜索筛选、相对与绝对时间、新消息先计数点了才插入、品种胶囊回调`, async ({
    page,
  }) => {
    await open(page, theme, 'news-feed')
    const doc = section(page, 'news-feed')
    const frame = doc.getByTestId('news-frame')
    const rows = frame.locator('.k-news-item')
    // 列表：六条，新的在前；时间是相对的，悬停属性里是绝对时间；重要条目有琥珀标记。
    await expect(rows).toHaveCount(6)
    await expect(rows.first().locator('.k-news-title')).toContainText('星河锂业披露')
    await expect(rows.first().locator('time')).toHaveText('3 分钟前')
    await expect(rows.first().locator('time')).toHaveAttribute('title', '2026-11-15 09:27 UTC')
    const flag = rows.first().locator('.k-news-flag')
    await expect(flag).toBeVisible()
    await expect.poll(() => bg(flag)).toBe(await token(page, '--signal-amber'))
    await expect(rows.nth(1).locator('.k-news-flag')).toHaveCount(0)
    // 列表里一行一条，行高小于 60；卡片里有摘要。
    expect((await rows.first().boundingBox())!.height).toBeLessThan(60)
    await expect(frame.locator('.k-news-summary')).toHaveCount(0)
    const cards = doc.getByTestId('news-cards')
    await expect(cards.locator('.k-news-summary').first()).toBeVisible()
    await expect
      .poll(() =>
        cards
          .locator('.k-news-summary')
          .first()
          .evaluate((n) => getComputedStyle(n).webkitLineClamp),
      )
      .toBe('2')
    const first = (await cards.locator('.k-news-item').nth(0).boundingBox())!
    const second = (await cards.locator('.k-news-item').nth(1).boundingBox())!
    expect(Math.abs(first.y - second.y)).toBeLessThan(2) // 卡片并排
    // 切排法：列表里点「卡片」出摘要。
    await frame.getByRole('button', { name: '卡片' }).click()
    await expect(frame.locator('.k-news-summary').first()).toBeVisible()
    await frame.getByRole('button', { name: '列表' }).click()
    // 频道、来源、搜索。
    await frame.getByRole('button', { name: '要闻' }).click()
    await expect(rows).toHaveCount(3)
    await frame.getByRole('button', { name: '演示研究台' }).click()
    await expect(rows).toHaveCount(1)
    await frame.getByRole('button', { name: '清除来源筛选' }).click()
    await frame.getByRole('button', { name: '全部' }).click()
    await frame.getByRole('searchbox', { name: '搜索关键词' }).fill('海岚')
    await expect(rows).toHaveCount(1)
    await frame.getByRole('searchbox', { name: '搜索关键词' }).fill('不存在的词')
    await expect(frame.locator('.k-news-empty')).toHaveText('没有符合筛选的新闻')
    await frame.getByRole('searchbox', { name: '搜索关键词' }).fill('')
    // 暂停后新消息只计数，点了才插入、在最前。
    await frame.getByRole('button', { name: '暂停' }).click()
    await expect(frame.getByRole('button', { name: '继续' })).toHaveAttribute('aria-pressed', 'true')
    await doc.getByTestId('news-push').click()
    await expect(frame.getByTestId('news-new')).toHaveText('1 条新消息')
    await expect(rows).toHaveCount(6)
    await frame.getByTestId('news-new').click()
    await expect(rows).toHaveCount(7)
    await expect(rows.first().locator('.k-news-title')).toContainText('演示快讯 7')
    await expect(frame.getByTestId('news-new')).toHaveCount(0)
    // 继续后在顶部，新条目直接插入。
    await frame.getByRole('button', { name: '继续' }).click()
    await doc.getByTestId('news-push').click()
    await expect(rows).toHaveCount(8)
    await expect(frame.getByTestId('news-new')).toHaveCount(0)
    // 快捷操作：悬停出按钮，点「打开图表」回调；右键出同一份菜单；没有品种的条目没有按钮。
    const withSymbol = rows.nth(3)
    await withSymbol.hover()
    const bar = withSymbol.locator('.k-row-actions')
    await expect.poll(() => bar.evaluate((n) => getComputedStyle(n).opacity)).toBe('1')
    await bar.getByRole('button', { name: '打开图表' }).click()
    await expect(doc).toContainText('点品种胶囊：图表 ')
    await withSymbol.click({ button: 'right' })
    await expect(page.getByRole('menuitem', { name: '复制代码' })).toBeVisible()
    await page.getByRole('menuitem', { name: '复制代码' }).click()
    await expect(doc).toContainText('点品种胶囊：复制 ')
    await expect(frame.locator('.k-news-item:not(:has(.k-news-symbol)) .k-row-actions')).toHaveCount(0)
    // 点品种胶囊回调。
    await rows.nth(3).locator('.k-news-symbol').first().click()
    await expect(doc).toContainText('点品种胶囊：600')
  })

  test(`策略报告（${theme}）：页签、关键读数、多空切换、三列指标表、分布与连续条、交易列表展开、属性、空态`, async ({
    page,
  }) => {
    await open(page, theme, 'strategy-report')
    const doc = section(page, 'strategy-report')
    const frame = doc.getByTestId('report-frame')
    const report = frame.locator('.k-sr')
    // 概览：七个读数都有值，净利润带符号，买入持有那行在净利润下面，权益曲线画出来。
    const kpis = frame.locator('.k-sr-kpi')
    await expect(kpis).toHaveCount(7)
    for (const key of ['netProfit', 'totalReturn', 'maxDrawdown', 'winRate', 'payoffRatio', 'tradeCount', 'sharpe'])
      await expect(frame.locator(`.k-sr-kpi[data-metric="${key}"] .k-sr-kpi-value`)).not.toHaveText(/^\s*—?\s*$/)
    await expect(frame.locator('.k-sr-kpi[data-metric="tradeCount"] .k-sr-kpi-value')).toHaveText('140')
    await expect(frame.locator('[data-slot="strategy-report-buyhold"]')).toContainText('买入持有')
    await expect(frame.locator('[data-slot="equity-curve"]')).toBeVisible()
    expect((await frame.locator('[data-slot="equity-curve"]').boundingBox())!.height).toBeGreaterThan(180)
    // 页签行与小标。
    await expect(frame.getByRole('tab', { name: '概览' })).toHaveAttribute('data-state', 'active')
    await expect(frame.locator('.k-sr-badge')).toHaveText('演示数据')
    // 多空切换：交易次数变，读数跟着。
    const all = Number(await frame.locator('.k-sr-kpi[data-metric="tradeCount"] .k-sr-kpi-value').innerText())
    await frame.getByRole('group', { name: '多空' }).getByRole('button', { name: '多', exact: true }).click()
    await expect(report).toHaveAttribute('data-side', 'long')
    await expect
      .poll(async () => Number(await frame.locator('.k-sr-kpi[data-metric="tradeCount"] .k-sr-kpi-value').innerText()))
      .toBeLessThan(all)
    const long = Number(await frame.locator('.k-sr-kpi[data-metric="tradeCount"] .k-sr-kpi-value').innerText())
    await frame.getByRole('group', { name: '多空' }).getByRole('button', { name: '空', exact: true }).click()
    await expect
      .poll(async () => Number(await frame.locator('.k-sr-kpi[data-metric="tradeCount"] .k-sr-kpi-value').innerText()))
      .toBe(all - long)
    await frame.getByRole('group', { name: '多空' }).getByRole('button', { name: '全部' }).click()
    // 绩效：三列并排，多 + 空 = 全部；当前列加亮；净利润的字带涨跌色。
    await frame.getByRole('tab', { name: '绩效' }).click()
    const row = (key: string) => frame.locator(`.k-sr-table tr[data-metric="${key}"]`)
    const cell = (key: string, side: string) => row(key).locator(`td[data-side="${side}"]`)
    await expect(frame.locator('.k-sr-table thead th[data-side]')).toHaveText(['全部', '多', '空'])
    const n = async (side: string) => Number(await cell('tradeCount', side).innerText())
    expect((await n('long')) + (await n('short'))).toBe(await n('all'))
    await expect(cell('tradeCount', 'all')).toHaveAttribute('data-active', '')
    await expect(cell('tradeCount', 'long')).not.toHaveAttribute('data-active', '')
    await expect(row('winRate')).toBeVisible()
    await expect(cell('netProfit', 'all').locator('[data-tone]')).toHaveCSS('color', await token(page, '--pnl-up'))
    // 风险比率：夏普有值，最大回撤是负的。
    await frame.getByRole('tab', { name: '风险比率' }).click()
    await expect(row('sharpe').locator('td[data-side="all"]')).not.toHaveText('—')
    await expect(row('maxDrawdown').locator('td[data-side="all"]')).toHaveText(/^-/)
    // 交易分析：两张直方图的柱数合计 = 笔数，连续条一笔一格，盈亏分布里涨跌两色的面。
    await frame.getByRole('tab', { name: '交易分析' }).click()
    const counts = async (slot: string) =>
      (
        await frame
          .locator(`[data-slot="${slot}"] .k-sr-bar`)
          .evaluateAll((els) => els.map((e) => Number(e.getAttribute('data-count'))))
      ).reduce((a, b) => a + b, 0)
    expect(await counts('strategy-report-pnl-hist')).toBe(all)
    expect(await counts('strategy-report-duration-hist')).toBe(all)
    await expect(frame.locator('.k-sr-streak')).toHaveCount(all)
    const upBar = frame.locator('[data-slot="strategy-report-pnl-hist"] .k-sr-bar[data-tone="up"]').first()
    const downBar = frame.locator('[data-slot="strategy-report-pnl-hist"] .k-sr-bar[data-tone="down"]').first()
    expect(await upBar.evaluate((e) => getComputedStyle(e).fill)).toBe(await token(page, '--div-pos-200'))
    expect(await downBar.evaluate((e) => getComputedStyle(e).fill)).toBe(await token(page, '--div-neg-200'))
    await expect(frame.locator('.k-sr-facts [data-metric="maxConsecLosses"] dd')).not.toHaveText('0')
    // 交易列表：140 行（虚拟滚动只画一部分），点行前先展开，展开出进出场信号与收益率。
    await frame.getByRole('tab', { name: '交易列表' }).click()
    const grid = frame.getByRole('treegrid', { name: '交易列表' })
    await expect(grid).toBeVisible()
    await expect(grid.getByRole('columnheader', { name: '累计盈亏' })).toBeVisible()
    const first = grid.getByRole('row').nth(1)
    await expect(first).toContainText('140')
    await expect(first).toHaveAttribute('aria-expanded', 'false')
    await first.click()
    await expect(first).toHaveAttribute('aria-expanded', 'true')
    await expect(frame.locator('[data-slot="strategy-report-detail"]').first()).toContainText('进场信号')
    await expect(frame.locator('[data-slot="strategy-report-detail"]').first()).toContainText('持仓时长')
    await first.click()
    await expect(first).toHaveAttribute('aria-expanded', 'false')
    await expect(frame.locator('[data-slot="strategy-report-detail"]')).toHaveCount(0)
    // 属性：两组键值。
    await frame.getByRole('tab', { name: '属性' }).click()
    await expect(frame.locator('.k-sr-prop-group')).toHaveCount(2)
    await expect(frame.locator('.k-sr-prop-group dt', { hasText: '初始资金' })).toBeVisible()
    // 空态。
    await expect(doc.getByTestId('report-empty').locator('.k-sr-empty')).toHaveText('没有交易')
  })

  test(`参数优化散点图（${theme}）：色阶按目标值、最优点标环、点选读数、键盘走点、跳到最优、表格视图`, async ({
    page,
  }) => {
    await open(page, theme, 'param-scatter')
    const chart = section(page, 'param-scatter').locator('[data-gallery-pscatter="main"]')
    const dots = chart.locator('.k-pscatter-dot')
    await expect(dots).toHaveCount(120)
    // 目标值跨过 0：发散阶，正侧偏绿、负侧偏红，中间灰；没有结果的点是空心。
    await expect(chart.locator('.k-pscatter')).toHaveAttribute('data-ramp', 'diverging')
    const fills = await dots.evaluateAll((els) =>
      els.map((e) => ({
        id: e.getAttribute('data-id'),
        empty: e.hasAttribute('data-empty'),
        fill: getComputedStyle(e).fill,
      })),
    )
    expect(fills.some((f) => f.empty)).toBe(true)
    expect(new Set(fills.filter((f) => !f.empty).map((f) => f.fill)).size).toBeGreaterThan(8)
    expect(await dots.first().evaluate((e) => getComputedStyle(e).fill)).not.toBe('none')
    // 最优点：琥珀环，只有一个，读屏名里有「最优」。
    const best = chart.locator('.k-pscatter-dot[data-best]')
    await expect(best).toHaveCount(1)
    await expect(best).toHaveAttribute('aria-label', /最优/)
    expect(await best.evaluate((e) => getComputedStyle(e).stroke)).toBe(await token(page, '--signal-amber'))
    // 色条与读数区。
    await expect(chart.locator('[data-slot="param-scatter-legend"]')).toContainText('夏普比率')
    await expect(chart.locator('[data-slot="param-scatter-readout"]')).toHaveText('点一个点，看这组参数')
    // 点选：读数写两个参数与目标值，选中的点白环。
    const pick = chart.locator('.k-pscatter-dot[data-id="f24-s80"]')
    await pick.click()
    await expect(pick).toHaveAttribute('data-selected', '')
    const readout = chart.locator('[data-slot="param-scatter-readout"]')
    await expect(readout).toContainText('快线周期')
    await expect(readout).toContainText('24')
    await expect(readout).toContainText('80')
    await expect(readout).toContainText('夏普比率')
    // 键盘：聚焦后右键走到右边相邻的点，Enter 选中。
    await pick.focus()
    const before = await pick.evaluate((e) => Number(e.getAttribute('cx')))
    await page.keyboard.press('ArrowRight')
    const focused = page.locator('.k-pscatter-dot:focus')
    await expect(focused).toHaveCount(1)
    expect(await focused.evaluate((e) => Number(e.getAttribute('cx')))).toBeGreaterThan(before)
    await page.keyboard.press('Enter')
    await expect(focused).toHaveAttribute('data-selected', '')
    // 跳到最优。
    await chart.getByRole('button', { name: '跳到最优' }).click()
    await expect(best).toHaveAttribute('data-selected', '')
    await expect(readout).toContainText('最优')
    await expect(chart.getByRole('button', { name: '跳到最优' })).toHaveCount(0)
    // 表格视图：同一份数据写成表，最优标在第一列。
    await chart.getByRole('button', { name: '表格视图' }).click()
    await expect(chart.locator('[data-slot="param-scatter-table"]')).toBeVisible()
    await expect(chart.locator('[data-slot="param-scatter-table"]')).toHaveAttribute('data-rows', '120')
    await expect(chart.locator('[data-slot="param-scatter-table"]')).toContainText('f8-s40')
  })

  test(`资金流向桑基图（${theme}）：节点与链路、斜纹重估、悬停读数、点节点钉住上下游、键盘走、开关、表格视图、有环`, async ({
    page,
  }) => {
    await open(page, theme, 'flow-sankey')
    const chart = section(page, 'flow-sankey').locator('[data-gallery-flow="main"]')
    const nodes = chart.locator('[data-slot="flow-node"]')
    const rect = (id: string) => chart.locator(`[data-slot="flow-node"][data-id="${id}"] rect`)
    const links = chart.locator('[data-slot="flow-link"]')
    await expect(nodes).toHaveCount(16)
    await expect(links).toHaveCount(26)
    // 交易流量是中性灰的实色带，价格重估是斜纹（图案描边），两者带宽都按值画出来。
    const flow = chart.locator('[data-slot="flow-link"][data-kind="flow"]')
    const reval = chart.locator('[data-slot="flow-link"][data-kind="revaluation"]')
    await expect(flow).toHaveCount(24)
    await expect(reval).toHaveCount(2)
    expect(await colorAt(page, flow.first(), 'stroke')).toEqual(await rgba(page, await token(page, '--ink-300')))
    expect(await reval.first().evaluate((e) => getComputedStyle(e).stroke)).toMatch(/^url\(/)
    expect(parseFloat(await flow.first().evaluate((e) => getComputedStyle(e).strokeWidth))).toBeGreaterThan(2)
    expect((await rect('assets').boundingBox())!.height).toBeGreaterThan(15)
    // 开关是中性灰（按下是 bg-300），不是橙。
    expect(await colorAt(page, chart.getByRole('button', { name: '显示价格重估' }), 'background-color')).toEqual(
      await rgba(page, await token(page, '--bg-300')),
    )
    await expect(chart.locator('[data-slot="flow-legend"]')).toContainText('交易流量')
    await expect(chart.locator('[data-slot="flow-legend"]')).toContainText('价格重估')
    await expect(chart.locator('.k-fsk-head')).toHaveText(['来源', '通道', '用途', '受益方'])
    expect(await colorAt(page, rect('assets'), 'fill')).toEqual(await rgba(page, await token(page, '--ink-300')))
    // 悬停节点：读数写流入、流出、占总量（只算交易流量），上游与下游亮，别的压暗。
    await rect('assets').hover()
    const tip = chart.locator('[data-slot="lcd-tooltip"]')
    await expect(tip).toBeVisible()
    await expect(tip).toContainText('资产配置')
    await expect(tip).toContainText('流入')
    await expect(tip).toContainText('170')
    await expect(tip).toContainText('23.3%')
    // 读数不压住被悬停节点的标签。
    const tipBox = (await tip.boundingBox())!
    const labelBox = (await chart.locator('[data-slot="flow-node"][data-id="assets"] text').boundingBox())!
    expect(
      tipBox.x < labelBox.x + labelBox.width &&
        labelBox.x < tipBox.x + tipBox.width &&
        tipBox.y < labelBox.y + labelBox.height &&
        labelBox.y < tipBox.y + tipBox.height,
    ).toBe(false)
    await expect(tip).toContainText('重估（出）')
    await expect(rect('nonbank')).toHaveAttribute('data-lit', '')
    await expect(rect('foreign')).toHaveAttribute('data-lit', '')
    await expect(rect('fin')).toHaveAttribute('data-lit', '')
    await expect(rect('treasury')).toHaveAttribute('data-dim', '')
    expect(await colorAt(page, rect('assets'), 'fill')).toEqual(await rgba(page, await token(page, '--ink-100')))
    await page.mouse.move(2, 2)
    await expect(tip).toHaveCount(0)
    await expect(chart.locator('[data-dim]')).toHaveCount(0)
    // 悬停链路：写金额、占来源流出、占总量，只亮它与两端。
    const target = chart.locator('[data-slot="flow-link"][data-id="consume>households>flow"]')
    const at = await target.evaluate((element) => {
      const path = element as unknown as SVGPathElement
      const point = path.getPointAtLength(path.getTotalLength() / 2)
      const matrix = path.getScreenCTM()!
      return { x: point.x * matrix.a + matrix.e, y: point.y * matrix.d + matrix.f }
    })
    await page.mouse.move(at.x, at.y)
    await expect(tip).toContainText('消费 → 居民')
    await expect(tip).toContainText('50.0%')
    await expect(tip).toContainText('9.6%')
    await expect(target).toHaveAttribute('data-lit', '')
    await expect(rect('consume')).toHaveAttribute('data-lit', '')
    await expect(rect('banks')).toHaveAttribute('data-dim', '')
    await page.mouse.move(2, 2)
    // 点节点钉住：移开、失焦后还在；点空白取消。
    await rect('treasury').click()
    await expect(rect('treasury')).toHaveAttribute('data-pinned', '')
    await page.mouse.move(2, 2)
    await page.locator('body').click({ position: { x: 2, y: 2 } })
    await expect(rect('treasury')).toHaveAttribute('data-pinned', '')
    await expect(rect('debt')).toHaveAttribute('data-lit', '')
    await expect(rect('cb')).toHaveAttribute('data-dim', '')
    await chart.locator('svg.k-fsk-svg').click({ position: { x: 4, y: 4 } })
    await expect(chart.locator('[data-pinned]')).toHaveCount(0)
    await expect(chart.locator('[data-dim]')).toHaveCount(0)
    // 键盘：聚焦第一个节点，↓ 同列下一个，→ 去连着的下一列，Enter 钉住，Esc 取消。
    const focusedId = () =>
      page.evaluate(
        () => (document.activeElement?.closest('[data-slot="flow-node"]') as HTMLElement | null)?.dataset.id,
      )
    await rect('cb').focus()
    await expect(tip).toBeVisible()
    await page.keyboard.press('ArrowDown')
    expect(await focusedId()).toBe('credit')
    await page.keyboard.press('ArrowRight')
    const next = await focusedId()
    expect(['banks', 'nonbank']).toContain(next)
    await page.keyboard.press('Enter')
    await expect(rect(next!)).toHaveAttribute('data-pinned', '')
    await page.keyboard.press('Escape')
    await expect(chart.locator('[data-pinned]')).toHaveCount(0)
    // 开关：关掉价格重估，它整条不参与排布，图上与图例里都没有，节点高度回到只有交易流量。
    const before = (await rect('assets').boundingBox())!.height
    await chart.getByRole('button', { name: '显示价格重估' }).click()
    await expect(reval).toHaveCount(0)
    await expect(chart.locator('[data-slot="flow-legend"]')).not.toContainText('价格重估')
    await expect.poll(async () => (await rect('assets').boundingBox())!.height).toBeLessThan(before)
    await chart.getByRole('button', { name: '显示价格重估' }).click()
    await expect(reval).toHaveCount(2)
    // 表格视图：每条链路一行，重估单独标类型。
    await chart.getByRole('button', { name: '表格视图' }).click()
    const table = chart.locator('[data-slot="flow-sankey-table"]')
    await expect(table).toBeVisible()
    await expect(table).toHaveAttribute('data-rows', '26')
    await expect(table).toContainText('央行 → 银行体系')
    await expect(table.locator('tr', { hasText: '资产配置 → 居民' }).filter({ hasText: '价格重估' })).toHaveCount(1)
    // 有环：不画、写提示。
    await expect(section(page, 'flow-sankey').locator('[data-gallery-flow="cycle"] .k-fsk-empty')).toHaveText(
      '流向里有环，先拆开再画',
    )
  })

  test(`按发布时间的宏观序列（${theme}）：两条线与发布点、切换、十字线读出发布史、修订小图、截至某日已知、表格视图`, async ({
    page,
  }) => {
    await open(page, theme, 'vintage-series')
    const main = section(page, 'vintage-series').locator('[data-gallery-vintage="main"]')
    const known = main.locator('[data-slot="vintage-known"]')
    const latest = main.locator('[data-slot="vintage-latest"]')
    await expect(known).toBeVisible()
    await expect(latest).toBeVisible()
    expect((await known.boundingBox())!.width).toBeGreaterThan(300)
    expect(await colorAt(page, known, 'stroke')).toEqual(await rgba(page, await token(page, '--ink-100')))
    expect(await latest.evaluate((e) => getComputedStyle(e).strokeDasharray)).not.toBe('none')
    // 发布点：每期一个「当时已知」空心点，总点数 = 表格视图的行数（每次发布一行），修订竖线只画在修订过的期。
    const dots = main.locator('[data-slot="vintage-release"]')
    await expect(main.locator('[data-slot="vintage-release"][data-role="known"]')).toHaveCount(36)
    const total = await dots.count()
    expect(await main.locator('[data-slot="vintage-release"][data-role="latest"]').count()).toBeGreaterThan(20)
    const fullWidth = (await known.boundingBox())!.width
    // 修订竖线只画在修订过的期：条数 = 最新那一种点的个数。
    const latestDots = await main.locator('[data-slot="vintage-release"][data-role="latest"]').count()
    await expect(main.locator('[data-slot="vintage-span"]')).toHaveCount(latestDots)
    await expect(main.locator('[data-metric="revised"] dd')).toHaveText(/^\d+ \/ 36$/)
    await expect(main.locator('[data-metric="meanAbs"] dd')).toHaveText(/^\d\.\d\d%$/)
    await expect(main.locator('[data-metric="bias"] dd')).toHaveText(/^[+-]\d\.\d\d$/)
    // 十字线读出这一期的全部发布史：键盘 Home 到第一期（有首次发布与年度基准修订），读数带修订幅度。
    const slider = main.locator('[data-slot="vintage-chart"]')
    // 平时图区外面没有框。
    expect(await slider.evaluate((e) => getComputedStyle(e).outlineStyle)).toBe('none')
    await slider.focus()
    await page.keyboard.press('Home')
    const tip = main.locator('[data-slot="lcd-tooltip"]')
    await expect(tip).toContainText('2023-01')
    await expect(tip).toContainText('年度基准修订')
    await expect(tip).toContainText('累计修订')
    await expect(main.locator('[data-slot="vintage-cross"]')).toBeVisible()
    await expect(slider).toHaveAttribute('aria-valuetext', /2023-01.*当时已知值.*最新修订值/)
    await page.keyboard.press('ArrowRight')
    await expect(tip).toContainText('2023-02')
    await page.keyboard.press('Escape')
    await expect(tip).toHaveCount(0)
    // 修订小图：涨跌两种柱，颜色是发散阶，不用橙与蓝。
    const up = main.locator('[data-slot="vintage-rev"][data-tone="up"]').first()
    const down = main.locator('[data-slot="vintage-rev"][data-tone="down"]').first()
    expect(await colorAt(page, up, 'fill')).toEqual(await rgba(page, await token(page, '--div-pos-200')))
    expect(await colorAt(page, down, 'fill')).toEqual(await rgba(page, await token(page, '--div-neg-200')))
    expect((await up.boundingBox())!.height).toBeGreaterThan(1)
    // 切换：只看当时已知，最新线与它的点没了；只看最新，当时已知线没了。
    await main.getByRole('group', { name: '看哪条线' }).getByRole('button', { name: '当时已知值', exact: true }).click()
    await expect(latest).toHaveCount(0)
    await expect(main.locator('[data-slot="vintage-release"][data-role="latest"]')).toHaveCount(0)
    await expect(known).toBeVisible()
    await main.getByRole('group', { name: '看哪条线' }).getByRole('button', { name: '最新修订值', exact: true }).click()
    await expect(known).toHaveCount(0)
    await expect(latest).toBeVisible()
    await main.getByRole('group', { name: '看哪条线' }).getByRole('button', { name: '两条都看', exact: true }).click()
    await expect(known).toBeVisible()
    // 表格视图：每次发布一行，点数对得上。
    await main.getByRole('button', { name: '表格视图' }).click()
    const table = main.locator('[data-slot="vintage-series-table"]')
    await expect(table).toBeVisible()
    await expect(table).toHaveAttribute('data-rows', String(total))
    await expect(table).toContainText('2023-01')
    await expect(table).toContainText('2024-07-15')
    // 截至 2025-06-30 已知：之后才发布的期当时还不存在，「当时已知」线在那里断开，读数写「还没发布」。
    const asof = section(page, 'vintage-series').locator('[data-gallery-vintage="asof"]')
    const asofKnown = asof.locator('[data-slot="vintage-known"]')
    await expect(asofKnown).toBeVisible()
    expect((await asofKnown.boundingBox())!.width).toBeLessThan(fullWidth * 0.9)
    await asof.locator('[data-slot="vintage-chart"]').focus()
    await page.keyboard.press('End')
    await expect(asof.locator('[data-slot="lcd-tooltip"]')).toContainText('还没发布')
    await expect(asof.locator('[data-slot="vintage-chart"]')).toHaveAttribute('aria-valuetext', /2025-12.*还没发布/)
  })

  test(`建议队列（${theme}）：卡片内容与来源链接、倒计时与过期、接受要按住、拒绝与稍后回调、筛选与一行记录`, async ({
    page,
  }) => {
    await open(page, theme, 'decision-queue')
    const doc = section(page, 'decision-queue')
    const frame = doc.getByTestId('dq-frame')
    const cards = frame.locator('.k-dq-card')
    const log = doc.getByTestId('dq-log')
    // 待处理页：三张（含一张稍后），过期的那张不在；计数对得上；快过期的在前。
    await expect(cards).toHaveCount(3)
    await expect(frame.getByTestId('dq-count-pending')).toHaveText('3')
    await expect(frame.getByTestId('dq-count-expired')).toHaveText('1')
    await expect(cards.first().locator('.k-dq-action')).toHaveText('停策略')
    // 内容：动作与对象、理由、置信、依据、来源链接点得回出处、倒计时。
    const buy = cards.filter({ hasText: '星河锂业' })
    await expect(buy.locator('.k-dq-action')).toHaveText('买入')
    await expect(buy.locator('.k-dq-rationale')).toContainText('产能爬坡')
    await expect(buy.getByTestId('dq-confidence')).toContainText('置信 72%')
    const link = buy.getByRole('link', { name: '演示通讯社 · 产能公告' })
    await expect(link).toHaveAttribute('href', 'https://example.com/demo/capacity')
    await expect(link).toHaveAttribute('target', '_blank')
    await expect(buy.getByTestId('dq-left')).toHaveText('还剩 5:00')
    const urgent = cards.filter({ hasText: '动量轮动 A' }).getByTestId('dq-left')
    await expect(urgent).toHaveText('还剩 0:50')
    // 最后一分钟倒计时是琥珀色，其余不是。
    const amber = await token(page, '--signal-amber')
    await expect.poll(() => urgent.evaluate((n) => getComputedStyle(n).color)).toBe(amber)
    expect(await buy.getByTestId('dq-left').evaluate((n) => getComputedStyle(n).color)).not.toBe(amber)
    // 稍后的卡带标记、没有「稍后」按钮；详情里放 ConsensusBlock。
    const snoozed = cards.filter({ hasText: '均值回归 B' })
    await expect(snoozed.locator('.k-dq-snoozed')).toHaveText('已推后')
    await expect(snoozed.getByRole('button', { name: '稍后' })).toHaveCount(0)
    await buy.getByRole('button', { name: '执行前检查' }).click()
    await expect(buy.locator('.k-consensus')).toBeVisible()
    // 稍后回调：卡带上「已推后」标记，仍在待处理页。
    const quick = cards.filter({ hasText: '动量轮动 A' })
    await quick.getByRole('button', { name: '稍后' }).click()
    await expect(log).toHaveText('稍后 d2')
    await expect(quick.locator('.k-dq-snoozed')).toHaveText('已推后')
    await expect(cards).toHaveCount(3)
    // 快进 2 分钟：剩 0:50 的那张（连同已推后）过了有效期，不在待处理页，进已过期页；剩 5:00 的变 3:00。
    await doc.getByTestId('dq-ff').click()
    await expect(cards).toHaveCount(2)
    await expect(frame.getByTestId('dq-count-pending')).toHaveText('2')
    await expect(frame.getByTestId('dq-count-expired')).toHaveText('2')
    await expect(buy.getByTestId('dq-left')).toHaveText('还剩 3:00')
    // 接受是按住：单击不触发；按住到填满才回调，并且只回调一次。
    const accept = buy.locator('.k-hold')
    await accept.click()
    await expect(log).toHaveText('稍后 d2')
    const box = (await accept.boundingBox())!
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
    await page.mouse.down()
    await expect(log).toHaveText('接受 d1', { timeout: 3000 })
    await page.mouse.up()
    await expect(cards).toHaveCount(1)
    // 拒绝回调；待处理页清空后出空态。
    await snoozed.getByRole('button', { name: '拒绝' }).click()
    await expect(log).toHaveText('拒绝 d3')
    await expect(frame.locator('.k-dq-empty')).toHaveText('没有待处理的建议')
    // 已接受页：旧的一条加刚接受的一条，都是一行；一行里有结果、谁、何时；点开才看理由。
    await frame.getByRole('button', { name: /已接受/ }).click()
    const rows = frame.locator('.k-dq-row')
    await expect(rows).toHaveCount(2)
    expect((await rows.first().boundingBox())!.height).toBeLessThan(44)
    await expect(rows.filter({ hasText: '半导体篮子' })).toContainText('演示用户 · 1 小时前')
    await expect(frame.locator('.k-dq-rationale')).toHaveCount(0)
    await rows.filter({ hasText: '半导体篮子' }).click()
    await expect(frame.locator('.k-dq-rationale')).toContainText('拥挤度')
    // 已拒绝页两条；已过期页两条（原有的与刚过期的），过期的没有按钮。
    await frame.getByRole('button', { name: /已拒绝/ }).click()
    await expect(rows).toHaveCount(2)
    await frame.getByRole('button', { name: /已过期/ }).click()
    await expect(rows).toHaveCount(2)
    await expect(frame.getByRole('button', { name: '接受', exact: true })).toHaveCount(0)
  })

  test(`系统监控（${theme}）：异常连接排前面、出错策略红边、启停回调、额度条、事件筛选、急停按住才触发、无数据写未连接`, async ({
    page,
  }) => {
    await open(page, theme, 'system-monitor')
    const doc = section(page, 'system-monitor')
    const frame = doc.getByTestId('mon-frame')
    // 连接条：出错的最前，正常的在后；灯有状态字，红灯是 signal-red，琥珀是 signal-amber。
    const links = frame.locator('.k-sysmon-link')
    await expect(links).toHaveCount(4)
    await expect(links.nth(0)).toContainText('演示交易所 B')
    await expect(links.nth(0)).toContainText('出错')
    await expect(links.nth(0)).toContainText('心跳 1 分钟前')
    await expect(links.nth(1)).toContainText('策略引擎')
    await expect(links.nth(1)).toContainText('310 ms')
    await expect(links.nth(3)).toContainText('心跳 1 秒前')
    await expect.poll(() => bg(links.nth(0).locator('.k-led'))).toBe(await token(page, '--signal-red'))
    await expect.poll(() => bg(links.nth(1).locator('.k-led'))).toBe(await token(page, '--signal-amber'))
    await expect.poll(() => bg(links.nth(3).locator('.k-led'))).toBe(await token(page, '--signal-green'))
    // 策略表：出错的最前，左边是红边，出错说明可见；每行有状态字。
    const rows = frame.locator('.k-sysmon-row')
    await expect(rows).toHaveCount(4)
    await expect(rows.first()).toHaveAttribute('data-status', 'error')
    await expect(rows.first().locator('.k-sysmon-error')).toHaveText('下单被拒：签名校验失败')
    await expect(rows.first().locator('.k-sysmon-error')).toBeVisible()
    await expect(rows.first()).toHaveCSS('box-shadow', /rgb/)
    await expect(rows.nth(1)).toContainText('运行')
    await expect(rows.nth(1)).toContainText('+1,830.50')
    await expect(rows.nth(4 - 1)).toContainText('停止')
    // 额度条：93% 越过 90% 预警线，琥珀；42% 绿；长度跟占用成比例。
    const fillOf = (row: Locator) => row.locator('.k-sysmon-quota-track > span')
    await expect.poll(() => bg(fillOf(rows.first()))).toBe(await token(page, '--signal-amber'))
    await expect.poll(() => bg(fillOf(rows.nth(1)))).toBe(await token(page, '--signal-green'))
    const trackBox = (await rows.nth(1).locator('.k-sysmon-quota-track').boundingBox())!
    const fillBox = (await fillOf(rows.nth(1)).boundingBox())!
    expect(fillBox.width / trackBox.width).toBeGreaterThan(0.38)
    expect(fillBox.width / trackBox.width).toBeLessThan(0.46)
    // 小图：两块 SparkTile 有线。
    await expect(frame.locator('.k-spark-tile')).toHaveCount(2)
    expect((await frame.locator('.k-spark-tile-chart').first().boundingBox())!.height).toBeGreaterThan(10)
    // 启停：出错的行只有「启动」，点了回调并变成运行；运行的行有暂停与停止。
    await expect(rows.first().getByRole('button')).toHaveCount(1)
    await rows.first().getByRole('button', { name: '启动 突破跟随 · 演示' }).click()
    await expect(doc.getByTestId('mon-log')).toHaveText('start s2')
    await expect(frame.locator('.k-sysmon-row[data-strategy-id="s2"]')).toHaveAttribute('data-status', 'running')
    await expect(frame.locator('.k-sysmon-row').first().locator('.k-sysmon-error')).toHaveCount(0)
    const s1 = frame.locator('.k-sysmon-row[data-strategy-id="s1"]')
    await expect(s1.getByRole('button')).toHaveCount(2)
    await s1.getByRole('button', { name: '暂停 均值回归 · 演示' }).click()
    await expect(s1).toHaveAttribute('data-status', 'paused')
    // 事件流：六条，新的在前，错误红边；按严重程度与类别筛。
    const events = frame.locator('.k-sysmon-event')
    await expect(events).toHaveCount(6)
    await expect(events.first()).toContainText('委托被拒')
    await expect(events.first().locator('time')).toHaveText('20 秒前')
    await expect(events.first()).toHaveCSS('border-left-color', await token(page, '--signal-red'))
    await expect(events.nth(3)).toHaveCSS('border-left-color', await token(page, '--signal-amber'))
    await frame.getByRole('button', { name: '错误' }).click()
    await expect(events).toHaveCount(2)
    await frame.getByRole('button', { name: '警告' }).click()
    await expect(events).toHaveCount(3)
    await frame.getByRole('button', { name: '全部' }).click()
    await frame.getByRole('button', { name: '成交' }).click()
    await expect(events).toHaveCount(1)
    await frame.getByRole('button', { name: '拒单' }).click()
    await expect(events).toHaveCount(2)
    await frame.getByRole('button', { name: '错误' }).click()
    await expect(events).toHaveCount(1)
    await frame.getByRole('button', { name: '清除类别筛选' }).click()
    await frame.getByRole('button', { name: '全部' }).click()
    await expect(events).toHaveCount(6)
    // 急停：单击不触发；按住填满才触发，全部变成停止。
    const stop = frame.getByRole('button', { name: /急停/ })
    await stop.click()
    await expect(doc.getByTestId('mon-log')).not.toHaveText('急停')
    await stop.focus()
    await page.keyboard.down('Space')
    await expect(doc.getByTestId('mon-log')).toHaveText('急停', { timeout: 6000 })
    await page.keyboard.up('Space')
    await expect(frame.locator('.k-sysmon-row[data-status="stopped"]')).toHaveCount(4)
    // 没有数据：每块写未连接。
    await expect(doc.getByTestId('mon-empty').locator('.k-sysmon-empty')).toHaveCount(4)
    await expect(doc.getByTestId('mon-empty').locator('.k-sysmon-empty').first()).toHaveText('未连接')
  })

  test(`传导链图（${theme}）：布局从上到下、状态色与线型、点边出证据与失败条件、点节点淡出不相干的边、缩放平移适应、无节点写未连接`, async ({
    page,
  }) => {
    await open(page, theme, 'transmission-chain')
    const doc = section(page, 'transmission-chain')
    const chain = doc.getByTestId('tc-frame').getByTestId('tc')
    const canvas = chain.locator('.k-tc-canvas')
    const edges = chain.locator('.k-tc-edge')
    const nodes = chain.locator('.k-tc-node')
    await expect(nodes).toHaveCount(7)
    await expect(edges).toHaveCount(8)
    // 布局：从上到下，整张图在视口里（适应窗口）。
    const nodeBox = async (id: string) => (await chain.locator(`[data-node-id="${id}"]`).boundingBox())!
    const geo = await nodeBox('geo')
    const rules = await nodeBox('rules')
    const credit = await nodeBox('credit')
    const price = await nodeBox('price')
    expect(geo.y + geo.height).toBeLessThan(rules.y)
    expect(rules.y + rules.height).toBeLessThan(credit.y)
    expect(price.width).toBeGreaterThan(40)
    const area = (await canvas.boundingBox())!
    for (const b of [geo, price]) {
      expect(b.x).toBeGreaterThanOrEqual(area.x - 1)
      expect(b.x + b.width).toBeLessThanOrEqual(area.x + area.width + 1)
      expect(b.y).toBeGreaterThanOrEqual(area.y - 1)
      expect(b.y + b.height).toBeLessThanOrEqual(area.y + area.height + 1)
    }
    // 状态色与线型：支持涨色实线、反对跌色、部分琥珀点划线、未检验灰虚线；不是橙色。
    const stroke = (id: string) =>
      chain.locator(`[data-edge-id="${id}"] .k-tc-line`).evaluate((el) => {
        const style = getComputedStyle(el)
        return { color: style.stroke, dash: style.strokeDasharray }
      })
    const probe = async (name: string) => {
      const color = await token(page, name)
      return color
    }
    expect((await stroke('e1')).color).toBe(await probe('--pnl-up'))
    expect((await stroke('e1')).dash).toBe('none')
    expect((await stroke('e6')).color).toBe(await probe('--pnl-down'))
    expect((await stroke('e3')).color).toBe(await probe('--signal-amber'))
    expect((await stroke('e3')).dash).not.toBe('none')
    expect((await stroke('e4')).color).toBe(await probe('--ink-400'))
    expect((await stroke('e4')).dash).not.toBe('none')
    // 标签：状态图标 + 文字 + 证据计数；没证据的不写计数。
    await expect(chain.locator('[data-edge-id="e1"] .k-tc-chip-text')).toHaveText('目标约束规则 支 2 反 0')
    await expect(chain.locator('[data-edge-id="e4"] .k-tc-chip-text')).toHaveText('资金外流')
    await expect(chain.locator('[data-edge-id="e8"]')).toHaveAttribute('data-feedback', 'true')
    // 图例：四种状态各一条，条数对得上（支持 4 含反馈边、部分 2、反对 1、未检验 1）。
    const legend = chain.locator('.k-tc-legend li')
    await expect(legend).toHaveCount(4)
    await expect(legend.nth(0)).toContainText('有证据支持')
    await expect(legend.nth(0).locator('b')).toHaveText('4')
    await expect(legend.nth(1).locator('b')).toHaveText('2')
    await expect(legend.nth(2).locator('b')).toHaveText('1')
    await expect(legend.nth(3).locator('b')).toHaveText('1')
    // 没选：写提示。点边：右侧出这条边的标题、状态字、失败条件、证据行（立场字 + 来源类别）。
    await expect(chain.locator('.k-tc-hint')).toBeVisible()
    await chain.locator('[data-edge-id="e6"] .k-tc-chip').click()
    const detail = chain.getByTestId('tc-edge-detail')
    await expect(detail.locator('.k-tc-title')).toHaveText('境内外资产配置 → 资产价格')
    await expect(detail.locator('.k-tc-badge')).toContainText('证据反对')
    await expect(detail.locator('.k-tc-failure')).toHaveText('资金外流加快的时期，境内资产价格没有承压。')
    const rows = detail.locator('.k-hl-ev')
    await expect(rows).toHaveCount(2)
    await expect(rows.first()).toContainText('反对')
    await expect(rows.first()).toContainText('政策与资金变化')
    await expect(rows.first()).toContainText('2026-10-20')
    await expect(rows.first().locator('.k-hl-source')).toHaveText('演示数据')
    await expect(chain.locator('[data-edge-id="e6"]')).toHaveAttribute('data-selected', 'true')
    // 没写失败条件、没有证据的边：提示写出来。
    await chain.locator('[data-edge-id="e4"] .k-tc-chip').click()
    await expect(detail.locator('.k-tc-badge')).toContainText('未检验')
    await expect(detail.locator('.k-tc-missing')).toHaveText('还没有证据。')
    // 点节点：列出上下游边，不相干的边与节点淡出；点上下游里的一条跳到那条边。
    await chain.locator('[data-node-id="price"]').click()
    const nodeDetail = chain.getByTestId('tc-node-detail')
    await expect(nodeDetail.locator('.k-tc-title')).toHaveText('资产价格')
    await expect(nodeDetail.locator('.k-tc-link')).toHaveCount(3)
    await expect(chain.locator('[data-edge-id="e1"]')).toHaveAttribute('data-dim', 'true')
    await expect(chain.locator('[data-edge-id="e8"]')).not.toHaveAttribute('data-dim', 'true')
    await expect(chain.locator('[data-edge-id="e1"]')).toHaveCSS('opacity', '0.3')
    await nodeDetail.locator('.k-tc-link').last().click()
    await expect(detail.locator('.k-tc-title')).toHaveText('资产价格 → 信用与购买力分配')
    await expect(detail.locator('.k-tc-badge')).toContainText('有证据支持')
    // 键盘：焦点到边上按 Enter 选中。
    await chain.locator('[data-edge-id="e2"]').focus()
    await page.keyboard.press('Enter')
    await expect(chain.locator('[data-edge-id="e2"]')).toHaveAttribute('data-selected', 'true')
    // 缩放：滚轮放大、按钮缩小、适应回到初始；拖背景平移。
    const k = async () => Number(await chain.locator('[data-view-k]').getAttribute('data-view-k'))
    const translate = () => chain.locator('[data-view-k]').getAttribute('transform')
    const k0 = await k()
    const t0 = await translate()
    await page.mouse.move(area.x + area.width / 2, area.y + 6)
    await page.mouse.wheel(0, -300)
    await expect.poll(k).toBeGreaterThan(k0 * 1.3)
    const kZoomed = await k()
    await chain.getByRole('button', { name: '缩小' }).click()
    await expect.poll(k).toBeLessThan(kZoomed)
    await page.mouse.move(area.x + 8, area.y + 8)
    await page.mouse.down()
    await page.mouse.move(area.x + 68, area.y + 48, { steps: 4 })
    await page.mouse.up()
    await expect.poll(translate).not.toBe(t0)
    await chain.getByRole('button', { name: '适应窗口' }).click()
    await expect.poll(translate).toBe(t0)
    await expect.poll(k).toBeCloseTo(k0, 3)
    // 点空白取消选择。
    await page.mouse.click(area.x + 8, area.y + 8)
    await expect(chain.locator('.k-tc-hint')).toBeVisible()
    // 没有节点：写未连接。
    await expect(doc.getByTestId('tc-empty').locator('.k-tc-empty')).toHaveText('未连接')
  })

  test(`假说账（${theme}）：一行一条、展开看失败条件与证据、倒计时与自动过期、按层与状态筛选、观察表`, async ({
    page,
  }) => {
    await open(page, theme, 'hypothesis-ledger')
    const doc = section(page, 'hypothesis-ledger')
    const frame = doc.getByTestId('hl-frame')
    const rows = frame.locator('.k-hl-row')
    const statusBar = frame.getByRole('group', { name: '状态筛选' })
    const item = (id: string) => frame.locator(`[data-hypothesis-id="${id}"]`)
    // 六条假说，各状态计数对得上；待验证里快到期的在前，已有结论或过期的排在待验证之后。
    await expect(rows).toHaveCount(6)
    await expect(frame.getByTestId('hl-count-all')).toHaveText('6')
    await expect(frame.getByTestId('hl-count-pending')).toHaveText('3')
    await expect(frame.getByTestId('hl-count-supported')).toHaveText('1')
    await expect(frame.getByTestId('hl-count-refuted')).toHaveText('1')
    await expect(frame.getByTestId('hl-count-expired')).toHaveText('1')
    await expect(rows.first().locator('.k-hl-claim')).toContainText('海外配置分流假说')
    // 一行上：状态、传导层、证据对比、倒计时；14 天内到期与过期的倒计时是琥珀色，其余不是。
    const amber = await token(page, '--signal-amber')
    const soon = item('h2')
    await expect(soon.locator('.k-hl-status')).toHaveText('待验证')
    await expect(soon.locator('.k-hl-layer')).toHaveText('跨境流动')
    await expect(soon.getByTestId('hl-tally')).toHaveText('2 支持 · 0 反对')
    await expect(soon.getByTestId('hl-due')).toHaveText('还剩 9 天')
    expect(await soon.getByTestId('hl-due').evaluate((n) => getComputedStyle(n).color)).toBe(amber)
    await expect(item('h1').getByTestId('hl-due')).toHaveText('还剩 45 天')
    expect(
      await item('h1')
        .getByTestId('hl-due')
        .evaluate((n) => getComputedStyle(n).color),
    ).not.toBe(amber)
    // 过了期限的待验证项自动标过期。
    await expect(item('h5').locator('.k-hl-status')).toHaveText('过期')
    await expect(item('h5').getByTestId('hl-due')).toHaveText('已过期 6 天')
    expect(
      await item('h5')
        .getByTestId('hl-due')
        .evaluate((n) => getComputedStyle(n).color),
    ).toBe(amber)
    // 展开前看不到证据；点开才有失败条件、证据（类型、支持或反对、时间、来源链接、摘要）与关联。
    await expect(frame.locator('.k-hl-body')).toHaveCount(0)
    await item('h1').locator('.k-hl-row').click()
    const body = item('h1').locator('.k-hl-body')
    await expect(body.locator('.k-hl-failure')).toContainText('连续两个季度')
    const evidence = body.locator('.k-hl-ev')
    await expect(evidence).toHaveCount(3)
    await expect(evidence.nth(0).locator('.k-hl-kind')).toHaveText('政策原文')
    await expect(evidence.nth(1).locator('.k-hl-kind')).toHaveText('学者观点')
    await expect(evidence.nth(2).locator('.k-hl-kind')).toHaveText('数据')
    await expect(evidence.nth(0).locator('.k-hl-time')).toHaveText('2026-10-16')
    const link = evidence.nth(0).getByRole('link', { name: '演示政策文本 · 产业规划摘要' })
    await expect(link).toHaveAttribute('href', 'https://example.com/demo/e1')
    await expect(link).toHaveAttribute('target', '_blank')
    await expect(evidence.nth(2).locator('.k-hl-stance')).toHaveText('反对')
    // 支持与反对不单靠颜色（有字），颜色也不同。
    const dot = (n: Locator) => n.locator('.k-hl-stance i').evaluate((e) => getComputedStyle(e).backgroundColor)
    expect(await dot(evidence.nth(0))).toBe(await token(page, '--signal-green'))
    expect(await dot(evidence.nth(2))).toBe(await token(page, '--signal-red'))
    await expect(body.locator('.k-hl-asset')).toContainText('先进制造主题篮子')
    await item('h1').locator('.k-hl-row').click()
    await expect(frame.locator('.k-hl-body')).toHaveCount(0)
    // 没有证据的假说写明还没有证据。
    await item('h6').locator('.k-hl-row').click()
    await expect(item('h6').locator('.k-hl-none')).toHaveText('还没有证据')
    // 筛选：按状态；按层；两者叠加，计数各算各的；叠加无结果出空态。
    await statusBar.getByRole('button', { name: /被否定/ }).click()
    await expect(rows).toHaveCount(1)
    await expect(rows.first().locator('.k-hl-claim')).toContainText('信用供给假说')
    await statusBar.getByRole('button', { name: /^全部/ }).click()
    const chip = (name: string) => frame.locator('.k-chip').filter({ hasText: name })
    await chip('跨境流动').click()
    await expect(rows).toHaveCount(1)
    await expect(frame.getByTestId('hl-count-all')).toHaveText('1')
    await expect(frame.getByTestId('hl-count-pending')).toHaveText('1')
    await statusBar.getByRole('button', { name: /被否定/ }).click()
    await expect(rows).toHaveCount(0)
    await expect(frame.locator('.k-hl-empty')).toHaveText('没有符合条件的假说')
    await frame.getByRole('button', { name: '清除层筛选' }).click()
    await statusBar.getByRole('button', { name: /^全部/ }).click()
    await expect(rows).toHaveCount(6)
    // 快进 10 天：剩 9 天的那条过了期限，自动从待验证变过期。
    await doc.getByTestId('hl-ff').click()
    await expect(item('h2').locator('.k-hl-status')).toHaveText('过期')
    await expect(item('h2').getByTestId('hl-due')).toHaveText('已过期 1 天')
    await expect(frame.getByTestId('hl-count-pending')).toHaveText('2')
    await expect(frame.getByTestId('hl-count-expired')).toHaveText('2')
    // 观察表：传导层 × 核心证据 × 最容易混淆的地方。
    await frame.getByRole('group', { name: '视图' }).getByRole('button', { name: '观察表' }).click()
    await expect(frame.locator('.k-hl-row')).toHaveCount(0)
    const table = frame.locator('.k-hl-watch')
    await expect(table.locator('thead th')).toHaveText(['传导层', '核心证据', '最容易混淆的地方'])
    await expect(table.locator('tbody tr')).toHaveCount(8)
    await expect(table.locator('tbody tr').first()).toContainText('口号式表述和有预算的安排不是一回事')
    await frame.getByRole('group', { name: '视图' }).getByRole('button', { name: '假说', exact: true }).click()
    await expect(rows).toHaveCount(6)
  })

  test(`选股器（${theme}）：过滤胶囊选预设与手动设、加字段、移除、重置，列集标签换列`, async ({ page }) => {
    await open(page, theme, 'filter-bar')
    const doc = section(page, 'filter-bar')
    const bar = doc.locator('[data-slot="filter-bar"]')
    const grid = doc.getByTestId('screener-grid')
    const codes = () =>
      grid
        .locator('[data-col="symbol"]')
        .allTextContents()
        .then((all) => all.filter((t) => !t.startsWith('代码')))
    expect(await codes()).toHaveLength(8)
    // 预设：价格「高于 100」，副标题「高价股」在浮层里；选了以后胶囊带条件文字，表只剩价格大于 100 的 5 只。
    await bar.locator('[data-slot="filter-pill"][data-field="price"]').click()
    const pop = page.getByRole('dialog', { name: '价格' })
    await expect(pop.getByText('高价股')).toBeVisible()
    await pop.locator('[data-preset="p-high"]').click()
    await expect(bar.locator('[data-field="price"]')).toContainText('高于 100')
    await expect.poll(async () => (await codes()).length).toBe(4)
    // 手动设置：涨跌幅 大于 1，应用后与价格条件相且。
    await bar.locator('[data-field="change"]').click()
    const pop2 = page.getByRole('dialog', { name: '涨跌幅' })
    await pop2.getByLabel('值').fill('1')
    await pop2.getByRole('button', { name: '应用' }).click()
    await expect(bar.locator('[data-field="change"]')).toContainText('大于 1')
    await expect.poll(async () => (await codes()).length).toBe(2)
    // 「+」：加一个字段（分组带计数，进组再选）；移除字段连它的条件一起清。
    await bar.getByRole('button', { name: '添加过滤' }).click()
    const add = page.getByRole('dialog', { name: '添加过滤' })
    await expect(add.locator('[data-group="分红"] small')).toHaveText('1')
    await add.locator('[data-group="分红"]').click()
    await add.locator('[data-field-option="yield"]').click()
    await expect(bar.locator('[data-field="yield"]')).toBeVisible()
    await bar.locator('[data-field="change"]').click()
    await page.getByRole('dialog', { name: '涨跌幅' }).getByRole('button', { name: '移除过滤 涨跌幅' }).click()
    await expect(bar.locator('[data-field="change"]')).toHaveCount(0)
    await expect.poll(async () => (await codes()).length).toBe(4)
    // 「⋯」重置全部。
    await bar.getByRole('button', { name: '更多' }).click()
    await page.getByRole('button', { name: '重置全部过滤' }).click()
    await expect.poll(async () => (await codes()).length).toBe(8)
    // 列集标签：概览亮着，点「估值」换成四列（代码、价格、市盈率、市值），涨跌幅列消失。
    const tabs = doc.getByRole('tablist', { name: '列集' })
    await expect(tabs.getByRole('tab', { name: '概览' })).toHaveAttribute('aria-selected', 'true')
    await tabs.getByRole('tab', { name: '估值' }).click()
    await expect(tabs.getByRole('tab', { name: '估值' })).toHaveAttribute('aria-selected', 'true')
    await expect(grid.locator('[role="columnheader"][data-col]')).toHaveCount(4)
    await expect(grid.getByRole('columnheader', { name: /涨跌幅/ })).toHaveCount(0)
  })

  test(`选股器（${theme}）：保存的筛选下拉、撤销重做、两行表头与总数、评级图标、表头「+」加列`, async ({ page }) => {
    await open(page, theme, 'filter-bar')
    const doc = section(page, 'filter-bar')
    const bar = doc.locator('[data-slot="filter-bar"]')
    const grid = doc.getByTestId('screener-grid')
    const rowsOf = () => grid.locator('[data-slot="rating-text"]')
    // 表头：代码列第二行写总数，搜索图标在名字后；市盈率第二行是口径 TTM；排序箭头画在名字前。
    const symbolHead = grid.getByRole('columnheader', { name: /代码/ })
    await expect(symbolHead.locator('.k-grid-head-sub')).toHaveText('8 / 8')
    await expect(grid.getByRole('columnheader', { name: /市盈率/ }).locator('.k-grid-head-sub')).toHaveText('TTM')
    await expect(grid.getByRole('img', { name: '搜索代码' })).toBeVisible()
    await grid
      .getByRole('columnheader', { name: /价格/ })
      .getByRole('button')
      .first()
      .click()
    const arrowBox = (await grid
      .getByRole('columnheader', { name: /价格/ })
      .locator('.k-grid-sort')
      .boundingBox())!
    const nameBox = (await grid
      .getByRole('columnheader', { name: /价格/ })
      .locator('.k-grid-head-name')
      .boundingBox())!
    expect(arrowBox.x + arrowBox.width).toBeLessThanOrEqual(nameBox.x + 1)
    // 评级列：五种图标加文字，强力买入取涨色，强力卖出取跌色。
    await expect(rowsOf()).toHaveCount(8)
    const tone = (level: string) =>
      grid
        .locator(`[data-slot="rating-text"][data-level="${level}"]`)
        .first()
        .evaluate((el) => getComputedStyle(el).color)
    expect(await tone('strong-buy')).not.toBe(await tone('strong-sell'))
    await expect(grid.locator('[data-slot="rating-text"][data-level="strong-buy"]').first()).toHaveText('强力买入')
    expect(await grid.locator('[data-slot="rating-text"][data-level="strong-buy"] svg').count()).toBe(2)
    // 撤销 / 重做：设一个预设，撤销回到 8 行，重做回到筛过的。
    const undo = bar.getByRole('button', { name: '撤销' })
    const redo = bar.getByRole('button', { name: '重做' })
    await expect(undo).toBeDisabled()
    await bar.locator('[data-slot="filter-pill"][data-field="price"]').click()
    await page.getByRole('dialog', { name: '价格' }).locator('[data-preset="p-high"]').click()
    await expect(rowsOf()).toHaveCount(4)
    await undo.click()
    await expect(rowsOf()).toHaveCount(8)
    await expect(redo).toBeEnabled()
    await redo.click()
    await expect(rowsOf()).toHaveCount(4)
    // 标题下拉：切到「高股息」换一组条件；另存为多一项并选中。
    const title = doc.getByRole('button', { name: '已保存的筛选' })
    await title.click()
    await page.getByRole('menuitemradio', { name: '高股息' }).click()
    await expect(rowsOf()).toHaveCount(4)
    await expect(title).toContainText('高股息')
    await title.click()
    await page.getByRole('menuitem', { name: '另存为…' }).click()
    await expect(title).toContainText('未命名筛选')
    // 表头最右的「+」：弹出列选择，勾上股息率，表头多一列。
    const cols = grid.locator('[role="columnheader"][data-col]')
    const before = await cols.count()
    await grid.getByRole('button', { name: '添加列' }).click()
    await page.getByRole('dialog', { name: '添加列' }).getByRole('checkbox', { name: '股息率' }).click()
    await expect(cols).toHaveCount(before + 1)
  })

  test(`新闻流（${theme}）：组合过滤——加分面、多选、重置、移除；选中行加深；阅读窗`, async ({ page }) => {
    await open(page, theme, 'news-feed')
    const frame = section(page, 'news-feed').getByTestId('news-frame')
    const rows = frame.locator('.k-news-item')
    await expect(rows).toHaveCount(6)
    // 「市场」分面一开始就在：选「股票」只剩带这个取值的一条。
    await frame.locator('[data-facet="market"]').click()
    const pop = page.getByRole('dialog', { name: '市场' })
    await pop.getByRole('checkbox', { name: '股票' }).click()
    await expect(rows).toHaveCount(1)
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog')).toHaveCount(0)
    // 再加「国家」分面（「添加过滤」里没有的才列），再选「乙国」：且关系，没有命中。
    await frame.locator('[data-slot="news-facet-add"]').click()
    await page.locator('[data-facet-option="country"]').click()
    await frame.locator('[data-facet="country"]').click()
    await page.getByRole('dialog', { name: '国家' }).getByRole('checkbox', { name: '乙国' }).click()
    await expect(rows).toHaveCount(0)
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog')).toHaveCount(0)
    // 重置国家：回到只受「市场」影响；移除「市场」：全部六条。
    await frame.locator('[data-facet="country"]').click()
    await page.getByRole('dialog', { name: '国家' }).getByRole('button', { name: '重置' }).click()
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog')).toHaveCount(0)
    await expect(rows).toHaveCount(1)
    await frame.locator('[data-facet="market"]').click()
    await page.getByRole('dialog', { name: '市场' }).getByRole('button', { name: '移除 市场' }).click()
    await expect(frame.locator('[data-facet="market"]')).toHaveCount(0)
    await expect(rows).toHaveCount(6)
  })

  test(`新闻流（${theme}）：并排阅读窗（点标题右边出阅读窗、窄了改浮层）、保存的过滤下拉、收起过滤、阅读分钟数、重叠的品种徽标`, async ({
    page,
  }) => {
    await open(page, theme, 'news-feed')
    const split = section(page, 'news-feed').getByTestId('news-split')
    const feed = split.locator('.k-news')
    const rows = feed.locator('.k-news-item')
    await expect(rows.first()).toContainText('分钟阅读')
    // 重叠的徽标：同一条里相邻两颗徽标左右重叠（后一颗的左边在前一颗的右边之内）。
    const pair = feed
      .locator('.k-news-symbols[data-style="stack"]')
      .filter({ has: page.locator('.k-news-symbol + .k-news-symbol') })
      .first()
    const [a, b] = await pair
      .locator('.k-news-symbol')
      .evaluateAll((nodes) =>
        nodes.slice(0, 2).map((n) => n.getBoundingClientRect().toJSON() as { left: number; right: number }),
      )
    expect(b!.left).toBeLessThan(a!.right)
    // 点标题：右边出阅读窗，该行加深；窗里是这一条的标题。
    const title = await rows.nth(1).locator('.k-news-title').textContent()
    await rows.nth(1).locator('.k-news-title').click()
    const pane = feed.locator('[data-slot="news-reader-pane"]')
    await expect(pane).toBeVisible()
    await expect(pane.getByRole('heading', { level: 2 })).toHaveText(title!)
    await expect(rows.nth(1)).toHaveAttribute('data-selected', '')
    const listBox = (await feed.locator('.k-news-main').boundingBox())!
    const paneBox = (await pane.boundingBox())!
    expect(paneBox.x).toBeGreaterThanOrEqual(listBox.x + listBox.width - 1)
    // 关闭：阅读窗消失。
    await pane.getByRole('button', { name: '关闭' }).click()
    await expect(pane).toHaveCount(0)
    // 收起过滤：来源与分面行消失，再展开回来。
    await expect(feed.locator('[data-slot="news-facets"]')).toBeVisible()
    await feed.getByRole('button', { name: '收起过滤' }).click()
    await expect(feed.locator('[data-slot="news-facets"]')).toHaveCount(0)
    await feed.getByRole('button', { name: '展开过滤' }).click()
    await expect(feed.locator('[data-slot="news-facets"]')).toBeVisible()
    // 保存的过滤下拉：另存为后多一项并选中。
    const views = feed.getByRole('button', { name: '已保存的新闻过滤' })
    await expect(views).toContainText('全部新闻')
    await views.click()
    await page.getByRole('menuitem', { name: '另存为…' }).click()
    await expect(views).toContainText('未命名过滤')
    // 窄了（容器不到 900px）阅读窗盖在列表上。
    await split.getByRole('button', { name: '窄 640px' }).click()
    await rows.first().locator('.k-news-title').click()
    const narrow = (await feed.locator('[data-slot="news-reader-pane"]').boundingBox())!
    const main = (await feed.locator('.k-news-main').boundingBox())!
    expect(narrow.x).toBeLessThanOrEqual(main.x + 2)
  })

  test(`新闻流（${theme}）：1000 条虚拟滚动——只渲染可见行、滚到底最后一条可见、滚动条长度对、滚动中行的 top 单调、算的行高等于渲染出来的`, async ({
    page,
  }) => {
    await open(page, theme, 'news-feed')
    const doc = section(page, 'news-feed')
    const frame = doc.getByTestId('news-frame')
    await doc.getByTestId('news-many').click()
    const scroll = frame.locator('.k-news-scroll')
    const list = frame.locator('.k-news-items')
    await expect(list).toHaveAttribute('data-virtual', '')
    const rows = frame.locator('.k-news-item')
    // 只渲染可见行（远少于 1000），读屏知道总条数。
    const rendered = await rows.count()
    expect(rendered).toBeGreaterThan(3)
    expect(rendered).toBeLessThan(80)
    await expect(rows.first()).toHaveAttribute('aria-setsize', '1000')
    await expect(rows.first()).toHaveAttribute('aria-posinset', '1')
    // 算的行高 = 渲染出来的自然高度（去掉固定高度量内容）：标题折行、元信息折行、胶囊都算对。
    const mismatch = await rows.evaluateAll((nodes) =>
      nodes
        .map((node) => {
          const el = node as HTMLElement
          const set = el.getBoundingClientRect().height
          const keep = el.style.height
          el.style.height = 'auto'
          el.style.minHeight = '32px'
          const natural = el.getBoundingClientRect().height
          el.style.height = keep
          el.style.minHeight = ''
          return { id: el.dataset.newsId, set, natural }
        })
        .filter((row) => Math.abs(row.set - row.natural) > 0.6),
    )
    expect(mismatch).toEqual([])
    // 行高不一（有折两行的）。
    const heights = new Set(
      await rows.evaluateAll((nodes) => nodes.map((n) => Math.round(n.getBoundingClientRect().height))),
    )
    expect(heights.size).toBeGreaterThan(1)
    // 滚动中每次采样：可见行的 top 随下标单调递增（不跳动）。
    const monotonic = await scroll.evaluate(async (el) => {
      const seen: string[] = []
      for (let step = 0; step < 30; step++) {
        el.scrollTop += 700
        await new Promise((resolve) => requestAnimationFrame(() => resolve(null)))
        const tops = [...el.querySelectorAll<HTMLElement>('.k-news-item')]
          .map((n) => ({ index: Number(n.getAttribute('aria-posinset')), top: n.getBoundingClientRect().top }))
          .sort((a, b) => a.index - b.index)
        for (let i = 1; i < tops.length; i++)
          if (tops[i]!.top < tops[i - 1]!.top) seen.push(`step ${step}: ${tops[i - 1]!.index}>${tops[i]!.index}`)
      }
      return seen
    })
    expect(monotonic).toEqual([])
    // 滚到底：最后一条可见；滚动条总长 = 所有行高之和（容器 scrollHeight 与最后一行的底对齐）。
    await scroll.evaluate((el) => (el.scrollTop = el.scrollHeight))
    const last = frame.locator('.k-news-item[aria-posinset="1000"]')
    await expect(last).toBeVisible()
    await expect(last.locator('.k-news-title')).toContainText('1000.')
    // 滚动条走到底：行的底边贴着滚动区的底边（滚动区底部没有多余空白，也没有被截掉）。
    await expect
      .poll(async () => {
        const [scrollBox, lastBox] = [(await scroll.boundingBox())!, (await last.boundingBox())!]
        return scrollBox.y + scrollBox.height - (lastBox.y + lastBox.height)
      })
      .toBeLessThanOrEqual(1)
    const total = await list.evaluate((el) => el.getBoundingClientRect().height)
    // 滚动条长度：scrollHeight 就是全部 1000 行的高度之和（ol 的高），不多不少。
    expect(Math.abs((await scroll.evaluate((el) => el.scrollHeight)) - total)).toBeLessThanOrEqual(1)
    // 筛选仍然有效：搜到少于阈值的结果就回到不虚拟化的老写法。
    await frame.getByRole('searchbox', { name: '搜索关键词' }).fill('99.')
    await expect(list).not.toHaveAttribute('data-virtual', '')
    await expect(rows.first()).not.toHaveAttribute('aria-setsize', /.*/)
  })

  test(`新闻阅读窗（${theme}）：品种涨跌上色、要点、操作按钮`, async ({ page }) => {
    await open(page, theme, 'news-reader')
    const reader = section(page, 'news-reader').locator('[data-slot="news-reader"]')
    await expect(reader.getByRole('heading', { level: 2 })).toContainText('营收好于预期')
    const color = (code: string) =>
      reader.locator(`[data-symbol="${code}"] .k-news-chip-change`).evaluate((el) => getComputedStyle(el).color)
    expect(await color('ALFA')).toBe(
      await page.evaluate(() => {
        const probe = document.createElement('i')
        probe.style.color = 'var(--pnl-up)'
        document.body.append(probe)
        const c = getComputedStyle(probe).color
        probe.remove()
        return c
      }),
    )
    await expect(reader.locator('[data-symbol="BETA"]')).toContainText('-0.59%')
    expect(await color('BETA')).not.toBe(await color('ALFA'))
    await expect(reader.getByRole('region', { name: '要点' }).locator('li')).toHaveCount(3)
    for (const name of ['复制链接', '举报', '关闭']) await expect(reader.getByRole('button', { name })).toBeVisible()
  })

  test(`品种概览：业绩条点一格选中并回调，涨跌幅按涨跌上色，过千写 K% · ${theme}`, async ({ page }) => {
    await open(page, theme, 'performance-strip')
    const strip = section(page, 'performance-strip').locator('[data-slot="performance-strip"]')
    const cells = strip.locator('[data-slot="performance-cell"]')
    await expect(cells).toHaveCount(10)
    await expect(cells.nth(8).locator('.k-perf-value')).toHaveText('+1.84K%')
    await expect(cells.nth(9).locator('.k-perf-value')).toHaveText('+142.60K%')
    const up = await token(page, '--pnl-up')
    const down = await token(page, '--pnl-down')
    expect(await colorAt(page, cells.nth(0).locator('.k-perf-value'), 'color')).toEqual(await rgba(page, up))
    expect(await colorAt(page, cells.nth(1).locator('.k-perf-value'), 'color')).toEqual(await rgba(page, down))
    // 十格排成一行、互不重叠（放不下就横向滚，不挤在一起）。
    const boxes = await cells.evaluateAll((nodes) =>
      nodes.map((n) => {
        const r = n.getBoundingClientRect()
        return [Math.round(r.x), Math.round(r.right), Math.round(r.y)]
      }),
    )
    boxes.forEach((b, i) => {
      expect(b[2]).toBe(boxes[0]![2])
      if (i > 0) expect(b[0]).toBeGreaterThanOrEqual(boxes[i - 1]![1] - 1)
    })
    // 点「1 month」：回调（output 变）、aria-pressed 换到它、底色变灰。
    await expect(cells.nth(6)).toHaveAttribute('aria-pressed', 'true')
    const idle = await bg(cells.nth(2))
    await cells.nth(2).click()
    await expect(section(page, 'performance-strip').locator('[data-gallery-picked]')).toHaveText('区间：1m')
    await expect(cells.nth(2)).toHaveAttribute('aria-pressed', 'true')
    await expect(cells.nth(6)).toHaveAttribute('aria-pressed', 'false')
    await expect.poll(() => bg(cells.nth(2))).not.toBe(idle)
  })

  test(`品种概览：同业卡翻页箭头真的滚动、到头变灰，「+」与对比按钮回调，名称截断 · ${theme}`, async ({ page }) => {
    await open(page, theme, 'peer-cards')
    const demo = section(page, 'peer-cards')
    const rail = demo.getByRole('list', { name: 'Peers' })
    const prev = demo.locator('[data-slot="peer-prev"]')
    const next = demo.locator('[data-slot="peer-next"]')
    await expect(demo.locator('[data-slot="peer-card"]')).toHaveCount(7)
    await expect(prev).toBeDisabled()
    await expect(next).toBeEnabled()
    await next.click()
    await expect.poll(() => rail.evaluate((n) => n.scrollLeft)).toBeGreaterThan(50)
    await expect(prev).toBeEnabled()
    for (let i = 0; i < 6; i += 1) await next.click({ timeout: 1500 }).catch(() => {}) // 滚到头就变灰，点不动是对的
    await expect(next).toBeDisabled()
    await prev.click()
    await expect(next).toBeEnabled()
    // 回到头，再看卡片内容：名称被截断（scrollWidth 大于 clientWidth），涨跌幅上色。
    for (let i = 0; i < 8; i += 1) await prev.click({ timeout: 1500 }).catch(() => {})
    await expect(prev).toBeDisabled()
    const card = demo.locator('[data-key="BRV"]')
    const name = card.locator('.k-peers-name')
    expect(await name.evaluate((n) => n.scrollWidth > n.clientWidth)).toBe(true)
    expect(await colorAt(page, card.locator('.k-peers-change'), 'color')).toEqual(
      await rgba(page, await token(page, '--pnl-down')),
    )
    await card.getByRole('button', { name: 'Add BRV to compare' }).click()
    await expect(demo.locator('[data-gallery-picked]')).toHaveText('add BRV')
    await demo.locator('[data-slot="peer-compare"]').click()
    await expect(demo.locator('[data-gallery-picked]')).toHaveText('compare')
  })

  test(`品种概览：关键数据三列，标签可点，徽标是中性胶囊，没有值写「—」 · ${theme}`, async ({ page }) => {
    await open(page, theme, 'key-stats')
    const demo = section(page, 'key-stats')
    // 限定在静态示例里：页尾还有一块实时刷新的示例，也有 key-stat。
    const items = demo.locator('[data-gallery-keystats] [data-slot="key-stat"]')
    await expect(items).toHaveCount(6)
    const xs = await items.evaluateAll((nodes) => nodes.map((n) => Math.round(n.getBoundingClientRect().x)))
    expect(new Set(xs).size, '三列').toBe(3)
    await expect(items.nth(5).locator('.k-keystats-value')).toHaveText('—')
    const badge = items.nth(0).locator('.k-keystats-badge')
    await expect(badge).toHaveText('Mega cap')
    expect(await badge.evaluate((n) => getComputedStyle(n).textTransform)).toBe('uppercase')
    // 中性：徽标底色不是涨跌色。
    const badgeBg = await bg(badge)
    expect(badgeBg).not.toBe(await token(page, '--pnl-up'))
    await items
      .nth(1)
      .getByRole('button', { name: /Price to earnings/ })
      .click()
    await expect(demo.locator('[data-gallery-picked]')).toHaveText('pe')
    await demo.getByRole('button', { name: /Key stats/ }).click()
    await expect(demo.locator('[data-gallery-picked]')).toHaveText('title')
  })

  test(`品种概览：区间条三角标随现价移动，比较条两条按比例 · ${theme}`, async ({ page }) => {
    await open(page, theme, 'range-bar')
    const day = page.locator('[data-gallery-range="tv"] [role="meter"]').first()
    await expect(day).toHaveAttribute('data-marker', 'triangle')
    const where = async () => {
      const track = (await day.locator('.k-range-track').boundingBox())!
      const mark = (await day.locator('[data-slot="range-mark"]').boundingBox())!
      return (mark.x + mark.width / 2 - track.x) / track.width
    }
    await expect.poll(where, { timeout: 3000 }).toBeCloseTo((212.4 - 209.1) / (214.8 - 209.1), 1)
    await page.locator('[data-gallery-range-set="low"]').click()
    await expect.poll(where, { timeout: 3000 }).toBeCloseTo(0, 1)
    await page.locator('[data-gallery-range-set="high"]').click()
    await expect.poll(where, { timeout: 3000 }).toBeCloseTo(1, 1)
    // 三角在轨道下方：标记的上沿不高于轨道。
    const track = (await day.locator('.k-range-track').boundingBox())!
    const mark = (await day.locator('[data-slot="range-mark"]').boundingBox())!
    expect(mark.y).toBeGreaterThanOrEqual(track.y)
    expect(mark.height).toBeGreaterThan(4)
    await expect(page.locator('[data-gallery-range="tv"]').getByText("Day's range", { exact: true })).toBeVisible()
    // 比较条：成交量 59.2 / 74.6，宽度比对得上。
    const fills = page.locator('[data-gallery-compare] [data-slot="compare-fill"]')
    const [a, b] = await fills.evaluateAll((nodes) => nodes.map((n) => n.getBoundingClientRect().width))
    expect(a! / b!).toBeCloseTo(59.2 / 74.6, 1)
  })

  test(`品种概览：自选列表点列头排序（升、降、原顺序），价格变动只有变了的尾数闪涨跌色并落回 · ${theme}`, async ({
    page,
  }) => {
    await open(page, theme, 'watchlist')
    const demo = section(page, 'watchlist')
    const codes = () => demo.locator('[data-slot="watch-row"] .k-watch-code').allTextContents()
    expect(await codes()).toEqual(['AAA', 'BRV', 'CHL', 'DLT', 'ECH'])
    const sortBtn = (key: string) => demo.locator(`[data-slot="watch-sort"][data-key="${key}"]`)
    await sortBtn('last').click()
    expect(await codes()).toEqual(['ECH', 'DLT', 'AAA', 'CHL', 'BRV'])
    await expect(sortBtn('last').locator('xpath=ancestor::th')).toHaveAttribute('aria-sort', 'ascending')
    await sortBtn('last').click()
    expect(await codes()).toEqual(['BRV', 'CHL', 'AAA', 'DLT', 'ECH'])
    await sortBtn('last').click()
    expect(await codes()).toEqual(['AAA', 'BRV', 'CHL', 'DLT', 'ECH'])
    await sortBtn('chgPct').click()
    expect(await codes()).toEqual(['BRV', 'DLT', 'AAA', 'CHL', 'ECH'])
    // 闪色：AAA 212.40 → 212.46，只有末位「6」带 data-flash=up、是共用层的 .k-live-flash，头部不是；闪完（600ms）标记自己摘掉。
    const up = await rgba(page, await token(page, '--pnl-up'))
    const down = await rgba(page, await token(page, '--pnl-down'))
    const aaa = demo.locator('[data-key="a"] [data-slot="watch-last"]')
    await expect(aaa).toHaveText('212.40')
    await demo.locator('[data-gallery-tick]').click()
    const flash = aaa.locator('[data-slot="watch-flash"]')
    await expect(flash).toHaveText('6')
    await expect(flash).toHaveAttribute('data-flash', 'up')
    await expect(flash).toHaveClass(/k-live-flash/)
    // 起点是涨色的弱化档：停在 0 处读那一帧的底色，rgb 是涨色、带透明度（比涨色本身淡）；字色不动。
    const first = await flash.evaluate((n) => {
      const a = n.getAnimations()[0]!
      a.pause()
      a.currentTime = 0
      return {
        name: (a as CSSAnimation).animationName,
        ms: Number(a.effect!.getComputedTiming().duration),
        bg: getComputedStyle(n).backgroundColor,
      }
    })
    expect(first.name).toBe('k-live-flash')
    expect(first.ms).toBe(600)
    const [r, g, b, alpha] = await rgba(page, first.bg)
    // 带透明度的色画进 8 位画布再取回，rgb 会有几个单位的量化误差。
    expect(Math.max(...[r, g, b].map((v, i) => Math.abs((v as number) - (up[i] as number))))).toBeLessThanOrEqual(8)
    expect(alpha as number).toBeGreaterThan(0)
    expect(alpha as number).toBeLessThan(0.5)
    await expect(flash).toHaveCount(0, { timeout: 3000 })
    // 下跌：BRV 1,044.10 → 1043.90 两种格式不同长度也只闪变了的尾部，用跌色。
    // 1 秒节流是按行各自算的（BRV 这一行第一次变），所以不受上一下的影响。
    await demo.locator('[data-gallery-tick-down]').click()
    const brv = demo.locator('[data-key="b"] [data-slot="watch-flash"]')
    await expect(brv).toHaveAttribute('data-flash', 'down')
    const fromDown = await brv.evaluate((n) => {
      const a = n.getAnimations()[0]!
      a.pause()
      a.currentTime = 0
      return getComputedStyle(n).backgroundColor
    })
    const dn = await rgba(page, fromDown)
    expect(Math.max(...[0, 1, 2].map((i) => Math.abs((dn[i] as number) - (down[i] as number))))).toBeLessThanOrEqual(8)
    // 旗标：点一下翻转。
    const flag = demo.locator('[data-key="b"] [data-slot="watch-flag"]')
    await flag.click({ force: true })
    await expect(flag).toHaveAttribute('aria-pressed', 'true')
  })

  test(`live 数据刷新：步进后价格闪涨跌色、新行高亮、炸板警示闪、行按涨幅换位（FLIP）；涨跌色跟「涨跌颜色」互换 · ${theme}`, async ({
    page,
  }) => {
    await open(page, theme, 'live')
    const area = section(page, 'live')
    const table = area.locator('[data-slot="live-table"]')
    // 自动化浏览器里模拟器默认暂停（e2e 不靠等待）：用手动步进钩子推。
    await expect(area.getByRole('button', { name: '暂停' })).toHaveAttribute('aria-pressed', 'true')
    await expect(table.locator('[data-live-id]')).toHaveCount(5)
    const seen = await page.evaluate(async () => {
      const root = document.querySelector('[data-gallery="live"] [data-slot="live-table"]')!
      const rows = () => [...root.querySelectorAll<HTMLElement>('[data-live-id]')]
      const order = () =>
        rows()
          .map((row) => row.dataset.liveId)
          .join(',')
      const frame = () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
      const out = {
        flash: '',
        flashName: '',
        enter: false,
        enterName: '',
        alert: false,
        alertDuration: '',
        reordered: false,
        animated: false,
      }
      for (let i = 0; i < 80 && !(out.flash && out.enter && out.alert && out.animated); i += 1) {
        const before = order()
        window.__liveStep!()
        await frame()
        const flashing = root.querySelector<HTMLElement>('[data-slot="live-price"][data-flash]')
        if (flashing && !out.flash) {
          out.flash = flashing.dataset.flash!
          out.flashName = getComputedStyle(flashing).animationName
        }
        const entering = root.querySelector<HTMLElement>('.k-live-enter')
        if (entering && !out.enter) {
          out.enter = true
          out.enterName = getComputedStyle(entering).animationDuration
        }
        const alerting = root.querySelector<HTMLElement>('.k-live-alert')
        if (alerting && !out.alert) {
          out.alert = true
          out.alertDuration = getComputedStyle(alerting).animationName
        }
        if (order() !== before) {
          out.reordered = true
          const moved = rows().flatMap((row) => row.getAnimations())
          if (
            moved.some((a) => String((a.effect as KeyframeEffect).getKeyframes()[0]?.transform).startsWith('translate'))
          )
            out.animated = true
        }
      }
      return out
    })
    expect(seen.flash, '价格变了有 data-flash').toMatch(/^(up|down)$/)
    expect(seen.flashName).toBe('k-live-flash')
    expect(seen.enter, '来过新行，带 .k-live-enter').toBe(true)
    expect(seen.enterName, '新行高亮时长是 --dur-enter').toBe('1.2s')
    expect(seen.alert, '有行变成炸板，带 .k-live-alert').toBe(true)
    expect(seen.alertDuration).toBe('k-live-alert')
    expect(seen.reordered, '行按涨幅换过位').toBe(true)
    expect(seen.animated, '换位的行上有 transform 动画（FLIP）').toBe(true)
    // 涨跌色互换：红涨绿跌时 up 的闪色取的是互换后的 --pnl-up。
    await page.evaluate(() => document.documentElement.setAttribute('data-updown', 'cn'))
    const mix = await page.evaluate(async () => {
      for (let i = 0; i < 40; i += 1) {
        window.__liveStep!()
        await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
        const cell = document.querySelector<HTMLElement>(
          '[data-gallery="live"] [data-slot="live-price"][data-flash="up"]',
        )
        if (cell) {
          const a = cell.getAnimations()[0]!
          a.pause()
          a.currentTime = 0
          return getComputedStyle(cell).backgroundColor
        }
      }
      return ''
    })
    expect(mix).not.toBe('')
    const upNow = await rgba(page, await token(page, '--pnl-up'))
    const got = await rgba(page, mix)
    expect(Math.max(...[0, 1, 2].map((i) => Math.abs((got[i] as number) - (upNow[i] as number))))).toBeLessThanOrEqual(
      8,
    )
    // 打开实时：不步进，过一阵价格自己变。
    await page.evaluate(() => document.documentElement.removeAttribute('data-updown'))
    const price = () => table.locator('[data-slot="live-price"]').allTextContents()
    const before = await price()
    await area.getByRole('button', { name: '实时' }).click()
    await expect(area.getByRole('button', { name: '实时' })).toHaveAttribute('aria-pressed', 'true')
    await expect.poll(price, { timeout: 5000 }).not.toEqual(before)
    await area.getByRole('button', { name: '暂停' }).click()
  })

  // ---- 打板与行情表的实时刷新（LimitLadder、DataGrid、QuoteTable、Watchlist、TechnicalRating）：window.__liveStep 步进，推进后等两个 rAF 再断言 ----
  test(`连板天梯 LimitLadder 实时刷新：封单额变了闪、炸板行琥珀警示、回封闪涨色、升板整行移到新层且有位移动画并闪涨色、新首板蓝线高亮、汇总读数滚动 · ${theme}`, async ({
    page,
  }) => {
    await open(page, theme, 'limit-ladder')
    const area = section(page, 'limit-ladder')
    await expect(area.getByRole('button', { name: '暂停' })).toHaveAttribute('aria-pressed', 'true')
    await expect(area.locator('[data-slot="ladder-row"]')).toHaveCount(10)
    const seen = await page.evaluate(async () => {
      const root = document.querySelector('[data-gallery="limit-ladder"] [data-slot="limit-ladder"]')!
      const rows = () => [...root.querySelectorAll<HTMLElement>('[data-slot="ladder-row"]')]
      const boardOf = () =>
        new Map(rows().map((row) => [row.dataset.code!, row.closest<HTMLElement>('[data-board]')!.dataset.board!]))
      const frame = () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
      const out = {
        seal: '',
        sealName: '',
        alert: '',
        alertName: '',
        resealed: false,
        promoted: false,
        promotedInNewTier: false,
        promotedAnimated: false,
        promotedFlash: '',
        enter: false,
        enterTier: '',
        summary: false,
      }
      for (let i = 0; i < 150 && !(out.seal && out.alert && out.resealed && out.promoted && out.enter); i += 1) {
        const before = boardOf()
        window.__liveStep!()
        await frame()
        const seal = root.querySelector<HTMLElement>('[data-slot="ladder-seal"][data-flash]')
        if (seal && !out.seal) {
          out.seal = seal.dataset.flash!
          out.sealName = getComputedStyle(seal).animationName
        }
        const alert = root.querySelector<HTMLElement>('[data-slot="ladder-row"].k-live-alert')
        if (alert && !out.alert) {
          out.alert = alert.dataset.status!
          out.alertName = getComputedStyle(alert).animationName
        }
        const reseal = root.querySelector<HTMLElement>(
          '[data-slot="ladder-row"][data-status="sealed"][data-flash="up"]',
        )
        if (reseal) out.resealed = true
        const enter = root.querySelector<HTMLElement>('[data-slot="ladder-row"].k-live-enter')
        if (enter && !out.enter) {
          out.enter = true
          out.enterTier = enter.closest<HTMLElement>('[data-board]')!.dataset.board!
        }
        for (const [code, board] of boardOf()) {
          const was = before.get(code)
          if (was === undefined || Number(board) <= Number(was) || out.promoted) continue
          out.promoted = true
          const row = root.querySelector<HTMLElement>(`[data-code="${code}"]`)!
          out.promotedInNewTier = row.closest<HTMLElement>('[data-board]')!.dataset.board === board
          out.promotedAnimated = row
            .getAnimations()
            .some((a) => String((a.effect as KeyframeEffect).getKeyframes()[0]?.transform).startsWith('translate'))
          out.promotedFlash = `${row.dataset.flash}|${row.className}`
        }
        if (root.querySelector('[data-slot="ladder-summary"] .k-roll')) out.summary = true
      }
      return out
    })
    expect(seen.seal, '封单额变了有 data-flash').toMatch(/^(up|down)$/)
    expect(seen.sealName).toBe('k-live-flash')
    expect(['broken', 'down']).toContain(seen.alert)
    expect(seen.alertName, '炸板行用共用层的警示闪').toBe('k-live-alert')
    expect(seen.resealed, '回封的行闪涨色').toBe(true)
    expect(seen.promoted, '碰到过升板').toBe(true)
    expect(seen.promotedInNewTier, '升板后行出现在新层').toBe(true)
    expect(seen.promotedAnimated, '升板的行上有位移动画（FLIP）').toBe(true)
    expect(seen.promotedFlash).toContain('up|')
    expect(seen.promotedFlash).toContain('k-live-flash')
    expect(seen.enter, '来过新首板').toBe(true)
    expect(seen.enterTier, '新首板落在 1 板层').toBe('1')
    expect(seen.summary, '汇总读数是滚动的数字').toBe(true)
  })

  test(`数据表 DataGrid live：数值格值变了 data-flash、文本列不闪、按涨跌幅排序时行换位（有位移动画）、新增行高亮；不开 live 的表不闪 · ${theme}`, async ({
    page,
  }) => {
    await open(page, theme, 'data-grid')
    const frame = page.locator('[data-testid="grid-live"]')
    await expect(frame.locator('[data-row]')).toHaveCount(6)
    const seen = await page.evaluate(async () => {
      const root = document.querySelector('[data-testid="grid-live"]')!
      const order = () =>
        [...root.querySelectorAll<HTMLElement>('[data-row]')]
          .sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top)
          .map((row) => row.dataset.row)
          .join(',')
      const tick = () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
      const out = {
        cols: new Set<string>(),
        textFlash: false,
        reordered: false,
        animated: false,
        enter: false,
        name: '',
      }
      for (let i = 0; i < 80 && !(out.reordered && out.animated && out.enter); i += 1) {
        const before = order()
        window.__liveStep!()
        await tick()
        for (const cell of root.querySelectorAll<HTMLElement>('[data-col][data-flash]')) {
          out.cols.add(`${cell.dataset.col}:${cell.dataset.flash}`)
          out.name = getComputedStyle(cell).animationName
        }
        if (root.querySelector('[data-col="code"][data-flash]')) out.textFlash = true
        if (root.querySelector('[data-row].k-live-enter')) out.enter = true
        if (order() !== before) {
          out.reordered = true
          const moved = [...root.querySelectorAll<HTMLElement>('[data-row]')].flatMap((row) => row.getAnimations())
          if (
            moved.some((a) => String((a.effect as KeyframeEffect).getKeyframes()[0]?.transform).startsWith('translate'))
          )
            out.animated = true
        }
      }
      return { ...out, cols: [...out.cols] }
    })
    const flashed = new Set(seen.cols.map((entry) => entry.split(':')[0]))
    expect([...flashed].sort(), '数值类的列闪').toEqual(expect.arrayContaining(['price', 'change']))
    expect(seen.cols.every((entry) => /:(up|down)$/.test(entry))).toBe(true)
    expect(seen.name).toBe('k-live-flash')
    expect(seen.textFlash, '文本列不闪').toBe(false)
    expect(seen.reordered, '行按涨跌幅换过位').toBe(true)
    expect(seen.animated, '换位的行上有 transform 动画（FLIP）').toBe(true)
    expect(seen.enter, '新增过一行，带 .k-live-enter').toBe(true)
    // 没开 live 的另一张表（示例数据）：步进不会让它闪。
    await expect(page.locator('[data-testid="grid-demo"] [data-flash]')).toHaveCount(0)
  })

  test(`报价表 QuoteTable 实时刷新：价格与涨跌幅变了闪、第一组按涨跌幅换位（有位移动画）、第二组新行高亮（<tr> 上的蓝线真的画出来） · ${theme}`, async ({
    page,
  }) => {
    await open(page, theme, 'quote-table')
    const table = page.locator('[data-gallery-qtable]')
    const first = await page.evaluate(async () => {
      const root = document.querySelector('[data-gallery-qtable]')!
      const names = () => [...root.querySelectorAll('tbody tr th')].map((n) => n.textContent).join(',')
      const tick = () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
      const out = { flash: '', name: '', reordered: false, animated: false }
      for (let i = 0; i < 60 && !(out.flash && out.animated); i += 1) {
        const before = names()
        window.__liveStep!()
        await tick()
        const cell = root.querySelector<HTMLElement>('tbody td[data-flash]')
        if (cell && !out.flash) {
          out.flash = cell.dataset.flash!
          out.name = getComputedStyle(cell).animationName
        }
        if (names() !== before) {
          out.reordered = true
          const moved = [...root.querySelectorAll<HTMLElement>('tbody tr')].flatMap((row) => row.getAnimations())
          if (
            moved.some((a) => String((a.effect as KeyframeEffect).getKeyframes()[0]?.transform).startsWith('translate'))
          )
            out.animated = true
        }
      }
      return out
    })
    expect(first.flash).toMatch(/^(up|down)$/)
    expect(first.name).toBe('k-live-flash')
    expect(first.reordered, '第一组行换过位').toBe(true)
    expect(first.animated, '换位的行上有 transform 动画').toBe(true)
    // 第二组：切过去再步进，新来的行带 .k-live-enter，<tr> 上的 inset 阴影（蓝线）算得出来。
    await table.getByRole('tab', { name: '示例二组' }).click()
    const entered = await page.evaluate(async () => {
      for (let i = 0; i < 80; i += 1) {
        window.__liveStep!()
        await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
        const row = document.querySelector<HTMLElement>('[data-gallery-qtable] tbody tr.k-live-enter')
        if (row) return { shadow: getComputedStyle(row).boxShadow, name: getComputedStyle(row).animationName }
      }
      return null
    })
    expect(entered, '来过新行').not.toBeNull()
    expect(entered!.name).toBe('k-live-enter')
    expect(entered!.shadow).toContain('inset')
  })

  test(`自选 Watchlist 实时刷新：按涨跌幅排序后价格变了行换位（有位移动画）、新来的行蓝线高亮、涨跌幅闪 · ${theme}`, async ({
    page,
  }) => {
    await open(page, theme, 'watchlist')
    const demo = section(page, 'watchlist')
    await demo.locator('[data-slot="watch-sort"][data-key="chgPct"]').click()
    const seen = await page.evaluate(async () => {
      const root = document.querySelector('[data-gallery="watchlist"]')!
      const codes = () =>
        [...root.querySelectorAll('[data-slot="watch-row"] .k-watch-code')].map((n) => n.textContent).join()
      const tick = () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
      const out = { reordered: false, animated: false, enter: '', pct: '' }
      for (let i = 0; i < 100 && !(out.animated && out.enter && out.pct); i += 1) {
        const before = codes()
        window.__liveStep!()
        await tick()
        const row = root.querySelector<HTMLElement>('tr.k-live-enter')
        if (row && !out.enter) out.enter = getComputedStyle(row).boxShadow
        const pct = root.querySelector<HTMLElement>('[data-slot="change-text"][data-flash]')
        if (pct && !out.pct) out.pct = pct.dataset.flash!
        if (codes() !== before) {
          out.reordered = true
          const moved = [...root.querySelectorAll<HTMLElement>('tr[data-live-id]')].flatMap((r) => r.getAnimations())
          if (
            moved.some((a) => String((a.effect as KeyframeEffect).getKeyframes()[0]?.transform).startsWith('translate'))
          )
            out.animated = true
        }
      }
      return out
    })
    expect(seen.reordered, '排序下价格变了行换过位').toBe(true)
    expect(seen.animated, '换位的行上有 transform 动画').toBe(true)
    expect(seen.enter, '新行带 inset 蓝线').toContain('inset')
    expect(seen.pct).toMatch(/^(up|down)$/)
  })

  test(`技术评级 TechnicalRating 实时刷新：评级变了档位与单项结论闪（升涨色、降跌色），个数变了闪 · ${theme}`, async ({
    page,
  }) => {
    await open(page, theme, 'technical-rating')
    const seen = await page.evaluate(async () => {
      const root = document.querySelector('[data-gallery="technical-rating"]')!
      const tick = () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
      const out = { verdict: '', word: '', count: '', name: '' }
      for (let i = 0; i < 120 && !(out.verdict && out.count); i += 1) {
        window.__liveStep!()
        await tick()
        const verdict = root.querySelector<HTMLElement>('[data-slot="rating-verdict"][data-flash]')
        if (verdict && !out.verdict) {
          out.verdict = verdict.dataset.flash!
          out.name = getComputedStyle(verdict).animationName
        }
        const word = root.querySelector<HTMLElement>('[data-slot="rating-word"][data-flash]')
        if (word && !out.word) out.word = word.dataset.flash!
        const count = root.querySelector<HTMLElement>('[data-slot="rating-counts"] b[data-flash]')
        if (count && !out.count) out.count = count.dataset.flash!
      }
      return out
    })
    expect(seen.verdict, '单项结论变了闪').toMatch(/^(up|down)$/)
    expect(seen.name).toBe('k-live-flash')
    expect(seen.count, '买 / 卖个数变了闪').toMatch(/^(up|down)$/)
  })
}

// 属性表读生成的数据、每页有「用法」（#1902）。

test('每一页的「用法」：最小例子渲染出来，下面是它的源码', async ({ page }) => {
  // 页数已过 230（含动效、AI 两组），逐页打开远超默认 30 秒；只放宽总时限，每页的断言不变。
  test.setTimeout(600_000)
  for (const doc of PAGES) {
    await page.goto(`/#/${doc.id}`)
    const usage = page.locator('[data-usage]')
    await expect(usage.getByRole('heading', { name: '用法' })).toBeVisible()
    const live = usage.locator('[data-usage-live]')
    // 一个用例连开 120 多页，并发跑时重的图（如 ridgeline）首帧可能超过默认 5 秒：放宽等待，断言不变。
    await expect(live, `${doc.id} 的用法例子`).toBeVisible({ timeout: 15_000 })
    expect((await live.boundingBox())!.height, `${doc.id} 的用法例子有高度`).toBeGreaterThan(20)
    await expect(usage.locator('[data-usage-code] [data-slot="code-block-pre"]')).toContainText('@katana-ui/react')
    await expect(usage.getByRole('button', { name: '复制用法代码' })).toBeVisible()
  }
})

test('复制用法：剪贴板里是那个例子文件的源码（引包名），提示换成「已复制」再复原', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.goto('/#/button')
  const usage = page.locator('[data-usage]')
  const copy = usage.getByRole('button', { name: '复制用法代码' })
  await copy.click()
  await expect(page.getByRole('tooltip').or(page.locator('[data-slot="tooltip-content"]')).first()).toHaveText('已复制')
  const text = await page.evaluate(() => navigator.clipboard.readText())
  const file = readFileSync('gallery/usage/ButtonUsage.tsx', 'utf8')
  expect(text).toBe(file.replace(/'\.\.\/\.\.\/src\/index'/, "'@katana-ui/react'").trimEnd())
  expect(text).toContain("import { Button } from '@katana-ui/react'")
  expect(text).not.toMatch(/\.\.\/\.\.\/src/)
  await expect(copy).not.toHaveAttribute('data-copied', '', { timeout: 6000 })
})

test('属性表：Button 页的行就是 TS 类型生成的（名、类型、默认值、必填标记、英文说明），不列继承来的 button 属性', async ({
  page,
}) => {
  await page.goto('/#/button')
  await docTab(page, '属性')
  const table = page.locator('[data-part="Button"] table')
  const generated = propsGenerated.exports.Button.props
  await expect(table.locator('tbody tr')).toHaveCount(generated.length)
  for (const prop of generated) {
    const row = table
      .locator('tbody tr')
      .filter({ has: page.locator('td:first-child code', { hasText: new RegExp(`^${prop.name}$`) }) })
    await expect(row.locator('td').nth(3)).toHaveText(prop.description)
    await expect(row.locator('td').nth(2)).toHaveText(prop.default ?? '—')
  }
  await expect(table.locator('td:first-child code', { hasText: /^onClick$/ })).toHaveCount(0)
  // 必填的属性带星号：MultiSelect 的 values 必填，label 可选。
  await page.goto('/#/multi-select')
  await docTab(page, '属性')
  const values = page.locator('[data-part="MultiSelect"] tbody tr').filter({ hasText: 'Ids of the selected options.' })
  await expect(values.locator('abbr[title="必填"]')).toHaveCount(1)
  const label = page
    .locator('[data-part="MultiSelect"] tbody tr')
    .filter({ hasText: 'Accessible name of the trigger.' })
  await expect(label.locator('abbr')).toHaveCount(0)
})

test('A2UI 目录：智能体的消息渲染成 KatanaUI 的件，点「接受」后宿主收到 Action', async ({ page }) => {
  await page.goto('/#/a2ui-catalog')
  await page.locator('[data-gallery="a2ui-catalog"]').waitFor()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('A2UI 目录')
  // 左边是消息 JSON（只读代码块），里面写着目录 id 与三种消息。
  const json = page.getByTestId('a2ui-json')
  await expect(json).toContainText('createSurface')
  await expect(json).toContainText('updateComponents')
  await expect(json).toContainText('updateDataModel')
  await expect(json).toContainText('https://xartlab.github.io/KatanaUI/a2ui/katana/v1.json')
  // 右边渲染出建议卡、两个读数、盈亏与两个按钮；绑定的文字来自数据模型。
  const surface = page.getByTestId('a2ui-surface')
  await expect(surface.getByText('Buy ACME 600001, 3% of the book')).toBeVisible()
  await expect(surface.locator('[data-slot="metric-card"], .k-metric').first()).toBeVisible()
  await expect(surface.getByText('VIX', { exact: true })).toBeVisible()
  await expect(surface.getByText('Basis', { exact: true })).toBeVisible()
  await expect(surface.locator('[data-slot="pnl-text"]')).toContainText('+1,240.50 USDT')
  await expect(surface.locator('[data-slot="pnl-text"]')).toHaveAttribute('data-tone', 'up')
  await expect(surface.locator('[data-slot="change-text"]').first()).toContainText('+2.31%')
  const host = page.getByTestId('a2ui-host')
  await expect(host).toContainText('Host received nothing yet')
  await surface.getByRole('button', { name: 'Reject' }).click()
  await expect(host).toContainText('Host received suggestion.reject')
  await expect(host).toContainText('{"suggestionId":"sg-1"}')
  // 点「接受」：宿主收到 suggestion.accept，context 里的 symbol 是从数据模型读出来的。
  await surface.getByRole('button', { name: 'Accept' }).click()
  await expect(host).toContainText('Host received suggestion.accept')
  await expect(host).toContainText('"symbol":"600001"')
  // 已登记组件表读目录 JSON：每个 Katana 件一行，另有一行排版件；行数跟目录 JSON 对齐（表由目录生成，不能漏件）。
  const table = page.getByTestId('a2ui-components')
  const katanaCount = Object.keys(
    (
      JSON.parse(readFileSync(new URL('../public/a2ui/katana/v1.json', import.meta.url), 'utf8')) as {
        components: Record<string, unknown>
      }
    ).components,
  ).filter((name) => name.startsWith('Katana')).length
  await expect(table.locator('tbody tr')).toHaveCount(katanaCount + 1)
  await expect(table.locator('tbody tr', { hasText: 'KatanaDataGrid' })).toContainText('onRowClick')
  await expect(table.locator('tbody tr', { hasText: 'KatanaDecisionQueue' })).toContainText('onAccept')
})

test('A2UI 目录：积木与布局 surface 渲染出面板壳、数据表与任务清单，点一行宿主收到 Action', async ({ page }) => {
  await page.goto('/#/a2ui-catalog')
  await page.locator('[data-gallery="a2ui-catalog"]').waitFor()
  await page.getByText('Blocks and layout: a panel frame', { exact: false }).click()
  const blocks = page.getByTestId('a2ui-blocks')
  await expect(blocks.getByRole('heading', { name: '今日概览' })).toBeVisible()
  await expect(blocks.locator('[data-slot="metric-value"]')).toContainText('+1,240.50')
  const grid = blocks.getByRole('grid', { name: /持仓/ })
  await expect(grid).toBeVisible()
  await expect(grid.getByText('BTCUSDT')).toBeVisible()
  await expect(blocks.getByRole('checkbox')).toHaveCount(3)
  await blocks.getByRole('checkbox', { name: '读完 ACME 的年报' }).click()
  await expect(page.getByTestId('a2ui-host')).toContainText('Host received task.toggle')
  await grid.getByText('ETHUSDT').click()
  await expect(page.getByTestId('a2ui-host')).toContainText('Host received row.open')
})

test('A2UI 目录：读数与状态 surface 渲染出灯、读数、仪表、同业与状态带，点同业卡宿主收到 Action', async ({ page }) => {
  await page.goto('/#/a2ui-catalog')
  await page.locator('[data-gallery="a2ui-catalog"]').waitFor()
  await page.getByText('Readouts: lights, readings', { exact: false }).click()
  const readouts = page.getByTestId('a2ui-readouts')
  await expect(readouts.getByRole('img', { name: 'Market feed: connected' })).toBeVisible()
  await expect(readouts.getByText('NET ASSET')).toBeVisible()
  await expect(readouts.getByRole('meter', { name: 'Exposure' })).toBeVisible()
  await expect(readouts.locator('[data-slot="rating-text"]')).toContainText('Buy')
  await expect(readouts.locator('[data-slot="key-stats"]')).toContainText('MEGA CAP')
  await expect(readouts.getByRole('group', { name: 'Order flow' })).toContainText('N/A')
  // 点业绩条的一格：选中态写回数据模型，宿主收到 range.select。
  await readouts.locator('[data-slot="performance-cell"][data-key="1y"]').click()
  await expect(readouts.locator('[data-slot="performance-cell"][data-key="1y"]')).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  await expect(page.getByTestId('a2ui-host')).toContainText('Host received range.select')
  await readouts.locator('[data-slot="peer-card"][data-key="p2"] .k-peers-main').click()
  await expect(page.getByTestId('a2ui-host')).toContainText('Host received peer.select')
  // 点状态带图例：高亮一个状态。
  const pick = readouts.locator('.k-regime-legend button').first()
  await pick.click()
  await expect(pick).toHaveAttribute('aria-pressed', 'true')
})

test('A2UI 目录：图表 surface 渲染权益曲线、归因、可用率与矩形树图，点格子宿主收到 Action', async ({ page }) => {
  await page.goto('/#/a2ui-catalog')
  await page.locator('[data-gallery="a2ui-catalog"]').waitFor()
  await page.getByText('Charts: equity curve', { exact: false }).click()
  const charts = page.getByTestId('a2ui-charts')
  await expect(charts.locator('[data-slot="equity-curve"]')).toBeVisible()
  await expect(charts.getByRole('group', { name: 'Chart tools' }).first()).toBeVisible()
  await expect(charts.getByText('Account equity')).toBeVisible()
  // 点可用率条的一格、矩形树图的一格：宿主收到 Action。
  await charts.getByLabel('Nov 5: outage, 2 gaps').first().click()
  await expect(page.getByTestId('a2ui-host')).toContainText('Host received uptime.select')
  await charts.getByRole('button', { name: 'ACME +2.10%' }).click()
  await expect(page.getByTestId('a2ui-host')).toContainText('Host received treemap.select')
})

// 新闻与事件的实时刷新（共用层 src/lib/live.ts）：自动化浏览器里模拟器默认暂停，用 window.__liveStep 推，推完等两个 rAF 再断言。
/** 推进前挂上：记下属性是否出现过。过场只有 240ms，机器忙时等到断言时可能已经播完，所以不按「此刻有没有」判断。 */
const watchAttr = (locator: Locator, name: string) =>
  locator.evaluate((el, attr) => {
    const host = el as Element & { __saw?: boolean }
    host.__saw = false
    new MutationObserver(() => {
      if (el.hasAttribute(attr)) host.__saw = true
    }).observe(el, { attributes: true, attributeFilter: [attr] })
  }, name)
const sawAttr = (locator: Locator) => locator.evaluate((el) => (el as Element & { __saw?: boolean }).__saw === true)
const liveStep = (page: Page, count = 1) =>
  page.evaluate(async (n) => {
    window.__liveStep!(n)
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
  }, count)

test('新闻流刷新（NewsFeed）：在顶部新条直接插入并高亮，卡片排法同样高亮', async ({ page }) => {
  await open(page, THEMES[0], 'news-feed')
  const doc = section(page, 'news-feed')
  const frame = doc.getByTestId('news-frame')
  const rows = frame.locator('.k-news-item')
  await expect(rows).toHaveCount(6)
  await expect(frame.locator('.k-live-enter')).toHaveCount(0)
  await liveStep(page)
  // 高亮只有 1.2 秒：推进后立刻在同一次读取里看列表与卡片两边，机器忙时也不会在断言之间摘掉。
  const marks = await doc.evaluate((root) => {
    const list = root.querySelectorAll('[data-testid="news-frame"] .k-news-item')
    const card = root.querySelectorAll('[data-testid="news-cards"] .k-news-item')
    const has = (el: Element | undefined) => el?.classList.contains('k-live-enter') ?? null
    return {
      count: list.length,
      list: [has(list[0]), has(list[1])],
      card: [has(card[0]), has(card[1])],
      duration: list[0] ? getComputedStyle(list[0]).animationDuration : '',
    }
  })
  expect(marks.count).toBe(7)
  expect(marks.list, '列表：首条高亮、第二条不').toEqual([true, false])
  expect(marks.card, '卡片：首条高亮、第二条不').toEqual([true, false])
  expect(marks.duration).toBe('1.2s')
  await expect(rows.first().locator('.k-news-title')).toContainText('演示')
  // 1.2 秒后高亮自己摘掉。
  await expect(rows.first()).not.toHaveClass(/k-live-enter/, { timeout: 3000 })
})

test('新闻流刷新（NewsFeed）：虚拟列表滚离顶部只计数、点了再合入并回顶；在顶部插入时看着的那条不动', async ({
  page,
}) => {
  await open(page, THEMES[0], 'news-feed')
  const doc = section(page, 'news-feed')
  const frame = doc.getByTestId('news-frame')
  await doc.getByTestId('news-many').click()
  const scroller = frame.locator('.k-news-scroll')
  await expect(frame.locator('[data-virtual]')).toHaveCount(1)
  // 整批换数据不算新消息：不高亮。
  await expect(frame.locator('.k-live-enter')).toHaveCount(0)
  await scroller.evaluate((el) => {
    el.scrollTop = 600
  })
  // 等件认定「已离开顶部」再推进，否则滚动事件还没处理完，新条会被当成在顶部直接插入。
  await expect(scroller).not.toHaveAttribute('data-at-top', /.*/)
  await expect(frame.locator('.k-news-item').first()).toBeVisible()
  await liveStep(page)
  const badge = frame.getByTestId('news-new')
  await expect(badge).toHaveText(/^\d+ 条新消息$/)
  await expect(frame.locator('[data-news-id^="live-"]')).toHaveCount(0)
  // 读屏播报只读条数。
  await expect(frame.locator('.k-news-live')).toHaveText((await badge.textContent())!)
  await badge.click()
  await expect.poll(() => scroller.evaluate((el) => el.scrollTop)).toBe(0)
  const first = frame.locator('.k-news-item').first()
  await expect(first).toHaveAttribute('data-news-id', /^live-/)
  await expect(first).toHaveClass(/k-live-enter/)
  await expect(badge).toHaveCount(0)
})

test('新闻流刷新（NewsFeed）：虚拟列表在顶部附近插入新行，滚动锚定让看着的那条不动', async ({ page }) => {
  await open(page, THEMES[0], 'news-feed')
  const doc = section(page, 'news-feed')
  const frame = doc.getByTestId('news-frame')
  await doc.getByTestId('news-many').click()
  const scroller = frame.locator('.k-news-scroll')
  await expect(frame.locator('[data-virtual]')).toHaveCount(1)
  await scroller.evaluate((el) => {
    el.scrollTop = 3
  })
  const rows = frame.locator('.k-news-item')
  const watched = rows.nth(1)
  await expect(watched).toBeVisible()
  const id = (await watched.getAttribute('data-news-id'))!
  const before = (await watched.boundingBox())!.y
  await liveStep(page)
  await expect(frame.locator('[data-news-id^="live-"]')).not.toHaveCount(0)
  const after = (await frame.locator(`[data-news-id="${id}"]`).boundingBox())!.y
  expect(Math.abs(after - before)).toBeLessThan(1.5)
})

test('阅读窗刷新（NewsReader）：被更新时标题亮一次蓝色提示并标「已更新」，读屏播报', async ({ page }) => {
  await open(page, THEMES[0], 'news-reader')
  const reader = section(page, 'news-reader').locator('[data-slot="news-reader"]')
  const title = reader.locator('[data-slot="news-reader-title"]')
  await expect(reader.locator('[data-slot="news-reader-updated"]')).toHaveCount(0)
  await liveStep(page)
  await expect(title).toHaveClass(/k-live-enter/)
  await expect(title).toContainText('更新 1')
  await expect(reader.locator('[data-slot="news-reader-updated"]')).toHaveText('已更新')
  await expect(reader.locator('.k-news-live')).toHaveText('已更新')
  // 在新闻流里同样：打开一条，被更新才闪；切到另一条不闪（重新挂载）。
  await open(page, THEMES[0], 'news-feed')
  const feed = section(page, 'news-feed').getByTestId('news-split').locator('.k-news')
  await feed.locator('.k-news-item').nth(1).locator('.k-news-title').click()
  const pane = feed.locator('[data-slot="news-reader-pane"]')
  await expect(pane.locator('[data-slot="news-reader-updated"]')).toHaveCount(0)
  await liveStep(page)
  await expect(pane.locator('[data-slot="news-reader-title"]')).toHaveClass(/k-live-enter/)
  await expect(pane.locator('[data-slot="news-reader-updated"]')).toHaveText('已更新')
  await feed.locator('.k-news-item').nth(2).locator('.k-news-title').click()
  await expect(pane.locator('[data-slot="news-reader-updated"]')).toHaveCount(0)
})

test('事件时间线刷新（EventTimeline）：新事件的标记高亮、事件数加一，「现在」线往前走', async ({ page }) => {
  await open(page, THEMES[0], 'event-timeline')
  const area = section(page, 'event-timeline')
  const lane = area.locator('.k-tl-lane').first()
  const total = area.locator('.k-tl-total').first()
  await expect(total).toHaveText('11 条')
  await expect(lane.locator('.k-live-enter')).toHaveCount(0)
  const nowLeft = () =>
    lane.locator('[data-slot="event-timeline-now"]').evaluate((el) => (el as HTMLElement).style.left)
  const before = parseFloat(await nowLeft())
  await liveStep(page)
  await expect(total).toHaveText('12 条')
  await expect(lane.locator('.k-tl-marker.k-live-enter')).toHaveCount(1)
  expect(parseFloat(await nowLeft())).toBeGreaterThan(before)
  await expect(lane.locator('.k-tl-marker.k-live-enter')).toHaveCount(0, { timeout: 3000 })
})

test('通知铃刷新（NotificationBell）：新通知来时铃的底色闪、未读数加一、列表新条高亮', async ({ page }) => {
  await open(page, THEMES[0], 'notification-bell')
  const live = section(page, 'notification-bell').getByTestId('bell-live')
  const bell = live.locator('[data-slot="notification-bell"]')
  await expect(bell).toHaveAccessibleName('实时提醒，0 条未读')
  await liveStep(page)
  await expect(bell).toHaveAccessibleName('实时提醒，1 条未读')
  await expect(bell.locator('[data-slot="notification-bell-flash"]')).toHaveAttribute('data-flash', 'up')
  const items = live.locator('[data-slot="live-notices"] li')
  await expect(items).toHaveCount(1)
  await expect(items.first()).toHaveClass(/k-live-enter/)
  // 全部已读：数归零，不闪。
  await live.getByRole('button', { name: '全部已读' }).click()
  await expect(bell).toHaveAccessibleName('实时提醒，0 条未读')
  await expect(bell.locator('[data-slot="notification-bell-flash"]')).not.toHaveAttribute('data-flash', 'up')
})

// ---- 读数与图表的实时刷新（MetricCard、QuoteCard、PriceTag、SparkTile、KeyStats、StatusBar、Lcd、Led、Sparkline、EquityCurve、Treemap、UptimeBars）：window.__liveStep 步进，推进后等两个 rAF 再断言 ----
const liveDemo = (page: Page, id: string) => page.locator(`[data-gallery-live="${id}"]`)
/** 折线（path）的有效点数：组件把它写在 data-points 上。 */
const pointCount = (line: Locator) => line.evaluate((el) => Number(el.getAttribute('data-points')))

test('读数刷新（MetricCard）：大号数值变了闪涨跌色，走势线新点进来时在延伸过场里，播完摘掉标记', async ({ page }) => {
  await open(page, THEMES[0], 'metric-card')
  const demo = liveDemo(page, 'metric-card')
  const card = demo.locator('[data-slot="metric-card"]').first()
  const value = card.locator('[data-slot="metric-value"] .k-live-flash')
  await expect(value).not.toHaveAttribute('data-flash', /.+/)
  const line = card.locator('.k-spark .k-spark-line')
  await expect(line).not.toHaveAttribute('data-extending', /.*/)
  await watchAttr(line, 'data-extending')
  await liveStep(page)
  await expect(value).toHaveAttribute('data-flash', /^(up|down)$/)
  expect(await value.evaluate((el) => getComputedStyle(el).animationName)).toBe('k-live-flash')
  await expect.poll(() => sawAttr(line)).toBe(true)
  await expect(line).not.toHaveAttribute('data-extending', /.*/, { timeout: 2000 })
})

test('读数刷新（QuoteCard、PriceTag）：价格变了闪涨跌色，迷你图点数加一并走延伸过场', async ({ page }) => {
  await open(page, THEMES[0], 'quote-card')
  const demo = liveDemo(page, 'quote')
  const price = demo.locator('.k-quote-price .k-live-flash')
  const line = demo.locator('.k-quote-card .k-spark .k-spark-line')
  const before = await pointCount(line)
  await expect(price).not.toHaveAttribute('data-flash', /.+/)
  await watchAttr(line, 'data-extending')
  await liveStep(page)
  await expect(price).toHaveAttribute('data-flash', /^(up|down)$/)
  await expect(demo.locator('.k-price-tag-price .k-live-flash')).toHaveAttribute('data-flash', /^(up|down)$/)
  expect(await pointCount(line)).toBe(before + 1)
  await expect.poll(() => sawAttr(line)).toBe(true)
  await expect(line).not.toHaveAttribute('data-extending', /.*/, { timeout: 2000 })
  expect(await pointCount(line)).toBe(before + 1)
})

test('状态栏刷新（StatusBar）：行情断线整项闪跌红警示，重连闪涨色，数值变了闪涨跌色', async ({ page }) => {
  await open(page, THEMES[0], 'status-bar')
  const demo = liveDemo(page, 'status-bar')
  const quote = demo.locator('[data-id="quote"]')
  await expect(demo.locator('.k-status-flash')).toHaveCount(0)
  await liveStep(page, 1)
  await expect(quote.locator('.k-status-value .k-live-flash')).toHaveAttribute('data-flash', /^(up|down)$/)
  await liveStep(page, 3)
  // 第 4 拍行情断开：led 变 danger，整项上盖一层跌红的警示闪。
  await expect(quote.locator('.k-status-value')).toHaveText('已断开')
  const alert = quote.locator('.k-status-flash.k-live-alert')
  await expect(alert).toHaveAttribute('data-tone', 'negative')
  expect(await alert.evaluate((el) => getComputedStyle(el).animationName)).toBe('k-live-alert')
  await expect(quote.locator('.k-led-halo.k-live-alert')).toHaveCount(1)
  await expect(alert).toHaveCount(0, { timeout: 2000 })
  // 第 6 拍重连：闪涨色。
  await liveStep(page, 2)
  await expect(quote.locator('.k-status-value')).toContainText('ms')
  await expect(quote.locator('.k-status-flash.k-live-flash')).toHaveAttribute('data-flash', 'up')
})

test('走势线刷新（Sparkline）：新点追加，点数加一，线走延伸过场、播完点数仍是加一后的', async ({ page }) => {
  await open(page, THEMES[0], 'sparkline')
  const line = liveDemo(page, 'sparkline').locator('.k-spark .k-spark-line')
  const before = await pointCount(line)
  const demo = liveDemo(page, 'sparkline')
  await expect(demo.locator('.k-spark-halo')).toHaveCount(0)
  await watchAttr(line, 'data-extending')
  await liveStep(page)
  await expect.poll(() => sawAttr(line)).toBe(true)
  // 末端点的光晕脉动一次：从 0 放大淡出（k-spark-pulse），不是闪底色；面积与末端点跟着线一起延伸。
  const halo = demo.locator('.k-spark-halo')
  await expect(halo).toHaveAttribute('data-flash', /^(up|down)$/)
  expect(await halo.evaluate((el) => getComputedStyle(el).animationName)).toBe('k-spark-pulse')
  await expect(demo.locator('.k-spark-dot')).toHaveCount(1)
  await expect(line).not.toHaveAttribute('data-extending', /.*/, { timeout: 2000 })
  expect(await pointCount(line)).toBe(before + 1)
  const area = (await demo.locator('.k-spark-area').getAttribute('d'))!
  const lineD = (await line.getAttribute('d'))!
  expect(area.startsWith(lineD), '面积的上沿就是线').toBe(true)
  await expect(halo).toHaveCount(0, { timeout: 2000 })
  // 攒到窗口上限（30 个点）后窗口左移：点数不再增加，仍然走过场。
  await liveStep(page, 20)
  await expect.poll(() => pointCount(line)).toBe(30)
  await watchAttr(line, 'data-extending')
  await liveStep(page)
  await expect.poll(() => sawAttr(line)).toBe(true)
  expect(await pointCount(line)).toBe(30)
})

test('读数刷新（SparkTile）：数值闪涨跌色，走势线延伸，末点外圈的光晕闪一次', async ({ page }) => {
  await open(page, THEMES[0], 'spark-tile')
  const tile = liveDemo(page, 'spark-tile').locator('.k-spark-tile').first()
  const line = tile.locator('polyline')
  await expect(tile.locator('.k-spark-tile-halo')).not.toHaveAttribute('data-flash', /.+/)
  await watchAttr(line, 'data-extending')
  await liveStep(page)
  await expect(tile.locator('.k-spark-tile-value .k-live-flash')).toHaveAttribute('data-flash', /^(up|down)$/)
  await expect(tile.locator('.k-spark-tile-halo')).toHaveAttribute('data-flash', /^(up|down)$/)
  await expect.poll(() => sawAttr(line)).toBe(true)
  // 末点跟着线一起滑（top 有过渡，时长是 --dur-reorder）。
  expect(await tile.locator('.k-spark-tile-end').evaluate((el) => getComputedStyle(el).transitionProperty)).toContain(
    'top',
  )
})

test('读数刷新（Lcd、Led）：LCD 数字闪涨跌色，灯换状态时灯外闪一圈光晕', async ({ page }) => {
  await open(page, THEMES[0], 'lcd')
  const demo = liveDemo(page, 'lcd')
  await liveStep(page)
  await expect(demo.locator('.k-lcd .v .k-live-flash')).toHaveAttribute('data-flash', /^(up|down)$/)
  // 灯随机换状态：推到换了为止（种子固定，次数固定）。
  const halo = demo.locator('.k-led .k-led-halo')
  let seen = false
  for (let i = 0; i < 40 && !seen; i += 1) {
    await liveStep(page)
    seen = (await halo.count()) > 0
  }
  expect(seen, '灯换状态时出现光晕').toBe(true)
  expect(await halo.first().evaluate((el) => /k-live-(alert|flash)/.test(el.className))).toBe(true)
})

test('读数刷新（KeyStats、ChangeText）：数值变了闪涨跌色；涨跌文字要显式 flash 才闪', async ({ page }) => {
  await open(page, THEMES[0], 'key-stats')
  const stats = liveDemo(page, 'key-stats')
  await liveStep(page)
  await expect(stats.locator('[data-key="cap"] .k-keystats-value .k-live-flash')).toHaveAttribute(
    'data-flash',
    /^(up|down)$/,
  )
  // 没有数的「—」不闪。
  await expect(stats.locator('[data-key="beta"] .k-live-flash')).not.toHaveAttribute('data-flash', /.+/)
  await open(page, THEMES[0], 'change-text')
  const change = liveDemo(page, 'pnl').locator('[data-slot="change-text"]')
  await liveStep(page)
  await expect(change).toHaveAttribute('data-flash', /^(up|down)$/)
  // 页上原来那几个没传 flash 的，值不变也没有闪烁类。
  await expect(page.getByTestId('quant-up')).not.toHaveClass(/k-live-flash/)
})

test('权益曲线刷新（EquityCurve）：新点追加，线延伸、末点闪光晕，窗口跟着最新点走', async ({ page }) => {
  await open(page, THEMES[0], 'equity-curve')
  const demo = liveDemo(page, 'equity-curve')
  const line = demo.locator('[data-slot="equity-line"]')
  const segments = () => line.evaluate((el) => (el.getAttribute('d') ?? '').match(/[ML]/g)!.length)
  const before = await segments()
  await expect(demo.locator('.k-ck-end-halo')).toHaveCount(0)
  await watchAttr(line, 'data-extending')
  await liveStep(page)
  await expect.poll(() => sawAttr(line)).toBe(true)
  await expect(demo.locator('.k-ck-end-halo')).toHaveAttribute('data-flash', /^(up|down)$/)
  await expect(line).not.toHaveAttribute('data-extending', /.*/, { timeout: 2000 })
  expect(await segments()).toBe(before + 1)
  // 窗口原来是全程，新点来了仍是全程：滑块的最大值跟着加一。
  await expect(demo.locator('[data-slot="equity-main"]')).toHaveAttribute('aria-valuemax', String(before))
})

test('矩形树图刷新（Treemap）：颜色走线性过渡、换位与改大小走 --dur-reorder 的过渡，涨跌翻了方向的格子闪一次', async ({
  page,
}) => {
  await open(page, THEMES[0], 'treemap')
  const demo = liveDemo(page, 'treemap')
  const cells = demo.locator('.k-treemap-cell')
  await expect(cells).toHaveCount(8)
  const transition = await cells.first().evaluate((el) => {
    const css = getComputedStyle(el)
    return {
      props: css.transitionProperty.split(',').map((s) => s.trim()),
      durations: css.transitionDuration.split(',').map((s) => s.trim()),
    }
  })
  const durationOf = (prop: string) => transition.durations[transition.props.indexOf(prop)]
  expect(durationOf('background-color')).toBe('0.6s')
  for (const prop of ['left', 'top', 'width', 'height']) expect(durationOf(prop)).toBe('0.24s')
  // 步进后格子的位置与大小变了（过渡里会看到中间值，终点是新排布），推到有格子翻了涨跌方向为止。
  const box = () => cells.first().evaluate((el) => (el as HTMLElement).style.width)
  const w0 = await box()
  let flashed = ''
  for (let i = 0; i < 40 && !flashed; i += 1) {
    await liveStep(page)
    flashed =
      (await demo
        .locator('.k-treemap-flash')
        .first()
        .getAttribute('data-flash')
        .catch(() => null)) ?? ''
  }
  expect(await box()).not.toBe(w0)
  expect(flashed).toMatch(/^(up|down)$/)
  await expect(demo.locator('.k-treemap-flash').first()).toHaveClass(/k-live-flash/)
})

test('可用条刷新（UptimeBars）：新格子进来高亮，格数不变，高亮播完摘掉', async ({ page }) => {
  await open(page, THEMES[0], 'uptime-bars')
  const demo = liveDemo(page, 'uptime')
  const cells = demo.locator('.k-uptime-cell')
  await expect(cells).toHaveCount(30)
  await expect(demo.locator('.k-live-enter')).toHaveCount(0)
  await liveStep(page)
  await expect(cells).toHaveCount(30)
  await expect(cells.last()).toHaveClass(/k-live-enter/)
  await expect(demo.locator('.k-live-enter')).toHaveCount(0, { timeout: 3000 })
})

// ---- SmoothUI 表单与输入补件（改自 SmoothUI，MIT）----

for (const theme of THEMES) {
  test.describe(`SmoothUI 表单补件（${theme}）`, () => {
    test('勾选 indicator=check：一笔写出勾，半选画横杠，默认符号的半选压成 2px 的杠', async ({ page }) => {
      await open(page, theme, 'checkbox')
      const area = section(page, 'checkbox')
      const drawn = area.locator('[data-gallery-draw]')
      await expect(drawn).toHaveAttribute('aria-checked', 'true')
      // 点「重播」两下：先摘掉再勾上，勾上的那一刻描边动画在跑，跑完虚线偏移是 0。
      await area.getByRole('button', { name: '重播' }).click()
      await expect(drawn).toHaveAttribute('aria-checked', 'false')
      await area.getByRole('button', { name: '重播' }).click()
      const path = drawn.locator('[data-slot="checkbox-mark"] path[data-mark="tick"]')
      await expect(path).toBeVisible()
      await expect
        .poll(() =>
          path.evaluate((el) => el.getAnimations().some((a) => (a as CSSAnimation).animationName === 'kc-mark-draw')),
        )
        .toBe(true)
      await expect(path).toHaveCSS('stroke-dashoffset', '0px', { timeout: 3000 })
      // 半选：勾换成横杠（tick 不显示、dash 显示），aria-checked=mixed。
      const mixed = area.getByRole('checkbox', { name: '半选', exact: true })
      await expect(mixed).toHaveAttribute('aria-checked', 'mixed')
      // 横杠没有高度（Playwright 认作不可见），改量计算后的 display。
      await expect(mixed.locator('path[data-mark="dash"]')).not.toHaveCSS('display', 'none')
      await expect(mixed.locator('path[data-mark="tick"]')).toHaveCSS('display', 'none')
      const plain = area.getByRole('checkbox', { name: '半选方块' })
      const box = await plain.locator('[data-slot="checkbox-indicator"]').boundingBox()
      expect(Math.round(box!.height)).toBe(2)
      expect(Math.round(box!.width)).toBe(6)
      // 框本身尺寸不变（14）。
      expect(Math.round((await drawn.boundingBox())!.width)).toBe(14)
    })

    test('Input floatingLabel：静止时盖在框里，聚焦或有内容时缩到 0.85 升到框上，框高不变，失焦有值仍在上面', async ({
      page,
    }) => {
      await open(page, theme, 'input')
      const wrap = section(page, 'input').locator('[data-gallery-float] [data-slot="input-float"]')
      const input = wrap.locator('input')
      const label = wrap.locator('label')
      expect(Math.round((await input.boundingBox())!.height)).toBe(30)
      const restY = (await label.boundingBox())!.y
      const restScale = await label.evaluate((el) => getComputedStyle(el).scale)
      expect(restScale === 'none' || restScale === '1').toBe(true)
      // 标签与输入框用 for / id 关联：点标签聚焦输入框。
      await expect(wrap.getByLabel('限价')).toBeVisible()
      await input.focus()
      await expect.poll(async () => (await label.boundingBox())!.y, { timeout: 3000 }).toBeLessThan(restY - 15)
      await expect(label).toHaveCSS('scale', '0.85')
      expect(Math.round((await input.boundingBox())!.height)).toBe(30)
      // 有内容：失焦后标签仍在上面；没内容：回到框里。
      await input.fill('1688')
      await input.blur()
      await expect.poll(async () => (await label.boundingBox())!.y, { timeout: 3000 }).toBeLessThan(restY - 15)
      await input.fill('')
      await input.blur()
      await expect
        .poll(async () => Math.round((await label.boundingBox())!.y), { timeout: 3000 })
        .toBe(Math.round(restY))
      // sm 的框高 26；有值的标签一开始就在上面。
      const sm = section(page, 'input').getByLabel('数量')
      expect(Math.round((await sm.boundingBox())!.height)).toBe(26)
    })

    test('滑块：按住把手放大到 1.12，松手弹回', async ({ page }) => {
      await open(page, theme, 'slider')
      const thumb = section(page, 'slider').getByRole('slider').first()
      const handle = section(page, 'slider').locator('[data-slot="slider-thumb"]').first()
      const box = (await handle.boundingBox())!
      await expect(handle).toHaveCSS('scale', /^(none|1)$/)
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
      await page.mouse.down()
      await expect.poll(() => handle.evaluate((el) => getComputedStyle(el).scale)).toBe('1.12')
      await page.mouse.up()
      await expect.poll(() => handle.evaluate((el) => getComputedStyle(el).scale)).toMatch(/^(none|1)$/)
      await expect(thumb).toBeVisible()
    })

    test('InputGroup：外框 30 高，里面的 Input 无边无底撑满，聚焦时外框提亮，无效时外框变危险色', async ({ page }) => {
      await open(page, theme, 'input-group')
      const area = section(page, 'input-group')
      const group = area.locator('[data-slot="input-group"]').first()
      expect(Math.round((await group.boundingBox())!.height)).toBe(30)
      const input = group.getByRole('textbox', { name: '限价' })
      await expect(input).toHaveCSS('border-top-width', '0px')
      await expect(input).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)')
      // 附件在输入框两侧：¥ 在左，CNY 在右。
      const left = await group.getByText('¥').boundingBox()
      const right = await group.getByText('CNY').boundingBox()
      const mid = (await input.boundingBox())!
      expect(left!.x).toBeLessThan(mid.x)
      expect(right!.x).toBeGreaterThan(mid.x)
      const before = await group.evaluate((el) => getComputedStyle(el).borderTopColor)
      await page.keyboard.press('Tab')
      await input.focus()
      await expect.poll(() => group.evaluate((el) => getComputedStyle(el).borderTopColor)).not.toBe(before)
      const bad = area.locator('[data-slot="input-group"]').nth(3)
      await expect(bad.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true')
      expect(await bad.evaluate((el) => getComputedStyle(el).borderTopColor)).toBe(await token(page, '--signal-red'))
    })

    test('OtpField：输入字翻进格里，外框滑到下一格（带分组间隔），填满回调，错码标红，退格回退，掩码显示点', async ({
      page,
    }) => {
      await open(page, theme, 'otp-field')
      const area = section(page, 'otp-field')
      const root = area.locator('[data-gallery-otp] [data-slot="otp-field"]')
      const input = root.getByRole('textbox', { name: '下单二次验证码' })
      const frame = root.locator('[data-slot="otp-frame"]')
      const slots = root.locator('[data-slot="otp-slot"]')
      await expect(slots).toHaveCount(6)
      expect(Math.round((await slots.first().boundingBox())!.height)).toBe(30)
      await expect(frame).toHaveCSS('opacity', '0')
      await input.click()
      await expect(frame).toHaveCSS('opacity', '1')
      await expect(slots.first().locator('[data-slot="otp-caret"]')).toBeVisible()
      // 字符一位位敲：每敲一位，外框的位置往右一格（格宽 26 + 间距 6 = 32），敲到第 4 位越过分组间隔（10 + 6）。
      const x = async () => (await frame.boundingBox())!.x - (await root.boundingBox())!.x
      await page.keyboard.type('24')
      await expect(slots.nth(1).locator('[data-slot="otp-char"]')).toHaveText('4')
      await expect.poll(x, { timeout: 3000 }).toBeCloseTo(64, 0)
      await page.keyboard.type('6')
      await expect.poll(x, { timeout: 3000 }).toBeCloseTo(3 * 32 + 16, 0)
      // 非数字被挡掉。
      await page.keyboard.type('x')
      await expect(root.locator('[data-slot="otp-char"]')).toHaveCount(3)
      // 退格回一位。
      await page.keyboard.press('Backspace')
      await expect(root.locator('[data-slot="otp-char"]')).toHaveCount(2)
      await page.keyboard.type('68')
      await expect(root.locator('[data-slot="otp-char"]')).toHaveCount(4)
      // 填满：错码标红，正确码放行。
      await page.keyboard.type('00')
      await expect(area.locator('[data-gallery-otp-result]')).toHaveText('验证码错误')
      await expect(input).toHaveAttribute('aria-invalid', 'true')
      await expect(slots.first()).toHaveCSS('border-top-color', await token(page, '--signal-red'))
      await area.getByRole('button', { name: '重来' }).click()
      await input.click()
      await page.keyboard.type('246810')
      await expect(area.locator('[data-gallery-otp-result]')).toHaveText('验证通过，放行下单')
      // 粘贴整串：超出长度的截掉。
      await area.getByRole('button', { name: '重来' }).click()
      await input.click()
      await page.evaluate(() => {
        const el = document.querySelector('[data-gallery-otp] input') as HTMLInputElement
        const data = new DataTransfer()
        data.setData('text', '1234567890')
        el.dispatchEvent(new ClipboardEvent('paste', { clipboardData: data, bubbles: true, cancelable: true }))
      })
      await expect(root.locator('[data-slot="otp-char"]')).toHaveCount(6)
      // 掩码：已有的两个字显示成点；禁用的不能输入。
      const masked = area.getByRole('textbox', { name: '口令' }).locator('xpath=ancestor::*[@data-slot="otp-field"]')
      await expect(masked.locator('[data-slot="otp-char"]').first()).toHaveText('•')
      await expect(area.getByRole('textbox', { name: '禁用验证码' })).toBeDisabled()
    })

    test('RadioGroup：点选、方向键移动并选中，选中点弹进来，选中项框换亮中性', async ({ page }) => {
      await open(page, theme, 'radio-group')
      const area = section(page, 'radio-group')
      const group = area.getByRole('radiogroup', { name: '委托类型' })
      const market = group.getByRole('radio', { name: '市价' })
      const limit = group.getByRole('radio', { name: '限价' })
      await expect(limit).toHaveAttribute('aria-checked', 'true')
      await expect(limit.locator('[data-slot="radio-group-indicator"]')).toBeVisible()
      expect(Math.round((await limit.boundingBox())!.width)).toBe(14)
      await expect(limit).toHaveCSS('background-color', await token(page, '--ink-100'))
      await market.click()
      await expect(market).toHaveAttribute('aria-checked', 'true')
      await expect(market).toBeFocused()
      await expect(limit).toHaveAttribute('aria-checked', 'false')
      await expect
        .poll(() => market.locator('[data-slot="radio-group-indicator"]').evaluate((el) => el.getAnimations().length))
        .toBeGreaterThan(-1)
      // Radix 在方向键按住的那段时间里把「聚焦」当成「选中」；Playwright 的 press 是同一刻按下又抬起，会漏，所以分开按、中间留一帧。
      await page.keyboard.down('ArrowDown')
      await page.waitForTimeout(60)
      await page.keyboard.up('ArrowDown')
      await expect(limit).toHaveAttribute('aria-checked', 'true')
      await expect(area.locator('[data-gallery-radio]')).toHaveText('当前：limit')
      // 点标签也能选中。
      await group.getByText('止损', { exact: true }).click()
      await expect(group.getByRole('radio', { name: '止损' })).toHaveAttribute('aria-checked', 'true')
    })

    test('Toggle：点了 aria-pressed 翻转，开的时候换分段选中的底，禁用点不动', async ({ page }) => {
      await open(page, theme, 'toggle')
      const area = section(page, 'toggle')
      const follow = area.getByRole('button', { name: '跟随最新' })
      expect(Math.round((await follow.boundingBox())!.height)).toBe(30)
      await expect(follow).toHaveAttribute('aria-pressed', 'true')
      const on = await bg(follow)
      await follow.click()
      await expect(follow).toHaveAttribute('aria-pressed', 'false')
      await expect.poll(() => bg(follow)).not.toBe(on)
      await follow.click()
      await expect(follow).toHaveAttribute('aria-pressed', 'true')
      await expect(area.getByRole('button', { name: '禁用' })).toBeDisabled()
      expect(Math.round((await area.getByRole('button', { name: '均线' }).boundingBox())!.height)).toBe(26)
    })

    test('CheckboxGroup：父项全选与清空，部分选中时父项半选', async ({ page }) => {
      await open(page, theme, 'checkbox-group')
      const area = section(page, 'checkbox-group')
      const group = area.getByRole('group', { name: '监控市场' })
      const all = group.getByRole('checkbox', { name: '全部市场' })
      await expect(all).toHaveAttribute('aria-checked', 'mixed')
      await group.getByText('深市主板', { exact: true }).click()
      await expect(group.getByRole('checkbox', { name: '深市主板' })).toHaveAttribute('aria-checked', 'true')
      await group.getByRole('checkbox', { name: '创业板' }).click()
      await expect(all).toHaveAttribute('aria-checked', 'true')
      await expect(area.locator('[data-gallery-checkbox-group]')).toHaveText('已选：sh、sz、gem')
      await all.click()
      await expect(all).toHaveAttribute('aria-checked', 'false')
      await expect(area.locator('[data-gallery-checkbox-group]')).toHaveText('已选：无')
      await all.click()
      await expect(group.getByRole('checkbox', { name: '沪市主板' })).toHaveAttribute('aria-checked', 'true')
    })

    test('Textarea：默认三行高，可竖向拖，错误态边框变危险色', async ({ page }) => {
      await open(page, theme, 'textarea')
      const area = section(page, 'textarea')
      const box = area.getByRole('textbox', { name: '下单备注' })
      expect((await box.boundingBox())!.height).toBeGreaterThan(50)
      await expect(box).toHaveCSS('resize', 'vertical')
      await box.fill('突破前高\n回踩确认')
      await expect(box).toHaveValue('突破前高\n回踩确认')
      await expect(area.getByRole('textbox', { name: '备注 错误' })).toHaveCSS(
        'border-top-color',
        await token(page, '--signal-red'),
      )
    })

    test('MorphToggle：点了圆钮滑过去，morph 变体关时是 3px 的小圆角、开时变全圆，icon 变体换图标', async ({
      page,
    }) => {
      await open(page, theme, 'morph-toggle')
      const area = section(page, 'morph-toggle')
      const live = area.getByRole('switch', { name: '实盘模式' })
      const thumb = live.locator('[data-slot="morph-toggle-thumb"]')
      await expect(live).toHaveAttribute('aria-checked', 'false')
      const x0 = (await thumb.boundingBox())!.x
      await expect(thumb).toHaveCSS('border-top-left-radius', '3px')
      await live.click()
      await expect(live).toHaveAttribute('aria-checked', 'true')
      await expect.poll(async () => (await thumb.boundingBox())!.x, { timeout: 3000 }).toBeCloseTo(x0 + 16, 0)
      await expect
        .poll(() => thumb.evaluate((el) => parseFloat(getComputedStyle(el).borderTopLeftRadius)), { timeout: 3000 })
        .toBeGreaterThan(6)
      await expect(area.locator('output, [data-slot="morph-toggle"]').first()).toBeVisible()
      // 键盘 Space 翻回去。
      await live.focus()
      await page.keyboard.press('Space')
      await expect(live).toHaveAttribute('aria-checked', 'false')
      // icon 变体：圆钮里的图标随状态换。
      const theme2 = area.getByRole('switch', { name: '主题' })
      await expect(theme2.locator('svg')).toHaveCount(1)
      const before = await theme2.locator('svg').evaluate((el) => el.getAttribute('class'))
      await theme2.click()
      await expect
        .poll(() => theme2.locator('svg').evaluate((el) => el.getAttribute('class')), { timeout: 3000 })
        .not.toBe(before)
      await expect(area.getByRole('switch', { name: '禁用' })).toBeDisabled()
    })

    test('MorphIcon：点了八个图标一起补间到第二个形状（线条在动，不是换图标）', async ({ page }) => {
      await open(page, theme, 'morph-icon')
      const area = section(page, 'morph-icon')
      const menu = area.getByRole('button', { name: 'menu' })
      const lines = menu.locator('svg line')
      await expect(menu.locator('svg')).toHaveAttribute('data-variant', 'menu')
      expect(await lines.count()).toBe(3)
      const y1 = (i: number) => lines.nth(i).evaluate((el) => Number(el.getAttribute('y1')))
      expect(await y1(0)).toBe(6)
      await menu.click()
      // 第一根线从 (4,6)-(20,6) 补间到 (6,6)-(18,18)：y2 一路从 6 走到 18。
      await expect
        .poll(() => lines.nth(0).evaluate((el) => Number(el.getAttribute('y2'))), { timeout: 3000 })
        .toBeCloseTo(18, 0)
      await expect(menu.locator('svg')).toHaveAttribute('data-active', '')
      // 中间那根淡出。
      await expect
        .poll(() => lines.nth(1).evaluate((el) => Number(getComputedStyle(el).opacity)), { timeout: 3000 })
        .toBeLessThan(0.05)
      // 播放变停止：路径 d 变了。
      const play = area.getByRole('button', { name: 'play' }).locator('path')
      await expect.poll(() => play.evaluate((el) => el.getAttribute('d')), { timeout: 3000 }).toContain('L17,17')
    })

    test('SwapPanel：报价中扫光，报价到了数额滚进来，翻转对调两边，Max 填满余额，倒计时圆环在走', async ({ page }) => {
      await open(page, theme, 'swap-panel')
      const panel = section(page, 'swap-panel').locator('[data-slot="swap-panel"]')
      const output = panel.locator('[data-slot="swap-output"]')
      await expect(panel).toHaveAttribute('data-status', 'ready', { timeout: 4000 })
      await expect(output).toContainText('138.2')
      await expect(panel.locator('[data-slot="swap-shimmer"]')).toHaveCount(0)
      await expect(panel.getByRole('img', { name: '报价有效期' })).toBeVisible()
      // 改数额：先进入 quoting（扫光、提交钮禁用），再回到 ready 带新数额。
      await panel.getByRole('textbox', { name: '卖出' }).fill('2000')
      await expect(panel).toHaveAttribute('data-status', 'quoting')
      await expect(panel.locator('[data-slot="swap-shimmer"]')).toBeVisible()
      await expect(panel.getByRole('button', { name: '确认换汇' })).toBeDisabled()
      await expect(panel).toHaveAttribute('data-status', 'ready', { timeout: 4000 })
      await expect(output).toContainText('276.4')
      // 圆环的弧长随时间变短。
      const ring = panel.locator('[data-slot="swap-countdown"] circle').nth(1)
      const offset = () => ring.evaluate((el) => parseFloat(getComputedStyle(el).strokeDashoffset))
      const offset0 = await offset()
      await expect.poll(offset, { timeout: 4000 }).toBeGreaterThan(offset0 + 2)
      // 翻转：两边币种对调。
      await panel.getByRole('button', { name: '对调两边' }).click()
      await expect(panel.getByRole('button', { name: /更换卖出币种，当前 USD/ })).toBeVisible()
      await expect(panel).toHaveAttribute('data-status', 'ready', { timeout: 4000 })
      // Max：把余额填进输入框。
      await panel.getByRole('button', { name: '全部' }).click()
      await expect(panel.getByRole('textbox', { name: '卖出' })).toHaveValue('25000')
    })

    test('OrderTicket：按成本算张数，改杠杆成本不变，换方向清空止盈止损，按风险要止损，超可用报错', async ({
      page,
    }) => {
      await open(page, theme, 'order-ticket')
      const ticket = section(page, 'order-ticket').locator('[data-slot="order-ticket"]').first()
      const slot = (name: string) => ticket.locator(`[data-slot="${name}"]`)
      // 10 USDT、100 倍、开平各 0.05%：10 / 0.011 = 909.09 → 1.51 张，占用 9.97。
      await expect(slot('ticket-size')).toContainText('1.51 Cont')
      await expect(slot('ticket-cost')).toContainText('9.97 USDT')
      await expect(slot('ticket-rr')).toContainText('3.17 : 1')
      // 改杠杆到 10：成本框还是 10，张数变成 0.16（10 / 0.101 = 99.01 → 0.165 → 0.16）。
      await slot('ticket-leverage').fill('10')
      await expect(slot('ticket-amount')).toHaveValue('10')
      await expect(slot('ticket-size')).toContainText('0.16 Cont')
      await slot('ticket-leverage').fill('100')
      // 超过可用 250：报错、提交钮禁用。
      await slot('ticket-amount').fill('300')
      await expect(slot('ticket-issue')).toContainText('available balance')
      await expect(slot('ticket-submit')).toBeDisabled()
      await slot('ticket-amount').fill('10')
      await expect(slot('ticket-submit')).toBeEnabled()
      // 换方向：止盈止损清空，方向标到面板上。
      await ticket.getByRole('button', { name: 'Sell / Short' }).first().click()
      await expect(ticket).toHaveAttribute('data-side', 'sell')
      await expect(slot('ticket-take-profit')).toHaveValue('')
      await expect(slot('ticket-stop-loss')).toHaveValue('')
      // 出场模板按方向填：空头止盈在下、止损在上（1% / 0.5%）。
      await ticket.getByRole('combobox', { name: 'Exit template' }).click()
      await page.getByRole('option', { name: /Scalp/ }).click()
      await expect(slot('ticket-take-profit')).toHaveValue('59400.0')
      await expect(slot('ticket-stop-loss')).toHaveValue('60300.0')
      // 按风险：止损填在盈利一侧报错；填对了按风险算张数（50 / (3 + 0.3 + 0.3015) = 13.88）。
      await ticket.getByRole('combobox', { name: 'Size by' }).click()
      await page.getByRole('option', { name: 'Risk' }).click()
      await slot('ticket-amount').fill('50')
      await slot('ticket-stop-loss').fill('59000')
      await expect(slot('ticket-issue')).toContainText('profit side')
      await slot('ticket-stop-loss').fill('60300')
      await expect(slot('ticket-size')).toContainText('13.88 Cont')
      // 提交：回调拿到方向与张数。
      await slot('ticket-submit').click()
      await expect(section(page, 'order-ticket').locator('output').first()).toContainText('sell 13.88')
    })

    test('Button effect：dot-morph 悬停点拉成竖条，clip-corners 悬停切口变大，magnetic 靠近时偏向指针、离开回位', async ({
      page,
    }) => {
      await open(page, theme, 'button')
      const area = section(page, 'button')
      // dot-morph
      const dotButton = area.locator('[data-gallery-dot]')
      const dot = dotButton.locator('[data-slot="button-dot"]')
      expect(Math.round((await dot.boundingBox())!.width)).toBe(8)
      expect(Math.round((await dotButton.boundingBox())!.height)).toBe(30)
      await dotButton.hover()
      await expect.poll(async () => Math.round((await dot.boundingBox())!.height), { timeout: 3000 }).toBe(16)
      expect(Math.round((await dotButton.boundingBox())!.height)).toBe(30)
      // clip-corners
      const clip = area.locator('[data-gallery-clip]')
      await expect(clip).toHaveCSS('border-top-left-radius', '0px')
      await expect.poll(() => clip.evaluate((el) => getComputedStyle(el).getPropertyValue('--k-cut'))).toBe('4px')
      await clip.hover()
      await expect
        .poll(() => clip.evaluate((el) => getComputedStyle(el).getPropertyValue('--k-cut')), { timeout: 3000 })
        .toBe('9px')
      expect(await clip.evaluate((el) => getComputedStyle(el).clipPath)).toContain('polygon')
      // magnetic：指针在按钮右侧 40px 处，按钮朝右偏；移到很远处回位。
      const magnet = area.locator('[data-gallery-magnet]')
      const box = (await magnet.boundingBox())!
      const home = box.x
      await page.mouse.move(box.x + box.width + 40, box.y + box.height / 2)
      await expect.poll(async () => (await magnet.boundingBox())!.x, { timeout: 3000 }).toBeGreaterThan(home + 2)
      await page.mouse.move(box.x + 500, box.y + 300)
      await expect.poll(async () => (await magnet.boundingBox())!.x, { timeout: 3000 }).toBeCloseTo(home, 0)
      // 点击照常触发（效果不改按钮的行为）。
      await expect(magnet).toBeEnabled()
    })

    test('Field shakeOnInvalid：变成无效的那一刻整组抖一下，一会儿摘掉', async ({ page }) => {
      await open(page, theme, 'field')
      const field = section(page, 'field').getByTestId('field')
      await expect(field).not.toHaveAttribute('data-shake', /.*/)
      await section(page, 'field').getByRole('button', { name: '切换出错' }).click()
      await expect(field).toHaveAttribute('data-shake', '')
      await expect
        .poll(() =>
          field.evaluate((el) => el.getAnimations().some((a) => (a as CSSAnimation).animationName === 'kc-shake')),
        )
        .toBe(true)
      await expect(field).not.toHaveAttribute('data-shake', /.*/, { timeout: 2000 })
      // 变回有效不抖。
      await section(page, 'field').getByRole('button', { name: '切换出错' }).click()
      await expect(field).not.toHaveAttribute('data-shake', /.*/)
    })
  })
}

// —— 文字动效（改自 SmoothUI，src/motion/text）——
const motionBox = (page: Page, id: string) => page.locator(`[data-gallery-motion="${id}"]`)
const replay = (box: Locator) => box.getByRole('button', { name: '重播' }).click()

test('文字动效 TextReveal：17 个预设都渲染、有尺寸，重播后逐字从透明走到不透明，读屏名是完整句子', async ({ page }) => {
  await open(page, THEMES[0], 'text-reveal')
  const box = motionBox(page, 'text-reveal')
  const cells = box.locator('[data-slot="text-reveal"][data-preset]')
  await expect(cells).toHaveCount(17)
  for (const handle of await cells.all()) expect((await handle.boundingBox())!.width).toBeGreaterThan(10)
  // 预设对应原件：bottom-up-letters 是按字、第一个字在重播时先是透明的。
  const letters = box.locator('[data-preset="bottom-up-letters"]')
  await expect(letters).toHaveAttribute('data-by', 'char')
  await expect(letters.locator('.sr-only')).toHaveText('NVDA +4.2%')
  await replay(box)
  const lastLetter = letters.locator('[aria-hidden="true"]').last()
  expect(Number(await lastLetter.evaluate((el) => getComputedStyle(el).opacity))).toBeLessThan(1)
  await expect.poll(() => lastLetter.evaluate((el) => getComputedStyle(el).opacity), { timeout: 5000 }).toBe('1')
  // by="all" 的预设没有拆字：整段一个元素。
  await expect(box.locator('[data-preset="micro-scale-fade"]')).toHaveAttribute('data-by', 'all')
  // 按行的 mask-reveal-up 用 overflow:hidden 的外壳裁。
  const mask = box.locator('[data-preset="mask-reveal-up"] > span:not(.sr-only)').first()
  await expect(mask.locator('xpath=..').locator('> span:not(.sr-only)').first().locator('> span').first()).toHaveCSS(
    'overflow',
    'hidden',
  )
})

test('文字动效 TextSwap：步进后换成下一句，五种换法同步；切换视图的标签跟着换', async ({ page }) => {
  await open(page, THEMES[0], 'text-swap')
  const demo = liveDemo(page, 'text-swap')
  const swaps = demo.locator('[data-slot="text-swap"]')
  await expect(swaps).toHaveCount(6)
  const fade = demo.locator('[data-variant="fade-through"]')
  await expect(fade).toHaveAttribute('data-index', '0')
  await expect(fade).toContainText('Fed holds rates steady')
  await liveStep(page)
  await expect(fade).toHaveAttribute('data-index', '1')
  await expect(fade).toContainText('NVDA beats', { timeout: 3000 })
  // word-cut 的词之间靠 flex 间距，文本里没有空格。
  await expect(demo.locator('[data-variant="word-cut"]')).toContainText(/NVDA\s*beats/, { timeout: 3000 })
  await demo.getByRole('button', { name: 'orders', exact: true }).click()
  await expect(demo.locator('[data-variant="axis-x"]').last()).toContainText('Orders: 3 working', { timeout: 3000 })
})

test('文字动效 WordBuild：词一个一个多出来，整句搭好', async ({ page }) => {
  await open(page, THEMES[0], 'word-build')
  const box = motionBox(page, 'word-build')
  const right = box.locator('[data-from="right"]')
  // 重播后马上看：词还没出齐（逐词搭，每 430ms 多一个），之后才到 4 个。
  await replay(box)
  expect(Number(await right.getAttribute('data-words'))).toBeLessThan(4)
  await expect(right).toHaveAttribute('data-words', '4', { timeout: 5000 })
  await expect(right).toContainText(/Fed\s*holds\s*rates\s*steady/)
  await expect(box.locator('[data-from="top"]')).toBeVisible()
})

test('文字动效 TypewriterText：逐字打出，追加文字时接着打不重来，读屏拿到完整句子', async ({ page }) => {
  await open(page, THEMES[0], 'typewriter-text')
  const box = motionBox(page, 'typewriter-text')
  const visible = box.locator('[data-slot="typewriter-visible"]')
  const first = REPLY_FIRST
  await expect(box.locator('[data-slot="typewriter-text"]')).toHaveAttribute('data-typing', '')
  const early = (await visible.textContent()) ?? ''
  expect(early.length).toBeLessThan(first.length)
  await expect(visible).toHaveText(first, { timeout: 5000 })
  await expect(box.locator('.k-tw-caret')).toHaveCount(1)
  // 追加一句：已打出的前缀不被清掉，随后变成两句。
  await box.getByRole('button', { name: '追加一句' }).click()
  expect(((await visible.textContent()) ?? '').startsWith(first)).toBe(true)
  await expect(visible).toHaveText(`${first}Trim 1,200 shares at market before the close, `, { timeout: 5000 })
  await expect(box.locator('.sr-only')).toHaveText(`${first}Trim 1,200 shares at market before the close, `)
  // 重播：回到空的重新打。
  await replay(box)
  expect(((await visible.textContent()) ?? '').length).toBeLessThan(first.length)
})
const REPLY_FIRST = 'Position is 6% over the single-name limit. '

test('文字动效 ScrambleText：悬停时乱码再落回，数据变了（change）也扰一次，读屏读真字', async ({ page }) => {
  await open(page, THEMES[0], 'scramble-text')
  const demo = liveDemo(page, 'scramble-text')
  const hover = demo.locator('[data-slot="scramble-text"]').first()
  await expect(hover.locator('.sr-only')).toHaveText('Open order ticket')
  await hover.hover()
  await expect(hover).toHaveAttribute('data-scrambling', '')
  await expect
    .poll(async () => (await hover.locator('[data-slot="scramble-visible"]').textContent()) !== 'Open order ticket')
    .toBe(true)
  await expect(hover).not.toHaveAttribute('data-scrambling', '', { timeout: 3000 })
  await expect(hover.locator('[data-slot="scramble-visible"]')).toHaveText('Open order ticket')
  // 价格那行：步进后换成新价格，过程中 data-scrambling 出现过。
  const price = demo.locator('[data-slot="scramble-text"]').last()
  const before = await price.locator('.sr-only').textContent()
  await watchAttr(price, 'data-scrambling')
  await liveStep(page)
  await expect.poll(() => sawAttr(price)).toBe(true)
  await expect(price.locator('.sr-only')).not.toHaveText(before!)
  await expect(price.locator('[data-slot="scramble-visible"]')).toHaveText(
    (await price.locator('.sr-only').textContent())!,
    {
      timeout: 3000,
    },
  )
})

test('文字动效 TextMorph：价格与状态词变了，读屏文字与可见逐字一致', async ({ page }) => {
  await open(page, THEMES[0], 'text-morph')
  const demo = liveDemo(page, 'text-morph')
  const words = demo.locator('[data-slot="text-morph"]').last()
  await expect(words.locator('.sr-only')).toHaveText('Pending approval')
  await liveStep(page)
  await expect(words.locator('.sr-only')).toHaveText('Partially filled')
  await expect
    .poll(async () => (await words.locator('[aria-hidden="true"]').allTextContents()).join(''))
    .toBe('Partially filled')
  const price = demo.locator('[data-slot="text-morph"]').first()
  await expect
    .poll(async () => (await price.locator('[aria-hidden="true"]').allTextContents()).join(''))
    .toBe((await price.locator('.sr-only').textContent())!)
})

test('文字动效 ShineText 与 WaveText：流光在移动，波浪的字在起伏', async ({ page }) => {
  await open(page, THEMES[0], 'shine-text')
  const shine = motionBox(page, 'shine-text').locator('[data-slot="shine-text"]').first()
  await expect(shine).toHaveCSS('background-clip', 'text')
  const at = () => shine.evaluate((el) => getComputedStyle(el).backgroundPositionX)
  const first = await at()
  await expect.poll(at, { timeout: 3000 }).not.toBe(first)
  await show(page, 'wave-text')
  const wave = motionBox(page, 'wave-text').locator('[data-slot="wave-text"]').first()
  await expect(wave.locator('.sr-only')).toHaveText('Live market')
  const letter = wave.locator('[aria-hidden="true"]').nth(3)
  await expect.poll(() => letter.evaluate((el) => getComputedStyle(el).transform), { timeout: 3000 }).not.toBe('none')
})

test('文字动效 ScrollRevealParagraph：滚动时词按顺序亮起来', async ({ page }) => {
  await open(page, THEMES[0], 'scroll-reveal-paragraph')
  const scroller = page.getByTestId('scroll-reveal-paragraph-scroller')
  const words = scroller.locator('p [aria-hidden="true"]')
  const lit = (index: number) =>
    words
      .nth(index)
      .locator('> span')
      .nth(1)
      .evaluate((el) => getComputedStyle(el).opacity)
  const last = (await words.count()) - 1
  expect(Number(await lit(last))).toBe(0)
  await scroller.evaluate((el) => (el.scrollTop = 0))
  await scroller.evaluate((el) => (el.scrollTop = el.scrollHeight))
  await expect.poll(() => lit(0)).toBe('1')
  await expect.poll(async () => Number(await lit(last))).toBeGreaterThan(0.9)
  await expect(scroller.locator('p .sr-only')).toContainText('Breadth narrowed')
})

test('文字动效 KineticTypeScroll：滚动时波峰上的词放大，滚走后回落', async ({ page }) => {
  await open(page, THEMES[0], 'kinetic-type-scroll')
  const scroller = page.getByTestId('kinetic-type-scroll-scroller')
  const words = scroller.locator('[data-slot="kinetic-type-scroll"] > [aria-hidden="true"]')
  await expect(words).toHaveCount(6)
  const scales = () => words.evaluateAll((els) => els.map((el) => new DOMMatrix(getComputedStyle(el).transform).a))
  const rest = await scales()
  await scroller.evaluate((el) => (el.scrollTop = 130))
  await expect.poll(async () => Math.max(...(await scales()))).toBeGreaterThan(Math.max(...rest) + 0.02)
  await scroller.evaluate((el) => (el.scrollTop = 0))
  await expect.poll(async () => Math.max(...(await scales())), { timeout: 4000 }).toBeLessThan(1)
})

test('文字动效 PerspectiveText3D：固定倾斜是 3D 变换，指针移动时平面跟着倾斜', async ({ page }) => {
  await open(page, THEMES[0], 'perspective-text-3d')
  const box = motionBox(page, 'perspective-text-3d')
  const staticPlane = box.locator('[data-driver="static"] > div').first()
  await expect.poll(() => staticPlane.evaluate((el) => getComputedStyle(el).transform)).toMatch(/^matrix3d/)
  const pointer = box.locator('[data-driver="pointer"]')
  const plane = pointer.locator('> div').first()
  await expect(pointer.locator('.sr-only')).toHaveText('Move the pointer\nover this panel')
  const before = await plane.evaluate((el) => getComputedStyle(el).transform)
  const rect = (await pointer.boundingBox())!
  await page.mouse.move(rect.x + rect.width * 0.9, rect.y + rect.height * 0.1)
  await page.mouse.move(rect.x + rect.width * 0.95, rect.y + rect.height * 0.15)
  await expect.poll(() => plane.evaluate((el) => getComputedStyle(el).transform)).not.toBe(before)
})

test('文字动效 GravityLetters：点一下字掉到底并停住，再点弹簧拉回原位；受控的跟着按钮', async ({ page }) => {
  await open(page, THEMES[0], 'gravity-letters')
  const click = page.getByTestId('gravity-click').locator('[data-slot="gravity-letters"]')
  await expect(click).toHaveAttribute('role', 'button')
  await expect(click).toHaveAttribute('aria-pressed', 'false')
  const letters = click.locator('.absolute.inset-0 > span')
  const ys = () => letters.evaluateAll((els) => els.map((el) => new DOMMatrix(getComputedStyle(el).transform).f))
  const rest = await ys()
  await click.click()
  await expect(click).toHaveAttribute('aria-pressed', 'true')
  await expect
    .poll(async () => Math.min(...(await ys()).map((y, i) => y - rest[i]!)), { timeout: 5000 })
    .toBeGreaterThan(20)
  await click.press('Enter')
  await expect(click).toHaveAttribute('aria-pressed', 'false')
  await expect
    .poll(async () => Math.max(...(await ys()).map((y, i) => Math.abs(y - rest[i]!))), { timeout: 6000 })
    .toBeLessThan(1)
  // 受控：按钮把 collapsed 翻过来。
  const box = motionBox(page, 'gravity-letters')
  const controlled = page.getByTestId('gravity-controlled').locator('[data-slot="gravity-letters"]')
  await expect(controlled).toHaveAttribute('data-phase', 'rest')
  await box.getByRole('button', { name: '掉落' }).click()
  await expect(controlled).toHaveAttribute('data-phase', 'collapsed')
})

test('文字动效 RansomNote：每张纸片有自己的字体与底色，同种子同排布，进场后落位；jitter 在抖', async ({ page }) => {
  await open(page, THEMES[0], 'ransom-note')
  const box = motionBox(page, 'ransom-note')
  const assemble = box.locator('[data-animate="assemble"]')
  await expect(assemble.locator('.sr-only')).toHaveText('No signal')
  const scraps = assemble.locator('[aria-hidden="true"] > span')
  await expect(scraps).toHaveCount(9)
  const fonts = await scraps.evaluateAll((els) => new Set(els.map((el) => getComputedStyle(el).fontFamily)).size)
  expect(fonts).toBeGreaterThan(1)
  await expect.poll(() => scraps.first().evaluate((el) => getComputedStyle(el).opacity), { timeout: 4000 }).toBe('1')
  const jitter = box.locator('[data-animate="jitter"] [aria-hidden="true"] > span').first()
  const at = () => jitter.evaluate((el) => getComputedStyle(el).transform)
  const first = await at()
  await expect.poll(at, { timeout: 3000 }).not.toBe(first)
})

test('RollingText ramp：字母位换代码时转轮上经过几个中间字，默认的数字滚动不受影响', async ({ page }) => {
  await open(page, THEMES[0], 'rolling-text')
  const code = page.locator('[data-gallery-code]')
  await expect(code).toHaveText('AAPL.US')
  await page.getByRole('button', { name: '换代码' }).click()
  const strips = code.locator('.k-roll-slot[data-strip]')
  await expect(strips.first()).toHaveAttribute('data-strip', /\n/)
  expect(
    await strips.evaluateAll((els) => els.some((el) => (el.getAttribute('data-strip') ?? '').split('\n').length === 5)),
  ).toBe(true)
  await expect(code).toHaveText('TSLA.US')
})

// ── 照 SmoothUI 搬来的「浮层、导航、展示与布局」一批（用例名都带「SUI-B」）──

test('SUI-B Avatar：状态点有读屏名，叠放折成 +N', async ({ page }) => {
  await open(page, THEMES[0], 'avatar')
  const box = section(page, 'avatar')
  await expect(box.getByRole('img', { name: '在线' })).toBeVisible()
  const overflow = box.locator('[data-slot="avatar-overflow"]')
  await expect(overflow).toHaveText('+2')
  await expect(overflow).toHaveAttribute('aria-label', '另有 2 人')
  expect(await box.locator('[data-slot="avatar-group"] [data-slot="avatar"]').count()).toBe(3)
  const size = await box.locator('[data-slot="avatar"]').first().boundingBox()
  expect(size!.width).toBe(32)
})

test('SUI-B Breadcrumb：最后一节是当前页，进场错开后全部落位', async ({ page }) => {
  await open(page, THEMES[0], 'breadcrumb')
  const box = section(page, 'breadcrumb')
  const items = box.locator('nav[aria-label="当前位置"] li')
  await expect(items).toHaveCount(3)
  await expect(items.last().locator('[aria-current="page"]')).toHaveText('回测 2026-11')
  await expect.poll(() => items.last().evaluate((el) => getComputedStyle(el).opacity)).toBe('1')
  expect(await items.first().locator('a').getAttribute('href')).toBe('#')
  await box.getByRole('button', { name: '重播' }).click()
  await expect.poll(() => items.last().evaluate((el) => getComputedStyle(el).opacity), { timeout: 3000 }).toBe('1')
})

test('SUI-B Pagination：点页码换当前页，省略号随当前页挪动，首尾页的按钮禁用', async ({ page }) => {
  await open(page, THEMES[0], 'pagination')
  const nav = section(page, 'pagination').locator('nav[aria-label="分页"]')
  await expect(nav.getByRole('button', { name: '第 5 页' })).toHaveAttribute('aria-current', 'page')
  await expect(nav.getByRole('button', { name: '第 1 页' })).toBeVisible()
  await expect(nav.getByRole('button', { name: '第 20 页' })).toBeVisible()
  await expect(nav.getByRole('button', { name: '第 12 页' })).toHaveCount(0)
  await nav.getByRole('button', { name: '下一页' }).click()
  await expect(nav.getByRole('button', { name: '第 6 页' })).toHaveAttribute('aria-current', 'page')
  await nav.getByRole('button', { name: '第 20 页' }).click()
  await expect(nav.getByRole('button', { name: '下一页' })).toBeDisabled()
  await expect(nav.getByRole('button', { name: '第 19 页' })).toBeVisible()
})

test('SUI-B Collapsible：点标题展开收起，内容高度从 0 长出来', async ({ page }) => {
  await open(page, THEMES[0], 'collapsible')
  const box = section(page, 'collapsible')
  const trigger = box.getByRole('button', { name: '高级参数' })
  const content = box.locator('[data-slot="collapsible-content"]')
  await expect(trigger).toHaveAttribute('aria-expanded', 'true')
  await expect(content).toBeVisible()
  await trigger.click()
  await expect(trigger).toHaveAttribute('aria-expanded', 'false')
  await expect(content).toBeHidden()
  await trigger.click()
  await expect(content).toBeVisible()
  expect((await content.boundingBox())!.height).toBeGreaterThan(20)
  // 入场用的是 height 动画（kc-collapsible-down）。
  expect(await content.evaluate((el) => getComputedStyle(el).animationName)).toBe('kc-collapsible-down')
})

test('SUI-B Menubar：点开面板，方向键换到旁边的菜单，Esc 关闭', async ({ page }) => {
  await open(page, THEMES[0], 'menubar')
  const bar = section(page, 'menubar').getByRole('menubar')
  await bar.getByRole('menuitem', { name: '文件' }).click()
  await expect(page.getByRole('menuitem', { name: '导入数据' })).toBeVisible()
  await page.keyboard.press('ArrowRight')
  await expect(page.getByRole('menuitem', { name: '紧凑行高' })).toBeVisible()
  await expect(page.getByRole('menuitem', { name: '导入数据' })).toHaveCount(0)
  await page.keyboard.press('Escape')
  await expect(page.getByRole('menuitem', { name: '紧凑行高' })).toHaveCount(0)
})

test('SUI-B NavigationMenu：点入口开面板，换入口面板换内容', async ({ page }) => {
  await open(page, THEMES[0], 'navigation-menu')
  const box = section(page, 'navigation-menu')
  await box.getByRole('button', { name: '行情' }).click()
  await expect(page.getByRole('link', { name: '板块热力图' })).toBeVisible()
  // 已有入口开着时，指针划到另一个入口就直接换开（Radix 的 skip delay）；再点会把它关掉，所以这里用悬停。
  await box.getByRole('button', { name: '研究' }).hover()
  await expect(page.getByRole('link', { name: '因子库' })).toBeVisible()
  await expect(page.getByRole('link', { name: '板块热力图' })).toHaveCount(0)
  const viewport = box.locator('[data-slot="navigation-menu-viewport"]')
  await expect.poll(async () => (await viewport.boundingBox())!.width, { timeout: 3000 }).toBeGreaterThan(200)
})

test('SUI-B FileTree：展开收起、方向键走、选中；展开时子级高度长出来', async ({ page }) => {
  await open(page, THEMES[0], 'file-tree')
  const tree = section(page, 'file-tree').getByRole('tree', { name: '策略与回测文件' })
  // 行的读屏名里带行尾的徽标（如 momentum.py M），按文件名开头匹配。
  const row = (name: string) => tree.getByRole('treeitem', { name: new RegExp(`^${name.replaceAll('.', '\\.')}( |$)`) })
  await expect(row('momentum.py')).toBeVisible()
  await expect(row('2026-11-17-momentum.json')).toHaveCount(0)
  await row('backtests').click()
  await expect(row('backtests')).toHaveAttribute('aria-expanded', 'true')
  await expect(row('2026-11-17-momentum.json')).toBeVisible()
  await row('backtests').press('ArrowDown')
  await expect(row('2026-11-17-momentum.json')).toBeFocused()
  await row('2026-11-17-momentum.json').press('ArrowLeft')
  await expect(row('backtests')).toBeFocused()
  await row('backtests').press('ArrowLeft')
  await expect(row('backtests')).toHaveAttribute('aria-expanded', 'false')
  await row('momentum.py').click()
  await expect(row('momentum.py')).toHaveAttribute('aria-selected', 'true')
  await expect(section(page, 'file-tree').getByText('选中：momentum')).toBeVisible()
})

test('SUI-B Dock：指针靠近时图标放大，离开后复原；方向键在图标间走', async ({ page }) => {
  await open(page, THEMES[0], 'dock')
  const dock = section(page, 'dock').getByRole('toolbar', { name: '工作台工具' })
  const tiles = dock.locator('[data-slot="dock-tile"]')
  const rest = (await tiles.nth(2).boundingBox())!.width
  const box = (await tiles.nth(2).boundingBox())!
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  await page.mouse.move(box.x + box.width / 2 + 1, box.y + box.height / 2)
  await expect
    .poll(async () => (await tiles.nth(2).boundingBox())!.width, { timeout: 3000 })
    .toBeGreaterThan(rest * 1.3)
  expect((await tiles.nth(3).boundingBox())!.width).toBeGreaterThan(rest)
  await page.mouse.move(2, 2)
  await expect.poll(async () => Math.round((await tiles.nth(2).boundingBox())!.width), { timeout: 3000 }).toBe(rest)
  await tiles.nth(0).focus()
  await page.keyboard.press('ArrowRight')
  await expect(tiles.nth(1)).toBeFocused()
})

test('SUI-B RichPopover：点触发器弹出卡，带标题与动作，Esc 关闭', async ({ page }) => {
  await open(page, THEMES[0], 'rich-popover')
  await section(page, 'rich-popover').getByRole('button', { name: 'NVDA' }).click()
  const card = page.locator('[data-slot="rich-popover-content"]')
  await expect(card).toBeVisible()
  await expect(card.getByText('NVIDIA Corp')).toBeVisible()
  await expect(card.getByRole('button', { name: '打开图表' })).toBeVisible()
  await expect.poll(() => card.evaluate((el) => getComputedStyle(el).opacity)).toBe('1')
  expect(await card.evaluate((el) => getComputedStyle(el).animationName)).toBe('kc-rich-in')
  await page.keyboard.press('Escape')
  await expect(card).toHaveCount(0)
})

test('SUI-B AnimatedFileUpload：选文件出现一行，可移除；超限的被拦下并提示', async ({ page }) => {
  await open(page, THEMES[0], 'animated-file-upload')
  const box = section(page, 'animated-file-upload')
  const input = box.locator('input[type="file"]')
  await input.setInputFiles({ name: 'bars.csv', mimeType: 'text/csv', buffer: Buffer.from('a,b\n1,2\n') })
  const list = box.getByRole('list', { name: '已选文件' })
  await expect(list.getByText('bars.csv')).toBeVisible()
  await list.getByRole('button', { name: '移除 bars.csv' }).click()
  await expect(list).toHaveCount(0)
  await input.setInputFiles({ name: 'big.csv', mimeType: 'text/csv', buffer: Buffer.alloc(5 * 1024 * 1024 + 1) })
  await expect(box.getByRole('alert')).toContainText('超过 5.0 MB')
  await expect(list).toHaveCount(0)
  const zone = box.getByRole('button', { name: /导入回测数据/ })
  expect((await zone.boundingBox())!.height).toBeGreaterThan(80)
})

test('SUI-B ExpandableCards：点一张它撑宽并露出详情，再点收回', async ({ page }) => {
  await open(page, THEMES[0], 'expandable-cards')
  const box = section(page, 'expandable-cards')
  const card = box.locator('[data-card-id="v2"]')
  const narrow = (await card.boundingBox())!.width
  await box.getByRole('button', { name: 'v2' }).click()
  await expect(box.getByRole('button', { name: 'v2' })).toHaveAttribute('aria-expanded', 'true')
  await expect(box.getByText('加入波动率过滤')).toBeVisible()
  await expect.poll(async () => (await card.boundingBox())!.width, { timeout: 3000 }).toBeGreaterThan(narrow + 200)
  await box.getByRole('button', { name: 'v2' }).click()
  await expect
    .poll(async () => Math.round((await card.boundingBox())!.width), { timeout: 3000 })
    .toBeLessThan(narrow + 3)
})

test('SUI-B TimeMachineStack：方向键往后翻，状态播报变化，最前一张换成下一个版本', async ({ page }) => {
  await open(page, THEMES[0], 'time-machine-stack')
  const box = section(page, 'time-machine-stack')
  const list = box.getByRole('listbox', { name: '策略版本史' })
  await expect(list.getByRole('option', { selected: true })).toContainText('v3')
  await list.focus()
  await page.keyboard.press('ArrowDown')
  // 飞出去的那张在退场动画里还留着旧的 aria-selected，等它卸载。
  await expect(list.getByRole('option', { selected: true })).toHaveCount(1)
  await expect(list.getByRole('option', { selected: true })).toContainText('v2')
  await expect(box.locator('[aria-live="polite"]')).toHaveText('第 2 个，共 4 个')
  await page.keyboard.press('End')
  await expect(list.getByRole('option', { selected: true })).toContainText('v0')
  await page.keyboard.press('Home')
  await expect(list.getByRole('option', { selected: true })).toContainText('v3')
  // 后面的面板缩小：最前一张的宽度大于次前一张。
  const [front, back] = await list
    .getByRole('option')
    .evaluateAll((els) => els.map((el) => el.getBoundingClientRect().width))
  expect(Math.max(front!, back!)).toBeGreaterThan(Math.min(front!, back!))
})

test('SUI-B FloatingNavbar：往下滚时让路，往回滚立刻出现；点项换当前项', async ({ page }) => {
  await open(page, THEMES[0], 'floating-navbar')
  const scroller = page.getByTestId('floating-scroller')
  const nav = scroller.getByRole('navigation', { name: '报告章节' })
  await expect(nav).not.toHaveAttribute('data-hidden', '')
  await nav.getByRole('button', { name: '风险' }).click()
  await expect(nav.getByRole('button', { name: '风险' })).toHaveAttribute('aria-current', 'page')
  await scroller.evaluate((el) => (el.scrollTop = 300))
  await expect(nav).toHaveAttribute('data-hidden', '')
  await expect.poll(() => nav.evaluate((el) => getComputedStyle(el).opacity)).toBe('0')
  await scroller.evaluate((el) => (el.scrollTop = 200))
  await expect(nav).not.toHaveAttribute('data-hidden', '')
  await expect.poll(() => nav.evaluate((el) => getComputedStyle(el).opacity)).toBe('1')
})

test('SUI-B ExpandableNavbar：点入口长出面板、条被撑高，换入口面板换内容，Esc 收起', async ({ page }) => {
  await open(page, THEMES[0], 'expandable-navbar')
  const nav = section(page, 'expandable-navbar').getByRole('navigation', { name: '工作区' })
  const closed = (await nav.boundingBox())!.height
  await nav.getByRole('button', { name: '行情' }).click()
  await expect(nav.getByRole('region', { name: '行情' })).toContainText('自选')
  await expect.poll(async () => (await nav.boundingBox())!.height, { timeout: 3000 }).toBeGreaterThan(closed + 30)
  await nav.getByRole('button', { name: '研究' }).click()
  await expect(nav.getByRole('region', { name: '研究' })).toContainText('因子库')
  await page.keyboard.press('Escape')
  await expect(nav.getByRole('region')).toHaveCount(0)
  await expect
    .poll(async () => Math.round((await nav.boundingBox())!.height), { timeout: 3000 })
    .toBe(Math.round(closed))
})

test('SUI-B MacTerminal：命令逐字敲入、输出逐行出现，播完全文在读屏文本里，重播从头来', async ({ page }) => {
  await open(page, THEMES[0], 'mac-terminal')
  const term = section(page, 'mac-terminal').getByRole('group', { name: '回测日志回放' })
  const shown = term.locator('pre')
  await expect.poll(() => shown.textContent(), { timeout: 8000 }).toContain('sharpe 1.42')
  await expect(term.locator('.sr-only')).toContainText('katana backtest momentum')
  expect((await term.boundingBox())!.height).toBeGreaterThan(120)
  await section(page, 'mac-terminal').getByRole('button', { name: '重播' }).click()
  await expect
    .poll(
      () => section(page, 'mac-terminal').getByRole('group', { name: '回测日志回放' }).locator('pre').textContent(),
      { timeout: 8000 },
    )
    .toContain('sharpe 1.42')
})

test('SUI-B FolderReveal：悬停翻开前盖并扇出卡，点击型的点一下开合', async ({ page }) => {
  await open(page, THEMES[0], 'folder-reveal')
  const folders = section(page, 'folder-reveal').locator('[data-slot="folder-reveal"]')
  const hover = folders.nth(0)
  const flap = hover.getByRole('button', { name: '季度报告' })
  await expect(flap).toHaveAttribute('aria-expanded', 'false')
  await hover.hover()
  await expect(flap).toHaveAttribute('aria-expanded', 'true')
  await expect(hover.getByText('Q1 回测')).toBeVisible()
  await expect
    .poll(async () => (await hover.getByText('Q1 回测').boundingBox())!.x, { timeout: 3000 })
    .toBeLessThan((await hover.getByText('Q3 回测').boundingBox())!.x - 40)
  await page.mouse.move(2, 2)
  await expect(flap).toHaveAttribute('aria-expanded', 'false')
  const click = folders.nth(1).getByRole('button', { name: '因子库' })
  await click.click()
  await expect(click).toHaveAttribute('aria-expanded', 'true')
  await click.click()
  await expect(click).toHaveAttribute('aria-expanded', 'false')
})

test('SUI-B GlassCard：毛玻璃有背景模糊，悬停时抬起', async ({ page }) => {
  await open(page, THEMES[0], 'glass-card')
  const card = section(page, 'glass-card').locator('[data-slot="glass-card"]')
  await expect(card).toBeVisible()
  expect(await card.evaluate((el) => getComputedStyle(el).backdropFilter)).toContain('blur(11px)')
  const at = async () => (await card.boundingBox())!.y
  const rest = await at()
  await card.hover()
  await expect.poll(at, { timeout: 3000 }).toBeLessThan(rest - 1.5)
  await page.mouse.move(2, 2)
  await expect.poll(async () => Math.round(await at()), { timeout: 3000 }).toBe(Math.round(rest))
})

test('SUI-B GlowHoverCard：指针进卡光斑亮起并跟着走，离开后熄灭', async ({ page }) => {
  await open(page, THEMES[0], 'glow-hover-card')
  const card = section(page, 'glow-hover-card').locator('[data-slot="glow-hover-card"]').first()
  const spot = card.locator('[data-slot="glow-hover-card-spot"]')
  await expect(spot).toHaveCSS('opacity', '0')
  const box = (await card.boundingBox())!
  await page.mouse.move(box.x + 20, box.y + 20)
  await page.mouse.move(box.x + 40, box.y + 30)
  await expect.poll(() => spot.evaluate((el) => getComputedStyle(el).opacity)).toBe('1')
  expect(await card.evaluate((el) => el.style.getPropertyValue('--glow-x'))).toBe('40px')
  await page.mouse.move(2, 2)
  await expect.poll(() => spot.evaluate((el) => getComputedStyle(el).opacity)).toBe('0')
})

test('SUI-B GooeyPopover：点圆钮长出面板，点外面或 Esc 缩回', async ({ page }) => {
  await open(page, THEMES[0], 'gooey-popover')
  const box = section(page, 'gooey-popover')
  const trigger = box.getByRole('button', { name: '打开咨询' })
  await expect(trigger).toHaveAttribute('aria-expanded', 'false')
  await trigger.click()
  await expect(trigger).toHaveAttribute('aria-expanded', 'true')
  const panel = box.getByRole('group').filter({ hasText: '对策略有疑问' })
  await expect(panel).toBeVisible()
  await expect.poll(async () => (await panel.boundingBox())!.width, { timeout: 3000 }).toBeGreaterThan(230)
  await page.keyboard.press('Escape')
  await expect(trigger).toHaveAttribute('aria-expanded', 'false')
  await expect(panel).toHaveCount(0, { timeout: 3000 })
})

test('SUI-B MorphSurface：药丸点开长成面板（宽高变大），点外面收回', async ({ page }) => {
  await open(page, THEMES[0], 'morph-surface')
  const surface = section(page, 'morph-surface').locator('[data-slot="morph-surface"]')
  const pill = await surface.boundingBox()
  expect(pill!.height).toBeLessThan(60)
  await section(page, 'morph-surface').getByRole('button', { name: '问 AI' }).click()
  await expect(surface).toHaveAttribute('data-open', '')
  await expect.poll(async () => (await surface.boundingBox())!.width, { timeout: 3000 }).toBeGreaterThan(330)
  expect((await surface.boundingBox())!.height).toBeGreaterThan(140)
  await expect(surface.getByRole('textbox', { name: '问题' })).toBeVisible()
  await page.mouse.click(900, 40)
  await expect(surface).not.toHaveAttribute('data-open', '')
  await expect.poll(async () => (await surface.boundingBox())!.height, { timeout: 3000 }).toBeLessThan(60)
})

test('SUI-B TiltCard：指针在卡上移动时卡转动，离开后回正', async ({ page }) => {
  await open(page, THEMES[0], 'tilt-card')
  const card = section(page, 'tilt-card').locator('[data-slot="tilt-card"]').first()
  const matrix = () => card.evaluate((el) => getComputedStyle(el).transform)
  const box = (await card.boundingBox())!
  await page.mouse.move(box.x + 10, box.y + 10)
  await page.mouse.move(box.x + box.width - 10, box.y + box.height - 10)
  await expect.poll(matrix, { timeout: 3000 }).not.toBe('none')
  await page.mouse.move(2, 2)
  await expect
    .poll(
      async () =>
        (await matrix()) === 'none' ||
        /matrix3d\(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1\)|matrix\(1, 0, 0, 1, 0, 0\)/.test(await matrix()),
      { timeout: 4000 },
    )
    .toBe(true)
})

test('SUI-B 并入已有件：页签内容淡入、对话框头身脚依次进场、滚动条悬停变宽', async ({ page }) => {
  await open(page, THEMES[0], 'tabs')
  const panel = section(page, 'tabs').locator('[data-slot="tabs-content"][data-state="active"]').first()
  expect(await panel.evaluate((el) => getComputedStyle(el).animationName)).toBe('kc-fade-in')
  await open(page, THEMES[0], 'dialog')
  await section(page, 'dialog').getByRole('button').first().click()
  const head = page.locator('[data-slot="dialog-content"] > [data-slot="dialog-header"]').first()
  await expect(head).toBeVisible()
  expect(await head.evaluate((el) => getComputedStyle(el).animationName)).toBe('kc-dialog-part-in')
  await page.keyboard.press('Escape')
})

// ---- AI 组（src/ai/，改自 SmoothUI）：demo 里的流式靠 window.__liveStep 步进，自动化浏览器默认暂停实时 ----
const aiStep = (page: Page, count: number) => page.evaluate((n) => window.__liveStep?.(n), count)

test('AI 审批：单击不批，按住填满才批；批后选中项铺满、其余收没；拒绝是普通单击', async ({ page }) => {
  await open(page, THEMES[0], 'ai-approval')
  const card = page.locator('[data-gallery-approval] [data-slot="ai-approval"]')
  const last = page.locator('[data-gallery-approval-last]')
  await expect(card.locator('[data-slot="ai-approval-facts"] dt')).toHaveText(['标的', '方向', '数量', '限价'])
  const hold = card.locator('.k-hold')
  await expect(hold).toBeVisible()
  const box = (await hold.boundingBox())!
  expect(box.width).toBeGreaterThan(80)
  await hold.click()
  await expect(last).toHaveText('未决定')
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  await page.mouse.down()
  await expect
    .poll(async () => Number(await hold.getAttribute('data-progress')), { timeout: 3000 })
    .toBeGreaterThan(0.3)
  await expect(last).toHaveText('approve', { timeout: 5000 })
  await page.mouse.up()
  await expect(card).toHaveAttribute('data-resolved', 'approve')
  await expect(card.locator('[data-slot="ai-approval-resolved"]')).toContainText('批准下单')
  await expect(card.locator('.k-hold')).toHaveCount(0)
  // 重播后点「拒绝」：普通按钮，单击就决定。
  const section_ = section(page, 'ai-approval')
  await section_.getByRole('button', { name: '重播' }).click()
  await card.getByRole('button', { name: '拒绝' }).click()
  await expect(last).toHaveText('reject')
  await expect(card.locator('[data-slot="ai-approval-resolved"]')).toContainText('拒绝')
})

test('AI 改动对比：+N -M 从行数算；接受后按钮收起写「已接受」，拒绝后各行收掉', async ({ page }) => {
  await open(page, THEMES[0], 'ai-diff')
  const card = page.locator('[data-gallery-diff] [data-slot="ai-diff"]')
  await expect(card.locator('[data-slot="ai-diff-count"]')).toHaveText('+3-2')
  await expect(card.locator('[data-slot="ai-diff-line"]')).toHaveCount(7)
  const added = card.locator('[data-slot="ai-diff-line"][data-kind="added"]').first()
  await expect(added).toHaveCSS('clip-path', /inset\(0(px|%)? 0(px|%)? 0(px|%)? 0(px|%)?\)|none/, { timeout: 3000 })
  expect(await bg(added)).not.toBe('rgba(0, 0, 0, 0)')
  await card.locator('[data-slot="ai-diff-accept"]').click()
  await expect(card.locator('[data-slot="ai-diff-decision"]')).toHaveText('已接受')
  await expect(card.locator('[data-slot="ai-diff-accept"]')).toHaveCount(0)
  await section(page, 'ai-diff').getByRole('button', { name: '重播' }).click()
  await card.locator('[data-slot="ai-diff-reject"]').click()
  await expect(card.locator('[data-slot="ai-diff-decision"]')).toHaveText('已拒绝')
  await expect(card.locator('[data-slot="ai-diff-line"]')).toHaveCount(0)
})

test('AI 工具调用：状态环随状态变（运行缺一口并转、成功变绿画对勾）；有参数才能展开', async ({ page }) => {
  await open(page, THEMES[0], 'ai-tool-call')
  const call = page.locator('[data-gallery-toolcall] [data-slot="ai-tool-call"]')
  const ring = call.locator('[data-slot="ai-tool-call-ring"] circle')
  await expect(call).toHaveAttribute('data-status', 'running')
  await expect(ring).toHaveCSS('stroke-dasharray', /0\.68/)
  await expect(call.locator('.k-status-spin')).toHaveCount(1)
  await expect(call.locator('.sr-only')).toHaveText('运行中')
  await section(page, 'ai-tool-call').getByRole('button', { name: '下一个状态' }).click()
  await expect(call).toHaveAttribute('data-status', 'success')
  await expect(call.locator('[data-slot="ai-tool-call-ring"] path')).toHaveCount(1)
  const green = await token(page, '--signal-green')
  await expect.poll(() => ring.evaluate((el) => getComputedStyle(el).stroke), { timeout: 2000 }).toBe(green)
  const trigger = call.locator('[data-slot="ai-tool-call-trigger"]')
  await expect(trigger).toHaveAttribute('aria-expanded', 'false')
  await trigger.click()
  await expect(call.locator('[data-slot="ai-tool-call-detail"]')).toContainText('参数')
  await expect(call.locator('[data-slot="ai-tool-call-detail"]')).toContainText('结果')
  await section(page, 'ai-tool-call').getByRole('button', { name: '下一个状态' }).click()
  await expect(call.locator('[data-slot="ai-tool-call-ring"] path')).toHaveCount(2)
})

test('AI 推理：流式中有流光并展开，结束后自己收起并报耗时；手动开合后不再自动', async ({ page }) => {
  await open(page, THEMES[0], 'ai-reasoning')
  const box = page.locator('[data-gallery-reasoning] [data-slot="ai-reasoning"]')
  const summary = box.locator('[data-slot="ai-reasoning-summary"]')
  await expect(box).toHaveAttribute('data-streaming', 'true')
  await expect(summary).toHaveText('思考中')
  await expect(summary).toHaveClass(/k-ai-shimmer/)
  await expect(box.locator('[data-slot="ai-reasoning-content"]')).toBeVisible()
  await aiStep(page, 4)
  await expect(summary).toHaveText(/思考了 \d+\.\d 秒/)
  await expect(summary).not.toHaveClass(/k-ai-shimmer/)
  await expect(box.locator('[data-slot="ai-reasoning-content"]')).toHaveCount(0, { timeout: 3000 })
  await box.locator('[data-slot="ai-reasoning-trigger"]').click()
  await expect(box.locator('[data-slot="ai-reasoning-content"]')).toBeVisible()
  await page.waitForTimeout(900)
  await expect(box.locator('[data-slot="ai-reasoning-content"]')).toBeVisible()
})

test('AI 流式回答：词到了才进场，[n] 变成行内引用，悬停弹出来源；光标在流式中才有', async ({ page }) => {
  await open(page, THEMES[0], 'ai-response')
  const response = page.locator('[data-gallery-response] [data-slot="ai-response"]')
  // 一开始就是流式中（还没有字），光标在。
  await expect(response.locator('[data-slot="ai-response-caret"]')).toHaveCount(1)
  await aiStep(page, 1)
  const len1 = (await response.innerText()).length
  await aiStep(page, 2)
  await expect.poll(async () => (await response.innerText()).length).toBeGreaterThan(len1)
  await aiStep(page, 60)
  await expect(response.locator('[data-slot="ai-response-caret"]')).toHaveCount(0)
  await expect(response).toContainText('三方面原因')
  const cites = response.locator('[data-slot="web-search-citation"]')
  await expect(cites).toHaveCount(3)
  await expect(response).not.toContainText('[1]')
  await cites.first().hover()
  await expect(response.locator('[data-slot="web-search-preview"]')).toContainText('贵州茅台批发价')
})

test('AI 上下文用量：越过 80% 变琥珀、95% 变红；悬停弹出分项', async ({ page }) => {
  await open(page, THEMES[0], 'ai-context-meter')
  const meters = section(page, 'ai-context-meter').locator('[data-slot="ai-context-meter"]')
  await expect(meters.nth(1)).toHaveAttribute('data-level', 'ok')
  await expect(meters.nth(2)).toHaveAttribute('data-level', 'warning')
  await expect(meters.nth(3)).toHaveAttribute('data-level', 'danger')
  const stroke = (index: number) =>
    meters
      .nth(index)
      .locator('[data-slot="ai-context-ring"]')
      .evaluate((el) => getComputedStyle(el).stroke)
  expect(await stroke(2)).toBe(await token(page, '--signal-amber'))
  expect(await stroke(3)).toBe(await token(page, '--signal-red'))
  await expect(meters.nth(0).locator('[data-slot="ai-context-readout"]')).toHaveText('62k/128k')
  await meters.nth(0).locator('button').hover()
  await expect(meters.nth(0).locator('[data-slot="ai-context-breakdown"] li')).toHaveCount(4)
})

test('AI 消息：动作平时透明、悬停与键盘聚焦才显出；赞踩只在助手消息上；点赞后回调', async ({ page }) => {
  await open(page, THEMES[0], 'ai-message')
  const root = page.locator('[data-gallery-message]')
  const user = root.locator('[data-slot="ai-message"][data-from="user"]')
  const assistant = root.locator('[data-slot="ai-message"][data-from="assistant"]')
  await expect(user.locator('[data-slot="ai-message-up"]')).toHaveCount(0)
  const copy = assistant.locator('[data-slot="ai-message-copy"]')
  await expect(copy).toHaveCSS('opacity', '0')
  await assistant.hover()
  await expect(copy).toHaveCSS('opacity', '1')
  await assistant.locator('[data-slot="ai-message-up"]').click()
  await expect(page.locator('[data-gallery-message-last]')).toHaveText('赞')
  await expect(assistant.locator('[data-slot="ai-message-up"]')).toHaveAttribute('aria-pressed', 'true')
  // 点过的按钮还留着焦点，焦点在里面时动作照样显着；先让它失焦、指针移开，才淡掉。
  await assistant.locator('[data-slot="ai-message-up"]').evaluate((el) => (el as HTMLElement).blur())
  await page.mouse.move(0, 0)
  await expect(copy).toHaveCSS('opacity', '0')
  await copy.focus()
  await expect(copy).toHaveCSS('opacity', '1')
})

test('AI 提示词输入框：回车发送、Shift+回车换行并长高；输入法选词中的回车不发送；流式中发送钮变停止', async ({
  page,
}) => {
  await open(page, THEMES[0], 'ai-prompt-input')
  const root = page.locator('[data-gallery-prompt] [data-slot="ai-prompt-input"]')
  const field = root.getByRole('textbox', { name: '向交易助手提问' })
  const send = root.locator('[data-slot="ai-prompt-send"]')
  const sent = page.locator('[data-gallery-prompt-sent]')
  await expect(send).toBeDisabled()
  const h0 = (await field.boundingBox())!.height
  await field.fill('第一行')
  await expect(send).toBeEnabled()
  await field.press('Shift+Enter')
  await field.pressSequentially('第二行')
  await field.press('Shift+Enter')
  await field.pressSequentially('第三行')
  await expect.poll(async () => (await field.boundingBox())!.height).toBeGreaterThan(h0 + 20)
  // 输入法选词：合成事件期间的回车不发送。
  await field.evaluate((el) => {
    el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, isComposing: true, keyCode: 229 }))
  })
  await expect(sent).toHaveText('未发送')
  await field.press('Enter')
  await expect(sent).toContainText('第一行')
  await expect(sent).toContainText('第三行')
  await expect(field).toHaveValue('')
  expect((await field.boundingBox())!.height).toBeLessThan(h0 + 4)
  // 字数到 80%（32/40）才出计数，超了变红。
  await field.fill('一'.repeat(31))
  await expect(root.locator('[data-slot="ai-prompt-counter"]')).toHaveCount(0)
  await field.fill('一'.repeat(33))
  await expect(root.locator('[data-slot="ai-prompt-counter"]')).toHaveText('33/40')
  await field.fill('一'.repeat(41))
  await expect(root.locator('[data-slot="ai-prompt-counter"]')).toHaveCSS('color', await token(page, '--signal-red'))
  // 流式：发送钮变停止，空草稿也可按。
  await field.fill('')
  await section(page, 'ai-prompt-input').getByRole('button', { name: 'streaming' }).click()
  await expect(send).toHaveAttribute('data-mode', 'stop')
  await expect(send).toHaveAccessibleName('停止生成')
  await expect(send).toBeEnabled()
  await send.click()
  await expect(send).toHaveAttribute('data-mode', 'send')
})

test('AI 建议药丸：点选回调，换一组后旧的退出新的进场', async ({ page }) => {
  await open(page, THEMES[0], 'ai-suggestions')
  const chips = page.locator('[data-gallery-suggestions] [data-slot="ai-suggestion"]')
  await expect(chips).toHaveCount(3)
  await chips.nth(1).click()
  await expect(page.locator('[data-gallery-suggestions-last]')).toHaveText('我的持仓里谁拖累最大')
  await section(page, 'ai-suggestions').getByRole('button', { name: '换一组' }).click()
  await expect(chips).toHaveCount(2)
  await expect(chips.first()).toHaveText('把止损收紧一点会怎样')
})

test('AI 产出框：切页签内容换且方向键可切；复制钮在复制后换名', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await open(page, THEMES[0], 'ai-artifact')
  const root = page.locator('[data-gallery-artifact] [data-slot="ai-artifact"]')
  const tabs = root.getByRole('tab')
  await expect(tabs).toHaveCount(2)
  await expect(tabs.first()).toHaveAttribute('aria-selected', 'true')
  await expect(root.getByRole('tabpanel')).toContainText('快线')
  await tabs.first().focus()
  await page.keyboard.press('ArrowRight')
  await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'true')
  await expect(root.getByRole('tabpanel')).toContainText('"fast_window": 12')
  await expect(root).toHaveAttribute('data-pane', 'code')
  await root.getByRole('button', { name: '复制' }).click()
  await expect(root.getByRole('button', { name: '已复制' })).toBeVisible()
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain('"stop_loss": 0.035')
})

test('AI 分支：上一个下一个翻页并绕回，页码跟着变', async ({ page }) => {
  await open(page, THEMES[0], 'ai-branch')
  const root = page.locator('[data-gallery-branch]')
  const page_ = root.locator('[data-slot="ai-branch-page"]')
  await expect(page_).toHaveText('第 1 个，共 3 个')
  await expect(root.locator('[data-slot="ai-branch-messages"]')).toContainText('板块与资金面共振')
  await root.getByRole('button', { name: '下一个回答' }).click()
  await expect(page_).toHaveText('第 2 个，共 3 个')
  await expect(root.locator('[data-slot="ai-branch-messages"]')).toContainText('批价回落与融资卖出')
  await root.getByRole('button', { name: '下一个回答' }).click()
  await root.getByRole('button', { name: '下一个回答' }).click()
  await expect(page_).toHaveText('第 1 个，共 3 个')
  await root.getByRole('button', { name: '上一个回答' }).click()
  await expect(page_).toHaveText('第 3 个，共 3 个')
})

test('AI 计划：计数从任务派生，推进一步后完成数变、失败的行带红叉', async ({ page }) => {
  await open(page, THEMES[0], 'ai-task-list')
  const root = page.locator('[data-gallery-plan] [data-slot="ai-task-list"]')
  const count = root.locator('[data-slot="ai-task-count"]')
  await expect(count).toHaveText('2/6')
  // 父行与正在跑的子步骤都是 running，但流光下划线一次只有一处（叶子上）。
  await expect(root.locator('[data-slot="ai-task"][data-status="running"]')).toHaveCount(2)
  await expect(root.locator('.k-ai-sweep')).toHaveCount(1)
  const next = section(page, 'ai-task-list').getByRole('button', { name: '推进一步' })
  await next.click()
  await expect(count).toHaveText('4/6')
  // 轮到「对照持仓」这一叶子行在跑：流光仍是一处。
  await expect(root.locator('.k-ai-sweep')).toHaveCount(1)
  await next.click()
  await next.click()
  await expect(root.locator('.k-ai-sweep')).toHaveCount(0)
  await expect(root.locator('[data-slot="ai-task"][data-status="failed"]')).toHaveCount(1)
  await expect(root.locator('[data-slot="ai-task"][data-status="failed"] .k-ai-draw')).toHaveCount(1)
  await expect(count).toHaveText('5/6')
  await expect(root.locator('[data-slot="ai-task"][data-status="failed"] .sr-only')).toHaveText('· 失败')
})

test('Agent 头像：画布有尺寸、不是空白；同一个种子的静止帧每次一样', async ({ page }) => {
  await open(page, THEMES[0], 'agent-avatar')
  const canvases = page.locator('[data-gallery-avatar] canvas[data-slot="agent-avatar"]')
  await expect(canvases).toHaveCount(4)
  const box = (await canvases.first().boundingBox())!
  expect(box.width).toBe(64)
  await expect(canvases.first()).toHaveAttribute('aria-label', '研究员')
  const stillA = await canvases.nth(1).evaluate((el) => (el as HTMLCanvasElement).toDataURL())
  const blank = await page.evaluate(() => document.createElement('canvas').toDataURL())
  expect(stillA.length).toBeGreaterThan(blank.length)
  await page.reload()
  await page.locator('[data-gallery-avatar] canvas').nth(1).waitFor()
  const stillB = await page
    .locator('[data-gallery-avatar] canvas')
    .nth(1)
    .evaluate((el) => (el as HTMLCanvasElement).toDataURL())
  expect(stillB).toBe(stillA)
  // 不同种子不同脸。
  const risk = await page
    .locator('[data-gallery-avatar] canvas')
    .nth(2)
    .evaluate((el) => (el as HTMLCanvasElement).toDataURL())
  expect(risk).not.toBe(stillA)
})

test('MatrixOrb 并入的状态：流式、完成、出错；完成变绿、出错变红', async ({ page }) => {
  await open(page, THEMES[0], 'matrix-orb')
  const area = section(page, 'matrix-orb')
  const orb = area.locator('[data-gallery-orb] canvas')
  for (const [name, state, color] of [
    ['流式', 'streaming', '--signal-orange'],
    ['完成', 'done', '--signal-green'],
    ['出错', 'error', '--signal-red'],
  ] as const) {
    await area.getByRole('button', { name, exact: true }).first().click()
    await expect(orb).toHaveAttribute('data-state', state)
    await expect(orb).toHaveCSS('color', await token(page, color))
    // 画上了点：缓冲里有不透明像素。
    await expect
      .poll(() =>
        orb.evaluate((el) => {
          const canvas = el as HTMLCanvasElement
          const data = canvas.getContext('2d')!.getImageData(0, 0, canvas.width, canvas.height).data
          return data.some((value, index) => index % 4 === 3 && value > 0)
        }),
      )
      .toBe(true)
  }
})

test('AI 交易助手对话：推理 → 工具 → 带来源的回答 → 减仓建议进审批，按住确认后选中项铺满；上下文用量随之增长', async ({
  page,
}) => {
  await open(page, THEMES[0], 'ai-conversation')
  const root = page.locator('[data-gallery-assistant]')
  const log = root.getByRole('log', { name: '交易助手对话' })
  await expect(log).toContainText('600519 今天为什么跌')
  await expect(log.locator('[data-slot="ai-reasoning"]')).toHaveCount(0)
  const readout = root.locator('[data-slot="ai-context-readout"]')
  const before = await readout.innerText()
  await aiStep(page, 1)
  await expect(log.locator('[data-slot="ai-reasoning"]')).toHaveCount(1)
  await expect(root.locator('[data-slot="ai-prompt-input"]')).toHaveAttribute('data-state', 'thinking')
  await aiStep(page, 4)
  await expect(log.locator('[data-slot="ai-tool-call"]').first()).toHaveAttribute('data-status', /running|success/)
  await aiStep(page, 3)
  await expect(log.locator('[data-slot="ai-tool-call"][data-status="success"]')).toHaveCount(2)
  await expect(root.locator('[data-slot="ai-prompt-input"]')).toHaveAttribute('data-state', 'streaming')
  await aiStep(page, 30)
  await expect(log.locator('[data-slot="ai-response"]')).toContainText('三方面原因')
  await expect(log.locator('[data-slot="web-search-citation"]')).toHaveCount(3)
  await expect(root.locator('[data-slot="ai-prompt-input"]')).toHaveAttribute('data-state', 'done')
  const card = log.locator('[data-slot="ai-approval"]')
  await expect(card).toBeVisible()
  await expect(card).toContainText('600519')
  expect(await readout.innerText()).not.toBe(before)
  // 回答出来后读者在底部时，审批卡在可见区里（对话区跟着长高）。
  await expect(card).toBeInViewport()
  const hold = card.locator('.k-hold')
  await hold.scrollIntoViewIfNeeded()
  const box = (await hold.boundingBox())!
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  await page.mouse.down()
  await expect(card).toHaveAttribute('data-resolved', 'approve', { timeout: 6000 })
  await page.mouse.up()
  await expect(card.locator('[data-slot="ai-approval-resolved"]')).toContainText('批准下单')
  // 往上翻后不再跟随，出现「回到最新」。
  await log.evaluate((el) => el.scrollTo({ top: 0 }))
  await expect(root.locator('[data-slot="ai-conversation-jump"]')).toBeVisible()
  await root.locator('[data-slot="ai-conversation-jump"]').click()
  await expect(root.locator('[data-slot="ai-conversation-jump"]')).toHaveCount(0, { timeout: 3000 })
})

// ---------- SmoothUI 交易批：信息流、跑马灯、通知岛、置顶、点阵图、角标、加载与滚动进度等 ----------

test('SmoothUI 交易批 AnimatedList：新快讯弹入第一行并高亮，悬停时先攒着，移开后进来', async ({ page }) => {
  await open(page, THEMES[0], 'animated-list')
  const demo = liveDemo(page, 'animated-list')
  const rows = demo.locator('[data-slot="animated-list-item"]')
  await expect(rows).toHaveCount(3)
  expect((await rows.first().boundingBox())!.height).toBeGreaterThan(20)
  await demo.getByTestId('wire-push').click()
  await expect(rows).toHaveCount(4)
  await expect(rows.first()).toHaveClass(/k-live-enter/)
  await expect(rows.first()).toContainText('演示 4')
  // 悬停：新条目攒着，出提示；移开后进来。
  await rows.nth(1).hover()
  await demo.getByTestId('wire-push').dispatchEvent('click')
  await expect(demo.locator('[data-slot="animated-list-pending"]')).toContainText('1 条新快讯')
  await expect(rows).toHaveCount(4)
  await page.mouse.move(0, 0)
  await expect(rows).toHaveCount(5)
  await expect(demo.locator('[data-slot="animated-list-pending"]')).toHaveCount(0)
})

test('SmoothUI 交易批 InfiniteSlider：暂停时不动，开实时后轨道在平移；复制的一份对读屏隐藏', async ({ page }) => {
  await open(page, THEMES[0], 'infinite-slider')
  const demo = liveDemo(page, 'infinite-slider')
  const strip = demo.locator('[data-slot="infinite-slider"]').first()
  const track = strip.locator('[data-slot="infinite-slider-track"]')
  await expect(strip).toHaveAttribute('role', 'group')
  await expect(track.locator('> div[aria-hidden="true"]')).toHaveCount(1)
  expect((await strip.boundingBox())!.width).toBeGreaterThan(300)
  const x = () => track.evaluate((el) => (el as HTMLElement).style.transform)
  const before = await x()
  await page.waitForTimeout(400)
  expect(await x()).toBe(before)
  await demo.getByRole('button', { name: '实时' }).click()
  await expect.poll(x, { timeout: 4000 }).not.toBe(before)
})

test('SmoothUI 交易批 DynamicIsland：换视图时胶囊变到新内容的大小', async ({ page }) => {
  await open(page, THEMES[0], 'dynamic-island')
  const demo = liveDemo(page, 'dynamic-island')
  const island = demo.locator('[data-slot="dynamic-island-body"]')
  await expect(island).toHaveAttribute('data-view', 'idle')
  await expect(island).toHaveAttribute('role', 'status')
  const idle = (await island.boundingBox())!.width
  await demo.getByRole('button', { name: '成交回报' }).click()
  await expect(island).toHaveAttribute('data-view', 'fill')
  await expect(island).toContainText('成交 BTCUSDT 买入 0.50')
  await expect.poll(async () => (await island.boundingBox())!.width, { timeout: 3000 }).toBeGreaterThan(idle + 100)
  // 步进：按顺序到下一个视图。
  await liveStep(page)
  await expect(island).toHaveAttribute('data-view', 'fill')
  await demo.getByRole('button', { name: '炸板提醒' }).click()
  await expect(island).toContainText('云端科技 炸板')
})

test('SmoothUI 交易批 PinnedList：点一行钉到最上，满 3 个其余禁用，键盘 P 切换', async ({ page }) => {
  await open(page, THEMES[0], 'pinned-list')
  const doc = section(page, 'pinned-list')
  const pinned = doc.locator('[data-slot="pinned-list-item"][data-pinned]')
  await expect(pinned).toHaveCount(1)
  await expect(pinned.first()).toContainText('BTCUSDT')
  await doc.getByRole('button', { name: '置顶 NVDA' }).click()
  await expect(pinned).toHaveCount(2)
  await expect(doc.getByTestId('pinned-state')).toContainText('btc、nvda')
  await doc.getByRole('button', { name: '置顶 AAPL' }).click()
  await expect(pinned).toHaveCount(3)
  await expect(doc.getByRole('button', { name: '置顶 ETHUSDT' })).toHaveAttribute('aria-disabled', 'true')
  // 钉住的行排在最上面。
  const first = doc.locator('[data-slot="pinned-list-item"]').first()
  await expect(first).toHaveAttribute('data-pinned', 'true')
  // 键盘：焦点在被钉的行上按 P 取消。
  const row = doc.getByRole('button', { name: '取消置顶 AAPL' })
  await row.focus()
  await page.keyboard.press('p')
  await expect(pinned).toHaveCount(2)
  await expect(doc.getByTestId('pinned-state')).not.toContainText('aapl')
})

test('SmoothUI 交易批 AnimatedAvatarGroup：只画 maxVisible 枚加「+n」，悬停后相邻两枚拉开', async ({ page }) => {
  await open(page, THEMES[0], 'animated-avatar-group')
  const group = section(page, 'animated-avatar-group').locator('[data-slot="animated-avatar-group"]').first()
  await expect(group.locator('[data-slot="symbol-mark"]')).toHaveCount(4)
  await expect(group.locator('[data-slot="animated-avatar-group-more"]')).toHaveText('+3')
  const gap = async () => {
    const [a, b] = await Promise.all([
      group.locator('[data-slot="symbol-mark"]').nth(0).boundingBox(),
      group.locator('[data-slot="symbol-mark"]').nth(1).boundingBox(),
    ])
    return b!.x - (a!.x + a!.width)
  }
  const closed = await gap()
  await group.hover()
  await expect.poll(gap, { timeout: 3000 }).toBeGreaterThan(closed + 4)
  await expect(group).toHaveAttribute('data-expanded', 'true')
})

test('SmoothUI 交易批 HoverExpand：悬停的面板撑开、其余收窄，键盘聚焦同样展开', async ({ page }) => {
  await open(page, THEMES[0], 'hover-expand')
  const group = section(page, 'hover-expand').locator('[data-slot="hover-expand"]')
  const panels = group.getByRole('button')
  await expect(panels).toHaveCount(4)
  const width = async (i: number) => (await panels.nth(i).boundingBox())!.width
  await expect(panels.first()).toHaveAttribute('aria-pressed', 'true')
  await panels.nth(2).hover()
  await expect(panels.nth(2)).toHaveAttribute('aria-pressed', 'true')
  await expect.poll(async () => (await width(2)) > (await width(0)) * 2, { timeout: 3000 }).toBe(true)
  await expect(panels.nth(2)).toContainText('成交额 1,280 亿')
  await page.mouse.move(0, 0) // 鼠标移走，避免布局位移后的 mouseenter 抢走键盘的选中
  await panels.nth(3).focus()
  await expect(panels.nth(3)).toHaveAttribute('aria-pressed', 'true')
  await page.keyboard.press('ArrowLeft')
  await expect(panels.nth(2)).toHaveAttribute('aria-pressed', 'true')
})

test('SmoothUI 交易批 DitherChart：画布有尺寸、画入后有点，且点是 Bayer 量化后的纯点（透明度只有 0 与 255）', async ({
  page,
}) => {
  await open(page, THEMES[0], 'dither-chart')
  const canvases = section(page, 'dither-chart').locator('[data-slot="dither-chart"] canvas')
  await expect(canvases).toHaveCount(7)
  for (let i = 0; i < 7; i += 1) expect((await canvases.nth(i).boundingBox())!.width).toBeGreaterThan(100)
  const stats = () =>
    canvases.first().evaluate((canvas: HTMLCanvasElement) => {
      const data = canvas.getContext('2d')!.getImageData(0, 0, canvas.width, canvas.height).data
      let on = 0
      let odd = 0
      for (let i = 3; i < data.length; i += 4) {
        if (data[i] === 255) on += 1
        else if (data[i] !== 0) odd += 1
      }
      return { on, odd }
    })
  await expect.poll(async () => (await stats()).on, { timeout: 5000 }).toBeGreaterThan(200)
  expect((await stats()).odd).toBe(0)
  await expect(section(page, 'dither-chart').locator('.sr-only').first()).toContainText('净值走势')
})

test('SmoothUI 交易批 CountBadge：数字随点击变，超上限写 99+，清零淡出，状态点按状态着色', async ({ page }) => {
  await open(page, THEMES[0], 'count-badge')
  const doc = section(page, 'count-badge')
  const first = doc.locator('[data-slot="count-badge"]').first()
  await expect(first).toHaveAttribute('data-count', '3')
  await expect(first.locator('[data-slot="count-badge-badge"]')).toHaveText('3')
  await doc.getByRole('button', { name: '来 1 条' }).click()
  await expect(first).toHaveAttribute('data-count', '4')
  await expect(first.locator('[data-slot="count-badge-badge"]')).toHaveText('4')
  await doc.getByRole('button', { name: '120 条' }).click()
  await expect(first.locator('[data-slot="count-badge-badge"]')).toHaveText('99+')
  await doc.getByRole('button', { name: '清零' }).click()
  await expect(first.locator('[data-slot="count-badge-badge"]')).toHaveCount(0)
  await expect(doc.locator('[data-slot="count-badge-ping"]')).toHaveCount(1)
  const colors = await doc
    .locator('[data-variant="status"]')
    .evaluateAll((els) => els.map((el) => getComputedStyle(el).backgroundColor))
  expect(new Set(colors).size).toBe(4)
})

test('SmoothUI 交易批 SwitchboardCard：图案卡亮的灯数等于矩阵里的 1，随机卡暂停时不变、步进到实时后灯在动，整卡可点', async ({
  page,
}) => {
  await open(page, THEMES[0], 'switchboard-card')
  const demo = liveDemo(page, 'switchboard-card')
  const boards = demo.locator('[data-slot="switchboard-card-lights"]')
  await expect(boards.first().locator('span')).toHaveCount(90)
  const states = () =>
    boards
      .first()
      .locator('span')
      .evaluateAll((els) => els.map((el) => el.getAttribute('data-state')).join(''))
  const before = await states()
  await page.waitForTimeout(500)
  expect(await states()).toBe(before)
  await demo.getByRole('button', { name: '实时' }).click()
  await expect.poll(states, { timeout: 4000 }).not.toBe(before)
  await expect(boards.nth(1).locator('[data-state="high"]')).toHaveCount(28)
  await demo.getByRole('button', { name: 'TEST 图案' }).click()
  await expect(demo.getByTestId('switchboard-hits')).toHaveText('点击次数 1')
})

test('SmoothUI 交易批 AnimatedTags：点可选标签进已选区，点已选标签回去，空时显示空态', async ({ page }) => {
  await open(page, THEMES[0], 'animated-tags')
  const doc = section(page, 'animated-tags')
  const chosen = doc.locator('[data-slot="animated-tags-selected"]')
  const rest = doc.locator('[data-slot="animated-tags-available"]')
  await expect(chosen.getByRole('button')).toHaveCount(1)
  await expect(rest.getByRole('button')).toHaveCount(6)
  await rest.getByRole('button', { name: '关注 银行' }).click()
  await expect(chosen.getByRole('button', { name: '移除 银行' })).toBeVisible()
  await expect(rest.getByRole('button')).toHaveCount(5)
  await expect(doc.getByTestId('tags-state')).toHaveText('已选 2 个')
  await chosen.getByRole('button', { name: '移除 银行' }).click()
  await chosen.getByRole('button', { name: '移除 半导体' }).click()
  await expect(chosen.getByRole('button')).toHaveCount(0)
  await expect(chosen).toContainText('还没有关注的板块')
})

test('SmoothUI 交易批 ExposureSlider：键盘一格、十格、到头；拖动刻度尺改值；涨跌色按正负', async ({ page }) => {
  await open(page, THEMES[0], 'exposure-slider')
  const doc = section(page, 'exposure-slider')
  const ruler = doc.getByRole('slider', { name: '净敞口' })
  const value = doc.locator('[data-slot="exposure-slider-value"]')
  await expect(ruler).toHaveAttribute('aria-valuenow', '0')
  await ruler.focus()
  await page.keyboard.press('ArrowRight')
  await expect(ruler).toHaveAttribute('aria-valuenow', '1')
  await expect(value).toHaveText('+1%')
  await page.keyboard.press('PageUp')
  await expect(ruler).toHaveAttribute('aria-valuenow', '11')
  await page.keyboard.press('End')
  await expect(ruler).toHaveAttribute('aria-valuetext', '+20%')
  await page.keyboard.press('Home')
  await expect(ruler).toHaveAttribute('aria-valuenow', '-20')
  const down = await value.evaluate((el) => getComputedStyle(el).color)
  await doc.getByRole('button', { name: '做多 10%' }).click()
  await expect(ruler).toHaveAttribute('aria-valuenow', '10')
  expect(await value.evaluate((el) => getComputedStyle(el).color)).not.toBe(down)
  // 鼠标向左拖 5 格（65px），值加 5。
  const box = (await ruler.boundingBox())!
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  await page.mouse.down()
  await page.mouse.move(box.x + box.width / 2 - 70, box.y + box.height / 2, { steps: 6 })
  await page.mouse.up()
  await expect(ruler).toHaveAttribute('aria-valuenow', '15')
})

test('SmoothUI 交易批 PowerOffSlide：拖不到头弹回不触发，拖到头触发并显示执行中，键盘 Enter 直接确认', async ({
  page,
}) => {
  await open(page, THEMES[0], 'power-off-slide')
  const doc = section(page, 'power-off-slide')
  const knob = doc.getByRole('button', { name: '滑动全部平仓' })
  const log = doc.getByTestId('slide-log')
  const start = (await knob.boundingBox())!
  const drag = async (distance: number) => {
    const box = (await knob.boundingBox())!
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
    await page.mouse.down()
    await page.mouse.move(box.x + box.width / 2 + distance, box.y + box.height / 2, { steps: 8 })
    await page.mouse.up()
  }
  await drag(80)
  await expect(log).toHaveText('未执行')
  await expect.poll(async () => Math.abs((await knob.boundingBox())!.x - start.x), { timeout: 3000 }).toBeLessThan(2)
  await drag(175)
  await expect(log).toContainText('已发出全部平仓指令')
  await expect(doc.getByRole('status')).toContainText('平仓中')
  await expect(knob).toBeVisible({ timeout: 4000 })
  await page.evaluate(() => document.querySelector('[data-testid="slide-log"]')!.remove())
  await knob.focus()
  await page.keyboard.press('Enter')
  await expect(doc.getByRole('status')).toContainText('平仓中')
})

test('SmoothUI 交易批 AnimatedStepper：点步骤走到那一步，已过的步打钩，内容跟着换，方向键走', async ({ page }) => {
  await open(page, THEMES[0], 'animated-stepper')
  const doc = section(page, 'animated-stepper')
  const bar = doc.getByRole('tablist', { name: '下单步骤' })
  const tabs = bar.getByRole('tab')
  await expect(tabs).toHaveCount(3)
  await expect(tabs.nth(0)).toHaveAttribute('data-state', 'current')
  await expect(doc.getByRole('tabpanel').first()).toContainText('选择 BTCUSDT')
  await tabs.nth(2).click()
  await expect(tabs.nth(0)).toHaveAttribute('data-state', 'done')
  await expect(tabs.nth(1)).toHaveAttribute('data-state', 'done')
  await expect(tabs.nth(2)).toHaveAttribute('data-state', 'current')
  await expect(tabs.nth(0).locator('svg path')).toHaveCount(1)
  await expect(doc.getByRole('tabpanel').first()).toContainText('预计成交额')
  await tabs.nth(2).focus()
  await page.keyboard.press('ArrowLeft')
  await expect(tabs.nth(1)).toHaveAttribute('data-state', 'current')
  await expect(doc.getByRole('button', { name: '下一步' })).toBeEnabled()
  const vertical = doc.getByRole('tablist', { name: '审批步骤' })
  await expect(vertical.getByRole('tab').nth(1)).toHaveAttribute('data-state', 'current')
})

test('SmoothUI 交易批 Squircle：生成了 clip-path 路径，smoothing 不同角不同，描边是沿曲线的 SVG', async ({ page }) => {
  await open(page, THEMES[0], 'squircle')
  const items = section(page, 'squircle').locator('[data-slot="squircle"]')
  await expect(items).toHaveCount(2)
  const paths = await items.evaluateAll((els) => els.map((el) => (el as HTMLElement).style.clipPath))
  for (const path of paths) expect(path).toMatch(/^path\(/)
  expect(paths[0]).not.toBe(paths[1])
  await expect(items.nth(1).locator('svg path')).toHaveCount(1)
  expect((await items.first().boundingBox())!.width).toBe(96)
})

test('SmoothUI 交易批 GridLoader 与 MotionLoader：每个都是 role=status 有尺寸，亮格数对，款式齐全', async ({
  page,
}) => {
  await open(page, THEMES[0], 'grid-loader')
  const grid = section(page, 'grid-loader')
  await expect(grid.locator('[data-slot="grid-loader"]')).toHaveCount(12)
  const border = grid.getByRole('status', { name: '加载 border' })
  await expect(border.locator('[data-slot="grid-loader-cell"]')).toHaveCount(8)
  await expect(grid.getByRole('status', { name: '加载 cross' }).locator('[data-slot="grid-loader-cell"]')).toHaveCount(
    5,
  )
  expect((await border.boundingBox())!.width).toBe(32)
  // 轮换模式：过一个周期换了图案（亮格数变化）。
  const rotating = grid.getByRole('status', { name: '图案轮换' })
  const count = () => rotating.locator('[data-slot="grid-loader-cell"]').count()
  const first = await count()
  await expect.poll(count, { timeout: 5000 }).not.toBe(first)
  await open(page, THEMES[0], 'motion-loader')
  const loaders = section(page, 'motion-loader').locator('[data-slot="motion-loader"]')
  await expect(loaders).toHaveCount(8)
  for (let i = 0; i < 8; i += 1) expect((await loaders.nth(i).boundingBox())!.width).toBe(36)
})

test('SmoothUI 交易批 PagePreloader：遮罩先盖住，停留后揭开并卸载；四种款式都能揭开', async ({ page }) => {
  await open(page, THEMES[0], 'page-preloader')
  const demo = liveDemo(page, 'page-preloader')
  const cover = demo.locator('[data-slot="page-preloader"]')
  await expect(cover).toHaveAttribute('data-variant', 'curtain')
  await expect(cover).toHaveAttribute('data-stage', 'hold')
  expect((await cover.boundingBox())!.height).toBeGreaterThan(100)
  await expect(cover).toHaveCount(0, { timeout: 5000 })
  for (const variant of ['stairs', 'pixel', 'words']) {
    await demo.getByRole('button', { name: variant, exact: true }).click()
    await expect(cover).toHaveAttribute('data-variant', variant)
    await expect(cover).toHaveCount(0, { timeout: 6000 })
  }
  await demo.getByTestId('preloader-replay').click()
  await expect(cover).toHaveCount(1)
})

test('SmoothUI 交易批 ScrollProgress：滚动容器滚到底时进度条到 100，四种款式同步', async ({ page }) => {
  await open(page, THEMES[0], 'scroll-progress')
  const doc = section(page, 'scroll-progress')
  const bar = doc.getByRole('progressbar', { name: '阅读进度' })
  const ring = doc.getByRole('progressbar', { name: '环形进度' })
  await expect(bar).toHaveAttribute('aria-valuenow', '0')
  await expect(doc.getByRole('progressbar')).toHaveCount(4)
  const box = doc.getByTestId('scroll-box')
  await box.evaluate((el) => el.scrollTo({ top: el.scrollHeight }))
  await expect.poll(async () => Number(await bar.getAttribute('aria-valuenow')), { timeout: 5000 }).toBe(100)
  await expect(ring).toHaveAttribute('aria-valuenow', '100')
  await expect(ring).toContainText('100')
  await box.evaluate((el) => el.scrollTo({ top: el.scrollHeight / 2 }))
  await expect.poll(async () => Number(await bar.getAttribute('aria-valuenow')), { timeout: 5000 }).toBeLessThan(100)
})

const MOTION_FX_IDS = [
  'shader-reveal',
  'sdf-blob-transition',
  'aperture-blur-transition',
  'chroma-blur-transition',
  'aurora-curtain',
  'gravity-stars',
  'liquid-metal',
  'orb',
  'pixel-flow-field',
  'border-beam',
  'cursor-image-trail',
  'drawing-cursor',
  'emboss-surface',
  'holographic-foil',
  'magnetic-field',
  'parallax-layers',
  'progressive-blur',
  'scroll-image-reveal',
  'svg-clip-mask',
  'svg-draw-on-scroll',
  'ascii-render',
  'dither-image',
  'pixel-brush-canvas',
] as const

for (const id of MOTION_FX_IDS) {
  test(`SmoothUI 动效 ${id}：演示挂得上、有尺寸、控制台无报错`, async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(error.message))
    await open(page, THEMES[0], id)
    const demo = section(page, id).locator(`[data-gallery-motion="${id}"]`)
    await expect(demo).toBeVisible()
    const box = (await demo.boundingBox())!
    expect(box.width).toBeGreaterThan(100)
    expect(box.height).toBeGreaterThan(60)
    // 画布类（背景、媒体、画笔）要有真实像素尺寸，不是 0×0。
    for (const canvas of await demo.locator('canvas').all()) {
      const size = await canvas.evaluate((el) => [(el as HTMLCanvasElement).width, (el as HTMLCanvasElement).height])
      expect(size[0]).toBeGreaterThan(0)
      expect(size[1]).toBeGreaterThan(0)
    }
    await page.waitForTimeout(400)
    expect(errors).toEqual([])
  })
}

test('SmoothUI 动效 过场：点切换后标记 data-transitioning 亮起并在播完后熄灭，内容换了', async ({ page }) => {
  for (const id of ['shader-reveal', 'sdf-blob-transition', 'aperture-blur-transition', 'chroma-blur-transition']) {
    await open(page, THEMES[0], id)
    const demo = section(page, id).locator(`[data-gallery-motion="${id}"]`)
    const stage = demo.locator('[data-slot="shader-transition"]').first()
    const before = await demo.locator('strong').first().textContent()
    await demo.getByRole('button', { name: '切换视图' }).click()
    await expect(stage).toHaveAttribute('data-transitioning', /.+/)
    await expect(stage).not.toHaveAttribute('data-transitioning', /true/, { timeout: 4000 })
    expect(await demo.locator('strong').first().textContent()).not.toBe(before)
  }
})

test('SmoothUI 动效 过场：WebGL 不可用时退回淡入淡出，内容仍然会换', async ({ page }) => {
  await page.addInitScript(() => {
    HTMLCanvasElement.prototype.getContext = () => null
  })
  await open(page, THEMES[0], 'shader-reveal')
  const demo = section(page, 'shader-reveal').locator('[data-gallery-motion="shader-reveal"]')
  const before = await demo.locator('strong').first().textContent()
  await demo.getByRole('button', { name: '切换视图' }).click()
  await expect.poll(() => demo.locator('strong').first().textContent(), { timeout: 4000 }).not.toBe(before)
})

test('SmoothUI 动效 PixelFlowField：文字为空时不报错也不画点', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await open(page, THEMES[0], 'pixel-flow-field')
  await page.waitForTimeout(500)
  expect(errors).toEqual([])
})

test('SmoothUI 搬入 Scrubber：点条设值、拖动改值、键盘走步、读数与滚动数字跟着变', async ({ page }) => {
  await open(page, THEMES[0], 'scrubber')
  const sec = section(page, 'scrubber')
  const qty = sec.getByRole('slider', { name: '数量' })
  await expect(qty).toBeVisible()
  const box = (await qty.boundingBox())!
  expect(box.width).toBeGreaterThan(150)
  expect(box.height).toBeGreaterThan(24)
  // 点在中间：200（初值）变成 500 上下，吸附到 10 的倍数。
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2)
  const mid = Number(await qty.getAttribute('aria-valuenow'))
  expect(mid).toBeGreaterThanOrEqual(480)
  expect(mid).toBeLessThanOrEqual(520)
  expect(mid % 10).toBe(0)
  // 拖到最右：夹在最大值，读数写股数。
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  await page.mouse.down()
  await page.mouse.move(box.x + box.width + 80, box.y + box.height / 2, { steps: 6 })
  await page.mouse.up()
  await expect(qty).toHaveAttribute('aria-valuenow', '1000')
  await expect(qty).toHaveAttribute('aria-valuetext', '1000 股')
  // 键盘：← 一步（10），Shift+← 十步（100），Home 到 0。
  await qty.focus()
  await page.keyboard.press('ArrowLeft')
  await expect(qty).toHaveAttribute('aria-valuenow', '990')
  await page.keyboard.press('Shift+ArrowLeft')
  await expect(qty).toHaveAttribute('aria-valuenow', '890')
  await page.keyboard.press('Home')
  await expect(qty).toHaveAttribute('aria-valuenow', '0')
  // 名义金额的滚动数字跟着变。
  await expect(sec.locator('[data-gallery-scrub-notional]')).toHaveText('0.00')
  // 时间轴：End 到最后一根，Home 回到第一根，读数是日期。
  const time = sec.getByRole('slider', { name: '回看到' })
  await time.focus()
  await page.keyboard.press('Home')
  await expect(time).toHaveAttribute('aria-valuetext', '2026-01-02')
})

test('SmoothUI 并入 RollingText：stagger 个位先转、boxed 每位一格、resize 位数变了淡入', async ({ page }) => {
  await open(page, THEMES[0], 'rolling-text')
  const sec = section(page, 'rolling-text')
  const stagger = sec.locator('[data-gallery-quote-stagger] .k-roll')
  await expect(stagger).toBeVisible()
  const before = await stagger.innerText()
  // 暂停时手动步进：报价变了，变了的位里个位的延迟最小、越靠左越大。
  let delays: number[] = []
  for (let attempt = 0; attempt < 8 && delays.length < 2; attempt++) {
    await page.evaluate(() => (window as unknown as { __liveStep?: (n: number) => void }).__liveStep?.(1))
    await page.waitForTimeout(1100)
    delays = await stagger
      .locator('.k-roll-slot[data-from]')
      .evaluateAll((els) => els.map((el) => parseFloat(getComputedStyle(el, '::before').animationDelay) * 1000))
  }
  expect(await stagger.innerText()).not.toBe(before)
  expect(delays.length).toBeGreaterThanOrEqual(2)
  expect(delays[delays.length - 1]).toBeLessThan(delays[0]!)
  // boxed：每一位有边框。
  const slot = sec.locator('[data-gallery-quote-boxed] .k-roll-slot').first()
  expect(await slot.evaluate((el) => getComputedStyle(el).borderTopWidth)).toBe('1px')
  // 复制与读屏拿到的仍是完整数字。
  expect(await sec.locator('[data-gallery-quote-boxed]').innerText()).toMatch(/^\d+$/)
})

test('SmoothUI 并入 CalendarHeatmap：reveal 让格子依次淡入，悬停的 tooltip 有弹出动画', async ({ page }) => {
  await open(page, THEMES[0], 'calendar-heatmap')
  const sec = section(page, 'calendar-heatmap')
  await sec.locator('[data-gallery-calendar-replay]').click()
  const cells = sec.locator('[data-gallery-calendar="month"] button.k-heat-cell')
  await expect(cells.first()).toBeVisible()
  const delays = await cells.evaluateAll((els) =>
    els.slice(0, 8).map((el) => (el as HTMLElement).style.getPropertyValue('--k-reveal-delay')),
  )
  expect(delays.every((d) => /^\d+ms$/.test(d))).toBe(true)
  expect(parseFloat(delays[7]!)).toBeGreaterThan(parseFloat(delays[0]!))
  await page.waitForTimeout(900)
  await cells.nth(10).hover()
  const tip = sec.locator('[data-gallery-calendar="month"] .k-heat-tip')
  await expect(tip).toBeVisible()
  expect(await tip.evaluate((el) => getComputedStyle(el).animationName)).toBe('k-heat-tip-in')
})

// G6：三页原来没有专属 e2e（体检 §5）：TreeView、SideNav、ColumnSetTabs。
for (const theme of THEMES) {
  test(`TreeView（${theme}）：→ 展开 ← 收起、↑↓ 走、点行选中写回 value、Enter 激活、禁用项不能选`, async ({ page }) => {
    await open(page, theme, 'tree-view')
    const area = section(page, 'tree-view')
    const tree = area.getByRole('treegrid', { name: '品种分类' })
    const row = (name: string) => tree.getByRole('row', { name, exact: true })
    const picked = area.locator('[data-gallery-tree]')
    // 默认展开 A 股与主板，沪市选中
    await expect(row('沪市')).toHaveAttribute('aria-selected', 'true')
    await expect(picked).toHaveText('cn-sh')
    await expect(row('港股')).toHaveAttribute('aria-expanded', 'false')
    await expect(tree.getByRole('row', { name: '主板' })).toHaveCount(1)
    // 点一行：选中它（给了 onAction，点行是「选中这一行」）
    await row('科创板').click()
    await expect(row('科创板')).toHaveAttribute('aria-selected', 'true')
    await expect(row('沪市')).toHaveAttribute('aria-selected', 'false')
    await expect(picked).toHaveText('cn-star')
    // 键盘：↓ 到港股，→ 展开，↓ 进子级，← 回父级再 ← 收起
    await page.keyboard.press('ArrowDown')
    await expect(row('港股')).toBeFocused()
    await page.keyboard.press('ArrowRight')
    await expect(row('港股')).toHaveAttribute('aria-expanded', 'true')
    await expect(tree.getByRole('row', { name: '主板' })).toHaveCount(2)
    await page.keyboard.press('ArrowDown')
    await expect(tree.getByRole('row', { name: '主板' }).nth(1)).toBeFocused()
    await page.keyboard.press('ArrowLeft')
    await expect(row('港股')).toBeFocused()
    await page.keyboard.press('ArrowLeft')
    await expect(row('港股')).toHaveAttribute('aria-expanded', 'false')
    // Enter 激活（onAction）
    await page.keyboard.press('Enter')
    await expect(area.locator('[data-gallery-tree-open]')).toHaveText('hk')
    // 禁用项：展开加密后点永续，选中不变
    await row('加密').click()
    await page.keyboard.press('ArrowRight')
    await row('永续').click({ force: true })
    await expect(row('永续')).toHaveAttribute('aria-disabled', 'true')
    await expect(picked).toHaveText('crypto')
  })

  test(`SideNav（${theme}）：当前项 aria-current、过滤框按标题与关键词过滤、没有命中整组隐藏写空态、Enter 打开第一个`, async ({
    page,
  }) => {
    await open(page, theme, 'side-nav')
    const area = section(page, 'side-nav')
    const nav = area.getByRole('navigation', { name: 'Workspace' })
    const link = (name: string) => nav.getByRole('link', { name, exact: true })
    await expect(link('Heatmap')).toHaveAttribute('aria-current', 'page')
    // 当前项轨迹画出来了（不透明），悬停另一项出淡色轨迹
    await expect(nav.locator('.k-sidenav-trail[data-kind="active"]').first()).toHaveCSS('opacity', '1')
    await link('Orders').hover()
    await expect(nav.locator('.k-sidenav-trail[data-kind="hover"]').nth(1)).toHaveCSS('opacity', '1')
    // 点一项：调用方把 current 换过去
    await link('Positions').click()
    await expect(link('Positions')).toHaveAttribute('aria-current', 'page')
    await expect(link('Heatmap')).not.toHaveAttribute('aria-current', 'page')
    // 过滤：按关键词（bots 的 keywords 有 automation）命中，别的组整组隐藏
    const search = nav.getByRole('searchbox', { name: 'Search' })
    await search.fill('automation')
    await expect(nav.getByRole('link')).toHaveCount(1)
    await expect(link('Bots')).toBeVisible()
    await expect(nav.getByRole('heading', { name: 'Markets' })).toHaveCount(0)
    // 没有命中：写空态；Esc 清空
    await search.fill('zzz')
    await expect(nav.getByText('No match')).toBeVisible()
    await search.press('Escape')
    await expect(nav.getByRole('link')).toHaveCount(6)
    // Enter 打开过滤后的第一个
    await search.fill('scr')
    await search.press('Enter')
    await expect(link('Screener')).toHaveAttribute('aria-current', 'page')
  })

  test(`ColumnSetTabs（${theme}）：点页签换整套列、亮着的页签跟着列走、手动改列后没有页签亮着`, async ({ page }) => {
    await open(page, theme, 'column-set-tabs')
    const area = section(page, 'column-set-tabs')
    const tabs = area.getByRole('tablist', { name: '列集' })
    const all = tabs.getByRole('tab')
    await expect(all.first()).toHaveAttribute('aria-selected', 'true')
    const heads = async () =>
      (await area.locator('[role="columnheader"][data-col]').allTextContents()).map((t) =>
        t.replace(/[▲▼]/g, '').trim(),
      )
    const before = await heads()
    await all.nth(1).click()
    await expect(all.nth(1)).toHaveAttribute('aria-selected', 'true')
    await expect(all.first()).toHaveAttribute('aria-selected', 'false')
    await expect.poll(heads).not.toEqual(before)
    // 手动在 ColumnPicker 里多勾一列：看得见的列不再恰好等于哪一套，没有页签亮着
    await area.getByRole('button', { name: '添加列' }).click()
    const list = page.getByRole('group', { name: '列' })
    await list.getByRole('checkbox', { checked: false }).first().click()
    await page.keyboard.press('Escape')
    await expect(tabs.locator('[aria-selected="true"]')).toHaveCount(0)
  })
}
