// SPDX-License-Identifier: MIT
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { isAbsolute, join, relative, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { afterAll, beforeAll, describe, expect, it } from 'vite-plus/test'
import { inPackage, render } from './docs-props.mjs'

describe('属性声明的包边界', () => {
  it.each([
    ['C:\\repo\\react', 'C:/repo/react/src/primitives/button.tsx', true],
    ['C:\\repo\\react', 'C:\\repo\\react\\src\\primitives\\button.tsx', true],
    ['/repo/react', '/repo/react/src/primitives/button.tsx', true],
    ['/repo/react', '/repo/react/src-other/button.tsx', false],
    ['/repo/react', '/repo/react-other/src/button.tsx', false],
    ['/repo/react', '/repo/react/node_modules/radix-ui/index.d.ts', false],
    ['C:\\repo\\react', 'C:\\repo\\react\\src\\node_modules\\radix-ui\\index.d.ts', false],
  ])('包根 %s 与声明 %s 的归属为 %s', (packageRoot, fileName, expected) => {
    expect(inPackage({ fileName }, packageRoot)).toBe(expected)
  })
})

describe('属性表生成', () => {
  let rendered: string
  // 完整类型图在 Windows 实测需 8.1 秒（2026-11-15）；给生成步骤独立预算，不重复编译，也不改全局超时。
  beforeAll(() => {
    rendered = render()
  }, 30_000)

  it('本包声明的属性不会因 Windows 路径分隔符而丢失', () => {
    const generated = JSON.parse(rendered) as { exports: { Button: { props: { name: string }[] } } }
    expect(generated.exports.Button.props.map((prop) => prop.name)).toEqual(['variant', 'size', 'asChild'])
  })

  it('当前平台的完整生成字节与已提交的属性表一致', () => {
    const committed = readFileSync(new URL('../gallery/props.generated.json', import.meta.url), 'utf8')
    const expected = createHash('sha256').update(committed.replaceAll('\r\n', '\n')).digest('hex')
    expect(createHash('sha256').update(rendered).digest('hex')).toBe(expected)
  })
})

// 在本包内的独立小包运行同字节脚本：真实 TS 编译与文件写入，不替换 generate/render。
// dist 已被包边界扫描排除，夹具创建/清理不会与并行遍历相互干扰。
const fixturesRoot = fileURLToPath(new URL('../dist/.docs-props-fixtures/', import.meta.url))
const fixtures: string[] = []
const generatedComment = JSON.parse(readFileSync(new URL('../gallery/props.generated.json', import.meta.url), 'utf8'))
  .$comment as string

function fixture(source: string) {
  mkdirSync(fixturesRoot, { recursive: true })
  const root = mkdtempSync(join(fixturesRoot, '.docs-props-fixture-'))
  fixtures.push(root)
  for (const directory of ['scripts', 'src/quant', 'src/blocks', 'gallery']) {
    mkdirSync(join(root, directory), { recursive: true })
  }
  copyFileSync(new URL('./docs-props.mjs', import.meta.url), join(root, 'scripts/docs-props.mjs'))
  writeFileSync(join(root, 'package.json'), '{"type":"module"}\n')
  writeFileSync(join(root, 'tsconfig.json'), '{"compilerOptions":{"target":"ESNext","types":[],"lib":["ESNext"]}}\n')
  writeFileSync(join(root, 'src/index.ts'), source)
  writeFileSync(join(root, 'src/quant/index.ts'), 'export {}\n')
  writeFileSync(join(root, 'src/blocks/index.ts'), 'export {}\n')
  return { script: join(root, 'scripts/docs-props.mjs'), output: join(root, 'gallery/props.generated.json') }
}

function runGenerator(script: string, entrypoint: 'generate' | 'render' = 'render') {
  return spawnSync(
    process.execPath,
    [
      '--input-type=module',
      '-e',
      `import { ${entrypoint} } from ${JSON.stringify(pathToFileURL(script).href)}; const output = ${entrypoint}(); process.stdout.write(typeof output === "string" ? output : JSON.stringify(output))`,
    ],
    { encoding: 'utf8' },
  )
}

afterAll(() => {
  for (const root of fixtures) {
    const inside = relative(resolve(fixturesRoot), resolve(root))
    if (!inside || inside.startsWith('..') || isAbsolute(inside)) throw new Error('拒绝清理夹具目录之外的路径')
    rmSync(root, { recursive: true, force: true })
  }
})

const emptyCases = [
  { name: '没有导出', source: 'export {}\n', exports: {} },
  {
    name: '所有导出的自有属性都为空',
    source: 'export function EmptyComponent() { return null }\nexport const marker = 1\n',
    exports: {
      EmptyComponent: { kind: 'component', source: 'src/index.ts', props: [] },
      marker: { kind: 'value', source: 'src/index.ts', props: [] },
    },
  },
]

describe('整体空属性表不能写出或误报最新', () => {
  it.each(
    emptyCases.flatMap((entry) => [
      { ...entry, entrypoint: 'generate' as const },
      { ...entry, entrypoint: 'render' as const },
    ]),
  )('真实 $entrypoint 拒绝$name', ({ source, entrypoint }) => {
    const { script } = fixture(source)
    const result = runGenerator(script, entrypoint)
    expect(result.status, result.stderr).not.toBe(0)
    expect(result.stderr).toContain('所有导出的属性表都为空')
  })

  it.each(
    emptyCases.flatMap((entry) => [
      { ...entry, args: [], mode: '写入' },
      { ...entry, args: ['--check'], mode: '--check' },
    ]),
  )('真实 CLI $mode 拒绝$name 并保留已有文件', ({ source, exports, args }) => {
    const { script, output } = fixture(source)
    // --check 预存与坏生成结果完全匹配的表，防止只因文件过期而碰巧失败。
    const previous = args.length
      ? `${JSON.stringify({ $comment: generatedComment, exports }, null, 2)}\n`
      : '已有健康产物，不应被整体空表覆盖\n'
    writeFileSync(output, previous)
    const result = spawnSync(process.execPath, [script, ...args], { encoding: 'utf8' })
    expect(result.status, result.stderr).not.toBe(0)
    expect(result.stderr).toContain('所有导出的属性表都为空')
    expect(readFileSync(output, 'utf8')).toBe(previous)
  })

  it('保留合法的单组件空自有属性表', () => {
    const { script } = fixture(
      'export function EmptyComponent() { return null }\nexport function WithOwnProps({ label }: { label: string }) { return null }\n',
    )
    const result = runGenerator(script)
    expect(result.status, result.stderr).toBe(0)
    const generated = JSON.parse(result.stdout) as { exports: Record<string, { props: { name: string }[] }> }
    expect(generated.exports.EmptyComponent.props).toEqual([])
    expect(generated.exports.WithOwnProps.props.map((prop) => prop.name)).toEqual(['label'])
  })
})
