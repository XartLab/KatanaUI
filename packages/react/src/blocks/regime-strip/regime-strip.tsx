// SPDX-License-Identifier: MIT
/**
 * Market regime band with a legend: classified history drawn as a seamless color strip.
 * 体检 §2：不是量化专有，从 src/quant 挪到 blocks（G6）。
 */
// 组件卡 RegimeStrip（design/katana-console/project/components/RegimeStrip，#1929）：市场状态带。
// 状态模型（HMM、规则、聚类）把历史分成几种状态，画成一条无缝的色带，叠在任何时间轴下（净值曲线、滚动检验、价格图都能挂），再配一张图例。
// 颜色是类别，不是好坏：只用 series-1…7 的 token，不用涨跌色、不用 signal 色。状态靠图例里的名字认，不只靠颜色。
// 宽度与时间的对应由调用方传（scale）：带自己只铺满父元素的宽，调用方把它放在跟上面时间轴同宽的容器里。
// 样本外的识别有滞后，最后一段常是估的：segment.estimated 画斜纹（不是颜色的另一种标记），图例旁写 estimateText。
// 分状态收益表不在本件里（那是调用方的表格）；这里只有带 + 图例。文案一律由调用方传。
import type { ReactNode } from 'react'
import type { Severity } from '../../lib/severity.ts'
import { regimeSpans, type RegimeColor, type RegimeSegment, type RegimeState } from './regime-strip-model.ts'

export type { RegimeColor, RegimeSegment, RegimeState } from './regime-strip-model.ts'

export type RegimeBandProps = {
  segments: readonly RegimeSegment[]
  states: readonly RegimeState[]
  /** 时间到 0 到 1 的位置（要跟上面的时间轴对齐时传）；不给就在 segments 的最早与最晚之间线性排。 */
  scale?: (time: number) => number
  /** 高亮某个状态，别的状态变淡。 */
  activeState?: string | null
  /** 读屏名（整句）。 */
  label: string
  /** 每一段的悬停与读屏文字（区间、状态、持续多久……由调用方写）；不给就只写状态名。 */
  describe?: (segment: RegimeSegment, state: RegimeState) => string
  className?: string
}

/** Texts of RegimeStrip. */
export type RegimeStripLabels = {
  /** 「当前」的字。给了 current 就要给。 */
  current?: string
  /** 估算标记的字（有 estimated 的段时写在图例末尾），默认 est.。 */
  estimate?: string
}

export type RegimeStripProps = RegimeBandProps & {
  /** 当前所处的状态 id：图例里它后面加 labels.current 的标记。 */
  current?: string
  labels?: RegimeStripLabels
  /** @deprecated Use `labels.current`; kept for one version. */
  currentText?: string
  /** @deprecated Use `labels.estimate`; kept for one version. */
  estimateText?: string
  /** 给了图例的每项就是按钮：点选某状态（高亮由调用方回传 activeState），再点同一项传 null 取消。 */
  onSelect?: (state: RegimeState | null) => void
  /** @deprecated Use `onSelect` (gets the state object); kept for one version. */
  onPickState?: (state: string | null) => void
  /** 图例旁的标题（如 RUN 3d07 · HMM 4 态）。 */
  title?: ReactNode
}

const COLOR_VAR: Record<RegimeColor, string> = {
  1: 'var(--series-1)',
  2: 'var(--series-2)',
  3: 'var(--series-3)',
  4: 'var(--series-4)',
  5: 'var(--series-5)',
  6: 'var(--series-6)',
  7: 'var(--series-7)',
}
// 有好坏之分的状态读状态语气色（#11 第二批评审：情绪阶段不用艳的类别色）；字面量写 token，主题检查按字面量认。
const TONE_VAR: Record<Severity, string> = {
  neutral: 'var(--k-status-neutral-foreground)',
  ok: 'var(--k-status-ok-foreground)',
  warn: 'var(--k-status-warn-foreground)',
  danger: 'var(--k-status-danger-foreground)',
}
const fillOf = (state: RegimeState) => (state.tone ? TONE_VAR[state.tone] : COLOR_VAR[state.color])

/** 只画带，不画图例：给时间轴组件叠在自己下面用。 */
export function RegimeBand({ segments, states, scale, activeState, label, describe, className }: RegimeBandProps) {
  const byId = new Map(states.map((state) => [state.id, state]))
  return (
    <div className={`k-regime-band${className ? ` ${className}` : ''}`} role="img" aria-label={label}>
      {regimeSpans(segments, scale).map((span, index) => {
        if (!span) return null
        const state = byId.get(span.segment.state)
        if (!state) return null
        const text = describe ? describe(span.segment, state) : state.name
        return (
          <i
            key={index}
            title={text}
            data-state={state.id}
            data-estimated={span.segment.estimated || undefined}
            data-dim={activeState != null && activeState !== state.id ? '' : undefined}
            style={{
              left: `${span.left * 100}%`,
              width: `${span.width * 100}%`,
              backgroundColor: fillOf(state),
            }}
          />
        )
      })}
    </div>
  )
}

export function RegimeStrip({
  current,
  labels,
  currentText = labels?.current,
  estimateText = labels?.estimate ?? 'est.',
  onSelect,
  onPickState,
  title,
  className,
  ...band
}: RegimeStripProps) {
  const pick =
    onSelect || onPickState
      ? (state: RegimeState | null) => {
          onSelect?.(state)
          onPickState?.(state?.id ?? null)
        }
      : undefined
  const { states, segments, activeState } = band
  const hasEstimate = segments.some((segment) => segment.estimated)
  return (
    <div className={`k-regime${className ? ` ${className}` : ''}`}>
      {title ? <div className="k-regime-title">{title}</div> : null}
      <RegimeBand {...band} />
      <ul className="k-regime-legend">
        {states.map((state) => {
          const item = (
            <>
              <i className="k-regime-swatch" style={{ background: fillOf(state) }} aria-hidden="true" />
              <span className="k-regime-name">{state.name}</span>
              {state.detail ? <span className="k-regime-detail">{state.detail}</span> : null}
              {current === state.id && currentText ? <b className="k-regime-current">{currentText}</b> : null}
            </>
          )
          return (
            <li key={state.id} data-state={state.id} data-current={current === state.id || undefined}>
              {pick ? (
                <button
                  type="button"
                  aria-pressed={activeState === state.id}
                  onClick={() => pick(activeState === state.id ? null : state)}
                >
                  {item}
                </button>
              ) : (
                item
              )}
            </li>
          )
        })}
        {hasEstimate ? (
          <li className="k-regime-estimate">
            <i className="k-regime-swatch is-estimate" aria-hidden="true" />
            <span className="k-regime-name">{estimateText}</span>
          </li>
        ) : null}
      </ul>
    </div>
  )
}
