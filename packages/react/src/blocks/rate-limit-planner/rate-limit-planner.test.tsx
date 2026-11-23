// SPDX-License-Identifier: MIT
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vite-plus/test'
import {
  clampStart,
  keyMove,
  loadCurve,
  peakOf,
  planStatus,
  sanitizeRun,
  spreadRuns,
  type PlannedRun,
} from './rate-limit-model.ts'
import { RateLimitPlanner, type RateLimitPlannerLabels } from './rate-limit-planner.tsx'

const run = (id: string, start: number, duration: number, rate: number): PlannedRun => ({
  id,
  name: id,
  start,
  duration,
  rate,
})

const LABELS: RateLimitPlannerLabels = {
  status: { ok: '在限额内', near: '接近上限', over: '超过限额' },
  peak: (peak, at) => `峰值 ${peak} · ${at}`,
  limit: '限额',
  buffer: '预警线',
  runs: '任务',
  run: (r, start, end) => `${r.name} ${start}–${end}`,
  locked: '已开始',
  remove: '删除',
  spread: '错开',
  moved: (r, start, peak) => `${r.name} 挪到 ${start}，峰值 ${peak}`,
  empty: '没有任务',
}

describe('限额排程的纯逻辑', () => {
  it('负载曲线按 5 分一格叠加，盖住一格的一部分也算满格', () => {
    const curve = loadCurve([run('a', 0, 10, 100), run('b', 5, 3, 50)], 30)
    expect(curve).toEqual([100, 150, 0, 0, 0, 0])
    expect(loadCurve([run('a', 3, 4, 10)], 15)).toEqual([10, 10, 0])
  })

  it('峰值取最早的最大格；状态按限额与 buffer 分三档', () => {
    expect(peakOf([1, 5, 5, 2])).toEqual({ value: 5, index: 1 })
    expect(planStatus(900, 1000, 0.8)).toBe('near')
    expect(planStatus(1001, 1000, 0.8)).toBe('over')
    expect(planStatus(800, 1000, 0.8)).toBe('ok')
    expect(planStatus(5, 0, 0.8)).toBe('ok')
  })

  it('不合法的数退成安全值', () => {
    expect(sanitizeRun(run('a', Number.NaN, -5, Number.POSITIVE_INFINITY))).toMatchObject({
      start: 0,
      duration: 0,
      rate: 0,
    })
  })

  it('键盘：15 分一步、Shift 与 PageUp / PageDown 一小时、Home / End 到最早 / 最晚，夹在窗口里', () => {
    expect(keyMove(600, 60, 'ArrowRight', false, 0)).toBe(615)
    expect(keyMove(600, 60, 'ArrowLeft', true, 0)).toBe(540)
    expect(keyMove(600, 60, 'PageUp', false, 0)).toBe(660)
    expect(keyMove(600, 60, 'Home', false, 480)).toBe(480)
    expect(keyMove(600, 60, 'End', false, 0)).toBe(1380)
    expect(keyMove(10, 60, 'ArrowLeft', false, 0)).toBe(0)
    expect(keyMove(600, 60, 'a', false, 0)).toBeUndefined()
    expect(clampStart(2000, 60, 0)).toBe(1380)
  })

  it('错开：峰值不升，已开始的不动，次序不变', () => {
    const runs = [run('a', 600, 60, 500), run('b', 600, 60, 500), run('c', 300, 30, 100), run('d', 610, 30, 400)]
    const before = peakOf(loadCurve(runs)).value
    const after = spreadRuns(runs, 0)
    expect(peakOf(loadCurve(after)).value).toBeLessThan(before)
    expect(after.map((r) => r.id)).toEqual(['a', 'b', 'c', 'd'])
    const locked = spreadRuns(runs, 605)
    expect(locked.find((r) => r.id === 'a')!.start).toBe(600)
    expect(locked.find((r) => r.id === 'b')!.start).toBe(600)
    expect(locked.find((r) => r.id === 'd')!.start).toBeGreaterThanOrEqual(605)
  })
})

describe('限额排程的渲染', () => {
  it('每个任务一个 slider；已开始的 aria-disabled 且没有删除钮；超限写 over', () => {
    const html = renderToStaticMarkup(
      <RateLimitPlanner
        defaultRuns={[run('回补', 540, 60, 700), run('新闻', 570, 30, 500)]}
        limit={1000}
        buffer={0.8}
        now={560}
        formatTime={(m) => `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`}
        formatRate={String}
        title="新浪"
        labels={LABELS}
      />,
    )
    expect(html.match(/role="slider"/g)).toHaveLength(2)
    expect(html).toMatch(/aria-disabled="true"[^>]*data-locked=""/)
    expect(html.match(/aria-label="删除 /g)).toHaveLength(1)
    expect(html).toContain('data-status="over"')
    expect(html).toContain('峰值 1200')
  })
})
