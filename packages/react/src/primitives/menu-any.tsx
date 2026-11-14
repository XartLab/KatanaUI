// SPDX-License-Identifier: MIT
import { useContext } from 'react'
import {
  ContextMenuCheckboxItem,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
} from './context-menu'
import {
  DropdownMenuCheckboxItem,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from './dropdown-menu'
import { MenuKindContext } from './menu-kind'

const dropdown = {
  Item: DropdownMenuItem,
  CheckboxItem: DropdownMenuCheckboxItem,
  Separator: DropdownMenuSeparator,
  Label: DropdownMenuLabel,
  Group: DropdownMenuGroup,
  Sub: DropdownMenuSub,
  SubTrigger: DropdownMenuSubTrigger,
  SubContent: DropdownMenuSubContent,
} as const

// 两套零件的属性几乎一样（都是 Radix 的菜单项）：对外是两套的联合，TypeScript 要求属性同时满足两边，共用的渲染只能用两边都有的属性。
const context = {
  Item: ContextMenuItem,
  CheckboxItem: ContextMenuCheckboxItem,
  Separator: ContextMenuSeparator,
  Label: ContextMenuLabel,
  Group: ContextMenuGroup,
  Sub: ContextMenuSub,
  SubTrigger: ContextMenuSubTrigger,
  SubContent: ContextMenuSubContent,
} as const

/** 当前菜单（下拉或右键）对应的一套项零件：数据驱动的菜单渲染（MenuEntries、面板目录）在两种菜单里共用同一份代码。 */
export function useMenuParts(): typeof dropdown | typeof context {
  return useContext(MenuKindContext) === 'context' ? context : dropdown
}
