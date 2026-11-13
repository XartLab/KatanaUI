// SPDX-License-Identifier: AGPL-3.0-only
// 主题选择：每个主题一张缩略预览（一块迷你的控制台：侧栏、顶栏、面板、图表线），选中的那张加一圈环，环在选项之间用弹簧滑过去。
// 用于设置里切 Console / Graphite。交互学自 rare-ui 的 theme-selector（2026-11-14 读），实现为本仓库原创，未复制其代码。
// 学到的事实（只取行为）：① 整组是 radiogroup，每张缩略是一个 radio，tab 只停在选中那张（没有选中的时停在第一张）；
// ② 方向键移动的同时就选中（不是只移焦点），Home / End 到头尾，到头循环；③ 悬停时没选中的那张画一圈淡环，选中的环更深；
// ④ 缩略里的颜色是传进来的调色板，不读当前主题，所以能同时预览别的主题；⑤ 名字可以隐藏（只剩缩略，读屏名还在）；⑥ 整组可禁用。
// 我们的画法：缩略画成 SVG（随宽度等比缩放），环用 motion 的 layoutId 在选项之间滑，弹簧取包里的 snappy。
import { motion } from 'motion/react'
import { useId, useRef, useState, type KeyboardEvent } from 'react'
import { cn } from '../lib/cn'
import { focusRing } from '../lib/focus'
import { snappy } from '../lib/motion'

/** 缩略里用到的六个颜色（任何 CSS 颜色写法）。 */
export type ThemePalette = {
  /** 整块的底，也是侧栏的底。 */
  rail: string
  /** 面板的底。 */
  panel: string
  /** 面板的描边。 */
  line: string
  /** 最亮的内容色：标题条、强调。 */
  strong: string
  /** 次要的内容色：文字条、点。 */
  muted: string
  /** 卡片的底。 */
  tile: string
}

export type ThemeOption = {
  value: string
  /** 名字（调用方按界面语言给）：读屏名，也是缩略下面的字。 */
  label: string
  colors: ThemePalette
}

export type ThemeSelectorProps = {
  themes: readonly ThemeOption[]
  value?: string | null
  defaultValue?: string
  onChange?: (value: string) => void
  /** 整组的读屏名（必填）。 */
  label: string
  /** 缩略下面是否写名字。 */
  showLabels?: boolean
  disabled?: boolean
  className?: string
}

/** 方向键与 Home / End 之后该选中第几个；不是这几个键返回 null。到头循环。 */
export function nextThemeIndex(key: string, index: number, count: number): number | null {
  if (count <= 0) return null
  if (key === 'Home') return 0
  if (key === 'End') return count - 1
  if (key === 'ArrowRight' || key === 'ArrowDown') return (index + 1) % count
  if (key === 'ArrowLeft' || key === 'ArrowUp') return (index - 1 + count) % count
  return null
}

function Preview({ colors }: { colors: ThemePalette }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 160 120" className="block size-full" data-slot="theme-selector-preview">
      <rect width={160} height={120} fill={colors.rail} />
      {[0, 1, 2].map((dot) => (
        <circle key={dot} cx={10 + dot * 7} cy={9} r={2} fill={colors.muted} />
      ))}
      <rect x={6} y={22} width={30} height={9} rx={3} fill={colors.muted} />
      <rect x={10} y={25} width={14} height={3} rx={1.5} fill={colors.strong} />
      <rect x={10} y={37} width={20} height={3} rx={1.5} fill={colors.muted} />
      <rect x={10} y={47} width={16} height={3} rx={1.5} fill={colors.muted} />
      <rect x={44} y={14} width={130} height={120} rx={8} fill={colors.panel} stroke={colors.line} strokeWidth={1} />
      <rect x={54} y={24} width={26} height={4} rx={2} fill={colors.strong} />
      <rect x={54} y={33} width={46} height={3} rx={1.5} fill={colors.muted} />
      {[0, 1, 2].map((tile) => (
        <rect
          key={tile}
          x={54 + tile * 34}
          y={46}
          width={30}
          height={20}
          rx={4}
          fill={colors.tile}
          stroke={colors.line}
        />
      ))}
      <rect x={54} y={72} width={98} height={34} rx={4} fill={colors.tile} stroke={colors.line} />
      <path
        d="M60 98 L72 90 L82 94 L96 82 L108 86 L122 78 L136 80 L146 76"
        fill="none"
        stroke={colors.strong}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function ThemeSelector({
  themes,
  value,
  defaultValue,
  onChange,
  label,
  showLabels = true,
  disabled,
  className,
}: ThemeSelectorProps) {
  const ringId = useId()
  const [inner, setInner] = useState(defaultValue ?? themes[0]?.value)
  const items = useRef<(HTMLButtonElement | null)[]>([])
  // value 为 null：受控、什么都没选（主题还没读到）；undefined：不受控。
  const selected = value === undefined ? inner : value
  const selectedIndex = themes.findIndex((theme) => theme.value === selected)

  const select = (next: string) => {
    if (next === selected) return
    if (value === undefined) setInner(next)
    onChange?.(next)
  }
  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const target = nextThemeIndex(event.key, index, themes.length)
    if (target === null) return
    event.preventDefault()
    items.current[target]?.focus()
    select(themes[target]!.value)
  }

  return (
    <div
      role="radiogroup"
      aria-label={label}
      aria-disabled={disabled || undefined}
      data-slot="theme-selector"
      className={cn('flex min-w-0 gap-4', disabled && 'pointer-events-none opacity-45', className)}
    >
      {themes.map((theme, index) => {
        const active = theme.value === selected
        return (
          <div key={theme.value} data-slot="theme-selector-option" className="flex min-w-0 flex-col items-center gap-2">
            <button
              ref={(node) => {
                items.current[index] = node
              }}
              type="button"
              role="radio"
              aria-checked={active}
              aria-label={theme.label}
              tabIndex={(selectedIndex === -1 ? index === 0 : active) ? 0 : -1}
              disabled={disabled}
              data-slot="theme-selector-item"
              data-state={active ? 'checked' : 'unchecked'}
              onClick={() => select(theme.value)}
              onKeyDown={(event) => onKeyDown(event, index)}
              className={cn(
                'group relative block aspect-[4/3] w-36 max-w-full cursor-pointer rounded-[var(--radius-overlay)]',
                'border border-line bg-surface-2 transition-colors duration-[120ms] hover:border-ink-4',
                focusRing,
              )}
            >
              <span className="absolute inset-0 overflow-hidden rounded-[inherit]">
                <Preview colors={theme.colors} />
              </span>
              {active ? (
                <motion.span
                  layoutId={ringId}
                  data-slot="theme-selector-ring"
                  transition={snappy}
                  className="pointer-events-none absolute -inset-[4px] rounded-[calc(var(--radius-overlay)+3px)] border-2 border-brand"
                />
              ) : null}
            </button>
            {showLabels ? (
              <span
                aria-hidden="true"
                data-slot="theme-selector-label"
                className={cn('k-text-caption transition-colors duration-[120ms]', active ? 'text-ink' : 'text-ink-3')}
              >
                {theme.label}
              </span>
            ) : null}
          </div>
        )
      })}
    </div>
  )
}
