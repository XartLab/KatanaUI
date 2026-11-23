// SPDX-License-Identifier: MIT
import { useState } from 'react'
import { cn } from '../lib/cn.ts'
import { formatCnAmount } from './format.ts'
import {
  flowDomain,
  flowLines,
  flowPath,
  flowY,
  rankLines,
  spreadFlowLabels,
  type FlowSeries,
} from './flow-race-model.ts'
import { cnLabelsZh, type FlowRaceLabels } from './labels.ts'
import { amountTone } from './seat-model.ts'

// 板块资金流向多线图（#110，信息结构取自复盘吧的资金赛跑，样子是 Graphite 的）：每个板块一条分钟累计净流入线，横轴是 09:30–15:00 的时段轴（午休不占宽度，中间一条竖虚线是 11:30/13:00），
// 右端按最新值从大到小排成一列标签（名次、名字、最新值），标签错开不重叠。线只用语义色调：最新值为正取涨色、为负取跌色（跟 data-updown），第一名的线粗一点；
// 悬停或聚焦某一行标签，对应的线加粗、其余变淡。不带数据：序列由调用方给，取不到的点断线，不当 0。文字走 labels。

export type FlowRaceProps = {
  /**
   * One cumulative net-inflow series per sector: minute points with a clock time and a value in yuan.
   * 每个板块一条序列：分钟点（时刻与累计净流入，元）。
   */
  series: readonly FlowSeries[]
  /**
   * How many lines to draw, from the top of the ranking; 8 by default.
   * 画几条（按最新值取前几名）；默认 8。
   */
  limit?: number
  /**
   * Chart height in px; 240 by default.
   * 图高（px）；默认 240。
   */
  height?: number
  /**
   * Text pack; the Simplified Chinese default is used when omitted.
   * 文案；不传用简体中文默认。
   */
  labels?: FlowRaceLabels
  /** Extra class names. */
  className?: string
}

const W = 600
const LABEL_H = 18

export function FlowRace({ series, limit = 8, height = 240, labels = cnLabelsZh.flowRace, className }: FlowRaceProps) {
  const [active, setActive] = useState<string | null>(null)
  const ranked = rankLines(flowLines(series)).slice(0, Math.max(0, Math.floor(limit)))
  const domain = flowDomain(ranked)
  const empty = ranked.length === 0 || domain === null
  // 标签想放在各自线尾的高度；没有最新值的放到底部，再错开。
  const wanted = ranked.map((line) =>
    line.last === null || domain === null ? height : flowY(line.last, domain, height),
  )
  const ys = spreadFlowLabels(wanted, LABEL_H, LABEL_H / 2, height - LABEL_H / 2)
  return (
    <section
      className={cn('k-fr', className)}
      data-slot="flow-race"
      data-active={active ?? undefined}
      aria-label={labels.region}
    >
      {empty ? (
        <p className="k-fr-empty" role="status">
          {labels.empty}
        </p>
      ) : (
        <div className="k-fr-body">
          <div className="k-fr-plot" style={{ height }}>
            <svg viewBox={`0 0 ${W} ${height}`} preserveAspectRatio="none" aria-hidden="true">
              <line className="k-fr-zero" x1={0} x2={W} y1={flowY(0, domain, height)} y2={flowY(0, domain, height)} />
              <line className="k-fr-lunch" x1={W / 2} x2={W / 2} y1={0} y2={height} />
              {[...ranked].reverse().map((line) => {
                const rank = ranked.indexOf(line)
                return (
                  <path
                    key={line.key}
                    className="k-fr-line"
                    data-slot="flow-line"
                    data-key={line.key}
                    data-rank={rank + 1}
                    data-tone={amountTone(line.last)}
                    data-current={active === line.key || undefined}
                    d={flowPath(line, domain, W, height)}
                  />
                )
              })}
            </svg>
            <span className="k-fr-scale k-fr-scale-hi">{formatCnAmount(domain[1], { signed: true })}</span>
            <span className="k-fr-scale k-fr-scale-lo">{formatCnAmount(domain[0], { signed: true })}</span>
          </div>
          <ol className="k-fr-rank" style={{ height }} aria-label={labels.ranking} data-slot="flow-rank">
            {ranked.map((line, index) => (
              <li
                key={line.key}
                className="k-fr-label"
                data-slot="flow-label"
                data-key={line.key}
                data-rank={index + 1}
                data-tone={amountTone(line.last)}
                data-current={active === line.key || undefined}
                style={{ top: ys[index]! - LABEL_H / 2, height: LABEL_H }}
                tabIndex={0}
                aria-label={labels.rankAria(index + 1, line.name, formatCnAmount(line.last, { signed: true }))}
                onMouseEnter={() => setActive(line.key)}
                onMouseLeave={() => setActive(null)}
                onFocus={() => setActive(line.key)}
                onBlur={() => setActive(null)}
              >
                <span className="k-fr-no">{index + 1}</span>
                <span className="k-fr-name">{line.name}</span>
                <span className="k-fr-value">{formatCnAmount(line.last, { signed: true })}</span>
              </li>
            ))}
          </ol>
          <div className="k-fr-axis" aria-hidden="true">
            <span>{labels.axis.from}</span>
            <span>{labels.axis.mid}</span>
            <span>{labels.axis.to}</span>
          </div>
        </div>
      )}
    </section>
  )
}
