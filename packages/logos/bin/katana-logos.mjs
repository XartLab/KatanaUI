#!/usr/bin/env node
// SPDX-License-Identifier: MIT
// katana-logos 命令行入口。装好的包读构建出的 lib/；在本仓库里没构建时读 src/（Node 22.18+ 直接跑 .ts）。
let cli
try {
  cli = await import('../lib/cli.js')
} catch {
  cli = await import('../src/cli.ts')
}
process.exitCode = await cli.main(process.argv.slice(2))
