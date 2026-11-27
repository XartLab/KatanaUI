// SPDX-License-Identifier: MIT
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { describe, expect, it } from 'vite-plus/test'

// Precision Instrument UI（#1934 B）：语义别名、没有材质厚度、发光只给状态灯、图表面排线。
const req = createRequire(import.meta.url).resolve
const css = readFileSync(req('@katana-ui/tokens/tokens.css'), 'utf8')
const tokens = JSON.parse(readFileSync(req('@katana-ui/tokens/tokens.json'), 'utf8'))
const themes = ['console', 'graphite'] as const

type Token = { name: string; value: string | Record<string, string> }
const find = (group: 'color' | 'shadow', name: string): Token =>
  tokens[group].tokens.find((token: Token) => token.name === name)

describe('语义别名', () => {
  it('accent 在每个主题里都指向 signal-orange，没有新色值', () => {
    const accent = find('color', 'accent').value as Record<string, string>
    const themes = (tokens.color.themes as { id: string }[]).map((theme) => theme.id)
    expect(Object.keys(accent).sort()).toEqual([...themes].sort())
    for (const theme of themes) expect(accent[theme]).toBe('{signal-orange}')
    expect(css).toContain('--accent: var(--signal-orange);')
  })

  it('side-buy / side-sell 是 fill-buy / fill-sell 的别名，跟涨跌色是两个名字', () => {
    expect(find('color', 'side-buy').value).toMatchObject({ console: '{fill-buy}' })
    expect(find('color', 'side-sell').value).toMatchObject({ console: '{fill-sell}' })
    expect(css).toContain('--side-buy: var(--fill-buy);')
    expect(css).toContain('--side-sell: var(--fill-sell);')
  })

  it('焦点环取 accent', () => {
    expect(css).toContain('--focus-ring: var(--accent);')
  })
})

describe('删材质', () => {
  it('plate 没有底部 2px 厚度', () => {
    for (const theme of themes)
      expect((find('shadow', 'plate').value as Record<string, string>)[theme]).not.toMatch(/0 2px 0/)
    expect(css).not.toMatch(/--plate:[^;]*0 2px 0/)
  })

  it('勾选与滑块不再取 glow-orange', () => {
    for (const file of ['primitives/checkbox.tsx', 'primitives/slider.tsx'])
      expect(readFileSync(new URL(`./${file}`, import.meta.url), 'utf8')).not.toContain('glow-orange')
  })
})

describe('图表面排线', () => {
  it('hatch 是 45° 的 1px 线，色取 line-100', () => {
    expect(css).toContain('--hatch: repeating-linear-gradient(45deg, var(--line-100) 0 1px, transparent 1px 6px);')
  })
})
