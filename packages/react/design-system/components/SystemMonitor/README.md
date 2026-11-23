# SystemMonitor

一眼看出交易系统是否正常：顶上连接状态条（每个连接 / 交易所 API / 行情源 / 引擎一盏灯 + 名称 + 状态字 + 延迟 + 最后心跳，异常的排前面）；延迟与错误率小图（SparkTile）；策略实例表（名称、账户、品种、状态、持仓、今日盈亏、额度占用条、最后一笔，行尾启停按钮由调用方回调）；事件流（按严重程度着色，可按类别与严重程度筛）。急停放面板头，按住确认。没有数据的块写「未连接」。功能参照 NinjaTrader 8 Control Center 的 Strategies 页签（2026-11-15 读到列与启停操作）与 Hummingbot 状态文档（2026-11-15 读到连接状态与错误信息；策略状态字段该页没写，待核对），实现原创。演示数据是虚构的。

## Provide

`*` marks a required prop.

### SystemMonitor

件只画、只回调：连接、策略、事件的数据与全部文字由调用方传，件不认识任何应用或交易所；高度由外层给，内容自己滚。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `links` | `MonitorLink[]` | — | { id, name, group?, state: ok \| degraded \| error \| offline, latencyMs?, lastBeat?（毫秒时间戳）, detail? }。件把异常的排前面。 |
| `strategies` | `MonitorStrategy[]` | — | { id, name, account, symbol, status: running \| paused \| stopped \| error, position?, pnl?, pnlText?, quota?（0 到 1）, quotaText?, lastTradeAt?, error? }。出错的排前面，其余保持传入顺序。 |
| `metrics` | `SystemMonitorMetric[]` | — | SparkTile 的 label、value、unit、series、sparkLabel、threshold、state、note 加 key；延迟与错误率各一块。 |
| `events / eventKinds` | `MonitorEvent[] / { value, label }[]` | — | 事件 { id, at, severity: info \| warn \| error, kind, text }；类别（下单、成交、拒单、断线、重连、风控触发……）由调用方定。 |
| `now` | `number` | — | 当前毫秒时间：「3 秒前」按它算，调用方定时更新（件不在渲染里取时间）。 |
| `labels` | `SystemMonitorLabels` | — | 全部文字（含状态名、列名、启停按钮名、急停提示、筛选名与 ago / latency / quotaUsed 函数）。包里没有语言。 |
| `onStrategyAction` | `(strategy, action: start \| pause \| stop) => void` | — | 行尾启停按钮的回调：运行中给暂停与停止，暂停给继续与停止，停止与出错给启动；不给就没有按钮。件不改状态。 |
| `onEmergencyStop` | `() => void` | — | 面板头的急停：按住 HoldToConfirm 填满才回调；不给就没有急停按钮。 |
| `quotaWarnAt` | `number` | — | 额度条转琥珀的占用比；不给不预警，≥ 1 总是红。预警线属于账户风控，由调用方给。 |
| `onSelect` | `(link) => void` | — | 选中一个连接：给了，连接条上每个连接是按钮（旧名 onLinkPick 留一个版本）。 |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { useState } from 'react'
import {
  SystemMonitor,
  PanelFrame,
  PanelFrameBody,
  PanelFrameHeader,
  type MonitorEvent,
  type MonitorLink,
  type MonitorStrategy,
  type StrategyAction,
  type SystemMonitorLabels,
  type SystemMonitorMetric,
} from '@katana-ui/react/blocks'

const MON_NOW = Date.UTC(2026, 10, 15, 9, 30, 0)

const SEC = 1000

const MON_LINKS: MonitorLink[] = [
  { id: 'l1', name: '演示交易所 A', group: '交易所 API', state: 'ok', latencyMs: 42, lastBeat: MON_NOW - 2 * SEC },
  { id: 'l2', name: '演示行情源', group: '行情源', state: 'ok', latencyMs: 18, lastBeat: MON_NOW - 1 * SEC },
  {
    id: 'l3',
    name: '演示交易所 B',
    group: '交易所 API',
    state: 'error',
    latencyMs: null,
    lastBeat: MON_NOW - 95 * SEC,
    detail: '签名校验失败（演示）',
  },
  { id: 'l4', name: '策略引擎', group: '引擎', state: 'degraded', latencyMs: 310, lastBeat: MON_NOW - 6 * SEC },
]

