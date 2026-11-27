// SPDX-License-Identifier: MIT
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test'
import { CascadeController, type CascadeSub } from './cascade-controller.ts'

// 控制器的接线测试（#250，kubai 002）：node 里没有 DOM，用一小套假元素与假时钟顶上，只测控制器自己的决定——
// 普通行 220ms 才收深一层、顶点随移动更新、Radix 的 focus-outside 被挡住。真实浏览器里的整条路径在 e2e/ui-gallery.spec.ts。

const isRow = (el: FakeEl) => el.getAttribute('role')?.startsWith('menuitem') ?? false

class FakeEl {
  isConnected = true
  focusCount = 0
  #attrs = new Map<string, string>()
  #listeners = new Map<string, Set<() => void>>()
  children: FakeEl[] = []
  parentEl: FakeEl | null = null
  onFocus: (() => void) | null = null
  constructor(
    attrs: Record<string, string>,
    public rect = { left: 0, top: 0, right: 0, bottom: 0 },
  ) {
    for (const [name, value] of Object.entries(attrs)) this.#attrs.set(name, value)
  }
  add(child: FakeEl) {
    child.parentEl = this
    this.children.push(child)
    return child
  }
  contains(node: unknown): boolean {
    for (let at = node as FakeEl | null; at; at = at.parentEl) if (at === this) return true
    return false
  }
  closest(): FakeEl | null {
    return isRow(this) ? this : (this.parentEl?.closest() ?? null)
  }
  focus() {
    this.focusCount += 1
    this.onFocus?.()
  }
  hasAttribute = (name: string) => this.#attrs.has(name)
  getAttribute = (name: string) => this.#attrs.get(name) ?? null
  setAttribute = (name: string, value: string) => void this.#attrs.set(name, value)
  removeAttribute = (name: string) => void this.#attrs.delete(name)
  addEventListener = (type: string, fn: () => void) => {
    this.#listeners.set(type, (this.#listeners.get(type) ?? new Set()).add(fn))
  }
  removeEventListener = (type: string, fn: () => void) => void this.#listeners.get(type)?.delete(fn)
  fire(type: string) {
    for (const fn of this.#listeners.get(type) ?? []) fn()
  }
  getBoundingClientRect = () => ({
    ...this.rect,
    width: this.rect.right - this.rect.left,
    height: this.rect.bottom - this.rect.top,
  })
}

type Fixture = ReturnType<typeof build>

/** 父菜单 0..200 × 0..120：三行 触发器（0..30）、普通行 a（30..60）、第二个触发器（60..90）；两个子菜单都在 x=202 起。 */
function build() {
  const parent = new FakeEl({ role: 'menu' }, { left: 0, top: 0, right: 200, bottom: 120 })
  const trigger = parent.add(new FakeEl({ role: 'menuitem', 'aria-controls': 'sub-1' }))
  const plain = parent.add(new FakeEl({ role: 'menuitem' }))
  const trigger2 = parent.add(new FakeEl({ role: 'menuitem', 'aria-controls': 'sub-2' }))
  const content1 = new FakeEl({ role: 'menu' }, { left: 202, top: 0, right: 400, bottom: 120 })
  const content2 = new FakeEl({ role: 'menu' }, { left: 202, top: 60, right: 400, bottom: 180 })
  const contents = new Map([
    ['sub-1', content1],
    ['sub-2', content2],
  ])
  vi.stubGlobal('Element', FakeEl)
  vi.stubGlobal('window', globalThis)
  vi.stubGlobal('document', {
    documentElement: { hasAttribute: () => false },
    getElementById: (id: string) => contents.get(id) ?? null,
    elementFromPoint: () => null,
  })
  const state = { open1: false, open2: false }
  const sub1: CascadeSub = {
    trigger: () => trigger as unknown as HTMLElement,
    isOpen: () => state.open1,
    setOpen: (open) => void (state.open1 = open),
  }
  const sub2: CascadeSub = {
    trigger: () => trigger2 as unknown as HTMLElement,
    isOpen: () => state.open2,
    setOpen: (open) => void (state.open2 = open),
  }
  const controller = new CascadeController()
  controller.parent = parent as unknown as HTMLElement
  controller.register(sub1)
  controller.register(sub2)
  const move = (target: FakeEl, x: number, y: number) =>
    controller.move({
      pointerType: 'mouse',
      clientX: x,
      clientY: y,
      buttons: 0,
      target: target as never,
      nativeEvent: {} as Event,
    })
  return { parent, trigger, plain, trigger2, content1, state, controller, move }
}

/** Radix 的 focus-outside 事件：preventDefault 之后 defaultPrevented 变真。 */
function focusOutside(target: FakeEl) {
  const event = {
    target,
    defaultPrevented: false,
    preventDefault() {
      this.defaultPrevented = true
    },
  }
  return event
}

let f: Fixture
beforeEach(() => {
  vi.useFakeTimers()
  f = build()
})
afterEach(() => {
  f.controller.dispose()
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

/** 子菜单一已经开着，指针停在触发器上（两个点，保证有「较早的点」）。 */
function openedOnTrigger() {
  f.state.open1 = true
  f.move(f.trigger, 150, 10)
  f.move(f.trigger, 151, 15)
}

describe('普通行：220ms 才收深一层', () => {
  it('指针直着落到普通行：行马上亮，子菜单 219ms 还开着，220ms 收', () => {
    openedOnTrigger()
    expect(f.move(f.plain, 151, 45)).toBe(true)
    expect(f.plain.focusCount).toBe(1)
    vi.advanceTimersByTime(219)
    expect(f.state.open1).toBe(true)
    vi.advanceTimersByTime(1)
    expect(f.state.open1).toBe(false)
  })

  it('这期间指针在同一行上继续动：不重新计时', () => {
    openedOnTrigger()
    f.move(f.plain, 151, 45)
    vi.advanceTimersByTime(150)
    f.move(f.plain, 151, 50)
    vi.advanceTimersByTime(70)
    expect(f.state.open1).toBe(false)
  })

  it('220ms 内回到触发器：取消，一直开着', () => {
    openedOnTrigger()
    f.move(f.plain, 151, 45)
    vi.advanceTimersByTime(100)
    f.move(f.trigger, 151, 15)
    vi.advanceTimersByTime(1000)
    expect(f.state.open1).toBe(true)
  })

  it('220ms 内指针离开这一行：取消，子菜单不收', () => {
    openedOnTrigger()
    f.move(f.plain, 151, 45)
    vi.advanceTimersByTime(100)
    f.plain.fire('pointerleave')
    vi.advanceTimersByTime(200)
    expect(f.state.open1).toBe(true)
  })

  it('220ms 内换到另一行：从换行那一刻重新计', () => {
    openedOnTrigger()
    f.move(f.plain, 151, 45)
    vi.advanceTimersByTime(150)
    f.plain.fire('pointerleave')
    f.move(f.trigger2, 151, 75)
    vi.advanceTimersByTime(219)
    expect(f.state.open1).toBe(true)
    vi.advanceTimersByTime(1)
    expect(f.state.open1).toBe(false)
    expect(f.state.open2).toBe(true)
  })

  it('落到另一个父项上：旧的 220ms 收，新的同一刻开', () => {
    openedOnTrigger()
    f.move(f.trigger2, 151, 75)
    vi.advanceTimersByTime(219)
    expect(f.state.open1).toBe(true)
    expect(f.state.open2).toBe(false)
    vi.advanceTimersByTime(1)
    expect(f.state.open1).toBe(false)
    expect(f.state.open2).toBe(true)
  })

  it('键盘接手：待切换取消', () => {
    openedOnTrigger()
    f.move(f.plain, 151, 45)
    f.controller.keyboard()
    vi.advanceTimersByTime(500)
    expect(f.state.open1).toBe(true)
  })
})

describe('Radix 的 focus-outside', () => {
  it('我们自己聚焦指针底下那一行时被挡住（否则子菜单当场就收，220ms 就没意义）', () => {
    openedOnTrigger()
    const events: ReturnType<typeof focusOutside>[] = []
    f.plain.onFocus = () => {
      const event = focusOutside(f.plain)
      f.controller.holdFocusOutside(event as unknown as Event)
      events.push(event)
    }
    f.move(f.plain, 151, 45)
    expect(events).toHaveLength(1)
    expect(events[0]!.defaultPrevented).toBe(true)
  })

  it('焦点落在父菜单容器上（Radix 的 onItemLeave）也挡住', () => {
    openedOnTrigger()
    const event = focusOutside(f.parent)
    f.controller.holdFocusOutside(event as unknown as Event)
    expect(event.defaultPrevented).toBe(true)
  })

  it('不是我们聚焦的别的行（键盘移动等）不挡，交给 Radix', () => {
    openedOnTrigger()
    const event = focusOutside(f.plain)
    f.controller.holdFocusOutside(event as unknown as Event)
    expect(event.defaultPrevented).toBe(false)
  })

  it('子菜单没开着：什么都不挡', () => {
    const event = focusOutside(f.parent)
    f.controller.holdFocusOutside(event as unknown as Event)
    expect(event.defaultPrevented).toBe(false)
  })
})

describe('安全三角的顶点随移动更新', () => {
  it('在三角里停到普通行上被护着；再直着往下一小步：新顶点是上一个点，三角里没有这个点，立刻放行', () => {
    openedOnTrigger()
    // 从触发器上的 (151,15) 斜着朝二级走到普通行上的 (180,40)：在三角与保护带里，被跳过、不亮。
    expect(f.move(f.plain, 180, 40)).toBe(true)
    expect(f.plain.getAttribute('data-k-cascade')).toBe('skipped')
    expect(f.plain.focusCount).toBe(0)
    // 直着往下 12px。冻结在 (151,15) 的旧顶点会继续护着（(181,52) 还在那个三角里），滚动的顶点 (180,40) 不会。
    expect(f.move(f.plain, 181, 52)).toBe(true)
    expect(f.plain.hasAttribute('data-k-cascade')).toBe(false)
    expect(f.plain.focusCount).toBe(1)
    vi.advanceTimersByTime(220)
    expect(f.state.open1).toBe(false)
  })

  it('一直朝二级斜着走：每一步的顶点都是上一步，路过的行一直被护着', () => {
    openedOnTrigger()
    const steps: Array<[number, number]> = [
      [165, 32],
      [175, 38],
      [185, 44],
      [195, 50],
    ]
    for (const [x, y] of steps) {
      expect(f.move(f.plain, x, y)).toBe(true)
      expect(f.plain.getAttribute('data-k-cascade')).toBe('skipped')
    }
    expect(f.plain.focusCount).toBe(0)
    expect(f.state.open1).toBe(true)
  })
})
