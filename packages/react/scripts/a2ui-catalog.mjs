// SPDX-License-Identifier: MIT
// 生成 KatanaUI 的 A2UI v1.0 目录定义 JSON（public/a2ui/katana/v1.json，文档站构建时带上，目录 id 指向它的发布地址）。
// JSON 不手写：由 src/a2ui/catalog.ts 的 katanaCatalog 调 web_core 官方的 Catalog.toJson() 算出来，所以 zod schema 是唯一的来源。
// 用法：node scripts/a2ui-catalog.mjs           写 public/a2ui/katana/v1.json
//       node scripts/a2ui-catalog.mjs --check   与已提交的比对，不一样退出 1
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createServer, defaultClientConditions, defaultServerConditions } from 'vite-plus'

const pkgDir = resolve(dirname(fileURLToPath(import.meta.url)), '..')
export const CATALOG_PATH = join(pkgDir, 'public', 'a2ui', 'katana', 'v1.json')

/** 在 vite 的 SSR 里载入 TSX 的目录；@a2ui/react 在顶层继承 HTMLElement，Node 里没有，先垫一个空类（只为载入，不渲染）。 */
export async function buildCatalogJson() {
  globalThis.HTMLElement ??= class {}
  const server = await createServer({
    root: pkgDir,
    configFile: false,
    logLevel: 'silent',
    appType: 'custom',
    server: { middlewareMode: true },
    // 同仓库的 @katana-ui/logos 读 TS 源码（katana-source 条件，见 vite.config.ts），不靠它先构建（#95 之后 symbol-mark 引它）。
    resolve: { conditions: ['katana-source', ...defaultClientConditions] },
    ssr: {
      resolve: { conditions: ['katana-source', ...defaultServerConditions], externalConditions: ['katana-source'] },
    },
  })
  try {
    const { katanaCatalog } = await server.ssrLoadModule('/src/a2ui/catalog.ts')
    return `${JSON.stringify(katanaCatalog.toJson(), null, 2)}\n`
  } finally {
    await server.close()
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const next = await buildCatalogJson()
  if (process.argv.includes('--check')) {
    const current = existsSync(CATALOG_PATH) ? readFileSync(CATALOG_PATH, 'utf8') : ''
    if (current !== next) {
      console.error('public/a2ui/katana/v1.json 与 zod schema 不一致：跑 pnpm a2ui:catalog 再提交。')
      process.exit(1)
    }
    console.log('A2UI 目录 JSON 与 schema 一致。')
  } else {
    mkdirSync(dirname(CATALOG_PATH), { recursive: true })
    writeFileSync(CATALOG_PATH, next)
    console.log(`写入 ${CATALOG_PATH}`)
  }
}
