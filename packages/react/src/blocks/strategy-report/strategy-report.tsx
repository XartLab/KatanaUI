// SPDX-License-Identifier: MIT
/**
 * Backtest report: overview, performance, trade analysis, risk ratios, trade list and properties tabs.
 * 策略报告；指标定义在 strategy-report-metrics.ts，props 与文案 strategy-report-types.ts，各页签 strategy-report-panes.tsx（体检 §7 拆分）。
 */
import { useMemo, useState } from 'react'
import { cn } from '../../lib/cn.ts'
import { MeasuredSkeleton } from '../../katana/measured-skeleton.tsx'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../primitives/tabs.tsx'
import { ToggleGroup, ToggleGroupItem } from '../../primitives/toggle-group.tsx'
import { EquityCurve } from '../../quant/equity-curve.tsx'
import { KPI, METRICS, PERFORMANCE, RATIOS, SIDES, TABS, type StrategyReportTab } from './strategy-report-metrics.ts'
import { computeReport, filterTrades, type SideFilter } from './strategy-report-model.ts'
import {
  AnalysisPane,
  MetricTable,
  PropertiesPane,
  TradesPane,
  Value,
  useTradesState,
} from './strategy-report-panes.tsx'
import type { StrategyReportProps } from './strategy-report-types.ts'

export type { MetricKey, StrategyReportTab } from './strategy-report-metrics.ts'
export type {
  StrategyReportFormat,
  StrategyReportLabels,
  StrategyReportProperty,
  StrategyReportPropertyGroup,
  StrategyReportProps,
} from './strategy-report-types.ts'

// 策略报告（#35）：回测结果的一整页——概览（关键读数、权益曲线与回撤、同期买入持有）、绩效（全部 / 多 / 空三列的指标表）、交易分析
// （盈亏分布、持仓时长分布、连续盈亏）、风险比率、交易列表（每笔进出场，行可展开）、属性（参数与回测设置）。页签切换，顶上「全部 / 多 / 空」。
// 页签结构照 TradingView 策略测试器（https://www.tradingview.com/support/solutions/43000681733-strategy-tester/ ，2026-11-15 读到概览页；
// 其余页签没读到页面，按 issue 的结构做，待核对）。指标全由逐笔平仓算（strategy-report-model.ts），件不认识任何应用或交易所；
// 数据、数字格式与全部文字由调用方传，包里没有语言。「多 / 空」只管概览、交易分析与交易列表；绩效与风险比率的表三列并排，当前那列加亮。

