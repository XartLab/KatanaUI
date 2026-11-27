// SPDX-License-Identifier: MIT
// FloatingWindow 的纯函数：页内浮层的位置（拖动与方向键移动都落在视口内）。

export type FloatPosition = { left: number; top: number }

/** 把浮层的左上角夹进视口：整块浮层不出视口；浮层比视口还大时贴左上。 */
export function clampPosition(
  position: FloatPosition,
  size: { width: number; height: number },
  viewport: { width: number; height: number },
): FloatPosition {
  const clamp = (value: number, room: number) => Math.max(0, Math.min(value, room))
  return {
    left: clamp(position.left, viewport.width - size.width),
    top: clamp(position.top, viewport.height - size.height),
  }
}

/** 方向键移动的步长：普通 8px，按住 Shift 32px。返回位移；不是方向键返回 null。 */
export function arrowDelta(key: string, shift: boolean): { dx: number; dy: number } | null {
  const step = shift ? 32 : 8
  switch (key) {
    case 'ArrowLeft':
      return { dx: -step, dy: 0 }
    case 'ArrowRight':
      return { dx: step, dy: 0 }
    case 'ArrowUp':
      return { dx: 0, dy: -step }
    case 'ArrowDown':
      return { dx: 0, dy: step }
    default:
      return null
  }
}
