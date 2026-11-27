// SPDX-License-Identifier: MIT
// 改自 SmoothUI toggle（https://github.com/educlopez/smoothui ，MIT，© 2024 Eduardo Calvo）：行为底座是 Radix Toggle（aria-pressed 的开关按钮），按下缩放取自它；皮肤用我们的按钮与分段的 token。
import { Toggle as ToggleRoot } from '@ui-sdk/react/toggle'
import type { ComponentProps } from 'react'
import { cn } from '../lib/cn.ts'
import { buttonSizeOf, buttonVariants, type ButtonSize } from './button.tsx'

/**
 * 单个开关按钮：按下是「开」（aria-pressed），再按是「关」；工具条里的「显示均线」「跟随最新」这类。
 * 外形是 Button，开的时候用分段选中的底与字（--seg-on-bg / --seg-on-ink），对容器底 ≥ 3:1。
 */
function Toggle({
  className,
  size: sizeProp,
  ...props
}: ComponentProps<typeof ToggleRoot> & {
  /** Height: md (default) is 30px, sm is 26px, icon is a 28px square; `'default'` is the deprecated name of md. */
  size?: ButtonSize | 'default'
}) {
  const size = buttonSizeOf(sizeProp)
  return (
    <ToggleRoot
      data-slot="toggle"
      data-size={size}
      className={cn(
        buttonVariants({ variant: 'default', size }),
        'data-pressed:border-transparent data-pressed:bg-(--seg-on-bg) data-pressed:font-bold data-pressed:text-(color:--seg-on-ink)',
        'not-disabled:data-pressed:hover:bg-(--seg-on-bg) not-disabled:data-pressed:hover:text-(color:--seg-on-ink)',
        className,
      )}
      {...props}
    />
  )
}

export { Toggle }
