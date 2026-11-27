// SPDX-License-Identifier: MIT
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vite-plus/test'

// 本包要能单独成仓库（XartLab/KatanaUI，#1881）：包里的源码、配置、文档都不许写出包外的相对路径。
// 扫的是文本里每一处「../」开头的路径，按所在文件的目录解析，落到包根之外就红；
// 包内的上行路径（例如 gallery/pages 里引 src/index 的写法）解析后仍在包里，不算。

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const SKIP = new Set(['node_modules', 'dist', 'r', '.git'])
const TEXT = /\.(?:[cm]?[jt]sx?|json|css|html|ya?ml|md)$/

function* files(dir: string): Generator<string> {
  for (const name of readdirSync(dir)) {
    if (SKIP.has(name)) continue
    const path = join(dir, name)
    if (statSync(path).isDirectory()) yield* files(path)
    else if (TEXT.test(name)) yield path
  }
}

/** 文本里越出包根的相对路径（`../` 开头，后面跟的路径段一并取，供解析）。 */
function escapes(file: string, text: string): string[] {
  const found: string[] = []
  for (const match of text.matchAll(/(?<![\w.])(?:\.\.\/)+[\w@.-]*(?:\/[\w@.-]+)*/g)) {
    const target = resolve(dirname(file), match[0])
    const inside = relative(root, target)
    if (inside === '..' || inside.startsWith(`..${sep}`)) found.push(match[0])
  }
  return found
}

describe('包能单独拿出来（#1881）', () => {
  // 整包逐文件读一遍，自建机忙时超过默认 5 秒（#190，2026-11-24 run 45319988571 / 45371922684）。
  it('包里没有出包的相对路径', { timeout: 30_000 }, () => {
    const bad = [...files(root)].flatMap((file) =>
      escapes(file, readFileSync(file, 'utf8')).map((path) => `${relative(root, file)}: ${path}`),
    )
    expect(bad, '这些文件写了包外的路径').toEqual([])
  })

  it('查得出来：包外的路径红，包内的不红', () => {
    // 样例用 repeat 拼出来，免得这个文件自己被上面的扫描当成越界。
    const up = (levels: number) => '../'.repeat(levels)
    const file = join(root, 'gallery', 'pages', 'x.tsx')
    expect(escapes(file, `import a from '${up(2)}src/index'`)).toEqual([])
    expect(escapes(file, `import a from '${up(3)}src/index'`)).toEqual([`${up(3)}src/index`])
    expect(escapes(join(root, 'tsconfig.json'), `"extends": "${up(2)}tsconfig.base.json"`)).toEqual([
      `${up(2)}tsconfig.base.json`,
    ])
  })
})
