// SPDX-License-Identifier: MIT
import { defineConfig } from 'pixelgate-cli'
import { base, componentPages, wholePage } from './pixelgate.shared.ts'

// 高清（dpr 2）视觉回归：字体渲染与像素对齐只在 2 倍屏上才暴露，所以单拎几页关键页，graphite 主题。
// pixelgate 的页清单对每个 target 都跑，没法「这个 target 只跑几页」，所以另开一份配置；基线与报告放 .pixelgate/hidpi/ 下，不跟主配置混。
export default defineConfig({
  ...base,
  outDir: '.pixelgate/hidpi',
  targets: {
    hidpi: { viewport: '1440x900', deviceScaleFactor: 2 },
  },
  pages: [
    ...componentPages('graphite', ['button', 'sparkline', 'data-grid']),
    wholePage('graphite', 'typography', 'typography', true),
    wholePage('graphite', 'rendering', 'rendering', true),
  ],
})
