// SPDX-License-Identifier: MIT
import { describe, expect, it } from 'vitest'
// @ts-expect-error 纯 JS 脚本，没有类型声明
import { browserTestPlan, changedLines, testsOf } from './shot-coverage.mjs'

const pkgDir = new URL('..', import.meta.url).pathname

describe('testsOf', () => {
  it("找出每个 test('名') 的起始行，跳过 describe 与 test.skip 也算", () => {
    const text = [
      "describe('graphite', () => {",
      "  test('kbd', async () => {",
      '  })',
      "  test.skip('wave', () => 1)",
      '})',
    ].join('\n')
    expect(testsOf(text)).toEqual([
      { line: 2, name: 'kbd' },
      { line: 4, name: 'wave' },
    ])
  })
})

describe('changedLines', () => {
  it('从 -U0 差异取新文件里的行号；纯删除记在下一行', () => {
    const diff = ['@@ -3,0 +4,2 @@', '+a', '+b', '@@ -10,2 +12 @@', '-x', '+y', '@@ -20,3 +21,0 @@'].join('\n')
    expect([...changedLines(diff)].sort((a, b) => a - b)).toEqual([4, 5, 12, 22])
  })
})

describe('browserTestPlan（#201：改截图测试不再整套跑）', () => {
  // readouts.browser.test.tsx：kbd(15) flag-mark(19) tag(23) led(38) button(52) 一带；下面按真实文件取行。
  const lines = (n: number) => `@@ -${n} +${n} @@\n-x\n+y`
  it('改动落在一个 test 里：只跑那个名字', () => {
    const plan = browserTestPlan(pkgDir, ['browser/readouts.browser.test.tsx'], () => lines(16))
    expect([...plan.names]).toEqual(['kbd'])
    expect(plan.shared).toBe(false)
    expect(plan.fileWide.size).toBe(0)
  })
  it('改动落在 test 之外（import 之类）：这个文件的全部名字', () => {
    const plan = browserTestPlan(pkgDir, ['browser/readouts.browser.test.tsx'], () => lines(3))
    expect([...plan.names]).toEqual(expect.arrayContaining(['kbd', 'flag-mark', 'tag', 'led', 'button']))
    expect(plan.fileWide.has('browser/readouts.browser.test.tsx')).toBe(true)
  })
  it('新增的未跟踪文件没有差异：按整个文件算', () => {
    const plan = browserTestPlan(pkgDir, ['browser/readouts.browser.test.tsx'], () => '')
    expect(plan.names.size).toBe(5)
  })
  it('只改了共用底座：shared，不带任何文件级名字', () => {
    for (const file of ['browser/render.tsx', 'browser/open-frame.tsx', 'vitest.browser.config.ts']) {
      const plan = browserTestPlan(pkgDir, [file], () => '')
      expect(plan.shared).toBe(true)
      expect(plan.names.size).toBe(0)
    }
  })
})

describe('表式截图测试（const items = { 名: <件> }）', () => {
  it('表里的键是测试名；表之后的改动属于整个文件', () => {
    const text = [
      'const items: Record<string, React.ReactNode> = {',
      "  'dot-matrix': <A />,",
      '  lcd: <LcdUsage />,',
      '  panel: (',
      '    <Panel />',
      '  ),',
      '}',
      'for (const theme of [] as const) {',
      '  test(name, () => 1)',
      "  test('literal', () => 1)",
      '}',
    ].join('\n')
    const tests = testsOf(text)
    expect(tests.map((t: { name: string }) => t.name)).toEqual(['dot-matrix', 'lcd', 'panel', 'literal'])
    expect(tests.find((t: { name: string }) => t.name === 'panel')).toMatchObject({ line: 4, limit: 7 })
  })
  it('katana.browser.test.tsx：改 lcd 那一行只跑 lcd；循环体里的改动是整个文件', () => {
    const file = 'browser/katana.browser.test.tsx'
    const lcd = browserTestPlan(pkgDir, [file], () => '@@ -94 +94 @@\n-a\n+b')
    expect([...lcd.names]).toEqual(['lcd'])
    const loop = browserTestPlan(pkgDir, [file], () => '@@ -190 +190 @@\n-a\n+b')
    expect(loop.names.size).toBeGreaterThan(20)
    expect(loop.names.has('lcd')).toBe(true)
  })
})

describe('条目上方的注释跟着条目走', () => {
  it('改 test 前面的注释就是改那个 test', () => {
    const text = ["  test('a', () => 1)", '  // skipped: no stable frame', "  test.skip('b', () => 1)"].join('\n')
    expect(testsOf(text)).toEqual([
      { line: 1, name: 'a' },
      { line: 2, name: 'b' },
    ])
  })
})
