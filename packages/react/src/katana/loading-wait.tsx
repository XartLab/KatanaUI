// SPDX-License-Identifier: MIT
import { useEffectEvent, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { LOADING_TIMING, skeletonRows, startLoadingGate, type LoadingGate, type LoadingPhase } from './loading-gate.ts'
import { LoadingView, type LoadingLabels } from './loading-view.tsx'

// 搬自 src/ui/LoadingWait.tsx（#1860），文字改由 labels 给（G3 前叫 texts）。
// 「在等」的那一段：挂上去就开始计时，500ms 之后才画骨架，之前什么也不画；2s 起 caption 改说「仍在加载」，10s 转成琥珀条加「重试」
// （states.md 加载态与错误态，#1234；画法在 LoadingView）。卸载时（内容到了）把「骨架出没出过」交给 onSettled，由外面的 Loading / LoadingBoundary 决定内容要不要揭示：
// 所以错误态显示期间数据晚到了，照样走揭示，不丢。这里不管取数：重试只是调 onRetry，由外面换 key 重建，计时也就从头来。
// 挂上时先交一次 false，清掉上一轮的揭示（Suspense 会把已出现过的内容留着再藏起来）。
// 最短停留（#251 批 A，kubai 017）：数据到了不立刻摘掉这一段——外面把 ready 置真，这里问闸门：骨架没出过就立刻 onReleased，出过但没留够 minShown 就等满再 onReleased，
// 外面这时才换成内容。等的期间 ready 又变回假（又去取数了），取消，骨架照旧。

/** 读一行的高度：当前密度的表格行高 token（--row-base）；读不出来用 28。 */
const rowHeightOf = (node: HTMLElement) => parseFloat(getComputedStyle(node).getPropertyValue('--row-base')) || 28

export function LoadingWait({
  labels,
  label,
  what,
  source,
  lines,
  fill = false,
  header,
  delay = LOADING_TIMING.delay,
  minShown = LOADING_TIMING.minShown,
  ready = false,
  onRetry,
  onSettled,
  onReleased,
}: {
  labels: LoadingLabels
  label?: string
  /** 在等什么（caption 的「加载 X」）；不给写「内容」。 */
  what?: string
  /** 数据从哪来（连接显示名）；拿不到就不写这一段。 */
  source?: string | null
  /** 不知道可见高度时画几行（嵌在流里的、第一次量到之前）。 */
  lines: number
  /** 撑满父级：骨架行数按容器高度除以行高量出来。 */
  fill?: boolean
  /** 真表头：骨架只占它下面的行区。 */
  header?: ReactNode
  delay?: number
  /** 骨架出了以后至少留多久（毫秒），默认 500。 */
  minShown?: number
  /** 数据到了：开始交出（骨架出过且没留够就等满再 onReleased）。 */
  ready?: boolean
  onRetry?: () => void
  onSettled: (shown: boolean) => void
  /** 可以摘掉这一段、换成内容了（ready 之后，骨架留够了或没出过）。 */
  onReleased?: () => void
}) {
  const [phase, setPhase] = useState<LoadingPhase | null>(null)
  const [area, setArea] = useState<HTMLElement | null>(null)
  const [measured, setMeasured] = useState<{ height: number; row: number } | null>(null)
  const settled = useEffectEvent(onSettled)
  const released = useEffectEvent(() => onReleased?.())
  const gateRef = useRef<LoadingGate | null>(null)
  useLayoutEffect(() => {
    settled(false)
    const gate = startLoadingGate(setPhase, { ...LOADING_TIMING, delay, minShown })
    gateRef.current = gate
    return () => {
      gateRef.current = null
      settled(gate.stop())
    }
  }, [delay, minShown])
  useLayoutEffect(() => {
    if (!ready) return
    return gateRef.current?.release(released)
  }, [ready])
  useLayoutEffect(() => {
    if (!fill || !area) return
    const observer = new ResizeObserver(() => {
      setMeasured({ height: area.clientHeight, row: rowHeightOf(area) })
    })
    observer.observe(area)
    return () => {
      observer.disconnect()
    }
  }, [fill, area])

  return (
    <LoadingView
      phase={phase}
      labels={labels}
      label={label}
      what={what}
      source={source}
      rows={fill && measured ? skeletonRows(measured.height, measured.row, lines) : lines}
      measured={fill && measured !== null}
      fill={fill}
      header={header}
      areaRef={setArea}
      onRetry={onRetry}
    />
  )
}
