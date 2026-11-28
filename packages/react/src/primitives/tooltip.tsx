// SPDX-License-Identifier: MIT
// 起步代码取自 shadcn/ui（https://ui.shadcn.com ，MIT，Copyright (c) 2023 shadcn），2026-11-11 用 `shadcn add` 生成（#1777），行为底座是 Radix；
// 拷进来以后归我们改：样子（尺寸、颜色、动效）按 OpenMarket 实测样式与我们的 token 重写（决策记录 0049）。
import {
  Tooltip as TooltipRoot,
  TooltipContent as TooltipPanel,
  TooltipTrigger as TooltipButton,
} from '@ui-sdk/react/tooltip'
import { createContext, useContext, type ComponentProps, type ReactNode } from 'react'
import { cn } from '../lib/cn.ts'
import { childrenOf, partRender, slotOf } from '../lib/radix-compat.tsx'

// 提示：照 OpenMarket q-tooltip。6px 8px 内边 · 圆角 6 · 最深底 + 细边 · 0 2 10 阴影；没有小箭头。
// 内容里有快捷键键帽（.k-kbd）时压成浅色块：照 OpenMarket 提示里的 kbd。
// 提示的外观类单独导出一份：应用里有不经过 React 的地方（图表的 Vega 悬停提示）要画同样的框。
// 悬停时间在这里统一（#251 批 A，kubai Vibe Design Tips 025「悬停时间」）：停 500ms 才出，扫过一排按钮不弹；
// 出了以后 400ms 内移到邻居立即出、原地换字；按下触发器就收。件里（Toolbar、DecimalField 等）不再自带常量。
// 旧版默认延迟 0（注释写「等 700ms 反而像卡了」）：Toolbar / DecimalField 又各写 500 加 skip 0，三套手感不一，扫过工具条一路弹或一闪一闪，所以改成一条规则。
// 悬停卡（hover-card.tsx）是另一回事，维持 700 / 300；触屏没有悬停，不做方案（桌面工作台）。
const tooltipContentClass = [
  'k-text-data z-60 inline-flex items-center gap-2 rounded-[var(--radius-control)] border border-(color:--k-separable-tertiary-borderColor) bg-(--k-surface-sunken-background) px-2 py-1.5 leading-[1.3] font-normal text-(color:--k-content-body-foreground)',
  'shadow-(--k-overlay-tooltip-shadow)',
  '[&_.k-kbd]:border-transparent [&_.k-kbd]:bg-(--k-content-primary-foreground) [&_.k-kbd]:font-semibold [&_.k-kbd]:text-(color:--k-surface-sunken-background)',
].join(' ')

// 行为底座是 UI SDK 的 Tooltip（#263 从 Radix 换来）：邻居之间的「立即出」它自己记（全局，不要 Provider），所以 TooltipProvider 只剩「给里面的提示定默认延迟」，
// skipDelayDuration 保留这个名字但不再起作用（UI SDK 的预热时长是它自己定的）。
const InsideProvider = createContext(false)
const DelayContext = createContext<number>(500)

/** 首个提示停多久才出（毫秒）。出处：kubai Vibe Design Tips 025；与 TradingView 工具栏一致（#720）。 */
const TOOLTIP_DELAY_MS = 500
/** 提示出过以后，多久内移到邻居立即出（毫秒，Radix 的 skipDelayDuration）。出处：kubai Vibe Design Tips 025；UI SDK 自己管这段，这个常量只留作文档。 */
const TOOLTIP_SKIP_MS = 400

function TooltipProvider({
  delayDuration = TOOLTIP_DELAY_MS,
  children,
}: {
  /** Milliseconds the pointer rests before a tooltip inside opens. */
  delayDuration?: number
  /** Kept for compatibility; UI SDK decides how long the next tooltip opens at once. */
  skipDelayDuration?: number
  /** The content. */
  children?: ReactNode
}) {
  return (
    <InsideProvider.Provider value>
      <DelayContext value={delayDuration}>{children}</DelayContext>
    </InsideProvider.Provider>
  )
}

/** 已经在 TooltipProvider 里就直接用外层那个；不在就自己包一层。给「一排按钮可能共用、也可能单独用」的件。 */
function EnsureTooltipProvider({ children }: { children: ReactNode }) {
  return useContext(InsideProvider) ? children : <TooltipProvider>{children}</TooltipProvider>
}

/** 现在这个位置上生效的悬停延迟（毫秒）：外层 TooltipProvider 给的，没有就是默认。 */
export const useTooltipDelay = () => useContext(DelayContext)

function Tooltip({
  delayDuration,
  disableHoverableContent: _ignored,
  ...props
}: Omit<ComponentProps<typeof TooltipRoot>, 'delay'> & {
  /** Kept for compatibility; a UI SDK tooltip never takes the pointer. */
  disableHoverableContent?: boolean
  /** Milliseconds the pointer rests before it opens; the provider's value by default. */
  delayDuration?: number
}) {
  const inherited = useTooltipDelay()
  return <TooltipRoot delay={delayDuration ?? inherited} {...props} />
}

function TooltipTrigger({
  asChild,
  children,
  ...props
}: Omit<ComponentProps<typeof TooltipButton>, 'render' | 'children'> & {
  /** Merge the trigger's props onto its only child. */
  asChild?: boolean
  /** The content. */
  children?: ReactNode
}) {
  return (
    <TooltipButton render={partRender(slotOf(props, 'tooltip-trigger'), 'button', asChild, children)} {...props}>
      {childrenOf(asChild, children)}
    </TooltipButton>
  )
}

function TooltipContent({
  className,
  sideOffset = 8,
  children,
  ...props
}: Omit<ComponentProps<typeof TooltipPanel>, 'render'>) {
  return (
    <TooltipPanel
      sideOffset={sideOffset}
      // 离视口边的最小距离：UI SDK 默认 8，迁移前的截图里提示贴边时离边 12（逐像素对过，#269）。
      collisionPadding={12}
      render={partRender(slotOf(props, 'tooltip-content'), 'div')}
      className={cn(tooltipContentClass, 'pointer-events-none', className)}
      {...props}
    >
      {children}
    </TooltipPanel>
  )
}

export {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
  EnsureTooltipProvider,
  tooltipContentClass,
  TOOLTIP_DELAY_MS,
  TOOLTIP_SKIP_MS,
}
