// SPDX-License-Identifier: MIT
import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from 'react'
import { cn } from '../lib/cn.ts'
import { clampSplitRatio, snapSplitRatio, splitKeyRatio } from './splitter-model.ts'

// 分割线（#1901，原应用 workspace/WorkspaceCanvas 的 SplitBranch 里那条线）：role=separator，一条线分开它前后两个兄弟。
// 键盘与 aria-value* 照 WAI-ARIA APG 的 Window Splitter 模式（2026-10-22 读自 w3.org/WAI/ARIA/apg/patterns/windowsplitter/）；
// APG 里 Enter 是折叠 / 还原一侧，这里没有折叠，改作恢复默认位置（等价于双击）。
// 只管线本身：量父元素的宽高换算比例，拖动中通过 onPreview 把比例交给宿主改布局（宿主直接写样式，不重渲染），松手才 onChange 提交。
// 手感照组件卡 Splitter：拖动零延迟、无弹簧追赶；松手不改用户选的精确位置；双击复位；方向键 8px、Shift 32px。
// 没做的：卡里的越界橡皮筋与「松手 settle 弹回」（现在越界直接夹在边界上，应用里的行为也是这样）；留作调手感时再加。
// 评估过 react-resizable-panels 4.22（MIT）没用它：它是自己排版的 Group / Panel / Separator，大小按百分比，键盘步长也是百分比；
// 工作区的分割树是嵌套二叉的 grid（fr 轨道）、px 步长、1/3 1/2 2/3 吸附、两边最小尺寸来自子树，套进去要把整个 WorkspaceCanvas 重写，且丢掉这些行为。

export type SplitterProps = {
  /** 分的是哪个方向：row = 左右两块（竖线，拖 X），column = 上下两块（横线，拖 Y）。 */
  axis: 'row' | 'column'
  /** 第一块占可用长度的比例，0 到 1。 */
  ratio: number
  /** 双击与 Enter 回到的比例。 */
  defaultRatio?: number
  /** 两边最小尺寸（px）；比例会被夹在它们之间。 */
  minFirst?: number
  minSecond?: number
  /** 吸附点（比例）。默认 1/3、1/2、2/3；传空数组关掉吸附。 */
  snapPoints?: readonly number[]
  /** 吸附半径（px）：离吸附点这么近就落上去。默认 6，0 关掉。 */
  snapThresholdPx?: number
  /** 方向键一步（px）与 Shift 加速的一步。默认 8 与 32。 */
  keyStepPx?: number
  fastStepPx?: number
  /** 拖动中每次移动调用：宿主据此改布局（直接写样式，不要 setState）；Splitter 自己同步 aria 与线的位置。 */
  onPreview?: (ratio: number) => void
  /** 提交：松手、方向键、双击、Enter。 */
  onChange: (ratio: number) => void
  /** 开始 / 结束拖动。 */
  onDraggingChange?: (dragging: boolean) => void
  /** 线的名字（读屏念）。 */
  label: string
  /** 读屏念的值（aria-valuetext）：只念「50」不知道是哪一边，说明第一块占几成。 */
  valueText?: (ratio: number) => string
  className?: string
  /** 中央小把手的类名（宿主要挂自己的旧类名时用）。 */
  gripClassName?: string
  style?: CSSProperties
}

const percent = (ratio: number) => Math.round(ratio * 100)

export function Splitter({
  axis,
  ratio: requested,
  defaultRatio = 0.5,
  minFirst = 0,
  minSecond = 0,
  snapPoints,
  snapThresholdPx = 6,
  keyStepPx = 8,
  fastStepPx = 32,
  onPreview,
  onChange,
  onDraggingChange,
  label,
  valueText,
  className,
  gripClassName,
  style,
}: SplitterProps) {
  const own = useRef<HTMLDivElement>(null)
  const drag = useRef<{ pointerId: number } | null>(null)
  const [span, setSpan] = useState(0)
  const [dragging, setDragging] = useState(false)
  const row = axis === 'row'
  const bound = (value: number) => (span > 0 ? clampSplitRatio(value, span, minFirst, minSecond) : value)
  const ratio = bound(requested)

  // 可用长度 = 父元素在这个方向上的长度，扣掉线自己占的轨道。
  const measure = () => {
    const line = own.current
    const parent = line?.parentElement
    if (!line || !parent) return null
    const box = parent.getBoundingClientRect()
    const gap = row ? line.offsetWidth : line.offsetHeight
    return { box, extent: (row ? box.width : box.height) - gap, gap }
  }
  useEffect(() => {
    const parent = own.current?.parentElement
    if (!parent) return
    const observer = new ResizeObserver(() => setSpan(measure()?.extent ?? 0))
    observer.observe(parent)
    return () => observer.disconnect()
    // measure 只读 ref 与 row
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [row])

  const show = (value: number) => {
    const line = own.current
    if (!line) return
    line.setAttribute('aria-valuenow', String(percent(value)))
    if (valueText) line.setAttribute('aria-valuetext', valueText(value))
    onPreview?.(value)
  }
  const fromPointer = (event: PointerEvent<HTMLDivElement>) => {
    const size = measure()
    if (!size) return ratio
    const point = (row ? event.clientX - size.box.left : event.clientY - size.box.top) - size.gap / 2
    const snapped = snapSplitRatio(point / size.extent, size.extent, snapThresholdPx, snapPoints)
    return clampSplitRatio(snapped, size.extent, minFirst, minSecond)
  }
  const stop = (value: number) => {
    if (!drag.current) return
    drag.current = null
    setDragging(false)
    onDraggingChange?.(false)
    show(value)
  }
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const next = splitKeyRatio(event.key, {
      axis,
      ratio,
      span,
      shift: event.shiftKey,
      stepPx: keyStepPx,
      fastStepPx,
      defaultRatio,
    })
    if (next === null) return
    event.preventDefault()
    onChange(bound(next))
  }

  return (
    <div
      ref={own}
      role="separator"
      tabIndex={0}
      data-slot="splitter"
      data-axis={axis}
      data-dragging={dragging ? '' : undefined}
      className={cn('k-splitter', className)}
      style={style}
      aria-label={label}
      aria-orientation={row ? 'vertical' : 'horizontal'}
      aria-valuemin={percent(bound(0))}
      aria-valuemax={percent(bound(1))}
      aria-valuenow={percent(ratio)}
      aria-valuetext={valueText?.(ratio)}
      onPointerDown={(event) => {
        if (event.button !== 0) return
        event.preventDefault()
        event.currentTarget.focus()
        event.currentTarget.setPointerCapture(event.pointerId)
        drag.current = { pointerId: event.pointerId }
        setDragging(true)
        onDraggingChange?.(true)
      }}
      onPointerMove={(event) => {
        if (drag.current?.pointerId !== event.pointerId) return
        show(fromPointer(event))
      }}
      onPointerUp={(event) => {
        if (drag.current?.pointerId !== event.pointerId) return
        const next = fromPointer(event)
        event.currentTarget.releasePointerCapture(event.pointerId)
        stop(next)
        onChange(next)
      }}
      onLostPointerCapture={() => stop(ratio)}
      onPointerCancel={() => stop(ratio)}
      onDoubleClick={() => onChange(bound(defaultRatio))}
      onKeyDown={onKeyDown}
    >
      <span className={cn('k-splitter-grip', gripClassName)} />
    </div>
  )
}
