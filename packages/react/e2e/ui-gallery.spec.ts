// SPDX-License-Identifier: MIT
import { expect, test, type Locator, type Page } from '@playwright/test'
import { summarize, type CoverageMap } from '../docs/coverage-core'
import coverageMap from '../docs/coverage-map.json' with { type: 'json' }
import { GROUPS, PAGES } from '../gallery/registry'

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
const show = async (page: Page, id: string) => {
  await page.getByRole('navigation', { name: '组件' }).getByRole('link', { name: id, exact: true }).click()
  await page.locator(`[data-gallery="${id}"]`).waitFor()
}
const section = (page: Page, id: string) => page.locator(`[data-gallery="${id}"]`)
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
      // 点一下预览前面的标题（把键盘的起点放在这里），再按 Tab：落到第一个按钮上（键盘到达的焦点才画焦点环）。
      await page.getByRole('heading', { level: 1 }).click()
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

    test('勾选与开关：点了翻转，开关的圆钮真的挪过去，轨道换成强调色', async ({ page }) => {
      await open(page, theme, 'checkbox')
      const boxes = section(page, 'checkbox')
      const check = boxes.getByRole('checkbox', { name: '未勾', exact: true })
      await expect(check).toHaveAttribute('aria-checked', 'false')
      const checkRest = await bg(check)
      await check.click()
      await expect(check).toHaveAttribute('aria-checked', 'true')
      await settled(page)
      expect(await bg(check)).not.toBe(checkRest)
      // 组件卡的样子：勾上后中心一块 6 × 6 的强调色方块，框是暗橙边、暗橙底，不是勾。
      const led = check.locator('[data-slot="checkbox-indicator"]')
      const ledBox = (await led.boundingBox())!
      const checkBox = (await check.boundingBox())!
      expect([Math.round(checkBox.width), Math.round(checkBox.height)]).toEqual([14, 14])
      expect([Math.round(ledBox.width), Math.round(ledBox.height)]).toEqual([6, 6])
      expect(Math.abs(ledBox.x + 3 - (checkBox.x + 7))).toBeLessThanOrEqual(0.5)
      expect(Math.abs(ledBox.y + 3 - (checkBox.y + 7))).toBeLessThanOrEqual(0.5)
      expect(await bg(led)).toBe(await token(page, '--signal-orange'))
      // 发光只给状态灯（Precision Instrument §9）：勾选的方块是控件的「选中」，不发光。
      await expect(led).toHaveCSS('box-shadow', 'none')
      expect(await check.evaluate((el) => getComputedStyle(el).borderTopColor)).toBe(
        await page.evaluate(() => {
          const probe = document.createElement('i')
          probe.style.borderTop = '1px solid var(--signal-orange-dim)'
          document.body.append(probe)
          const color = getComputedStyle(probe).borderTopColor
          probe.remove()
          return color
        }),
      )
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
      expect(await bg(trackOf)).toBe(orange)
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
      expect(check.color).toBe(await token(page, '--signal-orange'))
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
      await open(page, theme, 'dropdown-menu')
      await section(page, 'dropdown-menu').getByRole('button', { name: '菜单', exact: true }).click()
      const parent = page.locator('[data-slot="dropdown-menu-sub-trigger"]')
      const box = (await parent.boundingBox())!
      const sub = page.getByRole('menuitem', { name: '导出为图片' })
      // 进到「更多」后马上离开（路过）：不开。
      await page.mouse.move(box.x + 10, box.y + 5)
      // browser-practice-allow fixed-wait: 模拟人手路过：指针在子菜单触发处只停 40 ms 就走开（比 Radix 写死的 100 ms 悬停延迟短），停留的时长就是被测的输入，没有「没发生」的状态可等
      await page.waitForTimeout(40)
      await page.mouse.move(box.x + 10, box.y - 60)
      // browser-practice-allow fixed-wait: 证明路过之后过了悬停延迟（100 ms）子菜单也没开（负向断言；延迟是 Radix 内部写死的定时器），没有「没发生」的状态可等
      await page.waitForTimeout(250)
      await expect(sub).toHaveCount(0)
      // 停住：过 100ms 开。
      await page.mouse.move(box.x + 10, box.y + 5)
      // browser-practice-allow fixed-wait: 证明停住 40 ms（不到 100 ms 悬停延迟）时子菜单还没开（负向断言；延迟是 Radix 内部写死的定时器），没有「没发生」的状态可等
      await page.waitForTimeout(40)
      await expect(sub).toHaveCount(0)
      await expect(sub).toBeVisible({ timeout: 1000 })
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
      // .k-in（ui.css 118-129）：30 高 · 内边 8 · 1px 边 · 圆角 6 · 13px/18px 400 · 字色 ink-100 · sans 字族（Inter）。
      expect(
        await css(input, ['height', 'padding-left', 'padding-top', 'border-top-width', 'border-top-left-radius']),
      ).toEqual(['30px', '8px', '0px', '1px', '6px'])
      expect(await css(input, ['font-size', 'font-weight', 'line-height'])).toEqual(['13px', '400', '18px'])
      expect((await css(input, ['font-family']))[0]).toContain('Inter')
      expect(await colorOf(input)).toBe(await token(page, '--ink-100'))
      expect(await bg(input)).toMatch(/0\.04\)$/)
      // .k-in.sm（ui.css 140-145）：26 高 · 内边 6 · 圆角 6 · 字号 12px，字重与行高、字族仍是 .k-in 的 400 / 18px / Inter。
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
      expect((await css(small, ['font-family']))[0]).toContain('Inter')
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
      expect(await bg(thumb)).toBe(await token(page, '--signal-orange'))
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
      await expect(led('状态 on')).toHaveCSS('background-color', await token(page, '--signal-orange'))
      await expect(led('状态 on')).toHaveCSS('box-shadow', await resolved(page, 'box-shadow', 'var(--glow-orange)'))
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
      await expect(area.locator('#gal-dots-default .k-dot-tile')).toHaveCSS('fill', await token(page, '--seq-300'))
      await expect(area.locator('#gal-dots-orange .k-dot-tile')).toHaveCSS('fill', await token(page, '--signal-orange'))
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
      expect(mid.flash).toBe('k-flash-up')
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
      await expect(roll).toHaveCSS('animation-name', 'k-flash-down')
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
      // .sm（:101-103）26 高；.dis（:45-48）0.45 · not-allowed；.err（:55-57）红边。
      await expect(area.locator('.k-num.sm')).toHaveCSS('height', '26px')
      await expect(area.getByRole('spinbutton', { name: '禁用' }).locator('..')).toHaveCSS('opacity', '0.45')
      await expect(area.getByRole('spinbutton', { name: '非法' }).locator('..')).toHaveCSS(
        'border-top-color',
        'rgba(255, 90, 90, 0.55)',
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
        .toEqual(
          await rgba(
            page,
            await resolved(page, 'background-color', 'color-mix(in srgb, var(--signal-orange) 28%, transparent)'),
          ),
        )
      await page.keyboard.type('12')
      await expect(shown).toHaveText('2026-12-14 09:30')
      // 日历：按钮打开，选中日橙底（:719-723），范围外的日子（min / max 只在「带秒」那一行）点不了。
      await area.getByRole('button', { name: '选起点的日期' }).click()
      const cal = page.locator('.k-cal')
      await expect(cal).toBeVisible()
      await expect(cal.locator('.k-cal-cell[data-selected]')).toHaveCSS(
        'background-color',
        await token(page, '--signal-orange'),
      )
      await cal
        .getByRole('button', { name: /12月20日/ })
        .first()
        .click()
      await expect(cal).toHaveCount(0)
      await expect(shown).toHaveText('2026-12-20 09:30')
    })

    test('加载骨架：点阵条（12 高、bg-200、line-200 边），500ms 后才出，到了就换成内容；超时是琥珀条加重试', async ({
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
      // caption（:786-788）：LED on + 文案；超时（:792-799）：琥珀条 + 重试按钮靠右。
      await expect(area.getByText('加载 涨停池 · 本机服务')).toBeVisible()
      await expect(area.getByText('仍在加载 · 本机服务')).toBeVisible()
      const bar = area.locator('.k-loading-bar')
      await expect(bar).toContainText('点重试 · 本机服务 10 秒无回应')
      await expect(bar.getByRole('img', { name: '没有回应' })).toBeVisible()
      await expect
        .poll(() => colorAt(page, bar, 'border-top-color'))
        .toEqual(
          await rgba(
            page,
            await resolved(page, 'border-top-color', 'color-mix(in srgb, var(--signal-amber) 35%, transparent)'),
          ),
        )
      const retry = bar.getByRole('button', { name: '重试' })
      const [barBox, retryBox] = await Promise.all([bar.boundingBox(), retry.boundingBox()])
      expect(retryBox!.x + retryBox!.width).toBeGreaterThan(barBox!.x + barBox!.width - 16)
      // Loading：等了 500ms 才出骨架；数据到了换成内容。
      const wait = area.locator('[data-gallery-toggle]')
      await expect(area.locator('.k-loading-wait').last().locator('.k-loading-line').first()).toBeVisible()
      await wait.click()
      await expect(area.locator('[data-gallery-loaded]')).toBeVisible()
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

    test('积木：面板外壳——聚焦的画橙色角括号，普通的没有，空态在壳里', async ({ page }) => {
      await open(page, theme, 'panel-frame')
      const frames = section(page, 'panel-frame').locator('[data-slot="panel-frame"]')
      await expect(frames).toHaveCount(3)
      const brackets = frames.nth(1).locator('[data-slot="panel-brackets"] i').first()
      await expect(brackets).toBeVisible()
      const box = await brackets.boundingBox()
      expect(box?.width).toBeGreaterThan(5)
      expect(await brackets.evaluate((el) => getComputedStyle(el).borderTopColor)).not.toBe('rgba(0, 0, 0, 0)')
      await expect(frames.nth(0).locator('[data-slot="panel-brackets"]')).toHaveCount(0)
      const title = (i: number) =>
        frames
          .nth(i)
          .locator('[data-slot="panel-title"]')
          .evaluate((el) => getComputedStyle(el).color)
      expect(await title(1)).not.toBe(await title(0))
      // 联动灯四组都取自信号色（赭、粉红、绿、琥珀），没有蓝：B 组是粉红，不是 signal-blue。
      const groupB = frames.nth(1).getByRole('img', { name: 'Link group B' })
      await expect(groupB).toHaveCSS('background-color', await token(page, '--signal-red'))
      expect(await token(page, '--link-b')).not.toBe(await token(page, '--signal-blue'))
      await expect(frames.nth(0).getByRole('button', { name: 'Maximize' })).toBeVisible()
      await expect(frames.nth(2).getByRole('status')).toContainText('No data source')
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
        .toBe(await token(page, '--signal-orange'))
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
      await area.getByRole('button', { name: '全部已读' }).click()
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
        success: '--signal-green',
        error: '--signal-red',
        warning: '--signal-amber',
        info: '--signal-blue',
        pending: '--ink-300',
      }
      for (const [status, variable] of Object.entries(tones)) {
        const icon = area.getByRole('img', { name: `状态 ${status}` })
        await expect(icon).toHaveAttribute('data-status', status)
        await expect(icon).toHaveCSS('color', await token(page, variable))
        expect((await icon.boundingBox())?.width).toBe(16)
      }
      const live = area.locator('[data-gallery-status] [data-slot="status-icon"]')
      await expect(live).toHaveAttribute('data-status', 'pending')
      // 进行中：弧在转（角度中途取样）。
      const turn = await sample(page, { kind: 'angle', selector: '[data-gallery-status] svg g' }, 500)
      expect(new Set(turn.map((angle) => Math.round(angle))).size, '转动中角度在变').toBeGreaterThan(5)
      // 采样窗口 900 毫秒会在弹簧落定前结束（点击要几十到几百毫秒才发出，实测这台 2 核机器上末值常读到 0.985，16 次红 8 次）：
      // 放宽到 1800 毫秒，断言（画到一半、末值 > 0.99）原样不动。
      const draw = sample(page, { kind: 'dash', selector: '[data-gallery-status] svg path' }, 1800)
      await area.getByRole('button', { name: '成功' }).click()
      await expect(live).toHaveAttribute('data-status', 'success')
      const strokes = (await draw).filter((value) => !Number.isNaN(value))
      expect(
        strokes.some((value) => value > 0.05 && value < 0.95),
        '对勾画到一半',
      ).toBe(true)
      expect(strokes.at(-1)).toBeGreaterThan(0.99)
      await area.getByRole('button', { name: '失败' }).click()
      await expect(live).toHaveAttribute('data-status', 'error')
      await expect(live).toHaveCSS('color', await token(page, '--signal-red'))
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

    test('点阵状态球：画布缓冲跟缩放走；待命左右对称、思考不对称且在转、聆听音量大亮得多；颜色是主题的强调色', async ({
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
      await area.getByRole('button', { name: 'thinking', exact: true }).click()
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
      // 聆听：音量拉满比压低亮得多（同一个球，只改 level）；透明度之和随缓冲像素数（ratio 的平方）涨，阈值跟着乘。
      await area.getByRole('button', { name: 'listening', exact: true }).click()
      await expect(orb).toHaveAttribute('data-state', 'listening')
      const slider = area.getByRole('slider', { name: '音量' })
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
    const paint = (locator: Locator, property: 'stroke' | 'color' | 'backgroundColor') =>
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
      const line = (await up.locator('polyline').boundingBox())!
      expect(line.width, '折线铺满整宽').toBeGreaterThan(box.width - 2)
      expect(box.height).toBeGreaterThan(30)
      await expect.poll(() => paint(up.locator('polyline'), 'stroke')).toEqual(await swatch(page, 'var(--pnl-up)'))
      await expect.poll(() => paint(down.locator('polyline'), 'stroke')).toEqual(await swatch(page, 'var(--pnl-down)'))
      await expect.poll(() => paint(flat.locator('polyline'), 'stroke')).toEqual(await swatch(page, 'var(--ink-200)'))
      const empty = page.locator('[data-gallery-spark="empty"]').getByRole('img')
      await expect(empty).toHaveText('—')
      await expect(empty).toHaveAccessibleName('示例走势：没有数据')
      await expect(page.locator('[data-gallery-spark="empty"] svg')).toHaveCount(0)
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

test('不带 ?theme= 是 Graphite；页头切到 Console，主按钮底色跟着变，地址带上 theme=console', async ({ page }) => {
  await page.goto('/#/button')
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'graphite')
  const primary = section(page, 'button').getByRole('button', { name: 'primary', exact: true })
  const graphite = await bg(primary)
  await page.getByRole('group', { name: '主题' }).getByRole('button', { name: 'Console' }).click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'console')
  await expect.poll(() => bg(primary)).not.toBe(graphite)
  await expect(page).toHaveURL(/theme=console/)
})

test('文档站默认就是 Graphite：不带 ?theme= 时页面底色与目录栏底色是 Graphite 的 bg-000 与 bg-100（#1775）', async ({
  page,
}) => {
  await page.goto('/#/button')
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'graphite')
  // Graphite 的 bg-000 = #000000、bg-100 = #070707；Console 的 bg-100 是 #141311，默认要是 Console 就会红。
  await expect(page.locator('html')).toHaveCSS('background-color', 'rgb(0, 0, 0)')
  await expect(page.getByRole('navigation', { name: '组件' })).toHaveCSS('background-color', 'rgb(7, 7, 7)')
  expect(await token(page, '--bg-100')).toBe('rgb(7, 7, 7)')
})

test('目录：按类分组；直接打开 #/<件名>；点链接换页、后退回上一页；没有的页写原因', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveURL(/#\/button$/)
  const nav = page.getByRole('navigation', { name: '组件' })
  for (const group of GROUPS.filter((item) => PAGES.some((doc) => doc.group === item.id)))
    await expect(nav.getByRole('heading', { name: group.title })).toBeVisible()
  // 目录里每一页都有链接，当前页标 aria-current。
  for (const { id } of PAGES) await expect(nav.getByRole('link', { name: id, exact: true })).toBeVisible()
  await expect(nav.getByRole('link', { name: 'button', exact: true })).toHaveAttribute('aria-current', 'page')
  await show(page, 'slider')
  await expect(page).toHaveURL(/#\/slider$/)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Slider 滑块')
  await expect(nav.getByRole('link', { name: 'slider', exact: true })).toHaveAttribute('aria-current', 'page')
  await page.goBack()
  await expect(page).toHaveURL(/#\/button$/)
  await expect(section(page, 'button')).toBeVisible()
  await page.goto('/#/nope')
  await expect(page.getByRole('alert')).toContainText('没有「nope」这一页')
})

test('每一页写着属性表、组成，有键盘操作的写键盘', async ({ page }) => {
  for (const doc of PAGES) {
    await page.goto(`/#/${doc.id}`)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(doc.title)
    await expect(page.getByRole('heading', { name: '属性' })).toBeVisible()
    await expect(page.getByRole('heading', { name: '组成' })).toBeVisible()
    await expect(page.getByRole('heading', { name: '键盘' })).toHaveCount(doc.keys.length > 0 ? 1 : 0)
    await expect(page.getByRole('heading', { name: '状态', exact: true })).toBeVisible()
    await expect(page.getByRole('heading', { name: '不要', exact: true })).toBeVisible()
    await expect(page.locator('.gal-list li')).toHaveCount(doc.states.length + doc.donts.length)
  }
})

for (const theme of THEMES) {
  test(`覆盖页（${theme}）：目录里单列「总览」，五个归属的「已做 / 总数」与映射一致，每张卡一行、点名可见`, async ({
    page,
  }) => {
    await page.goto(`/?theme=${theme}#/coverage`)
    const nav = page.getByRole('navigation', { name: '组件' })
    await expect(nav.getByRole('heading', { name: '总览' })).toBeVisible()
    await expect(nav.getByRole('link', { name: 'coverage', exact: true })).toHaveAttribute('aria-current', 'page')
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
    // 原来用 DataGrid；#1869 之后它是「已做」，改用仍是「部分」的 PanelFrame（落点是包的出口，备注写还缺什么）。
    const row = page.locator('[data-card="PanelFrame"]')
    await expect(row).toHaveAttribute('data-status', '部分')
    await expect(row).toContainText('拖动抬起')
    await expect(row).toBeVisible()
    await page.getByRole('link', { name: 'button', exact: true }).click()
    await expect(section(page, 'button')).toBeVisible()
  })
}
