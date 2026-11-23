// SPDX-License-Identifier: MIT
import base from './vite.config.ts'

// pixelgate 起文档站用的 Vite 配置：跟 vite.config.ts 同一份，只把构建产物挪到缓存目录，免得 `vite build` 清掉 dist/（里面有 build:site 拷进去的 r/）。
export default {
  ...base,
  build: { ...base.build, outDir: 'node_modules/.cache/katana-ui-pixelgate/site' },
}
