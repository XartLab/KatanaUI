// SPDX-License-Identifier: MIT
// 组件卡 RegimeStrip（design/katana-console/project/components/RegimeStrip，#1929）：市场状态带。
// 状态模型（HMM、规则、聚类）把历史分成几种状态，画成一条无缝的色带，叠在任何时间轴下（净值曲线、滚动检验、价格图都能挂），再配一张图例。
// 颜色是类别，不是好坏：只用 series-1…7 的 token，不用涨跌色、不用 signal 色。状态靠图例里的名字认，不只靠颜色。
// 宽度与时间的对应由调用方传（scale）：带自己只铺满父元素的宽，调用方把它放在跟上面时间轴同宽的容器里。
// 样本外的识别有滞后，最后一段常是估的：segment.estimated 画斜纹（不是颜色的另一种标记），图例旁写 estimateText。
// 分状态收益表不在本件里（那是调用方的表格）；这里只有带 + 图例。文案一律由调用方传。
import type { ReactNode } from 'react'

/** 状态的色：series-1…7 之一（≤ 6 态，挑色距大的几个，如 1、2、4、7）。 */
export type RegimeColor = 1 | 2 | 3 | 4 | 5 | 6 | 7

export type RegimeState = {
  id: string
  name: string
  color: RegimeColor
  /** 图例里名字后面的小字（如占比「47%」），已格式化。 */
  detail?: string
}

export type RegimeSegment = {
  /** 起止时间（调用方的时间单位，毫秒、序号都行，只要跟 scale 一致）。 */
  from: number
  to: number
  /** 对应 RegimeState.id。 */
  state: string
  /** 还没被后面的数据确认（最后一段常见）。 */
  estimated?: boolean
}

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

export type RegimeStripProps = RegimeBandProps & {
  /** 当前所处的状态 id：图例里它前面加 currentMarker 一类的标记。 */
  current?: string
  /** 「当前」的字。给了 current 就要给。 */
  currentText?: string
  /** 估算标记的字（有 estimated 的段时写在图例末尾），默认 est.。 */
  estimateText?: string
  /** 给了图例的每项就是按钮：点选某状态高亮，再点取消（传 null）。 */
  onPickState?: (state: string | null) => void
  /** 图例旁的标题（如 RUN 3d07 · HMM 4 态）。 */
  title?: ReactNode
}

/** 每段的 left 与 width（0 到 1 的比例，越界裁到带内）；起止倒过来或在带外的段不画。纯函数。 */
export function regimeSpans(
  segments: readonly RegimeSegment[],
  scale?: (time: number) => number,
): ({ segment: RegimeSegment; left: number; width: number } | null)[] {
  const times = segments.flatMap((s) => [s.from, s.to])
  const lo = Math.min(...times)
  const hi = Math.max(...times)
  const at = scale ?? ((t: number) => (hi > lo ? (t - lo) / (hi - lo) : 0))
  return segments.map((segment) => {
    const left = Math.min(1, Math.max(0, at(segment.from)))
    const right = Math.min(1, Math.max(0, at(segment.to)))
    return right > left ? { segment, left, width: right - left } : null
  })
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
const colorVar = (color: RegimeColor) => COLOR_VAR[color]

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
              backgroundColor: colorVar(state.color),
            }}
          />
        )
      })}
    </div>
  )
}

export function RegimeStrip({
  current,
  currentText,
  estimateText = 'est.',
  onPickState,
  title,
  className,
  ...band
}: RegimeStripProps) {
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
              <i className="k-regime-swatch" style={{ background: colorVar(state.color) }} aria-hidden="true" />
              <span className="k-regime-name">{state.name}</span>
              {state.detail ? <span className="k-regime-detail">{state.detail}</span> : null}
              {current === state.id && currentText ? <b className="k-regime-current">{currentText}</b> : null}
            </>
          )
          return (
            <li key={state.id} data-state={state.id} data-current={current === state.id || undefined}>
              {onPickState ? (
                <button
                  type="button"
                  aria-pressed={activeState === state.id}
                  onClick={() => onPickState(activeState === state.id ? null : state.id)}
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
