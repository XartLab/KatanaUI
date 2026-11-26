// SPDX-License-Identifier: MIT
// 悬浮窗：把任意子树放进一个置顶的小窗，用户可以边看别的页面边操作（OKX 下单面板右上角的「在悬浮窗中交易」：无需离开当前网页，即可下单并追踪仓位，2026-11-26 在用户的 Chrome 里看的）。实现原创。
// 两种窗：浏览器有 Document Picture-in-Picture（Chrome / Edge 116+）时开真窗口，置顶、能拖到别的应用上方；没有时退成页内的可拖浮层（标题栏拖动、方向键移动、关闭钮）。
// 开 PiP 失败（没有用户刚操作过、已经有一个窗）也退到页内浮层。关窗（用户关 PiP 窗口、点浮层的关闭钮、浮层里按 Esc）回调 onClose；宿主把 open 设回 false，内容回到原处。
// 内容不重新挂载：子树始终渲染进同一个 host 元素（createPortal），换窗只是把这个元素搬到别的容器里，所以输入框里写了一半的字、选中的页签、滚动位置都在。
// 小窗里的样式：开窗时复制当前文档的样式表、根元素的 data-theme 等属性与正文的底色字色（./pip-window.ts），主题切换时再同步属性；开窗之后新加的样式表不会跟过去。
// 服务端渲染与首帧：host 元素在挂载后才创建，所以服务端输出里只有空位与（open 时的）占位文字，没有子树。
// 页内浮层用 popover="manual" 进浏览器的顶层（盖得住对话框与别的浮层），不靠 z-index；位置、拖动、方向键的夹取在 floating-window-model.ts。
// 同一页只开一个：PiP 一次只能有一个窗，第二个 FloatingWindow 要开时那次请求被拒，退到页内浮层。
import { X } from 'lucide-react'
import {
  useEffect,
  useEffectEvent,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import { cn } from '../../lib/cn.ts'
import { focusRingInset } from '../../lib/focus.ts'
import { Button } from '../../primitives/button.tsx'
import { arrowDelta, clampPosition, type FloatPosition } from './floating-window-model.ts'
import { copyDocumentStyles, copyRootAttributes, pipApi } from './pip-window.ts'

export type FloatingWindowLabels = {
  /** Accessible name of the close button of the in-page floating layer. */
  close: string
  /** Accessible name of the title bar, which drags and moves with the arrow keys. */
  move: string
}

export type FloatingWindowProps = {
  /** Whether the content is in the small window. Controlled: the host sets it back to false in onClose. */
  open: boolean
  /** Called when the user closes the window (closes the picture-in-picture window, clicks the close button, presses Esc). */
  onClose?: () => void
  /** The subtree. It is rendered in place while closed and moves into the window while open, without remounting. */
  children: ReactNode
  /** Title of the window: the title bar of the in-page layer and its accessible name. */
  title: string
  /** Drawn in place of the subtree while it is in the window (a line saying where it went, with a button to bring it back). */
  placeholder?: ReactNode
  /** Width of the window in pixels. */
  width?: number
  /** Height of the window in pixels. */
  height?: number
  /** Use only the in-page layer even when the browser has picture-in-picture (embedded pages, tests). */
  inPageOnly?: boolean
  /** Accessible names. */
  labels: FloatingWindowLabels
  /** Extra class name on the root. */
  className?: string
}

/** Which kind of window the subtree is in: in place, the picture-in-picture window or the in-page layer. */
export type FloatingWindowMode = 'docked' | 'pip' | 'overlay'

/** Whether the browser can open a real picture-in-picture window now (read when called, so tests can inject or delete the API). */
export function isFloatingWindowSupported(): boolean {
  return pipApi() !== undefined
}

/** State and props for a FloatingWindow: `<FloatingWindow {...floating.props} …>`, a button calling `floating.toggle`. */
export function useFloatingWindow(initialOpen = false) {
  const [open, setOpen] = useState(initialOpen)
  return {
    open,
    /** Whether the browser has picture-in-picture (false: the in-page layer is used). */
    supported: isFloatingWindowSupported(),
    show: () => setOpen(true),
    hide: () => setOpen(false),
    toggle: () => setOpen((value) => !value),
    props: { open, onClose: () => setOpen(false) },
  }
}

/** Floating window: moves a subtree into a top-most small window (real picture-in-picture where available, a draggable in-page layer elsewhere). */
export function FloatingWindow({
  open,
  onClose,
  children,
  title,
  placeholder,
  width = 380,
  height = 560,
  inPageOnly = false,
  labels,
  className,
}: FloatingWindowProps) {
  // 子树的家：一个一直在的 div，换窗只是把它搬走。挂载后才有（服务端没有 document）。
  const [host, setHost] = useState<HTMLElement | null>(null)
  const [slot, setSlot] = useState<HTMLElement | null>(null)
  const [body, setBody] = useState<HTMLElement | null>(null)
  const [pip, setPip] = useState<Window | null>(null)
  const [failed, setFailed] = useState(false)

  useLayoutEffect(() => {
    const element = document.createElement('div')
    element.dataset.slot = 'floating-host'
    element.style.display = 'contents'
    setHost(element)
  }, [])

  const api = open && !inPageOnly ? pipApi() : undefined
  const mode: FloatingWindowMode = !open ? 'docked' : pip ? 'pip' : !api || failed ? 'overlay' : 'docked'

  const close = useEffectEvent(() => onClose?.())

  // 开 PiP：open 变真时请求；关窗（open 变假、卸载）时关掉。用户自己关窗走 pagehide → onClose，关的时候先摘掉监听，免得程序关窗也回调。
  useEffect(() => {
    if (!open || inPageOnly) return
    const request = pipApi()?.requestWindow({ width, height })
    if (!request) return
    let cancelled = false
    let opened: Window | null = null
    const hidden = () => close()
    request.then(
      (win) => {
        if (cancelled) {
          win.close()
          return
        }
        opened = win
        win.document.title = title
        copyDocumentStyles(document, win.document)
        win.addEventListener('pagehide', hidden)
        setPip(win)
      },
      () => {
        if (!cancelled) setFailed(true)
      },
    )
    return () => {
      cancelled = true
      if (opened) {
        opened.removeEventListener('pagehide', hidden)
        opened.close()
      }
      setPip(null)
      setFailed(false)
    }
    // 宽高与标题只在开窗那一刻读：窗开着时改它们不重开。
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [open, inPageOnly])

  // PiP 窗开着时，主文档根元素上的主题属性变了（切 Graphite / Console）就同步过去。
  useEffect(() => {
    if (!pip) return
    const watch = new MutationObserver(() => copyRootAttributes(document, pip.document))
    watch.observe(document.documentElement, { attributes: true })
    return () => watch.disconnect()
  }, [pip])

  // 把 host 搬到当前窗的容器里。
  const target = mode === 'pip' ? pip!.document.body : mode === 'overlay' ? body : slot
  useLayoutEffect(() => {
    if (host && target && host.parentNode !== target) target.append(host)
  }, [host, target])

  return (
    <div data-slot="floating-window" data-mode={mode} className={cn('k-float-root', className)}>
      <div ref={setSlot} className="k-float-slot" />
      {mode === 'docked' ? null : placeholder}
      {mode === 'overlay' ? (
        <FloatLayer
          title={title}
          width={width}
          height={height}
          labels={labels}
          onClose={() => close()}
          bodyRef={setBody}
        />
      ) : null}
      {host ? createPortal(children, host) : null}
    </div>
  )
}

/** 页内浮层：顶层的 popover，标题栏拖动或方向键移动，右上角关闭钮，Esc 关。 */
function FloatLayer({
  title,
  width,
  height,
  labels,
  onClose,
  bodyRef,
}: {
  title: string
  width: number
  height: number
  labels: FloatingWindowLabels
  onClose: () => void
  bodyRef: (element: HTMLElement | null) => void
}) {
  const panel = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState<FloatPosition | null>(null)
  const drag = useRef<{ dx: number; dy: number } | null>(null)

  // 进浏览器顶层：盖在对话框与别的浮层上面；卸载时 popover 随元素一起走。
  useLayoutEffect(() => {
    const element = panel.current
    if (element && !element.matches(':popover-open')) element.showPopover?.()
  }, [])

  const place = (next: FloatPosition) => {
    const element = panel.current
    if (!element) return
    setPosition(
      clampPosition(
        next,
        { width: element.offsetWidth, height: element.offsetHeight },
        { width: window.innerWidth, height: window.innerHeight },
      ),
    )
  }
  const rect = () => panel.current?.getBoundingClientRect()
  const start = (event: PointerEvent<HTMLElement>) => {
    const box = rect()
    if (!box || event.button !== 0) return
    drag.current = { dx: event.clientX - box.left, dy: event.clientY - box.top }
    event.currentTarget.setPointerCapture(event.pointerId)
  }
  const move = (event: PointerEvent<HTMLElement>) => {
    if (drag.current) place({ left: event.clientX - drag.current.dx, top: event.clientY - drag.current.dy })
  }
  const end = () => {
    drag.current = null
  }
  const keys = (event: KeyboardEvent<HTMLElement>) => {
    const delta = arrowDelta(event.key, event.shiftKey)
    const box = rect()
    if (!delta || !box) return
    event.preventDefault()
    place({ left: box.left + delta.dx, top: box.top + delta.dy })
  }

  return (
    <div
      ref={panel}
      popover="manual"
      role="dialog"
      aria-label={title}
      data-slot="floating-layer"
      className="k-float-layer"
      style={{
        width,
        height,
        ...(position ? { left: position.left, top: position.top, right: 'auto', bottom: 'auto' } : null),
      }}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          event.stopPropagation()
          onClose()
        }
      }}
    >
      <header className="k-float-bar">
        <button
          type="button"
          data-slot="floating-handle"
          className={cn('k-float-handle', focusRingInset)}
          aria-label={labels.move}
          onPointerDown={start}
          onPointerMove={move}
          onPointerUp={end}
          onPointerCancel={end}
          onKeyDown={keys}
        >
          {title}
        </button>
        <Button variant="icon" size="icon" aria-label={labels.close} data-slot="floating-close" onClick={onClose}>
          <X aria-hidden="true" />
        </Button>
      </header>
      <div ref={bodyRef} className="k-float-body" />
    </div>
  )
}
