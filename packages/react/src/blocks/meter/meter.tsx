// SPDX-License-Identifier: MIT
/**
 * Horizontal meter in three shapes: bar, gauge and sync bar.
 * 体检 §2：不是量化专有，从 src/quant 挪到 blocks（G6）；tone 改用 lib/severity 的 SeverityExt。
 * neutral 自成一档（#178）：有数、没有判断，填充用中性墨色；off 才是停用（全部转灰）。
 */
// 组件卡 Meter（design/katana-console/project/components/Meter，#1929）：横向仪表，三种形态。
//   bar   条：10px 凹槽里一条点阵纹理的填充（量用长度编码，不用实色），上面一行名字与数；进度、负载、敞口。
//   gauge 刻度：34px 凹槽一根指针，底下 0/25/50/75/100 的刻度；0 到 100 的读数（相对强弱之类）。
//   sync  同步率条（卡里新增，signature.md）：带齿的分段条 + 琥珀评估刻度 + 右侧大百分比；只给 paper 进度、容量使用、偏离门距离、回放进度。
// 颜色只传 tone，不传色值；名字与数字永远在（不做「只有一根条」）；文案由调用方传，包里不写。
// 填充与指针位置走 gentle 弹簧（--dur-gentle / --ease-gentle 的 CSS 形式，不用 transition 以外的手写缓动）；越过阈值那一下的脉冲在 CSS 里，tone 一变成 warn 就播一遍，越硬限另播一遍红的。
// 限额用法（KatanaUI #149，补回 KATANAview #1917 里 BulletMeter 的软限与硬限）：warnAt 预警线、hardAt 硬限。线的画法照 RiskBoard 卡
// （design/katana-console/project/components/RiskBoard，2026-11-23 读：预警线 amber 1px 半透明、硬限 red 2px，越预警线填充转 amber），
// 越硬限转红照 LossLimits 卡（同目录，≥ 100% red）；状态按「达到」算、没给 max 时满刻度取已用与两条线里最大的，照 KATANAview #1925 里原 BulletMeter 的定法。
// 功能参照 Arc Budget variance（uiarc.dev，2026-11-14 读，见 KATANAview #1917），实现原创。
import { useId, type ReactNode } from 'react'
import type { SeverityExt } from '../../lib/severity.ts'

/** @deprecated Use `SeverityExt` from the severity helpers; kept for one version. */
export type MeterTone = 'accent' | 'ok' | 'warn' | 'danger' | 'off' | 'neutral'
export type MeterDisplay = 'bar' | 'sync' | 'gauge'
/** 限额状态：normal 线下、warn 达到预警线、breach 达到硬限。 */
export type MeterLimitState = 'normal' | 'warn' | 'breach'

export type MeterProps = {
  /** 名字（左上，ink-300）。 */
  label: ReactNode
  value: number
  /**
   * 满量程；给了 warnAt / hardAt 时默认取已用与两条线里最大的（越限的部分看得见）。
   * @default 100
   */
  max?: number
  /** 右边的数怎么写；不给就是四舍五入的百分数。 */
  valueText?: string
  /** accent 进行中（橙）、ok 健康（绿）、warn 受限或越界（琥珀）、danger 弱势（红）、neutral 中性（有数、不表态，中性墨色）、off 停用。默认 accent。 */
  tone?: SeverityExt
  /** 形态，默认 bar。 */
  display?: MeterDisplay
  /** 刻度（跟 value 同一个单位）：bar 与 sync 画一根琥珀竖线，gauge 不用。sync 里它是评估点。 */
  mark?: number
  /** 读屏用：刻度那根线是什么（如「评估点」「上限」）；有 mark 时要给。 */
  markLabel?: string
  /** 预警线（软限，跟 value 同一个单位）：bar 与 sync 画一根半透明琥珀细线，gauge 不用；读数达到它 tone 换成 warn。 */
  warnAt?: number
  /** 硬限（跟 value 同一个单位）：一根 2px 红线，gauge 不用；读数达到它 tone 换成 danger。 */
  hardAt?: number
  /** 读屏用：两条线的说法，数与单位由调用方写（如「预警线 80%」「硬限 100%」），接在读数后面；有线时要给。 */
  limitLabels?: { warn?: string; hard?: string }
  className?: string
}

/** value 占满量程的比例，0 到 1（越界贴边；不是有限数按 0）。纯函数。 */
export function meterShare(value: number, max = 100): number {
  if (!Number.isFinite(value) || !Number.isFinite(max) || max <= 0) return 0
  return Math.min(1, Math.max(0, value / max))
}

