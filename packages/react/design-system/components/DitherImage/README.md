# DitherImage

把图片按 Bayer、Atkinson、Floyd-Steinberg 或阈值算法量化成 2 到 8 档，画成像素块；档位色默认取主题的墨色与底色，也可传色阶。progressive 时滚进视口再自上而下擦出。适合首页、文档的像素风配图；图要允许跨域读取。

## Provide

`*` marks a required prop.

### DitherImage

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `algorithm` | `DitherAlgorithm` | `'bayer'` | Dithering kernel used to quantise the image. |
| `alt` * | `string` | — | Alternative text. |
| `className` | `string` | — | Extra classes for the wrapper. |
| `height` | `number` | `DEFAULT_HEIGHT` | Rendered height in CSS pixels. |
| `levels` | `number` | `DEFAULT_LEVELS` | Number of tones in the ramp, clamped to `2`–`8`. |
| `palette` | `string[]` | — | Colour ramp, dark to light. |
| `pixelSize` | `number` | `DEFAULT_PIXEL_SIZE` | Size of one dithered block in CSS pixels. |
| `progressive` | `boolean` | `false` | Wipe the dithered pass in when the image scrolls into view. |
| `src` * | `string` | — | Image URL. |
| `width` | `number` | `DEFAULT_WIDTH` | Rendered width in CSS pixels. |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { DitherImage } from '@katana-ui/react'

export function DitherImageUsage() {
  return (
    <DitherImage
      alt="Sample chart"
      algorithm="atkinson"
      height={120}
      src="data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw=="
      width={200}
    />
  )
}
```

## States

- 加载：先显示原图。
- 就绪：抖动层淡入盖住原图。
- progressive：进入视口前抖动层被裁掉，进入后擦出。
- 读取失败：一直显示原图。

## Don't

- 不要拿它显示图表：量化后的数值读不出。
- 不要给很大的尺寸：抖动在主线程里算，图越大越久。

## Composition

```
DitherImage
  img（原图，alt）
  motion.canvas（aria-hidden，抖动层）
```
