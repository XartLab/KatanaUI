// SPDX-License-Identifier: MIT
import { Pause, Play, Square } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { cn } from '../../lib/cn.ts'
import { HoldToConfirm } from '../../katana/hold-to-confirm.tsx'
import { Led, type LedState } from '../../katana/led.tsx'
import { ChipGroup } from '../../patterns/chip-group.tsx'
import { Button } from '../../primitives/button.tsx'
import { ToggleGroup, ToggleGroupItem } from '../../primitives/toggle-group.tsx'
import { PnlText } from '../../quant/pnl-text.tsx'
import { SparkTile, type SparkTileProps } from '../../quant/spark-tile.tsx'
import { meterShare } from '../../quant/meter.tsx'
import {
  filterEvents,
  quotaTone,
  sortEvents,
  sortLinks,
  sortStrategies,
  strategyActions,
  summarize,
  type EventSeverity,
  type LinkState,
  type MonitorEvent,
  type MonitorLink,
  type MonitorStrategy,
  type StrategyAction,
  type StrategyStatus,
} from './system-monitor-model.ts'

// 交易系统监控（#36）：一眼看出系统是否正常。四块：顶上连接状态条（每个连接 / 交易所 API / 行情源 / 引擎一盏 StatusLED + 名称 + 延迟 + 最后心跳，异常的排前面）；
// 策略实例表；延迟与错误率小图（SparkTile）；事件流（按严重程度着色，可按类别与严重程度筛）。急停放面板头，按住确认（HoldToConfirm）。
// 出处：NinjaTrader 8 帮助页 Control Center 的 Strategies 页签（https://static.ninjatrader.com/support/helpGuides/nt8/strategies_tab.htm ，2026-11-15 读到：
// 每个策略一行，列有账户、品种、持仓、已实现与未实现盈亏、成交笔数、连接、Enabled 勾选；右键有启用 / 停用、全部同步、按账户与「只看活动策略」过滤）；
// Hummingbot 状态文档（https://www.hummingbot.org/client/status/ ，2026-11-15 读到：status 命令给出交易所连接状态与错误信息、活动订单与余额，
// 不同策略输出不同；strategy 自己的状态字段该页没写，待核对）。只取「一屏看全连接、策略、错误」的结构，实现原创。
// 状态不只靠颜色：每盏灯旁边有字，出错的另有边线。没有数据的块写 labels.notConnected，不补样本。件不认识任何应用或交易所，数据与文字全由调用方传。

export type SystemMonitorLabels = {
  /** 整个件的读屏名。 */
  monitor: string
  /** 面板头标题。 */
  heading: string
  /** 没有连接 / 没有数据时每块写的字。 */
  notConnected: string
  links: string
  strategies: string
  metrics: string
  events: string
  linkState: Record<LinkState, string>
  strategyStatus: Record<StrategyStatus, string>
  severity: Record<EventSeverity, string>
  /** 「3 秒前」：传入已过去的秒数。 */
  ago: (seconds: number) => string
  /** 「42 ms」。 */
  latency: (ms: number) => string
  /** 最后心跳那一段的前缀，如「心跳」，没收到过写 noBeat。 */
  heartbeat: string
  noBeat: string
  /** 策略表列名。 */
  columns: {
    name: string
    account: string
    symbol: string
    status: string
    position: string
    pnl: string
    quota: string
    lastTrade: string
    actions: string
  }
  /** 启停按钮的名字（读屏与悬停）。 */
  actions: Record<StrategyAction, string>
  /** 急停按钮上的字、按住提示（「按住 2 秒，停止全部策略」）、填满后的字。 */
  emergencyStop: string
  emergencyHint: string
  emergencyDone: string
  /** 事件筛选：类别芯片组与严重程度分段的读屏名、「全部」「清除」、没有命中。 */
  eventKinds: string
  eventSeverity: string
  all: string
  clearKinds: string
  noEvents: string
  /** 额度条读屏：「额度已用 80%」。 */
  quotaUsed: (percent: number) => string
}

export type SystemMonitorMetric = Pick<
  SparkTileProps,
  'label' | 'value' | 'unit' | 'series' | 'sparkLabel' | 'threshold' | 'state' | 'note' | 'trendTone'
> & { key: string }

export type SystemMonitorProps = {
  links: readonly MonitorLink[]
  strategies: readonly MonitorStrategy[]
  /** 延迟、错误率等小图；一个都没有就写 notConnected。 */
  metrics: readonly SystemMonitorMetric[]
  events: readonly MonitorEvent[]
  eventKinds: readonly { value: string; label: string }[]
  /** 当前毫秒时间：「3 秒前」按它算，调用方定时更新（件不在渲染里取时间）。 */
  now: number
  labels: SystemMonitorLabels
  /** 启停回调：件只发请求，状态变化由调用方改数据回传。 */
  onStrategyAction?: (strategy: MonitorStrategy, action: StrategyAction) => void
  /** 急停：按住确认后回调。不给就没有急停按钮。 */
  onEmergencyStop?: () => void
  /** 额度条转琥珀的占用比（0 到 1）；不给不预警，越界（≥ 1）总是红。预警线属于账户风控，由调用方给。 */
  quotaWarnAt?: number
  /** 连接条上点一个连接。 */
  onLinkPick?: (link: MonitorLink) => void
  className?: string
}

