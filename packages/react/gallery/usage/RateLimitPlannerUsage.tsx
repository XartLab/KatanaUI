// SPDX-License-Identifier: MIT
import { useState } from 'react'
import { RateLimitPlanner, type PlannedRun } from '../../src/blocks'

// 示例数据：一个数据源一天的抓取任务（窗口从 00:00 开始），限额与速率是演示值，不是任何数据源的真实限额。
// 回补与新闻轮询都挤在收盘后（15:00 起），峰值超过限额；按「错开」或拖动条看峰值降下来。
const RUNS: readonly PlannedRun[] = [
  { id: 'backfill', name: '日 K 回补', start: 900, duration: 90, rate: 600 },
  { id: 'news', name: '新闻轮询', start: 915, duration: 60, rate: 300 },
  { id: 'factor', name: '因子重算取数', start: 930, duration: 45, rate: 250 },
  { id: 'night', name: '夜间全量校验', start: 1320, duration: 60, rate: 400 },
  { id: 'open', name: '开盘前快照', start: 540, duration: 15, rate: 200 },
]

const clock = (minutes: number) =>
  `${String(Math.floor(minutes / 60) % 24).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`

export function RateLimitPlannerUsage() {
  const [runs, setRuns] = useState<readonly PlannedRun[]>(RUNS)
  return (
    <div className="gal-wide" style={{ maxWidth: 880 }} data-gallery-rlp="main">
      <RateLimitPlanner
        title="数据源排程（示例）"
        runs={runs}
        onRunsChange={setRuns}
        limit={1000}
        buffer={0.8}
        now={600}
        formatTime={clock}
        formatRate={(rate) => `${Math.round(rate).toLocaleString('en-US')} / 分`}
        labels={{
          status: { ok: '在限额内', near: '接近上限', over: '超过限额' },
          peak: (peak, at) => `峰值 ${peak} · ${at}`,
          limit: '限额',
          buffer: '预警线',
          runs: '抓取任务',
          run: (run, start, end, rate) => `${start} → ${end} · ${rate}`,
          locked: '已开始',
          remove: '删除',
          spread: '错开',
          moved: (run, start, peak) => `${run.name} 挪到 ${start}，峰值 ${peak}`,
          empty: '没有抓取任务',
        }}
      />
    </div>
  )
}
