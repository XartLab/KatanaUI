// SPDX-License-Identifier: MIT
// MarketHeatmap 的几个副作用钩子：量绘图区尺寸、放大与返回时焦点跟着走、按底色现算字色、格子位置的弹簧过渡、涨跌翻向时闪一下。
// 从 market-heatmap.tsx 拆出（G5），行为不变。
import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react'
import { LIVE_FLASH_GAP_MS, LIVE_FLASH_MS } from '../lib/live.ts'
import type { TreemapCell } from '../katana/treemap-model.ts'
import type { HeatmapColorBy, HeatmapEntry, HeatmapScheme } from './market-heatmap-types.ts'

// 手感的时长（用户 2026-11-15 看第二版后定方向：照 TradingView 热力图的交互手感；时长待定，没实测）：
// 卡片首次出现淡入 100ms、离开淡出 160ms（CSS）；数据变了颜色过渡 300ms（CSS）；涨跌方向变了的格子闪一下新方向的涨跌色（共用层 live.css 的 .k-live-flash，时长 --dur-flash；FLASH_MS 只管多久后摘掉标记，同一格 1 秒内最多一次）。
// 位置与大小的过渡用包里的弹簧缓动 --ease-snappy / --dur-snappy，放大与返回用 --ease-gentle / --dur-gentle（不新造曲线，不跟 prefers-reduced-motion）。
const FLASH_MS = LIVE_FLASH_MS

type Rect = { l: number; t: number; w: number; h: number }
const cssMs = (value: string, fallback: number) => (value.trim().endsWith('ms') ? parseFloat(value) : fallback)

/** 底色的相对亮度（WCAG），画一个 1 像素的画布把任何写法的颜色（color-mix 解出来的也行）读成 sRGB。 */
function luminanceOf(css: string): number | null {
  const ctx = document.createElement('canvas').getContext('2d', { willReadFrequently: true })
  if (!ctx) return null
  ctx.canvas.width = ctx.canvas.height = 1
  ctx.clearRect(0, 0, 1, 1)
  ctx.fillStyle = css
  ctx.fillRect(0, 0, 1, 1)
  const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data
  const lin = (c: number) => (c / 255 <= 0.04045 ? c / 255 / 12.92 : ((c / 255 + 0.055) / 1.055) ** 2.4)
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
}

export type PlotBox = { width: number; height: number }

/** 绘图区的真实像素尺寸（ResizeObserver）：「格子够不够大」由像素说了算。 */
export function usePlotBox(plot: RefObject<HTMLElement | null>): PlotBox {
  const [box, setBox] = useState<PlotBox>({ width: 1000, height: 600 })
  // 按真实像素排布：这样「格子够不够大」就是像素说了算。
  useLayoutEffect(() => {
    const el = plot.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const read = () => {
      const { width, height } = el.getBoundingClientRect()
      if (width > 0 && height > 0)
        setBox((old) => (old.width === width && old.height === height ? old : { width, height }))
    }
    read()
    const observer = new ResizeObserver(read)
    observer.observe(el)
    return () => observer.disconnect()
  }, [plot])
  return box
}

/** 放大到一组时焦点放到面包屑的「全部」，返回时回到刚才那个组名。 */
export function useDrillFocus(figure: RefObject<HTMLElement | null>, drill: string | null) {
  const left = useRef<string | null>(null)
  // 放大与返回时焦点跟着走：点组名后组名按钮没了，焦点放到面包屑的「全部」；返回后回到刚才那个组名。Esc 才收得到。
  useEffect(() => {
    const root = figure.current
    if (!root) return
    if (drill !== null) {
      left.current = drill
      root.querySelector<HTMLElement>('[data-slot="heatmap-crumb"] button')?.focus()
    } else if (left.current !== null) {
      const name = left.current
      left.current = null
      ;[...root.querySelectorAll<HTMLElement>('[data-slot="heatmap-group"]')]
        .find((el) => el.dataset.group === name)
        ?.focus()
    }
  }, [figure, drill])
}

/** 字色按底色亮度现算黑白，写成容器上的 --mheat-ink-0…6；换主题、涨跌色互换时重读。 */
export function useInkContrast(figure: RefObject<HTMLElement | null>, scheme: HeatmapScheme) {
  // 字色按底色亮度现算黑白：读图例七块色的真实底色，在 bg-000（深字）与 ink-100（浅字）里挑对比度高的，写成容器上的变量 --mheat-ink-0…6；
  // 换主题、涨跌色互换（根上的 data-theme、data-updown）时重读。
  useLayoutEffect(() => {
    const root = figure.current
    if (!root) return
    const apply = () => {
      const style = getComputedStyle(root)
      const dark = luminanceOf(style.getPropertyValue('--k-surface-sunken-background'))
      const light = luminanceOf(style.getPropertyValue('--k-content-primary-foreground'))
      if (dark === null || light === null) return
      for (const swatch of root.querySelectorAll<HTMLElement>('[data-slot="heatmap-swatch"]')) {
        const base = luminanceOf(getComputedStyle(swatch).backgroundColor)
        if (base === null) continue
        const withDark = (base + 0.05) / (dark + 0.05)
        const withLight = (light + 0.05) / (base + 0.05)
        root.style.setProperty(
          `--mheat-ink-${Number(swatch.dataset.step) + 3}`,
          withDark > withLight ? 'var(--k-surface-sunken-background)' : 'var(--k-content-primary-foreground)',
        )
      }
    }
    apply()
    const observer = new MutationObserver(apply)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'data-updown'] })
    return () => observer.disconnect()
  }, [figure, scheme])
}

