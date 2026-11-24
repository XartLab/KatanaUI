// SPDX-License-Identifier: MIT
import { expect, test, type Locator, type Page } from '@playwright/test'

// 规则构建器（KatanaUI #223）页的行为，对着票里的判据：建树与连线、切 And / Or、同组换序（拖动与 Alt+↑↓，跨组不落）、
// 校验（红框、读屏说明）、若为真 / 若为假加动作与往返、撤销重做。axe 由 ui-gallery-a11y.spec.ts 对每一页统一跑。
test.use({ viewport: { width: 1100, height: 1500 } })

const open = async (page: Page) => {
  await page.goto('/?theme=graphite#/rule-builder')
  await page.locator('[data-gallery="rule-builder"]').waitFor()
  const main = page.locator('[data-gallery="rule-builder"] [data-gallery-rule="main"]').first()
  await expect(main.getByRole('button', { name: /^Move: Sector/ })).toBeVisible()
  return main
}
const json = async (main: Locator): Promise<any> =>
  JSON.parse((await main.locator('[data-gallery-rule-json]').textContent()) ?? 'null')
/** 一个组的直接成员的 id（行或组头）。 */
const order = (list: Locator) =>
  list.evaluate((ul) => [...ul.children].map((li) => li.querySelector('[data-id]')?.getAttribute('data-id')))
const text = async (main: Locator) => (await main.locator('[data-slot="rule-text"]').textContent())?.trim()

test('树：锁定条件、一条、一组；连线与 And / Or 标签；自然语言回读（判据 1）', async ({ page }) => {
  const main = await open(page)
  const root = main.locator('[data-list="root"]')
  const group = main.locator('[data-list="liquidity"]')
  expect(await order(root)).toEqual(['market', 'sector', 'cross', 'liquidity'])
  expect(await order(group)).toEqual(['turnover', 'rate'])
  // 锁定：锁图标，没有把手与删除钮，字段与运算符是文字。
  const locked = main.locator('[data-id="market"]')
  await expect(locked.getByRole('img', { name: 'Locked' })).toBeVisible()
  await expect(locked.locator('[data-slot="rule-handle"]')).toHaveCount(0)
  await expect(locked.locator('[data-slot="rule-remove"]')).toHaveCount(0)
  await expect(locked.locator('[data-part="field-text"]')).toHaveText('Market')
  // 回读。
  expect(await text(main)).toBe(
    'When Market is A-shares and Sector is any of Semiconductors / Software and Close crosses above MA20 and (Turnover > 500 M or Turnover rate > 3%), then Send alert to Push and Draft order from Starter position, otherwise Add to watchlist to To review',
  )
  // And / Or 标签：根组 And、嵌套组 Or，各坐在自己列表的竖线上、垂直居中在第一与最后一条横线之间。
  await expect(main.locator('[data-slot="rule-mode"]')).toHaveCount(2)
  await expect(main.locator('[data-list="root"] + [data-slot="rule-mode"]')).toHaveText('And')
  await expect(main.locator('[data-list="liquidity"] + [data-slot="rule-mode"]')).toHaveText('Or')
  const geometry = await main.evaluate((el) => {
    const read = (listId: string) => {
      const ul = el.querySelector<HTMLElement>(`[data-list="${listId}"]`)!
      const pill = ul.nextElementSibling as HTMLElement
      const items = [...ul.children] as HTMLElement[]
      const stub = (li: HTMLElement) => {
        const top = parseFloat(getComputedStyle(li, '::before').top)
        const style = getComputedStyle(li, '::before')
        return {
          y:
            li.getBoundingClientRect().top +
            (style.top.endsWith('%') ? li.offsetHeight * (top / li.offsetHeight) : top),
          width: parseFloat(style.width),
          border: style.borderTopWidth,
          content: style.content,
        }
      }
      const pillBox = pill.getBoundingClientRect()
      const listBox = ul.getBoundingClientRect()
      const first = stub(items[0]!)
      const last = stub(items.at(-1)!)
      const vertical = getComputedStyle(items[0]!, '::after')
      return {
        pillCenterX: pillBox.left + pillBox.width / 2 - listBox.left,
        pillCenterY: pillBox.top + pillBox.height / 2,
        firstY: first.y,
        lastY: last.y,
        stub: first,
        vertical: { border: vertical.borderLeftWidth, content: vertical.content },
      }
    }
    return { root: read('root'), group: read('liquidity') }
  })
  for (const part of [geometry.root, geometry.group]) {
    expect(part.pillCenterX).toBeCloseTo(22, 0) // 槽里竖线的位置
    expect(part.stub.border).toBe('1px')
    expect(part.stub.content).toBe('""')
    expect(part.vertical.border).toBe('1px')
    expect(part.pillCenterY).toBeGreaterThan(part.firstY)
    expect(part.pillCenterY).toBeLessThan(part.lastY)
  }
})

