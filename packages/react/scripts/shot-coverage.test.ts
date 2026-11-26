// SPDX-License-Identifier: MIT
import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'
// @ts-expect-error 纯 JS 脚本，没有类型声明
import * as cov from './shot-coverage.mjs'

const { browserTestPlan, changedLines, parseTests, GRAPHITE_ALL, ranAnyShot, gitDiffOf, shotExternalChanged } = cov
const pkgDir = new URL('..', import.meta.url).pathname
const FILE = 'browser/x.browser.test.tsx'
const tmps: string[] = []
afterAll(() => tmps.forEach((d) => rmSync(d, { recursive: true, force: true })))
const tmp = () => {
  const d = mkdtempSync(join(tmpdir(), 'shotcov-'))
  tmps.push(d)
  return d
}
/** 写一个只有 browser/x.browser.test.tsx 的临时包，返回目录。 */
const pkgWith = (text: string) => {
  const d = tmp()
  mkdirSync(join(d, 'browser'))
  writeFileSync(join(d, FILE), text)
  return d
}
const hunk = (...lines: number[]) => lines.map((n) => `@@ -${n} +${n} @@\n-a\n+b`).join('\n')
const plan = (text: string, diff: string | null, changed = [FILE], extra = false) =>
  browserTestPlan(pkgWith(text), changed, () => diff, extra)

// 行号：1 import，2 空，3 describe，4 beforeEach，5 空，6-8 kbd，9-11 tag，12 afterEach，13 })
const BASIC = [
  "import { test } from 'vite-plus/test'",
  '',
  "describe('graphite', () => {",
  '  beforeEach(() => reset())',
  '',
  "  test('kbd', async () => {",
  '    await a()',
  '  })',
  "  test('tag', async () => {",
  '    await b()',
  '  })',
  '  afterEach(() => reset())',
  '})',
].join('\n')

describe('parseTests：条目带起止行', () => {
  it('括号配平算出结束行；上方紧挨着的注释算它的', () => {
    const text = ["  test('a', () => {", '    x()', '  })', '  // skipped: no frame', "  test.skip('b', () => 1)"].join(
      '\n',
    )
    expect(parseTests(text).entries).toMatchObject([
      { name: 'a', line: 1, end: 3, skip: false },
      { name: 'b', line: 4, end: 5, skip: true },
    ])
  })
  it('字符串、模板、JSX 里的括号与撇号不干扰配平', () => {
    const text = [
      "test('a', () => {",
      "  mount(<p>Don't (stop)</p>)",
      "  tpl(`x(${')'})`)",
      '  expect(\'a)\').toBe(")")',
      '})',
      "test('b', () => 1)",
    ].join('\n')
    expect(parseTests(text)).toMatchObject({
      unparsed: false,
      entries: [
        { name: 'a', end: 5 },
        { name: 'b', line: 6 },
      ],
    })
  })
  it('it(...) 也认；表式（const items）的键是测试名，条目到下一个键之前', () => {
    const text = [
      'const items: Record<string, React.ReactNode> = {',
      "  'dot-matrix': <A />,",
      '  // note',
      '  lcd: <L />,',
      '}',
      "describe('graphite', () => {",
      '  for (const [name, node] of Object.entries(items)) {',
      '    test(name, async () => {',
      '    })',
      '  }',
      "  it('lit', () => 1)",
      '})',
    ].join('\n')
    const { entries, unparsed } = parseTests(text)
    expect(unparsed).toBe(false)
    expect(entries.map((e: { name: string; line: number; end: number }) => [e.name, e.line, e.end])).toEqual([
      ['dot-matrix', 2, 2],
      ['lcd', 3, 4],
      ['lit', 11, 11],
    ])
  })
  it.each([
    ['多行声明', "test(\n  'long-name',\n  () => 1,\n)"],
    ['test.each', "test.each([1, 2])('row %s', () => 1)"],
    ['模板名', 'test(`${theme}-x`, () => 1)'],
    ['describe.each', "describe.each([1])('g %s', () => {})"],
    ['skipIf', "test.skipIf(ci)('a', () => 1)"],
    ['配不平的括号', "test('a', () => {\n  x(\n})"],
    ['测试后面还跟着别的', "test('a', () => 1); foo()"],
  ])('认不出的写法：%s → unparsed', (_n, text) => {
    expect(parseTests(text as string).unparsed).toBe(true)
  })
})

describe('changedLines', () => {
  it('取新文件里的行号', () => {
    expect([...changedLines('@@ -3,0 +4,2 @@\n+a\n+b\n@@ -10,2 +12 @@')].sort((a, b) => a - b)).toEqual([4, 5, 12])
  })
  it('纯删除删在第 b 与 b+1 行之间：两行都记（第 0 行不记）', () => {
    expect([...changedLines('@@ -3,2 +2,0 @@')].sort((a, b) => a - b)).toEqual([2, 3])
    expect([...changedLines('@@ -1,2 +0,0 @@')]).toEqual([1])
  })
})

