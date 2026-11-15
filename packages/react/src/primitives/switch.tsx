// SPDX-License-Identifier: MIT
// 起步代码取自 shadcn/ui（https://ui.shadcn.com ，MIT，Copyright (c) 2023 shadcn），2026-11-11 用 `shadcn add` 生成（#1777），行为底座是 Radix；
// 拷进来以后归我们改：样子（尺寸、颜色、动效）按 OpenMarket 实测样式与我们的 token 重写（决策记录 0049）。
import { Switch as SwitchPrimitive } from 'radix-ui'
import type { ComponentProps } from 'react'
import { cn } from '../lib/cn.ts'
import { focusRing } from '../lib/focus.ts'

// 拨动开关（#352）：外层盒 40 × 28（--target-min，行高、右对齐位置、焦点环都按它），里面可见的轨道 34 × 18（switch-track）· 圆钮 14。
// 开时轨道用强调色、圆钮换成最深的底色滑到右边：状态对相邻颜色要 3:1（WCAG 1.4.11，#477，用户 2026-10-21 定：静止边框照 OpenMarket 不动，只把状态做到 3:1）。
// 状态在 aria-checked 上，不靠颜色一个通道传达（圆钮的位置也变）。
function Switch({ className, ...props }: ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        'group relative inline-flex h-(--target-min) w-10 shrink-0 cursor-pointer items-center rounded-full border-0 bg-transparent p-0',
        'disabled:cursor-not-allowed disabled:opacity-45',
        focusRing,
        className,
      )}
      {...props}
    >
      <span
        data-slot="switch-track"
        aria-hidden
        className={cn(
          'pointer-events-none absolute inset-x-[3px] inset-y-[5px] rounded-full',
          'bg-alpha-white-10 shadow-[inset_0_0_0_1px_var(--alpha-white-9)] transition-[background-color,box-shadow] duration-150',
          'group-enabled:group-hover:bg-alpha-white-11 group-data-[state=checked]:bg-ink group-data-[state=checked]:shadow-none',
          'group-data-[state=checked]:group-enabled:group-hover:bg-ink-2',
        )}
      />
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className="pointer-events-none relative ml-[5px] block size-[14px] translate-x-0 rounded-full bg-ink-3 shadow-[0_1px_2px_rgba(0,0,0,0.5)] data-[state=checked]:translate-x-[16px] data-[state=checked]:bg-surface-0"
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }
