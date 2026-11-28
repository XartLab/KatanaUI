// SPDX-License-Identifier: MIT
// 起步代码取自 shadcn/ui（https://ui.shadcn.com ，MIT，Copyright (c) 2023 shadcn），2026-11-11 用 `shadcn add` 生成（#1777），行为底座已换成 UI SDK（@ui-sdk/react，#263）；
// 拷进来以后归我们改：样子（尺寸、颜色、动效）按 OpenMarket 实测样式与我们的 token 重写（决策记录 0049）。
import { Checkbox as CheckboxRoot, CheckboxIndicator } from '@ui-sdk/react/checkbox'
import type { ComponentProps } from 'react'
import { cn } from '../lib/cn.ts'
import { focusRing } from '../lib/focus.ts'
import { legacyState, part } from '../lib/legacy-attrs.ts'

// 勾选方块：照组件卡（design/katana-console/project/components/Controls/README.md「Checkbox」）：14 × 14 凹陷方框（圆角 2 · 1px 线 · recess），
// 选中后中心一块 6 × 6 的方块（不发光，发光只给状态灯）；选中的框是亮中性（ink-100）底，中心一块深色方块。数值照旧皮肤（#1777 之前的 .k-ck-box）。
// 勾选有第三种状态 indeterminate，调用方不用就只传 true / false。
function Checkbox({
  className,
  indicator = 'square',
  ...props
}: ComponentProps<typeof CheckboxRoot> & {
  /**
   * Mark inside the box: the default 6px square, or a tick (and dash when indeterminate) that draws itself with a stroke.
   * 框里的符号：默认 6px 方块；check 是一笔写出来的勾（半选是横杠），改自 SmoothUI checkbox。
   */
  indicator?: 'square' | 'check'
}) {
  return (
    <CheckboxRoot
      render={part('button', { slot: 'checkbox', state: legacyState.checked })}
      className={cn(
        'peer inline-flex size-[14px] shrink-0 cursor-pointer items-center justify-center rounded-[var(--radius-sm)] border border-(color:--k-separable-bold-borderColor) bg-(--k-surface-sunken-background) p-0',
        'shadow-[var(--recess)] transition-colors duration-150',
        'data-[state=checked]:border-(color:--k-selectable-bold-background-selected) data-[state=checked]:bg-(--k-selectable-bold-background-selected)',
        'disabled:cursor-not-allowed disabled:opacity-40',
        'aria-invalid:border-(color:--k-status-danger-foreground)',
        focusRing,
        className,
      )}
      {...props}
    >
      {/* 已选与半选的符号都弹进来（theme/form-motion.css）；半选的方块压成 2px 的横杠，不再和已选长得一样。 */}
      {indicator === 'check' ? (
        <CheckboxIndicator
          render={part('span', { slot: 'checkbox-indicator', state: legacyState.checked })}
          className="pointer-events-none block size-[10px] text-(color:--k-selectable-bold-foreground-selected)"
        >
          <svg
            data-slot="checkbox-mark"
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="block size-full"
            fill="none"
            stroke="currentColor"
            strokeWidth={4}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path data-mark="tick" pathLength={1} d="M20 6 9 17l-5-5" />
            <path data-mark="dash" pathLength={1} d="M5 12h14" />
          </svg>
        </CheckboxIndicator>
      ) : (
        <CheckboxIndicator
          render={part('span', { slot: 'checkbox-indicator', state: legacyState.checked })}
          className="pointer-events-none block size-[6px] bg-(--k-selectable-bold-foreground-selected) data-[state=indeterminate]:h-[2px]"
        />
      )}
    </CheckboxRoot>
  )
}

export { Checkbox }
