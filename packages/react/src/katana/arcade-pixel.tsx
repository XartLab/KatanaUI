// SPDX-License-Identifier: MIT
// 像素屏：5x7 点阵字体或自带精灵画在 canvas 上，可选打字、擦除、闪烁、跑马灯，叠 CRT 扫描线与荧光。
// 取自 SmoothUI 的 arcade-pixel（https://smoothui.dev/docs/components/arcade-pixel ，源码 https://smoothui.dev/r/arcade-pixel.json ，MIT，Copyright (c) Eduardo Calvo，2026-11-14 读取），
// 记在 THIRD_PARTY_NOTICES.md。相对上游的改动：① cn 换成本包的 ../lib/cn，去掉 "use client"，默认导出改具名导出；
// ② 去掉 useReducedMotion 与 prefers-reduced-motion 分支（本项目不跟「减少动态效果」，AGENTS.md）；③ 默认色从 token 取（var(--accent)），不用上游的 --color-brand；闪光、闪烁、CRT 叠层也读 token（G3 去掉写死的 #ffffff 与 bg-white）；
// ④ 屏外与标签页隐藏时暂停动画保留（那是性能，不是减少动态）；画布 aria-hidden、文字另放 sr-only 保留；⑤ 内部工具函数不进包入口（G3 起放在 -sprites / -paint 两个内部模块里）。
// 字体只有 5x7 拉丁字母、数字与 - , : ! ? . * 空格，没有中日韩字；不认识的字符画成空格。
// 文件分三份（G3，体检 §7）：arcade-pixel-sprites.ts 是字形与精灵数据，arcade-pixel-paint.ts 是画一帧，这里只管 React、计时与 CRT 叠层。

import { motion } from 'motion/react'
import { useEffect, useMemo, useRef } from 'react'
import { cn } from '../lib/cn.ts'
import { isSameFrame, paintFrame, PALETTE_SEPARATOR, resolveColor, type FrameState } from './arcade-pixel-paint.ts'
import { CHARACTER_UNIT_WIDTH, resolveGrid } from './arcade-pixel-sprites.ts'

export { ARCADE_SPRITES } from './arcade-pixel-sprites.ts'

export type ArcadePixelAnimate = 'none' | 'type' | 'wipe' | 'blink' | 'marquee'

export interface ArcadePixelProps {
  /** Reveal animation played on mount. `marquee` scrolls the message forever. */
  animate?: ArcadePixelAnimate
  className?: string
  /** Fixed display width in pixel cells. Defaults to the content width. */
  columns?: number
  /** Curved vignette, chromatic fringing and a faint flicker over the canvas. */
  crt?: boolean
  /** Gap, in CSS pixels, between pixel cells. */
  gap?: number
  /** Phosphor bloom bleeding out of lit pixels. A number sets its intensity (0-1). */
  glow?: boolean | number
  /** Whether the reveal animation repeats indefinitely. */
  loop?: boolean
  /** Colors indexed by sprite/font value. Index 0 is treated as background. */
  palette?: string[]
  /** Size, in CSS pixels, of a single pixel cell. */
  pixelSize?: number
  /** Overlays a CRT-style scanline pattern. */
  scanlines?: boolean
  /** Animation speed multiplier. Higher plays faster. */
  speed?: number
  /** 2D array of palette indices. Takes precedence over `text` when both are set. */
  sprite?: number[][]
  /** Text rendered through the built-in 5x7 pixel font. Ignored if `sprite` is set. */
  text?: string
  /**
   * Accessible name; defaults to text. Without either (a bare sprite) the display is decorative and hidden from screen readers.
   * 读屏名，不给用 text；纯精灵又没给就当装饰（包里不带兜底文案，改前写死英文 pixel art）。
   */
  label?: string
}

