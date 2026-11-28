// SPDX-License-Identifier: MIT
// 文档站的性质测试入口（Bombadil）：打包文档站，用 `vp preview` 给页面，再让 Bombadil 限时乱点、乱按键、乱拖，
// 查 bombadil/docs-site.spec.ts 里的性质。夜间或手动跑，不进每个 PR 的快检（它按时长跑，不是按用例跑）。
//
//   pnpm explore                      跑 5 分钟（无头）
//   EXPLORE_TIME=30m pnpm explore     跑 30 分钟
//   EXPLORE_HEADED=1 pnpm explore     开着窗口看它怎么点
//   EXPLORE_EXIT_ON_VIOLATION=1 ...   遇到第一个违例就停
//
// 跑完有违例时退出码非零；轨迹写进 node_modules/.cache/katana-ui-explore/，用 `pnpm exec bombadil browser inspect <文件>` 看。
import { spawn, spawnSync } from 'node:child_process'
import { mkdirSync } from 'node:fs'
import { resolve } from 'node:path'

const port = Number(process.env.E2E_PORT ?? 5332)
const cache = resolve('node_modules', '.cache', 'katana-ui-explore')
const outDir = resolve(cache, 'site')
const stamp = new Date().toISOString().replace(/[:.]/g, '-')
const trace = resolve(cache, `trace-${stamp}.bin`)
mkdirSync(cache, { recursive: true })

const build = spawnSync('pnpm', ['exec', 'vp', 'build', '--logLevel', 'error', '--outDir', outDir], {
  stdio: 'inherit',
})
if (build.status !== 0) process.exit(build.status ?? 1)

const preview = spawn(
  'pnpm',
  ['exec', 'vp', 'preview', '--outDir', outDir, '--host', '127.0.0.1', '--port', String(port), '--strictPort'],
  { stdio: 'ignore', detached: true },
)
const stopPreview = () => {
  if (preview.pid === undefined) return
  try {
    process.kill(-preview.pid)
  } catch {}
}
process.on('exit', stopPreview)
process.on('SIGINT', () => process.exit(130))

const url = `http://127.0.0.1:${port}/`
for (let i = 0; ; i++) {
  try {
    if ((await fetch(url)).ok) break
  } catch {}
  if (i > 100) throw new Error(`预览服务器 ${url} 没起来`)
  await new Promise((done) => setTimeout(done, 100))
}

const args = ['exec', 'bombadil', 'browser', 'test', '--time-limit', process.env.EXPLORE_TIME ?? '5m']
args.push('--output-path', trace)
if (!process.env.EXPLORE_HEADED) args.push('--headless')
if (process.env.CI || process.getuid?.() === 0) args.push('--no-sandbox')
if (process.env.EXPLORE_EXIT_ON_VIOLATION) args.push('--exit-on-violation')
args.push(url, 'bombadil/docs-site.spec.ts')

const run = spawnSync('pnpm', args, { stdio: 'inherit' })
process.exitCode = run.status ?? 1
