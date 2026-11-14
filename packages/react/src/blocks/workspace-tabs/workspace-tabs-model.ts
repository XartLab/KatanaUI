// SPDX-License-Identifier: MIT
// WorkspaceTabs 的纯函数：放不下时哪些标签留在条上（#1901）。

/**
 * widths：每个标签画出来的宽度（按工作区次序）；available：条上给标签的宽度；moreWidth：「更多」按钮的宽度。
 * 返回留在条上的标签序号（按显示次序）：全放得下就全留；否则尽量多放前面的，给「更多」留出位置；
 * 当前标签始终可见——它在被收起的那一段里时，换掉最后一个可见的标签（组件卡 WorkspaceTabs）。至少留一个。
 */
export function visibleTabs(
  widths: readonly number[],
  activeIndex: number,
  available: number,
  moreWidth: number,
): number[] {
  const all = widths.map((_, index) => index)
  const sum = (indices: readonly number[]) => indices.reduce((total, index) => total + (widths[index] ?? 0), 0)
  if (sum(all) <= available) return all
  const room = available - moreWidth
  let count = 0
  while (count < widths.length && sum(all.slice(0, count + 1)) <= room) count++
  count = Math.max(count, 1)
  if (activeIndex < count) return all.slice(0, count)
  // 当前标签在被收起的一段：它占最后一格，前面的按剩下的宽度放
  let head = all.slice(0, count - 1)
  while (head.length > 0 && sum([...head, activeIndex]) > room) head = head.slice(0, -1)
  return [...head, activeIndex]
}