const DEFAULT_PIXEL_SIZE = 8
const DEFAULT_GAP = 1
const DEFAULT_PALETTE: string[] = ['transparent', 'var(--accent)']
/** Token of the type-reveal flash: the brightest ink of the screen. */
const FLASH_TOKEN = 'var(--lcd-fg)'
const DEFAULT_SPEED = 1
const MAX_DEVICE_PIXEL_RATIO = 2
const TYPE_DURATION_MS = 1400
const WIPE_DURATION_MS = 900
const BLINK_INTERVAL_MS = 450
const BLINK_SETTLE_CYCLES = 3
const TYPE_FLASH_MS = 110
const MARQUEE_COLUMNS_PER_SECOND = 16
const MARQUEE_TAIL_COLUMNS = 8
const DEFAULT_GLOW_INTENSITY = 0.65
const MS_PER_SECOND = 1000

/** Linear, expressed as a cubic-bezier so no string easing reaches Motion. */
const LINEAR_EASE: [number, number, number, number] = [0, 0, 1, 1]
const SCANLINE_PERIOD_PX = 3
const SCANLINE_DRIFT_PX = SCANLINE_PERIOD_PX * 2
const SCANLINE_DRIFT_SECONDS = 5
const ROLL_BAND_SECONDS = 9
const FLICKER_SECONDS = 2.4

type ArcadeCrtOverlayProps = {
  crt: boolean
  scanlines: boolean
}

/**
 * Every CRT artefact is a CSS layer stacked over the canvas, so none of it costs
 * per-frame canvas work.
 */
const ArcadeCrtOverlay = ({ crt, scanlines }: ArcadeCrtOverlayProps) => (
  <>
    {scanlines ? (
      <motion.div
        animate={{ transform: ['translateY(0px)', `translateY(-${SCANLINE_DRIFT_PX}px)`] }}
        className="k-arcade-scanlines absolute inset-x-0 top-0 h-[200%]"
        transition={{
          duration: SCANLINE_DRIFT_SECONDS,
          ease: LINEAR_EASE,
          repeat: Number.POSITIVE_INFINITY,
        }}
      />
    ) : null}
    {crt ? (
      <>
        <motion.div
          animate={{ transform: ['translateY(-140%)', 'translateY(240%)'] }}
          className="k-arcade-roll absolute inset-x-0 top-0 h-1/3"
          transition={{
            duration: ROLL_BAND_SECONDS,
            ease: LINEAR_EASE,
            repeat: Number.POSITIVE_INFINITY,
          }}
        />
        <div className="k-arcade-aberration absolute inset-0" />
        <div className="k-arcade-vignette absolute inset-0" />
        <motion.div
          animate={{ opacity: [0.055, 0.015, 0.045, 0.01, 0.06] }}
          className="k-arcade-flicker absolute inset-0"
          transition={{
            duration: FLICKER_SECONDS,
            ease: LINEAR_EASE,
            repeat: Number.POSITIVE_INFINITY,
            repeatType: 'mirror',
          }}
        />
      </>
    ) : null}
  </>
)

