// SPDX-License-Identifier: MIT
import { CircleAlert, CircleCheck, TriangleAlert } from 'lucide-react'
import {
  AnimatePresence,
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
  type PanInfo,
} from 'motion/react'
import {
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentProps,
  type ReactNode,
  type Ref,
} from 'react'
import { cn } from '../lib/cn.ts'
import { snappy } from '../lib/motion.ts'
import type { Severity } from '../lib/severity.ts'
import { unit } from '../lib/spring.ts'
import { Button } from '../primitives/button.tsx'
import { stackLayout, swipeDecision, type StackSlot } from './toast-stack-model.ts'
import {
  Toast,
  ToastClose,
  ToastContent,
  ToastDescription,
  ToastIcon,
  ToastText,
  ToastTitle,
  ToastViewport,
  type ToastPosition,
} from './toast.tsx'

// 叠放的弹出提示（#195）：可选的一层，套在原有的 Toast 零件外面，旧的 ToastViewport / Toast 的 API 一点没动。
// 交互借自 Jamie Merrill 的「Stacked toasts」「Dismissing toasts」（只借交互，样子是现有的 Toast 皮肤；几何与手势判定在 toast-stack-model.ts）：
//   收拢：多条时只露最新一条，后面的缩小、上移、变淡，最多露 3 层；指针移进或键盘焦点进来 → 展开成列表，移出收回，展开时暂停自动消失；
//   滑动关：横向拖过条宽约 40% 或甩出速度够，往那边滑出并关，不够弹回；关掉一条，其余走弹簧补位；
//   撤销就地变状态：条目带一个动作钮，点了这一条原地换成 result（默认 ok 语气），过一会儿自己消失，不另弹一条。
// 条目表受控（items + onItemsChange）或不受控（defaultItems，加上 ref 的 push）都行；定时、暂停、最多条数由这一层管。
// 读屏与键盘（modern-web-guidance 的 persistent-toast-notifications）：区域是 role=region、aria-live=assertive，名字由调用方传；
//   关闭钮与动作钮都是普通 button，Tab 进叠层就展开；焦点在某一条上时那条的计时暂停；关掉有焦点的一条，焦点移到相邻的一条；
//   点动作钮后焦点落到同一条的关闭钮，不丢到 body 上。
// prefers-reduced-motion：不缩放、不滑、不弹：收拢只留最前面一条，别的淡出；展开瞬间摆好，只淡入淡出；不接滑动手势。

/** 一条结果态：点了动作钮以后，这一条原地换成它。 */
export type ToastStackResult = {
  /** 默认 ok（成功态，绿色语气）。 */
  tone?: Severity
  /** 默认按语气取图标。 */
  icon?: ReactNode
  title: ReactNode
  description?: ReactNode
  /** 结果态停多久（毫秒）；不写取叠放层的 resultDuration，Infinity 不自动消失。 */
  duration?: number
}

export type ToastStackAction = {
  /** 钮上的字（包里不带文案，调用方传）。 */
  label: string
  /** 点了以后先调这个（真正去撤销）。 */
  onAction?: (item: ToastStackItem) => void
  /** 有：这一条原地换成它；没有：点了就关掉这一条。 */
  result?: ToastStackResult
}

export type ToastStackItem = {
  id: string
  tone?: Severity
  icon?: ReactNode
  title: ReactNode
  description?: ReactNode
  /** 停多久（毫秒）后自己关；不写取叠放层的 duration，Infinity 不自动消失。 */
  duration?: number
  action?: ToastStackAction
}

export type ToastStackLabels = {
  /** 区域的读屏名（role=region 的 aria-label）。 */
  region: string
  /** 每一条关闭钮的读屏名。 */
  close: string
}

/** 不受控时用 ref 拿到的方法；受控时也能用，结果经 onItemsChange 交回。 */
export type ToastStackHandle = {
  /** 压进一条（成为最前面的）；id 已存在就原地更新；返回 id。超过 max 时最旧的先收。 */
  push: (item: Omit<ToastStackItem, 'id'> & { id?: string }) => string
  dismiss: (id: string) => void
  clear: () => void
}

