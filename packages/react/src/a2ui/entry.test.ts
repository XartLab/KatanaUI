// SPDX-License-Identifier: MIT
import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vite-plus/test'

// 主入口不污染：A2UI 是可选 peer 依赖，主入口（以及量化、积木入口）的依赖图里不能出现 @a2ui、zod 或 src/a2ui。
const src = resolve(dirname(fileURLToPath(import.meta.url)), '..')

/** 一个入口出发，沿相对引入走一遍，返回走到的文件与见到的所有引入说明符。 */
function graph(entry: string) {
  const seen = new Set<string>()
  const specifiers = new Set<string>()
  const visit = (file: string) => {
    if (seen.has(file)) return
    seen.add(file)
    const text = readFileSync(file, 'utf8')
    for (const match of text.matchAll(/(?:from|import)\s*\(?\s*['"]([^'"]+)['"]/g)) {
      const specifier = match[1]!
      specifiers.add(specifier)
      if (!specifier.startsWith('.')) continue
      const base = resolve(dirname(file), specifier)
      const next = [base, `${base}.ts`, `${base}.tsx`, resolve(base, 'index.ts'), resolve(base, 'index.tsx')].find(
        (path) => existsSync(path) && /\.[tj]sx?$/.test(path),
      )
      if (next) visit(next)
    }
  }
  visit(entry)
  return { files: [...seen], specifiers: [...specifiers] }
}

describe('主入口不引 A2UI', () => {
  for (const entry of ['index.ts', 'quant/index.ts', 'blocks/index.ts']) {
    it(`${entry} 的依赖图里没有 @a2ui、zod 与 src/a2ui`, () => {
      const { files, specifiers } = graph(resolve(src, entry))
      expect(files.length).toBeGreaterThan(10)
      expect(
        specifiers.filter((name) => name.startsWith('@a2ui') || name === 'zod' || name.startsWith('zod/')),
      ).toEqual([])
      expect(files.filter((file) => file.startsWith(resolve(src, 'a2ui')))).toEqual([])
    })
  }

  it('查得出来：a2ui 入口自己的依赖图里有 @a2ui', () => {
    const { specifiers } = graph(resolve(src, 'a2ui/index.ts'))
    expect(specifiers.some((name) => name.startsWith('@a2ui/'))).toBe(true)
  })
})
