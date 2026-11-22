# Menubar

一排顶层菜单（文件、视图、运行）：方向键在它们之间走，一个开着时划到别的自动换开；面板用下拉菜单同一套皮肤与入场。

## Provide

`*` marks a required prop.

### Menubar

其余属性透传给 Radix Menubar.Root。

### MenubarMenu / MenubarTrigger / MenubarContent

一个顶层菜单的入口与面板，透传 Radix 同名部件。

### MenubarItem / MenubarSeparator

面板里的行与分隔线，透传 Radix 同名部件。

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { Menubar, MenubarContent, MenubarItem, MenubarMenu, MenubarSeparator, MenubarTrigger } from '@katana-ui/react'

export function MenubarUsage() {
  return (
    <Menubar>
      <MenubarMenu>
        <MenubarTrigger>File</MenubarTrigger>
        <MenubarContent>
          <MenubarItem>New strategy</MenubarItem>
          <MenubarItem>Import data</MenubarItem>
          <MenubarSeparator />
          <MenubarItem>Export report</MenubarItem>
        </MenubarContent>
      </MenubarMenu>
      <MenubarMenu>
        <MenubarTrigger>View</MenubarTrigger>
        <MenubarContent>
          <MenubarItem>Compact rows</MenubarItem>
        </MenubarContent>
      </MenubarMenu>
    </Menubar>
  )
}
```

## States

- 关闭：只有触发器一排。
- 打开：面板从触发处轻升；再划到旁边的触发器，直接换开。
- 禁用的行不高亮、不可选。

## Don't

- 不要把它当应用导航：整页导航用 SideNav，带大块说明的顶栏用 NavigationMenu。
- 不要嵌套超过两层。

## Composition

```
Menubar
  MenubarMenu
    MenubarTrigger
    MenubarContent
      MenubarItem
      MenubarSeparator
```

## Keyboard

- `← →`：在顶层菜单之间走
- `↓ / Enter`：打开菜单
- `Esc`：关闭
