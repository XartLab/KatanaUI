// SPDX-License-Identifier: MIT
/**
 * Pointer drag of DataGrid rows: threshold, pointer capture, drop marker spot, edge auto-scroll, Escape to cancel.
 * DataGrid 的拖行（#77 G7）。做法照 modern-web-guidance「drag-and-drop」（2026-11-18 读）：只认主键、只跟起手那一根指针、
 * 抓住指针（setPointerCapture）、落点按布局算（行的中线）不按 event.target、拖的时候不挪别的行只画一道落点线、
 * 落回原处不算、Esc 取消、靠近上下边自动滚（速度随伸进边区的深度、按帧时间算）。
 * 跟指南不同的地方：整行可拖（照 TradingView 自选表，没有把手），行里的按钮、链接、输入框上按下不起拖；触屏不起拖（会抢走滚动），
 * 触屏用右键菜单的上移 / 下移。
 */
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
} from 'react'

/** 按下后挪多少像素才算拖（小于它是点击）。 */
export const DRAG_THRESHOLD = 4
/** 自动滚的最快速度（像素 / 毫秒）。 */
const MAX_SPEED = 1.2

export type DropSpot = { before: string | null; y: number }

export type RowDrag = { moving: readonly string[]; spot: DropSpot | null }

type Options = {
  enabled: boolean
  scroller: RefObject<HTMLDivElement | null>
  rowsBox: RefObject<HTMLDivElement | null>
  /** 行区里纵坐标 y 对应的落点。 */
  spotAt: (y: number) => DropSpot
  /** 按下的这一行要拖哪些行（选中的行里按下就是整组选中的行）。 */
  pickMoving: (id: string) => string[]
  /** 落在这里等于没挪。 */
  isNoop: (moving: readonly string[], before: string | null) => boolean
  onDrop: (moving: readonly string[], before: string | null) => void
  onCancel: () => void
  /** 边区的高度（一般是行高的 1.5 倍），不超过滚动区的三分之一。 */
  edge: number
}

const NO_DRAG = 'button, a, input, select, textarea, [data-no-drag], [role="separator"]'

export function useRowDrag(options: Options) {
  const [drag, setDrag] = useState<RowDrag | null>(null)
  const live = useRef(options)
  // 拖动期间的监听器读最新的 props（行序、选择会跟着重画变）。
  useLayoutEffect(() => {
    live.current = options
  })
  const stop = useRef<(() => void) | null>(null)
  const clicked = useRef(false)

  useEffect(() => () => stop.current?.(), [])

  const onPointerDown = (event: ReactPointerEvent<HTMLElement>, id: string) => {
    const o = live.current
    if (!o.enabled || event.button !== 0 || event.pointerType === 'touch') return
    if ((event.target as HTMLElement).closest(NO_DRAG)) return
    if (event.shiftKey || event.ctrlKey || event.metaKey || event.altKey) return
    stop.current?.()
    const pointerId = event.pointerId
    const startY = event.clientY
    let lastY = startY
    let moving: string[] | null = null
    let spot: DropSpot | null = null
    let frame = 0
    let lastTime = 0

    const locate = () => {
      const box = live.current.rowsBox.current
      if (!box || !moving) return
      const rect = box.getBoundingClientRect()
      const y = Math.max(0, Math.min(rect.height, lastY - rect.top))
      const next = live.current.spotAt(y)
      spot = live.current.isNoop(moving, next.before) ? null : next
      setDrag({ moving, spot })
    }
    const tick = (time: number) => {
      const scroller = live.current.scroller.current
      if (scroller && lastTime) {
        const rect = scroller.getBoundingClientRect()
        const zone = Math.min(live.current.edge, rect.height / 3)
        const into =
          lastY < rect.top + zone
            ? -(rect.top + zone - lastY)
            : lastY > rect.bottom - zone
              ? lastY - (rect.bottom - zone)
              : 0
        if (into !== 0) {
          const depth = Math.min(1.5, Math.abs(into) / zone)
          const before = scroller.scrollTop
          scroller.scrollTop += Math.sign(into) * depth * MAX_SPEED * (time - lastTime)
          if (scroller.scrollTop !== before) locate()
        }
      }
      lastTime = time
      frame = requestAnimationFrame(tick)
    }
    const end = () => {
      cancelAnimationFrame(frame)
      document.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerup', onUp)
      document.removeEventListener('pointercancel', onCancelPointer)
      window.removeEventListener('keydown', onKey, true)
      const scroller = live.current.scroller.current
      if (scroller?.hasPointerCapture(pointerId)) scroller.releasePointerCapture(pointerId)
      stop.current = null
      setDrag(null)
    }
    const onMove = (e: PointerEvent) => {
      if (e.pointerId !== pointerId) return
      lastY = e.clientY
      if (!moving) {
        if (Math.abs(lastY - startY) < DRAG_THRESHOLD) return
        moving = live.current.pickMoving(id)
        live.current.scroller.current?.setPointerCapture(pointerId)
        frame = requestAnimationFrame(tick)
      }
      e.preventDefault()
      locate()
    }
    const onUp = (e: PointerEvent) => {
      if (e.pointerId !== pointerId) return
      if (moving) {
        clicked.current = true
        setTimeout(() => (clicked.current = false), 0)
        if (spot) live.current.onDrop(moving, spot.before)
      }
      end()
    }
    const onCancelPointer = (e: PointerEvent) => {
      if (e.pointerId === pointerId) end()
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || !moving) return
      e.preventDefault()
      e.stopPropagation()
      end()
      live.current.onCancel()
    }
    document.addEventListener('pointermove', onMove)
    document.addEventListener('pointerup', onUp)
    document.addEventListener('pointercancel', onCancelPointer)
    window.addEventListener('keydown', onKey, true)
    stop.current = end
  }

  /** 拖完松手后浏览器还会补一次 click：这一次不算点行。 */
  const swallowClick = () => clicked.current

  return { drag, onPointerDown, swallowClick }
}
