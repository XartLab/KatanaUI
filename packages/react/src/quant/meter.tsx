// SPDX-License-Identifier: MIT
// 仪表（组件卡 Meter，2026-11-14 读 design/katana-console/project/components/Meter）：三种形态，同一个读数语法。
//   bar：槽 10px、bg-000 + recess + hairline，填充用点阵纹理（4px 实 2px 空，60% 透明）；量永远用条长编码，不靠颜色深浅。
//   gauge：34px 高的凹槽，中线 1px，指针 2px，底部刻度 0/25/50/75/100；弱势（< weakBelow）指针转 signal-red，受锁转 signal-amber。
//   sync：分段齿条 + amber 刻度（评估点）+ 右侧 display-dense 大百分比；只给 paper 进度、容量使用、偏离门距离、回放进度。
// 调用方不传颜色，只传 tone：accent（进行中）/ ok（健康）/ warn（受限或越界）/ off（停用）。
// 限额板的用法：传 soft（接近）与 hard（越限），状态按「达到」算（已用 ≥ 软限是 warn，≥ 硬限是 breach），两根刻度分别是 amber 与 red，不靠颜色单独表达：
// 根上带 data-state，右上角可写状态词（stateLabels），读屏有 role="meter" 与 valueText。越过阈值时条体脉冲一次（CSS 动画只在状态变成 warn / breach 时播）。
// 外观（点阵纹理、强调色、数字字体）读 theme/chart-kit.css 里的变量。
import type { CSSProperties } from 'react'
import { cn } from '../lib/cn.ts'
import { gaugeShare, meterModel, type MeterState } from './meter-model.ts'
import type { ChartTone } from './chart-kit/dot-fill.tsx'

export type MeterProps = {
  /** 已用 / 读数（和 max 同一把尺）。 */
  value: number
  /** 满刻度，默认 100（gauge 与 sync 固定按 0 到 100 读，传 max 无效）。 */
  max?: number
  display?: 'bar' | 'gauge' | 'sync'
  /** 调用方只传语义；有 soft / hard 时状态达到 warn 或 breach 就换成 warn。 */
  tone?: ChartTone
  /** 软限与硬限（可以只给一个）。 */
  soft?: number
  hard?: number
  /** 量的是什么（左上角的字，也是读屏名）。 */
  label: string
  /** 读屏整句，例：「已用 72，软限 80，硬限 100」；由调用方按界面语言写。 */
  valueText: string
  /** 读数写成什么字（右上角；sync 里是右侧大百分比）。 */
  formatValue: (value: number) => string
  /** 三种状态各写什么词（右上角、读数后面）；不给就不写。 */
  stateLabels?: Partial<Record<MeterState, string>>
  /** 刻度小字（软限、硬限各一个，bar 里写在条下面）。 */
  tickLabels?: { soft?: string; hard?: string }
  /** gauge：弱势线，读数低于它指针转红（Meter 卡写 30）；不给不转。 */
  weakBelow?: number
  /** gauge：受锁，指针转 amber。 */
  locked?: boolean
  /** sync：评估点（0 到 100），画 amber 刻度。 */
  mark?: number
  className?: string
}

const pct = (x: number) => `${x * 100}%`
const GAUGE_TICKS = [0, 25, 50, 75, 100]
const SYNC_TEETH = 20

export function Meter({
  value,
  max = 100,
  display = 'bar',
  tone = 'accent',
  soft,
  hard,
  label,
  valueText,
  formatValue,
  stateLabels,
  tickLabels,
  weakBelow,
  locked = false,
  mark,
  className,
}: MeterProps) {
  const full = display === 'bar' ? max : 100
  const model = meterModel({ value, max: full, soft, hard })
  const shownTone: ChartTone = model.state === 'ok' ? tone : 'warn'
  const word = stateLabels?.[model.state]
  const weak = display === 'gauge' && weakBelow !== undefined && value < weakBelow
  const readout = (
    <span className="k-meter-value" data-slot="meter-value">
      {formatValue(value)}
      {word ? <em className="k-meter-state">{word}</em> : null}
    </span>
  )
  const aria = {
    role: 'meter',
    'aria-label': label,
    'aria-valuemin': 0,
    'aria-valuemax': model.max,
    'aria-valuenow': Math.min(Math.max(value, 0), model.max),
    'aria-valuetext': valueText,
  } as const
  const ticks = (
    <>
      {model.soft !== null && (
        <span className="k-meter-tick is-soft" data-slot="meter-soft" style={{ left: pct(model.soft) }} />
      )}
      {model.hard !== null && (
        <span className="k-meter-tick is-hard" data-slot="meter-hard" style={{ left: pct(model.hard) }} />
      )}
    </>
  )

  if (display === 'sync') {
    const lit = Math.round(model.value * SYNC_TEETH)
    return (
      <div
        className={cn('k-meter k-meter-sync', className)}
        data-slot="meter"
        data-display="sync"
        data-tone={shownTone}
        data-state={model.state}
      >
        <div className="k-meter-sync-body">
          <span className="k-meter-label">{label}</span>
          <div className="k-meter-teeth" {...aria}>
            {Array.from({ length: SYNC_TEETH }, (_, i) => (
              <i key={i} className="k-meter-tooth" data-on={i < lit ? 'true' : undefined} />
            ))}
            {mark !== undefined && (
              <span className="k-meter-mark" data-slot="meter-mark" style={{ left: pct(gaugeShare(mark)) }} />
            )}
          </div>
        </div>
        <span className="k-meter-big" data-slot="meter-big">
          {formatValue(value)}
        </span>
      </div>
    )
  }

  if (display === 'gauge') {
    return (
      <div
        className={cn('k-meter k-meter-gauge', className)}
        data-slot="meter"
        data-display="gauge"
        data-tone={shownTone}
        data-state={model.state}
        data-pin={locked ? 'locked' : weak ? 'weak' : 'normal'}
      >
        <div className="k-meter-head">
          <span className="k-meter-label">{label}</span>
          {readout}
        </div>
        <div className="k-meter-gauge-box" {...aria}>
          <span className="k-meter-base" />
          <span className="k-meter-pin" data-slot="meter-pin" style={{ '--k-pin': model.value } as CSSProperties} />
          <span className="k-meter-gauge-ticks" aria-hidden="true">
            {GAUGE_TICKS.map((t) => (
              <span key={t}>{t}</span>
            ))}
          </span>
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn('k-meter', className)}
      data-slot="meter"
      data-display="bar"
      data-tone={shownTone}
      data-state={model.state}
    >
      <div className="k-meter-head">
        <span className="k-meter-label">{label}</span>
        {readout}
      </div>
      <div className="k-meter-track" {...aria}>
        <span className="k-meter-fill k-dotfill" data-slot="meter-fill" style={{ width: pct(model.value) }} />
        {ticks}
      </div>
      {tickLabels && (model.soft !== null || model.hard !== null) && (
        <div className="k-meter-ticks" aria-hidden="true">
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
