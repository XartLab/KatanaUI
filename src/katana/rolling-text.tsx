// SPDX-License-Identifier: AGPL-3.0-only
import { useState } from 'react'
// 搬自 src/ui（#1860）：样子与行为没改，皮肤在 ../theme/rolling-text.css。

// 数字逐位滚动，照 OpenMarket 图例的价格滚动（2026-10-06 读自其图表引擎）：
// 变了的那几位旧字滚出（画在伪元素里，不进文本）、新字滚入，120ms ease-out，涨往上滚、跌往下滚；同时整串数字闪 150ms 涨色或跌色。
// 距上一次滚动不到 1 秒的变化直接换字不滚（行情密的时候不晃眼）；animate 为 false（十字线在看历史）时也直接换。

const ROLL_QUIET_MS = 1000

type Roll = {
  text: string
  value: number
  from: string
  direction: 'up' | 'down' | null
  generation: number
  rolledAt: number
}

/** 每一位的当前字，和滚出去的旧字（没变的位没有）：旧字只给 CSS 画，不进文本。 */
export function rollSlots(text: string, from: string, rolling: boolean): { char: string; out?: string }[] {
  return Array.from(text).map((char, index) =>
    rolling && from[index] !== char ? { char, out: from[index] } : { char },
  )
}

export function RollingText({ text, value, animate }: { text: string; value: number; animate: boolean }) {
  const [roll, setRoll] = useState<Roll>({
    text,
    value,
    from: text,
    direction: null,
    generation: 0,
    rolledAt: -Infinity,
  })
  if (text !== roll.text) {
    // 由 props 推导的状态，照 React 文档在渲染时调整（不走 effect，避免先闪一帧旧字）。
    // 节流要看真实时间（距上一次滚动够不够 1 秒）。渲染被丢弃重来时最多多滚或少滚一次，看不出来。
    // oxlint-disable-next-line react/purity
    const now = performance.now()
    const rolls = animate && text.length === roll.text.length && now - roll.rolledAt >= ROLL_QUIET_MS
    setRoll({
      text,
      value,
      from: roll.text,
      direction: rolls ? (value >= roll.value ? 'up' : 'down') : null,
      generation: roll.generation + 1,
      rolledAt: rolls ? now : roll.rolledAt,
    })
  }
  const { from, direction, generation } = roll
  // 每次变化换一个 key，滚动与闪色的 CSS 动画从头播。
  return (
    <span className="k-roll" data-direction={direction ?? undefined} key={generation}>
      {rollSlots(text, from, direction !== null).map(({ char, out }, index) => (
        // 滚出去的旧字放在 data-from 里、由 CSS 的 ::before 画：它不在文本里，innerText、复制、读屏读到的只有当前的完整数字。
        <span className="k-roll-slot" data-from={out} key={index}>
          <span className={out === undefined ? undefined : 'k-roll-in'}>{char}</span>
        </span>
      ))}
    </span>
  )
}
