# WordBuild

一句话一个词一个词地搭起来，停一会儿，整句退场，再搭下一句。from="right" 是新词从右边进来、把一行推到居中（SmoothUI kinetic-center-build）；from="top" 是新词从上方落下、叠成一列（short-slide-down）。适合一句话的市场摘要、AI 的一行结论。

## Provide

`*` marks a required prop.

### WordBuild

外层是 aria-live=polite；读屏读到的是已经出现的词。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `className` | `string` | — | Extra class names for the root element. |
| `from` | `WordBuildFrom` | `'right'` | Which way new words arrive: from the right and push one centred line, or from above and stack into a column. |
| `hold` | `number` | `2500` | How long a finished phrase stays before it leaves, in milliseconds. |
| `phrases` * | `readonly string[]` | — | The phrases to build one after another. |
| `wordInterval` | `number` | — | Overrides the delay between one word and the next, in milliseconds. |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { WordBuild } from '@katana-ui/react'

export function WordBuildUsage() {
  return <WordBuild phrases={['Fed holds rates steady', 'Yields fall, equities rally']} />
}
```

## States

- 搭建中：每隔 wordInterval 毫秒多出一个词。
- 搭好：停 hold 毫秒。
- 退场：整句淡出并略位移，然后换下一句；只有一句时搭好就停住。

## Don't

- 不要用来显示需要一眼读完的关键数据：词是慢慢出现的，读完整句要等。

## Composition

```
WordBuild
  AnimatePresence
    motion.span（一个词）
```
