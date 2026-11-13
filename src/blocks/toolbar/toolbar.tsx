// SPDX-License-Identifier: MIT
import { useRef, type ComponentProps, type ReactElement, type ReactNode, type Ref } from 'react'
import { cn } from '../../lib/cn'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../primitives/tooltip'
import { useRovingToolbar } from './use-roving-toolbar'

// 面板头的工具条零件（#1869，原应用 panels/kit/PanelToolbar 的展示部分）：一条 role=toolbar 的容器（整条只占一个 Tab 站，← → Home End 在项间移动，
// 见 use-roving-toolbar）、左右两组、每个工具一个槽、图标或文字按钮。哪些工具放得下、收进「»」是宿主的事（要读 PanelContext 与量宽度），不在这里。
// 照 ATAS X 图表头：左组（品种、周期、绘图……）+ 右组（比例、截图、设置……）；组间用 data-sep 画分隔线。

export type ToolbarProps = Omit<ComponentProps<'div'>, 'role' | 'aria-label'> & {
  /** 工具条的名字（屏幕阅读器念）。 */
  label: string
  /** 宿主要自己量宽度、找子元素时拿到容器。 */
  ref?: Ref<HTMLDivElement>
}

export function Toolbar({ label, className, ref, onKeyDown, children, ...rest }: ToolbarProps) {
  const own = useRef<HTMLDivElement | null>(null)
  const roving = useRovingToolbar(own)
  return (
    <div
      {...rest}
      ref={(node) => {
        own.current = node
        if (typeof ref === 'function') ref(node)
        else if (ref) ref.current = node
      }}
      role="toolbar"
      aria-label={label}
      data-slot="toolbar"
      className={cn('k-toolbar', className)}
      onKeyDown={(event) => {
        roving.onKeyDown(event)
        onKeyDown?.(event)
      }}
    >
      {children}
    </div>
  )
}

/** 一组工具（左组或右组）。 */
export function ToolbarGroup({ side, className, ...rest }: ComponentProps<'div'> & { side: 'left' | 'right' }) {
  return <div {...rest} data-slot="toolbar-group" className={cn('k-toolbar-group', `is-${side}`, className)} />
}

/**
 * 一个工具的槽：宿主用 data-tool 认出它、量它的宽度；folded 的槽只藏起来不拆掉（量宽度还要用）；
 * separator 在它前面画一道分隔线（相邻两个工具属于不同用途组时）。
 */
export function ToolSlot({
  tool,
  folded,
  separator,
  className,
  ...rest
}: ComponentProps<'span'> & { tool: string; folded?: boolean; separator?: boolean }) {
  return (
    <span
      {...rest}
      data-slot="tool-slot"
      data-tool={tool}
      data-sep={separator ? '' : undefined}
      className={cn('k-tool-slot', folded && 'is-folded', className)}
    />
  )
}

// 悬停约 0.5 秒出提示，照 TradingView 工具栏（#720）。提示是图标按钮唯一的文字说明之外的补充：按钮自己带 aria-label。
const TIP_DELAY_MS = 500

export function ToolButton({
  label,
  title,
  keys,
  pressed,
  disabled,
  onClick,
  className,
  renderTooltip,
  children,
}: {
  /** 按钮的名字：屏幕阅读器念它，没有 title 时也是悬停提示。 */
  label: string
  /** 悬停提示（比名字多一句说明）。 */
  title?: string
  /** 悬停提示里跟在后面的快捷键写法（宿主按键位表写好）。 */
  keys?: ReactNode
  /** 开关类工具（绘制对象、交易面板）是否开着。 */
  pressed?: boolean
  disabled?: boolean
  onClick: () => void
  className?: string
  /** 宿主有自己的提示件时用它包按钮（拿到的是按钮元素）；省略时用包里的提示。 */
  renderTooltip?: (button: ReactElement) => ReactElement
  children: ReactNode
}) {
  const button = (
    <button
      type="button"
      className={cn('k-tool', pressed && 'is-on', className)}
      aria-label={label}
      aria-pressed={pressed}
      disabled={disabled}
      data-slot="tool-button"
      onClick={onClick}
    >
      {children}
    </button>
  )
  if (renderTooltip) return renderTooltip(button)
  return (
    <TooltipProvider delayDuration={TIP_DELAY_MS} skipDelayDuration={0}>
      <Tooltip disableHoverableContent>
        {/* 禁用的按钮收不到指针事件，提示挂在外面包的一层上（告诉人为什么点不了）。 */}
        <TooltipTrigger asChild>{disabled ? <span className="k-tool-trigger">{button}</span> : button}</TooltipTrigger>
        <TooltipContent side="bottom" aria-label={title ?? label}>
          {title ?? label}
          {keys ? <> {keys}</> : null}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
