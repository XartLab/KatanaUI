// SPDX-License-Identifier: MIT
import { createContext, useContext, type ComponentType, type ReactNode } from 'react'

// 浮层默认进 Portal（挂到 body 上）。服务端渲染没有 Portal，静态预览里浮层就看不见：
// 包在 InlineOverlays 里的浮层内容原地渲染，不进 Portal，设计系统包的预览靠它摆出「打开的样子」（#1862）。应用里不用。
const InlineContext = createContext(false)

/** 渲染静态预览用：里面的浮层内容（Tooltip、Popover、Dialog、菜单、Select 的内容）原地渲染，不进 Portal。 */
export function InlineOverlays({ children }: { children: ReactNode }) {
  return <InlineContext value={true}>{children}</InlineContext>
}

/** 浮层内容的 Portal：平时就是 Radix 的 Portal，在 InlineOverlays 里原地渲染。 */
export function OverlayPortal({
  portal: Portal,
  children,
}: {
  portal: ComponentType<{ children?: ReactNode }>
  children: ReactNode
}) {
  return useContext(InlineContext) ? <>{children}</> : <Portal>{children}</Portal>
}
