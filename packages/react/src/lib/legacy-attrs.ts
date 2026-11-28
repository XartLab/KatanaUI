// SPDX-License-Identifier: MIT
import { createElement, type ElementType } from 'react'

/**
 * 迁移前（Radix 时代）的 data-state 与几个属性，写回 UI SDK 的部件上（#263 审计，2026-11-28 用户定：UI SDK 只换交互行为，
 * data-* 的名与值以迁移前为准）。样式（theme/*.css、类名里的 data-[state=…]）、测试和 KATANAview 的选择器读的是 data-state；
 * UI SDK 自己的 data-checked / data-open / data-selected / data-pressed 仍在，这里只是在它们旁边补回原来的。
 * 值从部件的 props 里已有的 UI SDK 属性推出来，跟它们在同一次渲染里变，不会晚一拍。
 */
type Props = Record<string, unknown>

const has = (props: Props, name: string) => props[name] !== undefined && props[name] !== false

/** 各件迁移前 data-state 的取值：展开类 open / closed，勾选类 checked / unchecked / indeterminate，页签 active / inactive，开关按钮 on / off，进度 loading / complete / indeterminate，滚动条 visible / hidden。 */
export const legacyState = {
  open: (props: Props) => (has(props, 'data-open') ? 'open' : 'closed'),
  checked: (props: Props) =>
    has(props, 'data-indeterminate') ? 'indeterminate' : has(props, 'data-checked') ? 'checked' : 'unchecked',
  tab: (props: Props) => (has(props, 'data-selected') ? 'active' : 'inactive'),
  pressed: (props: Props) => (has(props, 'data-pressed') ? 'on' : 'off'),
  visible: (props: Props) => (has(props, 'data-visible') ? 'visible' : 'hidden'),
} satisfies Record<string, (props: Props) => string>

type PartOptions = {
  /** 写回 data-slot：UI SDK 的部件把自己的名字写在我们传的 props 之后，会盖掉我们的（样式与选择器认原名）。 */
  slot?: string
  /** 写回 data-state。 */
  state?: (props: Props) => string
  /** 部件有 data-disabled 时同时写原生 disabled：UI SDK 的禁用件用 aria-disabled 留在 Tab 顺序里，原来（Radix）是原生禁用、Tab 跳过它。 */
  nativeDisabled?: boolean
  /** 其余要补的属性（data-orientation、data-value、value 之类）。 */
  extra?: (props: Props) => Props
}

/**
 * 给 UI SDK 部件的 `render` 用：它把部件的 props 交给这个函数，函数把 slot、data-state 等写回后画出元素。
 * ref、事件、UI SDK 自己的属性原样带着，所以只改写回的那几项。
 */
export const part =
  (tag: ElementType, options: PartOptions = {}) =>
  (props: Props) =>
    createElement(tag, {
      ...props,
      ...(options.slot ? { 'data-slot': options.slot } : null),
      ...(options.state ? { 'data-state': options.state(props) } : null),
      ...(options.nativeDisabled && has(props, 'data-disabled') ? { disabled: true } : null),
      ...options.extra?.(props),
    })

/**
 * 回车也拨动开关（迁移前 Radix 的开关是原生按钮，回车就是点击；UI SDK 的开关只认空格，回车被它拦下）。
 * 放在 onKeyDown 上：UI SDK 的 props 合并让后写的先跑，这里先把回车变成一次点击。
 */
export const pressOnEnter = (event: {
  key: string
  defaultPrevented: boolean
  preventDefault(): void
  currentTarget: HTMLElement
}) => {
  if (event.key !== 'Enter' || event.defaultPrevented) return
  event.preventDefault()
  event.currentTarget.click()
}
