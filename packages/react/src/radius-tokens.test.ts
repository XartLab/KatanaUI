// SPDX-License-Identifier: MIT
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vite-plus/test'

// 圆角全部从 token 来（kubai Vibe Design Tips 004，#251 批 B）：主题样式与 TSX 不许再写死像素圆角。
// 写死的圆角切主题时不跟着变（Console 的控件 7、Graphite 的 6），同是浮层里的行还会有两种角；规则与映射见文档站「基础 · 圆角」。
// 允许：0、50%（正圆）、inherit，以及 var(--radius-*)。要豁免一处，在 ALLOW 里写「文件::行内容片段」与原因；用不上的豁免也会红。
const SRC = fileURLToPath(new URL('.', import.meta.url))

/** 豁免：值是 JS 动画的起止值或画布里的几何，不是主题圆角。现在没有；先写好格式，加之前先问为什么不能走 token。 */
const ALLOW: { file: string; includes: string; reason: string }[] = []

const walk = (dir: string): string[] =>
  existsSync(dir)
    ? readdirSync(dir).flatMap((name) => {
        const full = join(dir, name)
        return statSync(full).isDirectory() ? walk(full) : [full]
      })
    : []

/** 样式里 border-radius（含单角写法）的值里带 px 数字。 */
const CSS_PX_RADIUS = /border(?:-(?:top|bottom|start|end)-(?:left|right|start|end))?-radius:\s*[^;}]*\d+(?:\.\d+)?px/
/** Tailwind 任意值写死的像素圆角：rounded-[6px]、rounded-t-[14px]。 */
const TSX_PX_RADIUS = /\brounded(?:-[a-z]{1,2})?-\[\d+(?:\.\d+)?px\]/

const lineHits = (text: string, re: RegExp) =>
  text
    .split('\n')
    .map((line, i) => ({ line, no: i + 1 }))
    .filter(({ line }) => re.test(line))

const cssFiles = walk(join(SRC, 'theme')).filter((f) => f.endsWith('.css'))
const tsxFiles = walk(SRC).filter((f) => f.endsWith('.tsx') && !/\.test\./.test(f))

const scan = (files: string[], re: RegExp) =>
  files.flatMap((file) =>
    lineHits(readFileSync(file, 'utf8'), re)
      .filter(({ line }) => !ALLOW.some((a) => file.endsWith(a.file) && line.includes(a.includes)))
      .map(({ line, no }) => `${file.slice(SRC.length)}:${no}  ${line.trim()}`),
  )

describe('圆角只读 token', () => {
  it('扫到了文件（目录没搬走）', () => {
    expect(cssFiles.length).toBeGreaterThan(50)
    expect(tsxFiles.length).toBeGreaterThan(100)
  })

  it('检查本身会红：像素圆角认得出，token 与 0、50% 放行', () => {
    expect(CSS_PX_RADIUS.test('  border-radius: 6px;')).toBe(true)
    expect(CSS_PX_RADIUS.test('  border-radius: 6px 0 0 6px;')).toBe(true)
    expect(CSS_PX_RADIUS.test('  border-radius: 0 var(--radius-control) 0 0;')).toBe(false)
    expect(CSS_PX_RADIUS.test('  border-top-left-radius: 4px;')).toBe(true)
    expect(CSS_PX_RADIUS.test('  border-radius: var(--radius-inner, 6px);')).toBe(true)
    expect(CSS_PX_RADIUS.test('  border-radius: 50%;')).toBe(false)
    expect(CSS_PX_RADIUS.test('  border-radius: 0;')).toBe(false)
    expect(TSX_PX_RADIUS.test('className="rounded-[6px] px-2"')).toBe(true)
    expect(TSX_PX_RADIUS.test('className="rounded-t-[14px]"')).toBe(true)
    expect(TSX_PX_RADIUS.test('className="rounded-[var(--radius-control)]"')).toBe(false)
    expect(TSX_PX_RADIUS.test('className="rounded-[50%] rounded-full"')).toBe(false)
  })

  it('theme/*.css 里没有写死像素的 border-radius', () => {
    expect(scan(cssFiles, CSS_PX_RADIUS)).toEqual([])
  })

  it('TSX 里没有 rounded-[Npx]', () => {
    expect(scan(tsxFiles, TSX_PX_RADIUS)).toEqual([])
  })

  it('豁免都还用得上', () => {
    const stale = ALLOW.filter(
      (a) =>
        ![...cssFiles, ...tsxFiles].some(
          (f) =>
            f.endsWith(a.file) &&
            readFileSync(f, 'utf8')
              .split('\n')
              .some((line) => line.includes(a.includes)),
        ),
    )
    expect(stale).toEqual([])
  })
})
