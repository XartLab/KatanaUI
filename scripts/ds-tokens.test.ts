// SPDX-License-Identifier: MIT
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vite-plus/test'
import { THEMES, buildContrast, buildDesignSystemTokens, parseHex, ratio, resolveColor } from './ds-tokens.mjs'

const source = JSON.parse(readFileSync(new URL('../src/tokens/tokens.json', import.meta.url), 'utf8'))

describe('对比度算法', () => {
  it('黑白是 21:1，同色是 1:1（WCAG 2.x 的相对亮度公式）', () => {
    expect(ratio(parseHex('#000000')!, parseHex('#ffffff')!)).toBeCloseTo(21, 5)
    expect(ratio(parseHex('#808080')!, parseHex('#808080')!)).toBeCloseTo(1, 5)
  })

  it('别名沿 {name} 解到最终色值，成环报错', () => {
    const byName = new Map([
      ['a', { name: 'a', value: '{b}' }],
      ['b', { name: 'b', value: { console: '#111111', graphite: '#222222' } }],
      ['x', { name: 'x', value: '{y}' }],
      ['y', { name: 'y', value: '{x}' }],
    ])
    expect(resolveColor(byName, 'a', 'graphite')).toBe('#222222')
    expect(() => resolveColor(byName, 'x', 'console')).toThrow(/成环/)
  })
})

describe('设计系统包的 tokens.json', () => {
  const out = buildDesignSystemTokens(source)

  it('只有实装了的两个主题；Paper 的值不带进来', () => {
    expect(out.color.themes).toEqual(THEMES)
    expect(JSON.stringify(out.color.tokens)).not.toContain('paper')
  })

  it('每个 token 都有 usage；数值原样搬（bg-000 的两个主题值与源一致）', () => {
    for (const group of [out.color, out.spacing, out.radius]) {
      for (const token of group.tokens) expect(token.usage, token.name).toBeTruthy()
    }
    const bg = out.color.tokens.find((t: { name: string }) => t.name === 'bg-000')
    const src = source.color.tokens.find((t: { name: string }) => t.name === 'bg-000')
    expect(bg.value).toEqual({ console: src.value.console, graphite: src.value.graphite })
  })

  it('主题级的圆角取 Console 的值，Graphite 的值写进 usage，不丢', () => {
    const radius = out.radius.tokens.find((t: { name: string }) => t.name === 'radius-control')
    expect(radius.value).toBe('7px')
    expect(radius.usage).toContain('Graphite 下为 6px')
  })

  it('contrast 只列过线的对；过不了的（ink-400）保留原值，比值写进 usage', () => {
    const { contrast } = buildContrast(source)
    expect(contrast.some((c: { text: string }) => c.text === 'ink-400')).toBe(false)
    const ink4 = out.color.tokens.find((t: { name: string }) => t.name === 'ink-400')
    expect(ink4.usage).toMatch(/\d\.\d\d:1/)
    expect(ink4.value).toEqual({
      console: source.color.tokens.find((t: { name: string }) => t.name === 'ink-400').value.console,
      graphite: source.color.tokens.find((t: { name: string }) => t.name === 'ink-400').value.graphite,
    })
    // 焦点环按 3:1 量，且五层底都在。
    const ring = contrast.find((c: { text: string }) => c.text === 'focus-ring')
    expect(ring.min).toBe(3)
    expect(ring.on).toEqual(['bg-000', 'bg-100', 'bg-200', 'bg-300', 'bg-400'])
  })

  it('contrast 里每一对在两个主题里都真的过线（不是只信生成器自己的分组）', () => {
    const byName = new Map(source.color.tokens.map((t: { name: string }) => [t.name, t]))
    for (const { text, on, min } of out.contrast) {
      for (const { id } of THEMES) {
        for (const ground of on) {
          const r = ratio(
            parseHex(resolveColor(byName as never, text, id))!,
            parseHex(resolveColor(byName as never, ground, id))!,
          )
          expect(r, `${text} on ${ground} (${id})`).toBeGreaterThanOrEqual(min)
        }
      }
    }
  })

  it('文字样式：type.scale 的每一档都进了某一组', () => {
    const names = out.type.groups.flatMap((g: { styles: { name: string }[] }) => g.styles.map((s) => s.name))
    expect(names.sort()).toEqual(source.type.scale.tokens.map((t: { name: string }) => t.name).sort())
    for (const group of out.type.groups) expect(Object.keys(out.type.families)).toContain(group.family)
  })
})
