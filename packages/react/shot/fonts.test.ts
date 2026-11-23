// SPDX-License-Identifier: MIT
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vite-plus/test'
import { intersectWithCjk, PINNED_FAMILIES, PINNED_RANGES, pinnedFontsCss } from './fonts-plugin.ts'

// 截图环境的中文字体对账（#202）：守三件事——改写出来的 @font-face 对得上字体文件、每条会出中文的字体栈至少有一个名字被指住、
// 源码里的汉字都落在字体的覆盖范围里（不然那个字又回到机器自己的字体）。
const shot = dirname(fileURLToPath(import.meta.url))
const pkg = resolve(shot, '..')
const indexCss = createRequire(import.meta.url).resolve('@fontsource-variable/noto-sans-sc/index.css')
const generated = pinnedFontsCss(readFileSync(indexCss, 'utf8'), dirname(indexCss), shot)
const faces = [...generated.matchAll(/@font-face\s*{[^}]*}/g)].map((m) => m[0])

const pinned = (cp: number) => PINNED_RANGES.some(([lo, hi]) => lo <= cp && cp <= hi)

/** 覆盖表：区段都在 BMP 里，开一张 64K 的表，查字是 O(1)。 */
function coverage(blocks: string[]): Uint8Array {
  const covered = new Uint8Array(0x10000)
  for (const block of blocks) {
    for (const part of (/unicode-range:\s*([^;]+);/.exec(block)?.[1] ?? '').split(',')) {
      const [from = '', to = from] = part.trim().replace(/^U\+/i, '').split('-')
      const lo = Number.parseInt(from, 16)
      if (lo < 0x10000) covered.fill(1, lo, Math.min(Number.parseInt(to, 16), 0xffff) + 1)
    }
  }
  return covered
}

/** src、gallery、browser 下 ts / tsx / css 里出现过的字（每个字一次）。 */
function sourceChars(): Set<string> {
  const found = new Set<string>()
  for (const dir of ['src', 'gallery', 'browser']) {
    for (const entry of readdirSync(join(pkg, dir), { recursive: true, withFileTypes: true })) {
      if (!entry.isFile() || !/\.(?:ts|tsx|css)$/.test(entry.name)) continue
      const path = join(entry.parentPath, entry.name)
      if (path.includes('node_modules')) continue
      for (const ch of readFileSync(path, 'utf8')) if ((ch.codePointAt(0) ?? 0) > 0x7f) found.add(ch)
    }
  }
  return found
}

describe('截图用的中文字体：unicode-range 收窄', () => {
  it('只留与指住区段相交的部分，别的区段整片不要', () => {
    expect(intersectWithCjk('U+0030-0039,U+0131')).toBeUndefined()
    expect(intersectWithCjk('U+4e00-4e02,U+0041')).toBe('U+4e00-4e02')
    expect(intersectWithCjk('U+2000-3001')).toBe('U+2010-2027,U+2030-203a,U+22ef,U+2e80-3001')
    expect(intersectWithCjk('U+ff03-ff04,U+ff07,U+1f004')).toBe('U+ff03-ff04,U+ff07')
    // 中文行文里常用的西文标点（· — … “ ”）收进来：前面的拉丁字体都缺时落到 Noto SC，不落到 sans-serif。
    expect(intersectWithCjk('U+0000-00ff')).toBe('U+a7,U+ab,U+b7,U+bb')
    expect(intersectWithCjk('U+2014,U+2026,U+201c-201d')).toBe('U+2014,U+2026,U+201c-201d')
  })

  it('一片三个名字，url 改成相对 shot/ 的路径', () => {
    const css =
      "@font-face {\n  font-family: 'Noto Sans SC Variable';\n  src: url(./files/a.woff2) format('woff2-variations');\n  unicode-range: U+4e00-4e10,U+0041;\n}\n" +
      "@font-face {\n  font-family: 'Noto Sans SC Variable';\n  src: url(./files/digits.woff2) format('woff2-variations');\n  unicode-range: U+0030-0039;\n}"
    const out = pinnedFontsCss(css, join(shot, 'fake-pkg'), shot)
    expect([...out.matchAll(/font-family:\s*'([^']+)'/g)].map((m) => m[1])).toEqual([...PINNED_FAMILIES])
    expect(out).toContain("url('fake-pkg/files/a.woff2')")
    expect(out).not.toContain('digits.woff2')
    expect(out).toContain('unicode-range: U+4e00-4e10;')
  })

  it('一片都解析不出来就抛错，不静默照旧截', () => {
    expect(() => pinnedFontsCss('/* 格式变了 */', join(shot, 'fake-pkg'), shot)).toThrow(/一片 @font-face 都没解析出来/)
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

  it('源码里出现在指住区段里的字，字体都有（没有就落回机器自己的字体）', () => {
    const covered = coverage(faces)
    const missing = new Set<string>()
    for (const ch of sourceChars()) {
      const cp = ch.codePointAt(0) ?? 0
      if (pinned(cp) && covered[cp] !== 1) missing.add(ch)
    }
    expect([...missing].join(''), '这些字不在 Noto Sans SC 的覆盖范围里').toBe('')
  })

  it('源码里出现的、字体有的西文标点（Latin-1 与 General Punctuation 里的标点）都在指住区段里', () => {
    // 扫 src 与 gallery 里实际出现的非 ASCII 标点，跟字体原本的覆盖（没收窄的 index.css）取交集；漏了的补进 PINNED_RANGES（#216 审查：· — … “ ” 曾漏掉）。
    const fontCovers = coverage([...readFileSync(indexCss, 'utf8').matchAll(/@font-face\s*{[^}]*}/g)].map((m) => m[0]))
    const unpinned = new Set<string>()
    for (const ch of sourceChars()) {
      const cp = ch.codePointAt(0) ?? 0
      const inBlock = (cp >= 0x80 && cp <= 0xff) || (cp >= 0x2000 && cp <= 0x206f)
      if (inBlock && /\p{P}/u.test(ch) && fontCovers[cp] === 1 && !pinned(cp)) unpinned.add(ch)
    }
    expect([...unpinned].join(''), '这些标点字体有、源码在用，但不在 PINNED_RANGES 里').toBe('')
    // 点名几个最常用的，防止有人把区段改窄了而扫描恰好没扫到。
    for (const ch of '·—…“”–‘’') expect(pinned(ch.codePointAt(0) ?? 0), ch).toBe(true)
  })
})