describe('browserTestPlan（#201：改截图测试不再整套跑）', () => {
  it('改动落在一个 test 里：只跑那个名字', () => {
    const p = plan(BASIC, hunk(7))
    expect([...p.names]).toEqual(['kbd'])
    expect(p.shared).toBe(false)
    expect(p.whole.size + p.fileWide.size).toBe(0)
  })
  it('1：test 之外的行（import、describe 内的 hook、最后一个 test 之后）→ 该文件全部名字，不算到上一个 test 上', () => {
    for (const line of [1, 4, 12]) {
      const p = plan(BASIC, hunk(line))
      expect([...p.names].sort()).toEqual(['kbd', 'tag'])
      expect(p.fileWide.has(FILE)).toBe(true)
    }
  })
  it('1：落在两个 test 之间的空行也算 test 之外', () => {
    const text = "test('a', () => {\n})\n\ntest('b', () => {\n})"
    expect([...plan(text, hunk(3)).names].sort()).toEqual(['a', 'b'])
  })
  it('1：认不出的写法 → 整个文件跑（whole），不只截一个别的件', () => {
    for (const body of ["test.each([1])('r %s', () => 1)", "test(\n 'n',\n () => 1)", 'test(`${t}-x`, () => 1)']) {
      const p = plan(`test('a', () => {\n})\n${body}`, hunk(2))
      expect(p.whole.has(FILE)).toBe(true)
      expect(p.names.size).toBe(0)
    }
  })
  it('2：diff 取不到（git 非 0 退出，diffOf 返回 null）→ 整个文件', () => {
    expect(plan(BASIC, null).whole.has(FILE)).toBe(true)
  })
  it('2：diff 有内容却一行都解析不出（带颜色码、外部 diff）→ 整个文件，不是什么都不截', () => {
    const p = plan(BASIC, '\x1b[36m@@ -7 +7 @@\x1b[m\n-a\n+b')
    expect(p.whole.has(FILE)).toBe(true)
  })
  it('2：未跟踪的新文件（diff 为空串）→ 全部名字', () => {
    expect([...plan(BASIC, '').names].sort()).toEqual(['kbd', 'tag'])
  })
  it('3：skip / todo 的不算名字；改动只落在它们上 → skippedOnly，不报错也不截', () => {
    const text = [
      "test('a', () => 1)",
      '// skipped: no stable frame',
      "test.skip('b', () => 1)",
      "test.todo('c', () => 1)",
    ].join('\n')
    const onlySkip = plan(text, hunk(2))
    expect(onlySkip.names.size).toBe(0)
    expect(onlySkip.skippedOnly.has(FILE)).toBe(true)
    const wide = plan(text, hunk(1, 3))
    expect([...wide.names]).toEqual(['a'])
    expect(wide.skippedOnly.size).toBe(0)
    const allSkip = plan("// h\ntest.skip('b', () => 1)", hunk(1))
    expect(allSkip.names.size).toBe(0)
    expect(allSkip.skippedOnly.has(FILE)).toBe(true)
  })
  it('4：纯删除删掉第一个 test 上方的 hook → 整个文件（不只截第一个 test）', () => {
    // 删掉第 4 行的 beforeEach：-4 +3,0，两边是 describe 行与（空行后的）kbd
    const p = plan(BASIC, '@@ -4 +3,0 @@\n-  beforeEach(() => reset())')
    expect([...p.names].sort()).toEqual(['kbd', 'tag'])
    expect(p.fileWide.has(FILE)).toBe(true)
  })
  it('4：删掉夹在两个 test 之间的 hook（两侧邻居都在 test 里）也是整个文件', () => {
    const text = "test('a', () => {\n})\ntest('b', () => {\n})"
    const p = plan(text, '@@ -3 +2,0 @@\n-  afterEach(x)')
    expect([...p.names].sort()).toEqual(['a', 'b'])
    expect(p.fileWide.has(FILE)).toBe(true) // 是「整个文件」，不是碰巧邻居两个
  })
  it('4：删除落在同一个 test 里面 → 只那个 test', () => {
    const p = plan(BASIC, '@@ -7 +6,0 @@\n-    await a()')
    expect([...p.names]).toEqual(['kbd'])
  })
  it('8：共用底座改了 → shared（退回代表件）：browser/ 非测试文件、vitest.browser.config.ts、vite.config.ts、字体与样式入口、shot/、extraShared', () => {
    for (const f of [
      'browser/render.tsx',
      'browser/open-frame.tsx',
      'vitest.browser.config.ts',
      'vite.config.ts',
      'src/fonts.css',
      'src/fonts/ark-pixel-12-zh-subset.woff2',
      'src/ui.css',
      'shot/fonts.css',
    ])
      expect(browserTestPlan(pkgDir, [f], () => '').shared, f).toBe(true)
    expect(browserTestPlan(pkgDir, ['src/katana/lcd.tsx'], () => '', true).shared).toBe(true)
  })
  it('8：只给整页回归用的配置不是共用底座', () => {
    for (const f of ['pixelgate.shared.ts', 'pixelgate.fast.config.ts', 'src/katana/lcd.tsx'])
      expect(browserTestPlan(pkgDir, [f], () => '').shared, f).toBe(false)
  })
})