export type ToastStackProps = {
  /** Controlled list of toasts, oldest first: the last one is the front. 给了它就由调用方持有，变化经 onItemsChange 交回。 */
  items?: ToastStackItem[]
  /** Initial list when uncontrolled; push through the ref afterwards. 不受控的初始条目表。 */
  defaultItems?: ToastStackItem[]
  /** Called with the next list whenever a toast is pushed, dismissed, expires, settles into its result or is trimmed by max. */
  onItemsChange?: (items: ToastStackItem[]) => void
  /** Accessible names (required; the package ships no text): region is the live region's aria-label, close names every close button. */
  labels: ToastStackLabels
  /** Which corner (default bottom-right): at the bottom corners the newest sits on the window edge and older ones peek upward; at the top corners the reverse. */
  position?: ToastPosition
  /** Most toasts kept (default 5); the oldest goes first. 受控时调用方给多了，只画最新的 max 条。 */
  max?: number
  /** Default time on screen in ms (default 5000, Infinity never expires); an item's own duration wins. */
  duration?: number
  /** How long a result state stays after its action button was clicked, in ms (default 2400). */
  resultDuration?: number
  /** Force expanded or collapsed; leave it out to follow the pointer and keyboard focus (true also pauses the timers). */
  expanded?: boolean
  /** Pause every timer from outside, for example while the page is hidden; expanded, hovered and keyboard-focused stacks already pause. */
  paused?: boolean
  /** Render in the document flow instead of fixed to a window corner (docs and screenshots). */
  inline?: boolean
  /** Extra classes for the viewport region. */
  className?: string
  /** Handle with push, dismiss and clear; works when controlled too, the result goes out through onItemsChange. */
  ref?: Ref<ToastStackHandle>
}

const DEFAULT_ICON: Record<Severity, ReactNode> = {
  neutral: undefined,
  ok: <CircleCheck />,
  warn: <TriangleAlert />,
  danger: <CircleAlert />,
}

/** 还没量到高度时的占位（一条标题加一行说明约 59px）。 */
const FALLBACK_HEIGHT = 60
/** 新条从窗口边滑进来的距离。 */
const ENTER_OFFSET = 24
/** 退场时淡出的时长（秒）；滑走的那一条在这段时间里滑出去。 */
const EXIT_SECONDS = 0.28

/** 动作钮：Toast 里的小按钮（sm 档），读屏名就是钮上的字。 */
function ToastAction({ className, ...props }: ComponentProps<typeof Button>) {
  return (
    <Button
      type="button"
      size="sm"
      data-slot="toast-action"
      className={cn('flex-none self-center', className)}
      {...props}
    />
  )
}

type EntryProps = {
  item: ToastStackItem
  /** 按时间的序号（0 最旧），拿来定叠放次序。 */
  index: number
  slot: StackSlot
  toward: 1 | -1
  reduced: boolean
  labels: ToastStackLabels
  /** height 为 null 是这一条卸载了，把量到的高度忘掉。 */
  onHeight: (id: string, height: number | null) => void
  onAction: (id: string) => void
  onDismiss: (id: string) => void
}

