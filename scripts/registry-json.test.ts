// SPDX-License-Identifier: MIT
import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vite-plus/test'
import { PAGES } from '../gallery/registry'
import { buildRegistry, registryText } from './registry-json.mjs'

const pkgDir = fileURLToPath(new URL('..', import.meta.url))

interface Item {
  name: string
  type: string
  description: string
  registryDependencies?: string[]
  dependencies?: string[]
  files: { path: string; target: string; type: string }[]
}

const registry = (await buildRegistry()) as { items: Item[] }

describe('shadcn 注册表清单', () => {
  it('已提交的 registry.json 与源码一致（加了件没重新生成就红）', async () => {
    expect(readFileSync(`${pkgDir}registry.json`, 'utf8')).toBe(await registryText())
  })

  it('item 名唯一，文件都在，落点不撞', () => {
    expect(new Set(registry.items.map((i) => i.name)).size).toBe(registry.items.length)
    const targets = registry.items.flatMap((i) => i.files.map((f) => f.target))
    expect(new Set(targets).size).toBe(targets.length)
    for (const item of registry.items)
      for (const f of item.files) expect(existsSync(`${pkgDir}${f.path}`), f.path).toBe(true)
  })

  it('registryDependencies 都指向清单里有的 item；npm 依赖写死版本', () => {
    const names = new Set(registry.items.map((i) => `@katana/${i.name}`))
    for (const item of registry.items) {
      for (const dep of item.registryDependencies ?? []) expect(names.has(dep), `${item.name} → ${dep}`).toBe(true)
      for (const dep of item.dependencies ?? []) expect(dep, item.name).toMatch(/^(@[^@/]+\/)?[^@/]+@\d+\.\d+\.\d+$/)
    }
  })

  it('type 的分法：primitives 是 ui，lib 是 lib，style 是 style，patterns 与 quant 的件是 component', () => {
    const typeOf = (name: string) => registry.items.find((i) => i.name === name)?.type
    expect(typeOf('button')).toBe('registry:ui')
    expect(typeOf('cn')).toBe('registry:lib')
    expect(typeOf('style')).toBe('registry:style')
    expect(typeOf('multi-select')).toBe('registry:component')
  })

  it('style 带齐 tokens、theme 与动效，落点保持包内的相对结构（@source 的相对路径才有效）', () => {
    const style = registry.items.find((i) => i.name === 'style')!
    const targets = style.files.map((f) => f.target)
    for (const rel of ['ui.css', 'tokens/tokens.css', 'theme/theme.css', 'theme/motion.css']) {
      expect(targets).toContain(`~/src/katana/ui/${rel}`)
    }
  })

  it('katana/ 的件都进注册表：带 JSX 的是 component，纯函数是 lib；样式入口带齐它们的 css', () => {
    const typeOf = (name: string) => registry.items.find((i) => i.name === name)?.type
    expect(typeOf('led')).toBe('registry:component')
    expect(typeOf('number-field-model')).toBe('registry:lib')
    const style = registry.items.find((i) => i.name === 'style')!
    expect(style.files.map((f) => f.path)).toContain('src/theme/led.css')
  })

  it('说明读文档站的页数据：每页的说明就是它声明第一个出口的那个 item 的说明', () => {
    const descriptions = new Set(registry.items.map((i) => i.description))
    for (const page of PAGES) expect(descriptions.has(page.summary), `${page.id} 的说明没进注册表`).toBe(true)
  })
})
