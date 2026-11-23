// SPDX-License-Identifier: MIT
import { CalendarIcon, ClockIcon, MapPinIcon, UsersIcon } from 'lucide-react'
import { useState } from 'react'
import {
  AgentRunDetail,
  type AgentRunDetailLabels,
  type RunDetailStatus,
  type RunDetailStepStatus,
} from '../../src/blocks'

// 示例数据：一次回补任务，数是手写的演示值，不是任何数据源的真实记录。时间一律是毫秒，由调用方给：件自己不读钟。
const sec = 1000
const min = 60 * sec

// 毫秒写成字：调用方管语言与单复数。
const formatDuration = (ms: number) => {
  const s = Math.round(ms / sec)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  if (h > 0) return `${h} 小时`
  if (m > 0) return s % 60 > 0 ? `${m} 分 ${s % 60} 秒` : `${m} 分钟`
  return `${s} 秒`
}

const LABELS: AgentRunDetailLabels = {
  back: '返回',
  status: { running: '在跑', blocked: '要你确认', done: '完成', paused: '已暂停', failed: '失败' },
  actions: { pause: '暂停', resume: '继续', cancel: '取消', rerun: '再跑一次' },
  progress: '运行进度',
  progressValue: (percent, status) => `${percent}%，${status}`,
  elapsed: (time) => `已用 ${time}`,
  remaining: (time) => `约剩 ${time}`,
  blocked: (time) => `阻塞于 ${time}前`,
  completed: (time) => `用时 ${time}`,
  confirm: '确认',
  next: '接着跑',
  details: '详情',
  steps: '步骤',
  estimate: (time) => `约 ${time}`,
  step: { done: '完成', running: '在跑', pending: '等待', blocked: '阻塞', failed: '失败' },
}

// 校验密钥这一步跟着运行的状态走：暂停时还没开始（等待）。
const KEY_STEP: Record<RunDetailStatus, RunDetailStepStatus> = {
  blocked: 'blocked',
  failed: 'failed',
  paused: 'pending',
  running: 'running',
  done: 'done',
}

export function AgentRunDetailUsage() {
  const [status, setStatus] = useState<RunDetailStatus>('blocked')
  return (
    <div style={{ width: 440, maxWidth: '100%' }} data-gallery-ard="main">
      <AgentRunDetail
        name="接入新数据源"
        status={status}
        progress={status === 'blocked' ? 0.76 : 0.8}
        elapsed={14 * min}
        remaining={3 * min}
        blockedFor={58 * min}
        formatDuration={formatDuration}
        question={{
          title: '示例源 B 缺少访问密钥',
          description: '要继续，需要我用保险库里的备用密钥吗？',
        }}
        onConfirm={() => setStatus('running')}
        onAction={(action) => {
          // 暂停与继续在跑与暂停间切；取消把运行标成失败；再跑一次回到在跑。
          if (action === 'pause') setStatus('paused')
          else if (action === 'cancel') setStatus('failed')
          else setStatus('running')
        }}
        details={[
          { id: 'source', label: '数据源', icon: <MapPinIcon />, value: '示例源 B' },
          { id: 'scope', label: '范围', icon: <UsersIcon />, value: '沪深 A 股 5,120 只' },
          { id: 'cycle', label: '周期', icon: <CalendarIcon />, value: '日线 · 近 10 年' },
          { id: 'started', label: '开始', icon: <ClockIcon />, value: '14:32 · 2026-11-24' },
        ]}
        steps={[
          { id: 'connect', name: '连接数据源', status: 'done', duration: 22 * sec },
          { id: 'calendar', name: '拉取交易日历', status: 'done', duration: 38 * sec },
          { id: 'check', name: '核对权限范围', status: 'done', duration: 62 * sec },
          {
            id: 'key',
            name: '校验访问密钥',
            status: KEY_STEP[status],
          },
          { id: 'write', name: '写入日线', status: 'pending' },
        ]}
        labels={LABELS}
      />
    </div>
  )
}
