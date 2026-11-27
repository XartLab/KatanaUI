// SPDX-License-Identifier: MIT
/**
 * Parallel attempts: one task tried several ways at once, each attempt a row with progress and score; the best finished one is marked and can be overridden.
 * 并行尝试（KATANAview #1908 第一批）：一次参数扫描的几组参数并排跑。头一行标题、任务、各状态计数；每组一行：名字、参数说明、进度条、
 * 运行中写当前步，跑完写分数、小注与耗时，失败写原因；跑完且分最好的标「最优」。每个跑完的行有一个「用这组」单选，默认选中最优，点别的就改选。
 * 功能参照 affectUI 的 Parallel Attempts（affectui.com/components/parallel-attempts，2026-11-23 读，Pro 件，页上没写许可证：只读说明、实现原创）。
 * 跟它不同：不写花费（回测没有按次计费），分数方向可配（lowerIsBetter），颜色照 Graphite：运行中是中性墨色、跑完是 ok、失败是 danger，不用蓝。
 * 进度条只是装饰，信息都在旁边的字里。纯逻辑在 parallel-attempts-model.ts。包里不带语言。
 */
import { CheckIcon, XIcon } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { fillVar } from '../lib/fill.ts'
import { cn } from '../lib/cn.ts'
import { attemptFill, bestAttempt, countAttempts, type Attempt, type AttemptStatus } from './parallel-attempts-model.ts'

/** Texts of ParallelAttempts (the package ships no text). */
export type ParallelAttemptsLabels = {
  /** Status words. */
  status: Record<AttemptStatus, string>
  /** Tag on the best finished attempt (「最优」). */
  best: string
  /** Label of the pick button (「用这组」); the accessible name also gets the attempt name and score. */
  use: string
  /** Tag on the picked attempt (「已选」). */
  picked: string
  /** Header counts (「3 跑完 · 1 运行」), built by the caller. */
  counts: (counts: Record<AttemptStatus, number>) => string
  /** Text when there are no attempts. */
  empty: string
}

export type ParallelAttemptsProps = {
  /** Attempts in display order. */
  attempts: readonly Attempt[]
  /** Heading. */
  title: ReactNode
  /** The shared task, such as the strategy and sample period. */
  task?: ReactNode
  /** Accessible name of the attempt group. */
  label: string
  /** Controlled pick; omit to pick the best finished attempt until the user picks another one. */
  picked?: string | null
  /** Called with the attempt the user picks. */
  onPick?: (attempt: Attempt) => void
  /** Smaller scores win. */
  lowerIsBetter?: boolean
  /** How a score is written; defaults to String. */
  formatScore?: (score: number) => string
  /** How a wall time in milliseconds is written; omit to hide times. */
  formatTook?: (ms: number) => string
  /** Texts. */
  labels: ParallelAttemptsLabels
  /** Source line under the list. */
  source?: string
  /** Extra class name on the root. */
  className?: string
}

export function ParallelAttempts({
  attempts,
  title,
  task,
  label,
  picked: pickedProp,
  onPick,
  lowerIsBetter = false,
  formatScore = String,
  formatTook,
  labels,
  source,
  className,
}: ParallelAttemptsProps) {
  const [chosen, setChosen] = useState<string | null>(null)
  const best = bestAttempt(attempts, lowerIsBetter)
  // 用户没选过时跟着最优走（新的一组跑完分更好，选中就跟过去）；选过就以用户的为准。
  const pickedId = pickedProp !== undefined ? pickedProp : (chosen ?? best?.id ?? null)
  const pick = (attempt: Attempt) => {
    if (pickedProp === undefined) setChosen(attempt.id)
    onPick?.(attempt)
  }

  return (
    <section className={cn('k-pa', className)} data-slot="parallel-attempts">
      <header className="k-pa-head">
        <h4 className="k-pa-title">{title}</h4>
        {task !== undefined && <span className="k-pa-task">{task}</span>}
        <span className="k-pa-counts" data-slot="parallel-counts">
          {labels.counts(countAttempts(attempts))}
        </span>
      </header>
      {attempts.length === 0 ? (
        <p className="k-pa-empty">{labels.empty}</p>
      ) : (
        <div className="k-pa-list" role="radiogroup" aria-label={label}>
          {attempts.map((attempt) => {
            const status = attempt.status ?? 'queued'
            const isBest = attempt.id === best?.id
            const isPicked = attempt.id === pickedId
            const score = typeof attempt.score === 'number' && Number.isFinite(attempt.score) ? attempt.score : null
            return (
              <div
                key={attempt.id}
                className="k-pa-row"
                data-slot="parallel-attempt"
                data-id={attempt.id}
                data-status={status}
                data-best={isBest ? '' : undefined}
                data-picked={isPicked ? '' : undefined}
              >
                <span className="k-pa-name">
                  {attempt.name}
                  {isBest && <small data-tag="best">{labels.best}</small>}
                </span>
                {attempt.approach !== undefined && <span className="k-pa-approach">{attempt.approach}</span>}
                <span className="k-pa-bar" aria-hidden="true">
                  <i style={fillVar(attemptFill(attempt))} />
                </span>
                <span className="k-pa-state" data-slot="parallel-state">
                  {status === 'done' ? (
                    <>
                      <CheckIcon aria-hidden="true" />
                      <b data-slot="parallel-score">{score === null ? labels.status.done : formatScore(score)}</b>
                    </>
                  ) : status === 'failed' ? (
                    <>
                      <XIcon aria-hidden="true" />
                      {labels.status.failed}
                    </>
                  ) : (
                    (attempt.step ?? labels.status[status])
                  )}
                </span>
                {(attempt.note !== undefined || (attempt.took !== undefined && formatTook !== undefined)) && (
                  <span className="k-pa-note">
                    {[attempt.note, attempt.took !== undefined && formatTook ? formatTook(attempt.took) : undefined]
                      .filter((item) => item !== undefined)
                      .join(' · ')}
                  </span>
                )}
                {status === 'done' && (
                  <button
                    type="button"
                    role="radio"
                    aria-checked={isPicked}
                    aria-label={`${labels.use} ${attempt.name}${score === null ? '' : ` ${formatScore(score)}`}`}
                    className="k-pa-use"
                    data-slot="parallel-use"
                    onClick={() => pick(attempt)}
                  >
                    {isPicked ? labels.picked : labels.use}
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}
      {source !== undefined && <p className="k-dist-source">{source}</p>}
    </section>
  )
}
