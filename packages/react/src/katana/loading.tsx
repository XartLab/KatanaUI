// SPDX-License-Identifier: MIT
/**
 * The single loading entry: waits on data (pending), on a Suspense promise (no pending), or pins one phase for docs and tests (phase).
 * 加载态的唯一入口（G3，体检 §1「加载五件、texts 与别处 labels 不一致」）：
 * - 给 pending：等数据。pending 为真时 children 不挂载，500ms 后还没到才出骨架；到了以后，骨架出过的内容从 2px 模糊揭示到清晰，没出过的直接出现。
 * - 不给 pending：当 Suspense 边界用（原 LoadingBoundary），等 React.lazy 或 use() 的 promise；延迟、2s / 10s 两段与揭示是同一套。
 * - 给 phase：钉在某一段（loading / slow / timeout）直接画，不计时、不挂 children；文档站、测试与截图用（原来要直接用 LoadingView）。
 * 文字全在 labels（原 texts，留一个版本作兼容）。fill：内容要撑满父级（面板主体）时给，骨架行数按容器高度量；嵌在流里的用 lines。
 * what / source：caption「加载 <内容> · <来源>」的两段（来源没有就省）；header：已经知道的真表头，骨架只占它下面。
 * 等了 2s 说「仍在加载」，10s 转琥珀条；给了 onRetry 条上才有「重试」。Loading 只管显示，不管取数，也不会中止它：晚到的数据照样替换掉错误态。
 * 搬自 src/ui/Loading.tsx 与 LoadingBoundary.tsx（#1860）。
 */
import { Suspense, useState, type ReactNode } from 'react'
import type { LoadingPhase } from './loading-gate.ts'
import { LoadingView, type LoadingLabels } from './loading-view.tsx'
import { LoadingWait } from './loading-wait.tsx'

const contentClass = (fill: boolean, revealed: boolean) =>
  `k-loading-content${fill ? ' is-fill' : ''}${revealed ? ' is-reveal' : ''}`

export type LoadingProps = {
  /** All the text (the package ships none); required unless the deprecated texts is given. */
  labels?: LoadingLabels
  /**
   * Old name kept for one release.
   * @deprecated Use labels.
   */
  texts?: LoadingLabels
  /**
   * Whether we are waiting for data. Omit it to use Loading as a Suspense boundary (React.lazy, use()).
   * 在等数据：给了就按它；不给就是 Suspense 边界（等的是代码或 promise，没有来源）。
   */
  pending?: boolean
  /**
   * Pin one phase and draw it at once, without timers and without mounting children (docs, tests, screenshots).
   * 钉在某一段直接画：不计时、不挂 children。
   */
  phase?: LoadingPhase
  /**
   * Accessible name of the skeleton; defaults to labels.skeleton.
   * 读屏读的话；调用方有更具体的就给（「正在载入分析组件」）。
   */
  label?: string
  /** What is loading, shown in the caption "loading <what> · <source>". */
  what?: string
  /** Where it loads from, the second part of the caption; omitted when absent (and always in Suspense mode). */
  source?: string | null
  /** How many lines to draw when the visible height is unknown. */
  lines?: number
  /** Fill the parent; the line count is measured from the container height. */
  fill?: boolean
  /** The real header when it is already known; the skeleton only covers what is below it. */
  header?: ReactNode
  /** When given, the amber bar after 10 seconds offers a retry button. */
  onRetry?: () => void
  /** The content shown once loading is done. */
  children?: ReactNode
}

export function Loading({
  labels: given,
  texts,
  pending,
  phase,
  label,
  what,
  source,
  lines = 3,
  fill = false,
  header,
  onRetry,
  children,
}: LoadingProps) {
  const [revealed, setRevealed] = useState(false)
  const labels = (given ?? texts)!
  if (phase !== undefined)
    return (
      <LoadingView
        phase={phase}
        labels={labels}
        label={label}
        what={what}
        source={source}
        rows={lines}
        measured={false}
        fill={fill}
        header={header}
        onRetry={onRetry}
      />
    )
  const wait = (withSource: boolean) => (
    <LoadingWait
      labels={labels}
      label={label}
      what={what}
      source={withSource ? source : undefined}
      lines={lines}
      fill={fill}
      header={withSource ? header : undefined}
      onRetry={onRetry}
      onSettled={setRevealed}
    />
  )
  if (pending === undefined)
    // Suspense 的写法：fallback 显示了多久、出没出过骨架，都由 LoadingWait 判断；等的是代码不是数据，所以没有来源与表头，重试由外面换 key 重建。
    return (
      <Suspense fallback={wait(false)}>
        <div className={contentClass(fill, revealed)}>{children}</div>
      </Suspense>
    )
  if (pending) return wait(true)
  return <div className={contentClass(fill, revealed)}>{children}</div>
}

/**
 * @deprecated Use Loading without pending: it is the same Suspense boundary.
 * 旧的 Suspense 写法，G3 起并进 Loading（不给 pending 就是它），留一个版本作兼容。
 */
export function LoadingBoundary(props: Omit<LoadingProps, 'pending' | 'phase' | 'source' | 'header'>) {
  return <Loading {...props} />
}
