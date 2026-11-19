// SPDX-License-Identifier: MIT
import { defineConfig } from 'pixelgate-cli'
import { PAGES } from './gallery/registry.ts'
import { base, componentPages, wholePage } from './pixelgate.shared.ts'

// 快速模式（pnpm vr:fast）：只 graphite、dpr 1，Vite 开发服务器不 build；跟全量用同一份基线（target 同名 desktop、同一个 outDir），
// 比哪几页由 scripts/vr-fast.mjs 按改动文件算出来，用 --only 传进来。
export default defineConfig({
  ...base,
  vite: { mode: 'dev', configFile: 'pixelgate.vite.config.ts' },
  targets: { desktop: { viewport: '1440x900', deviceScaleFactor: 1 } },
  pages: [
    ...componentPages('graphite'),
    wholePage('graphite', 'color', 'shell-foundation'),
    wholePage('graphite', PAGES[0].id, 'shell-home'),
  ],
})
