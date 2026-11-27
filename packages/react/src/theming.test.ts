// SPDX-License-Identifier: MIT
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { createRequire } from 'node:module'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vite-plus/test'

// 换皮不改组件（#1862）：组件只读语义 token，别的项目覆盖 tokens.css 里的变量就能换皮（docs/theming.md）。
// 所以件里出现的每个 var(--x)（含 Tailwind 的 h-(--x) 简写）都得是 tokens.css 里声明过的名字；写了没声明的名字，换皮的人覆盖了也没用。
// 三类不是 token：Radix 或 UI SDK 在打开的弹层上量好写进来的 --radix-*、--available-height，动效入场用的 --k-in-*（带 fallback，由调用方覆盖），Tailwind 自己的 --tw-*。
const SRC = fileURLToPath(new URL('.', import.meta.url))
const RUNTIME = [/^--radix-/, /^--available-height$/, /^--k-in-/, /^--tw-/]

const walk = (dir: string): string[] =>
  existsSync(dir)
    ? readdirSync(dir).flatMap((name) => {
        const full = join(dir, name)
        return statSync(full).isDirectory() ? walk(full) : [full]
      })
    : []

const tokens = new Set(
  [
    ...readFileSync(createRequire(import.meta.url).resolve('@katana-ui/tokens/tokens.css'), 'utf8').matchAll(
      /^\s*(--[\w-]+)\s*:/gm,
    ),
  ].map((m) => m[1]),
)

/** 文件里引用的变量名：var(--x、h-(--x) 简写；文件自己声明的（[--x:…]、`--x:`、行内样式对象里的 '--x': …，例如 CodeBlock 的 --cb-accent）不算引用。 */
function referenced(text: string): string[] {
  const own = new Set([...text.matchAll(/['"]?(--[\w-]+)['"]?\s*:/g)].map((m) => m[1]))
  return [...text.matchAll(/(?:var\(|[\w-]\()\s*(--[\w-]+)/g)].map((m) => m[1]).filter((name) => !own.has(name))
}

const files = ['primitives', 'katana', 'patterns', 'lib', 'quant', 'blocks']
  .flatMap((dir) => walk(join(SRC, dir)))
  .filter((f) => /\.tsx?$/.test(f) && !/\.test\./.test(f))

describe('组件只读 tokens.css 里的变量', () => {
  it('扫到了件（目录没搬走、正则没失效）', () => {
    expect(files.length).toBeGreaterThan(15)
    expect(files.flatMap((f) => referenced(readFileSync(f, 'utf8'))).length).toBeGreaterThan(20)
  })

  it('每个 var(--x) 都是 token，或是运行时变量', () => {
    const bad = files.flatMap((file) =>
      referenced(readFileSync(file, 'utf8'))
        .filter((name) => !tokens.has(name) && !RUNTIME.some((re) => re.test(name)))
        .map((name) => `${file.slice(SRC.length)}：${name}`),
    )
    expect(bad).toEqual([])
  })
})

// 白色透明度层是一把刻度（--alpha-white-1…14 加 2_5、6_5 两档半步，design/tokens.json），件与主题样式只读它：不写 bg-white/5、border-white/8，也不写 rgba(255, 255, 255, x)。
const RAW_WHITE_ALPHA = /-white\/(?:\d|\[)|rgba\(\s*255\s*,\s*255\s*,\s*255\s*,/
const themeCss = walk(join(SRC, 'theme')).filter((f) => f.endsWith('.css'))

describe('白色透明度只读刻度', () => {
  it('件与主题 CSS 里没有裸的白色透明度', () => {
    const bad = [...files, ...themeCss]
      .filter((file) => RAW_WHITE_ALPHA.test(readFileSync(file, 'utf8')))
      .map((file) => file.slice(SRC.length))
    expect(bad).toEqual([])
  })

  it('刻度 16 档（含 2_5、6_5 两档半步）都在 tokens.css 里，并接成了 Tailwind 的颜色（bg-alpha-white-N）', () => {
    const theme = readFileSync(join(SRC, 'theme/theme.css'), 'utf8')
    for (const step of [1, 2, '2_5', 3, 4, 5, 6, '6_5', 7, 8, 9, 10, 11, 12, 13, 14]) {
      expect(tokens.has(`--alpha-white-${step}`), `--alpha-white-${step}`).toBe(true)
      expect(theme).toContain(`--color-alpha-white-${step}: var(--alpha-white-${step});`)
    }
  })
})