function ToastStackEntry({ item, index, slot, toward, reduced, labels, onHeight, onAction, onDismiss }: EntryProps) {
  const tone = item.tone ?? 'neutral'
  const inner = useRef<HTMLDivElement>(null)
  const dragged = useRef(false)
  const x = useMotionValue(0)
  // 拖得越远越淡：跟 Jamie 的「Dismissing toasts」一样，滑出去的过程里跟着变透明。
  const fade = useTransform(x, (value) => 1 - Math.min(Math.abs(value) / 340, 1) * 0.6)

  // 量自然高度：展开的位置、收拢时压成的高度都靠它。先同步量一次（首帧就对），再用 ResizeObserver 跟（文字换行、结果态换内容）。
  useLayoutEffect(() => {
    const el = inner.current
    if (!el) return
    const measure = () => onHeight(item.id, el.offsetHeight)
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => {
      observer.disconnect()
      onHeight(item.id, null)
    }
  }, [item.id, onHeight])

  const release = (_event: unknown, info: PanInfo) => {
    const el = inner.current
    const width = el?.offsetWidth ?? 0
    const dir = swipeDecision({ offset: info.offset.x, velocity: info.velocity.x, width })
    // 点击发生在松手之后：拖过的这一下不当成点了动作钮或关闭钮。
    setTimeout(() => (dragged.current = false), 0)
    if (dir === 0) {
      animate(x, 0, snappy)
      return
    }
    animate(x, dir * (width + 48), snappy)
    onDismiss(item.id)
  }

  // 减弱动效：收拢时后面的条不挪不缩，原地淡掉；展开时才按列表摆开。
  const still = reduced && slot.clamped
  const transition = reduced
    ? { default: { duration: 0 }, opacity: { duration: 0.12 } }
    : {
        y: snappy,
        height: snappy,
        scale: unit(snappy),
        opacity: { duration: 0.18, ease: 'easeOut' as const },
      }

  return (
    <motion.li
      data-slot="toast-stack-item"
      data-toast-id={item.id}
      data-clamped={slot.clamped ? '' : undefined}
      initial={{ opacity: 0, y: still ? 0 : slot.y - toward * ENTER_OFFSET, scale: reduced ? 1 : 0.95 }}
      animate={{
        y: still ? 0 : slot.y,
        scale: reduced ? 1 : slot.scale,
        // 减弱动效：收拢时后面的不缩不挪，直接淡掉，只留最前面一条。
        opacity: reduced && slot.clamped ? 0 : slot.opacity,
        height: slot.height,
      }}
      exit={{ opacity: 0, scale: reduced ? 1 : 0.96, transition: { duration: reduced ? 0.12 : EXIT_SECONDS } }}
      transition={transition}
      style={{ zIndex: index + 1, transformOrigin: toward < 0 ? 'bottom center' : 'top center' }}
      aria-hidden={slot.opacity === 0 ? true : undefined}
      className={cn(
        'absolute inset-x-0 m-0 list-none p-0 data-[clamped]:overflow-hidden',
        toward < 0 ? 'bottom-0' : 'top-0',
        !slot.interactive && 'pointer-events-none',
      )}
      onKeyDown={(event) => {
        if (event.key === 'Escape') onDismiss(item.id)
      }}
    >
      <motion.div
        ref={inner}
        drag={reduced || !slot.interactive ? false : 'x'}
        dragMomentum={false}
        dragElastic={0.6}
        dragConstraints={{ left: 0, right: 0 }}
        onDragStart={() => (dragged.current = true)}
        onDragEnd={release}
        onClickCapture={(event) => {
          if (dragged.current) event.stopPropagation()
        }}
        style={{ x, opacity: reduced ? 1 : fade }}
      >
        <Toast tone={tone} data-testid="toast-stack-toast" data-has-action={item.action ? '' : undefined}>
          <ToastContent>
            <ToastIcon>{item.icon ?? DEFAULT_ICON[tone]}</ToastIcon>
            <ToastText>
              <ToastTitle>{item.title}</ToastTitle>
              {item.description === undefined ? null : <ToastDescription>{item.description}</ToastDescription>}
            </ToastText>
            {item.action ? <ToastAction onClick={() => onAction(item.id)}>{item.action.label}</ToastAction> : null}
            <ToastClose label={labels.close} className="self-center" onClick={() => onDismiss(item.id)} />
          </ToastContent>
        </Toast>
      </motion.div>
    </motion.li>
  )
}

type Clock = { sig: string; left: number; since: number | null; timer: ReturnType<typeof setTimeout> | undefined }

