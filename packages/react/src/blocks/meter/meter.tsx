// SPDX-License-Identifier: MIT
/**
 * Horizontal meter in three shapes: bar, gauge and sync bar.
 * 体检 §2：不是量化专有，从 src/quant 挪到 blocks（G6）；tone 改用 lib/severity 的 SeverityExt（neutral 画法同 off）。
 */
// 组件卡 Meter（design/katana-console/project/components/Meter，#1929）：横向仪表，三种形态。
//   bar   条：10px 凹槽里一条点阵纹理的填充（量用长度编码，不用实色），上面一行名字与数；进度、负载、敞口。
//   gauge 刻度：34px 凹槽一根指针，底下 0/25/50/75/100 的刻度；0 到 100 的读数（相对强弱之类）。
//   sync  同步率条（卡里新增，signature.md）：带齿的分段条 + 琥珀评估刻度 + 右侧大百分比；只给 paper 进度、容量使用、偏离门距离、回放进度。
// 颜色只传 tone，不传色值；名字与数字永远在（不做「只有一根条」）；文案由调用方传，包里不写。
// 填充与指针位置走 gentle 弹簧（--dur-gentle / --ease-gentle 的 CSS 形式，不用 transition 以外的手写缓动）；越过阈值那一下的脉冲在 CSS 里，tone 一变成 warn 就播一遍。
import { useId, type ReactNode } from 'react'
import type { SeverityExt } from '../../lib/severity.ts'

/** @deprecated Use `SeverityExt` from the severity helpers; kept for one version. */
export type MeterTone = 'accent' | 'ok' | 'warn' | 'danger' | 'off'
export type MeterDisplay = 'bar' | 'sync' | 'gauge'

export type MeterProps = {
  /** 名字（左上，ink-300）。 */
  label: ReactNode
  value: number
  /** 满量程，默认 100。 */
  max?: number
  /** 右边的数怎么写；不给就是四舍五入的百分数。 */
  valueText?: string
  /** accent 进行中（橙）、ok 健康（绿）、warn 受限或越界（琥珀）、danger 弱势（红）、off / neutral 停用。默认 accent。 */
  tone?: SeverityExt
  /** 形态，默认 bar。 */
  display?: MeterDisplay
  /** 刻度（跟 value 同一个单位）：bar 与 sync 画一根琥珀竖线，gauge 不用。sync 里它是评估点。 */
  mark?: number
  /** 读屏用：刻度那根线是什么（如「评估点」「上限」）；有 mark 时要给。 */
  markLabel?: string
  className?: string
}

/** value 占满量程的比例，0 到 1（越界贴边；不是有限数按 0）。纯函数。 */
export function meterShare(value: number, max = 100): number {
  if (!Number.isFinite(value) || !Number.isFinite(max) || max <= 0) return 0
  return Math.min(1, Math.max(0, value / max))
}

const TICKS = [0, 25, 50, 75, 100]

export function Meter({
  label,
  value,
  max = 100,
  valueText,
  tone = 'accent',
  display = 'bar',
  mark,
  markLabel,
  className,
}: MeterProps) {
  const id = useId()
  const share = meterShare(value, max)
  const text = valueText ?? `${Math.round(share * 100)}%`
  const markShare = mark === undefined ? null : meterShare(mark, max)
  // neutral 没有判断，画法跟停用一样（CSS 只认 off）。
  const toneAttr = tone === 'neutral' ? 'off' : tone
  const cls = `k-meter is-${display}${className ? ` ${className}` : ''}`
  const track = (
    <span
      className="k-meter-track"
      role="meter"
      aria-labelledby={`${id}-l`}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={Math.min(max, Math.max(0, Number.isFinite(value) ? value : 0))}
      aria-valuetext={
        markShare === null || !markLabel ? text : `${text} (${markLabel} ${Math.round(markShare * 100)}%)`
      }
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
        </>
      )}
    </span>
  )
  if (display === 'sync')
    return (
      <div className={cls} data-tone={toneAttr}>
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
    <div className={cls} data-tone={toneAttr}>
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
