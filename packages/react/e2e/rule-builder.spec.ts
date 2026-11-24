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
    'When Market is A-shares and Sector is any of Semiconductors / Software and Close crosses above MA20 and (Turnover > 500 M or Turnover rate > 3%), then Send alert to Push and Draft order Buy 10 lots at Limit, otherwise Add to watchlist to To review',
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

  // 全显的那一份：六个问题（下单草稿缺两个参数，合成一行一句），各自的行红、原因写在行下。
  const broken = page.locator('[data-gallery-rule="broken"]')
  await expect(broken.locator('[data-slot="rule-status"]')).toHaveText('6 issues')
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
  expect((await json(main)).ifTrue.at(-1)).toEqual({ id: 'a-1', kind: 'agent', params: { agent: 'research' } })
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

const paramBox = (row: Locator, key: string) => row.locator(`[data-part="param"][data-key="${key}"]`)

test('动作带多个参数：方向、数量、价格类型各有各的类型与校验，回读按次序写（改动 a）', async ({ page }) => {
  const main = await open(page)
  const draft = main.locator('[data-id="draft"]')
  await expect(draft.locator('[data-part="param"]')).toHaveCount(3)
  await expect(paramBox(draft, 'side')).toHaveText('Buy')
  await expect(paramBox(draft, 'quantity')).toHaveValue('10')
  await expect(paramBox(draft, 'price')).toHaveText('Limit')
  // 数量越界：只有数量红，方向与价格类型不红；原因接到数量框。
  await paramBox(draft, 'quantity').fill('500')
  await expect(paramBox(draft, 'quantity')).toHaveAttribute('aria-invalid', 'true')
  await expect(paramBox(draft, 'side')).not.toHaveAttribute('aria-invalid')
  await expect(paramBox(draft, 'price')).not.toHaveAttribute('aria-invalid')
  const reason = (await paramBox(draft, 'quantity').getAttribute('aria-describedby'))!
  await expect(page.locator(`[id="${reason}"]`)).toHaveText('Must be between 1 and 100')
  await expect(main.locator('[data-slot="rule-status"]')).toHaveText('1 issue')
  // 改方向与数量：JSON 里是 params 对象，回读按定义的次序写。
  await paramBox(draft, 'side').click()
  await page.getByRole('option', { name: 'Sell' }).click()
  await paramBox(draft, 'quantity').fill('25')
  expect((await json(main)).ifTrue[1]).toEqual({
    id: 'draft',
    kind: 'draft',
    params: { side: 'sell', quantity: 25, price: 'limit' },
  })
  expect(await text(main)).toContain('Draft order Sell 25 lots at Limit')
  await expect(main.locator('[data-slot="rule-status"]')).toHaveText('Ready')
})

test('Alt+↑↓ 落在下拉触发器上：整行挪动，下拉不打开（评审 2）', async ({ page }) => {
  const main = await open(page)
  const root = main.locator('[data-list="root"]')
  const field = main.locator('[data-id="sector"] [data-part="field"]')
  await field.focus()
  await page.keyboard.press('Alt+ArrowDown')
  expect(await order(root)).toEqual(['market', 'cross', 'sector', 'liquidity'])
  await expect(page.getByRole('listbox')).toHaveCount(0)
  // 焦点回到挪动的那一行的把手上，再按 Alt+↑ 挪回去，同样不开下拉。
  await page.keyboard.press('Alt+ArrowUp')
  expect(await order(root)).toEqual(['market', 'sector', 'cross', 'liquidity'])
  await expect(page.getByRole('listbox')).toHaveCount(0)
  // 不带 Alt 的 ↓ 还是照常打开下拉。
  await field.focus()
  await page.keyboard.press('ArrowDown')
  await expect(page.getByRole('listbox')).toBeVisible()
  await page.keyboard.press('Escape')
  // 动作行的下拉一样。
  const kind = main.locator('[data-id="alert"] [data-part="kind"]')
  await kind.focus()
  await page.keyboard.press('Alt+ArrowDown')
  expect((await json(main)).ifTrue.map((a: any) => a.id)).toEqual(['draft', 'alert'])
  await expect(page.getByRole('listbox')).toHaveCount(0)
})