const LINK_LED: Record<LinkState, LedState> = { ok: 'ok', degraded: 'warn', error: 'danger', offline: 'off' }
const STATUS_LED: Record<StrategyStatus, LedState> = { running: 'ok', paused: 'warn', stopped: 'off', error: 'danger' }
const SEVERITY_LED: Record<EventSeverity, LedState> = { info: 'off', warn: 'warn', error: 'danger' }
const ACTION_ICON: Record<StrategyAction, ReactNode> = {
  start: <Play aria-hidden />,
  pause: <Pause aria-hidden />,
  stop: <Square aria-hidden />,
}

const ago = (labels: SystemMonitorLabels, now: number, at: number) =>
  labels.ago(Math.max(0, Math.floor((now - at) / 1000)))

export function SystemMonitor({
  links,
  strategies,
  metrics,
  events,
  eventKinds,
  now,
  labels,
  onStrategyAction,
  onEmergencyStop,
  quotaWarnAt,
  onLinkPick,
  className,
}: SystemMonitorProps) {
  const [kinds, setKinds] = useState<string[]>([])
  const [minSeverity, setMinSeverity] = useState<EventSeverity>('info')
  const sum = summarize(links, strategies)
  const shownEvents = filterEvents(sortEvents(events), { kinds, minSeverity })
  const kindName = (value: string) => eventKinds.find((k) => k.value === value)?.label ?? value
  const bad = sum.linkIssues + sum.strategyErrors > 0

  return (
    <section className={cn('k-sysmon', className)} aria-label={labels.monitor} data-health={bad ? 'bad' : 'ok'}>
      <header className="k-sysmon-head">
        <h3>{labels.heading}</h3>
        {onEmergencyStop && (
          <HoldToConfirm
            onConfirm={onEmergencyStop}
            hint={labels.emergencyHint}
            confirmedLabel={labels.emergencyDone}
            disabled={strategies.length === 0}
          >
            {labels.emergencyStop}
          </HoldToConfirm>
        )}
      </header>

      <div className="k-sysmon-body" tabIndex={0}>
        <section aria-label={labels.links} className="k-sysmon-links">
          {links.length === 0 ? (
            <div className="k-sysmon-empty">{labels.notConnected}</div>
          ) : (
            <ul className="k-sysmon-linklist">
              {sortLinks(links).map((link) => {
                const text = labels.linkState[link.state]
                const body = (
                  <>
                    <Led state={LINK_LED[link.state]} label={text} bare={link.state === 'offline'} />
                    <span className="k-sysmon-link-name">{link.name}</span>
                    <span className="k-sysmon-link-state">{text}</span>
                    <span className="k-sysmon-link-num">
                      {link.latencyMs == null ? '—' : labels.latency(link.latencyMs)}
                    </span>
                    <span className="k-sysmon-link-beat">
                      {link.lastBeat == null
                        ? `${labels.heartbeat} ${labels.noBeat}`
                        : `${labels.heartbeat} ${ago(labels, now, link.lastBeat)}`}
                    </span>
                  </>
                )
                const title = [link.group, link.detail].filter(Boolean).join(' · ') || undefined
                return (
                  <li key={link.id} className="k-sysmon-link" data-state={link.state} title={title}>
                    {onLinkPick ? (
                      <button type="button" className="k-sysmon-link-body" onClick={() => onLinkPick(link)}>
                        {body}
                      </button>
                    ) : (
                      <div className="k-sysmon-link-body">{body}</div>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        <section aria-label={labels.metrics} className="k-sysmon-metrics">
          {metrics.length === 0 ? (
            <div className="k-sysmon-empty">{labels.notConnected}</div>
          ) : (
            metrics.map(({ key, ...tile }) => <SparkTile key={key} trendTone="neutral" {...tile} />)
          )}
        </section>

        <section aria-label={labels.strategies} className="k-sysmon-strategies">
          {strategies.length === 0 ? (
            <div className="k-sysmon-empty">{labels.notConnected}</div>
          ) : (
            <div className="k-sysmon-tablewrap">
              <table className="k-sysmon-table">
                <thead>
                  <tr>
                    <th scope="col">{labels.columns.name}</th>
                    <th scope="col">{labels.columns.account}</th>
                    <th scope="col">{labels.columns.symbol}</th>
                    <th scope="col">{labels.columns.status}</th>
                    <th scope="col" className="num">
                      {labels.columns.position}
                    </th>
                    <th scope="col" className="num">
                      {labels.columns.pnl}
                    </th>
                    <th scope="col">{labels.columns.quota}</th>
                    <th scope="col" className="num">
                      {labels.columns.lastTrade}
                    </th>
                    <th scope="col">
                      <span className="k-sysmon-sr">{labels.columns.actions}</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortStrategies(strategies).map((s) => (
                    <StrategyRow
                      key={s.id}
                      s={s}
                      now={now}
                      labels={labels}
                      quotaWarnAt={quotaWarnAt}
                      onAction={onStrategyAction}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section aria-label={labels.events} className="k-sysmon-events">
          {events.length === 0 ? (
            <div className="k-sysmon-empty">{labels.notConnected}</div>
          ) : (
            <>
              <div className="k-sysmon-filters">
                <ToggleGroup
                  variant="sm"
                  aria-label={labels.eventSeverity}
                  value={minSeverity}
                  onValueChange={(v) => setMinSeverity(v as EventSeverity)}
                >
                  <ToggleGroupItem value="info">{labels.all}</ToggleGroupItem>
                  <ToggleGroupItem value="warn">{labels.severity.warn}</ToggleGroupItem>
                  <ToggleGroupItem value="error">{labels.severity.error}</ToggleGroupItem>
                </ToggleGroup>
                <ChipGroup
                  items={eventKinds.map((k) => ({ value: k.value, label: k.label }))}
                  value={kinds}
                  onValueChange={setKinds}
                  label={labels.eventKinds}
                  clearLabel={labels.clearKinds}
                />
              </div>
              {shownEvents.length === 0 ? (
                <div className="k-sysmon-empty">{labels.noEvents}</div>
              ) : (
                <ol className="k-sysmon-eventlist">
                  {shownEvents.map((e) => (
                    <li key={e.id} className="k-sysmon-event" data-severity={e.severity}>
                      <Led
                        state={SEVERITY_LED[e.severity]}
                        label={labels.severity[e.severity]}
                        bare={e.severity === 'info'}
                      />
                      <time className="k-sysmon-event-time" dateTime={new Date(e.at).toISOString()}>
                        {ago(labels, now, e.at)}
                      </time>
                      <span className="k-sysmon-event-kind">{kindName(e.kind)}</span>
                      <span className="k-sysmon-event-text">{e.text}</span>
                    </li>
                  ))}
                </ol>
              )}
            </>
          )}
        </section>
      </div>
    </section>
  )
}

function StrategyRow({
  s,
  now,
  labels,
  quotaWarnAt,
  onAction,
}: {
  s: MonitorStrategy
  now: number
  labels: SystemMonitorLabels
  quotaWarnAt?: number
  onAction?: (strategy: MonitorStrategy, action: StrategyAction) => void
}) {
  const statusText = labels.strategyStatus[s.status]
  return (
    <tr className="k-sysmon-row" data-status={s.status} data-strategy-id={s.id}>
      <th scope="row" className="k-sysmon-name">
        <div className="k-sysmon-name-cell">
          <span>{s.name}</span>
          {s.error && <span className="k-sysmon-error">{s.error}</span>}
        </div>
      </th>
      <td>{s.account}</td>
      <td>{s.symbol}</td>
      <td>
        <span className="k-sysmon-status">
          <Led state={STATUS_LED[s.status]} label={statusText} bare={s.status === 'stopped'} />
          {statusText}
        </span>
      </td>
      <td className="num">{s.position ?? '—'}</td>
      <td className="num">{s.pnl == null || s.pnlText == null ? '—' : <PnlText value={s.pnl}>{s.pnlText}</PnlText>}</td>
      <td>
        {s.quota == null ? (
          '—'
        ) : (
          <span className="k-sysmon-quota" data-tone={quotaTone(s.quota, quotaWarnAt)}>
            <span
              className="k-sysmon-quota-track"
              role="meter"
              aria-label={labels.columns.quota}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(meterShare(s.quota, 1) * 100)}
              aria-valuetext={labels.quotaUsed(Math.round(s.quota * 100))}
            >
              <span style={{ width: `${meterShare(s.quota, 1) * 100}%` }} />
            </span>
            <span className="k-sysmon-quota-text">{s.quotaText ?? `${Math.round(s.quota * 100)}%`}</span>
          </span>
        )}
      </td>
      <td className="num">{s.lastTradeAt == null ? '—' : ago(labels, now, s.lastTradeAt)}</td>
      <td className="k-sysmon-actions">
        {onAction &&
          strategyActions(s.status).map((a) => (
            <Button
              key={a}
              variant="icon"
              aria-label={`${labels.actions[a]} ${s.name}`}
              title={labels.actions[a]}
              onClick={() => onAction(s, a)}
            >
              {ACTION_ICON[a]}
            </Button>
          ))}
      </td>
    </tr>
  )
}
