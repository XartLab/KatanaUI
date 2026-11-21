// SPDX-License-Identifier: MIT
// 排版原语的间距：只收 @katana-ui/tokens 里 spacing 刻度的名字（packages/tokens/src/tokens.json 的 spacing.tokens 里 space-* 那几项），
// 不收数字，所以间距换了刻度，所有原语跟着变。次序是从小到大的像素值：2 · 4 · 6 · 8 · 12 · 16 · 20 · 24 · 32。
// 单测（layout.test.tsx）拿这张表跟 tokens.json 对账：刻度改名或加减，这里不改就红。

/** 间距刻度名，从小到大。 */
export const SPACE_STEPS = [
  'space-hair',
  'space-1',
  'space-dense',
  'space-2',
  'space-3',
  'space-4',
  'space-5',
  'space-6',
  'space-8',
] as const

/** 一个间距刻度名（如 `'space-3'`）。 */
export type SpaceStep = (typeof SPACE_STEPS)[number]

/** 刻度名 → CSS 值（`var(--space-3)`），写进原语的自定义属性。 */
export const spaceVar = (step: SpaceStep): string => `var(--${step})`

/** 原语可以渲染成的元素：容器与列表的语义标签。 */
export type LayoutTag = 'div' | 'section' | 'article' | 'aside' | 'header' | 'footer' | 'nav' | 'main' | 'ul' | 'ol'
