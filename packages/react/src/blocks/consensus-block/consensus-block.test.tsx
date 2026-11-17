// SPDX-License-Identifier: MIT
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vite-plus/test'
import { ConsensusBlock, countConsensus } from './consensus-block.tsx'

// 结构与纯函数；颜色读 token、阻止项有字，在浏览器里查（e2e/ui-gallery.spec.ts）。G6 从 src/quant/quant-batch2.test.tsx 拆来。

describe('ConsensusBlock', () => {
  const parties = [
    { id: 'g', label: 'GATEWAY', state: 'pass' as const, message: 'ok' },
    { id: 'a', label: 'ACCOUNT', state: 'blocked' as const, message: 'over cap', detail: 'limit 60' },
    { id: 'r', label: 'RULES', state: 'stale' as const, message: 'recheck' },
  ]

  it('countConsensus：未返回、超时、失效、评估中都不算通过', () => {
    expect(countConsensus(parties)).toEqual({ pass: 1, warn: 0, blocked: 1, open: 1 })
  })

  it('每一格有状态字（不只靠颜色）、一句话；阻止项的文字在标记里', () => {
    const html = renderToStaticMarkup(
      <ConsensusBlock label="c" parties={parties} verdict="blocked" verdictText="Blocked" hash={null} />,
    )
    expect(html).toContain('Blocked')
    expect(html).toContain('Re-check')
    expect(html).toContain('over cap')
    expect(html).toContain('data-verdict="blocked"')
    expect(html).toContain('—')
  })

  it('stateLabels 换字；有 detail 的格是按钮（aria-expanded），没有的不是', () => {
    const html = renderToStaticMarkup(
      <ConsensusBlock label="c" parties={parties} verdict="blocked" verdictText="x" stateLabels={{ blocked: 'NO' }} />,
    )
    expect(html).toContain('NO')
    expect(html.match(/<button/g)).toHaveLength(1)
    expect(html).toContain('aria-expanded="false"')
  })

  it('不画 detail，点开才画（初始不在）；点 hash 要给回调才是按钮', () => {
    const html = renderToStaticMarkup(
      <ConsensusBlock label="c" parties={parties} verdict="ok" verdictText="ok" hash="7f3a" onHashClick={() => {}} />,
    )
    expect(html).not.toContain('limit 60')
    expect(html).toContain('<button type="button" class="k-consensus-hash">7f3a')
  })

  it('subject 画在最上面；旧名 intent 与各方的 key 留一个版本照样生效', () => {
    const now = renderToStaticMarkup(
      <ConsensusBlock label="c" subject="Buy 300750" parties={parties} verdict="ok" verdictText="ok" />,
    )
    expect(now).toContain('<div class="k-consensus-intent">Buy 300750</div>')
    const legacy = renderToStaticMarkup(
      <ConsensusBlock
        label="c"
        intent="Sell 600001"
        parties={[{ key: 'old', label: 'OLD', state: 'pass', message: 'ok', detail: 'd' }]}
        verdict="ok"
        verdictText="ok"
      />,
    )
    expect(legacy).toContain('Sell 600001')
    expect(legacy).toContain('aria-expanded="false"')
  })
})
