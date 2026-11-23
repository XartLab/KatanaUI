// SPDX-License-Identifier: MIT
/**
 * 截图环境的中文字体（#202）：让中文只用仓库自带的字体渲染，不看机器上装了什么。
 *
 * 根因：字体栈（tokens.css 的 --font-sans 等）里中文靠 "PingFang SC"、"Microsoft YaHei UI"、"Noto Sans SC" 回退。
 * Linux 上这三个名字都由 fontconfig 去找机器上碰巧有的 CJK 字体：沙箱是 Noto Sans CJK，别的机器可能是文泉驿；
 * 页面没写 lang（组件截图的 Vitest 页）时 Chromium 还会按系统默认选日文字形，写了 zh-CN（文档站）选简体字形。
 * 同一段中文换一台机器字形就变，整套含中文的截图在沙箱里全红。
 *
 * 做法：用 @font-face 把这三个名字都指到仓库已有的开发依赖 @fontsource-variable/noto-sans-sc（Noto Sans SC 可变字体，OFL 1.1，
 * 文档站的字体目录 gallery/web-fonts.ts 在用，版本由 pnpm-lock.yaml 锁定）。网页字体的名字优先于机器上的同名字体，
 * 所以栈里不管哪一个先被查到，中文都落到这一份；unicode-range 与 CJK 区段取交集，拉丁字母、数字仍走原来的栈，不动已有的拉丁字形。
 * 不往仓库里提交字体文件：@font-face 在加载 shot/fonts.css 时从那个包的 index.css 现算。
 */
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Plugin } from 'vite-plus'

/** 被指住的三个名字：字体栈里写的中文回退名。shot/fonts.test.ts 守着每条会出中文的栈里至少有一个。 */
export const PINNED_FAMILIES = ['Noto Sans SC', 'PingFang SC', 'Microsoft YaHei UI'] as const

/** CJK 部首与统一表意文字（含 CJK 符号与标点 3000–303F）、兼容表意文字、竖排符号、半角全角形式。 */
const CJK: readonly (readonly [number, number])[] = [
  [0x2e80, 0x9fff],
  [0xf900, 0xfaff],
  [0xfe30, 0xfe4f],
  [0xff00, 0xffef],
]

const parseRanges = (list: string): [number, number][] =>
  list.split(',').map((part) => {
    const [from = '', to = from] = part.trim().replace(/^U\+/i, '').split('-')
    return [Number.parseInt(from, 16), Number.parseInt(to.replace(/^U\+/i, ''), 16)]
  })

const hex = (n: number) => `U+${n.toString(16)}`

/** 一片的 unicode-range 与 CJK 区段的交集；空就返回 undefined（这一片不要）。 */
export function intersectWithCjk(unicodeRange: string): string | undefined {
  const out: string[] = []
  for (const [from, to] of parseRanges(unicodeRange)) {
    for (const [lo, hi] of CJK) {
      const a = Math.max(from, lo)
      const b = Math.min(to, hi)
      if (a <= b) out.push(a === b ? hex(a) : `${hex(a)}-${hex(b).slice(2)}`)
    }
  }
  return out.length === 0 ? undefined : out.join(',')
}

/**
 * 把 fontsource 的 index.css（每片一个 @font-face，家族名 Noto Sans SC Variable）改写成：每片 × 三个名字，
 * unicode-range 收窄到 CJK，url 改成相对 fromDir 的路径（Vite 才会把字体文件一起打进去）。
 */
export function pinnedFontsCss(fontsourceCss: string, fontsourceDir: string, fromDir: string): string {
  const faces = [...fontsourceCss.matchAll(/@font-face\s*{[^}]*}/g)].map((m) => m[0])
  const out: string[] = []
  for (const face of faces) {
    const range = /unicode-range:\s*([^;]+);/.exec(face)?.[1]
    const file = /url\(\.\/(files\/[^)]+)\)/.exec(face)?.[1]
    const narrowed = range === undefined ? undefined : intersectWithCjk(range)
    if (narrowed === undefined || file === undefined) continue
    const url = relative(fromDir, join(fontsourceDir, file)).split('\\').join('/')
    for (const family of PINNED_FAMILIES) {
      out.push(
        `@font-face {\n  font-family: '${family}';\n  font-style: normal;\n  font-weight: 100 900;\n  font-display: block;\n  src: url('${url}') format('woff2-variations');\n  unicode-range: ${narrowed};\n}`,
      )
    }
  }
  return out.join('\n')
}

const here = dirname(fileURLToPath(import.meta.url))
const fontsCss = join(here, 'fonts.css')

/**
 * Vite 插件：加载 shot/fonts.css 时换成真正的 @font-face。
 * html: true 时再把它写进 index.html（整页回归起的文档站用；组件截图的底座 browser/render.tsx 自己 import 它）。
 */
export function katanaShotFonts({ html = false }: { html?: boolean } = {}): Plugin {
  const indexCss = createRequire(import.meta.url).resolve('@fontsource-variable/noto-sans-sc/index.css')
  return {
    name: 'katana-shot-fonts',
    enforce: 'pre',
    transform(code, id) {
      if (id.split('?')[0] !== fontsCss) return undefined
      return {
        code: `${code}\n${pinnedFontsCss(readFileSync(indexCss, 'utf8'), dirname(indexCss), here)}\n`,
        map: null,
      }
    },
    // order: 'pre'：在 Vite 处理 HTML 里的 <link> 之前加，构建时才会把 css 与里面的字体一起打进产物（dev 与 preview 都走这条）。
    transformIndexHtml: html
      ? {
          order: 'pre',
          handler: (source: string) =>
            source.replace('</head>', '    <link rel="stylesheet" href="/shot/fonts.css" />\n  </head>'),
        }
      : undefined,
  }
}
