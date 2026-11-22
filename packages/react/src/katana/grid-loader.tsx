// SPDX-License-Identifier: MIT
// 改自 SmoothUI grid-loader（https://github.com/educlopez/smoothui ，MIT，© 2024 Eduardo Calvo）
// 3×3 像素点阵的转圈：几何小方块按图案亮起、呼吸或依次点亮，像素风，跟本系统的点阵纹理同一个气质。
// 与 Loading 的分工：Loading 是「等数据时先出骨架」的整块门，GridLoader 是一个小的、不定长等待的指示（按钮里、面板角上、AI 在想）。
// 与原件的差别：① 图案只留 15 个常用的（原件 70 多个），都写成「xxx/x.x/xxx」这样一眼能读的字符串；也可直接传 3×3 的 0/1 矩阵；
// ② 颜色不再有 white/red 这些名字，直接传 CSS 颜色（可以是 token），默认当前文字色；发光用 color-mix 从这个色算，不拼十六进制透明度；
// ③ 读屏名必填；④ 周期照原件三档（慢 1500、正常 800、快 400 毫秒）。
import { motion } from 'motion/react'
import { useEffect, useMemo, useState } from 'react'
import { cn } from '../lib/cn.ts'

export type GridMatrix = readonly (readonly (0 | 1)[])[]

const parse = (rows: string): GridMatrix =>
  rows.split('/').map((row) => Array.from(row, (char) => (char === 'x' ? 1 : 0)))

/** 常用图案：x 亮、. 灭。 */
export const GRID_LOADER_PATTERNS = {
  border: parse('xxx/x.x/xxx'),
  L: parse('x../x../xxx'),
  center: parse('.../.x./...'),
  corners: parse('x.x/.../x.x'),
  cross: parse('.x./xxx/.x.'),
  'x-shape': parse('x.x/.x./x.x'),
  diamond: parse('.x./x.x/.x.'),
  T: parse('xxx/.x./.x.'),
  'line-h': parse('.../xxx/...'),
  'line-v': parse('.x./.x./.x.'),
  'diag-1': parse('x../.x./..x'),
  'diag-2': parse('..x/.x./x..'),
  'stripes-h': parse('xxx/.../xxx'),
  'stripes-v': parse('x.x/x.x/x.x'),
  full: parse('xxx/xxx/xxx'),
} as const satisfies Record<string, GridMatrix>

export type GridLoaderPattern = keyof typeof GRID_LOADER_PATTERNS

// 周期（毫秒）：照原件三档。
const SPEEDS = { slow: 1500, normal: 800, fast: 400 } as const
// 单格的缓动：原件的 easeInOut。
const CELL_EASE: [number, number, number, number] = [0.645, 0.045, 0.355, 1]

export type GridLoaderProps = {
  /** Accessible name, for example "Loading quotes". */
  label: string
  /** A preset name or your own 3×3 matrix of 0 and 1. */
  pattern?: GridLoaderPattern | GridMatrix
  /** pulse breathes every lit cell, stagger lights them one after another, sequence swaps the whole pattern each beat. */
  mode?: 'pulse' | 'stagger' | 'sequence'
  /** Patterns the sequence mode steps through. */
  sequence?: readonly (GridLoaderPattern | GridMatrix)[]
  /** Length of one beat: slow 1500ms, normal 800ms, fast 400ms. */
  speed?: keyof typeof SPEEDS
  /** Side of the grid in pixels. */
  size?: number
  /** Gap between cells in pixels. */
  gap?: number
  /** Any CSS colour, tokens included; defaults to the current text colour. */
  color?: string
  /** Round cells instead of square ones. */
  rounded?: boolean
  /** Draw the pattern once, without animation. */
  still?: boolean
  /** Extra class name on the root. */
  className?: string
}

const resolve = (pattern: GridLoaderPattern | GridMatrix | undefined): GridMatrix =>
  typeof pattern === 'string' ? GRID_LOADER_PATTERNS[pattern] : (pattern ?? GRID_LOADER_PATTERNS.border)

export function GridLoader({
  label,
  pattern = 'border',
  mode = 'pulse',
  sequence,
  speed = 'normal',
  size = 24,
  gap = 2,
  color,
  rounded = false,
  still = false,
  className,
}: GridLoaderProps) {
  const [beat, setBeat] = useState(0)
  const cycle = SPEEDS[speed]
  useEffect(() => {
    if (mode !== 'sequence' || !sequence?.length || still) return
    const timer = setInterval(() => setBeat((value) => (value + 1) % sequence.length), cycle)
    return () => clearInterval(timer)
  }, [mode, sequence, cycle, still])
  const grid = mode === 'sequence' && sequence?.length ? resolve(sequence[beat % sequence.length]) : resolve(pattern)
  const cells = useMemo(() => grid.flat(), [grid])
  const lit = cells.flatMap((on, index) => (on ? [index] : []))
  const cell = (size - gap * 2) / 3
  return (
    <span
      role="status"
      aria-label={label}
      data-slot="grid-loader"
      data-mode={mode}
      className={cn('inline-grid grid-cols-3', className)}
      style={{ width: size, height: size, gap, color: color ?? 'currentColor' }}
    >
      {cells.map((on, index) => {
        const glow = cell * 0.8
        if (!on) return <span key={index} style={{ width: cell, height: cell }} />
        const delay = mode === 'stagger' ? (lit.indexOf(index) * cycle) / 1000 / (lit.length + 2) : 0
        return (
          <motion.span
            key={index}
            data-slot="grid-loader-cell"
            animate={
              still
                ? { opacity: 1, scale: 1 }
                : mode === 'stagger'
                  ? { opacity: [0, 1, 1, 0], scale: [0.8, 1, 1, 0.8] }
                  : { opacity: [0.4, 1, 0.4], scale: [0.95, 1, 0.95] }
            }
            transition={{
              duration: cycle / 1000,
              ease: CELL_EASE,
              repeat: Infinity,
              delay,
              times: mode === 'stagger' ? [0, 0.2, 0.8, 1] : undefined,
            }}
            style={{
              width: cell,
              height: cell,
              borderRadius: rounded ? '50%' : undefined,
              backgroundColor: 'currentColor',
              boxShadow: `0 0 ${glow * 0.3}px currentColor, 0 0 ${glow * 0.6}px color-mix(in srgb, currentColor 25%, transparent)`,
            }}
          />
        )
      })}
    </span>
  )
}