/** 格子位置与大小的弹簧过渡（FLIP）；容器自己变大变小时不做。 */
export function useCellFlip(
  plot: RefObject<HTMLElement | null>,
  all: readonly TreemapCell<HeatmapEntry>[],
  box: PlotBox,
  drill: string | null,
) {
  const rects = useRef<Map<string, Rect>>(new Map())
  const lastBox = useRef<PlotBox | null>(null)
  const lastDrill = useRef<string | null>(null)
  // 位置与大小的过渡（FLIP 的思路：先知道上一次的位置，再从那里弹簧过渡到新位置）：按格子代码记上一次的矩形，
  // 换大小指标、换视图、放大与返回、数据变了位置动时，用 Web Animations 把 left/top/width/height 从旧值带到新值；新出现的格子淡入。
  // 容器自己变大变小（ResizeObserver 触发的重排）不做过渡，免得拖动时一直追。
  useLayoutEffect(() => {
    const root = plot.current
    const next = new Map<string, Rect>(
      all.map((cell) => [cell.data.symbol, { l: cell.x0, t: cell.y0, w: cell.x1 - cell.x0, h: cell.y1 - cell.y0 }]),
    )
    const resized = lastBox.current !== null && lastBox.current !== box
    const previous = rects.current
    if (root && previous.size > 0 && !resized) {
      const style = getComputedStyle(root)
      const drilled = lastDrill.current !== drill
      const name = drilled ? 'gentle' : 'snappy'
      const easing = style.getPropertyValue(`--ease-${name}`).trim() || 'ease-out'
      const duration = cssMs(style.getPropertyValue(`--dur-${name}`), drilled ? 497 : 333)
      for (const el of root.querySelectorAll<HTMLElement>('[data-slot="heatmap-cell"]')) {
        const code = el.dataset.code ?? ''
        const to = next.get(code)
        const from = previous.get(code)
        if (!to) continue
        if (!from) el.animate({ opacity: [0, 1] }, { duration, easing })
        else if (from.l !== to.l || from.t !== to.t || from.w !== to.w || from.h !== to.h)
          el.animate(
            [
              { left: `${from.l}px`, top: `${from.t}px`, width: `${from.w}px`, height: `${from.h}px` },
              { left: `${to.l}px`, top: `${to.t}px`, width: `${to.w}px`, height: `${to.h}px` },
            ],
            { duration, easing },
          )
      }
    }
    rects.current = next
    lastBox.current = box
    lastDrill.current = drill
  }, [plot, all, box, drill])
}

/** 同一个着色指标下涨跌方向翻了的格子：返回正在闪的格子与新方向（同一格 1 秒内最多一次）。 */
export function useTurnFlash(
  items: readonly HeatmapEntry[],
  color: HeatmapColorBy | undefined,
): ReadonlyMap<string, 'up' | 'down'> {
  const [flashing, setFlashing] = useState<ReadonlyMap<string, 'up' | 'down'>>(new Map())
  const flashedAt = useRef<Map<string, number>>(new Map())
  const signs = useRef<{ key: string; map: Map<string, number> } | null>(null)
  // 数据变了：同一个指标下，涨跌方向变了的格子闪一下新方向的涨跌色（动效有原因：告诉人是哪几格翻了方向）。换指标不算。
  useEffect(() => {
    if (!color) return
    const map = new Map<string, number>()
    for (const item of items) {
      const v = item.value[color.key]
      if (typeof v === 'number') map.set(item.symbol, Math.sign(v))
    }
    const old = signs.current
    signs.current = { key: color.key, map }
    if (!old || old.key !== color.key) return
    // 同一格 1 秒内最多闪一次：行情密的时候不晃眼（节流常量在 lib/live.ts）。
    const nowMs = Date.now()
    const turned = [...map].filter(([code, sign]) => {
      const before = old.map.get(code)
      const quiet = nowMs - (flashedAt.current.get(code) ?? -Infinity) >= LIVE_FLASH_GAP_MS
      return before !== undefined && before !== sign && before !== 0 && sign !== 0 && quiet
    })
    if (turned.length === 0) return
    for (const [code] of turned) flashedAt.current.set(code, nowMs)
    const raise = setTimeout(
      () =>
        setFlashing((now) => {
          const next = new Map(now)
          for (const [code, sign] of turned) next.set(code, sign > 0 ? 'up' : 'down')
          return next
        }),
      0,
    )
    const codes = turned.map(([code]) => code)
    const drop = setTimeout(
      () =>
        setFlashing((now) => {
          const rest = new Map(now)
          for (const code of codes) rest.delete(code)
          return rest
        }),
      FLASH_MS,
    )
    return () => {
      clearTimeout(raise)
      clearTimeout(drop)
    }
  }, [items, color])
  return flashing
}
