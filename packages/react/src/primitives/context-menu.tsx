// SPDX-License-Identifier: MIT
// 起步代码取自 shadcn/ui（https://ui.shadcn.com ，MIT，Copyright (c) 2023 shadcn），2026-11-13 用 `shadcn add context-menu` 生成（#1797），行为底座是 Radix；
// 拷进来以后归我们改：皮肤和二级菜单的规矩与下拉菜单共用一份（menu-parts.tsx），这里只接 Radix 的右键菜单（决策记录 0049）。
import { ContextMenu as ContextMenuPrimitive } from 'radix-ui'
import { useContext, type ComponentProps } from 'react'
import { MenuKindContext } from './menu-kind.ts'
import { cn } from '../lib/cn.ts'
import { OverlayPortal } from '../lib/overlay.tsx'
import {
  MenuCheckColumn,
  MenuShortcut,
  SUBMENU_ALIGN_OFFSET,
  SUBMENU_SIDE_OFFSET,
  SubmenuArrow,
  SubStateContext,
  closeSubOnEscape,
  useSubState,
  keepMovedFocus,
  menuCheckRowClass,
  menuContainerClass,
  menuGroupLabelClass,
  menuRowClass,
  menuSeparatorClass,
} from './menu-parts.tsx'

// 右键菜单开在指针处：Radix 固定 side=right、align=start，放不下自动翻面；不是 Base UI 那样贴着指针的左上角，差 sideOffset 2。
// 菜单名的处理同下拉菜单：给了 aria-label 就不要 aria-labelledby。

function ContextMenu({ ...props }: ComponentProps<typeof ContextMenuPrimitive.Root>) {
  return <ContextMenuPrimitive.Root data-slot="context-menu" {...props} />
}

function ContextMenuTrigger({ ...props }: ComponentProps<typeof ContextMenuPrimitive.Trigger>) {
  return <ContextMenuPrimitive.Trigger data-slot="context-menu-trigger" {...props} />
}

function ContextMenuPortal({ ...props }: ComponentProps<typeof ContextMenuPrimitive.Portal>) {
  return <ContextMenuPrimitive.Portal data-slot="context-menu-portal" {...props} />
}

function ContextMenuContent({ className, ...props }: ComponentProps<typeof ContextMenuPrimitive.Content>) {
  return (
    <OverlayPortal portal={ContextMenuPrimitive.Portal}>
      <MenuKindContext value="context">
        <ContextMenuPrimitive.Content
          data-slot="context-menu-content"
          className={cn(menuContainerClass, className)}
          {...(props['aria-label'] ? { 'aria-labelledby': undefined } : {})}
          // role="presentation" 的容器（里面另有 role=menu 的列表，面板目录）不能带 aria-orientation（axe aria-allowed-attr）。
          {...(props.role === 'presentation' ? { 'aria-orientation': undefined } : {})}
          {...props}
          onCloseAutoFocus={keepMovedFocus(props.onCloseAutoFocus)}
        />
      </MenuKindContext>
    </OverlayPortal>
  )
}

function ContextMenuGroup({ ...props }: ComponentProps<typeof ContextMenuPrimitive.Group>) {
  return <ContextMenuPrimitive.Group data-slot="context-menu-group" {...props} />
}

function ContextMenuItem({
  className,
  variant = 'default',
  bare,
  ...props
}: ComponentProps<typeof ContextMenuPrimitive.Item> & {
  /** Style of the row: danger uses the danger text color. */
  variant?: 'default' | 'danger'
  /** Skip the row skin. */
  bare?: boolean
}) {
  return (
    <ContextMenuPrimitive.Item
      data-slot="context-menu-item"
      data-variant={variant}
      className={cn(
        !bare && menuRowClass,
        !bare && 'data-[variant=danger]:text-(color:--k-status-danger-foreground)',
        className,
      )}
      {...props}
    />
  )
}

function ContextMenuCheckboxItem({
  className,
  children,
  bare,
  ...props
}: ComponentProps<typeof ContextMenuPrimitive.CheckboxItem> & { bare?: boolean }) {
  return (
    <ContextMenuPrimitive.CheckboxItem
      data-slot="context-menu-checkbox-item"
      className={cn(!bare && menuCheckRowClass, className)}
      {...props}
    >
      {bare ? (
        children
      ) : (
        <>
          <MenuCheckColumn>
            <ContextMenuPrimitive.ItemIndicator>✓</ContextMenuPrimitive.ItemIndicator>
          </MenuCheckColumn>
          {children}
        </>
      )}
    </ContextMenuPrimitive.CheckboxItem>
  )
}

