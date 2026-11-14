// SPDX-License-Identifier: MIT

/**
 * 键盘焦点环：读 characteristics 的 --k-focused-*（颜色取全局焦点环 token --focus-ring，2px 实线，外移 2px，#471、#1943）。鼠标点击不画（focus-visible）。
 * 基础写 outline-0 而不是 outline-none：Tailwind 的 outline-none 会把 --tw-outline-style 设成 none，后面的 outline-2 就画不出来。
 * 菜单项这类贴边的行用 focusRingInset，环画在里面，免得被菜单的圆角与滚动裁掉。
 */
export const focusRing =
  'outline-0 focus-visible:outline-(length:--k-focused-outlineWidth) focus-visible:outline-offset-(--k-focused-outlineOffset) focus-visible:outline-(color:--k-focused-outlineColor)'
export const focusRingInset =
  'outline-0 focus-visible:outline-(length:--k-focused-outlineWidth) focus-visible:-outline-offset-2 focus-visible:outline-(color:--k-focused-outlineColor)'
