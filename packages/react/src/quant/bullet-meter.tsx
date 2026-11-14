// SPDX-License-Identifier: MIT
// 横向仪表（子弹图）：限额板用，一根条是已用，底上三段是正常、接近、越限，两根刻度是软限与硬限。对设计稿的 Meter 卡。
// 功能参照 Arc 的 Budget variance（实际对预算的子弹图，uiarc.dev/components/charts，2026-11-14 读，只取功能），实现原创。
// 状态不单靠颜色：根上带 data-state，读屏有 role="meter" 与调用方传的 valueText，旁边可写状态词。
import { cn } from '../lib/cn'
import { bulletModel, type BulletState } from './bullet-model'

export type BulletMeterProps = {
  /** 已用。 */
  value: number
  /** 满刻度；不给取已用、软限、硬限里最大的。 */
  max?: number
  /** 软限：已用达到它是「接近」。 */
  soft?: number
  /** 硬限：已用达到它是「越限」。 */
  hard?: number
  /** 这根仪表量的是什么（读屏名与左上角的字）。 */
  label: string
  /** 读屏整句，例：「已用 72，软限 80，硬限 100」；由调用方按界面语言写。 */
  valueText: string
  /** 已用写成什么字（右上角）。 */
  formatValue: (value: number) => string
  /** 三种状态各写什么词（右上角、已用后面）；不给就不写。 */
  stateLabels?: Partial<Record<BulletState, string>>
  /** 刻度下面的小字（软限、硬限各一个）；不给就不写。 */
  tickLabels?: { soft?: string; hard?: string }
  className?: string
}

const pct = (x: number) => `${x * 100}%`

export function BulletMeter({
  value,
  max,
  soft,
  hard,
  label,
  valueText,
  formatValue,
  stateLabels,
  tickLabels,
  className,
}: BulletMeterProps) {
  const model = bulletModel({ value, max, soft, hard })
  const warnFrom = model.soft ?? model.hard
  const overFrom = model.hard
  return (
    <div className={cn('k-bullet', className)} data-slot="bullet-meter" data-state={model.state}>
      <div className="k-bullet-head">
        <span className="k-bullet-label">{label}</span>
        <span className="k-bullet-value">
          {formatValue(value)}
          {stateLabels?.[model.state] ? <em className="k-bullet-state">{stateLabels[model.state]}</em> : null}
        </span>
      </div>
      <div
        className="k-bullet-track"
        role="meter"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={model.max}
        aria-valuenow={Math.min(Math.max(value, 0), model.max)}
        aria-valuetext={valueText}
      >
        <span className="k-bullet-zone is-ok" style={{ left: 0, width: pct(warnFrom ?? 1) }} />
        {warnFrom !== null && model.soft !== null && (
          <span
            className="k-bullet-zone is-warn"
            style={{ left: pct(model.soft), width: pct((overFrom ?? 1) - model.soft) }}
          />
        )}
        {overFrom !== null && (
          <span className="k-bullet-zone is-breach" style={{ left: pct(overFrom), width: pct(1 - overFrom) }} />
        )}
        <span className="k-bullet-fill" data-slot="bullet-fill" style={{ width: pct(model.value) }} />
        {model.soft !== null && (
          <span className="k-bullet-tick is-soft" data-slot="bullet-soft" style={{ left: pct(model.soft) }} />
        )}
        {model.hard !== null && (
          <span className="k-bullet-tick is-hard" data-slot="bullet-hard" style={{ left: pct(model.hard) }} />
        )}
      </div>
      {tickLabels && (model.soft !== null || model.hard !== null) && (
        <div className="k-bullet-ticks" aria-hidden="true">
          {model.soft !== null && tickLabels.soft && <span style={{ left: pct(model.soft) }}>{tickLabels.soft}</span>}
          {model.hard !== null && tickLabels.hard && (
            <span style={{ left: pct(model.hard) }} data-align="end">
              {tickLabels.hard}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
