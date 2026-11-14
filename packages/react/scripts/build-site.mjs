// SPDX-License-Identifier: MIT
// 构建组件文档站加 shadcn 注册表（`pnpm build:site`，KatanaUI 的 Pages 工作流用它）：
//   1. `vp build`：文档站（gallery/ 一个页面应用，入口 index.html）出到 dist/；地址前缀读 SITE_BASE（Pages 是 /KatanaUI/）。
//   2. `pnpm registry:build`：生成 registry.json 并 `shadcn build` 出到 r/（脚本在 #1864 加）。
//   3. 把 r/ 拷进 dist/r/，站点上的 /r/<件名>.json 就是 `shadcn add` 的注册表地址。
// 没有 registry:build 脚本（#1864 还没合进来）就报错退出，不悄悄发一个没有注册表的站点。
import { cpSync, existsSync, readFileSync, rmSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const pkgDir = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const pkg = JSON.parse(readFileSync(join(pkgDir, 'package.json'), 'utf8'))

// 经 pnpm 调：pnpm 把自己的路径放进 npm_execpath（`pnpm build:site` 启动时），没有就退回 PATH 里的 pnpm。
const pnpm = (args) => {
  const self = process.env.npm_execpath
  const run =
    self && /pnpm/i.test(self) && /\.[cm]?js$/.test(self)
      ? [process.execPath, [self, ...args]]
      : [self && /pnpm/i.test(self) ? self : 'pnpm', args]
  const result = spawnSync(run[0], run[1], { cwd: pkgDir, stdio: 'inherit', shell: process.platform === 'win32' })
  if (result.status !== 0) process.exit(result.status ?? 1)
}

if (!pkg.scripts?.['registry:build']) {
  console.error('build:site 要先有 registry:build 脚本（生成注册表，#1864）；没有它就发不出 r/。')
  process.exit(1)
}

pnpm(['exec', 'vp', 'build'])
pnpm(['run', 'registry:build'])
if (!existsSync(join(pkgDir, 'r', 'button.json'))) {
  console.error('registry:build 之后 r/button.json 不存在：注册表没生成出来。')
  process.exit(1)
}
rmSync(join(pkgDir, 'dist', 'r'), { recursive: true, force: true })
cpSync(join(pkgDir, 'r'), join(pkgDir, 'dist', 'r'), { recursive: true })
console.log('站点在 dist/，注册表在 dist/r/。')
