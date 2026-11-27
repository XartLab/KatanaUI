# DropdownMenu

点触发器打开的菜单：普通项、勾选项、单选项、分组标题、分隔线、快捷键提示，二级菜单最多一层。

## Provide

`*` marks a required prop.

### DropdownMenu / DropdownMenuTrigger / DropdownMenuContent

其余属性透传给 Radix DropdownMenu 的同名部件。

### DropdownMenuItem

其余属性透传给 Radix DropdownMenu.Item。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `variant` | `'default' \| 'danger'` | `'default'` | Style of the row: danger uses the danger text color. |
| `bare` | `boolean` | — | Skip the row skin. |

### DropdownMenuCheckboxItem / DropdownMenuRadioGroup / DropdownMenuRadioItem

勾选项与单选组，透传 Radix 同名部件（checked / onCheckedChange、value / onValueChange）。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `bare` | `boolean` | — | Skip the row skin. |

### DropdownMenuSub / DropdownMenuSubTrigger / DropdownMenuSubContent

二级菜单。悬停 220ms 开；安全三角：斜着朝二级走时路过下一行不换不闪，停在三角里最多护 1.2s；滑出 360ms 才收。

### DropdownMenuLabel / DropdownMenuSeparator / DropdownMenuShortcut / DropdownMenuGroup / DropdownMenuPortal

分组标题、分隔线、快捷键提示（右对齐）、分组、传送门。

### menuContainerClass / menuRowClass / menuSeparatorClass

菜单容器、行、分隔线的类名，别的浮层（Popover 的 menu 皮肤、应用里的菜单）借它们长一个样。

### useMenuParts / MenuCheckColumn / MenuItemIcon / MenuItemLabel / MenuItemHint

行内的对齐列：勾选列、图标、文字、右侧提示；useMenuParts 让同一份菜单内容既能画在下拉菜单里也能画在右键菜单里。

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { Button, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@katana-ui/react'

export function DropdownMenuUsage() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button>Menu</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem>Add widget</DropdownMenuItem>
        <DropdownMenuItem variant="danger">Delete board</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
```

## States

- 行：默认、悬停、禁用、危险。
- 勾选行左侧占一列放勾。

## Don't

- 菜单项不超过一屏，更长的换命令面板。
- 不要拿它选表单里的一个值，那是 Select。
- 二级菜单不要超过一层。

## Composition

```
DropdownMenu
  DropdownMenuTrigger
  DropdownMenuContent
    DropdownMenuLabel
    DropdownMenuItem（含 DropdownMenuShortcut）
    DropdownMenuSeparator
    DropdownMenuCheckboxItem
    DropdownMenuRadioGroup
      DropdownMenuRadioItem
    DropdownMenuSub
      DropdownMenuSubTrigger
      DropdownMenuSubContent
```

## Keyboard

- `Enter / Space / ↓`：在触发器上打开
- `↑ ↓`：在项之间走
- `Enter / Space`：选中
- `→`：在二级菜单的触发行上打开二级
- `←`：收起二级，回到触发行
- `Esc`：收起当前一层
