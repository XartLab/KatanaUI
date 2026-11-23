// SPDX-License-Identifier: MIT
import { CalendarIcon, ClockIcon, MapPinIcon, SendIcon, UsersIcon, RefreshCwIcon } from 'lucide-react'
import { useState } from 'react'
import { AgentRunDetail, type AgentRunDetailLabels } from '../../src/blocks'
import { AgentRunDetailUsage } from '../usage/AgentRunDetailUsage.tsx'
import { AgentRunListUsage } from '../usage/AgentRunListUsage.tsx'
import { Row } from './parts.tsx'

// Agent 单次运行详情与运行列表（KatanaUI #196）的文档站演示。数据全是示例：手写的演示值，不是任何数据源或 Agent 的真实记录；时间是毫秒、由演示给，件不读钟。
const sec = 1000
const min = 60 * sec
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

export function AgentRunDetailDemo() {
  // 完成态：点建议动作，下面一行写点了哪个；点「再跑一次」回到在跑。
  const [picked, setPicked] = useState<string | null>(null)
  return (
    <>
      <p className="gal-note">
        示例数据：同一个运行的三种状态。在跑：当前刻度亮、写已用与约剩，右上「暂停」；阻塞：整条 warn
        色、写阻塞多久，问题卡的「确认」把运行放行（第一份演示里能点），右上「取消」；完成：刻度全亮、写用时，「接着跑」点一个建议动作、右上「再跑一次」。「详情」「步骤」「接着跑」的标题是按钮，Enter
        或 Space 收起展开。
      </p>
      <Row name="可点：阻塞 → 确认 → 在跑">
        <AgentRunDetailUsage />
      </Row>
      <Row name="在跑">
        <div style={{ width: 440, maxWidth: '100%' }} data-gallery-ard="running">
          <AgentRunDetail
            name="回补沪深日线"
            status="running"
            progress={0.62}
            elapsed={6 * min + 12 * sec}
            remaining={4 * min}
            formatDuration={formatDuration}
            onBack={() => {}}
            onAction={() => {}}
            details={[
              { id: 'scope', label: '范围', icon: <MapPinIcon />, value: '沪深 A 股' },
              { id: 'count', label: '标的数', icon: <UsersIcon />, value: '5,120 只' },
              { id: 'cycle', label: '周期', icon: <CalendarIcon />, value: '日线 · 近 10 年' },
              { id: 'started', label: '开始', icon: <ClockIcon />, value: '14:32 · 2026-11-24' },
            ]}
            steps={[
              { id: 'connect', name: '连接数据源', status: 'done', duration: 46 * sec },
              { id: 'calendar', name: '拉取交易日历', status: 'done', duration: 51 * sec },
              { id: 'write', name: '写入日线', status: 'running' },
              { id: 'adjust', name: '校验复权因子', status: 'pending' },
              { id: 'report', name: '生成回补报告', status: 'pending' },
            ]}
            labels={LABELS}
          />
        </div>
      </Row>
      <Row name="完成">
        <div style={{ width: 440, maxWidth: '100%' }} data-gallery-ard="done">
          <AgentRunDetail
            name="复核回补结果"
            status="done"
            progress={1}
            took={3 * min + 17 * sec}
            formatDuration={formatDuration}
            onBack={() => {}}
            onAction={() => setPicked('再跑一次')}
            next={[
              { id: 'send', label: '发送报告给研究组', icon: <SendIcon />, estimate: 2 * min },
              { id: 'schedule', label: '30 天后再回补一次', icon: <RefreshCwIcon />, estimate: 1 * min },
            ]}
            onNext={(id) => setPicked(id === 'send' ? '发送报告给研究组' : '30 天后再回补一次')}
            details={[
              { id: 'count', label: '板块数', icon: <UsersIcon />, value: '9 个' },
              { id: 'started', label: '开始', icon: <ClockIcon />, value: '09:56 · 2026-11-23' },
              { id: 'ended', label: '完成', icon: <ClockIcon />, value: '09:59 · 2026-11-23' },
            ]}
            steps={[
              { id: 'load', name: '读取板块清单', status: 'done', duration: 35 * sec },
              { id: 'check', name: '核对缺口', status: 'done', duration: 61 * sec },
              { id: 'expiry', name: '检查数据时效', status: 'done', duration: 55 * sec },
              { id: 'report', name: '生成报告', status: 'done', duration: 46 * sec },
            ]}
            labels={LABELS}
          />
          <p data-gallery-ard="picked">{picked === null ? '还没选建议动作' : `选了：${picked}`}</p>
        </div>
      </Row>
      <Row name="暂停与失败">
        <div style={{ width: 440, maxWidth: '100%' }} data-gallery-ard="paused">
          <AgentRunDetail
            name="重算动量因子"
            status="paused"
            progress={0.3}
            elapsed={2 * min}
            formatDuration={formatDuration}
            onAction={() => {}}
            defaultCollapsed={['details']}
            details={[{ id: 'cycle', label: '周期', icon: <CalendarIcon />, value: '日线 · 近 5 年' }]}
            steps={[
              { id: 'a', name: '读取行情', status: 'done', duration: 40 * sec },
              { id: 'b', name: '计算因子', status: 'pending' },
            ]}
            labels={LABELS}
          />
        </div>
        <div style={{ width: 440, maxWidth: '100%' }} data-gallery-ard="failed">
          <AgentRunDetail
            name="抓取快讯"
            status="failed"
            progress={0.45}
            elapsed={80 * sec}
            formatDuration={formatDuration}
            onAction={() => {}}
            defaultCollapsed={['details']}
            details={[{ id: 'source', label: '数据源', icon: <MapPinIcon />, value: '示例源 C' }]}
            steps={[
              { id: 'a', name: '登录', status: 'done', duration: 5 * sec },
              { id: 'b', name: '拉取列表', status: 'failed' },
              { id: 'c', name: '写入', status: 'pending' },
            ]}
            labels={LABELS}
          />
        </div>
      </Row>
    </>
  )
}

export function AgentRunListDemo() {
  return (
    <>
      <p className="gal-note">
        示例数据：两组运行，名字与副标题在左、状态字（灯加词）与相对时间在右；点一行或 Tab 到行上按 Enter / Space
        打开，选中的行有底色（aria-current）。详情用 AgentRunDetail 画。
      </p>
      <Row name="两组运行">
        <AgentRunListUsage />
      </Row>
    </>
  )
}
