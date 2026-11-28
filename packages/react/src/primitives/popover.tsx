// SPDX-License-Identifier: MIT
// 起步代码取自 shadcn/ui（https://ui.shadcn.com ，MIT，Copyright (c) 2023 shadcn），2026-11-11 用 `shadcn add` 生成（#1777），行为底座是 Radix；
// 拷进来以后归我们改：样子（尺寸、颜色、动效）按 OpenMarket 实测样式与我们的 token 重写（决策记录 0049）。
import {
  Popover as PopoverRoot,
  PopoverClose as PopoverCloseButton,
  PopoverContent as PopoverPanel,
  PopoverTrigger as PopoverButton,
} from '@ui-sdk/react/popover'
import {
  createContext,
  useContext,
  useState,
  type ComponentProps,
  type ReactNode,
  type Ref,
  type RefObject,
} from 'react'
import { cn } from '../lib/cn.ts'
import { useInlineOverlays } from '../lib/overlay.tsx'
import {
  allowsClose,
  childrenOf,
  HandlersContext,
  partRender,
  slotOf,
  useFocusCompat,
  useRegisterHandlers,
  type CompatContent,
  useHandlerStore,
} from '../lib/radix-compat.tsx'
import { assignRef, useScrollDismiss } from '../lib/scroll-dismiss.ts'
import { menuContainerClass } from './menu-parts.tsx'

// 弹层：跟菜单同一块材质（OpenMarket tb-interval-dropdown：圆角 overlay · 7% 白边 · 0 16 48 + 0 2 8 阴影）。三种皮肤，variant 选：
//   panel（默认）：宽 288 · 内边 12，放一小段说明、一组控件。
//   menu：就是菜单的容器（最小宽 180 · 内边 6 · 超高自己滚），应用里「弹出一列东西」的弹层用它，跟菜单一个样。
//   bare：不带皮肤，只有位置、层级与入场动效；外观全由调用方的类名给（快速换品种那种自带整套样式的浮层）。
// 行为底座是 UI SDK 的 Popover（#263 从 Radix 换来）：它渲染在顶层（top layer），不进 Portal；对外仍是 Radix 的写法（asChild、onOpenAutoFocus、onEscapeKeyDown 等），见 lib/radix-compat.tsx。
// 锚点（触发钮或 PopoverAnchor）登记在这里，滚动即关（#125）看的是装着它的滚动容器。
const AnchorContext = createContext<RefObject<Element | null> | null>(null)
// PopoverAnchor 的节点：内容按它定位（不给就按触发钮）。
const AnchorNodeContext = createContext<{ node: Element | null; set: (node: Element | null) => void }>({
  node: null,
  set: () => {},
})

/** 把锚点节点同时交给调用方的 ref 与滚动即关的 ref。 */
function useAnchorRef<T extends Element>(ref: Ref<T> | undefined) {
  const anchor = useContext(AnchorContext)
  return (node: T | null) => {
    if (anchor) assignRef(anchor, node)
    return assignRef(ref, node)
  }
}

function Popover({
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  closeOnScroll = true,
  modal,
  children,
}: {
  /** Whether the popover is open (controlled). */
  open?: boolean
  /** Whether it starts open (uncontrolled). */
  defaultOpen?: boolean
  /** Called when it opens or closes. */
  onOpenChange?: (open: boolean) => void
  /** Closes the popover when the page or a container holding its trigger scrolls, so it never floats away open. */
  closeOnScroll?: boolean
  /** Whether the rest of the page is inert while it is open; false by default. */
  modal?: boolean
  /** The content. */
  children?: ReactNode
}) {
  const [uncontrolled, setUncontrolled] = useState(defaultOpen)
  const [anchorNode, setAnchorNode] = useState<Element | null>(null)
  const open = openProp ?? uncontrolled
  const handlers = useHandlerStore()
  const setOpen = (next: boolean) => {
    if (openProp === undefined) setUncontrolled(next)
    onOpenChange?.(next)
  }
  const anchor = useScrollDismiss<Element>(open, () => setOpen(false), closeOnScroll)
  return (
    <AnchorContext value={anchor}>
      <AnchorNodeContext value={{ node: anchorNode, set: setAnchorNode }}>
        <HandlersContext value={handlers}>
          <PopoverRoot
            open={open}
            modal={modal}
            onOpenChange={(next, details) => {
              if (!next && !allowsClose(handlers.get(), details)) return
              setOpen(next)
            }}
          >
            {children}
          </PopoverRoot>
        </HandlersContext>
      </AnchorNodeContext>
    </AnchorContext>
  )
}

