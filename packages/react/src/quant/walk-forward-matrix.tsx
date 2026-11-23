// SPDX-License-Identifier: MIT
// 步进窗口矩阵（#120，对照 MultiCharts 的 Walk-Forward Optimizer）：每个窗口一行——样本内区间、样本外区间、这个窗口里选中的参数、样本外绩效、通过与否，
// 行首有一条共用时间轴的小条（灰是样本内、亮是样本外），锚定模式里样本内条都从同一处起、越拉越长，滚动模式里整条后移，一眼能分清；
// 底部汇总：通过窗口数、样本外盈利窗口占比、样本内与样本外的年化、步进效率（样本外年化 ÷ 样本内年化）。
// 件只汇总调用方给的每窗口结果，不切窗口也不优化；「通过」的判据是调用方的策略。两种模式的窗口集都由调用方给，件里切换。包里不带语言。纯逻辑在 walk-forward-model.ts。
import { CheckIcon, XIcon } from 'lucide-react'
import { useState } from 'react'
import { cn } from '../lib/cn.ts'
import { ToggleGroup, ToggleGroupItem } from '../primitives/toggle-group.tsx'
import {
  barBox,
  paramNames,
  summarizeWindows,
  windowSpan,
  type WalkForwardMode,
  type WalkForwardWindow,
} from './walk-forward-model.ts'

export type WalkForwardMatrixLabels = {
  modeGroup: string
  rolling: string
  anchored: string
  /** 表头。 */
  window: string
  timeline: string
  inSample: string
  outSample: string
  params: string
  /** 样本外绩效那一列的表头，如「样本外收益」。 */
  outPerformance: string
  result: string
  pass: string
  fail: string
  /** 汇总各项的名字。 */
  windows: string
  passed: string
  profitable: string
  inAnnualized: string
  outAnnualized: string
  efficiency: string
  /** 汇总里算不出的项（如样本内年化不为正时的效率）写什么。 */
  noValue: string
  /** 图例里「样本内 / 样本外」条的说明由 inSample / outSample 复用；没有窗口时写什么。 */
  empty: string
}

export type WalkForwardMatrixProps = {
  /** 两种模式的窗口集；只给一种就不显示切换。 */
  modes: Partial<Record<WalkForwardMode, readonly WalkForwardWindow[]>>
  /** 当前模式；不给用内部状态（默认有的第一个，锚定优先）。 */
  mode?: WalkForwardMode
  onModeChange?: (mode: WalkForwardMode) => void
  /** 表的读屏名。 */
  label: string
  formatDate: (time: number) => string
  /** 小数收益的写法（0.0123 → 「+1.23%」）：样本外绩效与汇总里的年化。 */
  formatPercent: (value: number) => string
  /** 占比与效率的写法（0.62 → 「62%」）。 */
  formatRatio: (value: number) => string
  labels: WalkForwardMatrixLabels
  source?: string
  className?: string
}

const toneOf = (value: number): 'up' | 'down' | 'flat' => (value > 0 ? 'up' : value < 0 ? 'down' : 'flat')

