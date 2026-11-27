# NavigationMenu

顶栏上一排带下拉面板的入口：面板共用一个视口，在入口之间划动时按方向滑入滑出，宽高平滑过渡。

## Provide

`*` marks a required prop.

### NavigationMenu

其余属性透传给 Radix NavigationMenu.Root；视口内建。

### NavigationMenuList / NavigationMenuItem

入口的列表与单项，透传 Radix 同名部件。

### NavigationMenuTrigger / NavigationMenuContent / NavigationMenuLink

入口按钮（带箭头）、面板内容与面板里的链接，透传 Radix 同名部件。

### navigationMenuTriggerClass

入口按钮的类名，给要做成链接外观的单项（没有面板的入口）用。

## Usage

```tsx
// SPDX-License-Identifier: MIT
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@katana-ui/react'

export function NavigationMenuUsage() {
  return (
    <NavigationMenu>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger>Markets</NavigationMenuTrigger>
          <NavigationMenuContent>
            <NavigationMenuLink href="#">Watchlist</NavigationMenuLink>
            <NavigationMenuLink href="#">Sector heatmap</NavigationMenuLink>
          </NavigationMenuContent>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuTrigger>Research</NavigationMenuTrigger>
          <NavigationMenuContent>
            <NavigationMenuLink href="#">Backtests</NavigationMenuLink>
          </NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  )
}
```

## States

- 关闭：一排入口。
- 打开：面板在视口里长出来；换入口时按方向横向滑入。
- 当前链接（data-active）有底色。

## Don't

- 不要在面板里放要操作的表单：面板随指针离开会收起。
- 入口只有一两个并且没有面板时不要用它，直接放链接。

## Composition

```
NavigationMenu
  NavigationMenuList
    NavigationMenuItem
      NavigationMenuTrigger
      NavigationMenuContent
        NavigationMenuLink
```

## Keyboard

- `← →`：在入口之间走
- `↓ / Enter`：打开面板
- `Esc`：关闭
