// SPDX-License-Identifier: MIT
import type { ReactNode, Ref } from 'react'
import { Button } from '../primitives/button'
import { Led } from './led'
import type { LoadingPhase } from './loading-gate'
import { Skeleton } from './skeleton'

/**
 * 加载态的文字：包里不带文字，调用方按界面语言给。带来源的几句，source 没有时传 null。
 * 搬自 src/ui/LoadingView.tsx（#1860），原来的文字（括号里）由应用的适配层给：
 * 内容（「内容」）、noResponse（「没有回应」）、loadingLed（「加载中」）、retry（「重试」）、
 * loading（「加载 <name> · <source>」）、slow（「仍在加载 · <source>」）、timeout（「点重试 · <source> 10 秒无回应」）、skeleton（「正在载入」）。
 */
export type LoadingTexts = {
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
 * 「在等」这一块长什么样（#1234，states.md 加载态与错误态），按所处的一段画：
 * - loading / slow：顶部 caption，LED on（橙、不呼吸）+「加载 <内容> · <来源>」，2s 起改说「仍在加载 · <来源>」；
 * - timeout：琥珀条，LED warn +「点重试 · <来源> 10 秒无回应」+ 重试按钮，骨架留着、变淡；
 * - 没到 500ms（phase 为 null）：什么也不画（撑满时留一个空的行区给 LoadingWait 去量高度）。
 * 只管画，计时与量高度在 LoadingWait；错误文案每句不超过 12 字，先说怎么办。
 */
export function LoadingView({
  phase,
  texts,
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
  phase: LoadingPhase | null
  texts: LoadingTexts
  label?: string
  what?: string
  source?: string | null
  /** 骨架画几行。 */
  rows: number
  /** 行数是量出来的（撑满面板主体）：每行占一个表格行高。 */
  measured: boolean
  fill: boolean
  header?: ReactNode
  areaRef?: Ref<HTMLDivElement>
  onRetry?: () => void
}) {
  if (phase === null && !fill) return null
  const name = what ?? texts.content
  const from = source ?? null
  return (
    <div className={`k-loading-wait${fill ? ' is-fill' : ''}${phase === 'timeout' ? ' is-timeout' : ''}`}>
      {phase === 'timeout' ? (
        <div className="k-loading-bar">
          <Led state="warn" label={texts.noResponse} />
          <span className="k-loading-text">{texts.timeout(from)}</span>
          {onRetry && (
            <Button size="sm" className="k-loading-retry" onClick={onRetry}>
              {texts.retry}
            </Button>
          )}
        </div>
      ) : (
        phase !== null && (
          <div className="k-loading-caption">
            <Led small state="on" label={texts.loadingLed} />
            <span className="k-loading-text">{phase === 'slow' ? texts.slow(from) : texts.loading(name, from)}</span>
          </div>
        )
      )}
      {phase !== null && header}
      <div className="k-loading-area" ref={areaRef}>
        {phase !== null && <Skeleton label={label ?? texts.skeleton} lines={rows} rows={measured} />}
      </div>
    </div>
  )
}
