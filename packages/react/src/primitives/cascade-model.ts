// SPDX-License-Identifier: MIT
// 级联菜单的时间与几何（#250 第二部分）：纯函数与常量，不碰 DOM，单测在 cascade-model.test.ts。
// 出处：kubai（@kubai087）《999 个小技巧》第 002 期「级联菜单的安全区与延时」（https://vibedesign.tips/002-cascade-menu/ ，
// 数值照 issue #250 抄录的原文，2026-11-26）。菜单的尺寸、配色、毛玻璃不搬，仍是 OpenMarket 实测加 token（决策记录 0049）。

/** 所有时间集中在这一处（毫秒）；要改只改这里，单测与文档站「怎么用」都读它。 */
export const CASCADE_TIMING = {
  /** 悬停在父项上这么久才开子菜单（离开取消；触摸点一下立即开）。 */
  openDelay: 220,
  /** 拖着东西（按着键移动）经过文件夹式的父项：停这么久才开。 */
  dragOpenDelay: 420,
  /** 安全窗口：指针在三角里停在某一行，最多护这么久，满了就切换到那一行。 */
  safeWindow: 1200,
  /** 安全窗口里每隔这么久复查一次（指针停住时没有 pointermove，要靠定时复查）。 */
  safeRecheck: 80,
  /** 指针离开触发器、所有层与安全区之后，子菜单再等这么久才收；回来就取消。 */
  closeDelay: 360,
} as const

/** 靠子菜单一侧的保护带宽：父菜单宽的 43%，夹在 56 到 90 之间（像素）。 */
export const SAFE_BAND = { ratio: 0.43, min: 56, max: 90 } as const

export type Point = { x: number; y: number }
export type Box = { left: number; top: number; right: number; bottom: number }

/** 保护带的宽度：min(90px, max(56px, 父宽 × 43%))。 */
export function safeBandWidth(parentWidth: number): number {
  return Math.min(SAFE_BAND.max, Math.max(SAFE_BAND.min, parentWidth * SAFE_BAND.ratio))
}

const cross = (a: Point, b: Point, p: Point) => (b.x - a.x) * (p.y - a.y) - (b.y - a.y) * (p.x - a.x)

/** 点在三角形里（含边）：三条边的叉积同号（零算在里面）。三角退化成一条线时只有线上的点算在里面。 */
export function inTriangle(p: Point, a: Point, b: Point, c: Point): boolean {
  const d1 = cross(a, b, p)
  const d2 = cross(b, c, p)
  const d3 = cross(c, a, p)
  const negative = d1 < 0 || d2 < 0 || d3 < 0
  const positive = d1 > 0 || d2 > 0 || d3 > 0
  return !(negative && positive)
}

/** 子菜单在父菜单的哪一边：以中心线判断，翻到左边（视口放不下）时是 left。 */
export function submenuSide(parent: Box, sub: Box): 'right' | 'left' {
  return (sub.left + sub.right) / 2 >= (parent.left + parent.right) / 2 ? 'right' : 'left'
}

export type SafeZone = {
  /** 三角的顶点：离开触发器那一刻的指针位置。 */
  apex: Point
  /** 三角的另外两个角：子菜单近边的上下两角（向右开用左边缘，翻到左边用右边缘）。 */
  near: readonly [Point, Point]
  /** 保护带：父菜单靠子菜单一侧，一直延伸到子菜单近边，竖向不限（竖向由三角管）。 */
  band: { from: number; to: number }
  side: 'right' | 'left'
}

/** 由顶点、父菜单与子菜单的外框算出安全区。 */
export function safeZone(apex: Point, parent: Box, sub: Box): SafeZone {
  const side = submenuSide(parent, sub)
  const x = side === 'right' ? sub.left : sub.right
  const width = safeBandWidth(parent.right - parent.left)
  const band = side === 'right' ? { from: parent.right - width, to: x } : { from: x, to: parent.left + width }
  return {
    apex,
    near: [
      { x, y: sub.top },
      { x, y: sub.bottom },
    ],
    band,
    side,
  }
}

/** 指针在安全区里：在三角内，并且在父菜单靠子菜单一侧的保护带内。 */
export function inSafeZone(point: Point, zone: SafeZone): boolean {
  return (
    point.x >= zone.band.from && point.x <= zone.band.to && inTriangle(point, zone.apex, zone.near[0], zone.near[1])
  )
}

/** 打开延时：拖着东西经过 420，普通悬停 220。 */
export function openDelayFor(dragging: boolean): number {
  return dragging ? CASCADE_TIMING.dragOpenDelay : CASCADE_TIMING.openDelay
}

/**
 * 1.2 秒安全窗口的判定（不碰计时器，时间由调用方传）：指针在三角里停在某一行，护这一行最多 1200ms；换了一行重新计；
 * 离开三角立即放行。放行后调用方切换到指针底下的那一行并 reset()。
 */
export class DwellGuard<Row> {
  #row: Row | null = null
  #since = 0

  judge({ row, now, inZone }: { row: Row | null; now: number; inZone: boolean }): 'hold' | 'release' {
    if (!inZone) return 'release'
    if (row !== this.#row) {
      this.#row = row
      this.#since = now
    }
    return now - this.#since >= CASCADE_TIMING.safeWindow ? 'release' : 'hold'
  }

  reset() {
    this.#row = null
    this.#since = 0
  }
}
