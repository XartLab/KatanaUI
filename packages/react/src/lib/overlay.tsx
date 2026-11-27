// SPDX-License-Identifier: MIT
import { createContext, useContext, type ComponentType, type ReactNode } from 'react'

// UI SDK 的浮层渲染在顶层（top layer），不进 Portal。服务端渲染也能直接出标记，但静态预览里浮层默认是「关」的；
// 包在 InlineOverlays 里的浮层内容改成原地渲染（UI SDK 的 inline：不浮在页面上方，位置交给样式），
// 设计系统包的预览与组件截图靠它摆出「打开的样子」（#1862）。应用里不用。
const InlineContext = createContext(false)

/** 渲染静态预览用：里面的浮层内容（Tooltip、Popover、Dialog、菜单、Select 的内容）原地渲染。 */
export function InlineOverlays({ children }: { children: ReactNode }) {
  return <InlineContext value={true}>{children}</InlineContext>
}

/** 是否在 InlineOverlays 里；浮层内容据此给 UI SDK 的 inline。 */
export function useInlineOverlays() {
  return useContext(InlineContext)
}

/** 还留在 Radix 上的浮层（菜单、Select、导航菜单）的 Portal：平时就是 Radix 的 Portal，在 InlineOverlays 里原地渲染。 */
export function OverlayPortal({
  portal: Portal,
  children,
}: {
  portal: ComponentType<{ children?: ReactNode }>
  children: ReactNode
}) {
  return useContext(InlineContext) ? <>{children}</> : <Portal>{children}</Portal>
}
