// SPDX-License-Identifier: MIT
// 级联菜单的悬停控制器（#250 第二部分，kubai 002）：下拉菜单与右键菜单共用，一个父菜单一个控制器（menu-cascade.tsx 的 useCascade 创建）。
// 时间与几何在 cascade-model.ts（纯函数，有单测）；这里只管「把它们接到 Radix 的菜单上」：
//   - 在父菜单的 Content 上用 onPointerMoveCapture 抢在 Radix 的菜单项之前处理指针：Radix 的菜单项在 pointermove 里
//     `event.preventDefault()` 之后就不再聚焦自己（composeEventHandlers 看 defaultPrevented），所以我们 preventDefault 就等于「这一行被跳过，不亮」。
//     Radix 的 SubTrigger 写死 100ms 开（@radix-ui/react-menu 2.2.1 dist/index.mjs 的 MenuSubTrigger，2026-11-13 读），它的 pointer grace 写死 300ms，
//     都配不了，所以悬停开合在这里接管；键盘（→ ← Enter Esc）、焦点管理、两层上限仍是 Radix 的。
//   - 行的高亮由状态驱动：亮 = 获得焦点（data-highlighted，Radix 写）、展开 = data-state=open（父项）、被跳过 = data-k-cascade="skipped"（这里写）；
//     菜单行上没有 CSS :hover，三角里经过的行不会闪。
// 子菜单开着时才在 document 上听 pointermove（量指针在不在安全区、有没有滑出所有层）；父菜单卸载时一并清掉。
import {
  CASCADE_TIMING,
  DwellGuard,
  inSafeZone,
  openDelayFor,
  safeZone,
  type Point,
  type SafeZone,
} from './cascade-model.ts'

/** 一个子菜单向控制器登记自己：触发器是哪一行、现在开没开、怎么开合。 */
export type CascadeSub = {
  trigger: () => HTMLElement | null
  isOpen: () => boolean
  setOpen: (open: boolean) => void
}

const ROW = '[role="menuitem"],[role="menuitemcheckbox"],[role="menuitemradio"]'
const SKIPPED = 'data-k-cascade'

type PointerLike = {
  pointerType: string
  clientX: number
  clientY: number
  buttons: number
  target: EventTarget | null
  nativeEvent?: Event
}

const isDisabled = (row: Element) => row.hasAttribute('data-disabled') || row.getAttribute('aria-disabled') === 'true'

export class CascadeController {
  /** 父菜单的容器元素（Content）。 */
  parent: HTMLElement | null = null

  readonly #subs = new Set<CascadeSub>()
  readonly #seen = new WeakSet<Event>()
  readonly #guard = new DwellGuard<Element>()
  #recent: Point[] = []
  #last: Point | null = null
  #apex: Point | null = null
  #wasOnTrigger = false
  #skipped: Element | null = null
  #pending: HTMLElement | null = null
  #pendingOff: (() => void) | null = null
  #openTimer = 0
  #closeTimer = 0
  #recheck = 0
  #overlay: HTMLElement | null = null
  #detach: (() => void) | null = null

  /** React 的 ref 回调：挂上父菜单容器，并在 document 上听指针（子菜单开着时才做事）。 */
  readonly attach = (element: HTMLElement | null) => {
    if (element === this.parent) return
    this.dispose()
    this.parent = element
    if (!element) return
    const onMove = (event: PointerEvent) => void this.move(event)
    document.addEventListener('pointermove', onMove, { passive: true })
    this.#detach = () => document.removeEventListener('pointermove', onMove)
  }

  register(sub: CascadeSub): () => void {
    this.#subs.add(sub)
    return () => void this.#subs.delete(sub)
  }

  dispose() {
    this.#detach?.()
    this.#detach = null
    this.#cancelOpen()
    this.#cancelClose()
    this.#stopRecheck()
    this.#unmark()
    this.#undraw()
    this.#guard.reset()
    this.#apex = null
  }

