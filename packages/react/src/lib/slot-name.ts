// SPDX-License-Identifier: MIT
import { createElement, type ElementType } from 'react'

/**
 * UI SDK 的部件自带 data-slot，写在我们传的 props 之后，会把我们的名字盖掉。
 * 样式（theme/*.css）、测试和 KATANAview 的选择器认的是我们原来的 slot 名，不能变；用部件的 render 把原名写回去（#263）。
 */
export const slotName =
  (name: string, tag: ElementType = 'div') =>
  (props: Record<string, unknown>) =>
    createElement(tag, { ...props, 'data-slot': name })

/** 调用方能改 slot 名（Radix 时代 `{...props}` 在后，写 data-slot 就能盖掉默认名；UI SDK 的件把自己的名字写在最后，所以换成 render 写回）。 */
export type SlotOverride = {
  /** Replaces the default data-slot name, which styles and selectors key on. */
  'data-slot'?: string
}
