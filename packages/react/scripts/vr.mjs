// SPDX-License-Identifier: MIT
// 视觉回归入口（pixelgate）：主配置（两个主题 × 全部组件页）与高清配置（dpr 2 的几页关键页）各跑一遍，退出码取较大的一个。
// 为什么要包一层：pixelgate 的页清单对每个 target 都跑，「dpr 2 只跑几页」只能另开一份配置，而 `a && b` 在第一份红时不会跑第二份。
// 用法：node scripts/vr.mjs [run|update|approve|summary] [pixelgate 的其余参数]；run 是默认。
import { spawnSync } from 'node:child_process'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const pkgDir = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const [mode = 'run', ...rest] = process.argv.slice(2)
const CONFIGS = [
  { name: 'main', file: 'pixelgate.config.ts' },
  { name: 'hidpi', file: 'pixelgate.hidpi.config.ts' },
]
const COMMANDS = { run: ['run'], update: ['run', '-u'], approve: ['approve'], summary: ['summary'] }
const command = COMMANDS[mode]
if (!command) {
  console.error(`未知模式「${mode}」，可用：${Object.keys(COMMANDS).join('、')}`)
  process.exit(2)
}

let code = 0
for (const { name, file } of CONFIGS) {
  console.log(`\n== pixelgate ${mode}（${name}：${file}）==`)
  // approve --from <目录>：主配置读 <目录>，高清配置的输出在 <目录>/hidpi（它的 outDir 是 .pixelgate/hidpi）。
  const from = rest.indexOf('--from')
  const extra = name === 'hidpi' && from >= 0 ? rest.map((arg, i) => (i === from + 1 ? join(arg, 'hidpi') : arg)) : rest
  const result = spawnSync('pnpm', ['exec', 'pixelgate', ...command, '--config', file, ...extra], {
    cwd: pkgDir,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  })
  code = Math.max(code, result.status ?? 1)
}
process.exit(code)