test('从一条起建：加条件、加组、组里再加一条并切成 Or，回读对（判据 1、2）', async ({ page }) => {
  const main = await open(page)
  const root = main.locator('[data-list="root"]')
  // 在根组里加一个组：里面带一条新条件（字段默认第一个）。
  await main.locator('[data-add="root"]').getByRole('button', { name: 'Add group' }).click()
  const added = await order(root)
  expect(added.slice(0, 4)).toEqual(['market', 'sector', 'cross', 'liquidity'])
  const newGroup = added[4]!
  expect(newGroup).toMatch(/^g-/)
  const inner = main.locator(`[data-list="${newGroup}"]`)
  expect((await order(inner)).length).toBe(1)
  // 只有一个成员时没有 And / Or 标签；再加一条才出现。
  await expect(main.locator(`[data-list="${newGroup}"] + [data-slot="rule-mode"]`)).toHaveCount(0)
  await main.locator(`[data-add="${newGroup}"]`).getByRole('button', { name: 'Add condition' }).click()
  const pill = main.locator(`[data-list="${newGroup}"] + [data-slot="rule-mode"]`)
  await expect(pill).toHaveText('And')
  await pill.click()
  await expect(pill).toHaveText('Or')
  const [first, second] = await order(inner)
  // 填值：两条都是 Market is … 选一个值之后回读。
  for (const [id, label] of [
    [first, 'US'],
    [second, 'Hong Kong'],
  ] as const) {
    await main.locator(`[data-id="${id}"]`).locator('[data-part="value"]').click()
    await page.getByRole('option', { name: label }).click()
  }
  expect(await text(main)).toContain('(Market is US or Market is Hong Kong)')
  const rule = await json(main)
  const built = rule.when.children.at(-1)
  expect(built).toMatchObject({ type: 'group', mode: 'or' })
  expect(built.children.map((c: any) => c.value)).toEqual([
    { kind: 'text', value: 'us' },
    { kind: 'text', value: 'hk' },
  ])
})

test('切组的 And / Or：回读与 JSON 跟着变（判据 2）', async ({ page }) => {
  const main = await open(page)
  const pill = main.locator('[data-list="liquidity"] + [data-slot="rule-mode"]')
  expect((await json(main)).when.children[3].mode).toBe('or')
  await pill.click()
  await expect(pill).toHaveText('And')
  expect((await json(main)).when.children[3].mode).toBe('and')
  expect(await text(main)).toContain('(Turnover > 500 M and Turnover rate > 3%)')
  // 播报。
  await expect(main.locator('[data-slot="rule-live"]')).toHaveText('Group now combines with And')
  await main.locator('[data-list="root"] + [data-slot="rule-mode"]').click()
  expect((await json(main)).when.mode).toBe('or')
  expect(await text(main)).toContain('Market is A-shares or Sector is any of')
})

