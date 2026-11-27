// SPDX-License-Identifier: MIT
// 起步代码取自 shadcn/ui（https://ui.shadcn.com ，MIT，Copyright (c) 2023 shadcn），2026-11-11 用 `shadcn add` 生成（#1777），行为底座是 Radix；
// 拷进来以后归我们改：样子（尺寸、颜色、动效）按 OpenMarket 实测样式与我们的 token 重写（决策记录 0049）。
import {
  Dialog as DialogRoot,
  DialogBackdrop,
  DialogClose as DialogCloseButton,
  DialogContent as DialogPanel,
  DialogDescription as DialogText,
  DialogTitle as DialogHeading,
  DialogTrigger as DialogButton,
} from '@ui-sdk/react/dialog'
import { XIcon } from 'lucide-react'
import { useContext, type ComponentProps, type ReactNode } from 'react'
import { cn } from '../lib/cn.ts'
import { useInlineOverlays } from '../lib/overlay.tsx'
import {
  childrenOf,
  HandlersContext,
  partRender,
  useCompatRoot,
  useFocusCompat,
  useRegisterHandlers,
  type CompatContent,
} from '../lib/radix-compat.tsx'
import { Button } from './button.tsx'

// 对话框：照 OpenMarket 高级设置。宽 560（窄屏留 12 边）· 圆角 14 · 9% 白边 · 0 2 4 + 0 24 70 阴影；
// 标题栏 50 高、底下一道 6% 白线；正文 16 24 24；脚栏 12 16、顶上一道线。Esc 关、焦点锁在里面、关了回到触发处都是 UI SDK 的 Dialog 做的（#263 从 Radix 换来）：
// 它是原生 <dialog>，开着时在浏览器的顶层（top layer），不需要 Portal；对外仍是 Radix 的写法（asChild、onOpenAutoFocus、onEscapeKeyDown 等），见 lib/radix-compat.tsx。
function Dialog({
  onOpenChange,
  ...props
}: Omit<ComponentProps<typeof DialogRoot>, 'onOpenChange'> & {
  /** Called when the dialog opens or closes. */
  onOpenChange?: (open: boolean) => void
}) {
  const root = useCompatRoot(onOpenChange)
  return (
    <HandlersContext value={root.handlers}>
      <DialogRoot onOpenChange={root.onOpenChange} {...props} />
    </HandlersContext>
  )
}

function DialogTrigger({
  asChild,
  children,
  ...props
}: Omit<ComponentProps<typeof DialogButton>, 'render' | 'children'> & {
  /** Merge the trigger's props onto its only child. */
  asChild?: boolean
  children?: ReactNode
}) {
  return (
    <DialogButton render={partRender('dialog-trigger', 'button', asChild, children)} {...props}>
      {childrenOf(asChild, children)}
    </DialogButton>
  )
}

/** 以前 Radix 的 Portal；UI SDK 的浮层在顶层，不需要它，留着是为了对外的导出不变。 */
function DialogPortal({ children }: { children?: ReactNode }) {
  return children
}

function DialogClose({
  asChild,
  children,
  ...props
}: Omit<ComponentProps<typeof DialogCloseButton>, 'render' | 'children'> & {
  /** Merge the close button's props onto its only child. */
  asChild?: boolean
  children?: ReactNode
}) {
  return (
    <DialogCloseButton render={partRender('dialog-close', 'button', asChild, children)} {...props}>
      {childrenOf(asChild, children)}
    </DialogCloseButton>
  )
}

function DialogOverlay({ className, ...props }: Omit<ComponentProps<typeof DialogBackdrop>, 'render'>) {
  return (
    <DialogBackdrop
      render={partRender('dialog-overlay', 'div')}
      className={cn('k-dlg-backdrop fixed inset-0 z-40 bg-black/45', className)}
      {...props}
    />
  )
}

/**
 * 对话框本体。带了 closeLabel 就在标题栏右上角画一个关闭钮（读屏器读这个名字）；包里不放文案，名字由调用方传。
 * bare：不带皮肤也不带位置（居中、宽度、背景、边、阴影都不给），只有层级与入场的挂钩（data-bare，入场动效由调用方的样式用 --k-in-* 变量配，见 theme/motion.css）；
 * 命令搜索、指标库、品种搜索这类自带整套外观的浮层用它。overlayClassName 改背板的样子。
 * 关闭后焦点去哪：要自己指定就传 onCloseAutoFocus（Radix 的写法：event.preventDefault() 后自己 focus）；不传是回到触发器，没有触发器时回到打开前拿着焦点的元素（UI SDK 的 finalFocus 默认）。
 */
