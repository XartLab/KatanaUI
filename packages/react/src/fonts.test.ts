// SPDX-License-Identifier: MIT
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vite-plus/test'
import tokens from '@katana-ui/tokens/tokens.json' with { type: 'json' }

// 随包字体的对账（#14）：`fonts.css` 声明的每个字体文件都在磁盘上、
// 每个字体文件都有声明与许可文本，token 里写的字体家族都有 @font-face。去掉 fonts.css 里的一个字体，这里就红。
const src = dirname(fileURLToPath(import.meta.url))
const read = (file: string) => readFileSync(resolve(src, file), 'utf8')
const css = read('fonts.css')
const faces = [...css.matchAll(/@font-face\s*{[^}]*}/g)].map((m) => m[0])
const families = new Set(faces.map((f) => /font-family:\s*'([^']+)'/.exec(f)?.[1]))

describe('随包字体', () => {
  it('每个 url() 指向的文件都在 src/fonts/', () => {
    const urls = [...css.matchAll(/url\('(\.\/fonts\/[^']+)'\)/g)].map((m) => m[1] ?? '')
    expect(urls.length).toBeGreaterThanOrEqual(7)
    for (const url of urls) {
      expect(existsSync(resolve(src, url)), url).toBe(true)
    }
  })

  it('src/fonts/ 里的每个字体文件都有声明', () => {
    const files = readdirSync(resolve(src, 'fonts')).filter((n) => /\.woff2?$/.test(n))
    for (const file of files) expect(css, file).toContain(`/fonts/${file}`)
  })

  it('每个字体家族都有许可文本随包', () => {
    const texts = readdirSync(resolve(src, 'fonts')).filter((n) => n.endsWith('.txt'))
    for (const key of ['barlow', 'dm', 'doto', 'maple', 'michroma', 'ark-pixel']) {
      expect(
        texts.some((t) => t.startsWith(key)),
        key,
      ).toBe(true)
    }
  })

  it('token 里写的这四个字体家族都有 @font-face', () => {
    // token 里还有别的家族名（方舟像素的比例版等）是回退，不随包；这里只对账随包的四个。
    const named = new Set([...JSON.stringify(tokens).matchAll(/"family":\s*"([^"]+)"/g)].map((m) => m[1]))
    for (const family of ['Barlow Condensed', 'DM Mono', 'Doto', 'Maple Mono NF CN']) {
      expect(named.has(family), `token 里有 ${family}`).toBe(true)
      expect(families.has(family), `fonts.css 里有 ${family}`).toBe(true)
    }
  })

  it('Barlow Condensed 有 600 与 700 两档，Michroma 与方舟像素在里面', () => {
    const barlow = faces.filter((f) => f.includes("'Barlow Condensed'"))
    expect(barlow.map((f) => /font-weight:\s*(\d+)/.exec(f)?.[1]).sort((a, b) => Number(a) - Number(b))).toEqual([
      '600',
      '700',
    ])
    expect(families.has('Michroma')).toBe(true)
    expect(families.has('Ark Pixel 12 zh_cn Subset')).toBe(true)
  })

  it('@font-face 只在 fonts.css 里写一次：theme/fonts.css 只留 --font-wide，ui.css 不引 fonts.css', () => {
    expect(read('theme/fonts.css')).not.toContain('@font-face')
    expect(read('theme/fonts.css')).toContain('--font-wide')
    expect(read('ui.css')).not.toMatch(/@import '\.\/fonts\.css'/)
  })

  it('package.json 导出 ./fonts.css', () => {
    const pkg = JSON.parse(readFileSync(resolve(src, '../package.json'), 'utf8')) as { exports: Record<string, string> }
    expect(pkg.exports['./fonts.css']).toBe('./src/fonts.css')
  })
})
