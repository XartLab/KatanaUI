// SPDX-License-Identifier: MIT
// 起步代码取自 shadcn/ui（https://ui.shadcn.com ，MIT，Copyright (c) 2023 shadcn），2026-11-14 用 `shadcn add` 生成（#1870），行为底座是 Radix；
// 拷进来以后归我们改：尺寸、颜色、动效按我们的 token 重写（决策记录 0049）。
import { Label as LabelRoot } from '@ui-sdk/react/label'
import type { ComponentProps } from 'react'
import { cn } from '../lib/cn.ts'
import { slotName, type SlotOverride } from '../lib/slot-name.ts'

// 标签：UI SDK 的 Label（点它会聚焦关联的控件，双击不选中文字）。13px 档，次要文字色；禁用的控件旁边的标签（peer-disabled）降到 45%。
function Label({ className, 'data-slot': slot = 'label', ...props }: ComponentProps<typeof LabelRoot> & SlotOverride) {
  return (
    <LabelRoot
      render={slotName(slot, 'label')}
      className={cn(
        'k-text-data flex items-center gap-2 leading-none font-medium text-(color:--k-content-body-foreground) select-none peer-disabled:cursor-not-allowed peer-disabled:opacity-45',
        className,
      )}
      {...props}
    />
  )
}

export { Label }