test('点状态栏的「N 个问题」：全部标红，焦点到第一个出错的格子（改动 b）', async ({ page }) => {
  const main = await open(page)
  await main.locator('[data-add="ifTrue"]').getByRole('button', { name: 'Add action' }).click()
  const added = main.locator('[data-id="a-1"]')
  // 新加的行还没动过：不红，但状态已经数着 1 个问题，并且是个按钮。
  await expect(added).not.toHaveAttribute('data-invalid', '')
  const status = main.getByRole('button', { name: /1 issue: show all/ })
  await expect(status).toHaveText('1 issue')
  await status.click()
  await expect(added).toHaveAttribute('data-invalid', '')
  await expect(paramBox(added, 'channel')).toBeFocused()
  await expect(paramBox(added, 'channel')).toHaveAttribute('aria-invalid', 'true')
  // 没有问题时状态只是文字。
  await paramBox(added, 'channel').click()
  await page.getByRole('option', { name: 'Push' }).click()
  await expect(main.locator('[data-slot="rule-status"]')).toHaveText('Ready')
  await expect(main.getByRole('button', { name: /show all/ })).toHaveCount(0)

  // 多个问题时去第一个（按阅读次序）：那份故意写坏的，第一个是换手率越界。
  const broken = page.locator('[data-gallery-rule="broken"]')
  await broken.getByRole('button', { name: /6 issues: show all/ }).click()
  await expect(broken.locator('[data-id="rate"] input[data-part="value"]')).toBeFocused()
})

test('含锁定条件的组删不掉：按钮禁用并说明，Delete 不动；没有锁定条件的组照删（评审 1）', async ({ page }) => {
  await page.goto('/?theme=graphite#/rule-builder')
  const demo = page.locator('[data-gallery-rule="switch"]')
  await demo.waitFor()
  const guard = demo.locator('[data-list="guard"]')
  await expect(guard).toHaveCount(1)
  const head = demo.locator('.k-rb-grouphead[data-id="guard"]')
  const remove = head.locator('[data-slot="rule-remove"]')
  await expect(remove).toHaveAttribute('aria-disabled', 'true')
  await expect(remove).toHaveAccessibleName('Cannot remove Group · 1 condition · And: it holds a locked condition')
  // aria-disabled 的按钮 Playwright 当成「不可用」，强制点：真人点它也什么都不该发生。
  await remove.click({ force: true })
  await expect(guard).toHaveCount(1)
  await expect(demo.locator('[data-id="market"]')).toHaveCount(1)
  // 键盘：把手上按 Delete 也不动，并播报原因。
  await head.locator('[data-part="handle"]').focus()
  await page.keyboard.press('Delete')
  await expect(guard).toHaveCount(1)
  await expect(demo.locator('[data-slot="rule-live"]')).toHaveText(
    'Cannot remove Group · 1 condition · And: it holds a locked condition',
  )
  await expect(demo.locator('[data-slot="rule-undo"]')).toBeDisabled()
  // 别的组照常能删：加一个组再删掉。
  await demo.locator('[data-add="root"]').getByRole('button', { name: 'Add group' }).click()
  await expect(demo.locator('.k-rb-grouphead')).toHaveCount(2)
  const fresh = demo.locator('.k-rb-grouphead').last()
  await expect(fresh.locator('[data-slot="rule-remove"]')).not.toHaveAttribute('aria-disabled', 'true')
  await fresh.locator('[data-slot="rule-remove"]').click()
  await expect(demo.locator('.k-rb-grouphead')).toHaveCount(1)
})

test('换一份规则（受控 value）：撤销栈与「改过的行」清掉（评审 4）', async ({ page }) => {
  await page.goto('/?theme=graphite#/rule-builder')
  const demo = page.locator('[data-gallery-rule="switch"]')
  await demo.waitFor()
  const undo = demo.locator('[data-slot="rule-undo"]')
  const redo = demo.locator('[data-slot="rule-redo"]')
  const rate = demo.locator('[data-id="rate"]')
  const input = rate.locator('input[data-part="value"]')
  // 在 A 里改过换手率：撤销可用，这一行进了「改过的行」；撤销一步后重做也可用。
  await input.fill('7')
  await expect(undo).toBeEnabled()
  await demo.locator('[data-id="rate"] [data-part="handle"]').focus()
  await page.keyboard.press('Control+z')
  await expect(redo).toBeEnabled()
  // 换成 B：B 的换手率 130 越界，但这一行没被动过，不该红；撤销与重做都是空的。
  await demo.locator('[data-switch="b"]').click()
  await expect(input).toHaveValue('130')
  await expect(rate).not.toHaveAttribute('data-invalid', '')
  await expect(demo.locator('[data-slot="rule-status"]')).toHaveText('1 issue')
  await expect(undo).toBeDisabled()
  await expect(redo).toBeDisabled()
  // 在新文档里照常编辑，撤销只回到 B 的状态，不会跳回 A。
  await input.fill('50')
  await expect(undo).toBeEnabled()
  await undo.click()
  await expect(input).toHaveValue('130')
  await expect(undo).toBeDisabled()
  // 自己写出去的不算换文档：在 B 里改一下，撤销栈留着。
  await input.fill('60')
  await expect(undo).toBeEnabled()
})

