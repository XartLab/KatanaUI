// SPDX-License-Identifier: MIT
import { useState, type CSSProperties } from 'react'
import { LIVE_FLASH_GAP_MS, useValueFlash } from '../lib/live.ts'
// 搬自 src/ui（#1860），皮肤在 ../theme/rolling-text.css。
// #1861 升级成里程表式：变了的那一位不再只是旧字滑出、新字滑入，而是像里程表一样把中间的数字依次转过去（7 到 9 会看到 8 一闪而过），
// 位数没变的地方原样不动。学自 rare-ui 的 animated-counter（2026-11-14 读），实现为本仓库原创，未复制其代码。
// 学到的事实（只取行为）：① 每一位是 0 到 9 的一条转轮，涨往上转、跌往下转，转过的是中间的数字，不是直接换；② 9 转回 0 要走一格而不是倒转九格；
// ③ 读屏与复制拿到的只有当前的完整数字，转轮里的字不进文本；④ 位上用弹簧缓动，转得越远用得越久。
// 我们保留的（来自 OpenMarket 图例的价格滚动，2026-10-06 读自其图表引擎）：整串数字同时闪一下涨色或跌色（现在走共用层 lib/live.ts 的 useValueFlash，时长 --dur-flash）；距上一次滚动不到 1 秒的变化直接换字不滚
// （行情密的时候不晃眼）；animate 为 false（十字线在看历史）时也直接换；位数变了直接换。
// 并入 SmoothUI 三件（2026-11-17 读，MIT，© 2024 Eduardo Calvo；https://github.com/educlopez/smoothui ）的做法，新能力都是可选 prop，默认行为不变：
// price-flow → stagger：变了的位从个位起一位一位错开起转，不是同时转；number-flow → boxed：每一位一格带边的小窗，像计数器；
// digit-roll → resize：位数变了（999 到 1,000）不再直接换，变了的位淡入并带一点滑动，原件在 AnimatePresence 里对增删的位做同样的事。
// 做法：旧字与中间的数字画在伪元素里（data-strip，一行一个字），不进文本；新字在位上自己从远处滑回来。弹簧用 CSS 的 linear() 缓动（--ease-snappy）。

const ROLL_QUIET_MS = LIVE_FLASH_GAP_MS
const NEWLINE = String.fromCharCode(10)

