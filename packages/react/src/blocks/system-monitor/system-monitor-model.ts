// SPDX-License-Identifier: MIT

/** 连接状态：ok 正常、degraded 变慢或部分可用、error 出错、offline 断开。名字与颜色由件定，字由调用方给。 */
export type LinkState = 'ok' | 'degraded' | 'error' | 'offline'

export type MonitorLink = {
  id: string
  name: string
  /** 分组名（交易所 API / 行情源 / 引擎……）：只写在悬停提示里，件不认识任何一种。 */
  group?: string
  state: LinkState
  /** 往返延迟（毫秒）；没有测到传 null。 */
  latencyMs?: number | null
  /** 最后一次心跳的毫秒时间戳；没收到过传 null。 */
  lastBeat?: number | null
  /** 出错时的说明（悬停与读屏用）。 */
  detail?: string
}

/** 策略实例状态：运行 / 暂停 / 停止 / 出错。 */
export type StrategyStatus = 'running' | 'paused' | 'stopped' | 'error'

export type StrategyAction = 'start' | 'pause' | 'stop'

export type MonitorStrategy = {
  id: string
  name: string
  account: string
  symbol: string
  status: StrategyStatus
  /** 持仓，已格式化（含方向与单位）；没有传 null。 */
  position?: string | null
  /** 今日盈亏：pnl 只定方向（涨跌色），pnlText 是调用方格式化好的字。 */
  pnl?: number | null
  pnlText?: string | null
  /** 额度占用，0 到 1（超过 1 算越界，条贴边）；没有额度限制传 null。 */
  quota?: number | null
  quotaText?: string | null
  /** 最后一笔成交 / 下单的毫秒时间戳；今天没有传 null。 */
  lastTradeAt?: number | null
  /** 出错说明。 */
  error?: string
}

export type EventSeverity = 'info' | 'warn' | 'error'

export type MonitorEvent = {
  id: string
  at: number
  severity: EventSeverity
  /** 类别的 value（对应 SystemMonitorProps.eventKinds）：下单、成交、拒单、断线、重连、风控触发……由调用方定。 */
  kind: string
  text: string
}

const LINK_RANK: Record<LinkState, number> = { error: 0, offline: 1, degraded: 2, ok: 3 }
const SEVERITY_RANK: Record<EventSeverity, number> = { error: 2, warn: 1, info: 0 }

/** 异常的排前面（出错、断开、变慢、正常），同级保持传入顺序。 */
export function sortLinks(links: readonly MonitorLink[]): MonitorLink[] {
  // js/copying-array-methods：toSorted 替代「展开复制再 sort」。
  return links.toSorted((a, b) => LINK_RANK[a.state] - LINK_RANK[b.state])
}

/** 出错的排前面，其余保持传入顺序（运行中的不因状态抖动而换位）。 */
export function sortStrategies(strategies: readonly MonitorStrategy[]): MonitorStrategy[] {
  // js/copying-array-methods：toSorted 替代「展开复制再 sort」。
  return strategies.toSorted((a, b) => Number(b.status === 'error') - Number(a.status === 'error'))
}

/** 新的在前；同一时间按 id 定序。 */
export function sortEvents(events: readonly MonitorEvent[]): MonitorEvent[] {
  // js/copying-array-methods：toSorted 替代「展开复制再 sort」。
  return events.toSorted((a, b) => b.at - a.at || (a.id < b.id ? -1 : 1))
}

/** 事件筛选：kinds 空 = 全部类别；minSeverity 是「这一级及以上」。 */
export function filterEvents(
  events: readonly MonitorEvent[],
  filter: { kinds: readonly string[]; minSeverity: EventSeverity },
): MonitorEvent[] {
  return events.filter(
    (e) =>
      (filter.kinds.length === 0 || filter.kinds.includes(e.kind)) &&
      SEVERITY_RANK[e.severity] >= SEVERITY_RANK[filter.minSeverity],
  )
}

/** 策略行上能点的动作：运行中可暂停与停止，暂停可继续与停止，停止与出错只能启动。 */
export function strategyActions(status: StrategyStatus): StrategyAction[] {
  if (status === 'running') return ['pause', 'stop']
  if (status === 'paused') return ['start', 'stop']
  return ['start']
}

export type QuotaTone = 'ok' | 'warn' | 'danger'

/** 额度条的色：≥ 1 越界为 danger；warnAt 由调用方给（≥ warnAt 为 warn），不给就不预警——预警线属于账户风控，件不替它定。 */
export function quotaTone(quota: number, warnAt?: number): QuotaTone {
  if (quota >= 1) return 'danger'
  if (warnAt !== undefined && quota >= warnAt) return 'warn'
  return 'ok'
}

/** 汇总：给面板头与读屏用。 */
export function summarize(links: readonly MonitorLink[], strategies: readonly MonitorStrategy[]) {
  return {
    linkIssues: links.filter((l) => l.state !== 'ok').length,
    strategyErrors: strategies.filter((s) => s.status === 'error').length,
    active: strategies.filter((s) => s.status === 'running' || s.status === 'paused').length,
  }
}
