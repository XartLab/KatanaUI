# SystemMonitor

一眼看出交易系统是否正常：顶上连接状态条（每个连接 / 交易所 API / 行情源 / 引擎一盏灯 + 名称 + 状态字 + 延迟 + 最后心跳，异常的排前面）；延迟与错误率小图（SparkTile）；策略实例表（名称、账户、品种、状态、持仓、今日盈亏、额度占用条、最后一笔，行尾启停按钮由调用方回调）；事件流（按严重程度着色，可按类别与严重程度筛）。急停放面板头，按住确认。没有数据的块写「未连接」。功能参照 NinjaTrader 8 Control Center 的 Strategies 页签（2026-11-15 读到列与启停操作）与 Hummingbot 状态文档（2026-11-15 读到连接状态与错误信息；策略状态字段该页没写，待核对），实现原创。演示数据是虚构的。

## Provide

### SystemMonitor

件只画、只回调：连接、策略、事件的数据与全部文字由调用方传，件不认识任何应用或交易所；高度由外层给，内容自己滚。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `links` | `MonitorLink[]` | — | { id, name, group?, state: ok | degraded | error | offline, latencyMs?, lastBeat?（毫秒时间戳）, detail? }。件把异常的排前面。 |
| `strategies` | `MonitorStrategy[]` | — | { id, name, account, symbol, status: running | paused | stopped | error, position?, pnl?, pnlText?, quota?（0 到 1）, quotaText?, lastTradeAt?, error? }。出错的排前面，其余保持传入顺序。 |
| `metrics` | `SystemMonitorMetric[]` | — | SparkTile 的 label、value、unit、series、sparkLabel、threshold、state、note 加 key；延迟与错误率各一块。 |
| `events / eventKinds` | `MonitorEvent[] / { value, label }[]` | — | 事件 { id, at, severity: info | warn | error, kind, text }；类别（下单、成交、拒单、断线、重连、风控触发……）由调用方定。 |
| `now` | `number` | — | 当前毫秒时间：「3 秒前」按它算，调用方定时更新（件不在渲染里取时间）。 |
| `labels` | `SystemMonitorLabels` | — | 全部文字（含状态名、列名、启停按钮名、急停提示、筛选名与 ago / latency / quotaUsed 函数）。包里没有语言。 |
| `onStrategyAction` | `(strategy, action: start \| pause \| stop) => void` | — | 行尾启停按钮的回调：运行中给暂停与停止，暂停给继续与停止，停止与出错给启动；不给就没有按钮。件不改状态。 |
| `onEmergencyStop` | `() => void` | — | 面板头的急停：按住 HoldToConfirm 填满才回调；不给就没有急停按钮。 |
| `quotaWarnAt` | `number` | — | 额度条转琥珀的占用比；不给不预警，≥ 1 总是红。预警线属于账户风控，由调用方给。 |
| `onLinkPick` | `(link) => void` | — | 给了，连接条上每个连接是按钮。 |

## States

- 每块没有数据：写 labels.notConnected，不补样本。
- 连接出错：红灯 + 状态字 + 左侧红边；断开 / 变慢：琥珀。状态不只靠颜色。
- 策略出错：整行左侧红边，名字下写出错说明；排在最前。
- 额度 ≥ 1：条贴边变红；达到 quotaWarnAt：琥珀。
- 事件筛选没有命中：写 labels.noEvents。

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
