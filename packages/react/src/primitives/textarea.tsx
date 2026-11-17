// SPDX-License-Identifier: MIT
// 改自 SmoothUI textarea（https://github.com/educlopez/smoothui ，MIT，© 2024 Eduardo Calvo）：行为是原生 textarea，样子与 Input 同一套（multiline 变体），默认三行高。
import type { ComponentProps } from 'react'
import { cn } from '../lib/cn.ts'
import { inputSizeOf, inputVariants, type InputSize } from './input.tsx'

/** 多行文本框：与 Input 同一套皮肤，竖向可拖；rows 决定初始高度，下单备注、策略说明这类几行的文字用它。 */
function Textarea({
  className,
  size: sizeProp,
  rows = 3,
  ...props
}: Omit<ComponentProps<'textarea'>, 'size'> & {
  /** Font size: sm uses the data type size, md (default) the body size; `'default'` is the deprecated name of md. */
  size?: InputSize | 'default'
}) {
  const size = inputSizeOf(sizeProp)
  return (
    <textarea
      data-slot="textarea"
      data-size={size}
      rows={rows}
      className={cn(inputVariants({ size, multiline: true }), 'resize-y py-1.5', className)}
      {...props}
    />
  )
}

export { Textarea }