export function ToastStack({
  items,
  defaultItems,
  onItemsChange,
  labels,
  position = 'bottom-right',
  max = 5,
  duration = 5000,
  resultDuration = 2400,
  expanded: expandedProp,
  paused: pausedProp = false,
  inline = false,
  className,
  ref,
}: ToastStackProps) {
  const reduced = useReducedMotion() ?? false
  const [own, setOwn] = useState<ToastStackItem[]>(defaultItems ?? [])
  const controlled = items !== undefined
  const list = controlled ? items : own
  const listRef = useRef(list)
  useEffect(() => {
    listRef.current = list
  }, [list])
  const region = useRef<HTMLDivElement>(null)
  const counter = useRef(0)

  const commit = useCallback(
    (next: ToastStackItem[]) => {
      const kept = next.slice(-Math.max(1, max))
      listRef.current = kept
      if (!controlled) setOwn(kept)
      onItemsChange?.(kept)
    },
    [controlled, max, onItemsChange],
  )

  // 关掉有焦点的一条：焦点先挪到相邻一条的关闭钮，不丢到 body 上。
  const moveFocusFrom = useCallback((id: string) => {
    const root = region.current
    const current = listRef.current
    const at = current.findIndex((item) => item.id === id)
    const li = root?.querySelector(`[data-toast-id="${CSS.escape(id)}"]`)
    if (!root || at < 0 || !li?.contains(document.activeElement)) return
    const next = current[at + 1] ?? current[at - 1]
    if (!next) {
      // 没有相邻的了：主动失焦，让 onBlur 放掉键盘焦点状态（元素被摘掉时浏览器不一定发 blur）。
      if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
      return
    }
    root
      .querySelector<HTMLElement>(`[data-toast-id="${CSS.escape(next.id)}"] [data-slot="toast-close"]`)
      ?.focus({ preventScroll: true })
  }, [])

  const dismiss = useCallback(
    (id: string) => {
      const current = listRef.current
      if (!current.some((item) => item.id === id)) return
      moveFocusFrom(id)
      commit(current.filter((item) => item.id !== id))
    },
    [commit, moveFocusFrom],
  )

  const act = useCallback(
    (id: string) => {
      const item = listRef.current.find((entry) => entry.id === id)
      const action = item?.action
      if (!item || !action) return
      action.onAction?.(item)
      const result = action.result
      if (!result) {
        dismiss(id)
        return
      }
      // 动作钮要消失了：焦点先落到同一条的关闭钮。
      const li = region.current?.querySelector(`[data-toast-id="${CSS.escape(id)}"]`)
      if (li?.contains(document.activeElement))
        li.querySelector<HTMLElement>('[data-slot="toast-close"]')?.focus({ preventScroll: true })
      commit(
        listRef.current.map((entry) =>
          entry.id === id
            ? {
                id,
                tone: result.tone ?? 'ok',
                icon: result.icon,
                title: result.title,
                description: result.description,
                duration: result.duration ?? resultDuration,
              }
            : entry,
        ),
      )
    },
    [commit, dismiss, resultDuration],
  )

  useImperativeHandle(
    ref,
    () => ({
      push: (item) => {
        const id = item.id ?? `toast-stack-${++counter.current}`
        const current = listRef.current
        commit(
          current.some((entry) => entry.id === id)
            ? current.map((entry) => (entry.id === id ? { ...entry, ...item, id } : entry))
            : [...current, { ...item, id }],
        )
        return id
      },
      dismiss,
      clear: () => commit([]),
    }),
    [commit, dismiss],
  )

  // 展开与暂停：指针（不含触屏，触屏的 pointerenter 只是按下）、键盘焦点（:focus-visible）进来就展开；
  // 计时在展开、指针在上面、键盘焦点在条里、外部要求暂停时停，走开后接着剩下的时间（不是从头）。
  // 鼠标点按钮留下的焦点不算：不然点完「撤销」、指针走开了，结果态因为焦点还在关闭钮上永远不收。
  const [hover, setHover] = useState(false)
  const [keyboardFocus, setKeyboardFocus] = useState(false)
  const expanded = expandedProp ?? (hover || keyboardFocus)
  const paused = pausedProp || hover || keyboardFocus || expandedProp === true

  const clocks = useRef(new Map<string, Clock>())
  const dismissRef = useRef(dismiss)
  useEffect(() => {
    dismissRef.current = dismiss
  }, [dismiss])
  useEffect(() => {
    const map = clocks.current
    const now = performance.now()
    const live = new Set(list.map((item) => item.id))
    for (const [id, clock] of map)
      if (!live.has(id)) {
        clearTimeout(clock.timer)
        map.delete(id)
      }
    for (const item of list) {
      const total = item.duration ?? duration
      // 换成结果态（动作钮没了、停留时间变了）要重新计时。
      const sig = `${total}|${item.action ? 1 : 0}`
      let clock = map.get(item.id)
      if (clock && clock.sig !== sig) {
        clearTimeout(clock.timer)
        map.delete(item.id)
        clock = undefined
      }
      if (!clock) {
        clock = { sig, left: total, since: null, timer: undefined }
        map.set(item.id, clock)
      }
      if (!Number.isFinite(clock.left)) continue
      if (paused && clock.since !== null) {
        clearTimeout(clock.timer)
        clock.left -= now - clock.since
        clock.since = null
      } else if (!paused && clock.since === null) {
        clock.since = now
        const id = item.id
        clock.timer = setTimeout(() => dismissRef.current(id), Math.max(0, clock.left))
      }
    }
  }, [list, paused, duration])
  useEffect(
    () => () => {
      for (const clock of clocks.current.values()) clearTimeout(clock.timer)
      clocks.current.clear()
    },
    [],
  )

  // 量到的高度。
  const [heights, setHeights] = useState<Record<string, number>>({})
  const onHeight = useCallback(
    (id: string, height: number | null) =>
      setHeights((prev) => {
        if (height === null) {
          if (!(id in prev)) return prev
          const { [id]: _gone, ...rest } = prev
          return rest
        }
        return prev[id] === height ? prev : { ...prev, [id]: height }
      }),
    [],
  )

  const isTop = position.startsWith('top')
  const toward: 1 | -1 = isTop ? 1 : -1
  // 受控时调用方给多了：只画最新的 max 条，更旧的不画（它们的计时照走，到点由 onItemsChange 收掉）。
  const shown = list.slice(-Math.max(1, max))
  const layout = stackLayout({
    heights: shown.map((item) => heights[item.id] ?? FALLBACK_HEIGHT),
    expanded,
    toward,
  })
  // DOM 次序跟视觉次序一致（Tab 从上往下走）：下面的角最新的在最下，上面的角最新的在最上。
  const order = shown.map((_item, index) => index)
  if (isTop) order.reverse()

  return (
    <ToastViewport
      ref={region}
      position={position}
      aria-label={labels.region}
      data-expanded={expanded ? '' : undefined}
      className={cn(inline && 'relative inset-auto', className)}
      onPointerEnter={(event) => {
        if (event.pointerType !== 'touch') setHover(true)
      }}
      onPointerLeave={() => setHover(false)}
      onFocus={(event) => {
        let visible = false
        try {
          visible = event.target.matches(':focus-visible')
        } catch {
          visible = true
        }
        if (visible) setKeyboardFocus(true)
      }}
      onBlur={(event) => {
        if (event.currentTarget.contains(event.relatedTarget)) return
        setKeyboardFocus(false)
      }}
    >
      <motion.ul
        role="list"
        data-slot="toast-stack"
        className="relative m-0 w-full list-none p-0"
        initial={false}
        animate={{ height: layout.height }}
        transition={reduced ? { duration: 0 } : snappy}
      >
        <AnimatePresence initial={false}>
          {order.map((index) => {
            const item = shown[index]!
            return (
              <ToastStackEntry
                key={item.id}
                item={item}
                index={index}
                slot={layout.slots[index]!}
                toward={toward}
                reduced={reduced}
                labels={labels}
                onHeight={onHeight}
                onAction={act}
                onDismiss={dismiss}
              />
            )
          })}
        </AnimatePresence>
      </motion.ul>
    </ToastViewport>
  )
}

export { ToastAction }