export function StrategyReport({
  trades,
  loading,
  initialCapital,
  periodsPerYear,
  riskFree,
  benchmark,
  properties,
  format,
  labels,
  badge,
  defaultTab = 'overview',
  defaultSide = 'all',
  onTabChange,
  onSideChange,
  onExport,
  className,
}: StrategyReportProps) {
  const [tab, setTab] = useState<StrategyReportTab>(defaultTab)
  const [side, setSide] = useState<SideFilter>(defaultSide)
  const tradesState = useTradesState()
  const options = { initialCapital, periodsPerYear, riskFree }
  const stats = useMemo(
    () => ({
      all: computeReport(trades, options),
      long: computeReport(filterTrades(trades, 'long'), options),
      short: computeReport(filterTrades(trades, 'short'), options),
    }),
    // options 是三个原始值的集合，按值依赖。
    // oxlint-disable-next-line react-hooks/exhaustive-deps
    [trades, initialCapital, periodsPerYear, riskFree],
  )
  const current = stats[side]
  const shown = useMemo(() => filterTrades(trades, side), [trades, side])

  const changeTab = (next: string) => {
    setTab(next as StrategyReportTab)
    onTabChange?.(next as StrategyReportTab)
  }
  const changeSide = (next: string) => {
    if (!next) return
    setSide(next as SideFilter)
    onSideChange?.(next as SideFilter)
  }

  const equityPoints = useMemo(
    () =>
      current.curve.map((point) => ({
        time: point.time,
        equity: point.cumulative,
        drawdown: point.drawdown,
        title: `${point.trade === 0 ? labels.equity.axisName : `#${point.trade}`} · ${format.time(point.time)}`,
        equityText: format.money(point.cumulative),
        drawdownText: format.money(point.drawdown),
      })),
    [current.curve, format, labels.equity.axisName],
  )
  const buyHold =
    benchmark && current.curve.length > 0 ? benchmark.at(current.curve.at(-1)!.time) - initialCapital : null

  const empty = trades.length === 0

  // 概览页真内容；加载态的骨架包在它外面（量出来的骨架要在同一个位置把它换出来）。
  const overview = empty ? (
    <div className="k-sr-empty">{labels.empty}</div>
  ) : (
    <>
      <div className="k-sr-kpis" data-slot="strategy-report-kpis">
        {KPI.map((key) => (
          <div key={key} className="k-sr-kpi" data-metric={key}>
            <span className="k-sr-kpi-label">{labels.metrics[key]}</span>
            <strong className="k-sr-kpi-value">
              <Value metric={METRICS[key]} value={METRICS[key].get(current)} format={format} />
            </strong>
            {key === 'netProfit' && buyHold !== null ? (
              <small className="k-sr-kpi-sub" data-slot="strategy-report-buyhold">
                {labels.metrics.buyHold} {format.money(buyHold)}
              </small>
            ) : null}
          </div>
        ))}
      </div>
      {current.curve.length > 1 ? (
        <EquityCurve
          points={equityPoints}
          title={labels.equity.title}
          hint={labels.equity.hint}
          name={labels.equity.name}
          label={labels.equity.label}
          benchmark={
            benchmark
              ? {
                  name: benchmark.name,
                  values: current.curve.map((p) => benchmark.at(p.time) - initialCapital),
                }
              : undefined
          }
          axis={(v) => format.money(v)}
          formatTime={format.axisTime ?? format.time}
          labels={labels.equity}
        />
      ) : null}
    </>
  )
  // 加载时的指标卡：标签是真的，数值用 format.money(0) 占位（只为排版，骨架里看不到字）。
  const kpiSample = (
    <div className="k-sr-kpis" data-slot="strategy-report-kpis">
      {KPI.map((key) => (
        <div key={key} className="k-sr-kpi" data-metric={key}>
          <span className="k-sr-kpi-label">{labels.metrics[key]}</span>
          <strong className="k-sr-kpi-value">
            <span>{format.money(0)}</span>
          </strong>
          {key === 'netProfit' && benchmark ? (
            <small className="k-sr-kpi-sub">
              {labels.metrics.buyHold} {format.money(0)}
            </small>
          ) : null}
        </div>
      ))}
    </div>
  )
  return (
    <section
      className={cn('k-sr', className)}
      data-slot="strategy-report"
      data-side={side}
      data-tab={tab}
      aria-label={labels.report}
    >
      <Tabs value={tab} onValueChange={changeTab} className="k-sr-tabs">
        <div className="k-sr-top">
          <TabsList variant="line" aria-label={labels.tabs.group}>
            {TABS.map((key) => (
              <TabsTrigger key={key} value={key}>
                {labels.tabs[key]}
              </TabsTrigger>
            ))}
          </TabsList>
          <div className="k-sr-top-end">
            {badge === undefined ? null : <span className="k-sr-badge">{badge}</span>}
            <ToggleGroup size="sm" aria-label={labels.side.group} value={side} onValueChange={changeSide}>
              {SIDES.map((key) => (
                <ToggleGroupItem key={key} value={key}>
                  {labels.side[key]}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>
        </div>

        <div className="k-sr-body">
          <TabsContent value="overview" className="k-sr-pane">
            {loading === undefined ? (
              overview
            ) : (
              <MeasuredSkeleton loading={loading} label={labels.loading ?? labels.report}>
                <div className="k-sr-overview">{loading ? kpiSample : overview}</div>
              </MeasuredSkeleton>
            )}
          </TabsContent>

          <TabsContent value="performance" className="k-sr-pane">
            <MetricTable
              rows={PERFORMANCE}
              columns={stats}
              active={side}
              labels={labels}
              format={format}
              caption={labels.tabs.performance}
            />
          </TabsContent>

          <TabsContent value="analysis" className="k-sr-pane">
            <AnalysisPane shown={shown} current={current} labels={labels} format={format} />
          </TabsContent>

          <TabsContent value="ratios" className="k-sr-pane">
            <MetricTable
              rows={RATIOS}
              columns={stats}
              active={side}
              labels={labels}
              format={format}
              caption={labels.tabs.ratios}
            />
          </TabsContent>

          <TabsContent value="trades" className="k-sr-pane k-sr-pane-grid">
            <TradesPane shown={shown} labels={labels} format={format} onExport={onExport} state={tradesState} />
          </TabsContent>

          <TabsContent value="properties" className="k-sr-pane">
            <PropertiesPane properties={properties} />
          </TabsContent>
        </div>
      </Tabs>
    </section>
  )
}
