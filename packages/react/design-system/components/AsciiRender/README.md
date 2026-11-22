# AsciiRender

把图片或视频按亮度采样成一屏字符，单色（读主题的墨色）或带原图着色；视频按 fps 重画，屏外与暂停时停。读屏读 alt。适合首页的氛围图、加载页的占位；图要允许跨域读取，读不了就退回原图。

## Provide

`*` marks a required prop.

### AsciiRender

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `alt` * | `string` | — | Description of the media. |
| `charset` | `string` | `DEFAULT_CHARSET` | Character ramp ordered dense to sparse. |
| `className` | `string` | — | Extra classes for the wrapper. |
| `color` | `AsciiColorMode` | `'mono'` | `mono` paints one theme colour, `source` tints the glyphs with the frame. |
| `columns` | `number` | `DEFAULT_COLUMNS` | Number of character columns sampled across the frame. |
| `fontSize` | `number` | `DEFAULT_FONT_SIZE` | Glyph size in pixels. |
| `fps` | `number` | `DEFAULT_FPS` | Frames per second for video sources. |
| `invert` | `boolean` | `false` | Flip the luminance-to-character mapping. |
| `paused` | `boolean` | `false` | Hold the current frame without tearing down the renderer. |
| `source` * | `AsciiRenderSource` | — | Media descriptor. |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { AsciiRender } from '@katana-ui/react'

export function AsciiRenderUsage() {
  return (
    <AsciiRender
      alt="Sample chart as characters"
      columns={48}
      fontSize={8}
      source={{ src: 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==', type: 'image' }}
    />
  )
}
```

## States

- 图片：画一次。
- 视频：按 fps 重画，屏外或 paused 时暂停播放。
- 读取失败（跨域或解码出错）：隐藏字符，显示原图。

## Don't

- 不要拿它显示要读的图表：字符化后看不出数。
- columns 不要超过 240：字符越多，每帧越慢。

## Composition

```
AsciiRender
  img 或 video（aria-hidden，取样源）
  pre（aria-hidden，字符）
  span.sr-only（alt）
```
