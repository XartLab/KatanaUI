// SPDX-License-Identifier: MIT
// 起步代码取自 shadcn/ui（https://ui.shadcn.com ，MIT，Copyright (c) 2023 shadcn），2026-11-11 用 `shadcn add` 生成（#1777），行为底座是 Radix；
// 拷进来以后归我们改：样子（尺寸、颜色、动效）按 OpenMarket 实测样式与我们的 token 重写（决策记录 0049）。
import { Checkbox as CheckboxPrimitive } from 'radix-ui'
import type { ComponentProps } from 'react'
import { cn } from '../lib/cn'
import { focusRing } from '../lib/focus'

// 勾选方块：照组件卡（design/katana-console/project/components/Controls/README.md「Checkbox」）：14 × 14 凹陷方框（圆角 2 · 1px 线 · recess），
// 选中后中心一块 6 × 6 的强调色发光方块，像一颗 LED；选中的框是暗橙边加暗橙底。数值照旧皮肤（#1777 之前的 .k-ck-box）。
// Radix 的勾选有第三种状态 indeterminate，调用方不用就只传 true / false。
function Checkbox({ className, ...props }: ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        'peer inline-flex size-[14px] shrink-0 cursor-pointer items-center justify-center rounded-[var(--radius-sm)] border border-line-strong bg-surface-0 p-0',
        'shadow-[var(--recess)] transition-colors duration-150',
        'data-[state=checked]:border-(--signal-orange-dim) data-[state=checked]:bg-[color-mix(in_srgb,var(--signal-orange)_20%,var(--bg-000))]',
        'disabled:cursor-not-allowed disabled:opacity-40',
        'aria-invalid:border-danger',
        focusRing,
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="block size-[6px] bg-(--signal-orange) shadow-[var(--glow-orange)]"
      />
    </CheckboxPrimitive.Root>
  )
}

export { Checkbox }
