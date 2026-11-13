// SPDX-License-Identifier: MIT
import { describe, expect, it } from 'vite-plus/test'
import { declaredVars, hoistRawColours, referencedVars, runtimeVarsBlock } from './ds-css.mjs'

const compare = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0)

describe('hoistRawColours', () => {
  it('声明里的 #hex 与 color-mix（含嵌套括号）提成 :root 变量，值原样', () => {
    const css = [
      '.a {',
      '  background-color: #ffffff0f;',
      '  border-color: color-mix(in oklab, var(--color-white) 6%, transparent);',
      '  box-shadow: 0 0 0 1px #0000, 0 1px rgb(0 0 0 / 0.5);',
      '}',
    ].join('\n')
    const { css: out, hoisted } = hoistRawColours(css)
    expect(out).not.toMatch(/#[0-9a-f]{3,8}|color-mix\(|rgb\(/)
    expect(out).toContain('background-color: var(--ds-c-')
    expect([...hoisted.values()].sort(compare)).toEqual(
      ['#0000', '#ffffff0f', 'color-mix(in oklab, var(--color-white) 6%, transparent)', 'rgb(0 0 0 / 0.5)'].sort(
        compare,
      ),
    )
  })

  it('不动自定义属性的值、选择器、var(--color-…) 名字里的字符', () => {
    const css = '.x {\n  --tw-ring: 0 0 #0000;\n  color: var(--color-white);\n}\n.y-#abc { }'
    const { css: out, hoisted } = hoistRawColours(css)
    expect(out).toBe(css)
    expect(hoisted.size).toBe(0)
  })

  it('同一个值同一个名字，与出现次序无关', () => {
    const one = hoistRawColours('.a {\n  color: #ffffff12;\n}\n.b {\n  color: #fff;\n}').hoisted
    const two = hoistRawColours('.b {\n  color: #fff;\n}\n.a {\n  color: #ffffff12;\n}').hoisted
    expect([...one.keys()].sort(compare)).toEqual([...two.keys()].sort(compare))
  })
})

describe('运行时变量', () => {
  it('引用但没声明的挑出来，声明成 initial', () => {
    const css = '.a { height: var(--radix-x); color: var(--ink-100, red); }\n:root { --ink-100: #fff; }'
    const missing = [...referencedVars(css)].filter((n) => !declaredVars(css).has(n))
    expect(missing).toEqual(['--radix-x'])
    expect(runtimeVarsBlock(missing)).toBe(':root {\n  --radix-x: initial;\n}\n')
    expect(runtimeVarsBlock([])).toBe('')
  })
})
