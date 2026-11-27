// SPDX-License-Identifier: MIT
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vite-plus/test'
import { FallbackChain, type FallbackChainLabels } from './fallback-chain.tsx'
import { answeredLevel, chainOutcome, type FallbackAttempt } from './fallback-model.ts'

const LABELS: FallbackChainLabels = {
  status: { waiting: '等待', trying: '在试', failed: '失败', answered: '答上', skipped: '不需要' },
  sources: '数据源',
  pending: '等待响应',
  answered: (attempt, level) => `第 ${level} 级 ${attempt.name} 答上`,
  exhausted: '全部失败',
  summary: (o) => `试了 ${o.tried} 级 · ${o.failed} 失败`,
  retry: '重试',
}

const CHAIN: FallbackAttempt[] = [
  { id: 'qt', name: '腾讯 qt', status: 'failed', took: 210, reason: '限流 · 456' },
  { id: 'sina', name: '新浪', status: 'answered', took: 180 },
  { id: 'em', name: '东财', status: 'skipped' },
]

describe('回落链的纯逻辑', () => {
  it('答上的级、失败数、试过几级、耗时', () => {
    expect(chainOutcome(CHAIN)).toEqual({
      answeredId: 'sina',
      failed: 1,
      tried: 2,
      running: false,
      exhausted: false,
      elapsed: 390,
    })
    expect(answeredLevel(CHAIN)).toBe(2)
  })

  it('全部失败才算用完；有一级在试时不算', () => {
    const failed = CHAIN.map((a) => ({ ...a, status: 'failed' as const }))
    expect(chainOutcome(failed).exhausted).toBe(true)
    expect(chainOutcome([{ ...failed[0]! }, { ...failed[1]!, status: 'trying' }]).exhausted).toBe(false)
    expect(chainOutcome([]).exhausted).toBe(false)
    expect(answeredLevel(failed)).toBeNull()
  })
})

describe('回落链的渲染', () => {
  it('有序列表；答上之前的级点亮；响应写哪一级答上', () => {
    const html = renderToStaticMarkup(
      <FallbackChain
        attempts={CHAIN}
        title="取数"
        request="000001.SZ 日 K"
        formatMs={(ms) => `${ms} ms`}
        labels={LABELS}
      />,
    )
    expect(html).toContain('<ol')
    expect(html).toMatch(/data-id="qt"[^>]*data-lit=""/)
    expect(html).toMatch(/data-id="sina"[^>]*data-lit=""/)
    expect(html).not.toMatch(/data-id="em"[^>]*data-lit/)
    expect(html).toContain('第 2 级 新浪 答上')
    expect(html).toContain('限流 · 456')
    expect(html).not.toContain('重试')
  })

  it('全部失败且给了 onRetry 才出重试', () => {
    const failed = CHAIN.map((a) => ({ ...a, status: 'failed' as const }))
    const html = renderToStaticMarkup(
      <FallbackChain attempts={failed} title="取数" request="r" formatMs={String} labels={LABELS} onRetry={() => {}} />,
    )
    expect(html).toContain('全部失败')
    expect(html).toContain('重试')
  })
})