  /** 键盘接手：悬停的计时与保护全部撤掉（键盘走的是 Radix 自己的逻辑）。 */
  keyboard() {
    this.#cancelOpen()
    this.#cancelClose()
    this.#stopRecheck()
    this.#unmark()
    this.#undraw()
    this.#guard.reset()
    this.#apex = null
    this.#wasOnTrigger = false
  }

  /**
   * 指针移动。返回 true 表示调用方要 preventDefault（这一行我们已经处理了：被跳过，或我们自己聚焦并安排开合）。
   * React 的捕获处理与 document 上的监听会收到同一个原生事件，只处理一次。
   */
  move(event: PointerLike | PointerEvent): boolean {
    if (event.pointerType !== 'mouse') return false
    const native = 'nativeEvent' in event && event.nativeEvent ? event.nativeEvent : (event as Event)
    if (this.#seen.has(native)) return false
    this.#seen.add(native)
    const parent = this.parent
    if (!parent) return false
    const point = { x: event.clientX, y: event.clientY }
    this.#last = point
    this.#recent = [...this.#recent.slice(-1), point]
    const target = event.target instanceof Element ? event.target : null
    const sub = this.#openSub()
    if (!sub) return this.#hoverClosed(target, event.buttons)
    const content = this.#contentOf(sub)
    if (!content) return false
    // 指针进了子菜单：保护全部解除，关闭计时取消。
    if (target && content.contains(target)) {
      this.#clearProtection()
      this.#cancelClose()
      return false
    }
    const inParent = !!target && parent.contains(target)
    const row = inParent && target ? this.#rowOf(target, content) : null
    return this.#hoverOpen(sub, content, point, row, inParent)
  }

  /** 拖着东西（HTML 拖放）经过父项：420ms 才开。 */
  dragOver(target: EventTarget | null) {
    if (!(target instanceof Element) || this.#openSub()) return
    const row = this.#rowOf(target, null)
    const entry = row ? this.#subFor(row) : null
    if (!row || !entry || isDisabled(row) || this.#pending === row) return
    this.#startOpen(entry, row, openDelayFor(true))
  }

  /**
   * SubContent 的 onFocusOutside：Radix 在指针离开一行时把焦点移到菜单容器上，这会立刻收掉子菜单（也就绕过了 360ms 关闭延时与安全区）。
   * 焦点落在父菜单容器本身，只有这一种来路（Radix 的 onItemLeave；打开菜单时的自动聚焦发生在子菜单开之前，键盘移动落在某个菜单项上）：
   * preventDefault 挡住，由控制器按安全区与延时决定收不收。不看「刚有没有指针移动」：指针先离开、后才有 pointermove，指针停了很久再走时那个时间差是旧的。
   */
  holdFocusOutside(event: Event) {
    if (event.target === this.parent && this.#openSub()) event.preventDefault()
  }

  // ---------- 子菜单还没开 ----------

  #hoverClosed(target: Element | null, buttons: number): boolean {
    const row = target && this.parent?.contains(target) ? this.#rowOf(target, null) : null
    const entry = row ? this.#subFor(row) : null
    if (!row || !entry || isDisabled(row)) {
      this.#cancelOpen()
      return false
    }
    // 悬停在父项上：220ms 开（拖着东西 420ms），离开取消；先自己把这一行亮起来（Radix 的那份被 preventDefault 跳过了）。
    if (this.#pending !== row) this.#startOpen(entry, row, openDelayFor(buttons !== 0))
    row.focus({ preventScroll: true })
    return true
  }

  // ---------- 子菜单开着 ----------

  #hoverOpen(sub: CascadeSub, content: HTMLElement, point: Point, row: HTMLElement | null, inParent: boolean): boolean {
    const parent = this.parent!
    const trigger = sub.trigger()
    // 回到触发器：保护与关闭计时都撤掉，顺手记下「刚在触发器上」，下一次离开时取顶点。
    if (row && row === trigger) {
      this.#clearProtection()
      this.#cancelClose()
      this.#wasOnTrigger = true
      return false
    }
    // 离开触发器的第一次移动：顶点取前两次 pointermove 里较早的那个（最近两个点里靠前的，即离开前最后落在触发器上的点）。
    if (this.#wasOnTrigger) {
      this.#apex = this.#recent.length >= 2 ? this.#recent[0]! : point
      this.#wasOnTrigger = false
    }
    const zone = this.#apex
      ? safeZone(this.#apex, parent.getBoundingClientRect(), content.getBoundingClientRect())
      : null
    this.#draw(zone)
    if (zone && inSafeZone(point, zone)) {
      this.#cancelClose()
      const verdict = this.#guard.judge({ row, now: performance.now(), inZone: true })
      if (verdict === 'hold') {
        this.#mark(row)
        this.#ensureRecheck()
        return true
      }
      return this.#switchTo(row)
    }
    // 三角外：行换亮（子菜单收起，新行是父项的话照 220ms 开）；不在行上而还在父菜单里（边距、分隔线）算还在层里。
    this.#clearProtection()
    if (row) return this.#switchTo(row)
    if (inParent) {
      this.#cancelClose()
      return false
    }
    this.#startClose()
    return false
  }

  /** 切到指针底下的这一行：收掉开着的子菜单，行亮起，是父项就照 220ms 安排开。row 为 null 只解除保护。 */
  #switchTo(row: HTMLElement | null): boolean {
    this.#clearProtection()
    this.#cancelClose()
    if (!row) return false
    for (const sub of this.#subs) if (sub.isOpen()) sub.setOpen(false)
    const entry = this.#subFor(row)
    if (entry && !isDisabled(row)) this.#startOpen(entry, row, openDelayFor(false))
    row.focus({ preventScroll: true })
    return true
  }

  // ---------- 保护 ----------

  #clearProtection() {
    this.#unmark()
    this.#stopRecheck()
    this.#guard.reset()
    this.#apex = null
    this.#undraw()
  }

  /** 安全窗口里每 80ms 复查：指针停住时没有 pointermove，满 1.2s 或已离开三角都要靠它放行。 */
  #ensureRecheck() {
    if (this.#recheck) return
    this.#recheck = window.setInterval(() => this.#tick(), CASCADE_TIMING.safeRecheck)
  }
  #stopRecheck() {
    window.clearInterval(this.#recheck)
    this.#recheck = 0
  }
  #tick() {
    const sub = this.#openSub()
    const content = sub ? this.#contentOf(sub) : null
    const point = this.#last
    if (!sub || !content || !point || !this.#apex || !this.parent) return this.#clearProtection()
    const zone = safeZone(this.#apex, this.parent.getBoundingClientRect(), content.getBoundingClientRect())
    const under = document.elementFromPoint(point.x, point.y)
    const row = under && this.parent.contains(under) ? this.#rowOf(under, content) : null
    const verdict = this.#guard.judge({ row, now: performance.now(), inZone: inSafeZone(point, zone) })
    if (verdict === 'release') this.#switchTo(row)
  }

  #mark(row: Element | null) {
    if (this.#skipped === row) return
    this.#unmark()
    this.#skipped = row
    row?.setAttribute(SKIPPED, 'skipped')
  }
  #unmark() {
    this.#skipped?.removeAttribute(SKIPPED)
    this.#skipped = null
  }

  // ---------- 开与关的计时 ----------

  #startOpen(entry: CascadeSub, row: HTMLElement, delay: number) {
    this.#cancelOpen()
    this.#pending = row
    const cancel = () => this.#cancelOpen()
    row.addEventListener('pointerleave', cancel, { once: true })
    row.addEventListener('dragleave', cancel, { once: true })
    this.#pendingOff = () => {
      row.removeEventListener('pointerleave', cancel)
      row.removeEventListener('dragleave', cancel)
    }
    this.#openTimer = window.setTimeout(() => {
      this.#cancelOpen()
      if (row.isConnected && !entry.isOpen()) entry.setOpen(true)
    }, delay)
  }
  #cancelOpen() {
    window.clearTimeout(this.#openTimer)
    this.#openTimer = 0
    this.#pendingOff?.()
    this.#pendingOff = null
    this.#pending = null
  }

  /** 指针滑出所有层与安全区：360ms 后收子菜单；这期间回来就取消。 */
  #startClose() {
    if (this.#closeTimer) return
    this.#closeTimer = window.setTimeout(() => {
      this.#closeTimer = 0
      if (this.#pointerInside()) return
      for (const sub of this.#subs) if (sub.isOpen()) sub.setOpen(false)
      this.#clearProtection()
      this.#wasOnTrigger = false
    }, CASCADE_TIMING.closeDelay)
  }
  #cancelClose() {
    window.clearTimeout(this.#closeTimer)
    this.#closeTimer = 0
  }
  /** 关闭计时到点时再量一次：指针此刻在父菜单、子菜单或安全区里就不收。 */
  #pointerInside(): boolean {
    const point = this.#last
    const sub = this.#openSub()
    const content = sub ? this.#contentOf(sub) : null
    if (!point || !this.parent || !content) return false
    const under = document.elementFromPoint(point.x, point.y)
    if (under && (this.parent.contains(under) || content.contains(under))) return true
    if (!this.#apex) return false
    return inSafeZone(point, safeZone(this.#apex, this.parent.getBoundingClientRect(), content.getBoundingClientRect()))
  }

  // ---------- 找元素 ----------

  #openSub(): CascadeSub | null {
    for (const sub of this.#subs) {
      const trigger = sub.trigger()
      if (sub.isOpen() && trigger?.isConnected) return sub
    }
    return null
  }
  #subFor(row: Element): CascadeSub | null {
    for (const sub of this.#subs) if (sub.trigger() === row) return sub
    return null
  }
  #contentOf(sub: CascadeSub): HTMLElement | null {
    const id = sub.trigger()?.getAttribute('aria-controls')
    return id ? document.getElementById(id) : null
  }
  #rowOf(target: Element, content: HTMLElement | null): HTMLElement | null {
    const row = target.closest<HTMLElement>(ROW)
    return row && this.parent?.contains(row) && !content?.contains(row) ? row : null
  }

  // ---------- 调试覆盖层（默认关；根节点 data-cascade-debug 打开） ----------

  #draw(zone: SafeZone | null) {
    if (!zone || !document.documentElement.hasAttribute('data-cascade-debug')) return this.#undraw()
    const parent = this.parent!.getBoundingClientRect()
    const [a, b] = zone.near
    if (!this.#overlay) {
      const svgNs = 'http://www.w3.org/2000/svg'
      const root = document.createElement('div')
      root.setAttribute('data-k-cascade-debug', '')
      Object.assign(root.style, { position: 'fixed', inset: '0', pointerEvents: 'none', zIndex: '2147483647' })
      const svg = document.createElementNS(svgNs, 'svg')
      svg.setAttribute('width', '100%')
      svg.setAttribute('height', '100%')
      const triangle = document.createElementNS(svgNs, 'polygon')
      // 蓝 16% 填充加虚线框（002 的调试画法）；色取语义 token（状态：信息），不写色值。
      triangle.setAttribute('fill', 'color-mix(in srgb, var(--k-status-info-foreground) 16%, transparent)')
      const band = document.createElementNS(svgNs, 'rect')
      band.setAttribute('fill', 'none')
      band.setAttribute('stroke', 'var(--k-status-info-border)')
      band.setAttribute('stroke-dasharray', '4 3')
      svg.append(triangle, band)
      root.append(svg)
      document.body.append(root)
      this.#overlay = root
    }
    const [triangle, band] = this.#overlay.querySelectorAll('polygon, rect')
    triangle?.setAttribute('points', `${zone.apex.x},${zone.apex.y} ${a.x},${a.y} ${b.x},${b.y}`)
    band?.setAttribute('x', String(zone.band.from))
    band?.setAttribute('y', String(parent.top))
    band?.setAttribute('width', String(zone.band.to - zone.band.from))
    band?.setAttribute('height', String(parent.height))
  }
  #undraw() {
    this.#overlay?.remove()
    this.#overlay = null
  }
}
