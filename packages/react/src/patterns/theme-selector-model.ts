// SPDX-License-Identifier: MIT
// ThemeSelector 的键盘规则（纯函数）：方向键与 Home / End 移到哪一张，到头循环。

/** Index to select after an arrow key, Home or End in the theme radiogroup; null for other keys. Wraps around. */
export function nextThemeIndex(key: string, index: number, count: number): number | null {
  if (count <= 0) return null
  if (key === 'Home') return 0
  if (key === 'End') return count - 1
  if (key === 'ArrowRight' || key === 'ArrowDown') return (index + 1) % count
  if (key === 'ArrowLeft' || key === 'ArrowUp') return (index - 1 + count) % count
  return null
}