test('删了再加：复用的 id 不继承旧的「改过」标记，新行不一上来就红（评审 8）', async ({ page }) => {
  const main = await open(page)
  const root = main.locator('[data-list="root"]')
  const add = main.locator('[data-add="root"]').getByRole('button', { name: 'Add condition' })
  await add.click()
  const first = (await order(root)).at(-1)!
  const row = main.locator(`[data-id="${first}"]`)
  await expect(row).not.toHaveAttribute('data-invalid', '')
  // 改一下（进「改过的行」），再删掉。
  await row.locator('[data-part="value"]').click()
  await page.getByRole('option', { name: 'US' }).click()
  await row.locator('[data-slot="rule-remove"]').click()
  await expect(main.locator(`[data-id="${first}"]`)).toHaveCount(0)
  await add.click()
  const again = (await order(root)).at(-1)!
  expect(again).toBe(first) // id 被复用了
  await expect(main.locator(`[data-id="${again}"]`)).not.toHaveAttribute('data-invalid', '')
  await expect(main.locator('[data-slot="rule-issue"]')).toHaveCount(0)
})

test('换字段：同类同单位留值，口径不同清空要求重填，引用清掉（评审 3）', async ({ page }) => {
  const main = await open(page)
  const pick = async (id: string, label: string) => {
    await main.locator(`[data-id="${id}"] [data-part="field"]`).click()
    await page.getByRole('option', { name: label, exact: true }).click()
  }
  // 成交额 500 M → 换手率（%）：单位不同，清空。
  await pick('turnover', 'Turnover rate')
  expect((await json(main)).when.children[3].children[0]).toMatchObject({
    field: 'turnover-rate',
    value: { kind: 'number', value: null },
  })
  await expect(main.locator('[data-slot="rule-live"]')).toHaveText(/^Value cleared/)
  await expect(main.locator('[data-id="turnover"] input[data-part="value"]')).toHaveValue('')
  // 所属板块（任一，选项是板块）→ 市场（选项不同）：清空成空列表。
  await pick('sector', 'Market')
  expect((await json(main)).when.children[1]).toMatchObject({
    field: 'market',
    op: 'in',
    value: { kind: 'list', values: [] },
  })
  // 引用：Close crosses above MA20 → 换成 RSI(14)，引用清掉（比的对象变了；RSI 也不同口径）。
  await pick('cross', 'RSI(14)')
  expect((await json(main)).when.children[2].value).toEqual({ kind: 'number', value: null })
  // 同类同单位（都没单位）：RSI 的单位也是空，填 12.5 后换成 Close，值留着。
  await main.locator('[data-id="cross"] input[data-part="value"]').fill('12.5')
  await pick('cross', 'Close')
  expect((await json(main)).when.children[2]).toMatchObject({ field: 'close', value: { kind: 'number', value: 12.5 } })
})

test('无障碍名字：组带 And / Or，根组有名字，回读行是有名字的组（评审 5、7）', async ({ page }) => {
  const main = await open(page)
  await expect(main.getByRole('group', { name: 'Conditions · 5 · And', exact: true })).toBeVisible()
  await expect(main.getByRole('group', { name: 'Group · 2 conditions · Or', exact: true })).toBeVisible()
  await expect(main.getByRole('group', { name: 'Rule in words', exact: true })).toContainText('When Market is A-shares')
  // 切成 Or：名字跟着变。
  await main.locator('[data-list="root"] + [data-slot="rule-mode"]').click()
  await expect(main.getByRole('group', { name: 'Conditions · 5 · Or', exact: true })).toBeVisible()
  // 回读那个 <p> 自己不带 aria-label。
  await expect(main.locator('[data-slot="rule-text"]')).not.toHaveAttribute('aria-label')
})

test('空组留在回读里，缺的参数写占位（评审 6）', async ({ page }) => {
  await page.goto('/?theme=graphite#/rule-builder')
  const broken = page.locator('[data-gallery-rule="broken"]')
  await broken.waitFor()
  await expect(broken.locator('[data-slot="rule-text"]')).toContainText('and …, then Draft order Buy … at …')
})
