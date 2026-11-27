// SPDX-License-Identifier: MIT
// 起步代码取自 shadcn/ui 的 alert-dialog（https://ui.shadcn.com/docs/components/alert-dialog ，MIT，Copyright (c) 2023 shadcn），2026-11-25 读，行为底座是 Radix AlertDialog；
// 拷进来以后归我们改：外观沿用本包 Dialog（OpenMarket 高级设置实测的尺寸、圆角、阴影）加确认类的粗一档边（.k-dlg.confirm，theme/dialog.css）（KatanaUI #236）。
import {
  AlertDialog as AlertDialogRoot,
  AlertDialogBackdrop,
  AlertDialogClose,
  AlertDialogContent as AlertDialogPanel,
  AlertDialogDescription as AlertDialogText,
  AlertDialogTitle as AlertDialogHeading,
  AlertDialogTrigger as AlertDialogButton,
} from '@ui-sdk/react/alert-dialog'
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

// 确认对话框：要用户明确选一个才关。和 Dialog 的差别都在 UI SDK 的 AlertDialog 里（#263 从 Radix 换来）：role="alertdialog"、点背板不关、打开时焦点落在「取消」、
// Esc 关掉（只触发 onOpenChange(false)，不点取消钮）；所以没有右上角的关闭钮。样子和 Dialog 同一套，只是边粗一档。
function AlertDialog({
  onOpenChange,
  ...props
}: Omit<ComponentProps<typeof AlertDialogRoot>, 'onOpenChange'> & {
  /** Called when the dialog opens or closes. */
  onOpenChange?: (open: boolean) => void
}) {
  const root = useCompatRoot(onOpenChange)
  return (
    <HandlersContext value={root.handlers}>
      <AlertDialogRoot onOpenChange={root.onOpenChange} {...props} />
    </HandlersContext>
  )
}

function AlertDialogTrigger({
  asChild,
  children,
  ...props
}: Omit<ComponentProps<typeof AlertDialogButton>, 'render' | 'children'> & {
  /** Merge the trigger's props onto its only child. */
  asChild?: boolean
  children?: ReactNode
}) {
  return (
    <AlertDialogButton render={partRender('alert-dialog-trigger', 'button', asChild, children)} {...props}>
      {childrenOf(asChild, children)}
    </AlertDialogButton>
  )
}

/** 以前 Radix 的 Portal；UI SDK 的浮层在顶层，不需要它，留着是为了对外的导出不变。 */
function AlertDialogPortal({ children }: { children?: ReactNode }) {
  return children
}

function AlertDialogOverlay({ className, ...props }: Omit<ComponentProps<typeof AlertDialogBackdrop>, 'render'>) {
  return (
    <AlertDialogBackdrop
      render={partRender('alert-dialog-overlay', 'div')}
      className={cn('k-dlg-backdrop fixed inset-0 z-40 bg-black/45', className)}
      {...props}
    />
  )
}

/**
 * 确认对话框本体。size：default 与 Dialog 同宽（560，OpenMarket 高级设置实测）；sm 是 320，取 shadcn alert-dialog 的 sm 尺寸（max-w-xs），
 * 给一句话就说得清的确认（删一行、撤一张单）。窄屏两档都留 12 边。
 * 关闭后焦点：有触发器回触发器；由代码打开的回到打开前拿着焦点的元素（UI SDK 的 finalFocus 默认）。
 */
