// SPDX-License-Identifier: MIT
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
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
  devDependencies?: string[]
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

  it('用到的依赖在 devDependencies 里有类型包就写进 item 的 devDependencies；没有的不凭空加', () => {
    const pkg = JSON.parse(readFileSync(`${pkgDir}package.json`, 'utf8')) as { devDependencies: Record<string, string> }
    const treemap = registry.items.find((i) => i.name === 'treemap-model')!
    expect(treemap.dependencies?.some((d) => d.startsWith('d3-hierarchy@'))).toBe(true)
    expect(treemap.devDependencies).toContain(`@types/d3-hierarchy@${pkg.devDependencies['@types/d3-hierarchy']}`)
    for (const item of registry.items) {
      for (const dev of item.devDependencies ?? []) {
        const name = dev.slice(0, dev.lastIndexOf('@'))
        expect(name, item.name).toMatch(/^@types\//)
        const runtime = name.slice('@types/'.length).replace('__', '/')
        const runtimeName = runtime.includes('/') ? `@${runtime}` : runtime
        expect(
          item.dependencies?.some((d) => d.startsWith(`${runtimeName}@`)),
          `${item.name} 的 ${dev} 没有对应的运行时依赖`,
        ).toBe(true)
      }
      // 没有类型包的运行时依赖不带 devDependencies
      for (const dep of item.dependencies ?? []) {
        const bare = dep.slice(0, dep.lastIndexOf('@'))
        const typesName = `@types/${bare.startsWith('@') ? bare.slice(1).replace('/', '__') : bare}`
        if (!pkg.devDependencies[typesName]) {
          expect(
            item.devDependencies?.some((d) => d.startsWith(`${typesName}@`)) ?? false,
            `${item.name} ${typesName}`,
          ).toBe(false)
        }
      }
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
    for (const rel of ['ui.css', 'tokens.css', 'theme/theme.css', 'theme/motion.css']) {
      expect(targets).toContain(`~/src/katana/ui/${rel}`)
    }
  })

  it('katana/ 与 patterns/ 的件都进注册表：带 JSX 的是 component，纯函数是 lib；样式入口带齐它们的 css', () => {
    const typeOf = (name: string) => registry.items.find((i) => i.name === name)?.type
    expect(typeOf('led')).toBe('registry:component')
    expect(typeOf('number-field-model')).toBe('registry:lib')
    const style = registry.items.find((i) => i.name === 'style')!
    expect(style.files.map((f) => f.path)).toContain('src/theme/led.css')
  })

  it('说明读文档站的页数据：每页的说明就是它声明第一个出口的那个 item 的说明', () => {
    const descriptions = new Set(registry.items.map((i) => i.description))
    // 没有出口的页（#115：排版规则、这一块用哪档分量）是写给人看的选法，不对应注册表里的 item。
    for (const page of PAGES.filter((item) => item.exports.length > 0))
      expect(descriptions.has(page.summary), `${page.id} 的说明没进注册表`).toBe(true)
  })
})

describe('buildRegistry 的读文件缓存只管一次生成（#214 审查 6）', () => {
  it('同一进程里源码变了，下一次生成读到新内容（isolate: false、watch 下不能拿旧的）', async () => {
    // 临时的迷你包：脚本拷进去，它按自己所在位置找 package.json、src、gallery。
    const dir = mkdtempSync(join(tmpdir(), 'registry-cache-'))
    try {
      mkdirSync(join(dir, 'scripts'))
      mkdirSync(join(dir, 'gallery'))
      mkdirSync(join(dir, 'src/lib'), { recursive: true })
      copyFileSync(`${pkgDir}scripts/registry-json.mjs`, join(dir, 'scripts/registry-json.mjs'))
      writeFileSync(
        join(dir, 'package.json'),
        JSON.stringify({
          dependencies: { tailwindcss: '4.0.0' },
          peerDependencies: { '@katana-ui/tokens': '1.0.0' },
          devDependencies: {},
        }),
      )
      writeFileSync(join(dir, 'gallery/registry.ts'), 'export const PAGES = []\n')
      writeFileSync(join(dir, 'src/lib/num.ts'), 'export const one = 1\n')
      const mod = await import(/* @vite-ignore */ pathToFileURL(join(dir, 'scripts/registry-json.mjs')).href)
      // 迷你包不全，第一次会在后面某项（quant-format 没有说明）报错，但 num.ts 的内容已经读进缓存了。
      await expect(mod.buildRegistry()).rejects.toThrow(/quant-format/)
      writeFileSync(join(dir, 'src/lib/num.ts'), "import 'zz-probe-pkg'\nexport const one = 1\n")
      await expect(mod.buildRegistry()).rejects.toThrow(/zz-probe-pkg/)
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })
})