function ContextMenuRadioGroup({ ...props }: ComponentProps<typeof ContextMenuPrimitive.RadioGroup>) {
  return <ContextMenuPrimitive.RadioGroup data-slot="context-menu-radio-group" {...props} />
}

function ContextMenuRadioItem({
  className,
  children,
  ...props
}: ComponentProps<typeof ContextMenuPrimitive.RadioItem>) {
  return (
    <ContextMenuPrimitive.RadioItem
      data-slot="context-menu-radio-item"
      className={cn(menuCheckRowClass, className)}
      {...props}
    >
      <MenuCheckColumn>
        <ContextMenuPrimitive.ItemIndicator>✓</ContextMenuPrimitive.ItemIndicator>
      </MenuCheckColumn>
      {children}
    </ContextMenuPrimitive.RadioItem>
  )
}

function ContextMenuLabel({ className, ...props }: ComponentProps<typeof ContextMenuPrimitive.Label>) {
  return (
    <ContextMenuPrimitive.Label
      data-slot="context-menu-label"
      className={cn(menuGroupLabelClass, className)}
      {...props}
    />
  )
}

function ContextMenuSeparator({ className, ...props }: ComponentProps<typeof ContextMenuPrimitive.Separator>) {
  return (
    <ContextMenuPrimitive.Separator
      data-slot="context-menu-separator"
      className={cn(menuSeparatorClass, className)}
      {...props}
    />
  )
}

function ContextMenuShortcut({ ...props }: ComponentProps<'kbd'>) {
  return <MenuShortcut data-slot="context-menu-shortcut" {...props} />
}

function ContextMenuSub({
  open,
  defaultOpen,
  onOpenChange,
  ...props
}: ComponentProps<typeof ContextMenuPrimitive.Sub>) {
  const sub = useSubState({ open, defaultOpen, onOpenChange })
  return (
    <SubStateContext value={sub.state}>
      <ContextMenuPrimitive.Sub
        data-slot="context-menu-sub"
        open={sub.open}
        onOpenChange={sub.onOpenChange}
        {...props}
      />
    </SubStateContext>
  )
}

function ContextMenuSubTrigger({
  className,
  children,
  ...props
}: ComponentProps<typeof ContextMenuPrimitive.SubTrigger>) {
  const sub = useContext(SubStateContext)
  return (
    <ContextMenuPrimitive.SubTrigger
      data-slot="context-menu-sub-trigger"
      className={cn(
        menuRowClass,
        'data-[state=open]:bg-(--k-selectable-background-active) data-[state=open]:text-(color:--k-content-primary-foreground)',
        className,
      )}
      {...props}
      ref={sub?.setTrigger}
    >
      {children}
      <SubmenuArrow />
    </ContextMenuPrimitive.SubTrigger>
  )
}

function ContextMenuSubContent({
  className,
  sideOffset = SUBMENU_SIDE_OFFSET,
  alignOffset = SUBMENU_ALIGN_OFFSET,
  onEscapeKeyDown,
  ...props
}: ComponentProps<typeof ContextMenuPrimitive.SubContent>) {
  const sub = useContext(SubStateContext)
  return (
    <OverlayPortal portal={ContextMenuPrimitive.Portal}>
      <ContextMenuPrimitive.SubContent
        data-slot="context-menu-sub-content"
        onEscapeKeyDown={(event) => {
          onEscapeKeyDown?.(event)
          if (!event.defaultPrevented) closeSubOnEscape(sub, event)
        }}
        sideOffset={sideOffset}
        alignOffset={alignOffset}
        className={cn(menuContainerClass, className)}
        {...(props['aria-label'] ? { 'aria-labelledby': undefined } : {})}
        // role="presentation" 的容器（里面另有 role=menu 的列表，面板目录）不能带 aria-orientation（axe aria-allowed-attr）。
        {...(props.role === 'presentation' ? { 'aria-orientation': undefined } : {})}
        {...props}
      />
    </OverlayPortal>
  )
}

export {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuPortal,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuCheckboxItem,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubTrigger,
  ContextMenuSubContent,
}