const finite = (x: number | undefined): x is number => x !== undefined && Number.isFinite(x)

/** 限额状态，按「达到」算：已用 ≥ 硬限是 breach，≥ 预警线是 warn；没给或不是有限数的线不算。纯函数。 */
export function meterLimitState(value: number, warnAt?: number, hardAt?: number): MeterLimitState {
  if (!Number.isFinite(value)) return 'normal'
  if (finite(hardAt) && value >= hardAt) return 'breach'
  if (finite(warnAt) && value >= warnAt) return 'warn'
  return 'normal'
}

/** 给了线、没给 max 时的满量程：已用与两条线里最大的正数，不加余量；都不是正的有限数时回到 100。纯函数。 */
export function meterLimitMax(value: number, warnAt?: number, hardAt?: number): number {
  const candidates = [value, warnAt, hardAt].filter((x): x is number => finite(x) && x > 0)
  return candidates.length > 0 ? Math.max(...candidates) : 100
}

const TICKS = [0, 25, 50, 75, 100]

export function Meter({
  label,
  value,
  max: maxProp,
  valueText,
  tone = 'accent',
  display = 'bar',
  mark,
  markLabel,
  warnAt,
  hardAt,
  limitLabels,
  className,
}: MeterProps) {
  const id = useId()
  // 刻度盘固定读 0 到 100，不画限额线，也不按线换 tone（跟 mark 一样）。
  const limited = display !== 'gauge' && (finite(warnAt) || finite(hardAt))
  const max = maxProp ?? (limited ? meterLimitMax(value, warnAt, hardAt) : 100)
  const share = meterShare(value, max)
  const text = valueText ?? `${Math.round(share * 100)}%`
  const markShare = mark === undefined ? null : meterShare(mark, max)
  const warnShare = limited && finite(warnAt) ? meterShare(warnAt, max) : null
  const hardShare = limited && finite(hardAt) ? meterShare(hardAt, max) : null
  const limitState = limited ? meterLimitState(value, warnAt, hardAt) : undefined
  const shownTone: SeverityExt = limitState === 'breach' ? 'danger' : limitState === 'warn' ? 'warn' : tone
  const notes = [
    markShare !== null && markLabel ? `${markLabel} ${Math.round(markShare * 100)}%` : null,
    warnShare !== null ? limitLabels?.warn : null,
    hardShare !== null ? limitLabels?.hard : null,
  ].filter((note): note is string => Boolean(note))
  const cls = `k-meter is-${display}${className ? ` ${className}` : ''}`
  const track = (
    <span
      className="k-meter-track"
      role="meter"
      aria-labelledby={`${id}-l`}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={Math.min(max, Math.max(0, Number.isFinite(value) ? value : 0))}
      aria-valuetext={notes.length > 0 ? `${text} (${notes.join(', ')})` : text}
    >
      {display === 'gauge' ? (
        <>
          <span className="k-meter-base" aria-hidden="true" />
          <span className="k-meter-pin" style={{ left: `calc(6px + (100% - 12px) * ${share})` }} aria-hidden="true" />
          <span className="k-meter-ticks" aria-hidden="true">
            {TICKS.map((tick) => (
              <span key={tick}>{tick}</span>
            ))}
          </span>
        </>
      ) : (
        <>
          <span className="k-meter-fill" style={{ width: `${share * 100}%` }} aria-hidden="true" />
          {markShare !== null && (
            <span className="k-meter-mark" style={{ left: `${markShare * 100}%` }} aria-hidden="true" />
          )}
          {warnShare !== null && (
            <span className="k-meter-limit is-warn" style={{ left: `${warnShare * 100}%` }} aria-hidden="true" />
          )}
          {hardShare !== null && (
            <span className="k-meter-limit is-hard" style={{ left: `${hardShare * 100}%` }} aria-hidden="true" />
          )}
        </>
      )}
    </span>
  )
  if (display === 'sync')
    return (
      <div className={cls} data-tone={shownTone} data-state={limitState}>
        <span className="k-meter-label" id={`${id}-l`}>
          {label}
        </span>
        <div className="k-meter-sync-row">
          {track}
          <span className="k-meter-big">{text}</span>
        </div>
      </div>
    )
  return (
    <div className={cls} data-tone={shownTone} data-state={limitState}>
      <span className="k-meter-head">
        <span className="k-meter-label" id={`${id}-l`}>
          {label}
        </span>
        <span className="k-meter-value">{text}</span>
      </span>
      {track}
    </div>
  )
}
