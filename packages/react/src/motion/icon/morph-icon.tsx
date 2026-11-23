// SPDX-License-Identifier: MIT
// 改自 SmoothUI morph-icon（https://github.com/educlopez/smoothui ，MIT，© 2024 Eduardo Calvo）：图标的线条与形状在两个状态间补间（侧栏收展、列表 ↔ 网格、菜单 ↔ 叉、搜索放大、播放 ↔ 停止、勾选方块），
// 八个字形的几何照搬原件；描边宽度、时长作为 props，字形里的「勾」颜色用我们的底色 token。
import { motion } from 'motion/react'
import { cn } from '../../lib/cn.ts'

export const MORPH_ICON_VARIANTS = ['sidebar', 'list', 'grid', 'compact', 'menu', 'search', 'play', 'check'] as const

export type MorphIconVariant = (typeof MORPH_ICON_VARIANTS)[number]

const DEFAULT_SIZE = 16
const DEFAULT_STROKE_WIDTH = 2
const DEFAULT_DURATION = 0.3
// 原件的移动曲线（ease-in-out quint 一类，0.645 0.045 0.355 1）：路径与形状补间用时长 + 贝塞尔，不是弹簧，弹簧会让线条过冲出框。
const MOVEMENT_EASE: [number, number, number, number] = [0.645, 0.045, 0.355, 1]

type Transition = { duration: number; ease?: [number, number, number, number] }

const SidebarGlyph = ({ active, transition }: { active: boolean; transition: Transition }) => (
  <>
    <rect height="18" rx="2" width="18" x="3" y="3" />
    <motion.line
      initial={false}
      animate={{
        x1: active ? 15 : 9,
        x2: active ? 15 : 9,
        y1: 3,
        y2: 21,
      }}
      transition={transition}
    />
  </>
)

const ListGlyph = ({ active, transition }: { active: boolean; transition: Transition }) => (
  <>
    <motion.rect
      // 挂载时直接用目标值：不给初值时 motion 从 null 动 rx，浏览器报「rx: Expected length」。
      initial={false}
      animate={active ? { height: 14, rx: 1, y: 5 } : { height: 2, rx: 1, y: 11 }}
      transition={transition}
      width="2"
      x="2"
    />
    {[7, 12, 17].map((y) => (
      <motion.line
        initial={false}
        animate={{ x1: active ? 8 : 4, x2: 20, y1: y, y2: y }}
        key={y}
        transition={transition}
      />
    ))}
  </>
)

const GRID_CELLS = [
  { x: 4, y: 4 },
  { x: 13, y: 4 },
  { x: 4, y: 13 },
  { x: 13, y: 13 },
]

const GridGlyph = ({ active, transition }: { active: boolean; transition: Transition }) => (
  <>
    {GRID_CELLS.map((cell) => (
      <motion.rect
        initial={false}
        animate={
          active
            ? { height: 6, rx: 3, width: 6, x: cell.x + 0.5, y: cell.y + 0.5 }
            : { height: 7, rx: 1, width: 7, x: cell.x, y: cell.y }
        }
        key={`${cell.x}-${cell.y}`}
        transition={transition}
      />
    ))}
  </>
)

const COMPACT_SPREAD = [6, 12, 18]
const COMPACT_TIGHT = [9, 12, 15]

const CompactGlyph = ({ active, transition }: { active: boolean; transition: Transition }) => (
  <>
    {COMPACT_SPREAD.map((y, index) => (
      <motion.line
        initial={false}
        animate={{
          x1: 4,
          x2: 20,
          y1: active ? COMPACT_TIGHT[index] : y,
          y2: active ? COMPACT_TIGHT[index] : y,
        }}
        key={y}
        transition={transition}
      />
    ))}
  </>
)

const MenuGlyph = ({ active, transition }: { active: boolean; transition: Transition }) => (
  <>
    <motion.line
      initial={false}
      animate={active ? { x1: 6, x2: 18, y1: 6, y2: 18 } : { x1: 4, x2: 20, y1: 6, y2: 6 }}
      transition={transition}
    />
    <motion.line
      initial={false}
      animate={{ opacity: active ? 0 : 1, x1: 4, x2: 20, y1: 12, y2: 12 }}
      transition={transition}
    />
    <motion.line
      initial={false}
      animate={active ? { x1: 6, x2: 18, y1: 18, y2: 6 } : { x1: 4, x2: 20, y1: 18, y2: 18 }}
      transition={transition}
    />
  </>
)