function DialogContent({
  className,
  overlayClassName,
  children,
  closeLabel,
  bare,
  onOpenAutoFocus,
  onCloseAutoFocus,
  onEscapeKeyDown,
  onPointerDownOutside,
  onFocusOutside,
  onInteractOutside,
  forceMount,
  asChild,
  ...props
}: Omit<
  ComponentProps<typeof DialogPanel>,
  'render' | 'children' | 'initialFocus' | 'finalFocus' | 'keepMounted' | 'inline'
> &
  CompatContent & {
    children?: ReactNode
    /** When given, draws a close button at the top right of the title bar and uses this as its accessible name. */
    closeLabel?: string
    /** Skip the skin and the position; the caller's class names style the content. */
    bare?: boolean
    /** Extra class name on the backdrop. */
    overlayClassName?: string
  }) {
  useRegisterHandlers(useContext(HandlersContext), {
    onEscapeKeyDown,
    onPointerDownOutside,
    onFocusOutside,
    onInteractOutside,
  })
  const { attach, initialFocus, finalFocus } = useFocusCompat({ onOpenAutoFocus, onCloseAutoFocus })
  const inline = useInlineOverlays()
  return (
    <>
      <DialogOverlay className={overlayClassName} />
      <DialogPanel
        ref={attach}
        data-bare={bare ? '' : undefined}
        initialFocus={initialFocus}
        finalFocus={finalFocus}
        keepMounted={forceMount}
        inline={inline || undefined}
        render={partRender('dialog-content', 'dialog', asChild, children)}
        className={cn(
          bare
            ? 'z-41 outline-0'
            : [
                'k-dlg k-text-body fixed top-1/2 left-1/2 z-41 flex max-h-[calc(100dvh-24px)] w-[min(560px,calc(100vw-24px))] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden',
                'rounded-[var(--radius-dialog)] border border-(color:--k-overlay-dialog-borderColor) bg-(--k-surface-raised-background) leading-[1.45] text-(color:--k-content-primary-foreground) outline-0',
                'shadow-(--k-overlay-dialog-shadow)',
              ],
          className,
        )}
        {...props}
      >
        {childrenOf(asChild, children)}
        {closeLabel ? (
          <DialogClose asChild>
            <Button variant="ghost" size="icon" aria-label={closeLabel} className="absolute top-[11px] right-3">
              <XIcon />
            </Button>
          </DialogClose>
        ) : null}
      </DialogPanel>
    </>
  )
}

function DialogHeader({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="dialog-header"
      className={cn(
        'k-dlg-head flex h-[50px] shrink-0 items-center gap-3 border-b border-(color:--k-separable-subtle-borderColor) pr-12 pl-4',
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
        'k-dlg-foot flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-(color:--k-separable-subtle-borderColor) px-4 py-3',
        className,
      )}
      {...props}
    />
  )
}

/** bare：不带标题的皮肤（只要 aria 关系），字样由调用方的类名给——自带整套外观的浮层、设置窗左栏的窗名用。 */
function DialogTitle({
  className,
  bare,
  ...props
}: Omit<ComponentProps<typeof DialogHeading>, 'render'> & {
  /** Skip the title style. */
  bare?: boolean
}) {
  return (
    <DialogHeading
      render={partRender('dialog-title', 'h2')}
      className={cn(
        !bare && 'k-text-title m-0 min-w-0 flex-1 truncate leading-none text-(color:--k-content-primary-foreground)',
        className,
      )}
      {...props}
    />
  )
}

function DialogDescription({
  className,
  bare,
  ...props
}: Omit<ComponentProps<typeof DialogText>, 'render'> & {
  /** Skip the description style. */
  bare?: boolean
}) {
  return (
    <DialogText
      render={partRender('dialog-description', 'p')}
      className={cn(!bare && 'k-text-body text-(color:--k-content-secondary-foreground)', className)}
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
