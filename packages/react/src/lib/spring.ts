// SPDX-License-Identifier: MIT
import type { snappy } from './motion.ts'

// 三条弹簧的 restDelta 是 0.5（motion.tokens.json：给 px、度这类大数用）。动 scale、opacity、pathLength 这类 0 到 1 的量时，
// 0.5 的停止阈值会让弹簧在走了一半时就当作到位，直接跳到终点；这里把阈值收到 0.001，弹簧参数（刚度、阻尼、质量）一点没动。
export const unit = <T extends typeof snappy>(spring: T) => ({ ...spring, restDelta: 0.001, restSpeed: 0.01 })
