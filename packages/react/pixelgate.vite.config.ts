// SPDX-License-Identifier: MIT
import { katanaShotFonts } from './shot/fonts-plugin.ts'
import base from './vite.config.ts'

// pixelgate 起文档站用的 Vite 配置：跟 vite.config.ts 同一份，只把构建产物挪到缓存目录，免得 `vite build` 清掉 dist/（里面有 build:site 拷进去的 r/）。
// 另一处不同（#202）：把 shot/fonts.css 写进 index.html，整页回归里的中文只用仓库自带的字体，不看机器上装了什么字体；线上站点用的 vite.config.ts 不带它。
export default {
  ...base,
  plugins: [...(base.plugins ?? []), katanaShotFonts({ html: true })],
  build: { ...base.build, outDir: 'node_modules/.cache/katana-ui-pixelgate/site' },
}
