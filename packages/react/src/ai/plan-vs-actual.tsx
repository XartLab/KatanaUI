// SPDX-License-Identifier: MIT
/**
 * Plan vs actual: an agent's step plan against what actually happened, with overruns and the shifted finish time.
 * 计划对实际（KATANAview #1908 第三批）：Agent 动手前的计划与做的过程放在同一根时间轴上。头一行标题、计划完成、推算完成、推移（晚了 warn 色）；
 * 每步一行：名字、状态字（排队 / 进行中 / 超时 / 完成 / 超时完成）、轨道（计划是空心框，实际是实心条，超过计划时长的那一截是 warn 色，没开始的步与进行中的步 now 之后的部分按推算位置画虚框）、
 * 计划时长对实际时长。一道竖线是 now。状态都写成字，不只靠颜色。
 * 功能参照 affectUI 的 Plan vs Actual（affectui.com/components/plan-vs-actual，2026-11-23 读目录页的说明，Pro 件，页上没写许可证：只读说明、实现原创）。
 * 推算规则在 plan-actual-model.ts：做完的用实际结束，正在做的按计划时长与 now 取晚的，没开始的接在上一步后面按计划时长排。时间单位与写法由调用方给。包里不带语言。
 */
import type { ReactNode } from 'react'
import { cn } from '../lib/cn.ts'
import { planDomain, planShift, projectPlan, type PlanStep, type StepState } from './plan-actual-model.ts'

/** Texts of PlanVsActual (the package ships no text). */
export type PlanVsActualLabels = {
  /** State words. */
  state: Record<StepState, string>
  /** Header field names. */
  planned: string
  projected: string
  /** Shift text (「晚 12 分」「早 3 分」「按时」), built by the caller from the signed shift. */
  shift: (shift: number) => string
  /** Accessible name of the step list. */
  steps: string
  /** Duration pair in a row (「计划 10 分 · 实际 14 分」). */
  durations: (planned: string, actual: string | null) => string
  /** Text when there are no steps. */
  empty: string
}

export type PlanVsActualProps = {
  /** Steps in plan order. */
  steps: readonly PlanStep[]
  /** Current time, in the same unit as the steps. */
  now: number
  /** Heading. */
  title: ReactNode
  /** How a time is written. */
  formatTime: (time: number) => string
  /** How a duration is written. */
  formatDuration: (duration: number) => string
  /** Texts. */
  labels: PlanVsActualLabels
  /** Extra class name on the root. */
  className?: string
}

export function PlanVsActual({ steps, now, title, formatTime, formatDuration, labels, className }: PlanVsActualProps) {
  const projection = projectPlan(steps, now)
  const shift = planShift(steps, now)
  const [lo, hi] = planDomain(steps, now)
  const at = (time: number) => `${(((time - lo) / (hi - lo)) * 100).toFixed(3)}%`
  const width = (from: number, to: number) => `max(2px, ${(((to - from) / (hi - lo)) * 100).toFixed(3)}%)`
  const lateness = shift.shift > 0 ? 'late' : shift.shift < 0 ? 'early' : 'on-time'
  return (
    <section className={cn('k-pva', className)} data-slot="plan-vs-actual">
      <header className="k-pva-head">
        <h4 className="k-pva-title">{title}</h4>
        {steps.length > 0 && (
          <dl className="k-pva-facts">
            <div>
              <dt>{labels.planned}</dt>
              <dd>{formatTime(shift.planned)}</dd>
            </div>
            <div>
              <dt>{labels.projected}</dt>
              <dd data-slot="plan-projected">{formatTime(shift.projected)}</dd>
            </div>
          </dl>
        )}
        {steps.length > 0 && (
          <span className="k-pva-shift" data-shift={lateness} data-slot="plan-shift">
            {labels.shift(shift.shift)}
          </span>
        )}
      </header>
      {steps.length === 0 ? (
        <p className="k-pva-empty">{labels.empty}</p>
      ) : (
        <ol className="k-pva-list" aria-label={labels.steps}>
          {projection.map((item) => {
            const plannedLength = Math.max(0, item.step.plannedEnd - item.step.plannedStart)
            const started = item.state !== 'pending'
            const onTimeEnd = item.end - item.overrun
            const actualEnd = item.state === 'running' ? Math.min(now, onTimeEnd) : onTimeEnd
            return (
              <li
                key={item.step.id}
                className="k-pva-row"
                data-slot="plan-step"
                data-id={item.step.id}
                data-state={item.state}
              >
                <span className="k-pva-name">{item.step.name}</span>
                <span className="k-pva-state">{labels.state[item.state]}</span>
                <span className="k-pva-track" aria-hidden="true">
                  <i
                    data-part="plan"
                    style={{
                      left: at(item.step.plannedStart),
                      width: width(item.step.plannedStart, item.step.plannedEnd),
                    }}
                  />
                  {started ? (
                    <>
                      <b data-part="actual" style={{ left: at(item.start), width: width(item.start, actualEnd) }} />
                      {item.overrun > 0 && (
                        <b data-part="overrun" style={{ left: at(onTimeEnd), width: width(onTimeEnd, item.end) }} />
                      )}
                      {/* 进行中且还没到计划时长：实际只画到 now，剩下的按推算画虚框。 */}
                      {item.state === 'running' && item.end > now && (
                        <b data-part="projected" style={{ left: at(now), width: width(now, item.end) }} />
                      )}
                    </>
                  ) : (
                    <b data-part="projected" style={{ left: at(item.start), width: width(item.start, item.end) }} />
                  )}
                  <span data-part="now" style={{ left: at(now) }} />
                </span>
                <span className="k-pva-durations">
                  {labels.durations(
                    formatDuration(plannedLength),
                    started ? formatDuration(item.end - item.start) : null,
                  )}
                </span>
              </li>
            )
          })}
        </ol>
      )}
    </section>
  )
}
