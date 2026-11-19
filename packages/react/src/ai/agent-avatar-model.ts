// SPDX-License-Identifier: MIT
// 改自 SmoothUI agent-avatar（https://github.com/educlopez/smoothui ，MIT，© 2024 Eduardo Calvo）
// 像素头像的生成与绘制：种子 → 散列 → 色板与 6x6 的格子；动效的各项幅度是原件的常量。

const GRID_SIZE = 6
/** 脉动：每格各自在明度上起伏。 */
const PULSE_SPEED = 0.002
const PULSE_AMPLITUDE = 22
/** 呼吸：整体明度慢慢起伏。 */
const BREATHE_SPEED = 0.001
const BREATHE_AMPLITUDE = 10
/** 斜扫：一道对角线的明暗扫过格子。 */
const WAVE_SPEED = 0.0015
const WAVE_AMPLITUDE = 15
const WAVE_LENGTH = 3
/** 闪点：偶尔一格亮一下。 */
const SPARKLE_SPEED = 0.004
const SPARKLE_THRESHOLD = 0.92
const SPARKLE_BOOST = 25
/** 整体大小的轻微呼吸。 */
const SCALE_PULSE_SPEED = 0.0008
const SCALE_PULSE_AMOUNT = 0.03
/** 同一色相族里最多散开多少度。 */
const HUE_SPREAD = 45
const GLOW_RADIUS_RATIO = 0.25

/** 从字符串得到一个确定的整数（31 进制散列）。 */
export function hashSeed(text: string): number {
  let hash = 0
  for (const char of text) hash = ((hash << 5) - hash + (char.codePointAt(0) ?? 0)) | 0
  return Math.abs(hash)
}

/** mulberry32：同一个种子永远同一串。 */
export function createRng(seed: number): () => number {
  let state = seed
  return () => {
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

type Hsl = [hue: number, saturation: number, lightness: number]
type Cell = { colorIndex: number; phase: number; brightness: number; sparklePhase: number }

/** 同一色相族的三色色板。 */
export function generatePalette(hash: number): [Hsl, Hsl, Hsl] {
  const rng = createRng(hash)
  const baseHue = rng() * 360
  const sat = 75 + rng() * 20
  return [
    [baseHue, sat, 55 + rng() * 10],
    [(baseHue - HUE_SPREAD + rng() * HUE_SPREAD * 2 + 360) % 360, sat - 5 + rng() * 10, 40 + rng() * 15],
    [(baseHue - HUE_SPREAD + rng() * HUE_SPREAD * 2 + 360) % 360, sat - 10 + rng() * 15, 60 + rng() * 15],
  ]
}

export function generateGrid(hash: number): Cell[][] {
  const rng = createRng(hash + 1)
  return Array.from({ length: GRID_SIZE }, () =>
    Array.from({ length: GRID_SIZE }, () => ({
      brightness: 0.3 + rng() * 0.7,
      colorIndex: Math.floor(rng() * 3),
      phase: rng() * Math.PI * 2,
      sparklePhase: rng() * Math.PI * 2,
    })),
  )
}

/** 一个种子对应的头像：palette、grid 算一次，draw 每帧画。 */
export function createAvatar(seed: string, size: number) {
  const hash = hashSeed(seed)
  const palette = generatePalette(hash)
  const grid = generateGrid(hash)
  const cellSize = size / GRID_SIZE
  const half = size / 2
  return {
    palette,
    grid,
    draw(ctx: CanvasRenderingContext2D, time: number, background: string, animated: boolean) {
      ctx.clearRect(0, 0, size, size)
      const scale = animated ? 1 + Math.sin(time * SCALE_PULSE_SPEED) * SCALE_PULSE_AMOUNT : 1
      ctx.save()
      ctx.translate(half, half)
      ctx.scale(scale, scale)
      ctx.translate(-half, -half)
      ctx.beginPath()
      ctx.arc(half, half, half, 0, Math.PI * 2)
      ctx.clip()
      ctx.fillStyle = background
      ctx.fillRect(0, 0, size, size)
      const breathe = animated ? Math.sin(time * BREATHE_SPEED) * BREATHE_AMPLITUDE : 0
      for (let y = 0; y < GRID_SIZE; y++) {
        for (let x = 0; x < GRID_SIZE; x++) {
          const cell = grid[y]![x]!
          const [h, s, l] = palette[cell.colorIndex]!
          const pulse = animated ? Math.sin(time * PULSE_SPEED + cell.phase) * PULSE_AMPLITUDE : 0
          const wave = animated ? Math.sin(time * WAVE_SPEED + (x + y) / WAVE_LENGTH) * WAVE_AMPLITUDE : 0
          const sparkleValue = animated ? Math.sin(time * SPARKLE_SPEED + cell.sparklePhase) : 0
          const sparkle =
            sparkleValue > SPARKLE_THRESHOLD
              ? ((sparkleValue - SPARKLE_THRESHOLD) / (1 - SPARKLE_THRESHOLD)) * SPARKLE_BOOST
              : 0
          const light = Math.min(90, Math.max(20, (l + pulse + breathe + wave + sparkle) * cell.brightness))
          const sat = Math.min(100, s + 5)
          const color = `hsl(${h}, ${sat}%, ${light}%)`
          ctx.shadowColor = color
          ctx.shadowBlur = cellSize * 0.45
          ctx.fillStyle = color
          ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize)
        }
      }
      ctx.shadowBlur = 0
      ctx.restore()
      // 外圈一圈淡光。
      const [gh, gs, gl] = palette[0]
      ctx.save()
      ctx.globalCompositeOperation = 'screen'
      ctx.shadowColor = `hsla(${gh}, ${gs}%, ${gl}%, 0.6)`
      ctx.shadowBlur = size * GLOW_RADIUS_RATIO
      ctx.beginPath()
      ctx.arc(half, half, half - 1, 0, Math.PI * 2)
      ctx.strokeStyle = `hsla(${gh}, ${gs}%, ${gl}%, 0.15)`
      ctx.lineWidth = 2
      ctx.stroke()
      ctx.restore()
    },
  }
}
