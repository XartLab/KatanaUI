// SPDX-License-Identifier: MIT
import type { ReactNode } from 'react'
import { cn } from '../lib/cn.ts'
import { cnLabelsZh, type SentimentLabels } from './labels.ts'
import { DASH, readCnValue, type CnValue } from './value.ts'

// 情绪温度（#110，信息结构取自复盘吧的情绪温度，样子是 Graphite 的）：0–100 的读数加五档色带（冰点 / 低迷 / 中性 / 升温 / 高潮，各占 20 分），
// 读数落在哪一档那一档全亮、其余淡一些；色带下面是调用方写的口径说明（例如「规则评分 · 未历史校准」）；再下面是今昨对比两列（涨停、跌停、封率、开板）。
// 评分怎么算、口径、历史校准都不在包里：分数与说明由调用方给。涨跌色只用语义色调（冰点 = 跌色，高潮 = 涨色，跟 data-updown），文字走 labels。取不到写「—」。

/** 今日或昨日的四项统计：涨停、跌停、开板是家数，封率是百分数（62.5 就是 62.5%）。 */
export type SentimentStats = {
  /** Limit-up count. */
  limitUp?: CnValue
  /** Limit-down count. */
  limitDown?: CnValue
  /** Seal rate as a percentage (62.5 means 62.5%). */
  sealRate?: CnValue
  /** Count of stocks that touched the limit and opened. */
  broken?: CnValue
}

export type SentimentGaugeProps = {
  /**
   * The score from 0 to 100; null or missing writes a dash.
   * 评分 0 到 100；空写「—」。
   */
  score: number | null | undefined
  /**
   * Why the score is unavailable (shown on hover).
   * 评分取不到的原因（悬停）。
   */
  reason?: string
  /**
   * A caller-written line about how the score is made, such as its basis and whether it is calibrated.
   * 评分口径的说明，由调用方写（评分怎么算、有没有历史校准）。
   */
  basis?: ReactNode
  /**
   * Today's figures for the comparison; leave both sides out to draw no comparison.
   * 今日的数，用于今昨对比；两边都不给就不画对比。
   */
  today?: SentimentStats
  /**
   * Yesterday's figures for the comparison.
   * 昨日的数。
   */
  yesterday?: SentimentStats
  /**
   * Text pack; the Simplified Chinese default is used when omitted.
   * 文案；不传用简体中文默认。
   */
  labels?: SentimentLabels
  /** Extra class names. */
  className?: string
}

/** 档位 0 到 4（冰点…高潮），每档 20 分，100 分落在最高档；越界按边算；不是有限数返回 null。纯函数。 */
export function sentimentLevel(score: number | null | undefined): 0 | 1 | 2 | 3 | 4 | null {
  if (typeof score !== 'number' || !Number.isFinite(score)) return null
  return Math.min(4, Math.max(0, Math.floor(score / 20))) as 0 | 1 | 2 | 3 | 4
}

const ROWS = ['limitUp', 'limitDown', 'sealRate', 'broken'] as const

const writeStat = (key: (typeof ROWS)[number], value: number | null) =>
  value === null ? DASH : key === 'sealRate' ? `${value.toFixed(1)}%` : value.toLocaleString('en-US')

export function SentimentGauge({
  score,
  reason,
  basis,
  today,
  yesterday,
  labels = cnLabelsZh.sentiment,
  className,
}: SentimentGaugeProps) {
  const level = sentimentLevel(score)
  const clamped = level === null ? null : Math.min(100, Math.max(0, score as number))
  const levelName = level === null ? DASH : labels.levels[level]
  const scoreText = clamped === null ? DASH : String(Math.round(clamped))
  return (
    <section
      className={cn('k-sentiment', className)}
      data-slot="sentiment-gauge"
      data-level={level ?? undefined}
      aria-label={labels.region}
    >
      <div className="k-sentiment-head">
        <b
          className="k-sentiment-score"
          data-slot="sentiment-score"
          role="img"
          aria-label={labels.scoreAria(scoreText, levelName)}
          title={clamped === null ? (reason ?? labels.unavailable) : undefined}
        >
          {scoreText}
        </b>
        <span className="k-sentiment-caption">{labels.scoreCaption}</span>
        <span className="k-sentiment-level" data-slot="sentiment-level">
          {levelName}
        </span>
      </div>
      <div className="k-sentiment-band" data-slot="sentiment-band" aria-hidden="true">
        {labels.levels.map((name, index) => (
          <span
            key={name}
            className="k-sentiment-seg"
            data-seg={index}
            data-current={index === level ? 'true' : undefined}
          />
        ))}
        {clamped !== null && <i className="k-sentiment-marker" style={{ left: `${clamped}%` }} />}
      </div>
      <div className="k-sentiment-names" aria-hidden="true">
        {labels.levels.map((name) => (
          <span key={name}>{name}</span>
        ))}
      </div>
      {basis !== undefined && (
        <p className="k-sentiment-basis" data-slot="sentiment-basis">
          {basis}
        </p>
      )}
      {(today !== undefined || yesterday !== undefined) && (
        <table className="k-sentiment-compare" data-slot="sentiment-compare">
          <thead>
            <tr>
              <td />
              <th scope="col">{labels.today}</th>
              <th scope="col">{labels.yesterday}</th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map((key) => (
              <tr key={key} data-key={key}>
                <th scope="row">{labels.rows[key]}</th>
                {([today, yesterday] as const).map((stats, column) => {
                  const { value, reason: why } = readCnValue(stats?.[key])
                  return (
                    <td
                      key={column}
                      data-col={column === 0 ? 'today' : 'yesterday'}
                      data-unavailable={value === null ? 'true' : undefined}
                      title={value === null ? (why ?? labels.unavailable) : undefined}
                    >
                      {writeStat(key, value)}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  )
}
