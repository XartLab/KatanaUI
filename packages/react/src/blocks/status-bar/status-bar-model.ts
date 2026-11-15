// SPDX-License-Identifier: MIT
// StatusBar 的纯函数：宽度不够时收起哪些项（#1901）。

export type FitItem = {
  id: string
  /** 这一项画出来的宽度（px）。 */
  width: number
  /** 越大越晚被收起；默认 0。 */
  priority: number
  /** 不可收起（实盘账户、未闭合对账这类安全语义的项，组件卡 StatusBar「不可被主题隐藏」）。 */
  pinned: boolean
}

/**
 * 在 available 宽度里放下 items（按给定次序排，项间距 gap）：放不下就一项项收起，先收优先级最低的，同级收排在后面的；pinned 不收。
 * 有项被收起时要留出「更多」按钮的 moreWidth。返回被收起的 id；pinned 项加起来都放不下时也只收起能收的，不裁 pinned。
 */
export function collapsedItems(items: readonly FitItem[], available: number, gap: number, moreWidth: number): string[] {
  const used = (hidden: ReadonlySet<string>) => {
    const shown = items.filter((item) => !hidden.has(item.id))
    const total = shown.reduce((sum, item) => sum + item.width, 0) + Math.max(0, shown.length - 1) * gap
    return hidden.size > 0 ? total + gap + moreWidth : total
  }
  const hidden = new Set<string>()
  const order = items
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => !item.pinned)
    .sort((a, b) => a.item.priority - b.item.priority || b.index - a.index)
  for (const { item } of order) {
    if (used(hidden) <= available) break
    hidden.add(item.id)
  }
  return items.filter((item) => hidden.has(item.id)).map((item) => item.id)
}