const MON_STRATEGIES: MonitorStrategy[] = [
  {
    id: 's1',
    name: '均值回归 · 演示',
    account: '演示账户 1',
    symbol: '600001',
    status: 'running',
    position: '+1,200 股',
    pnl: 1830.5,
    pnlText: '+1,830.50',
    quota: 0.42,
    quotaText: '42%',
    lastTradeAt: MON_NOW - 48 * SEC,
  },
  {
    id: 's2',
    name: '突破跟随 · 演示',
    account: '演示账户 2',
    symbol: 'DEMO-PERP',
    status: 'error',
    position: '−0.8',
    pnl: -420.1,
    pnlText: '−420.10',
    quota: 0.93,
    quotaText: '93%',
    lastTradeAt: MON_NOW - 12 * 60 * SEC,
    error: '下单被拒：签名校验失败',
  },
  {
    id: 's3',
    name: '对冲篮子 · 演示',
    account: '演示账户 1',
    symbol: 'DEMOIDX',
    status: 'paused',
    position: '0',
    pnl: 0,
    pnlText: '0.00',
    quota: 0.1,
    quotaText: '10%',
    lastTradeAt: null,
  },
  { id: 's4', name: '网格 · 演示', account: '演示账户 2', symbol: 'DEMO-SPOT', status: 'stopped', quota: null },
]

const MON_METRICS: SystemMonitorMetric[] = [
  {
    key: 'lat',
    label: 'LATENCY',
    value: '42',
    unit: 'ms',
    series: [38, 40, 39, 44, 41, 52, 47, 43, 42],
    sparkLabel: '延迟走势，最近 9 次',
    note: '近 9 次',
  },
  {
    key: 'err',
    label: 'ERROR RATE',
    value: '2.4',
    unit: '%',
    series: [0, 0, 1, 0, 2, 3, 2, 4, 3, 2],
    sparkLabel: '错误率走势，最近 10 次',
    state: 'near',
    threshold: 4,
    note: '接近阈值（演示 4%）',
  },
]

const MON_EVENTS: MonitorEvent[] = [
  {
    id: 'e1',
    at: MON_NOW - 20 * SEC,
    severity: 'error',
    kind: 'reject',
    text: '突破跟随 · 演示：委托被拒（签名校验失败）',
  },
  { id: 'e2', at: MON_NOW - 48 * SEC, severity: 'info', kind: 'fill', text: '均值回归 · 演示：成交 200 股 @ 演示价' },
  { id: 'e3', at: MON_NOW - 95 * SEC, severity: 'error', kind: 'disconnect', text: '演示交易所 B：连接断开，心跳超时' },
  { id: 'e4', at: MON_NOW - 6 * 60 * SEC, severity: 'warn', kind: 'risk', text: '演示账户 2：额度占用越过预警线' },
  { id: 'e5', at: MON_NOW - 9 * 60 * SEC, severity: 'info', kind: 'order', text: '均值回归 · 演示：下单 200 股' },
  { id: 'e6', at: MON_NOW - 14 * 60 * SEC, severity: 'info', kind: 'reconnect', text: '策略引擎：重连成功' },
]

const MON_KINDS = [
  { value: 'order', label: '下单' },
  { value: 'fill', label: '成交' },
  { value: 'reject', label: '拒单' },
  { value: 'disconnect', label: '断线' },
  { value: 'reconnect', label: '重连' },
  { value: 'risk', label: '风控' },
]

const MON_LABELS: SystemMonitorLabels = {
  monitor: '交易系统监控',
  heading: '系统监控',
  notConnected: '未连接',
  links: '连接状态',
  strategies: '策略实例',
  metrics: '延迟与错误率',
  events: '事件流',
  linkState: { ok: '正常', degraded: '变慢', error: '出错', offline: '断开' },
  strategyStatus: { running: '运行', paused: '暂停', stopped: '停止', error: '出错' },
  severity: { info: '信息', warn: '警告', error: '错误' },
  ago: (s) => (s < 60 ? `${s} 秒前` : s < 3600 ? `${Math.floor(s / 60)} 分钟前` : `${Math.floor(s / 3600)} 小时前`),
  latency: (ms) => `${ms} ms`,
  heartbeat: '心跳',
  noBeat: '无',
  columns: {
    name: '策略',
    account: '账户',
    symbol: '品种',
    status: '状态',
    position: '持仓',
    pnl: '今日盈亏',
    quota: '额度',
    lastTrade: '最后一笔',
    actions: '操作',
  },
  actions: { start: '启动', pause: '暂停', stop: '停止' },
  emergencyStop: '急停',
  emergencyHint: '按住 2 秒，停止全部策略',
  emergencyDone: '已急停',
  eventKinds: '事件类别',
  eventSeverity: '严重程度',
  all: '全部',
  clearKinds: '清除类别筛选',
  noEvents: '没有符合筛选的事件',
  quotaUsed: (p) => `额度已用 ${p}%`,
}

