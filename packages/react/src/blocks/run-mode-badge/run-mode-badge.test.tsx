// SPDX-License-Identifier: MIT
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vite-plus/test'
import { RUN_MODES, RunModeBadge } from './run-mode-badge.tsx'

const labels = { paper: '模拟', replay: '回放', forward: '前向测试', live: '实盘' } as const
const render = (mode: (typeof RUN_MODES)[number], detail?: string) =>
  renderToStaticMarkup(<RunModeBadge mode={mode} labels={labels} detail={detail} />)

describe('RunModeBadge', () => {
  it('四种模式各写自己的字、带自己的 data-mode', () => {
    for (const mode of RUN_MODES) {
      const html = render(mode)
      expect(html).toContain(`data-mode="${mode}"`)
      expect(html).toContain(`>${labels[mode]}<`)
    }
  })
  it('四种模式的图形两两不同（不只靠颜色分）', () => {
    const glyphs = RUN_MODES.map((mode) => /<svg[\s\S]*<\/svg>/.exec(render(mode))![0])
    expect(new Set(glyphs).size).toBe(4)
  })
  it('图形对读屏隐藏，读屏只读文字；补充文字跟在后面', () => {
    const html = render('replay', '2026-01-05')
    expect(html).toContain('aria-hidden="true"')
    expect(html).toContain('2026-01-05')
  })
  it('不混：同一个徽标只有一种模式', () => {
    const html = render('live')
    expect(html.match(/data-mode=/g)).toHaveLength(1)
    expect(html).not.toContain('模拟')
  })
})
