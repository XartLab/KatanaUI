// SPDX-License-Identifier: MIT
// Component-screenshot data for AgentRunDetail and AgentRunList: English text on purpose (the sandbox's CJK glyphs do not match the baselines, #202), minimal data, fixed durations.
import { CalendarIcon, ClockIcon, SendIcon, UsersIcon } from 'lucide-react'
import {
  AgentRunDetail,
  AgentRunList,
  type AgentRunDetailLabels,
  type AgentRunListLabels,
} from '../src/blocks/index.ts'

const sec = 1000
const min = 60 * sec
const formatDuration = (ms: number) => {
  const s = Math.round(ms / sec)
  const m = Math.floor(s / 60)
  return m > 0 ? (s % 60 > 0 ? `${m}m ${s % 60}s` : `${m}m`) : `${s}s`
}

const LABELS: AgentRunDetailLabels = {
  back: 'Back',
  status: { running: 'Running', blocked: 'Action required', done: 'Completed', paused: 'Paused', failed: 'Failed' },
  actions: { pause: 'Pause', resume: 'Resume', cancel: 'Cancel', rerun: 'Run again' },
  progress: 'Run progress',
  elapsed: (time) => `${time} elapsed`,
  remaining: (time) => `~${time} remaining`,
  blocked: (time) => `Blocked ${time} ago`,
  completed: (time) => `Completed in ${time}`,
  confirm: 'Confirm',
  next: 'Run next',
  details: 'Details',
  steps: 'Steps',
  estimate: (time) => `~${time}`,
  step: { done: 'Done', running: 'Running', pending: 'Waiting', blocked: 'Blocked', failed: 'Failed' },
}

const details = [
  { id: 'cycle', label: 'Cycle', icon: <CalendarIcon />, value: 'May 2026' },
  { id: 'worker', label: 'Worker', icon: <UsersIcon />, value: '48 contractors' },
  { id: 'started', label: 'Started', icon: <ClockIcon />, value: '14:32 · 12 May 2026' },
]

/** The three main states, stacked: running (current tick), blocked (question card), done (run next). */
export const agentRunDetailStates = (
  <>
    <AgentRunDetail
      name="Run payroll"
      status="running"
      progress={0.62}
      elapsed={6 * min + 12 * sec}
      remaining={4 * min}
      formatDuration={formatDuration}
      onBack={() => {}}
      onAction={() => {}}
      details={details}
      steps={[
        { id: '1', name: 'Authenticate payroll API', status: 'done', duration: 46 * sec },
        { id: '2', name: 'Process contractor records', status: 'running' },
        { id: '3', name: 'Generate payment', status: 'pending' },
      ]}
      labels={LABELS}
    />
    <AgentRunDetail
      name="Create contract"
      status="blocked"
      progress={0.76}
      blockedFor={58 * min}
      formatDuration={formatDuration}
      onBack={() => {}}
      onAction={() => {}}
      question={{ title: 'A worker is missing a Tax ID', description: 'To continue, add it to their profile?' }}
      onConfirm={() => {}}
      defaultCollapsed={['details']}
      details={details}
      steps={[
        { id: '1', name: 'Validate terms', status: 'done', duration: 38 * sec },
        { id: '2', name: 'Verify Tax ID', status: 'blocked' },
      ]}
      labels={LABELS}
    />
    <AgentRunDetail
      name="Review compliance"
      status="done"
      progress={1}
      took={3 * min + 17 * sec}
      formatDuration={formatDuration}
      onBack={() => {}}
      onAction={() => {}}
      next={[
        { id: 'send', label: 'Send report to HR team', icon: <SendIcon />, estimate: 2 * min },
        { id: 'schedule', label: 'Schedule re-run in 30 days', estimate: 1 * min },
      ]}
      defaultCollapsed={['details']}
      details={details}
      steps={[
        { id: '1', name: 'Load worker profiles', status: 'done', duration: 35 * sec },
        { id: '2', name: 'Generate report', status: 'done', duration: 46 * sec },
      ]}
      labels={LABELS}
    />
  </>
)

const LIST_LABELS: AgentRunListLabels = {
  status: { running: 'Running', blocked: 'Action required', done: 'Completed', paused: 'Paused', failed: 'Failed' },
}

export const agentRunList = (
  <AgentRunList
    title="Agents"
    groups={[
      {
        id: 'active',
        title: 'Active now',
        items: [
          {
            id: 'a',
            name: 'Run payroll',
            subtitle: '48 contractors · United States',
            status: 'running',
            when: 'Started 6m ago',
          },
          { id: 'b', name: 'Create contract', subtitle: 'Lucas · Mexico', status: 'blocked', when: 'Blocked 1h ago' },
        ],
      },
      {
        id: 'week',
        title: 'This week',
        items: [
          { id: 'c', name: 'Review compliance', subtitle: '9 contractors · France', status: 'done', when: 'Yesterday' },
          { id: 'd', name: 'Review invoices', subtitle: '14 invoices', status: 'failed', when: '3d ago' },
        ],
      },
    ]}
    selectedId="b"
    labels={LIST_LABELS}
  />
)