type Roll = {
  text: string
  value: number
  from: string
  direction: 'up' | 'down' | null
  generation: number
  rolledAt: number
  /** 位数变了、按 resize 淡入（不是转轮）。 */
  resized: boolean
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
export function rollStrip(
  char: string,
  out: string,
  direction: 'up' | 'down',
  ramp = 0,
): { strip: string; steps: number } {
  const to = Number(char)
  const from = Number(out)
  if (!/^\d$/.test(char) || !/^\d$/.test(out)) {
    // 字母位（如品种代码 AAPL 换成 TSLA）：旧字之后再经过 ramp 个字，像分页翻牌；经过的字由两个字的码点推出来，同样的换法永远同一串。
    // 学自 SmoothUI rolling-text（2026-11-17 读，MIT）：在转轮上先转过几个字再落到目标字；它用随机字，我们用确定的，渲染保持纯。
    if (ramp <= 0 || char === out || !/^[\p{L}\p{N}]$/u.test(char) || !/^[\p{L}\p{N}]$/u.test(out))
      return { strip: out, steps: 1 }
    const base = (char.codePointAt(0) ?? 0) + (out.codePointAt(0) ?? 0)
    const pool = /\d/.test(char) || /\d/.test(out) ? '0123456789' : 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    const mid = Array.from({ length: ramp }, (_, index) => pool[(base + index * 7) % pool.length]!)
    const passed = [out, ...mid]
    return { strip: (direction === 'up' ? passed : passed.reverse()).join(NEWLINE), steps: passed.length }
  }
  if (to === from) return { strip: out, steps: 1 }
  const steps = direction === 'up' ? (to - from + 10) % 10 : (from - to + 10) % 10
  const passed = Array.from({ length: steps }, (_, index) =>
    String((from + (direction === 'up' ? index : -index) + 10) % 10),
  )
  return { strip: (direction === 'up' ? passed : passed.reverse()).join(NEWLINE), steps }
}

function slotStyle(steps: number | undefined, delay: number): CSSProperties | undefined {
  if (steps === undefined && delay === 0) return undefined
  return {
    ...(steps === undefined ? null : { '--roll-steps': steps }),
    ...(delay === 0 ? null : { '--roll-delay': `${delay}ms` }),
  } as CSSProperties
}

export function RollingText({
  text,
  value,
  animate,
  ramp = 0,
  stagger = 0,
  boxed = false,
  resize = false,
}: {
  /** The whole string to show, including thousands separators and the decimal point. */
  text: string
  /** The same number as a value, used to decide the direction of the change. */
  value: number
  /** When false the text is replaced without rolling. */
  animate: boolean
  /** How many intermediate characters a changed non-digit slot (a letter in a ticker code) rolls through before landing; 0 swaps it directly. */
  ramp?: number
  /** Milliseconds between changed digits, starting from the last one; 0 rolls them all together. */
  stagger?: number
  /** Draws every character in its own small bordered cell, like a counter. */
  boxed?: boolean
  /** When the number of characters changes (999 to 1,000) fade the changed characters in instead of swapping them. */
  resize?: boolean
}) {
  const [roll, setRoll] = useState<Roll>({
    text,
    value,
    from: text,
    direction: null,
    generation: 0,
    rolledAt: -Infinity,
    resized: false,
  })
  // 闪色走共用层：方向与 key 由它给，滚不滚（位数、animate、1 秒内不重复）仍由下面的 roll 管，两边的 1 秒窗口是同一个常量。
  const flash = useValueFlash(value, { enabled: animate })
  if (text !== roll.text) {
    // 由 props 推导的状态，照 React 文档在渲染时调整（不走 effect，避免先闪一帧旧字）。
    // 节流要看真实时间（距上一次滚动够不够 1 秒）。渲染被丢弃重来时最多多滚或少滚一次，看不出来。
    // oxlint-disable-next-line react/purity
    const now = performance.now()
    const quiet = animate && now - roll.rolledAt >= ROLL_QUIET_MS
    const sameLength = text.length === roll.text.length
    const rolls = quiet && sameLength
    const resized = quiet && resize && !sameLength
    setRoll({
      text,
      value,
      from: roll.text,
      direction: rolls || resized ? (value >= roll.value ? 'up' : 'down') : null,
      generation: roll.generation + 1,
      rolledAt: rolls || resized ? now : roll.rolledAt,
      resized,
    })
  }
  const { from, direction, generation, resized } = roll
  const slots = rollSlots(text, from, direction !== null && !resized)
  // 错开起转：变了的位里，离右端越近越先转（个位先动），第 n 个晚 n × stagger 毫秒。
  const changed = slots.map(({ char, out }, index) => (resized ? from[index] !== char : out !== undefined))
  const rankFromRight = (index: number) => changed.slice(index + 1).filter(Boolean).length
  // 每次变化换一个 key，滚动与闪色的 CSS 动画从头播。
  return (
    <span
      className="k-roll k-live-flash"
      data-direction={direction ?? undefined}
      data-boxed={boxed ? '' : undefined}
      data-flash={direction === null ? undefined : (flash.flash ?? undefined)}
      key={generation}
    >
      {slots.map(({ char, out }, index) => {
        // 旧字与转轮上经过的字放在 data-from、data-strip 里，由 CSS 的 ::before 画：它们不在文本里，innerText、复制、读屏读到的只有当前的完整数字。
        const wheel = out === undefined || direction === null ? null : rollStrip(char, out, direction, ramp)
        return (
          <span
            className="k-roll-slot"
            data-from={out}
            data-strip={wheel?.strip}
            style={slotStyle(wheel?.steps, changed[index] && stagger > 0 ? rankFromRight(index) * stagger : 0)}
            key={index}
          >
            <span className={resized && changed[index] ? 'k-roll-fade' : out === undefined ? undefined : 'k-roll-in'}>
              {char}
            </span>
          </span>
        )
      })}
    </span>
  )
}