export function SystemMonitorUsage() {
  const [strategies, setStrategies] = useState(MON_STRATEGIES)
  const [log, setLog] = useState('—')
  const act = (s: MonitorStrategy, a: StrategyAction) => {
    setLog(`${a} ${s.id}`)
    const status = a === 'pause' ? 'paused' : a === 'stop' ? 'stopped' : 'running'
    setStrategies((prev) => prev.map((x) => (x.id === s.id ? { ...x, status, error: undefined } : x)))
  }
  return (
    <div className="gal-stack" style={{ width: '100%' }}>
      <p className="gal-note">
        演示数据（连接与策略都是虚构的，时间固定）：一个连接出错、一个策略出错。启停只回调，这里把状态改回去；急停要按住。最后一次操作：
        <span data-testid="mon-log">{log}</span>
      </p>
      <div style={{ height: 760 }} data-testid="mon-frame">
        <PanelFrame aria-label="System monitor panel">
          <PanelFrameHeader heading="Monitor" object="· 演示数据" />
          <PanelFrameBody>
            <div style={{ height: '100%', padding: 8 }}>
              <SystemMonitor
                links={MON_LINKS}
                strategies={strategies}
                metrics={MON_METRICS}
                events={MON_EVENTS}
                eventKinds={MON_KINDS}
                now={MON_NOW}
                labels={MON_LABELS}
                quotaWarnAt={0.9}
                onStrategyAction={act}
                onEmergencyStop={() => {
                  setLog('急停')
                  setStrategies((prev) => prev.map((x) => ({ ...x, status: 'stopped', error: undefined })))
                }}
              />
            </div>
          </PanelFrameBody>
        </PanelFrame>
      </div>
      <div style={{ height: 200 }} data-testid="mon-empty">
        <SystemMonitor
          links={[]}
          strategies={[]}
          metrics={[]}
          events={[]}
          eventKinds={MON_KINDS}
          now={MON_NOW}
          labels={MON_LABELS}
        />
      </div>
    </div>
  )
}

// 假说账的演示数据是虚构的：假说、机构、文章、日期都不是真实的，不含任何真实数字；时间固定在 HL_NOW，靠「快进」推进。
```

## States

- 每块没有数据：写 labels.notConnected，不补样本。
- 连接出错：红灯 + 状态字 + 左侧红边；断开 / 变慢：琥珀。状态不只靠颜色。
- 策略出错：整行左侧红边，名字下写出错说明；排在最前。
- 额度 ≥ 1：条贴边变红；达到 quotaWarnAt：琥珀。
- 事件筛选没有命中：写 labels.noEvents。
- 灯的语气（linkSeverity / strategySeverity / eventSeverity → ledOf，G6）：连接 ok / degraded warn / error danger / offline off；策略 running ok / paused warn / error danger / stopped off；事件 info neutral（不亮）/ warn / error danger。

## Don't

- 不要用橙色画状态或数据：橙色不画数据，状态用绿、琥珀、红加文字。
- 不要在件里取当前时间：传 now。
- 不要让件自己改策略状态：回调后由调用方改数据回传。
- 不要在件里写预警线：额度预警属于账户风控。

## Composition

```
SystemMonitor
  头：标题、急停 HoldToConfirm
  连接条：li × 连接（Led、名称、状态字、延迟、心跳）
  小图：SparkTile × n
  策略表：table（Led 状态、PnlText、额度条、启停 Button）
  事件流：严重程度 ToggleGroup、类别 ChipGroup、ol（Led、time、类别、说明）
```

## Keyboard

- `Tab`：在急停、连接、启停按钮、筛选间移动
- `按住 Space / Enter`：在急停上按住填满后触发
