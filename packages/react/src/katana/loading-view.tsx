// SPDX-License-Identifier: MIT
import type { ReactNode, Ref } from 'react'
import { Button } from '../primitives/button.tsx'
import { Led } from './led.tsx'
import type { LoadingPhase } from './loading-gate.ts'
import { Skeleton } from './skeleton.tsx'

/**
 * Texts of the loading states (the package ships none); the sentences with a source get null when there is none.
 * 加载态的文字：包里不带文字，调用方按界面语言给。带来源的几句，source 没有时传 null。G3 起叫 labels（原 LoadingTexts，体检 §4 统一 labels）。
 * 搬自 src/ui/LoadingView.tsx（#1860），原来的文字（括号里）由应用的适配层给：
 * 内容（「内容」）、noResponse（「没有回应」）、loadingLed（「加载中」）、retry（「重试」）、
 * loading（「加载 <name> · <source>」）、slow（「仍在加载 · <source>」）、timeout（「点重试 · <source> 10 秒无回应」）、skeleton（「正在载入」）。
 */
export type LoadingLabels = {
  skeleton: string
  content: string
  noResponse: string
  loadingLed: string
  retry: string
  loading: (name: string, source: string | null) => string
  slow: (source: string | null) => string
  timeout: (source: string | null) => string
}

/**

 * Old name kept for one release.

 * @deprecated Use LoadingLabels.

 */
export type LoadingTexts = LoadingLabels

/**
 * @deprecated Use Loading with phase: it draws the same block.
 * 「在等」这一块长什么样（#1234，states.md 加载态与错误态），按所处的一段画：
 * - loading / slow：顶部 caption，LED on（橙、不呼吸）+「加载 <内容> · <来源>」，2s 起改说「仍在加载 · <来源>」；
 * - timeout：琥珀条，LED warn +「点重试 · <来源> 10 秒无回应」+ 重试按钮，骨架留着、变淡；
 * - 没到 500ms（phase 为 null）：什么也不画（撑满时留一个空的行区给 LoadingWait 去量高度）。
 * 只管画，计时与量高度在 LoadingWait；错误文案每句不超过 12 字，先说怎么办。
 */
export function LoadingView({
  phase,
  labels: given,
  texts: legacy,
  label,
  what,
  source,
  rows,
  measured,
  fill,
  header,
  areaRef,
  onRetry,
}: {
  /** The current phase; null draws nothing. */
  phase: LoadingPhase | null
  /** All the text; required unless the deprecated texts is given. */
  labels?: LoadingLabels
  /**
   * Old name kept for one release.
   * @deprecated Use labels.
   */
  texts?: LoadingLabels
  /** Accessible name of the skeleton. */
  label?: string
  /** What is loading, shown in the caption. */
  what?: string
  /** Where it loads from; omitted when absent. */
  source?: string | null
  /**
   * Number of skeleton rows.
   * 骨架画几行。
   */
  rows: number
  /**
   * The row count was measured (fill mode): each row takes one table row height.
   * 行数是量出来的（撑满面板主体）：每行占一个表格行高。
   */
  measured: boolean
  /** Fill the parent. */
  fill: boolean
  /** The real header when it is already known. */
  header?: ReactNode
  /** Ref to the area whose height is measured. */
  areaRef?: Ref<HTMLDivElement>
  /** When given, the amber bar offers a retry button. */
  onRetry?: () => void
}) {
  if (phase === null && !fill) return null
  const labels = (given ?? legacy)!
  const name = what ?? labels.content
  const from = source ?? null
  return (
    <div className={`k-loading-wait${fill ? ' is-fill' : ''}${phase === 'timeout' ? ' is-timeout' : ''}`}>
      {phase === 'timeout' ? (
        <div className="k-loading-bar">
          <Led tone="warn" label={labels.noResponse} />
          <span className="k-loading-text">{labels.timeout(from)}</span>
          {onRetry && (
            <Button size="sm" className="k-loading-retry" onClick={onRetry}>
              {labels.retry}
            </Button>
          )}
        </div>
      ) : (
        phase !== null && (
          <div className="k-loading-caption">
            <Led small tone="accent" label={labels.loadingLed} />
            <span className="k-loading-text">{phase === 'slow' ? labels.slow(from) : labels.loading(name, from)}</span>
          </div>
        )
      )}
      {phase !== null && header}
      <div className="k-loading-area" ref={areaRef}>
        {phase !== null && <Skeleton label={label ?? labels.skeleton} lines={rows} rows={measured} />}
      </div>
    </div>
  )
}
