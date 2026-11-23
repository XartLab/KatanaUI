// SPDX-License-Identifier: MIT
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vite-plus/test'
import { intersectWithCjk, PINNED_FAMILIES, pinnedFontsCss } from './fonts-plugin.ts'

// 截图环境的中文字体对账（#202）：守三件事——改写出来的 @font-face 对得上字体文件、每条会出中文的字体栈至少有一个名字被指住、
// 源码里的汉字都落在字体的覆盖范围里（不然那个字又回到机器自己的字体）。
const shot = dirname(fileURLToPath(import.meta.url))
const pkg = resolve(shot, '..')
const indexCss = createRequire(import.meta.url).resolve('@fontsource-variable/noto-sans-sc/index.css')
const generated = pinnedFontsCss(readFileSync(indexCss, 'utf8'), dirname(indexCss), shot)
const faces = [...generated.matchAll(/@font-face\s*{[^}]*}/g)].map((m) => m[0])

describe('截图用的中文字体：unicode-range 收窄', () => {
  it('只留与 CJK 区段相交的部分，拉丁区段整片不要', () => {
    expect(intersectWithCjk('U+0000-00ff,U+0131')).toBeUndefined()
    expect(intersectWithCjk('U+4e00-4e02,U+0041')).toBe('U+4e00-4e02')
    expect(intersectWithCjk('U+2000-3001')).toBe('U+2e80-3001')
    expect(intersectWithCjk('U+ff03-ff04,U+ff07,U+1f004')).toBe('U+ff03-ff04,U+ff07')
  })

  it('一片三个名字，url 改成相对 shot/ 的路径', () => {
    const css =
      "@font-face {\n  font-family: 'Noto Sans SC Variable';\n  src: url(./files/a.woff2) format('woff2-variations');\n  unicode-range: U+4e00-4e10,U+0041;\n}\n" +
      "@font-face {\n  font-family: 'Noto Sans SC Variable';\n  src: url(./files/latin.woff2) format('woff2-variations');\n  unicode-range: U+0000-00ff;\n}"
    const out = pinnedFontsCss(css, join(shot, 'fake-pkg'), shot)
    expect([...out.matchAll(/font-family:\s*'([^']+)'/g)].map((m) => m[1])).toEqual([...PINNED_FAMILIES])
    expect(out).toContain("url('fake-pkg/files/a.woff2')")
    expect(out).not.toContain('latin.woff2')
    expect(out).toContain('unicode-range: U+4e00-4e10;')
  })
})

describe('截图用的中文字体：从 @fontsource-variable/noto-sans-sc 现算', () => {
  it('每个名字都有 @font-face，指向的字体文件都在磁盘上，字重是可变范围', () => {
    expect(faces.length).toBeGreaterThan(40 * PINNED_FAMILIES.length)
    for (const family of PINNED_FAMILIES) {
      expect(faces.filter((f) => f.includes(`font-family: '${family}'`)).length, family).toBe(
        faces.length / PINNED_FAMILIES.length,
      )
    }
    for (const face of faces) {
      const url = /url\('([^']+)'\)/.exec(face)?.[1] ?? ''
      expect(existsSync(resolve(shot, url)), url).toBe(true)
      expect(face).toContain('font-weight: 100 900')
    }
  })

  it('会出中文的字体栈，至少有一个名字被它指住（去掉就红：那条栈上的中文又落回机器自己的字体）', () => {
    const tokens = readFileSync(createRequire(import.meta.url).resolve('@katana-ui/tokens/tokens.css'), 'utf8')
    const wide = readFileSync(join(pkg, 'src/theme/fonts.css'), 'utf8')
    for (const name of ['sans', 'sans-small', 'sans-display', 'mono', 'display', 'lcd', 'dot']) {
      const stack = new RegExp(`--font-${name}:([^;]+);`).exec(tokens)?.[1]
      expect(stack, `--font-${name}`).toBeDefined()
      expect(
        PINNED_FAMILIES.some((family) => stack?.includes(`"${family}"`)),
        `--font-${name} 里没有 ${PINNED_FAMILIES.join(' / ')} 中的任何一个`,
      ).toBe(true)
    }
    expect(PINNED_FAMILIES.some((family) => wide.includes(`'${family}'`))).toBe(true)
  })

  it('源码里的汉字、CJK 符号与全角形式都落在字体的覆盖范围里', () => {
    // 覆盖表：CJK 区段都在 BMP 里，开一张 64K 的表，查字是 O(1)。
    const covered = new Uint8Array(0x10000)
    for (const face of faces) {
      for (const part of (/unicode-range:\s*([^;]+);/.exec(face)?.[1] ?? '').split(',')) {
        const [from = '', to = from] = part.trim().replace(/^U\+/i, '').split('-')
        covered.fill(1, Number.parseInt(from, 16), Number.parseInt(to, 16) + 1)
      }
    }
    const cjk = (cp: number) =>
      (cp >= 0x2e80 && cp <= 0x9fff) ||
      (cp >= 0xf900 && cp <= 0xfaff) ||
      (cp >= 0xfe30 && cp <= 0xfe4f) ||
      (cp >= 0xff00 && cp <= 0xffef)
    const missing = new Set<string>()
    for (const dir of ['src', 'gallery', 'browser']) {
      for (const entry of readdirSync(join(pkg, dir), { recursive: true, withFileTypes: true })) {
        if (!entry.isFile() || !/\.(?:ts|tsx|css)$/.test(entry.name)) continue
        const path = join(entry.parentPath, entry.name)
        if (path.includes('node_modules')) continue
        for (const ch of readFileSync(path, 'utf8')) {
          const cp = ch.codePointAt(0) ?? 0
          if (cjk(cp) && covered[cp] !== 1) missing.add(ch)
        }
      }
    }
    expect([...missing].join(''), '这些字不在 Noto Sans SC 的覆盖范围里').toBe('')
  })
})
