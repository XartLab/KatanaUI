// SPDX-License-Identifier: MIT
/**
 * Helpers that make a component screenshot land on one deterministic frame, however busy the machine is.
 * 组件截图「停在确定的一帧」的工具：等有限动画与过渡走完、等条件成立、给靠 rAF 画的画布一个虚拟时钟。只给 *.browser.test.tsx 用，不进包。
 *
 * 原则（#219）：截图前不赌「等多久够」，而是等一个能观察到的终态；到不了终态的（无限循环、按时间画）就把时间钉住。
 */

// 在 frameClock 换掉 requestAnimationFrame 之前先拿住原生的，等帧永远用原生的。
const nativeFrame = window.requestAnimationFrame.bind(window)
const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))
// 页面被挤得喘不过气时 rAF 可能迟迟不来：100ms 兜底，循环次数另有上限。
const nextFrame = () =>
  new Promise<void>((resolve) => {
    let done = false
    const finish = () => {
      if (done) return
      done = true
      resolve()
    }
    nativeFrame(finish)
    setTimeout(finish, 100)
  })

// Radix 的定位外壳在算出位置之前停在 translate(0, -200%)，位置一出才开始入场动画：只看动画会在「还没定位」那几帧里误以为已经静了。
const positioning = () =>
  [...document.querySelectorAll<HTMLElement>('[data-radix-popper-content-wrapper]')].some((wrapper) =>
    wrapper.style.transform.includes('-200%'),
  )

const finite = (animation: Animation) =>
  animation.effect?.getComputedTiming().endTime !== Infinity && animation.playState === 'running'

/**
 * Waits until no finite animation or transition has been running for `frames` frames in a row (enter animations, 150ms colour
 * transitions, motion springs written as Web Animations), so the screenshot is never taken half way.
 * 连着几帧都没有在跑的有限动画才返回。`freezeInfinite` 另把无限循环的动画（光标明灭、流光）停在第 0 刻，给「循环永远不稳」的件用。
 */
export async function settled({ frames = 3, freezeInfinite = false } = {}) {
  await document.fonts.ready
  let quiet = 0
  for (let round = 0; round < 400 && quiet < frames; round += 1) {
    await nextFrame()
    const running = document.getAnimations().filter(finite)
    if (running.length === 0 && !positioning()) {
      quiet += 1
      continue
    }
    quiet = 0
    if (running.length === 0) continue
    await Promise.all(running.map((animation) => animation.finished.catch(() => undefined)))
  }
  if (freezeInfinite) {
    for (const animation of document.getAnimations()) {
      if (animation.effect?.getComputedTiming().endTime !== Infinity) continue
      animation.pause()
      animation.currentTime = 0
    }
    await nextFrame()
  }
}

/** Polls until `check` is true (50ms apart, about 15s at most) and throws with the reason otherwise; for states a timer builds up (a typed-out line, a finished script). */
export async function waitUntil(check: () => boolean, reason: string) {
  for (let round = 0; round < 300; round += 1) {
    if (check()) return
    await sleep(50)
  }
  throw new Error(`timed out waiting for: ${reason}`)
}

/**
 * A virtual clock for pieces that draw from requestAnimationFrame and performance.now (canvas loops): install it before mounting,
 * `step` it a fixed number of frames, and the picture is the same on every run; after `step` no frame ever fires again.
 * 虚拟时钟：靠 requestAnimationFrame 与 performance.now 画的画布件，挂载前装上，走固定的帧数，画面每次都一样；走完不再有帧。用完 restore。
 */
export function frameClock() {
  const realRequest = window.requestAnimationFrame
  const realCancel = window.cancelAnimationFrame
  const realNow = performance.now
  let time = 0
  let nextId = 0
  const queue = new Map<number, FrameRequestCallback>()
  window.requestAnimationFrame = (callback) => {
    nextId += 1
    queue.set(nextId, callback)
    return nextId
  }
  window.cancelAnimationFrame = (id) => {
    queue.delete(id)
  }
  performance.now = () => time
  return {
    /** Runs `frames` frames of `dt` ms each. */
    step(frames: number, dt = 1000 / 60) {
      for (let i = 0; i < frames; i += 1) {
        time += dt
        const due = [...queue]
        queue.clear()
        for (const [, callback] of due) callback(time)
      }
    },
    restore() {
      window.requestAnimationFrame = realRequest
      window.cancelAnimationFrame = realCancel
      performance.now = realNow
    },
  }
}
