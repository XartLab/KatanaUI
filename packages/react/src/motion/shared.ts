// SPDX-License-Identifier: MIT
// 改自 SmoothUI 的 aurora-curtain、gravity-stars 等件里反复出现的小工具（https://github.com/educlopez/smoothui ，MIT，© 2024 Eduardo Calvo）：
// 颜色解析、屏外与标签页隐藏时停动画。抽到一处，背景、过场、特效共用。
import { useEffect, useState, type RefObject } from 'react'

/** 画布的设备像素比封顶：再高只多花填充率，肉眼看不出。 */
export const MAX_DPR = 2

// 与 lib/num 的 clamp 先后相反（max 在外）：min > max 时这里得 min、那边得 max；调用方多、没逐个核对会不会碰到 min > max，留本地。
export const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value))

/** 裸的自定义属性名（--ink-100）补成 var(--ink-100)；其余原样。 */
export const toCssColor = (input: string) => (input.trim().startsWith('--') ? `var(${input.trim()})` : input.trim())

export type Rgb = [number, number, number]

/**
 * 把任意 CSS 颜色（含 var(--token)）解成 0-255 的 RGB：先用隐藏的 span 走一遍级联拿到计算色，再画进 1x1 画布读像素，
 * 这样 token 跟着主题走，不用在 JS 里再抄一份色板。解不出就用 fallback（按下标取）。
 */
export const resolveCssColors = (inputs: readonly string[], host: HTMLElement, fallbacks: readonly Rgb[]): Rgb[] => {
  const probe = document.createElement('span')
  probe.style.display = 'none'
  host.append(probe)
  const canvas = document.createElement('canvas')
  canvas.width = 1
  canvas.height = 1
  const context = canvas.getContext('2d', { willReadFrequently: true })
  const resolved = inputs.map((input, index): Rgb => {
    const fallback = fallbacks[index % fallbacks.length] ?? [255, 255, 255]
    if (!context) return fallback
    probe.style.color = ''
    probe.style.color = toCssColor(input)
    const computed = window.getComputedStyle(probe).color
    if (!computed) return fallback
    context.clearRect(0, 0, 1, 1)
    context.fillStyle = '#000000'
    context.fillStyle = computed
    context.fillRect(0, 0, 1, 1)
    const { data } = context.getImageData(0, 0, 1, 1)
    return [data[0]!, data[1]!, data[2]!]
  })
  probe.remove()
  return resolved
}

/** resolveCssColors 的结果换成 0-1 的浮点，给着色器 uniform 用。 */
export const toUnit = (rgb: Rgb): Rgb => [rgb[0] / 255, rgb[1] / 255, rgb[2] / 255]

/**
 * 在屏内且标签页可见时为 true：画布类动画只在这时跑（性能，不是减少动态）。
 * enabled 为 false（如 WebGL 不可用）时不挂观察器。
 */
export function useOnScreen(hostRef: RefObject<Element | null>, enabled = true): boolean {
  const [active, setActive] = useState(false)
  useEffect(() => {
    const host = hostRef.current
    if (!(host && enabled)) return
    let onScreen = true
    const sync = () => setActive(onScreen && document.visibilityState === 'visible')
    const observer = new IntersectionObserver((entries) => {
      onScreen = entries.some((entry) => entry.isIntersecting)
      sync()
    })
    observer.observe(host)
    document.addEventListener('visibilitychange', sync)
    sync()
    return () => {
      observer.disconnect()
      document.removeEventListener('visibilitychange', sync)
    }
  }, [hostRef, enabled])
  return active
}

/** motion 的 useScroll 的 offset 元组类型，滚动驱动的特效件共用。 */
export type ScrollOffset = NonNullable<Parameters<typeof import('motion/react').useScroll>[0]>['offset']
