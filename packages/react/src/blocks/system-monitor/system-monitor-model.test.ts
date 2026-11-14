// SPDX-License-Identifier: MIT
import { describe, expect, it } from 'vite-plus/test'
import {
  filterEvents,
  quotaTone,
  sortEvents,
  sortLinks,
  sortStrategies,
  strategyActions,
  summarize,
  type MonitorEvent,
  type MonitorLink,
  type MonitorStrategy,
} from './system-monitor-model.ts'

const link = (id: string, state: MonitorLink['state']): MonitorLink => ({ id, name: id, state })
const strat = (id: string, status: MonitorStrategy['status']): MonitorStrategy => ({
  id,
  name: id,
  account: 'a',
  symbol: 's',
  status,
})
const ev = (id: string, at: number, severity: MonitorEvent['severity'], kind = 'order'): MonitorEvent => ({
  id,
  at,
  severity,
  kind,
  text: id,
})

describe('system-monitor-model', () => {
  it('连接：异常的排前面，同级保持顺序', () => {
    const out = sortLinks([link('a', 'ok'), link('b', 'degraded'), link('c', 'error'), link('d', 'offline'), link('e', 'ok')])
    expect(out.map((l) => l.id)).toEqual(['c', 'd', 'b', 'a', 'e'])
  })
  it('策略：只把出错的提前，其余不动', () => {
    const out = sortStrategies([strat('a', 'running'), strat('b', 'stopped'), strat('c', 'error'), strat('d', 'paused')])
    expect(out.map((s) => s.id)).toEqual(['c', 'a', 'b', 'd'])
  })
  it('事件：新的在前，按严重程度与类别筛', () => {
    const all = sortEvents([ev('a', 1, 'info'), ev('b', 3, 'error', 'reject'), ev('c', 2, 'warn', 'reject')])
    expect(all.map((e) => e.id)).toEqual(['b', 'c', 'a'])
    expect(filterEvents(all, { kinds: [], minSeverity: 'warn' }).map((e) => e.id)).toEqual(['b', 'c'])
    expect(filterEvents(all, { kinds: ['order'], minSeverity: 'info' }).map((e) => e.id)).toEqual(['a'])
  })
  it('动作与额度色', () => {
    expect(strategyActions('running')).toEqual(['pause', 'stop'])
    expect(strategyActions('paused')).toEqual(['start', 'stop'])
    expect(strategyActions('error')).toEqual(['start'])
    expect(quotaTone(0.95)).toBe('ok')
    expect(quotaTone(0.95, 0.9)).toBe('warn')
    expect(quotaTone(1)).toBe('danger')
  })
  it('汇总', () => {
    expect(summarize([link('a', 'ok'), link('b', 'error')], [strat('a', 'running'), strat('b', 'error')])).toEqual({
      linkIssues: 1,
      strategyErrors: 1,
      active: 1,
    })
  })
})
