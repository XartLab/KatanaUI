// SPDX-License-Identifier: MIT
// 起步代码取自 shadcn/ui（https://ui.shadcn.com ，MIT，Copyright (c) 2023 shadcn），2026-11-11 用 `shadcn add` 生成（#1777），行为底座是 Radix；
// 拷进来以后归我们改：样子（尺寸、颜色、动效）按 OpenMarket 实测样式与我们的 token 重写（决策记录 0049）。
import { DropdownMenu as DropdownMenuPrimitive } from 'radix-ui'
import { useContext, type ComponentProps } from 'react'
import { MenuKindContext } from './menu-kind'
import { cn } from '../lib/cn'
import { OverlayPortal } from '../lib/overlay'
import {
  MENU_SIDE_OFFSET,
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
} from './menu-parts'

// 下拉菜单的样子与二级菜单的规矩（#1832）都在 menu-parts.tsx，下拉菜单与右键菜单共用一份。
// 菜单名：调用方给了 aria-label 就用它。Radix 默认给内容挂 aria-labelledby 指向触发器，而 aria-labelledby 压过 aria-label，
// 读屏器与 getByRole('menu', { name }) 读到的就成了触发器的名字（2026-11-13 实测），所以给了 aria-label 就把 aria-labelledby 去掉。

function DropdownMenu({ ...props }: ComponentProps<typeof DropdownMenuPrimitive.Root>) {
  return <DropdownMenuPrimitive.Root data-slot="dropdown-menu" {...props} />
}

function DropdownMenuPortal({ ...props }: ComponentProps<typeof DropdownMenuPrimitive.Portal>) {
  return <DropdownMenuPrimitive.Portal data-slot="dropdown-menu-portal" {...props} />
}

function DropdownMenuTrigger({ ...props }: ComponentProps<typeof DropdownMenuPrimitive.Trigger>) {
  return <DropdownMenuPrimitive.Trigger data-slot="dropdown-menu-trigger" {...props} />
}

function DropdownMenuContent({
  className,
  sideOffset = MENU_SIDE_OFFSET,
  ...props
}: ComponentProps<typeof DropdownMenuPrimitive.Content>) {
  return (
    <OverlayPortal portal={DropdownMenuPrimitive.Portal}>
      <MenuKindContext value="dropdown">
        <DropdownMenuPrimitive.Content
          data-slot="dropdown-menu-content"
          sideOffset={sideOffset}
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

function DropdownMenuGroup({ ...props }: ComponentProps<typeof DropdownMenuPrimitive.Group>) {
  return <DropdownMenuPrimitive.Group data-slot="dropdown-menu-group" {...props} />
}

/** bare：不带菜单行的皮肤，样子全由调用方的类名给（右边的图钉列、布局缩略图这类不是文字行的项）。 */
function DropdownMenuItem({
  className,
  variant = 'default',
  bare,
  ...props
}: ComponentProps<typeof DropdownMenuPrimitive.Item> & { variant?: 'default' | 'danger'; bare?: boolean }) {
  return (
    <DropdownMenuPrimitive.Item
      data-slot="dropdown-menu-item"
      data-variant={variant}
      className={cn(!bare && menuRowClass, !bare && 'data-[variant=danger]:text-danger', className)}
      {...props}
    />
  )
}

/** 勾选项：默认带勾选列（勾是 ✓，未勾时留空占着宽度）；bare 不带皮肤也不带勾选列（图钉、星标这类用图标表示开关的项）。 */
function DropdownMenuCheckboxItem({
  className,
  children,
  bare,
  ...props
}: ComponentProps<typeof DropdownMenuPrimitive.CheckboxItem> & { bare?: boolean }) {
  return (
    <DropdownMenuPrimitive.CheckboxItem
      data-slot="dropdown-menu-checkbox-item"
      className={cn(!bare && menuCheckRowClass, className)}
      {...props}
    >
      {bare ? (
        children
      ) : (
        <>
          <MenuCheckColumn>
            <DropdownMenuPrimitive.ItemIndicator>✓</DropdownMenuPrimitive.ItemIndicator>
          </MenuCheckColumn>
          {children}
        </>
      )}
    </DropdownMenuPrimitive.CheckboxItem>
  )
}

function DropdownMenuRadioGroup({ ...props }: ComponentProps<typeof DropdownMenuPrimitive.RadioGroup>) {
  return <DropdownMenuPrimitive.RadioGroup data-slot="dropdown-menu-radio-group" {...props} />
}

function DropdownMenuRadioItem({
  className,
  children,
  ...props
}: ComponentProps<typeof DropdownMenuPrimitive.RadioItem>) {
  return (
    <DropdownMenuPrimitive.RadioItem
      data-slot="dropdown-menu-radio-item"
      className={cn(menuCheckRowClass, className)}
      {...props}
    >
      <MenuCheckColumn>
        <DropdownMenuPrimitive.ItemIndicator>✓</DropdownMenuPrimitive.ItemIndicator>
      </MenuCheckColumn>
      {children}
    </DropdownMenuPrimitive.RadioItem>
  )
}

function DropdownMenuLabel({ className, ...props }: ComponentProps<typeof DropdownMenuPrimitive.Label>) {
  return (
    <DropdownMenuPrimitive.Label
      data-slot="dropdown-menu-label"
      className={cn(menuGroupLabelClass, className)}
      {...props}
    />
  )
}

function DropdownMenuSeparator({ className, ...props }: ComponentProps<typeof DropdownMenuPrimitive.Separator>) {
  return (
    <DropdownMenuPrimitive.Separator
      data-slot="dropdown-menu-separator"
      className={cn(menuSeparatorClass, className)}
      {...props}
    />
  )
}

function DropdownMenuShortcut({ ...props }: ComponentProps<'kbd'>) {
  return <MenuShortcut data-slot="dropdown-menu-shortcut" {...props} />
}

function DropdownMenuSub({
  open,
  defaultOpen,
  onOpenChange,
  ...props
}: ComponentProps<typeof DropdownMenuPrimitive.Sub>) {
  const sub = useSubState({ open, defaultOpen, onOpenChange })
  return (
    <SubStateContext value={sub.state}>
      <DropdownMenuPrimitive.Sub
        data-slot="dropdown-menu-sub"
        open={sub.open}
        onOpenChange={sub.onOpenChange}
        {...props}
      />
    </SubStateContext>
  )
}

function DropdownMenuSubTrigger({
  className,
  children,
  ...props
}: ComponentProps<typeof DropdownMenuPrimitive.SubTrigger>) {
  const sub = useContext(SubStateContext)
  return (
    <DropdownMenuPrimitive.SubTrigger
      data-slot="dropdown-menu-sub-trigger"
      className={cn(menuRowClass, 'data-[state=open]:bg-alpha-white-6 data-[state=open]:text-ink', className)}
      {...props}
      ref={sub?.setTrigger}
    >
      {children}
      <SubmenuArrow />
    </DropdownMenuPrimitive.SubTrigger>
  )
}

function DropdownMenuSubContent({
  className,
  sideOffset = SUBMENU_SIDE_OFFSET,
  alignOffset = SUBMENU_ALIGN_OFFSET,
  onEscapeKeyDown,
  ...props
}: ComponentProps<typeof DropdownMenuPrimitive.SubContent>) {
  const sub = useContext(SubStateContext)
  return (
    <OverlayPortal portal={DropdownMenuPrimitive.Portal}>
      <DropdownMenuPrimitive.SubContent
        data-slot="dropdown-menu-sub-content"
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
  DropdownMenu,
  DropdownMenuPortal,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
}
