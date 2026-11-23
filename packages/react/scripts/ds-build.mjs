// SPDX-License-Identifier: MIT
// 从代码生成 design-pipeline 的设计系统包 packages/react/design-system/（`pnpm --filter @katana-ui/react ds:build`）。
// 包里的文件都不手写，跟代码不会有两份：
//   tokens.json          ← @katana-ui/tokens 的 tokens.json（token 源头；ds-tokens.mjs：只留 Console 与 Graphite，补 contrast，过不了线的把比值写进 usage）
//   README.md            ← ds/guidelines.md（手写的三节规则，原样复制，去掉开头的出处注释）
//   components/bundle.css ← @katana-ui/tokens 的 tokens.css 加上 Tailwind 编出来的 ui.css（预览与产品共用的同一份样式）
//   components/<Comp>/   ← 文档站的页数据（gallery/registry.ts 的 PAGES：说明、属性、组成、键盘）与页上的预览（gallery/demos.tsx）经 ds/render.tsx 渲染出的 README.md 与静态 preview.html；
//                          每个页一个件，自有件（katana/）与量化件（quant/）都在里面，不再另写一份
// 格式见 design-pipeline `skill/references/design-system-package.md`（2026-11-14 读，0.15.0-beta.1）。
// 用法：node scripts/ds-build.mjs            重新生成
//       node scripts/ds-build.mjs --check    只比对：生成的与已提交的不一样就退出 1（pnpm lint:ds 先跑它）
import { createRequire } from 'node:module'
import { mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import { build, createServer, defaultClientConditions, defaultServerConditions } from 'vite-plus'
import { renderCover } from './ds-cover.mjs'
import { declaredVars, hoistRawColours, referencedVars, runtimeVarsBlock } from './ds-css.mjs'
import { buildDesignSystemTokens } from './ds-tokens.mjs'

const here = dirname(fileURLToPath(import.meta.url))
const pkg = resolve(here, '..')
const target = join(pkg, 'design-system')
// token 源头与生成物在 @katana-ui/tokens 包里，按包名解析（本地连到仓库里的 packages/tokens）。
const resolveToken = createRequire(import.meta.url).resolve

const SPDX = 'SPDX-License-Identifier: MIT'
const json = (value) => `${JSON.stringify(value, null, 2)}\n`

/** Tailwind 编出 ui.css：不压缩（包里的文件要能读、能 diff），不写盘。 */
async function compileUiCss() {
  const result = await build({
    root: pkg,
    configFile: false,
    logLevel: 'silent',
    plugins: [tailwindcss()],
    build: {
      write: false,
      cssMinify: false,
      rollupOptions: { input: join(pkg, 'src/ui.css') },
    },
  })
  const outputs = (Array.isArray(result) ? result : [result]).flatMap((r) => r.output)
  const css = outputs.find((o) => o.type === 'asset' && o.fileName.endsWith('.css'))
  if (!css) throw new Error('ds-build：Tailwind 没有编出 CSS')
  return String(css.source)
}

/** 载入 ds/render.tsx（TSX、不带扩展名的引入，交给 vite 的 SSR 载入）。 */
async function loadRender() {
  const server = await createServer({
    root: pkg,
    configFile: false,
    logLevel: 'silent',
    appType: 'custom',
    server: { middlewareMode: true },
    // 同仓库的 @katana-ui/logos 读 TS 源码（katana-source 条件，见 vite.config.ts），不靠它先构建。
    resolve: { conditions: ['katana-source', ...defaultClientConditions] },
    ssr: {
      resolve: { conditions: ['katana-source', ...defaultServerConditions], externalConditions: ['katana-source'] },
    },
  })
  try {
    return await server.ssrLoadModule('/ds/render.tsx')
  } finally {
    await server.close()
  }
}

const compare = (a, b) => (a < b ? -1 : a > b ? 1 : 0)

export async function generate() {
  const source = JSON.parse(readFileSync(resolveToken('@katana-ui/tokens/tokens.json'), 'utf8'))
  const files = new Map()
  files.set('tokens.json', json(buildDesignSystemTokens(source)))

  const guidelines = readFileSync(join(pkg, 'ds/guidelines.md'), 'utf8').replace(/^<!--[\s\S]*?-->\n/, '')
  files.set('README.md', guidelines)

  const tokensCss = readFileSync(resolveToken('@katana-ui/tokens/tokens.css'), 'utf8')
  // 预览里摆件用的版面类（gallery/preview.css，文档站也引它）并在 ui.css 后面，一起提色值。
  const previewCss = readFileSync(join(pkg, 'gallery/preview.css'), 'utf8').replace(/^\/\*[\s\S]*?\*\/\n/, '')
  const { css: uiCss, hoisted } = hoistRawColours(`${await compileUiCss()}\n${previewCss}`)
  const hoistedBlock = `:root {\n${[...hoisted].map(([name, raw]) => `  ${name}: ${raw};`).join('\n')}\n}\n`

  const { pages, folderName, cardGroup, componentReadme, renderPreviewBody } = await loadRender()
  const previews = new Map()
  for (const page of pages) {
    const name = folderName(page.id)
    files.set(`components/${name}/README.md`, componentReadme(page))
    previews.set(
      `components/${name}/preview.html`,
      `<!-- @dsCard group="${cardGroup(page)}" height=${page.cardHeight} -->\n<!-- ${SPDX} -->\n${renderPreviewBody(page)}`,
    )
  }
  previews.set(
    'components/Cover/preview.html',
    `<!-- @dsCard group="Cover" height=540 -->\n<!-- ${SPDX} -->\n${renderCover({ name: source.name, tagline: 'Console-style components for quant and trading UIs' })}`,
  )

  const head = `/* ${SPDX} */\n/* 生成文件（pnpm --filter @katana-ui/react ds:build）：@katana-ui/tokens 的 tokens.css、Tailwind 编出的 src/ui.css、预览的版面类（gallery/preview.css），以及两段补充（见各段的注释）。预览与产品共用这一份。 */\n`
  const base = `${head}${tokensCss}${uiCss}\n/* 组件里白色、黑色的透明度层：ui.css 的类里原来是裸色值，这里提成变量（值不变），换主题时从这里改。 */\n${hoistedBlock}`
  // 运行时才有值的变量：Radix 在打开的弹层上量好写进来，动效的 --k-in-* 由调用方覆盖。
  const known = declaredVars(base)
  const used = referencedVars([base, ...previews.values()].join('\n'))
  const runtime = [...used].filter((name) => !known.has(name)).sort(compare)
  files.set(
    'components/bundle.css',
    runtime.length
      ? `${base}\n/* 运行时才有值的变量：声明成 initial 等于没声明，带 fallback 的 var() 照常走 fallback；声明它们只是让设计系统的检查认得。 */\n${runtimeVarsBlock(runtime)}`
      : base,
  )
  for (const [path, content] of previews) files.set(path, content)
  return files
}

function listFiles(dir) {
  const out = []
  const walk = (d) => {
    for (const name of readdirSync(d)) {
      const full = join(d, name)
      if (statSync(full).isDirectory()) walk(full)
      else out.push(relative(dir, full).split('\\').join('/'))
    }
  }
  try {
    walk(dir)
  } catch {
    /* 目录还没有 */
  }
  return out.sort(compare)
}

function write(dir, files) {
  rmSync(dir, { recursive: true, force: true })
  for (const [path, content] of files) {
    const full = join(dir, path)
    mkdirSync(dirname(full), { recursive: true })
    writeFileSync(full, content)
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const files = await generate()
  if (process.argv.includes('--check')) {
    const stale = []
    const existing = listFiles(target)
    for (const [path, content] of files) {
      let current = null
      try {
        current = readFileSync(join(target, path), 'utf8')
      } catch {
        /* 缺文件 */
      }
      if (current !== content) stale.push(path)
    }
    for (const path of existing) if (!files.has(path)) stale.push(`${path}（多出来的）`)
    if (stale.length) {
      console.error(
        `design-system/ 与代码对不上，跑 pnpm --filter @katana-ui/react ds:build 重新生成：\n  ${stale.join('\n  ')}`,
      )
      process.exit(1)
    }
    console.log(`design-system/ 与代码一致（${files.size} 个文件）`)
  } else {
    write(target, files)
    console.log(`design-system/ 已生成（${files.size} 个文件）`)
  }
}
