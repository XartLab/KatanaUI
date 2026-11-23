// SPDX-License-Identifier: MIT
// 从 @web3icons/core（MIT）的目录生成 src/web3icons-map.ts：每个币种 / 交易所一行「代码 → 动态 import」。
// 为什么是一张写死的表：动态 import 的路径要是字面量，打包器（Vite、Rollup、webpack）才认得出来、把每个 SVG 拆成单独的小块按需载入；
// 拼出来的路径打包器看不懂。表本身只是名字与路径，不含图形。只收 branded 一种画法（mono、background 三倍体积，用到再加）。
// 用法：node scripts/sync-web3icons.mjs          生成
//       node scripts/sync-web3icons.mjs --check  生成物与依赖的版本对不上就退出码 1（pnpm test 里跑）
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const pkg = join(dirname(fileURLToPath(import.meta.url)), '..')
const out = join(pkg, 'src/web3icons-map.ts')
const require = createRequire(join(pkg, 'package.json'))
// 包的 exports 没开放 package.json，从入口 dist/index.js 往上找包根。
const coreDir = join(dirname(require.resolve('@web3icons/core')), '..')
const { version } = JSON.parse(readFileSync(join(coreDir, 'package.json'), 'utf8'))

const names = (kind) =>
  readdirSync(join(coreDir, 'dist/svgs', kind, 'branded'))
    .filter((f) => f.endsWith('.svg.js'))
    .map((f) => f.slice(0, -'.svg.js'.length))
    .toSorted()

const entries = (kind, label) =>
  names(kind)
    .map(
      (n) =>
        `  ${`'${label === 'tokens' ? n.toUpperCase() : n}'`}: () => import('@web3icons/core/svgs/${kind}/branded/${n}.svg.js'),`,
    )
    .join('\n')

const tokens = names('tokens')
const exchanges = names('exchanges')
const text = `// SPDX-License-Identifier: MIT
// 生成物：node scripts/sync-web3icons.mjs 从 @web3icons/core@${version}（MIT）的目录生成，不手改。
// 币种 ${tokens.length} 个、交易所 ${exchanges.length} 个（branded 画法）。每个值是一次动态 import，打包器把它拆成单独的小块，用到才载入。
type SvgModule = () => Promise<{ default: string }>

export const WEB3ICONS_VERSION = '${version}'

/** 币种代码（大写）→ SVG 模块。 */
export const TOKENS: Readonly<Record<string, SvgModule>> = {
${entries('tokens', 'tokens')}
}

/** 交易所 id（web3icons 的短横线小写名）→ SVG 模块。 */
export const EXCHANGES: Readonly<Record<string, SvgModule>> = {
${entries('exchanges', 'exchanges')}
}
`

if (process.argv.includes('--check')) {
  const current = readFileSync(out, 'utf8')
  if (current !== text) {
    console.error('src/web3icons-map.ts 与 @web3icons/core 对不上：跑 pnpm --filter @katana-ui/logos web3icons:sync')
    process.exit(1)
  }
  console.log(`web3icons-map 是最新的（${tokens.length} 币种、${exchanges.length} 交易所）`)
} else {
  writeFileSync(out, text)
  console.log(
    `写了 src/web3icons-map.ts：${tokens.length} 币种、${exchanges.length} 交易所（@web3icons/core@${version}）`,
  )
}