function AlertDialogContent({
  className,
  overlayClassName,
  size = 'default',
  onOpenAutoFocus,
  onCloseAutoFocus,
  onEscapeKeyDown,
  forceMount,
  asChild,
  children,
  ...props
}: Omit<
  ComponentProps<typeof AlertDialogPanel>,
  'render' | 'children' | 'initialFocus' | 'finalFocus' | 'keepMounted' | 'inline'
> &
  CompatContent & {
    children?: ReactNode
    /** Width: default is 560px like Dialog, sm is 320px for a one-line confirmation. */
    size?: 'default' | 'sm'
    /** Extra class name on the backdrop. */
    overlayClassName?: string
  }) {
  useRegisterHandlers(useContext(HandlersContext), { onEscapeKeyDown })
  const { attach, initialFocus, finalFocus } = useFocusCompat({ onOpenAutoFocus, onCloseAutoFocus })
  const inline = useInlineOverlays()
  return (
    <>
      <AlertDialogOverlay className={overlayClassName} />
      <AlertDialogPanel
        ref={attach}
        data-size={size}
        initialFocus={initialFocus ?? '[data-slot="alert-dialog-cancel"]'}
        finalFocus={finalFocus}
        keepMounted={forceMount}
        inline={inline || undefined}
        render={partRender('alert-dialog-content', 'dialog', asChild, children)}
        className={cn(
          'k-dlg confirm k-text-body fixed top-1/2 left-1/2 z-41 flex max-h-[calc(100dvh-24px)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden',
          size === 'sm' ? 'w-[min(320px,calc(100vw-24px))]' : 'w-[min(560px,calc(100vw-24px))]',
          'rounded-[var(--radius-dialog)] border bg-(--k-surface-raised-background) leading-[1.45] text-(color:--k-content-primary-foreground) outline-0',
          'shadow-(--k-overlay-dialog-shadow)',
          className,
        )}
        {...props}
      >
        {childrenOf(asChild, children)}
      </AlertDialogPanel>
    </>
  )
}

function AlertDialogHeader({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="alert-dialog-header"
      className={cn(
        'k-dlg-head flex h-[50px] shrink-0 items-center gap-3 border-b border-(color:--k-separable-subtle-borderColor) px-4',
        className,
      )}
      {...props}
    />
  )
}

function AlertDialogBody({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="alert-dialog-body"
      className={cn('k-dlg-body flex min-h-0 flex-1 flex-col gap-2 overflow-auto px-6 pt-4 pb-6', className)}
      {...props}
    />
  )
}

function AlertDialogFooter({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="alert-dialog-footer"
      className={cn(
        'k-dlg-foot flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-(color:--k-separable-subtle-borderColor) px-4 py-3',
        className,
      )}
      {...props}
    />
  )
}

function AlertDialogTitle({ className, ...props }: Omit<ComponentProps<typeof AlertDialogHeading>, 'render'>) {
  return (
    <AlertDialogHeading
      render={partRender('alert-dialog-title', 'h2')}
      className={cn(
        'k-text-title m-0 min-w-0 flex-1 truncate leading-none text-(color:--k-content-primary-foreground)',
        className,
      )}
      {...props}
    />
  )
}

function AlertDialogDescription({ className, ...props }: Omit<ComponentProps<typeof AlertDialogText>, 'render'>) {
  return (
    <AlertDialogText
      render={partRender('alert-dialog-description', 'p')}
      className={cn('k-text-body text-(color:--k-content-secondary-foreground)', className)}
      {...props}
    />
  )
}

/** 确认钮：画成我们的 Button。variant 默认 primary；删除、平仓、撤单这类不可撤回的用 danger。 */
// 两个钮的属性就是 Button 的（size、effect、asChild 都照 Button）：UI SDK 的 Close 以 render 换成它、点了关闭（KatanaUI #242）。
function AlertDialogAction({
  variant = 'primary',
  ...props
}: Omit<ComponentProps<typeof Button>, 'variant'> & {
  /** Button style: primary by default, danger for an action that cannot be undone. */
  variant?: 'primary' | 'danger' | 'default'
}) {
  return (
    <AlertDialogClose
      value="action"
      render={partRender('alert-dialog-action', 'button', true, <Button variant={variant} {...props} />)}
    />
  )
}

/** 取消钮：打开时焦点落在它上面。Esc 关掉对话框但不点它：取消要做的事写在 AlertDialog 的 onOpenChange 里。 */
function AlertDialogCancel({ ...props }: ComponentProps<typeof Button>) {
  return (
    <AlertDialogClose
      value="cancel"
      render={partRender('alert-dialog-cancel', 'button', true, <Button {...props} />)}
    />
  )
}

export {
  AlertDialog,
  AlertDialogAction,
  AlertDialogBody,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  AlertDialogPortal,
  AlertDialogTitle,
  AlertDialogTrigger,
}
