// SPDX-License-Identifier: MIT
// 点阵状态球：一盘方点排成圆，亮度随状态起伏，用来表达 Agent 在做什么（空闲、聆听、思考）。方点、6px 点距、4px 点边照点阵签名件 DotMatrix。
// 交互学自 rare-ui 的 matrix-orb（2026-11-14 读），实现为本仓库原创，未复制其代码。
// 学到的事实（只取行为）：① 换状态时三种状态的权重插值过去，中途被打断也从当前画面接着变，不跳；② 整个球的缩放跟弹簧走，聆听最大；
// ③ 聆听态的亮度跟音量走，没有音量输入就用模拟包络；④ 缩放页面会改 devicePixelRatio，画布缓冲要跟着重建，不然被放大发糊；
// ⑤ 小到不足半个设备像素的点不画（会变成一层雾）；⑥ 状态用文字另外读出。我们用方点不用圆点，颜色从 token 取（跟主题走）。
// 循环由 requestAnimationFrame 驱动，状态变了只改目标不重启；缩放用 settle 弹簧的刚度与阻尼自己积分（画布上没有 motion 的值可用）。
import { useEffect, useRef, useSyncExternalStore } from 'react'
import { cn } from '../lib/cn'
import { settle } from '../lib/motion'
import { DOT_PITCH, DOT_SIZE } from './dot-matrix'
import { ORB_SCALE, ORB_STATES, orbIntensity, simulatedLevel, type OrbState } from './matrix-orb-model'

/** 状态权重每 1/60 秒向目标靠近的比例（0.16：约 0.4 秒换完）。 */
const BLEND = 0.16
/** 音量上升、回落时的平滑比例：起得快、落得慢。 */
const ATTACK = 0.22
const RELEASE = 0.08

const subscribeResize = (onChange: () => void) => {
  window.addEventListener('resize', onChange)
  return () => window.removeEventListener('resize', onChange)
}
const readRatio = () => Math.min(window.devicePixelRatio || 1, 4)

export type MatrixOrbProps = {
  state?: OrbState
  /** 聆听态的音量，0 到 1；不给就用模拟包络。 */
  level?: number
  /** 一边几个点（圆盘直径），默认 16，即 96px 见方。 */
  cells?: number
  /** 读屏名（必填）：球本身不带字，状态用文字另外读出。 */
  label: string
  /** 点的颜色，默认是主题的强调色；传 CSS 颜色或 var(--token)。 */
  color?: string
  className?: string
}

export function MatrixOrb({
  state = 'idle',
  level,
  cells = 16,
  label,
  color = 'var(--signal-orange)',
  className,
}: MatrixOrbProps) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef(state)
  const levelRef = useRef(level)
  const ratio = useSyncExternalStore(subscribeResize, readRatio, () => 1)
  const grid = Math.max(4, Math.round(cells))
  const side = grid * DOT_PITCH

  useEffect(() => {
    stateRef.current = state
    levelRef.current = level
  }, [state, level])

  useEffect(() => {
    const el = canvas.current
    const ctx = el?.getContext('2d')
    if (!el || !ctx) return
    const buffer = Math.round(side * ratio)
    el.width = el.height = buffer
    ctx.setTransform(buffer / side, 0, 0, buffer / side, 0, 0)
    const half = (grid - 1) / 2
    const weights: Record<OrbState, number> = { idle: 0, listening: 0, thinking: 0 }
    weights[stateRef.current] = 1
    let t = 0
    let amplitude = 0
    let scale = ORB_SCALE[stateRef.current]
    let velocity = 0
    let last = performance.now()
    let raf = 0
    const frame = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05)
      last = now
      t += dt
      const current = stateRef.current
      const input = levelRef.current
      const target =
        input === undefined || !Number.isFinite(input) ? simulatedLevel(t) : Math.min(1, Math.max(0, input))
      amplitude += (target - amplitude) * (1 - Math.pow(1 - (target > amplitude ? ATTACK : RELEASE), dt * 60))
      const step = 1 - Math.pow(1 - BLEND, dt * 60)
      for (const s of ORB_STATES) weights[s] += ((s === current ? 1 : 0) - weights[s]) * step
      // settle 弹簧：质量 1，刚度与阻尼取自 motion.tokens.json；这里用半隐式欧拉积分。
      velocity += (-settle.stiffness * (scale - ORB_SCALE[current]) - settle.damping * velocity) * dt
      scale += velocity * dt
      ctx.clearRect(0, 0, side, side)
      // 颜色每帧从元素上读：主题切换（data-theme）后下一帧就是新颜色。
      ctx.fillStyle = getComputedStyle(el).color
      for (let iy = 0; iy < grid; iy++) {
        for (let ix = 0; ix < grid; ix++) {
          const nx = (ix - half) / half
          const ny = (iy - half) / half
          if (Math.hypot(nx, ny) > 1.06) continue
          let blended = 0
          for (const s of ORB_STATES)
            if (weights[s] > 0.001) blended += weights[s] * orbIntensity(s, nx, ny, t, amplitude)
          const radius = Math.hypot(nx, ny)
          const edge = Math.exp(-(radius * radius) * 0.9)
          const dot = DOT_SIZE * Math.min(1, Math.max(0, blended)) * edge * scale
          // 不足半个设备像素的点不画。
          if (dot * ratio < 0.5) continue
          const cx = side / 2 + (ix - half) * DOT_PITCH * scale
          const cy = side / 2 + (iy - half) * DOT_PITCH * scale
          ctx.fillRect(cx - dot / 2, cy - dot / 2, dot, dot)
        }
      }
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
    // state 与 level 不在依赖里：循环自己读最新值，换状态只改目标，不重启。
  }, [grid, side, ratio])

  return (
    <canvas
      ref={canvas}
      role="img"
      aria-label={label}
      data-slot="matrix-orb"
      data-state={state}
      className={cn('block flex-none', className)}
      style={{ width: side, height: side, color }}
    />
  )
}
