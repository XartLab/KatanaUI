// SPDX-License-Identifier: MIT
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vite-plus/test'
import { StrategyLauncher, type StrategyEntry } from './strategy-launcher.tsx'

const labels = { region: '策略工具', dismiss: '关闭风险提示', new: '新' }
const entries: StrategyEntry[] = [
  { id: 'grid', name: '网格策略', tags: ['震荡行情', '自动低买高卖'] },
  { id: 'dca', name: '定投加仓', tags: ['分批建仓'], isNew: true },
  { id: 'bare', name: '无标签' },
]

describe('StrategyLauncher', () => {
  it('整件是带读屏名的 section；每张卡是 ul > li 里的原生按钮，箭头对读屏隐藏', () => {
    const html = renderToStaticMarkup(<StrategyLauncher entries={entries} onOpen={() => {}} labels={labels} />)
    expect(html).toMatch(/<section aria-label="策略工具"/)
    expect(html.match(/<li>/g)).toHaveLength(3)
    expect(html.match(/<button type="button" data-slot="launcher-entry"/g)).toHaveLength(3)
    expect(html).toMatch(/lucide-chevron-right[^>]*aria-hidden="true"/)
  })

  it('标签默认用「 / 」连成一行；chips 画成小标签；没有标签的卡不画标签行', () => {
    const text = renderToStaticMarkup(<StrategyLauncher entries={entries} onOpen={() => {}} labels={labels} />)
    expect(text).toContain('震荡行情 / 自动低买高卖')
    expect(text.match(/k-launcher-tags/g)).toHaveLength(2)
    const chips = renderToStaticMarkup(
      <StrategyLauncher entries={entries} onOpen={() => {}} labels={labels} tagStyle="chips" />,
    )
    expect(chips).toContain('data-style="chips"')
    expect(chips).not.toContain(' / ')
    expect(chips.match(/data-slot="tag"/g)).toHaveLength(3) // 三个标签；「新」角标的 data-slot 是 launcher-new
  })

  it('isNew 才画「新」角标，文字取 labels.new', () => {
    const html = renderToStaticMarkup(<StrategyLauncher entries={entries} onOpen={() => {}} labels={labels} />)
    expect(html.match(/data-slot="launcher-new"/g)).toHaveLength(1)
    expect(html).toMatch(/data-slot="launcher-new"[^>]*>新</)
  })

  it('给了 notice 才画风险提示（role=note、warn 语气）与读屏名取 labels.dismiss 的关闭钮', () => {
    const none = renderToStaticMarkup(<StrategyLauncher entries={entries} onOpen={() => {}} labels={labels} />)
    expect(none).not.toContain('launcher-notice')
    const html = renderToStaticMarkup(
      <StrategyLauncher entries={entries} onOpen={() => {}} labels={labels} notice="自动下单有风险" />,
    )
    expect(html).toMatch(/data-slot="launcher-notice"[^>]*data-tone="warn"[^>]*role="note"/)
    expect(html).toContain('自动下单有风险')
    expect(html).toContain('aria-label="关闭风险提示"')
  })
})
