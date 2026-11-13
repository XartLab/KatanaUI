// SPDX-License-Identifier: MIT
// 起步代码取自 shadcn/ui（https://ui.shadcn.com ，MIT，Copyright (c) 2023 shadcn），2026-11-11 用 `shadcn add` 生成（#1777），行为底座是 Radix；
// 拷进来以后归我们改：样子（尺寸、颜色、动效）按 OpenMarket 实测样式与我们的 token 重写（决策记录 0049）。
import { XIcon } from 'lucide-react'
import { Dialog as DialogPrimitive } from 'radix-ui'
import { useRef, type ComponentProps } from 'react'
import { cn } from '../lib/cn'
import { OverlayPortal } from '../lib/overlay'
import { Button } from './button'

// 对话框：照 OpenMarket 高级设置。宽 560（窄屏留 12 边）· 圆角 14 · 9% 白边 · 0 2 4 + 0 24 70 阴影；
// 标题栏 50 高、底下一道 6% 白线；正文 16 24 24；脚栏 12 16、顶上一道线。Esc 关、焦点锁在里面、关了回到触发处都是 Radix 做的。
function Dialog({ ...props }: ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />
}

function DialogTrigger({ ...props }: ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />
}

function DialogPortal({ ...props }: ComponentProps<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />
}

function DialogClose({ ...props }: ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />
}

function DialogOverlay({ className, ...props }: ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      className={cn('k-dlg-backdrop fixed inset-0 z-40 bg-black/45', className)}
      {...props}
    />
  )
}

/**
 * 对话框本体。带了 closeLabel 就在标题栏右上角画一个关闭钮（读屏器读这个名字）；包里不放文案，名字由调用方传。
 * bare：不带皮肤也不带位置（居中、宽度、背景、边、阴影都不给），只有层级与入场的挂钩（data-bare，入场动效由调用方的样式用 --k-in-* 变量配，见 theme/motion.css）；
 * 命令搜索、指标库、品种搜索这类自带整套外观的浮层用它。overlayClassName 改背板的样子。
 * 关闭后焦点去哪：要自己指定就传 onCloseAutoFocus（Radix 的写法：event.preventDefault() 后自己 focus）；不传是回到触发器，没有触发器时回到打开前拿着焦点的元素。
 */
function DialogContent({
  className,
  overlayClassName,
  children,
  closeLabel,
  bare,
  ...props
}: ComponentProps<typeof DialogPrimitive.Content> & {
  closeLabel?: string
  bare?: boolean
  overlayClassName?: string
}) {
  // Radix 的模态对话框关闭后只会聚焦 DialogTrigger；我们的对话框大多由代码打开、没有触发器，焦点就丢了（落到 body）。
  // 所以挂载时记下打开前拿着焦点的元素，关闭时还给它（调用方的 onCloseAutoFocus 先走，它 preventDefault 就不管）。
  const opener = useRef<HTMLElement | null>(null)
  return (
    <OverlayPortal portal={DialogPrimitive.Portal}>
      <DialogOverlay className={overlayClassName} />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        data-bare={bare ? '' : undefined}
        className={cn(
          bare
            ? 'z-41 outline-0'
            : [
                'k-dlg k-text-body fixed top-1/2 left-1/2 z-41 flex max-h-[calc(100dvh-24px)] w-[min(560px,calc(100vw-24px))] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden',
                'rounded-[14px] border border-alpha-white-8 bg-surface-3 leading-[1.45] text-ink outline-0',
                'shadow-[0_2px_4px_rgba(0,0,0,0.5),0_24px_70px_rgba(0,0,0,0.45)]',
              ],
          className,
        )}
        {...props}
        onOpenAutoFocus={(event) => {
          opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
          props.onOpenAutoFocus?.(event)
        }}
        onCloseAutoFocus={(event) => {
          props.onCloseAutoFocus?.(event)
          if (event.defaultPrevented) return
          const target = opener.current
          if (target?.isConnected) {
            event.preventDefault()
            target.focus({ preventScroll: true })
          }
        }}
      >
        {children}
        {closeLabel ? (
          <DialogPrimitive.Close asChild>
            <Button variant="ghost" size="icon" aria-label={closeLabel} className="absolute top-[11px] right-3">
              <XIcon />
            </Button>
          </DialogPrimitive.Close>
        ) : null}
      </DialogPrimitive.Content>
    </OverlayPortal>
  )
}

function DialogHeader({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="dialog-header"
      className={cn(
        'k-dlg-head flex h-[50px] shrink-0 items-center gap-3 border-b border-alpha-white-5 pr-12 pl-4',
        className,
      )}
      {...props}
    />
  )
}

function DialogBody({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="dialog-body"
      className={cn('k-dlg-body flex min-h-0 flex-1 flex-col gap-2 overflow-auto px-6 pt-4 pb-6', className)}
      {...props}
    />
  )
}

function DialogFooter({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        'k-dlg-foot flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-alpha-white-5 px-4 py-3',
        className,
      )}
      {...props}
    />
  )
}

/** bare：不带标题的皮肤（只要 Radix 的 aria 关系），字样由调用方的类名给——自带整套外观的浮层、设置窗左栏的窗名用。 */
function DialogTitle({ className, bare, ...props }: ComponentProps<typeof DialogPrimitive.Title> & { bare?: boolean }) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn(!bare && 'k-text-title m-0 min-w-0 flex-1 truncate leading-none text-ink', className)}
      {...props}
    />
  )
}

function DialogDescription({
  className,
  bare,
  ...props
}: ComponentProps<typeof DialogPrimitive.Description> & { bare?: boolean }) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn(!bare && 'k-text-body text-ink-3', className)}
      {...props}
    />
  )
}

export {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
}
