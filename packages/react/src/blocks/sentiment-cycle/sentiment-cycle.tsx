// SPDX-License-Identifier: MIT
/**
 * Market sentiment cycle readout: today's score, a 0–100 gauge, the recent trend with a stage band, and side metrics.
 * 情绪周期读数（#11，开盘啦「市场情绪」对照）：左上大号情绪分与昨日差、当前阶段，右上 0–100 刻度仪表（Meter gauge）；
 * 中间近 N 日走势线，线下叠阶段带（RegimeStrip，颜色是类别不是好坏）；底下一排小线图（SmallMultiples：涨停数、连板高度、亏钱数、封板率这类，同步十字线）。
 * 口径不在件里：情绪分、每天落在哪个阶段、阶段有几个叫什么，全由调用方算好传；件只画。数字写法、文字也由调用方传，包里不带语言。
 * 版式取 TradingView 小组件的读数手感（大号无衬线加 tabular-nums、次要信息灰一档、细线），配色走工作台 Graphite：走势线与分项小线图都是中性前景色（橙只给焦点，#50），阶段用状态语气色（--k-status-*），昨日差走涨跌 tone（跟 data-updown 换红绿）。
 */
import { cn } from '../../lib/cn.ts'
import { EndMarker } from '../../lib/chart/chart-kit/end-marker.tsx'
import { linePath, makePlot, PLOT_W } from '../../lib/chart/series-geometry.ts'
import { Meter } from '../meter/meter.tsx'
import { RegimeStrip } from '../regime-strip/regime-strip.tsx'
import { SmallMultiples } from '../small-multiples.tsx'
import {
  scoreDelta,
  stageSegments,
  type SentimentDay,
  type SentimentMetric,
  type SentimentStage,
} from './sentiment-model.ts'

export type { SentimentDay, SentimentMetric, SentimentStage } from './sentiment-model.ts'

/** Texts of SentimentCycle (the package ships no text). */
export type SentimentCycleLabels = {
  /** Accessible name of the whole readout. 整块的读屏名。 */
  title: string
  /** Name over the big score (「情绪分」). 大号读数上的名字。 */
  score: string
  /** Name of the gauge (「情绪温度」). 刻度仪表的名字。 */
  gauge: string
  /** Name of the trend line (「近 20 日」). 走势线的名字。 */
  trend: string
  /** Accessible name of the stage band. 阶段带的读屏名。 */
  band: string
  /** Accessible name of the side metrics. 小线图阵列的读屏名。 */
  metrics: string
  /** Mark after today's stage in the legend (「当前」). 图例里今天所在阶段后的标记。 */
  current: string
  /** Text when there are no days. 没有数据时的字。 */
  empty: string
}

export type SentimentCycleProps = {
  /** Days oldest first; the last one is today. Scores are on a 0–100 scale. 从旧到新，最后一天是今天；情绪分按 0 到 100 传。 */
  days: readonly SentimentDay[]
  /** Stages in legend order. 阶段，按图例次序。 */
  stages: readonly SentimentStage[]
  /** Side metrics, one value per day. 旁边的小线图，每天一个值。 */
  metrics?: readonly SentimentMetric[]
  /** Texts. */
  labels: SentimentCycleLabels
  /** How a score is written; defaults to a whole number. 情绪分的写法，默认取整。 */
  formatScore?: (score: number) => string
  /** Highlight a stage on the band (others dim). 高亮某个阶段。 */
  activeStage?: string | null
  /** Legend items become toggles: pick a stage, null to clear. 给了图例每项可点，再点同一项传 null。 */
  onStageSelect?: (stage: SentimentStage | null) => void
  /** Extra class name on the root. */
  className?: string
}

const TREND_H = 64
// 阶段色读状态语气（--k-status-*）：#11 第二批评审，类别色（紫蓝橙粉）偏艳、跟 Graphite 的油画颜料信号色不搭。字面量写 token，主题检查按字面量认。
const STAGE_COLOR: Record<SentimentStage['tone'], string> = {
  neutral: 'var(--k-status-neutral-foreground)',
  ok: 'var(--k-status-ok-foreground)',
  warn: 'var(--k-status-warn-foreground)',
  danger: 'var(--k-status-danger-foreground)',
}
const DASH = '—'

