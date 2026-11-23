// SPDX-License-Identifier: MIT
import { useEffect, useState } from 'react'
import {
  PortfolioRunGrid,
  ReplayTransport,
  RunModeBadge,
  type PortfolioRunFormat,
  type PortfolioRunLabels,
  type PortfolioRunRow,
  type ReplayTransportLabels,
  type RunMode,
} from '../../src/blocks/index.ts'
import { Row } from './parts.tsx'

// 前向测试与回放的件（#121）的演示。下面所有数字都是编的演示数据（品种、持仓、盈亏、权益、时间），不是行情，也不是任何账户或回测的结果。

export const RUN_LABELS: PortfolioRunLabels = {
  grid: '组合运行表',
  summary: '组合汇总',
  equity: '权益',
  availableFunds: '可用资金',
  buyingPower: '购买力',
  drawdown: '回撤',
  columns: {
    symbol: '品种',
    position: '持仓',
    unrealizedPnl: '浮动盈亏',
    realizedPnl: '已实现盈亏',
    riskAmount: '占用风险资金',
    equityContribution: '权益贡献',
    status: '状态',
    actions: '操作',
  },
  status: { running: '运行', paused: '暂停', noNewEntries: '停新开', disconnected: '断流' },
  pause: '暂停',
  resume: '恢复',
  closePosition: '平掉',
  actionLabel: (action, symbol) => `${{ pause: '暂停', resume: '恢复', close: '平掉' }[action]} ${symbol}`,
  empty: '没有品种',
}

