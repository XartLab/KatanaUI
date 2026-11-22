# TextMorph

把一串字变成另一串：按字（或词）对比，两边都有的沿用同一个 key、用布局动画滑到新位置，没了的缩着出去，新来的弹着进来。价格 106,977.4 变 107,011.0 时没变的位置不动；订单状态词整个换。

## Provide

`*` marks a required prop.

### TextMorph

完整文字放在 sr-only，逐字是 aria-hidden；根元素用 as 换成标题或段落。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `align` | `TextMorphAlign` | `'start'` | Justifies the token row when the wrapper is wider than the text. |
| `as` | `TextMorphTag` | `'span'` | Element rendered for the wrapper. |
| `className` | `string` | — | Extra class names for the root element. |
| `duration` | `number` | `250` | Spring duration for each token, in milliseconds. |
| `mode` | `TextMorphMode` | `'characters'` | Splits the diff on graphemes or whole words. |
| `stagger` | `number` | `16` | Per-token stagger, in milliseconds; capped so long strings stay snappy. |
| `text` * | `string` | — | The current string; changing it triggers the morph. |

### morphTokens

纯函数 (text, mode)：切成片并给 key，同一个字第二次出现是「字-1」，对比才能一一对上。

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { useState } from 'react'
import { TextMorph } from '@katana-ui/react'

export function TextMorphUsage() {
  const [filled, setFilled] = useState(false)
  return (
    <>
      <TextMorph mode="words" text={filled ? 'Filled' : 'Pending approval'} />
      <button type="button" onClick={() => setFilled((value) => !value)}>
        Toggle
      </button>
    </>
  )
}
```

## States

- 文字没变：静止。
- 文字变了：共有的字滑到新位置，多出的字弹入，没了的字缩出。

## Don't

- 不要用在要逐位翻滚方向的数字上：涨跌方向的里程表式滚动用 RollingText。
- 不要放整段正文：每个字一个动画节点，字多了会卡。

## Composition

```
TextMorph
  span.sr-only
  motion.span（排列容器，layout）
    motion.span（一个字或词，aria-hidden）
```
