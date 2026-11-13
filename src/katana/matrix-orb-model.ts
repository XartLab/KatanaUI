// SPDX-License-Identifier: AGPL-3.0-only
// 点阵状态球的纯数学：某个状态下，圆盘上某一点（归一化坐标，圆心 0、边缘 1）在某一时刻有多亮（0 到 1）。组件只管画与插值。
// 交互学自 rare-ui 的 matrix-orb（2026-11-14 读），实现为本仓库原创，未复制其代码；下面的公式是自己写的，
// 只借了「待命是慢呼吸、聆听是跟音量走的同心波、思考是几个热点绕着转」这三种行为的区分。

export type OrbState = 'idle' | 'listening' | 'thinking'

export const ORB_STATES: readonly OrbState[] = ['idle', 'listening', 'thinking']

/** 整个球的缩放目标：待命收一点，聆听撑满，思考介于两者。 */
export const ORB_SCALE: Readonly<Record<OrbState, number>> = { idle: 0.9, listening: 1, thinking: 0.95 }

/** 没有传音量时的模拟包络：快慢两个正弦相乘，不取绝对值（绝对值的尖角在波谷看着像卡一下）。0.2 到 1 之间。 */
export function simulatedLevel(t: number): number {
  const slow = 0.5 + 0.5 * Math.sin(t * 0.62 + 0.4)
  const fast = 0.5 + 0.5 * Math.sin(t * 1.9 + 1.1)
  return 0.2 + 0.8 * (0.45 + 0.55 * slow) * fast
}

/** 思考态里绕圈的热点：轨道半径、角速度（弧度 / 秒，负的反向）、初相、光斑半径。 */
const HOT_SPOTS = [
  { radius: 0.6, speed: 2.1, phase: 0, spread: 0.45 },
  { radius: 0.38, speed: -1.6, phase: 2.2, spread: 0.38 },
  { radius: 0.78, speed: 1.1, phase: 4.1, spread: 0.36 },
] as const

/** (nx, ny) 处的亮度，0 到 1。amplitude 是聆听态的音量（0 到 1）。 */
export function orbIntensity(state: OrbState, nx: number, ny: number, t: number, amplitude: number): number {
  const d = Math.hypot(nx, ny)
  switch (state) {
    case 'idle':
      return 0.5 + 0.14 * Math.sin(t * 1.05 - d * 2.4)
    case 'listening': {
      const ripple = 0.5 + 0.5 * Math.sin(d * 4.6 - t * 3.2)
      return Math.min(1, 0.3 + amplitude * (0.32 + 0.4 * ripple))
    }
    case 'thinking': {
      let heat = 0
      for (const spot of HOT_SPOTS) {
        const angle = t * spot.speed + spot.phase
        const dx = nx - Math.cos(angle) * spot.radius
        const dy = ny - Math.sin(angle) * spot.radius
        heat += Math.exp(-(dx * dx + dy * dy) / (spot.spread * spot.spread))
      }
      return 0.24 + 0.76 * Math.min(1, heat)
    }
  }
}
