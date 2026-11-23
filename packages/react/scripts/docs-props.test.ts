// SPDX-License-Identifier: MIT
// docs-props 的回归（#59，取代 #62）：Windows 路径分隔符、零导出 / 全空属性表时 generate、render、--check、写入都报错且不动已有文件。
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vite-plus/test'
import { COMMENT, ENTRIES, generate, inPackage, main, render, toPosix } from './docs-props.mjs'

describe('属性声明的包边界', () => {
  it.each([
    ['C:\\repo\\react', 'C:/repo/react/src/primitives/button.tsx', true],
    ['C:\\repo\\react', 'C:\\repo\\react\\src\\primitives\\button.tsx', true],
    ['/repo/react', '/repo/react/src/primitives/button.tsx', true],
    ['/repo/react', '/repo/react/src-other/button.tsx', false],
    ['/repo/react', '/repo/react-other/src/button.tsx', false],
    ['/repo/react', '/repo/react/node_modules/radix-ui/index.d.ts', false],
    ['C:\\repo\\react', 'C:\\repo\\react\\src\\node_modules\\radix-ui\\index.d.ts', false],
  ])('包根 %s 与声明 %s 的归属为 %s', (root, fileName, expected) => {
    expect(inPackage({ fileName }, root)).toBe(expected)
  })

  it('toPosix 只换分隔符', () => {
    expect(toPosix('C:\\a\\b/c.ts')).toBe('C:/a/b/c.ts')
  })
})

describe('本包的属性表', () => {
  let rendered: string
  // 整包类型图要编译几秒（Windows 实测 8.1 秒，2026-11-15）：只编一次，单给预算。
  beforeAll(() => {
    rendered = render()
  }, 60_000)

  it('本包声明的属性列得出来', () => {
    const generated = JSON.parse(rendered) as { exports: { Button: { props: { name: string }[] } } }
    expect(generated.exports.Button.props.map((prop) => prop.name)).toEqual(
      expect.arrayContaining(['variant', 'size', 'asChild']),
    )
  })

  it('与已提交的表一致（换行统一成 LF 再比）', () => {
    const committed = readFileSync(new URL('../gallery/props.generated.json', import.meta.url), 'utf8')
    expect(rendered).toBe(committed.replaceAll('\r\n', '\n'))
  })
})

// 夹具：系统临时目录里的小包，入口与真实包同一份 ENTRIES，真实 TS 编译与文件写入。
const fixtures: string[] = []
afterAll(() => {
  for (const root of fixtures) rmSync(root, { recursive: true, force: true })
})

function fixture(index: string, others: Partial<Record<string, string | null>> = {}) {
  const root = mkdtempSync(join(tmpdir(), 'docs-props-'))
  fixtures.push(root)
  writeFileSync(join(root, 'tsconfig.json'), '{"compilerOptions":{"target":"ESNext","lib":["ESNext"],"types":[]}}\n')
  for (const entry of ENTRIES) {
    const source = entry === 'src/index.ts' ? index : others[entry] === undefined ? 'export {}\n' : others[entry]
    if (source === null) continue
    mkdirSync(dirname(join(root, entry)), { recursive: true })
    writeFileSync(join(root, entry), source)
  }
  mkdirSync(join(root, 'gallery'))
  return { root, out: join(root, 'gallery/props.generated.json') }
}

/** 跑命令行入口，收集 stderr。 */
function cli(args: string[], target: { root: string; out: string }) {
  const errors: string[] = []
  const spy = vi.spyOn(console, 'error').mockImplementation((...parts) => void errors.push(parts.join(' ')))
  const log = vi.spyOn(console, 'log').mockImplementation(() => {})
  try {
    return { code: main(args, target), stderr: errors.join('\n') }
  } finally {
    spy.mockRestore()
    log.mockRestore()
  }
}

const emptyCases = [
  { name: '没有导出', index: 'export {}\n', message: '一个导出都没有', exports: {} },
  {
    name: '全部导出的属性表都空',
    index: 'export function EmptyComponent() { return null }\nexport const marker = 1\n',
    message: '属性表全为空',
    exports: {
      EmptyComponent: { kind: 'component', source: 'src/index.ts', props: [] },
      marker: { kind: 'value', source: 'src/index.ts', props: [] },
    },
  },
]

describe('零导出或全空属性表时拒绝生成', () => {
  it.each(emptyCases)('generate 与 render 拒绝：$name', ({ index, message }) => {
    const { root } = fixture(index)
    expect(() => generate({ root })).toThrow(message)
    expect(() => render({ root })).toThrow(message)
  })

  it.each(emptyCases)('写入时报错且不覆盖已有文件：$name', ({ index, message }) => {
    const target = fixture(index)
    const previous = '已有健康产物，不应被空表覆盖\n'
    writeFileSync(target.out, previous)
    const result = cli([], target)
    expect(result.code).toBe(1)
    expect(result.stderr).toContain(message)
    expect(readFileSync(target.out, 'utf8')).toBe(previous)
  })

  it.each(emptyCases)('--check 遇到与坏结果完全相同的已提交表也报错：$name', ({ index, message, exports }) => {
    const target = fixture(index)
    // 预存与坏结果逐字相同的表，证明失败不是因为文件过期才碰巧红的。
    const previous = `${JSON.stringify({ $comment: COMMENT, exports }, null, 2)}\n`
    writeFileSync(target.out, previous)
    const result = cli(['--check'], target)
    expect(result.code).toBe(1)
    expect(result.stderr).toContain(message)
    expect(readFileSync(target.out, 'utf8')).toBe(previous)
  })

  it('入口缺失时点名是哪个入口', () => {
    const { root } = fixture('export const marker = 1\n', { 'src/quotes/index.ts': null })
    expect(() => generate({ root })).toThrow('入口 src/quotes/index.ts 不在程序里')
  })

  it('只有部分件没有自有属性时照常生成', () => {
    const target = fixture(
      'export function EmptyComponent() { return null }\nexport function WithOwnProps({ label }: { label: string }) { return null }\n',
    )
    const generated = generate({ root: target.root }) as Record<string, { props: { name: string }[] }>
    expect(generated.EmptyComponent.props).toEqual([])
    expect(generated.WithOwnProps.props.map((prop) => prop.name)).toEqual(['label'])
    expect(cli([], target).code).toBe(0)
    expect(cli(['--check'], target).code).toBe(0)
  })

  it('写入失败时报错，不留临时文件', () => {
    const target = fixture('export function WithOwnProps({ label }: { label: string }) { return null }\n')
    // 目标是个目录：临时文件写得出、改名失败。
    mkdirSync(target.out)
    const result = cli([], target)
    expect(result.code).toBe(1)
    expect(result.stderr).toContain('已有文件未改')
    expect(statSync(target.out).isDirectory()).toBe(true)
    expect(readdirSync(join(target.root, 'gallery'))).toEqual(['props.generated.json'])
  })
})
