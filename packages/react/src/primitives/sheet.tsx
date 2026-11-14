// SPDX-License-Identifier: MIT
// 起步代码取自 shadcn/ui（https://ui.shadcn.com ，MIT，Copyright (c) 2023 shadcn），2026-11-14 用 `shadcn add` 生成（#1870），行为底座是 Radix；
// 拷进来以后归我们改：尺寸、颜色、动效按我们的 token 重写（决策记录 0049）。
import { cva, type VariantProps } from 'class-variance-authority'
import { XIcon } from 'lucide-react'
import { Dialog as SheetPrimitive } from 'radix-ui'
import type { ComponentProps } from 'react'
import { cn } from '../lib/cn.ts'
import { useOpenerFocus } from '../lib/opener-focus.ts'
import { OverlayPortal } from '../lib/overlay.tsx'
import { Button } from './button.tsx'

// 抽屉：贴着窗口一边滑出来的面板，行为同对话框（Radix Dialog：Esc 关、焦点锁在里面、背板点一下关、关了焦点回打开前拿着它的元素）。
// 皮肤跟对话框同一块材质（9% 白边、surface-3、同一组阴影）；左右两边宽 360（窄屏留 12 边），上下两边最高半屏。
// 入场走 gentle 弹簧从那一边滑进来，退场 120ms 直线滑出（theme/motion.css，按 data-side）。要有标题（SheetTitle，读屏靠它报名字），不想显示就加 sr-only。
const sheetVariants = cva(
  [
    'k-sheet k-text-body fixed z-41 flex flex-col border border-alpha-white-8 bg-surface-3 leading-[1.45] text-ink outline-0',
    'shadow-[0_2px_4px_rgba(0,0,0,0.5),0_24px_70px_rgba(0,0,0,0.45)]',
  ],
  {
    variants: {
      /** Which edge the sheet sticks to; it slides in from that edge. */
      side: {
        right: 'inset-y-0 right-0 w-[min(360px,calc(100vw-24px))] rounded-l-[14px] border-r-0',
        left: 'inset-y-0 left-0 w-[min(360px,calc(100vw-24px))] rounded-r-[14px] border-l-0',
        top: 'inset-x-0 top-0 max-h-[50dvh] rounded-b-[14px] border-t-0',
        bottom: 'inset-x-0 bottom-0 max-h-[50dvh] rounded-t-[14px] border-b-0',
      },
    },
    defaultVariants: { side: 'right' },
  },
)

function Sheet({ ...props }: ComponentProps<typeof SheetPrimitive.Root>) {
  return <SheetPrimitive.Root data-slot="sheet" {...props} />
}

function SheetTrigger({ ...props }: ComponentProps<typeof SheetPrimitive.Trigger>) {
  return <SheetPrimitive.Trigger data-slot="sheet-trigger" {...props} />
}

function SheetClose({ ...props }: ComponentProps<typeof SheetPrimitive.Close>) {
  return <SheetPrimitive.Close data-slot="sheet-close" {...props} />
}

function SheetPortal({ ...props }: ComponentProps<typeof SheetPrimitive.Portal>) {
  return <SheetPrimitive.Portal data-slot="sheet-portal" {...props} />
}

function SheetOverlay({ className, ...props }: ComponentProps<typeof SheetPrimitive.Overlay>) {
  return (
    <SheetPrimitive.Overlay
      data-slot="sheet-overlay"
      className={cn('k-dlg-backdrop fixed inset-0 z-40 bg-black/45', className)}
      {...props}
    />
  )
}

/** closeLabel：给了就在右上角画关闭钮（读屏读这个名字）；包里不放文案。 */
function SheetContent({
  className,
  children,
  side = 'right',
  closeLabel,
  ...props
}: ComponentProps<typeof SheetPrimitive.Content> &
  VariantProps<typeof sheetVariants> & {
    /** When given, draws a close button at the top right and uses this as its accessible name. */
    closeLabel?: string
  }) {
  const focus = useOpenerFocus(props)
  return (
    <OverlayPortal portal={SheetPrimitive.Portal}>
      <SheetOverlay />
      <SheetPrimitive.Content
        data-slot="sheet-content"
        data-side={side}
        className={cn(sheetVariants({ side }), className)}
        {...props}
        onOpenAutoFocus={focus.onOpenAutoFocus}
        onCloseAutoFocus={focus.onCloseAutoFocus}
      >
        {children}
        {closeLabel ? (
          <SheetPrimitive.Close asChild>
            <Button variant="ghost" size="icon" aria-label={closeLabel} className="absolute top-[11px] right-3">
              <XIcon />
            </Button>
          </SheetPrimitive.Close>
        ) : null}
      </SheetPrimitive.Content>
    </OverlayPortal>
  )
}

function SheetHeader({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="sheet-header"
      className={cn(
        'flex min-h-[50px] shrink-0 flex-col justify-center gap-1 border-b border-alpha-white-5 py-2 pr-12 pl-4',
        className,
      )}
      {...props}
    />
  )
}

function SheetBody({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="sheet-body"
      className={cn('flex min-h-0 flex-1 flex-col gap-2 overflow-auto px-4 py-4', className)}
      {...props}
    />
  )
}

function SheetFooter({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="sheet-footer"
      className={cn(
        'flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-alpha-white-5 px-4 py-3',
        className,
      )}
      {...props}
    />
  )
}

function SheetTitle({ className, ...props }: ComponentProps<typeof SheetPrimitive.Title>) {
  return (
    <SheetPrimitive.Title
      data-slot="sheet-title"
      className={cn('k-text-title m-0 leading-none text-ink', className)}
      {...props}
    />
  )
}

function SheetDescription({ className, ...props }: ComponentProps<typeof SheetPrimitive.Description>) {
  return (
    <SheetPrimitive.Description
      data-slot="sheet-description"
      className={cn('k-text-data m-0 text-ink-3', className)}
      {...props}
    />
  )
}

export {
  Sheet,
  SheetBody,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetOverlay,
  SheetPortal,
  SheetTitle,
  SheetTrigger,
  sheetVariants,
}
