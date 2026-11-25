// SPDX-License-Identifier: MIT
// 截图前等画面停下来。固定的 setTimeout 在自建机忙时不够，动画截在半路（#190：ai-reasoning、katana 的 animated-stepper / switchboard-card）。
// 再等有限时长的动画走完，然后等画框尺寸连续 5 帧不变（最多 3 秒）。
const frame = () => new Promise((r) => requestAnimationFrame(r))
export const steady = async () => {
  await Promise.all(
    document
      .getAnimations()
      .filter((animation) => animation.effect?.getComputedTiming().endTime !== Infinity)
      .map((animation) => animation.finished.catch(() => undefined)),
  )
  const node = document.querySelector<HTMLElement>('[data-testid="frame"]')
  if (!node) return
  const size = () => {
    const box = node.getBoundingClientRect()
    return `${box.width}x${box.height}`
  }
  let last = size()
  let same = 0
  const deadline = performance.now() + 3000
  while (same < 5 && performance.now() < deadline) {
    await frame()
    const next = size()
    same = next === last ? same + 1 : 0
    last = next
  }
}
