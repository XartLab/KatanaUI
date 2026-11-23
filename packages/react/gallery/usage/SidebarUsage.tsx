// SPDX-License-Identifier: MIT
import { Sidebar } from '../../src/index'

export function SidebarUsage() {
  return (
    <Sidebar side="start" sideWidth={240} gap="space-3">
      <nav aria-label="目录">窄的一块（第一个子节点）</nav>
      <main>宽的一块（最后一个子节点）</main>
    </Sidebar>
  )
}
