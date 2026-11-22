// SPDX-License-Identifier: MIT
// 改自 SmoothUI gravity-letters（https://github.com/educlopez/smoothui ，MIT，© 2024 Eduardo Calvo）的物理部分，抽成纯函数以便单测：
// 掉落（重力、地面与左右墙的反弹、摩擦、静止判定）与回位（弹簧把每个字拉回原位）。常量来自原件。

export type LetterPhysics = {
  angle: number
  angularVel: number
  dx: number
  dy: number
  releaseAt: number
  settled: boolean
  vx: number
  vy: number
}

export type FallWorld = {
  bounce: number
  friction: number
  gravity: number
  /** 字离地面还能下落的距离（容器高 - 字的顶 - 字的高）。 */
  floorLimit: number
  /** dx 的下限（-字的左边）与上限（容器宽 - 字的左边 - 字的宽）。 */
  leftLimit: number
  rightLimit: number
}

const REST_VELOCITY = 20
const REST_HORIZONTAL_VELOCITY = 5
const SPRING_STIFFNESS = 180
const SPRING_DAMPING = 18
const REFORM_EPSILON_POSITION = 0.5
const REFORM_EPSILON_ANGLE = 0.5
const REFORM_EPSILON_VELOCITY = 5

/** 一个字掉一帧（dt 秒）。就地改 p；落地后速度小到阈值就标记静止。 */
export function fallStep(p: LetterPhysics, dt: number, world: FallWorld): void {
  p.vy += world.gravity * dt
  p.dx += p.vx * dt
  p.dy += p.vy * dt
  p.angle += p.angularVel * dt
  if (p.dy >= world.floorLimit) {
    p.dy = world.floorLimit
    p.vy = -p.vy * world.bounce
    p.vx *= 1 - world.friction
    p.angularVel *= 1 - world.friction
    if (Math.abs(p.vy) < REST_VELOCITY && Math.abs(p.vx) < REST_HORIZONTAL_VELOCITY) {
      p.vy = 0
      p.vx = 0
      p.angularVel = 0
      p.settled = true
    }
  }
  if (p.dx <= world.leftLimit) {
    p.dx = world.leftLimit
    p.vx = -p.vx * world.bounce
  } else if (p.dx >= world.rightLimit) {
    p.dx = world.rightLimit
    p.vx = -p.vx * world.bounce
  }
}

/** 一个字回位一帧：弹簧把位移与角度拉回 0；够近且够慢就吸附到原位并标记静止。返回是否还在动。 */
export function reformStep(p: LetterPhysics, dt: number): boolean {
  const ax = -SPRING_STIFFNESS * p.dx - SPRING_DAMPING * p.vx
  const ay = -SPRING_STIFFNESS * p.dy - SPRING_DAMPING * p.vy
  const aAngle = -SPRING_STIFFNESS * p.angle - SPRING_DAMPING * p.angularVel
  p.vx += ax * dt
  p.vy += ay * dt
  p.angularVel += aAngle * dt
  p.dx += p.vx * dt
  p.dy += p.vy * dt
  p.angle += p.angularVel * dt
  if (
    Math.abs(p.dx) < REFORM_EPSILON_POSITION &&
    Math.abs(p.dy) < REFORM_EPSILON_POSITION &&
    Math.abs(p.angle) < REFORM_EPSILON_ANGLE &&
    Math.abs(p.vx) < REFORM_EPSILON_VELOCITY &&
    Math.abs(p.vy) < REFORM_EPSILON_VELOCITY
  ) {
    p.dx = 0
    p.dy = 0
    p.angle = 0
    p.vx = 0
    p.vy = 0
    p.settled = true
    return false
  }
  return true
}