function PopoverTrigger({
  asChild,
  children,
  ref,
  ...props
}: Omit<ComponentProps<typeof PopoverButton>, 'render' | 'children'> & {
  /** Merge the trigger's props onto its only child instead of rendering a button. */
  asChild?: boolean
  /** The content. */
  children?: ReactNode
}) {
  return (
    <PopoverButton
      ref={useAnchorRef(ref)}
      render={partRender(slotOf(props, 'popover-trigger'), 'button', asChild, children)}
      {...props}
    >
      {childrenOf(asChild, children)}
    </PopoverButton>
  )
}

function PopoverClose({
  asChild,
  children,
  ...props
}: Omit<ComponentProps<typeof PopoverCloseButton>, 'render' | 'children'> & {
  /** Merge the close button's props onto its only child. */
  asChild?: boolean
  /** The content. */
  children?: ReactNode
}) {
  return (
    <PopoverCloseButton render={partRender(slotOf(props, 'popover-close'), 'button', asChild, children)} {...props}>
      {childrenOf(asChild, children)}
    </PopoverCloseButton>
  )
}

const skin = {
  panel: 'k-mat-overlay k-text-body z-50 w-72 p-3 text-(color:--k-content-body-foreground) outline-0',
  menu: menuContainerClass,
  bare: 'z-50 outline-0',
} as const

/** Radix 式的内容口子（见 lib/radix-compat.tsx），加两个 Radix Popper 的选项：不再起作用，留着是为了调用方不用改。 */
type PopoverCompat = CompatContent & {
  /** Close when the anchor scrolls out of view; ignored (closeOnScroll on Popover decides). */
  hideWhenDetached?: boolean
  /** Whether the popover flips to stay on screen; always on. */
  avoidCollisions?: boolean
}

function PopoverContent({
  className,
  align = 'center',
  sideOffset = 4,
  variant = 'panel',
  onEscapeKeyDown,
  onPointerDownOutside,
  onFocusOutside,
  onInteractOutside,
  onOpenAutoFocus,
  onCloseAutoFocus,
  forceMount,
  asChild,
  hideWhenDetached: _hideWhenDetached,
  avoidCollisions: _avoidCollisions,
  children,
  ...props
}: Omit<
  ComponentProps<typeof PopoverPanel>,
  'render' | 'children' | 'initialFocus' | 'finalFocus' | 'keepMounted' | 'inline' | 'anchor'
> &
  PopoverCompat & {
    /** Skin of the popup. */
    variant?: keyof typeof skin
    /** The content. */
    children?: ReactNode
  }) {
  const handlers = useContext(HandlersContext)
  useRegisterHandlers(handlers, { onEscapeKeyDown, onPointerDownOutside, onFocusOutside, onInteractOutside })
  const { attach, initialFocus, finalFocus } = useFocusCompat({ onOpenAutoFocus, onCloseAutoFocus })
  const inline = useInlineOverlays()
  const { node } = useContext(AnchorNodeContext)
  return (
    <PopoverPanel
      ref={attach}
      data-variant={variant}
      align={align}
      sideOffset={sideOffset}
      anchor={node ?? undefined}
      initialFocus={initialFocus}
      finalFocus={finalFocus}
      keepMounted={forceMount}
      inline={inline || undefined}
      render={partRender(slotOf(props, 'popover-content'), 'div', asChild, children)}
      className={cn(skin[variant], className)}
      {...props}
    >
      {childrenOf(asChild, children)}
    </PopoverPanel>
  )
}

function PopoverAnchor({ asChild, children, ref, ...props }: ComponentProps<'div'> & { asChild?: boolean }) {
  const { set } = useContext(AnchorNodeContext)
  const scroll = useAnchorRef(ref as Ref<Element> | undefined)
  const attach = (node: Element | null) => {
    set(node)
    return scroll(node)
  }
  const render = partRender(slotOf(props, 'popover-anchor'), 'div', asChild, children)
  return render({ ...props, ref: attach, children: childrenOf(asChild, children) })
}

function PopoverHeader({ className, ...props }: ComponentProps<'div'>) {
  return <div data-slot="popover-header" className={cn('mb-2 flex flex-col gap-1', className)} {...props} />
}

function PopoverTitle({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="popover-title"
      className={cn('k-text-data text-(color:--k-content-primary-foreground)', className)}
      {...props}
    />
  )
}

function PopoverDescription({ className, ...props }: ComponentProps<'p'>) {
  return (
    <p
      data-slot="popover-description"
      className={cn('k-text-caption text-(color:--k-content-secondary-foreground)', className)}
      {...props}
    />
  )
}

export {
  Popover,
  PopoverTrigger,
  PopoverClose,
  PopoverContent,
  PopoverAnchor,
  PopoverHeader,
  PopoverTitle,
  PopoverDescription,
}
