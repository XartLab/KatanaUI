// SPDX-License-Identifier: MIT
// 改自 SmoothUI rich-popover（https://github.com/educlopez/smoothui ，MIT，© 2024 Eduardo Calvo）
import { ExternalLink } from 'lucide-react'
import { Popover as PopoverPrimitive } from 'radix-ui'
import type { ReactNode } from 'react'
import { cn } from '../lib/cn.ts'
import { OverlayPortal } from '../lib/overlay.tsx'
import { Button } from '../primitives/button.tsx'

// 富提示：点触发器弹出的一张小卡，有标题（可带外链）、一段说明、一枚元信息小标和一个主动作，带指向触发器的小尖角。
// 入场是原件的「模糊 + 缩放 + 上移」一起收敛（theme/sui-motion.css 的 kc-rich-in，参数照原件 blur 8px · scale 0.95 · y 5px，时长走 --dur-snappy）；
// 品种悬停预览这类只读的用 HoverCard，要带动作、要点开的用它。原件写死的 YouTube 图标、播放图标、时钟图标去掉，由调用方传 icon / actionIcon / metaIcon。
export type RichPopoverProps = {
  /** The element that opens the popover (rendered as the trigger itself). */
  trigger: ReactNode
  /** Heading of the card. */
  title: string
  /** Makes the title an external link. */
  href?: string
  /** Spoken name of the external-link mark (required with href). */
  hrefLabel?: string
  /** Icon in front of the title. */
  icon?: ReactNode
  /** The paragraph under the heading. */
  description?: ReactNode
  /** A small chip at the bottom left, e.g. a time or a size. */
  meta?: ReactNode
  /** Label of the primary action; leave it out for no action. */
  actionLabel?: string
  /** Icon in front of the action label. */
  actionIcon?: ReactNode
  /** Called when the primary action is pressed. */
  onAction?: () => void
  /** Which side of the trigger it opens on. */
  side?: 'top' | 'bottom' | 'left' | 'right'
  /** How it aligns to the trigger. */
  align?: 'start' | 'center' | 'end'
  /** Extra classes for the root element. */
  className?: string
}

export function RichPopover({
  trigger,
  title,
  href,
  hrefLabel,
  icon,
  description,
  meta,
  actionLabel,
  actionIcon,
  onAction,
  side = 'top',
  align = 'center',
  className,
}: RichPopoverProps) {
  return (
    <PopoverPrimitive.Root>
      <PopoverPrimitive.Trigger asChild>{trigger}</PopoverPrimitive.Trigger>
      <OverlayPortal portal={PopoverPrimitive.Portal}>
        <PopoverPrimitive.Content
          data-slot="rich-popover-content"
          side={side}
          align={align}
          sideOffset={8}
          className={cn(
            'k-text-body z-50 w-72 rounded-[var(--radius-overlay)] border border-alpha-white-6 bg-surface-4 p-3 text-ink-2 outline-0 shadow-[0_16px_48px_rgba(0,0,0,0.55),0_2px_8px_rgba(0,0,0,0.3)]',
            className,
          )}
        >
          <div className="k-text-data flex items-center gap-2 text-ink">
            {icon}
            {href ? (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-ink hover:underline"
              >
                <span>{title}</span>
                <ExternalLink size={12} aria-label={hrefLabel} className="opacity-70" />
              </a>
            ) : (
              <span>{title}</span>
            )}
          </div>
          {description ? <div className="mt-2 text-ink-3">{description}</div> : null}
          {meta || actionLabel ? (
            <div className="mt-3 flex items-center justify-between gap-3">
              {meta ? (
                <span className="k-text-caption inline-flex items-center gap-1 rounded-[var(--radius-pill)] bg-alpha-white-6 px-2.5 py-0.5 text-ink-2 tabular-nums">
                  {meta}
                </span>
              ) : (
                <span />
              )}
              {actionLabel ? (
                <Button size="sm" variant="primary" onClick={onAction}>
                  {actionIcon}
                  {actionLabel}
                </Button>
              ) : null}
            </div>
          ) : null}
          <PopoverPrimitive.Arrow className="fill-surface-4" />
        </PopoverPrimitive.Content>
      </OverlayPortal>
    </PopoverPrimitive.Root>
  )
}
