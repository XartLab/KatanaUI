# TextSwap

一句话换成下一句：旧的出、新的进。fade-through（Material 淡入淡出）、axis-x（向左滑出、从右滑入）、axis-z（缩放与景深）、word-cut（逐词硬切的阶梯）、slide-right（整句从左滑入、词依次显现）五种换法，对应 SmoothUI 的 fade-through、shared-axis-x/y/z、short-slide-right。自己轮播，或给 index 由外面控制（切换视图时让标签跟着换）。

## Provide

`*` marks a required prop.

### TextSwap

外层是 aria-live=polite，换句时读屏播报新句。给了 index 就不再自己轮播。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `className` | `string` | — | Extra class names for the root element. |
| `index` | `number` | — | The shown phrase when you drive it yourself; leave it out to let `interval` cycle. |
| `interval` | `number` | `2500` | Milliseconds between automatic swaps; 0 turns cycling off. |
| `onIndexChange` | `(index: number) => void` | — | Called with the next index whenever the component cycles by itself. |
| `phrases` * | `readonly string[]` | — | The phrases to swap between. |
| `variant` | `TextSwapVariant` | `'fade-through'` | fade-through (Material fade), axis-x (slide left), axis-z (scale and depth), word-cut (hard-cut word staircase) or slide-right (glide in, words fade in turn). |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { useState } from 'react'
import { TextSwap } from '@katana-ui/react'

const HEADLINES = ['Fed holds rates steady', 'NVDA beats on data center demand']

export function TextSwapUsage() {
  const [index, setIndex] = useState(0)
  return (
    <>
      <TextSwap phrases={HEADLINES} />
      <button type="button" onClick={() => setIndex((value) => (value + 1) % HEADLINES.length)}>
        Next
      </button>
      <TextSwap index={index} phrases={HEADLINES} variant="axis-x" />
    </>
  )
}
```

## States

- 没给 index：每 interval 毫秒换到下一句，循环。
- 给了 index：只跟着 index 换，interval 不起作用。
- interval 为 0 或只有一句：不换。

## Don't

- 不要用它显示价格这类每秒都在变的数字：aria-live 会不停播报，数字用 RollingText 或 TextMorph。
- 不要放很长的句子：换句期间会按最宽的一句撑开，长短差得多时版面会跳。

## Composition

```
TextSwap
  AnimatePresence
    motion.span（当前这一句，按 key 换）
```