describe('5：认不出名字的文件整个跑', () => {
  it('-t 模式：外层包 describe 也匹配，Console 与别的名字不匹配', () => {
    const re = new RegExp(GRAPHITE_ALL)
    expect(re.test('graphite > kbd')).toBe(true)
    expect(re.test('logo-provider > graphite > symbol-mark')).toBe(true)
    expect(re.test('console > kbd')).toBe(false)
    expect(re.test('x-graphite > kbd')).toBe(false)
  })
  it('一张都没跑到算失败', () => {
    expect(ranAnyShot({ numPassedTests: 0 })).toBe(false)
    expect(ranAnyShot(undefined)).toBe(false)
    expect(ranAnyShot({ numPassedTests: 3 })).toBe(true)
  })
})

describe('2：gitDiffOf 不受用户的 git 配置影响', () => {
  const git = (cwd: string, ...args: string[]) => spawnSync('git', args, { cwd, encoding: 'utf8' })
  const repo = () => {
    const d = tmp()
    git(d, 'init', '-q')
    git(d, 'config', 'user.email', 't@t')
    git(d, 'config', 'user.name', 't')
    writeFileSync(join(d, 'a.txt'), 'one\ntwo\n')
    git(d, 'add', '-A')
    git(d, 'commit', '-qm', 'i')
    return d
  }
  it('color.diff=always 与 diff.external 配了也能解析出行号', () => {
    const d = repo()
    git(d, 'config', 'color.diff', 'always')
    git(d, 'config', 'diff.external', 'true') // 一个什么也不输出的外部 diff
    writeFileSync(join(d, 'a.txt'), 'one\nTWO\n')
    const diff = gitDiffOf(d, 'HEAD')('a.txt')
    expect(diff).not.toBeNull()
    expect([...changedLines(diff)]).toEqual([2])
  })
  it('git 非 0 退出（坏的 base）→ null', () => {
    expect(gitDiffOf(repo(), 'no-such-ref')('a.txt')).toBeNull()
  })
})

describe('8：shotExternalChanged（tokens 包、pixelgate-cli / playwright 版本）', () => {
  const git = (cwd: string, ...args: string[]) => spawnSync('git', args, { cwd, encoding: 'utf8' })
  const repo = () => {
    const d = tmp()
    git(d, 'init', '-q')
    git(d, 'config', 'user.email', 't@t')
    git(d, 'config', 'user.name', 't')
    mkdirSync(join(d, 'packages/react'), { recursive: true })
    writeFileSync(join(d, 'package.json'), '{"name":"r"}\n')
    writeFileSync(
      join(d, 'packages/react/package.json'),
      '{"devDependencies":{"pixelgate-cli":"1.0.0","react":"19.0.0"}}\n',
    )
    writeFileSync(join(d, 'pnpm-lock.yaml'), 'pixelgate-cli: 1.0.0\nreact: 19.0.0\n')
    git(d, 'add', '-A')
    git(d, 'commit', '-qm', 'i')
    return d
  }
  it('没改 → false', () => expect(shotExternalChanged(repo(), 'HEAD', [])).toBe(false))
  it('tokens 包改了 → true', () =>
    expect(shotExternalChanged(repo(), 'HEAD', ['packages/tokens/src/tokens.css'])).toBe(true))
  it('pixelgate-cli 版本变了 → true', () => {
    const d = repo()
    writeFileSync(join(d, 'pnpm-lock.yaml'), 'pixelgate-cli: 1.1.0\nreact: 19.0.0\n')
    expect(shotExternalChanged(d, 'HEAD', [])).toBe(true)
  })
  it('别的依赖变了不算', () => {
    const d = repo()
    writeFileSync(join(d, 'pnpm-lock.yaml'), 'pixelgate-cli: 1.0.0\nreact: 19.1.0\n')
    expect(shotExternalChanged(d, 'HEAD', [])).toBe(false)
  })
  it('git 取不到（坏的 base）→ 按变了算', () => expect(shotExternalChanged(repo(), 'no-such-ref', [])).toBe(true))
})

describe('真实的 13 个截图测试文件都解析得出来', () => {
  it('没有 unparsed（否则每次改它们都整个文件跑）', async () => {
    const { readdirSync, readFileSync } = await import('node:fs')
    for (const f of readdirSync(join(pkgDir, 'browser')).filter((n) => n.endsWith('.browser.test.tsx')))
      expect(parseTests(readFileSync(join(pkgDir, 'browser', f), 'utf8')).unparsed, f).toBe(false)
  })
})
