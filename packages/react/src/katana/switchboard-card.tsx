// SPDX-License-Identifier: MIT
// 改自 SmoothUI switchboard-card（https://github.com/educlopez/smoothui ，MIT，© 2024 Eduardo Calvo）
// 灯板卡片：一块小灯阵加标题与说明。灯可以按给定图案常亮（写出一个字、一个形状），也可以按种子随机明灭，像交换机面板。
// 拿来做「市场活跃度」「在线品种数」这类有点装饰意味的总览卡：lit 传矩阵就按数据点亮，random 就自己闪。
// 与原件的差别：① 随机不再用 Math.random，改成带种子的线性同余（seed），同一个种子同一串，截图与测试可复现；② 原件的 Next.js 变体与 href 去掉，
// 可点的用 onClick（整卡是按钮）；③ 灯色用 --accent、灭灯用 --ink-400，不用 Tailwind 色名；④ 随机的节拍可暂停（paused），文档站接「实时 / 暂停」。
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { cn } from '../lib/cn.ts'
import { focusRing } from '../lib/focus.ts'

export type SwitchboardLight = 'off' | 'medium' | 'high'

// 随机节拍：每 200ms 一步，每步让约 20% 的灯推进一档（灭 → 中 → 亮 → 灭）；来自 SmoothUI switchboard-card。
const TICK_MS = 200
const ANIMATED_SHARE = 0.2
// 灯的大小（像素）：灭 1，中 1，亮 2；这里放大一档，方便看清。
const LIGHT = { off: 2, medium: 2, high: 3 } as const

function lcg(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (Math.imul(state, 1_664_525) + 1_013_904_223) >>> 0
    return state / 2 ** 32
  }
}

/** 把 0/1 图案（一维或二维）转成亮灯的序号。 */
export function litIndexes(
  lit: readonly number[] | readonly (readonly number[])[],
  columns: number,
  rows: number,
): number[] {
  const out: number[] = []
  if (Array.isArray(lit[0])) {
    const grid = lit as readonly (readonly number[])[]
    for (let r = 0; r < Math.min(grid.length, rows); r += 1)
      for (let c = 0; c < Math.min(grid[r]!.length, columns); c += 1) if (grid[r]![c] === 1) out.push(r * columns + c)
    return out
  }
  const flat = lit as readonly number[]
  for (let i = 0; i < Math.min(flat.length, columns * rows); i += 1) if (flat[i] === 1) out.push(i)
  return out
}

export type SwitchboardCardProps = {
  /** Heading of the card; also its accessible name when it is a button. */
  title: string
  /** One line under the heading. */
  subtitle?: ReactNode
  /** Lights per row. */
  columns?: number
  /** Number of rows of lights. */
  rows?: number
  /** Lights that stay on: a flat array of columns × rows or a matrix of rows, 1 is on. */
  lit?: readonly number[] | readonly (readonly number[])[]
  /** Let lights come and go by themselves instead (ignored when lit is given). */
  random?: boolean
  /** Seed of the random lights; the same seed gives the same sequence. */
  seed?: number
  /** Freeze the random lights where they are. */
  paused?: boolean
  /** Makes the whole card a button. */
  onClick?: () => void
  /** Extra class name on the card. */
  className?: string
}

export function SwitchboardCard({
  title,
  subtitle,
  columns = 18,
  rows = 5,
  lit,
  random = false,
  seed = 1,
  paused = false,
  onClick,
  className,
}: SwitchboardCardProps) {
  const total = columns * rows
  const wandering = random && !lit
  const fixed = useMemo(() => (lit ? litIndexes(lit, columns, rows) : []), [lit, columns, rows])
  const [lights, setLights] = useState<SwitchboardLight[]>(() => {
    const start: SwitchboardLight[] = Array.from({ length: total }, () => 'off')
    for (const index of fixed) start[index] = 'high'
    return start
  })
  const [rng] = useState(() => lcg(seed))
  // 固定图案变了就重画。
  const [shownFixed, setShownFixed] = useState(fixed)
  if (shownFixed !== fixed || lights.length !== total) {
    setShownFixed(fixed)
    const next: SwitchboardLight[] = Array.from({ length: total }, () => 'off')
    if (!wandering) for (const index of fixed) next[index] = 'high'
    setLights(next)
  }
  useEffect(() => {
    if (!wandering || paused) return
    const timer = setInterval(() => {
      setLights((previous) => {
        const next = [...previous]
        const count = Math.floor(total * ANIMATED_SHARE)
        for (let i = 0; i < count; i += 1) {
          const index = Math.floor(rng() * total)
          // 灭 → 中（过渡）→ 亮 → 灭（亮直接灭，不经过中）。
          next[index] = previous[index] === 'off' ? 'medium' : previous[index] === 'medium' ? 'high' : 'off'
        }
        return next
      })
    }, TICK_MS)
    return () => clearInterval(timer)
  }, [wandering, paused, total, rng])
  const body = (
    <div
      data-slot="switchboard-card"
      className={cn(
        'flex w-full flex-col gap-(--space-4) overflow-hidden rounded-[var(--radius-control)] border border-line bg-surface-1 p-(--space-5) text-left',
        className,
      )}
    >
      <div
        data-slot="switchboard-card-lights"
        className="grid items-center justify-items-center"
        style={{
          gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${rows}, 1fr)`,
          rowGap: 6,
        }}
      >
        {lights.map((state, index) => (
          <span
            key={index}
            data-state={state}
            className="rounded-full transition-[opacity,transform,background-color,box-shadow] duration-200 ease-out"
            style={{
              width: LIGHT[state],
              height: LIGHT[state],
              backgroundColor: state === 'off' ? 'var(--ink-400)' : 'var(--accent)',
              opacity: state === 'off' ? 0.5 : 1,
              boxShadow:
                state === 'medium'
                  ? '0 0 2px 1px color-mix(in srgb, var(--accent) 40%, transparent)'
                  : state === 'high'
                    ? '0 0 2px 1px color-mix(in srgb, var(--accent) 60%, transparent), 0 0 6px 2px color-mix(in srgb, var(--accent) 25%, transparent)'
                    : undefined,
            }}
          />
        ))}
      </div>
      <div className="flex flex-col gap-(--space-1)">
        <h3 data-title="true" className="k-text-title m-0 text-ink">
          {title}
        </h3>
        {subtitle && (
          <p data-subtitle="true" className="k-text-caption m-0 text-ink-3">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  )
  if (!onClick) return body
  return (
    <button
      type="button"
      aria-label={title}
      onClick={onClick}
      className={cn('block w-full cursor-pointer border-0 bg-transparent p-0', focusRing)}
    >
      {body}
    </button>
  )
}
