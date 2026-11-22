# RansomNote

文字像从报纸上剪下的纸片：每个字有自己的字体、底色、倾斜与大小，由种子决定（同种子同文字同排布）；可以飞进来拼好，或一直轻轻抖。纯装饰，与交易数据无关，给空状态和品牌页用；纸色与字体都取我们的 token。

## Provide

`*` marks a required prop.

### RansomNote

整句放在 sr-only，纸片是 aria-hidden。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `animate` | `RansomNoteAnimate` | `'assemble'` | How the scraps behave: fly in and assemble, wobble in place, or stay still. |
| `className` | `string` | — | Extra class names for the root element. |
| `fonts` | `readonly string[]` | `DEFAULT_FONTS` | Font-family values to pick from for each character; defaults to the font tokens. |
| `intensity` | `number` | `0.6` | How wild the per-character variation gets, from 0 (subtle) to 1 (chaotic). |
| `palette` | `readonly string[]` | `DEFAULT_PALETTE` | Background colors for the paper scraps; defaults to the panel background tokens. |
| `rotation` | `number` | `8` | Maximum rotation of any scrap, in degrees. |
| `seed` | `number` | `1` | Seed of the layout: the same seed and text always give the same scraps. |
| `stagger` | `number` | `0.03` | Delay between one scrap's entrance or wobble and the next, in seconds. |
| `text` * | `string` | — | The text to cut into scraps. |

### createSeededRandom

纯函数 (seed)：返回一个同种子同序列的随机数函数（mulberry32）。

### ransomScraps

纯函数 (文字, 种子, 强度, 角度, 字体, 纸色)：算每张纸片的字体、底色、倾斜、大小与进场偏移。

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { RansomNote } from '@katana-ui/react'

export function RansomNoteUsage() {
  return <RansomNote seed={7} text="No signal" />
}
```

## States

- assemble：纸片从随机的位置与角度飞来拼好。
- jitter：纸片在原位轻轻抖。
- none：静止。

## Don't

- 不要放数据或需要认真读的内容：纸片的字体和倾斜是故意不统一的。

## Composition

```
RansomNote
  div
    span.sr-only
    div（aria-hidden）
      motion.span（一张纸片）
```
