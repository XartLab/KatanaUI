// SPDX-License-Identifier: MIT
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vite-plus/test'

// token 三层（#1943，照 Salt 的 Foundation → Palette → Characteristics）：组件只读 characteristics 与密度，不读 palette。
// 这里守生成物（@katana-ui/tokens 的 tokens.css）的骨架：三个密度块、characteristics 只引用已声明的变量。
const SRC = fileURLToPath(new URL('.', import.meta.url))
const css = readFileSync(createRequire(import.meta.url).resolve('@katana-ui/tokens/tokens.css'), 'utf8')

/** 取一个选择器对应的块体（选择器原样出现在行首）。 */
function block(selector: string): string {
  const start = css.indexOf(`\n${selector} {`)
  expect(start, `tokens.css 里有 ${selector} 块`).toBeGreaterThanOrEqual(0)
  return css.slice(start, css.indexOf('\n}', start))
}

describe('密度三档', () => {
  it('medium 是默认（挂在 :root），high 26、low 36', () => {
    expect(block(":root, [data-density='medium']")).toContain('--k-size-base: 30px;')
    expect(block("[data-density='high']")).toContain('--k-size-base: 26px;')
    expect(block("[data-density='low']")).toContain('--k-size-base: 36px;')
  })

  it('图标按钮与行高：24 / 28 / 36', () => {
    expect(block("[data-density='high']")).toContain('--k-size-row: 24px;')
    expect(block(":root, [data-density='medium']")).toContain('--k-size-row: 28px;')
    expect(block("[data-density='low']")).toContain('--k-size-row: 36px;')
  })

  it('medium 在 high、low 之前（同权重，后写的赢）', () => {
    const at = (selector: string) => css.indexOf(`\n${selector} {`)
    expect(at(":root, [data-density='medium']")).toBeLessThan(at("[data-density='high']"))
    expect(at(":root, [data-density='medium']")).toBeLessThan(at("[data-density='low']"))
  })
})

describe('characteristics 只引用已声明的变量', () => {
  const declared = new Set([...css.matchAll(/^\s*(--[\w-]+)\s*:/gm)].map((m) => m[1]))
  const lines = css.split('\n').filter((line) => /^\s*--k-(?!size|spacing)[\w-]+:/.test(line))

  it('扫到了 characteristics', () => {
    expect(lines.length).toBeGreaterThan(25)
  })

  it('每个 var(--x) 引用都在 tokens.css 里声明过', () => {
    const bad = lines.flatMap((line) =>
      [...line.matchAll(/var\((--[\w-]+)\)/g)].map((m) => m[1]!).filter((name) => !declared.has(name)),
    )
    expect(bad).toEqual([])
  })
})

// 迁过来的件不出现 palette 名：颜色只走 --k-* 语义变量（第 2 步起扫整个 primitives 与 patterns）。
// 名字列表：palette 的色阶与别名（theme.css 里 --color-* 的那一批），含 Tailwind 的 bg-white。
const PALETTE_NAMES =
  /(?:^|[\s'"[:(!-])(?:bg|text|border|ring|outline|decoration|fill|stroke|divide|shadow)-(?:alpha-white-\d+|ink(?:-[1-4])?|surface-\d|danger|brand|signal-[\w-]+|white)(?![\w-])/

describe('Button 只读 characteristics', () => {
  const source = readFileSync(join(SRC, 'primitives/button.tsx'), 'utf8')

  it('源码里没有 palette 名', () => {
    expect(source.split('\n').filter((line) => PALETTE_NAMES.test(line))).toEqual([])
  })

  it('检测本身有效：能抓到 bg-alpha-white-3、text-ink-2、hover:bg-white', () => {
    for (const bad of ['bg-alpha-white-3', 'text-ink-2', 'not-disabled:hover:bg-white', "'text-danger"])
      expect(PALETTE_NAMES.test(bad), bad).toBe(true)
    for (const good of ['bg-(--k-actionable-background)', 'text-(color:--k-actionable-foreground)', 'bg-transparent'])
      expect(PALETTE_NAMES.test(good), good).toBe(false)
  })
})
