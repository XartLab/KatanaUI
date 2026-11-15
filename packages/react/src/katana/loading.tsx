// SPDX-License-Identifier: MIT
import { Suspense, useState, type ReactNode } from 'react'
import { LoadingWait } from './loading-wait.tsx'
import type { LoadingTexts } from './loading-view.tsx'

// 搬自 src/ui/Loading.tsx 与 LoadingBoundary.tsx（#1860）：文字改由 texts 给（见 LoadingTexts），其余没改。

const contentClass = (fill: boolean, revealed: boolean) =>
  `k-loading-content${fill ? ' is-fill' : ''}${revealed ? ' is-reveal' : ''}`

/**
 * 包住「在等数据的那一块」：pending 为真时先什么也不画，500ms 后还没到才出骨架；到了以后，骨架出过的内容从 2px 模糊揭示到清晰，
 * 没出过的直接出现。pending 为真时 children 不挂载（它只在数据到了才有意义）。
 * fill：内容要撑满父级（面板主体）时给；表格这类嵌在流里的不用。撑满时骨架行数按容器高度量，嵌在流里的用 lines。
 * what / source：caption「加载 <内容> · <来源>」的两段（来源没有就省）；header：已经知道的真表头，骨架只占它下面。
 * 等了 2s 说「仍在加载」，10s 转琥珀条；给了 onRetry 条上才有「重试」。Loading 只管显示，不管取数，也不会中止它：晚到的数据照样替换掉错误态。
 * 给 React.lazy / Suspense 用的写法见 LoadingBoundary。
 */
export function Loading({
  texts,
  pending,
  label,
  what,
  source,
  lines = 3,
  fill = false,
  header,
  onRetry,
  children,
}: {
  /** All the text (the package ships none). */
  texts: LoadingTexts
  /** Whether we are waiting. */
  pending: boolean
  /**
   * Accessible name of the skeleton; defaults to texts.skeleton.
   * 读屏读的话；调用方有更具体的就给（「正在载入分析组件」）。
   */
  label?: string
  /** What is loading, shown in the caption "loading <what> · <source>". */
  what?: string
  /** Where it loads from, the second part of the caption; omitted when absent. */
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
  children: ReactNode
}) {
  const [revealed, setRevealed] = useState(false)
  if (pending)
    return (
      <LoadingWait
        texts={texts}
        label={label}
        what={what}
        source={source}
        lines={lines}
        fill={fill}
        header={header}
        onRetry={onRetry}
        onSettled={setRevealed}
      />
    )
  return <div className={contentClass(fill, revealed)}>{children}</div>
}

/**
 * Suspense 的写法：`<Suspense fallback>` 换成它，等的是 React.lazy 或 use() 的 promise。
 * 骨架的延迟、2s / 10s 两段与揭示和 Loading 是同一套（fallback 显示了多久、出没出过骨架，都由 LoadingWait 判断）。
 * 等的是代码不是数据，所以没有来源；onRetry 由外面换 key 重建（重试时 Suspense 重新计时）。
 */
export function LoadingBoundary({
  texts,
  label,
  what,
  lines = 3,
  fill = false,
  onRetry,
  children,
}: {
  /** All the text (the package ships none). */
  texts: LoadingTexts
  /** Accessible name of the skeleton. */
  label?: string
  /** What is loading, shown in the caption. */
  what?: string
  /** How many lines to draw when the visible height is unknown. */
  lines?: number
  /** Fill the parent; the line count is measured from the container height. */
  fill?: boolean
  /** When given, the amber bar after 10 seconds offers a retry button. */
  onRetry?: () => void
  /** The content that suspends. */
  children: ReactNode
}) {
  const [revealed, setRevealed] = useState(false)
  return (
    <Suspense
      fallback={
        <LoadingWait
          texts={texts}
          label={label}
          what={what}
          lines={lines}
          fill={fill}
          onRetry={onRetry}
          onSettled={setRevealed}
        />
      }
    >
      <div className={contentClass(fill, revealed)}>{children}</div>
    </Suspense>
  )
}
