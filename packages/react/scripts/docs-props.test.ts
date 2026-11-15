// SPDX-License-Identifier: MIT
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { beforeAll, describe, expect, it } from 'vite-plus/test'
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