test('同组换序：Alt+↑↓ 与拖动都只在组内，跨组与锁定条件前面不落（判据 3）', async ({ page }) => {
  const main = await open(page)
  const root = main.locator('[data-list="root"]')
  const group = main.locator('[data-list="liquidity"]')
  const handle = (id: string) => main.locator(`[data-id="${id}"] [data-part="handle"]`)

  // Alt+↓：组里第一条换到第二条后面，焦点留在它的把手上，播报「挪到第几」。
  await handle('turnover').focus()
  await page.keyboard.press('Alt+ArrowDown')
  expect(await order(group)).toEqual(['rate', 'turnover'])
  await expect(handle('turnover')).toBeFocused()
  await expect(main.locator('[data-slot="rule-live"]')).toHaveText('Moved Turnover > 500 M to position 2 of 2')
  // 到头了再按：不动，不跑到组外。
  await page.keyboard.press('Alt+ArrowDown')
  expect(await order(group)).toEqual(['rate', 'turnover'])
  expect(await order(root)).toEqual(['market', 'sector', 'cross', 'liquidity'])
  await page.keyboard.press('Alt+ArrowUp')
  expect(await order(group)).toEqual(['turnover', 'rate'])
  // 组里第一条再往上：不会跑进根组。
  await page.keyboard.press('Alt+ArrowUp')
  expect(await order(group)).toEqual(['turnover', 'rate'])
  expect(await order(root)).toEqual(['market', 'sector', 'cross', 'liquidity'])

  // 锁定条件固定在组首：第一个能动的条件往上挪不动。
  await handle('sector').focus()
  await page.keyboard.press('Alt+ArrowUp')
  expect(await order(root)).toEqual(['market', 'sector', 'cross', 'liquidity'])
  await page.keyboard.press('Alt+ArrowDown')
  expect(await order(root)).toEqual(['market', 'cross', 'sector', 'liquidity'])
  await page.keyboard.press('Alt+ArrowUp')

  // 拖动：把组里第二条拖到第一条上面，换序。
  const drag = async (
    from: Locator,
    toY: (box: { x: number; y: number; width: number; height: number }) => number,
    target: Locator,
    x?: number,
  ) => {
    const start = (await from.boundingBox())!
    const box = (await target.boundingBox())!
    await page.mouse.move(start.x + start.width / 2, start.y + start.height / 2)
    await page.mouse.down()
    await page.mouse.move(start.x + start.width / 2, start.y + start.height / 2 - 6, { steps: 3 })
    await page.mouse.move(x ?? start.x + start.width / 2, toY(box), { steps: 10 })
    return start
  }
  await drag(handle('rate'), (box) => box.y + 2, main.locator('[data-id="turnover"]'))
  await expect(main.locator('[data-list="liquidity"] > li').first()).toHaveAttribute('data-drop', 'before')
  await expect(main.locator('[data-id="rate"]').locator('xpath=ancestor::li[1]')).toHaveAttribute('data-dragging', '')
  await page.mouse.up()
  expect(await order(group)).toEqual(['rate', 'turnover'])
  expect(await order(root)).toEqual(['market', 'sector', 'cross', 'liquidity'])
  const json1 = await json(main)
  expect(json1.when.children[3].children.map((c: any) => c.id)).toEqual(['rate', 'turnover'])

  // 拖到别的组（根组的 Sector 那一行上）：整件进入「不落」态，松手后什么都没变。
  const before = JSON.stringify(await json(main))
  await drag(handle('turnover'), (box) => box.y + box.height / 2, main.locator('[data-id="sector"]'))
  await expect(main.locator('[data-slot="rule-builder"]').first()).toHaveAttribute('data-drag', 'blocked')
  await page.mouse.up()
  expect(JSON.stringify(await json(main))).toBe(before)
  expect(await order(group)).toEqual(['rate', 'turnover'])
  expect(await order(root)).toEqual(['market', 'sector', 'cross', 'liquidity'])

  // Esc 取消拖动。
  await drag(handle('turnover'), (box) => box.y + 2, main.locator('[data-id="rate"]'))
  await page.keyboard.press('Escape')
  await page.mouse.up()
  expect(await order(group)).toEqual(['rate', 'turnover'])
  await expect(main.locator('[data-slot="rule-live"]')).toHaveText('Move cancelled')
})

