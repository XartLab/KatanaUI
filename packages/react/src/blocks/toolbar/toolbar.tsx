// SPDX-License-Identifier: MIT
import { useRef, type ComponentProps, type ReactElement, type ReactNode, type Ref } from 'react'
import { cn } from '../../lib/cn.ts'
import {
  EnsureTooltipProvider,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../../primitives/tooltip.tsx'
import { useRovingToolbar } from './use-roving-toolbar.ts'

// 面板头的工具条零件（#1869，原应用 panels/kit/PanelToolbar 的展示部分）：一条 role=toolbar 的容器（整条只占一个 Tab 站，← → Home End 在项间移动，
// 见 use-roving-toolbar）、左右两组、每个工具一个槽、图标或文字按钮。哪些工具放得下、收进「»」是宿主的事（要读 PanelContext 与量宽度），不在这里。
// 照 ATAS X 图表头：左组（品种、周期、绘图……）+ 右组（比例、截图、设置……）；组间用 data-sep 画分隔线。

export type ToolbarProps = Omit<ComponentProps<'div'>, 'role' | 'aria-label'> & {
  /**
   * Name of the toolbar (read by screen readers).
   * 工具条的名字（屏幕阅读器念）。
   */
  label: string
  /** 宿主要自己量宽度、找子元素时拿到容器。 */
  ref?: Ref<HTMLDivElement>
}

export function Toolbar({ label, className, ref, onKeyDown, children, ...rest }: ToolbarProps) {
  const own = useRef<HTMLDivElement | null>(null)
  const roving = useRovingToolbar(own)
  return (
    // 整条工具条共用一个 TooltipProvider：沿着工具条移动，出过提示以后 400ms 内的邻居立即出、原地换字（kubai 025，#251）；
    // 每个 ToolButton 自带一个 Provider 的话，邻居之间互不知道，每到一个都要重新等 500ms。
    <TooltipProvider>
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
    </TooltipProvider>
  )
}

/** 一组工具（左组或右组）。 */
export function ToolbarGroup({
  side,
  className,
  ...rest
}: ComponentProps<'div'> & {
  /** Left group or right group. */
  side: 'left' | 'right'
}) {
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
}: ComponentProps<'span'> & {
  /** Tool id, written as data-tool so the host can measure widths. */
  tool: string
  /** Folded: hidden but not removed (it is still measured). */
  folded?: boolean
  /** Draw a divider before it (neighbouring tools belong to different groups). */
  separator?: boolean
}) {
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

// 提示时间（500ms 出、400ms 内邻居立即换）统一在 TooltipProvider，这里不另写。提示是图标按钮唯一的文字说明之外的补充：按钮自己带 aria-label。

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
  /**
   * Name of the button: read by screen readers, and the hover hint when there is no title.
   * 按钮的名字：屏幕阅读器念它，没有 title 时也是悬停提示。
   */
  label: string
  /**
   * Hover hint (one more sentence than the name).
   * 悬停提示（比名字多一句说明）。
   */
  title?: string
  /**
   * Shortcut written after the hint (the host writes it from its key map).
   * 悬停提示里跟在后面的快捷键写法（宿主按键位表写好）。
   */
  keys?: ReactNode
  /**
   * Whether a toggle tool is on (aria-pressed, orange).
   * 开关类工具（绘制对象、交易面板）是否开着。
   */
  pressed?: boolean
  /** Disable the button. */
  disabled?: boolean
  /** Called when clicked. */
  onClick: () => void
  /** Extra class name on the button. */
  className?: string
  /**
   * Wrap the button in the host's own tooltip component; the package tooltip is used when omitted.
   * 宿主有自己的提示件时用它包按钮（拿到的是按钮元素）；省略时用包里的提示。
   */
  renderTooltip?: (button: ReactElement) => ReactElement
  /** The icon. */
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
    <EnsureTooltipProvider>
      <Tooltip disableHoverableContent>
        {/* 禁用的按钮收不到指针事件，提示挂在外面包的一层上（告诉人为什么点不了）。 */}
        <TooltipTrigger asChild>{disabled ? <span className="k-tool-trigger">{button}</span> : button}</TooltipTrigger>
        <TooltipContent side="bottom" aria-label={title ?? label}>
          {title ?? label}
          {keys ? <> {keys}</> : null}
        </TooltipContent>
      </Tooltip>
    </EnsureTooltipProvider>
  )
}