export function SentimentCycle({
  days,
  stages,
  metrics = [],
  labels,
  formatScore = (score) => String(Math.round(score)),
  activeStage = null,
  onStageSelect,
  className,
}: SentimentCycleProps) {
  const today = days.at(-1)
  if (!today) {
    return (
      <section className={cn('k-senti', className)} data-slot="sentiment-cycle" aria-label={labels.title}>
        <p className="k-senti-empty" role="status">
          {labels.empty}
        </p>
      </section>
    )
  }
  const stage = stages.find((item) => item.id === today.stage)
  const delta = scoreDelta(days)
  const deltaTone = delta === null || Math.round(delta) === 0 ? 'flat' : delta > 0 ? 'up' : 'down'
  const deltaText = delta === null ? DASH : `${delta > 0 ? '+' : delta < 0 ? '−' : ''}${formatScore(Math.abs(delta))}`
  const scores = days.map((day) => day.score)
  // band：第 i 天的点画在第 i 格的正中，跟下面阶段带的格子（[i, i+1]）对齐。
  const plot = makePlot(days.length, [0, 100], { height: TREND_H, padTop: 6, padBottom: 6, band: true, exact: true })
  const last = days.length - 1
  return (
    <section className={cn('k-senti', className)} data-slot="sentiment-cycle" aria-label={labels.title}>
      <div className="k-senti-top">
        <div className="k-senti-read" role="status" data-slot="sentiment-read">
          <span className="k-senti-name">{labels.score}</span>
          <span className="k-senti-value">
            <span className="k-senti-score" data-slot="sentiment-score">
              {Number.isFinite(today.score) ? formatScore(today.score) : DASH}
            </span>
            <span className="k-senti-delta" data-slot="sentiment-delta" data-tone={deltaTone}>
              {deltaText}
            </span>
          </span>
          {stage ? (
            <span className="k-senti-stage" data-slot="sentiment-stage" data-stage={stage.id}>
              <i style={{ background: STAGE_COLOR[stage.tone] }} aria-hidden="true" />
              {stage.name}
            </span>
          ) : null}
        </div>
        <Meter
          className="k-senti-gauge"
          label={labels.gauge}
          value={Number.isFinite(today.score) ? today.score : 0}
          valueText={Number.isFinite(today.score) ? formatScore(today.score) : DASH}
          display="gauge"
          tone={stage?.tone ?? 'neutral'}
        />
      </div>
      <div className="k-senti-trend" data-slot="sentiment-trend">
        <div className="k-senti-trend-head">
          <span>{labels.trend}</span>
          <span className="k-senti-range">
            {days[0]!.date} – {today.date}
          </span>
        </div>
        <div className="k-senti-plot" style={{ height: TREND_H }}>
          <svg viewBox={`0 0 ${PLOT_W} ${TREND_H}`} preserveAspectRatio="none" aria-hidden="true">
            <line className="k-senti-mid" x1={0} x2={PLOT_W} y1={plot.yAt(50)} y2={plot.yAt(50)} />
            <path className="k-senti-line" data-slot="sentiment-line" d={linePath(scores, plot)} />
          </svg>
          {Number.isFinite(today.score) && <EndMarker x={plot.xAt(last)} y={plot.yAt(today.score)} />}
        </div>
        <RegimeStrip
          segments={stageSegments(days)}
          states={stages.map((item) => ({ id: item.id, name: item.name, color: 1 as const, tone: item.tone }))}
          scale={(t) => t / days.length}
          label={labels.band}
          describe={(segment, state) =>
            `${state.name} · ${days[segment.from]?.date ?? ''}–${days[segment.to - 1]?.date ?? ''}`
          }
          current={today.stage}
          labels={{ current: labels.current }}
          activeState={activeStage}
          onSelect={
            onStageSelect ? (state) => onStageSelect(stages.find((s) => s.id === state?.id) ?? null) : undefined
          }
        />
      </div>
      {metrics.length > 0 && (
        <SmallMultiples
          className="k-senti-metrics"
          items={metrics}
          label={labels.metrics}
          formatValue={(value) => String(value)}
          formatX={(index) => days[index]?.date ?? ''}
          minWidth={120}
          height={32}
        />
      )}
    </section>
  )
}
