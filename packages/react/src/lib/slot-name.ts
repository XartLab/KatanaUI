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
