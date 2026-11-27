// SPDX-License-Identifier: MIT

// 叠放提示的几何与手势判定：纯函数，toast-stack.tsx 只负责把结果交给 motion。
// 交互借自 Jamie Merrill 的「Stacked toasts」「Dismissing toasts」（x.com/jamiemerrill/status/2113725621524476024、2114085689973190664，2026-11-24 逐帧看），
// 只借交互：收拢时后面的缩小、上移、变淡，悬停展开成列表，横向拖过一定距离或甩出就关；样子保持 Toast 现有的皮肤。数值是看帧估的，写成具名常量，没有依据的标「待定」。

/** 收拢时每往后一层上移的像素（票 #195：约 8px）。 */
export const STACK_PEEK = 8
/** 收拢时每往后一层缩小的比例（约 0.95 的一档）。 */
export const STACK_SCALE_STEP = 0.05
/** 展开成列表后条与条的间距（跟 ToastViewport 的 gap-2 一致）。 */
export const STACK_GAP = 8
/** 收拢时最多露出几层（含最前面那条）；更后面的整条淡掉。 */
export const STACK_LAYERS = 3
/** 收拢时第 1、2 层的不透明度（最前面一条恒为 1；越后越淡）。待定：只是看帧估的，Graphite 的深底上 0.7、0.4 的边几乎看不见，所以取 0.8、0.55。 */
export const STACK_LAYER_OPACITY = [1, 0.8, 0.55] as const
/** 拖过条宽的这一比例就算关（票 #195：约 40%）。 */
export const SWIPE_RATIO = 0.4
/** 甩出速度（px/s）够这个数、且方向与位移一致，不够距离也关。待定。 */
export const SWIPE_FLING_SPEED = 500
/** 甩出至少要拖开的像素，免得手一抖就关。待定。 */
export const SWIPE_FLING_MIN = 24

export type StackSlot = {
  /** 沿远离窗口边的方向的位移（px，已带符号）。 */
  y: number
  scale: number
  opacity: number
  /** li 的高度：收拢时后面的条压成最前面那条的高度，露出的只是边。 */
  height: number
  /** 高度被压低了，要裁掉溢出的内容。 */
  clamped: boolean
  /** 能点、能拖、能聚焦；收拢时只有最前面一条。 */
  interactive: boolean
}

/**
 * 算每条的位置。heights 从旧到新，最后一条在最前面；toward 是「叠出去」的方向：
 * 下面两个角新的贴着窗口下边、往上叠，toward = -1；上面两个角 toward = 1。
 */
export function stackLayout(input: { heights: readonly number[]; expanded: boolean; toward: 1 | -1 }): {
  slots: StackSlot[]
  height: number
} {
  const { heights, expanded, toward } = input
  const n = heights.length
  if (n === 0) return { slots: [], height: 0 }
  const front = heights[n - 1] ?? 0
  const slots: StackSlot[] = []
  // y 里的 `|| 0` 把 -0 收成 0（toward 为 -1、位移为 0 时会得到 -0）。
  if (expanded) {
    let offset = 0
    for (let i = n - 1; i >= 0; i--) {
      const h = heights[i] ?? 0
      slots[i] = { y: toward * offset || 0, scale: 1, opacity: 1, height: h, clamped: false, interactive: true }
      offset += h + STACK_GAP
    }
    return { slots, height: offset - STACK_GAP }
  }
  for (let i = 0; i < n; i++) {
    const depth = n - 1 - i
    const shown = Math.min(depth, STACK_LAYERS - 1)
    slots[i] = {
      y: toward * STACK_PEEK * shown || 0,
      scale: 1 - STACK_SCALE_STEP * shown,
      opacity: depth < STACK_LAYERS ? (STACK_LAYER_OPACITY[depth] ?? 0) : 0,
      height: depth === 0 ? (heights[i] ?? 0) : front,
      clamped: depth > 0,
      interactive: depth === 0,
    }
  }
  return { slots, height: front }
}

/** 拖动松手：返回 -1 / 1（往那边滑出并关）或 0（弹回）。offset、velocity 是横向的位移与速度，width 是条宽。 */
export function swipeDecision(input: { offset: number; velocity: number; width: number }): -1 | 0 | 1 {
  const { offset, velocity, width } = input
  if (width <= 0 || offset === 0) return 0
  const dir = offset > 0 ? 1 : -1
  if (Math.abs(offset) >= width * SWIPE_RATIO) return dir
  const sameWay = velocity * offset > 0
  if (sameWay && Math.abs(velocity) >= SWIPE_FLING_SPEED && Math.abs(offset) >= SWIPE_FLING_MIN) return dir
  return 0
}