export function WalkForwardMatrix({
  modes,
  mode: modeProp,
  onModeChange,
  label,
  formatDate,
  formatPercent,
  formatRatio,
  labels,
  source,
  className,
}: WalkForwardMatrixProps) {
  const available = (['anchored', 'rolling'] as const).filter((key) => modes[key] !== undefined)
  const [modeState, setMode] = useState<WalkForwardMode>(available[0] ?? 'rolling')
  const mode = modeProp ?? (available.includes(modeState) ? modeState : (available[0] ?? 'rolling'))
  const windows = modes[mode] ?? []
  const summary = summarizeWindows(windows)
  const span = windowSpan(windows)
  const names = paramNames(windows)
  const columns = 7

  return (
    <figure className={cn('k-wf', className)} data-slot="walk-forward-matrix" data-mode={mode}>
      <div className="k-wf-head">
        {available.length > 1 && (
          <ToggleGroup
            size="sm"
            aria-label={labels.modeGroup}
            value={mode}
            onValueChange={(next) => {
              if (next !== 'anchored' && next !== 'rolling') return
              setMode(next)
              onModeChange?.(next)
            }}
          >
            <ToggleGroupItem value="anchored">{labels.anchored}</ToggleGroupItem>
            <ToggleGroupItem value="rolling">{labels.rolling}</ToggleGroupItem>
          </ToggleGroup>
        )}
        <span className="k-wf-key" aria-hidden="true">
          <i data-part="in" />
          {labels.inSample}
        </span>
        <span className="k-wf-key" aria-hidden="true">
          <i data-part="out" />
          {labels.outSample}
        </span>
      </div>
      {windows.length === 0 || span === null ? (
        <p className="k-wf-empty" data-slot="walk-forward-empty">
          {labels.empty}
        </p>
      ) : (
        <div className="k-wf-scroll">
          <table className="k-wf-table" aria-label={label}>
            <thead>
              <tr>
                <th scope="col">{labels.window}</th>
                <th scope="col">{labels.timeline}</th>
                <th scope="col">{labels.inSample}</th>
                <th scope="col">{labels.outSample}</th>
                <th scope="col">{labels.params}</th>
                <th scope="col" data-num="">
                  {labels.outPerformance}
                </th>
                <th scope="col">{labels.result}</th>
              </tr>
            </thead>
            <tbody>
              {windows.map((w, index) => {
                const inBox = barBox(w.inStart, w.inEnd, span)
                const outBox = barBox(w.outStart, w.outEnd, span)
                return (
                  <tr key={w.id} data-slot="walk-forward-row" data-passed={w.passed ? '' : undefined}>
                    <th scope="row">{index + 1}</th>
                    <td>
                      <span className="k-wf-bar" data-slot="walk-forward-bar" aria-hidden="true">
                        <i data-part="in" style={{ left: `${inBox.left}%`, width: `${inBox.width}%` }} />
                        <i data-part="out" style={{ left: `${outBox.left}%`, width: `${outBox.width}%` }} />
                      </span>
                    </td>
                    <td className="k-wf-range">
                      <span>{formatDate(w.inStart)} –</span> <span>{formatDate(w.inEnd)}</span>
                    </td>
                    <td className="k-wf-range">
                      <span>{formatDate(w.outStart)} –</span> <span>{formatDate(w.outEnd)}</span>
                    </td>
                    <td className="k-wf-params">
                      {names.map((name) => (
                        <span key={name} data-param={name}>
                          <em>{name}</em> {w.params[name] ?? labels.noValue}
                        </span>
                      ))}
                    </td>
                    <td data-num="" data-tone={toneOf(w.outReturn)} data-slot="walk-forward-out">
                      {formatPercent(w.outReturn)}
                    </td>
                    <td className="k-wf-result" data-state={w.passed ? 'pass' : 'fail'} data-slot="walk-forward-result">
                      {w.passed ? <CheckIcon aria-hidden="true" /> : <XIcon aria-hidden="true" />}
                      {w.passed ? labels.pass : labels.fail}
                    </td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr data-slot="walk-forward-summary">
                <th scope="row" colSpan={columns}>
                  <dl className="k-wf-summary">
                    <div data-stat="windows">
                      <dt>{labels.windows}</dt>
                      <dd>{summary.windows}</dd>
                    </div>
                    <div data-stat="passed">
                      <dt>{labels.passed}</dt>
                      <dd>
                        {summary.passed} / {summary.windows}
                      </dd>
                    </div>
                    <div data-stat="profitable">
                      <dt>{labels.profitable}</dt>
                      <dd>
                        {summary.profitableShare === null ? labels.noValue : formatRatio(summary.profitableShare)}
                      </dd>
                    </div>
                    <div data-stat="in-annualized">
                      <dt>{labels.inAnnualized}</dt>
                      <dd>{summary.inAnnualized === null ? labels.noValue : formatPercent(summary.inAnnualized)}</dd>
                    </div>
                    <div data-stat="out-annualized">
                      <dt>{labels.outAnnualized}</dt>
                      <dd>{summary.outAnnualized === null ? labels.noValue : formatPercent(summary.outAnnualized)}</dd>
                    </div>
                    <div data-stat="efficiency" data-key="">
                      <dt>{labels.efficiency}</dt>
                      <dd data-slot="walk-forward-efficiency">
                        {summary.efficiency === null ? labels.noValue : formatRatio(summary.efficiency)}
                      </dd>
                    </div>
                  </dl>
                </th>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
      {source !== undefined && <p className="k-dist-source">{source}</p>}
    </figure>
  )
}