export const ArcadePixel = ({
  sprite,
  text,
  palette = DEFAULT_PALETTE,
  columns,
  pixelSize = DEFAULT_PIXEL_SIZE,
  gap = DEFAULT_GAP,
  scanlines = false,
  crt = false,
  glow = false,
  animate = 'none',
  speed = DEFAULT_SPEED,
  loop = false,
  label,
  className,
}: ArcadePixelProps) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const grid = useMemo(() => resolveGrid(sprite, text), [sprite, text])
  const paletteKey = palette.join(PALETTE_SEPARATOR)
  const stablePalette = useMemo(() => paletteKey.split(PALETTE_SEPARATOR), [paletteKey])

  const totalRows = grid.length
  const totalColumns = grid[0]?.length ?? 0
  const columnsInView = Math.max(1, columns ?? totalColumns)
  const stride = pixelSize + gap
  const cssWidth = columnsInView * stride - gap
  const cssHeight = totalRows * stride - gap

  const { numUnits, unitWidth } = useMemo(() => {
    if (!sprite && typeof text === 'string') {
      return {
        numUnits: Math.max(1, Array.from(text).length),
        unitWidth: CHARACTER_UNIT_WIDTH,
      }
    }
    return { numUnits: Math.max(1, totalColumns), unitWidth: 1 }
  }, [sprite, text, totalColumns])

  // 读屏名：调用方给的 label 优先，其次是文字本身；两样都没有（纯精灵且没给 label）就当装饰，整块对读屏隐藏，包里不带兜底文案。
  const accessibleLabel = label ?? (typeof text === 'string' && text.trim().length > 0 ? text : undefined)

  const glowIntensity = typeof glow === 'number' ? glow : (glow && DEFAULT_GLOW_INTENSITY) || 0

  useEffect(() => {
    const container = containerRef.current
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!(container && canvas && ctx)) {
      return
    }

    const safeSpeed = speed > 0 ? speed : DEFAULT_SPEED
    const isStatic = animate === 'none'
    const resolvedPalette = stablePalette.map((color) =>
      color === 'transparent' ? color : resolveColor(container, color),
    )
    const matrixColor = resolvedPalette.find((color) => color !== 'transparent') ?? getComputedStyle(container).color
    const flashColor = resolveColor(container, FLASH_TOKEN)
    const period = animate === 'marquee' ? totalColumns + MARQUEE_TAIL_COLUMNS : 0

    const staticFrame: FrameState = {
      done: true,
      flashEnd: -1,
      flashStart: -1,
      offsetColumns: 0,
      revealedColumns: totalColumns,
      visible: true,
    }

    let rafId: number | null = null
    let isFinished = isStatic
    let isOffscreen = false
    let isHidden = document.hidden
    let isPaused = false
    let elapsedMs = 0
    let lastTimestamp: number | null = null
    let lastFrame: FrameState = staticFrame
    let currentCssWidth = cssWidth
    let currentCssHeight = cssHeight
    let landedUnits = 0
    let flashStartedAtMs = Number.NEGATIVE_INFINITY

    const setBackingStoreSize = () => {
      const rect = container.getBoundingClientRect()
      currentCssWidth = rect.width
      currentCssHeight = rect.height
      const devicePixelRatio = Math.min(window.devicePixelRatio || 1, MAX_DEVICE_PIXEL_RATIO)
      const width = Math.max(1, Math.round(rect.width * devicePixelRatio))
      const height = Math.max(1, Math.round(rect.height * devicePixelRatio))
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width
        canvas.height = height
      }
      ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0)
    }

    const render = (frame: FrameState) => {
      lastFrame = frame
      paintFrame(ctx, canvas, {
        bloomAlpha: glowIntensity,
        flashColor,
        columnsInView,
        frame,
        grid,
        height: currentCssHeight,
        matrixColor,
        palette: resolvedPalette,
        period,
        pixelSize,
        stride,
        width: currentCssWidth,
      })
    }

    const computeTypeFrame = (): FrameState => {
      const progress = Math.min(elapsedMs / (TYPE_DURATION_MS / safeSpeed), 1)
      const units = Math.floor(progress * numUnits)
      if (units !== landedUnits) {
        landedUnits = units
        flashStartedAtMs = elapsedMs
      }
      const isFlashing = elapsedMs - flashStartedAtMs < TYPE_FLASH_MS
      return {
        done: progress >= 1,
        flashEnd: isFlashing ? units * unitWidth : -1,
        flashStart: isFlashing ? (units - 1) * unitWidth : -1,
        offsetColumns: 0,
        revealedColumns: Math.min(totalColumns, units * unitWidth),
        visible: true,
      }
    }

    const computeWipeFrame = (): FrameState => {
      const progress = Math.min(elapsedMs / (WIPE_DURATION_MS / safeSpeed), 1)
      return {
        ...staticFrame,
        done: progress >= 1,
        revealedColumns: Math.floor(progress * totalColumns),
      }
    }

    const computeBlinkFrame = (): FrameState => {
      const phase = Math.floor(elapsedMs / (BLINK_INTERVAL_MS / safeSpeed))
      const settled = !loop && phase >= BLINK_SETTLE_CYCLES * 2
      return {
        ...staticFrame,
        done: settled,
        visible: settled || phase % 2 === 0,
      }
    }

    const computeMarqueeFrame = (): FrameState => {
      const columnsPerMs = (MARQUEE_COLUMNS_PER_SECOND * safeSpeed) / MS_PER_SECOND
      return {
        ...staticFrame,
        done: false,
        offsetColumns: (elapsedMs * columnsPerMs) % Math.max(1, period),
      }
    }

    const computeFrame = (): FrameState => {
      if (animate === 'type') {
        return computeTypeFrame()
      }
      if (animate === 'wipe') {
        return computeWipeFrame()
      }
      if (animate === 'blink') {
        return computeBlinkFrame()
      }
      if (animate === 'marquee') {
        return computeMarqueeFrame()
      }
      return staticFrame
    }

    const step = (timestamp: number) => {
      rafId = null
      if (isPaused || isFinished) {
        return
      }
      if (lastTimestamp !== null) {
        elapsedMs += timestamp - lastTimestamp
      }
      lastTimestamp = timestamp

      const frame = computeFrame()
      // A blinking display only changes twice a second, so repainting it every
      // rAF tick would be pure waste.
      if (!isSameFrame(frame, lastFrame)) {
        render(frame)
      }

      if (frame.done) {
        if (loop) {
          elapsedMs = 0
          landedUnits = 0
          flashStartedAtMs = Number.NEGATIVE_INFINITY
        } else {
          render(staticFrame)
          isFinished = true
          return
        }
      }
      rafId = requestAnimationFrame(step)
    }

    const schedule = () => {
      if (isPaused || isFinished || rafId !== null) {
        return
      }
      rafId = requestAnimationFrame(step)
    }

    const updatePauseState = () => {
      const shouldPause = isOffscreen || isHidden
      if (shouldPause === isPaused) {
        return
      }
      isPaused = shouldPause
      if (isPaused) {
        if (rafId !== null) {
          cancelAnimationFrame(rafId)
          rafId = null
        }
        lastTimestamp = null
      } else {
        schedule()
      }
    }

    setBackingStoreSize()
    if (isFinished) {
      render(staticFrame)
    } else {
      render({ ...staticFrame, revealedColumns: 0 })
      schedule()
    }

    const resizeObserver = new ResizeObserver(() => {
      setBackingStoreSize()
      render(lastFrame)
    })
    resizeObserver.observe(container)

    const intersectionObserver = new IntersectionObserver((entries) => {
      const [entry] = entries
      if (!entry) {
        return
      }
      isOffscreen = !entry.isIntersecting
      updatePauseState()
    })
    intersectionObserver.observe(container)

    const handleVisibilityChange = () => {
      isHidden = document.hidden
      updatePauseState()
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId)
      }
      resizeObserver.disconnect()
      intersectionObserver.disconnect()
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [
    grid,
    stablePalette,
    pixelSize,
    stride,
    columnsInView,
    glowIntensity,
    animate,
    speed,
    loop,
    totalColumns,
    numUnits,
    unitWidth,
    cssWidth,
    cssHeight,
  ])

  return (
    <div
      className={cn('k-arcade relative inline-block overflow-hidden', className)}
      data-slot="arcade-pixel"
      aria-hidden={accessibleLabel === undefined || undefined}
      ref={containerRef}
      style={{ height: cssHeight, width: cssWidth }}
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 select-none">
        <canvas className="block h-full w-full" data-slot="arcade-pixel-canvas" ref={canvasRef} />
        <ArcadeCrtOverlay crt={crt} scanlines={scanlines} />
      </div>
      {accessibleLabel === undefined ? null : <span className="sr-only">{accessibleLabel}</span>}
    </div>
  )
}
