// SPDX-License-Identifier: MIT
// 稳健性门（#120，设计卡 KATANAview 的 RobustnessGate）：一组判定条，每条一行——名字、实测值、阈值（带比较符号）、通过与否，行内一根小条画实测值，一道刻线是阈值。
// 阈值、比较方向、数值写法全部由调用方传（件里没有任何写死的数字）；全部通过才算「过门」，有一条失败或没测出来就不过（未知不当通过放行）。
// 状态用文字加图标，不只靠颜色。纯逻辑在 robustness-gate-model.ts。包里不带语言。
import { CheckIcon, MinusIcon, XIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '../lib/cn.ts'
import {
  evaluateCheck,
  gateBar,
  OP_SYMBOL,
  summarizeGate,
  type GateCheck,
  type GateState,
} from './robustness-gate-model.ts'

export type RobustnessCheck = GateCheck & {
  /** 实测值与阈值的写法；不给用 String。 */
  format?: (value: number) => string
  /** 一句口径说明（悬停提示与读屏），如「样本外年化 ÷ 样本内年化」。 */
  hint?: string
}

export type RobustnessGateLabels = {
  /** 每行三列的小标题。 */
  measured: string
  threshold: string
  result: string
  pass: string
  fail: string
  /** 没测出来。 */
  unknown: string
  /** 整体结论：全过 / 没过。 */
  open: string
  closed: string
  /** 汇总的写法，如「3 / 4 通过」：由调用方按计数拼，件不拼句子。 */
  summary: (passed: number, total: number) => string
  /** 一条判定都没有时写什么。 */
  empty: string
}

export type RobustnessGateProps = {
  checks: readonly RobustnessCheck[]
  /** 整组的读屏名。 */
  label: string
  labels: RobustnessGateLabels
  /** 标题；不给不画。 */
  title?: ReactNode
  source?: string
  className?: string
}

const ICON: Record<GateState, typeof CheckIcon> = { pass: CheckIcon, fail: XIcon, unknown: MinusIcon }

export function RobustnessGate({ checks, label, labels, title, source, className }: RobustnessGateProps) {
  const summary = summarizeGate(checks)
  return (
    <section
      className={cn('k-rg', className)}
      data-slot="robustness-gate"
      data-open={summary.open ? '' : undefined}
      aria-label={label}
    >
      <header className="k-rg-head">
        {title !== undefined && <h4 className="k-rg-title">{title}</h4>}
        <span className="k-rg-verdict" data-slot="robustness-verdict" data-state={summary.open ? 'pass' : 'fail'}>
          {summary.open ? <CheckIcon aria-hidden="true" /> : <XIcon aria-hidden="true" />}
          {summary.open ? labels.open : labels.closed}
        </span>
        <span className="k-rg-count" data-slot="robustness-count">
          {labels.summary(summary.passed, summary.total)}
        </span>
      </header>
      {checks.length === 0 ? (
        <p className="k-rg-empty">{labels.empty}</p>
      ) : (
        <ul className="k-rg-list">
          {checks.map((check) => {
            const state = evaluateCheck(check)
            const bar = gateBar(check)
            const format = check.format ?? String
            const Icon = ICON[state]
            const text = state === 'pass' ? labels.pass : state === 'fail' ? labels.fail : labels.unknown
            return (
              <li
                key={check.id}
                className="k-rg-row"
                data-slot="robustness-check"
                data-id={check.id}
                data-state={state}
                title={check.hint}
              >
                <span className="k-rg-name">{check.name}</span>
                <span className="k-rg-values">
                  <span data-slot="robustness-value" aria-label={labels.measured}>
                    {check.value === null ? '–' : format(check.value)}
                  </span>
                  <span className="k-rg-op" aria-hidden="true">
                    {OP_SYMBOL[check.op]}
                  </span>
                  <span data-slot="robustness-threshold" aria-label={labels.threshold}>
                    {format(check.threshold)}
                  </span>
                </span>
                <span className="k-rg-bar" aria-hidden="true">
                  {bar.value !== null && <i data-part="value" style={{ width: `${bar.value * 100}%` }} />}
                  <b data-part="threshold" style={{ left: `${bar.threshold * 100}%` }} />
                </span>
                <span className="k-rg-state" data-state={state} aria-label={labels.result}>
                  <Icon aria-hidden="true" />
                  {text}
                </span>
              </li>
            )
          })}
        </ul>
      )}
      {source !== undefined && <p className="k-dist-source">{source}</p>}
    </section>
  )
}
