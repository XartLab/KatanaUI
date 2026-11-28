// SPDX-License-Identifier: MIT
// 起步代码取自 shadcn/ui（https://ui.shadcn.com ，MIT，Copyright (c) 2023 shadcn），2026-11-14 用 `shadcn add` 生成（#1870），行为底座是 Radix；
// 拷进来以后归我们改：尺寸、颜色、动效按我们的 token 重写（决策记录 0049）。
import { Separator as SeparatorRoot } from '@ui-sdk/react/separator'
import type { ComponentProps } from 'react'
import { cn } from '../lib/cn.ts'

// 分隔线：1px，取 line 色（跟菜单里的分隔线同一条白线）。decorative 默认为真：只是画一道线，读屏不报；
// 真的把两块内容分成两个区域、要读屏知道的传 decorative={false}（会给 role=separator 与 aria-orientation）。
function Separator({
  className,
  orientation = 'horizontal',
  decorative = true,
  ...props
}: ComponentProps<typeof SeparatorRoot>) {
  return (
    <SeparatorRoot
      data-slot="separator"
      decorative={decorative}
      orientation={orientation}
      className={cn(
        'shrink-0 bg-(--k-separable-tertiary-borderColor) data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-px',
        className,
      )}
      {...props}
    />
  )
}

export { Separator }
