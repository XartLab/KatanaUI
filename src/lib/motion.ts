// SPDX-License-Identifier: MIT
// 带 import 属性：e2e 在 Node 里经 workspace/model → styles/motion 载入这里，Node 不认没有属性的 JSON 导入
import tokens from '../tokens/motion.tokens.json' with { type: 'json' }

// 三个弹簧，一处定义（tokens/motion.tokens.json，design/katana-console/project/motion.md 的参数管线）：
// motion/react 直接用这里导出的参数；CSS 的 `linear()` 缓动与时长由 scripts/sync-tokens.mjs 按同一份参数算出，
// 写进 tokens/tokens.css 的 --ease-<名> / --dur-<名>，样式里 `transition: ... var(--dur-snappy) var(--ease-snappy)`。
export const snappy = { type: 'spring' as const, ...tokens.snappy }
export const gentle = { type: 'spring' as const, ...tokens.gentle }
export const settle = { type: 'spring' as const, ...tokens.settle }
