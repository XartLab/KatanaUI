// SPDX-License-Identifier: MIT
import { vi } from 'vite-plus/test'
/**
 * Helpers that make a component screenshot land on one deterministic frame, however busy the machine is.
 * 组件截图「停在确定的一帧」的工具：等有限动画与过渡走完、等条件成立、给靠 rAF 画的画布一个虚拟时钟。只给 *.browser.test.tsx 用，不进包。
 *
 * 原则（#219）：截图前不赌「等多久够」，而是等一个能观察到的终态；到不了终态的（无限循环、按时间画）就把时间钉住。
 */

// 在 frameClock 换掉 requestAnimationFrame / performance.now 之前先拿住原生的：等帧、算截止时间永远用原生的
// （katana 的测试还假了 Date，所以截止时间不能用 Date）。
const nativeFrame = window.requestAnimationFrame.bind(window)
const originalNow = performance.now
const nowIsOwn = Object.hasOwn(performance, 'now')
const realNow = originalNow.bind(performance)
const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))
// 页面被挤得喘不过气时 rAF 可能迟迟不来：100ms 兜底，整体另有截止时间。
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

const infinite = (animation: Animation) => animation.effect?.getComputedTiming().endTime === Infinity
const unfinished = (animation: Animation) =>
  !infinite(animation) && (animation.pending || animation.playState === 'running')
const nameOf = (animation: Animation) =>
  (animation as CSSAnimation).animationName ||
  (animation as CSSTransition).transitionProperty ||
  animation.id ||
  'unnamed animation'

/**
 * Waits until nothing is still moving or loading, then returns; throws (naming what is not done) if that takes longer than
 * `timeout` ms, so a shot is never taken of a half-finished picture and a hang is never anonymous.
 * Done means, for `frames` frames in a row: no finite animation or transition running, no Radix popper waiting for its position,
 * all fonts loaded, all images decoded.
 * 等到没有东西还在动、在载才返回；超过 timeout（默认 8s，低于截图的 10s）就抛错并点名是谁没完，绝不对着半成品截图。
 * `freezeInfinite` 另把无限循环的动画停在第 0 刻（只给打字光标用，它会停住页面里所有无限动画，别推广）。
 */
export async function settled({ frames = 3, freezeInfinite = false, timeout = 8000 } = {}) {
  await document.fonts.ready
  const deadline = realNow() + timeout
  const left = () => Math.max(0, deadline - realNow())
  let quiet = 0
  for (;;) {
    await nextFrame()
    const running = document.getAnimations().filter(unfinished)
    const loading = document.fonts.status !== 'loaded'
    const images = [...document.images].filter((image) => !image.complete)
    if (running.length === 0 && !loading && images.length === 0 && !positioning()) {
      quiet += 1
      if (quiet >= frames) break
      continue
    }
    quiet = 0
    if (left() === 0) {
      const waiting = [
        ...running.map(nameOf),
        ...(loading ? ['fonts loading'] : []),
        ...images.map((image) => `image ${image.src.slice(0, 40)}`),
        ...(positioning() ? ['radix popper not positioned'] : []),
      ]
      throw new Error(`settled: still not done after ${timeout}ms: ${waiting.join(', ')}`)
    }
    // 等有限动画走完（或截止时间到）；图片的 decode 同理。
    await Promise.race([
      Promise.all([
        ...running.map((animation) => animation.finished.catch(() => undefined)),
        ...images.map((image) => image.decode().catch(() => undefined)),
      ]),
      sleep(left()),
    ])
  }
  // 解码完再确认一遍已经 complete 的图（data URI 解码在下一帧才上屏）。
  await Promise.all([...document.images].map((image) => image.decode().catch(() => undefined)))
  if (freezeInfinite) {
    for (const animation of document.getAnimations()) {
      if (!infinite(animation)) continue
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

export type FrameClock = {
  /** Runs `frames` frames of `dt` ms each. */
  step: (frames: number, dt?: number) => void
  /** How many frame callbacks are waiting. */
  pending: () => number
  /** Steps until nothing is waiting any more (a finite draw-in has ended); gives up after `max` frames. */
  runToIdle: (max?: number) => void
}

/**
 * Runs `run` with a virtual clock for requestAnimationFrame and performance.now (canvas loops): the picture after a fixed number of
 * steps is the same on every run, and once `run` returns no frame ever fires again. The real clock is always put back, also when
 * `run` throws, so one failing test cannot freeze the ones after it.
 * 靠 requestAnimationFrame 与 performance.now 画的画布件：run 里走固定的帧数，画面每次都一样；run 结束不再有帧。
 * 真时钟放在 finally 里恢复，一个测试失败不会让同文件后面的测试一起停帧。
 */
export async function withFrameClock<T>(run: (clock: FrameClock) => Promise<T> | T): Promise<T> {
  const realRequest = window.requestAnimationFrame
  const realCancel = window.cancelAnimationFrame
  let time = 0
  let nextId = 0
  const queue = new Map<number, FrameRequestCallback>()
  const step: FrameClock['step'] = (frames, dt = 1000 / 60) => {
    for (let i = 0; i < frames; i += 1) {
      time += dt
      const due = [...queue]
      queue.clear()
      for (const [, callback] of due) callback(time)
    }
  }
  window.requestAnimationFrame = (callback) => {
    nextId += 1
    queue.set(nextId, callback)
    return nextId
  }
  window.cancelAnimationFrame = (id) => {
    queue.delete(id)
  }
  performance.now = () => time
  try {
    return await run({
      step,
      pending: () => queue.size,
      runToIdle: (max = 600) => {
        for (let i = 0; i < max && queue.size > 0; i += 1) step(1)
      },
    })
  } finally {
    window.requestAnimationFrame = realRequest
    window.cancelAnimationFrame = realCancel
    // performance.now 原本在原型上：给实例赋值会留下一个自有属性，删掉才算还原。
    if (nowIsOwn) performance.now = originalNow
    else delete (performance as { now?: unknown }).now
  }
}

/**
 * Runs `run` with a fake setInterval / clearInterval (and Date held at `now`), `advance(ms)` fires the intervals that many ms; after
 * `run` returns the intervals registered inside it are dead, so the picture stays where `advance` left it. Afterwards (also when `run`
 * throws) only Date is faked again, which is what the rest of the file expects.
 * 假 setInterval（Date 钉在 now）：run 里 advance(ms) 让间隔触发；run 结束后登记过的间隔作废，画面停在 advance 停下的那一步。
 * 结束（含抛错）后换回「只假 Date」，同文件后面的测试照常。
 */
export async function withFakeIntervals<T>(
  now: Date,
  run: (advance: (ms: number) => void) => Promise<T> | T,
): Promise<T> {
  vi.useFakeTimers({ toFake: ['Date', 'setInterval', 'clearInterval'] })
  vi.setSystemTime(now)
  try {
    return await run((ms) => {
      vi.advanceTimersByTime(ms)
    })
  } finally {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(now)
  }
}