test('校验：越界与必填缺失标红，读屏读到原因；顶行状态数问题（判据 4）', async ({ page }) => {
  const main = await open(page)
  const status = main.locator('[data-slot="rule-status"]')
  await expect(status).toHaveText('Ready')
  const rate = main.locator('[data-id="rate"]')
  const input = rate.locator('input[data-part="value"]')
  // 默认没改过的行不显示问题；越界后这一行红框，原因接到输入框的 aria-describedby。
  await expect(rate).not.toHaveAttribute('data-invalid', '')
  await input.fill('130')
  await expect(rate).toHaveAttribute('data-invalid', '')
  await expect(input).toHaveAttribute('aria-invalid', 'true')
  const reasonId = (await input.getAttribute('aria-describedby'))!
  await expect(page.locator(`[id="${reasonId}"]`)).toHaveText('Must be between 0 and 100')
  await expect(status).toHaveText('1 issue')
  // 回读里仍写着 130，没有被悄悄夹回去。
  expect(await text(main)).toContain('Turnover rate > 130%')
  // 清空：必填。
  await input.fill('')
  await expect(page.locator(`[id="${reasonId}"]`)).toHaveText('Fill in a value')
  await expect(main.locator('[data-slot="rule-text"]')).toContainText('Turnover rate > …')
  // 改回合法值：红框消失，状态回到 Ready。
  await input.fill('3')
  await expect(rate).not.toHaveAttribute('data-invalid', '')
  await expect(status).toHaveText('Ready')

  // 全显的那一份：五个问题，各自的行红、原因写在行下。
  const broken = page.locator('[data-gallery-rule="broken"]')
  await expect(broken.locator('[data-slot="rule-status"]')).toHaveText('5 issues')
  await expect(broken.locator('[data-slot="rule-issue"]')).toHaveText([
    'Must be between 0 and 100',
    'Fill in a value',
    'Fill in a value',
    'Add at least one condition',
    'Fill in a value',
  ])
  await expect(broken.locator('[data-id="rsi"] input[data-part="max"]')).toHaveAttribute('aria-invalid', 'true')
  await expect(broken.locator('[data-id="rsi"] input[data-part="min"]')).not.toHaveAttribute('aria-invalid')
})

test('动作：若为真 / 若为假各加一个，JSON 往返一致，撤销重做（判据 5、6）', async ({ page }) => {
  const main = await open(page)
  const initial = await json(main)
  const thenList = main.locator('[data-list="ifTrue"]')
  const elseList = main.locator('[data-list="ifFalse"]')
  expect(await order(thenList)).toEqual(['alert', 'draft'])
  await expect(main.locator('[data-id="draft"] [data-slot="rule-draft"]')).toHaveText('Draft only')

  await main.locator('[data-add="ifTrue"]').getByRole('button', { name: 'Add action' }).click()
  await main.locator('[data-add="ifFalse"]').getByRole('button', { name: 'Add action' }).click()
  const afterAdd = await json(main)
  expect(afterAdd.ifTrue.map((a: any) => a.id)).toEqual(['alert', 'draft', 'a-1'])
  expect(afterAdd.ifFalse.map((a: any) => a.id)).toEqual(['watch', 'a-2'])
  // 新动作缺参数：改过才显示，先没有红框。
  const newAction = main.locator('[data-id="a-1"]')
  await expect(newAction).not.toHaveAttribute('data-invalid', '')
  await newAction.locator('[data-part="kind"]').click()
  await page.getByRole('option', { name: 'Hand to Agent' }).click()
  await expect(newAction).toHaveAttribute('data-invalid', '')
  await newAction.locator('[data-part="param"]').click()
  await page.getByRole('option', { name: 'Researcher' }).click()
  await expect(newAction).not.toHaveAttribute('data-invalid', '')
  expect((await json(main)).ifTrue.at(-1)).toEqual({ id: 'a-1', kind: 'agent', param: 'research' })
  expect(await text(main)).toContain('Hand to Agent to Researcher')

  // 往返：整份 JSON 序列化再解析与自己一致。
  const roundTrip = await json(main)
  expect(JSON.parse(JSON.stringify(roundTrip))).toEqual(roundTrip)

  // 撤销：连着三步撤回去，JSON 回到最初的那一份；重做回来。
  const undo = main.locator('[data-slot="rule-undo"]')
  const redo = main.locator('[data-slot="rule-redo"]')
  await expect(redo).toBeDisabled()
  await undo.click()
  await undo.click()
  await undo.click()
  await undo.click()
  expect(await json(main)).toEqual(initial)
  await expect(undo).toBeDisabled()
  await redo.click()
  expect((await json(main)).ifTrue.map((a: any) => a.id)).toEqual(['alert', 'draft', 'a-1'])
  // 键盘：焦点在把手上按 Ctrl+Z / Ctrl+Shift+Z。
  await main.locator('[data-id="alert"] [data-part="handle"]').focus()
  await page.keyboard.press('Control+z')
  expect(await json(main)).toEqual(initial)
  await page.keyboard.press('Control+Shift+z')
  expect((await json(main)).ifTrue.map((a: any) => a.id)).toEqual(['alert', 'draft', 'a-1'])
  // 删：把手上按 Delete，删掉这一行，焦点去前一行的把手。
  await main.locator('[data-id="a-1"] [data-part="handle"]').focus()
  await page.keyboard.press('Delete')
  expect((await json(main)).ifTrue.map((a: any) => a.id)).toEqual(['alert', 'draft'])
  await expect(main.locator('[data-id="draft"] [data-part="handle"]')).toBeFocused()
  await expect(elseList.locator('li')).toHaveCount(1)
})