export const RUN_FORMAT: PortfolioRunFormat = {
  amount: (v) =>
    `${v > 0 ? '+' : ''}${v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
  quantity: (v) => String(v),
  percent: (v) => `${(v * 100).toFixed(2)}%`,
}

/** 编的演示行：四个状态各一行，另有一行空仓。 */
export const DEMO_RUN_ROWS: readonly PortfolioRunRow[] = [
  {
    id: 'a',
    symbol: 'DEMO-A',
    position: 3,
    unrealizedPnl: 142.5,
    realizedPnl: 310,
    riskAmount: 1200,
    equityContribution: 452.5,
    status: 'running',
  },
  {
    id: 'b',
    symbol: 'DEMO-B',
    position: -2,
    unrealizedPnl: -86,
    realizedPnl: 40,
    riskAmount: 900,
    equityContribution: -46,
    status: 'paused',
  },
  {
    id: 'c',
    symbol: 'DEMO-C',
    position: 5,
    unrealizedPnl: 12,
    realizedPnl: -120,
    riskAmount: 600,
    equityContribution: -108,
    status: 'noNewEntries',
  },
  {
    id: 'd',
    symbol: 'DEMO-D',
    position: 1,
    unrealizedPnl: 0,
    realizedPnl: 0,
    riskAmount: 300,
    equityContribution: 0,
    status: 'disconnected',
  },
  {
    id: 'e',
    symbol: 'DEMO-E',
    position: 0,
    unrealizedPnl: 0,
    realizedPnl: 75,
    riskAmount: 0,
    equityContribution: 75,
    status: 'running',
  },
]
export const DEMO_RUN_SUMMARY = { equity: 100_373.5, availableFunds: 86_200, buyingPower: 172_400, drawdown: -0.0342 }

export function PortfolioRunGridDemo() {
  const [rows, setRows] = useState(DEMO_RUN_ROWS)
  const [last, setLast] = useState('还没点过')
  const setStatus = (row: PortfolioRunRow, status: PortfolioRunRow['status'], text: string) => {
    setRows((all) => all.map((r) => (r.id === row.id ? { ...r, status } : r)))
    setLast(`${text} · ${row.symbol}`)
  }
  return (
    <div className="gal-stack" style={{ width: '100%' }}>
      <p className="gal-note">
        演示数据：品种、持仓与盈亏都是编的。点「暂停」这一行变琥珀色、按钮换成「恢复」，「平掉」仍可点；点「平掉」只记一行字，不改持仓。
        件自己不下单，动作只发给调用方。
      </p>
      <div data-testid="run-grid">
        <PortfolioRunGrid
          rows={rows}
          summary={DEMO_RUN_SUMMARY}
          format={RUN_FORMAT}
          labels={RUN_LABELS}
          onPause={(row) => setStatus(row, 'paused', '已暂停')}
          onResume={(row) => setStatus(row, 'running', '已恢复')}
          onClose={(row) => setLast(`请求平掉 · ${row.symbol}`)}
        />
      </div>
      <p className="gal-note" data-testid="run-last">
        最后一次动作：{last}
      </p>
      <p className="gal-note">没有品种、汇总还没数据：</p>
      <PortfolioRunGrid
        rows={[]}
        summary={{ equity: null, availableFunds: null, buyingPower: null, drawdown: null }}
        format={RUN_FORMAT}
        labels={RUN_LABELS}
      />
    </div>
  )
}

export const REPLAY_LABELS: ReplayTransportLabels = {
  group: '回放控制',
  play: '播放',
  pause: '暂停',
  step: '逐根',
  speed: '倍速',
  progress: '回放进度',
  time: '回放时刻',
  jumpTo: '跳到时刻',
  jump: '跳转',
  invalidTime: '时刻格式不对，写成 2026-01-05 10:30',
  skipTicks: '跳过 tick 数',
  skip: '跳过',
  synced: (n) => `同步中 · ${n} 个面板`,
}

export const REPLAY_START = Date.UTC(2026, 0, 5, 9, 30)
export const REPLAY_END = Date.UTC(2026, 0, 5, 15, 0)
const BAR_MS = 60_000
const TICK_MS = 1_000

export function ReplayTransportDemo() {
  const [time, setTime] = useState(REPLAY_START + 3_600_000)
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState(2)
  const [log, setLog] = useState('')
  // 演示用的假时钟：播放时每 400 毫秒按倍速往前走；真应用里时钟在引擎那边，件只发意图。
  useEffect(() => {
    if (!playing) return
    const id = setInterval(() => setTime((t) => Math.min(REPLAY_END, t + speed * BAR_MS)), 400)
    return () => clearInterval(id)
  }, [playing, speed])
  const clamp = (t: number) => Math.min(REPLAY_END, Math.max(REPLAY_START, t))
  return (
    <div className="gal-stack" style={{ width: '100%' }}>
      <p className="gal-note">
        演示：时钟是页面里的假时钟（播放时每 0.4 秒走 倍速 × 1 根）。倍速列表 [1, 2, 5, 10, 60] 由调用方传。键盘：k 播放
        / 暂停，. 逐根，[ ] 换倍速；进度条上 ← → 微调、Shift 加大步、Home / End 到两端。
      </p>
      <div data-testid="replay-frame" style={{ maxWidth: 720 }}>
        <ReplayTransport
          time={time}
          start={REPLAY_START}
          end={REPLAY_END}
          playing={playing}
          speed={speed}
          speeds={[1, 2, 5, 10, 60]}
          syncedPanels={3}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onStep={() => setTime((t) => clamp(t + BAR_MS))}
          onSpeedChange={setSpeed}
          onSeek={(t) => setTime(clamp(t))}
          onSkipTicks={(n) => {
            setTime((t) => clamp(t + n * TICK_MS))
            setLog(`跳过 ${n} 个 tick`)
          }}
          labels={REPLAY_LABELS}
        />
      </div>
      <p className="gal-note" data-testid="replay-log">
        {log}
      </p>
      <p className="gal-note">单图（没有同步提示）、播放中、整条禁用：</p>
      <div style={{ maxWidth: 720 }}>
        <ReplayTransport
          time={REPLAY_START + 7_200_000}
          start={REPLAY_START}
          end={REPLAY_END}
          playing
          speed={5}
          speeds={[1, 5, 10]}
          onPlay={() => {}}
          onPause={() => {}}
          onStep={() => {}}
          onSpeedChange={() => {}}
          onSeek={() => {}}
          onSkipTicks={() => {}}
          labels={REPLAY_LABELS}
        />
      </div>
      <div style={{ maxWidth: 720 }}>
        <ReplayTransport
          time={REPLAY_START}
          start={REPLAY_START}
          end={REPLAY_END}
          playing={false}
          speed={1}
          speeds={[1, 5, 10]}
          disabled
          onPlay={() => {}}
          onPause={() => {}}
          onStep={() => {}}
          onSpeedChange={() => {}}
          onSeek={() => {}}
          onSkipTicks={() => {}}
          labels={REPLAY_LABELS}
        />
      </div>
    </div>
  )
}

export const MODE_LABELS: Record<RunMode, string> = { paper: '模拟', replay: '回放', forward: '前向测试', live: '实盘' }

export function RunModeBadgeDemo() {
  return (
    <div className="gal-stack">
      <p className="gal-note">
        四种模式四个样子：模拟虚线灰框、回放蓝框与倒带、前向测试绿框与前进箭头、实盘强调色实心底（最醒目）。不只靠颜色，每种带自己的图形。
      </p>
      <Row name="四种模式">
        {(['paper', 'replay', 'forward', 'live'] as const).map((mode) => (
          <RunModeBadge key={mode} mode={mode} labels={MODE_LABELS} />
        ))}
      </Row>
      <Row name="带补充文字">
        <RunModeBadge mode="replay" labels={MODE_LABELS} detail="2026-01-05" />
        <RunModeBadge mode="forward" labels={MODE_LABELS} detail="第 12 天" />
        <RunModeBadge mode="live" labels={MODE_LABELS} detail="账户 DEMO" />
      </Row>
    </div>
  )
}
