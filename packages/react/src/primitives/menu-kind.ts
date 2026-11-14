// SPDX-License-Identifier: MIT
import { createContext } from 'react'

/**
 * 当前在哪种菜单里面：下拉菜单还是右键菜单。Radix 的项只认自己家的菜单（DropdownMenu.Item 放进 ContextMenu.Content 会报
 * 「MenuItem must be used within Menu」，两家的上下文是各自一份），而「数据 → 菜单项」这类共用的渲染（MenuEntries、面板目录）
 * 两种菜单里都要用，所以内容组件把种类放进上下文，menu-any.tsx 的 useMenuParts() 按它挑对应那一套零件。
 */
export type MenuKind = 'dropdown' | 'context'
export const MenuKindContext = createContext<MenuKind>('dropdown')