const SearchGlyph = ({ active, transition }: { active: boolean; transition: Transition }) => (
  <>
    <motion.circle initial={false} animate={{ cx: 10, cy: 10, r: active ? 7 : 6 }} transition={transition} />
    <motion.line
      initial={false}
      animate={active ? { x1: 15, x2: 20.5, y1: 15, y2: 20.5 } : { x1: 14.5, x2: 19, y1: 14.5, y2: 19 }}
      transition={transition}
    />
  </>
)

const PLAY_PATH = 'M8,5 L8,19 L17,12 L17,12 Z'
const STOP_PATH = 'M7,7 L7,17 L17,17 L17,7 Z'

const PlayGlyph = ({ active, color, transition }: { active: boolean; color: string; transition: Transition }) => (
  <motion.path
    initial={false}
    animate={{ d: active ? STOP_PATH : PLAY_PATH }}
    fill={color}
    stroke="none"
    transition={transition}
  />
)

const CheckGlyph = ({ active, color, transition }: { active: boolean; color: string; transition: Transition }) => (
  <>
    <rect height="16" rx="4" width="16" x="4" y="4" />
    <motion.rect
      initial={false}
      animate={{ opacity: active ? 1 : 0 }}
      fill={color}
      height="16"
      rx="4"
      stroke="none"
      transition={transition}
      width="16"
      x="4"
      y="4"
    />
    <motion.path
      initial={false}
      animate={{
        opacity: active ? 1 : 0,
        pathLength: active ? 1 : 0,
      }}
      d="M7 12.5 L10.5 16 L17 8"
      stroke="var(--bg-000)"
      transition={transition}
    />
  </>
)

/**
 * 会变形的图标：active 为假是一个形状，为真是另一个形状，线条与路径补间过去（不是淡入淡出）。
 * 装饰用时 aria-hidden；单独成为内容时传 label（读屏名，没有可见文字的按钮上的图标，名字放在按钮上，不要传）。
 */
export function MorphIcon({
  variant,
  active = false,
  size = DEFAULT_SIZE,
  strokeWidth = DEFAULT_STROKE_WIDTH,
  color = 'currentColor',
  duration = DEFAULT_DURATION,
  label,
  className,
}: {
  /** Which glyph: sidebar, list, grid, compact, menu, search, play or check. */
  variant: MorphIconVariant
  /** false draws the first shape, true the second (menu to close, play to stop, list to grid). */
  active?: boolean
  /** Side length in px. */
  size?: number
  /** Line width in the 24 x 24 view box. */
  strokeWidth?: number
  /** Stroke color; any CSS color, defaults to the text color. */
  color?: string
  /** Seconds the shapes take to change. */
  duration?: number
  /** Accessible name; leave it out when the icon is decoration. */
  label?: string
  /** Extra class name on the svg. */
  className?: string
}) {
  const transition: Transition = { duration, ease: MOVEMENT_EASE }
  return (
    <svg
      data-slot="morph-icon"
      data-variant={variant}
      data-active={active ? '' : undefined}
      aria-hidden={label ? undefined : 'true'}
      className={cn('shrink-0', className)}
      fill="none"
      height={size}
      role={label ? 'img' : undefined}
      stroke={color}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={strokeWidth}
      viewBox="0 0 24 24"
      width={size}
    >
      {label ? <title>{label}</title> : null}
      {variant === 'sidebar' && <SidebarGlyph active={active} transition={transition} />}
      {variant === 'list' && <ListGlyph active={active} transition={transition} />}
      {variant === 'grid' && <GridGlyph active={active} transition={transition} />}
      {variant === 'compact' && <CompactGlyph active={active} transition={transition} />}
      {variant === 'menu' && <MenuGlyph active={active} transition={transition} />}
      {variant === 'search' && <SearchGlyph active={active} transition={transition} />}
      {variant === 'play' && <PlayGlyph active={active} color={color} transition={transition} />}
      {variant === 'check' && <CheckGlyph active={active} color={color} transition={transition} />}
    </svg>
  )
}
