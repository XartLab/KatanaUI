// SPDX-License-Identifier: AGPL-3.0-only
import { useState, type CSSProperties } from 'react'
// 搬自 src/ui（#1860），皮肤在 ../theme/rolling-text.css。
// #1861 升级成里程表式：变了的那一位不再只是旧字滑出、新字滑入，而是像里程表一样把中间的数字依次转过去（7 到 9 会看到 8 一闪而过），
// 位数没变的地方原样不动。学自 rare-ui 的 animated-counter（2026-11-14 读），实现为本仓库原创，未复制其代码。
// 学到的事实（只取行为）：① 每一位是 0 到 9 的一条转轮，涨往上转、跌往下转，转过的是中间的数字，不是直接换；② 9 转回 0 要走一格而不是倒转九格；
// ③ 读屏与复制拿到的只有当前的完整数字，转轮里的字不进文本；④ 位上用弹簧缓动，转得越远用得越久。
// 我们保留的（来自 OpenMarket 图例的价格滚动，2026-10-06 读自其图表引擎）：整串数字同时闪 150ms 涨色或跌色；距上一次滚动不到 1 秒的变化直接换字不滚
// （行情密的时候不晃眼）；animate 为 false（十字线在看历史）时也直接换；位数变了直接换。
// 做法：旧字与中间的数字画在伪元素里（data-strip，一行一个字），不进文本；新字在位上自己从远处滑回来。弹簧用 CSS 的 linear() 缓动（--ease-snappy）。

const ROLL_QUIET_MS = 1000
const NEWLINE = String.fromCharCode(10)

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

/**
 * 一位从旧字转到新字时转轮上要经过的字：涨是 旧、旧+1 ……新-1（往上转），跌是 旧、旧-1 ……新+1（往下转，列表给「从上到下」的次序，旧字在最下）。
 * steps 是要走的格数，也是 strip 里的行数。不是数字的位（逗号、小数点换了别的符号）只走一格、只有旧字。
 */
export function rollStrip(char: string, out: string, direction: 'up' | 'down'): { strip: string; steps: number } {
  const to = Number(char)
  const from = Number(out)
  if (!/^\d$/.test(char) || !/^\d$/.test(out) || to === from) return { strip: out, steps: 1 }
  const steps = direction === 'up' ? (to - from + 10) % 10 : (from - to + 10) % 10
  const passed = Array.from({ length: steps }, (_, index) =>
    String((from + (direction === 'up' ? index : -index) + 10) % 10),
  )
  return { strip: (direction === 'up' ? passed : passed.reverse()).join(NEWLINE), steps }
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
      {rollSlots(text, from, direction !== null).map(({ char, out }, index) => {
        // 旧字与转轮上经过的字放在 data-from、data-strip 里，由 CSS 的 ::before 画：它们不在文本里，innerText、复制、读屏读到的只有当前的完整数字。
        const wheel = out === undefined || direction === null ? null : rollStrip(char, out, direction)
        return (
          <span
            className="k-roll-slot"
            data-from={out}
            data-strip={wheel?.strip}
            style={wheel ? ({ '--roll-steps': wheel.steps } as CSSProperties) : undefined}
            key={index}
          >
            <span className={out === undefined ? undefined : 'k-roll-in'}>{char}</span>
          </span>
        )
      })}
    </span>
  )
}