test('值：多选标签、引用另一个字段、区间、锁定条件只改值', async ({ page }) => {
  const main = await open(page)
  // 标签：移除一个、再从列表里加回来（列表里勾选不收）。
  const sector = main.locator('[data-id="sector"]')
  await expect(sector.locator('[data-slot="rule-chip"]')).toHaveText(['Semiconductors', 'Software'])
  await sector.getByRole('button', { name: 'Remove Software' }).click()
  expect((await json(main)).when.children[1].value).toEqual({ kind: 'list', values: ['chip'] })
  await sector.getByRole('button', { name: 'Add', exact: true }).click()
  await page.getByRole('option', { name: 'Banks' }).click()
  await page.getByRole('option', { name: 'Brokers' }).click()
  await expect(page.getByRole('option', { name: 'Banks' })).toBeVisible()
  await page.keyboard.press('Escape')
  expect((await json(main)).when.children[1].value).toEqual({ kind: 'list', values: ['bank', 'chip', 'broker'] })
  // 引用：Close crosses above MA20 → 切回数字，再切回引用。
  const cross = main.locator('[data-id="cross"]')
  await cross.getByRole('button', { name: 'Compare with another field' }).click()
  expect((await json(main)).when.children[2].value).toEqual({ kind: 'number', value: null })
  await cross.locator('input[data-part="value"]').fill('12.5')
  expect((await json(main)).when.children[2].value).toEqual({ kind: 'number', value: 12.5 })
  expect(await text(main)).toContain('Close crosses above 12.5')
  // 区间：把 Turnover 的运算符换成 between，出两个框；填一边后另一边必填。
  const turnover = main.locator('[data-id="turnover"]')
  await turnover.locator('[data-part="op"]').click()
  await page.getByRole('option', { name: 'between' }).click()
  await turnover.getByRole('textbox', { name: 'Minimum' }).fill('200')
  await expect(turnover.getByRole('textbox', { name: 'Maximum' })).toHaveAttribute('aria-invalid', 'true')
  await turnover.getByRole('textbox', { name: 'Maximum' }).fill('100')
  await expect(
    page.locator(`[id="${await turnover.getByRole('textbox', { name: 'Maximum' }).getAttribute('aria-describedby')}"]`),
  ).toHaveText('The lower bound is above the upper bound')
  // 锁定条件：改值可以，字段与运算符是文字。
  const locked = main.locator('[data-id="market"]')
  await locked.locator('[data-part="value"]').click()
  await page.getByRole('option', { name: 'US' }).click()
  expect((await json(main)).when.children[0]).toMatchObject({
    locked: true,
    field: 'market',
    value: { kind: 'text', value: 'us' },
  })
})
