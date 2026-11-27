# MorphSurface

一颗小药丸点开后自己长成一张面板，宽、高、圆角一起弹簧过渡；点外面或按 Esc 收回。装饰件：适用首页浮在页面一角的「问 AI」入口；交易主界面提问走命令面板或 AI 输入件。

## Provide

`*` marks a required prop.

### MorphSurface

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `pill` * | `ReactNode` | — | What the closed pill shows (an icon and a word). |
| `openLabel` * | `string` | — | Spoken name of the button that opens the panel (required). |
| `children` * | `ReactNode` | — | The open panel's content. |
| `open` | `boolean` | — | Whether the panel is open (controlled). |
| `onOpenChange` | `(open: boolean) => void` | — | Called when it opens or closes. |
| `width` | `number` | `360` | Open panel width in px. |
| `height` | `number` | `200` | Open panel height in px. |
| `className` | `string` | — | Extra classes for the root element. |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { Sparkles } from 'lucide-react'
import { MorphSurface } from '@katana-ui/react'

export function MorphSurfaceUsage() {
  return (
    <MorphSurface
      pill={
        <>
          <Sparkles size={14} /> Ask AI
        </>
      }
      openLabel="Ask AI"
      width={320}
      height={140}
    >
      <div style={{ padding: 12 }}>The open panel's content goes here.</div>
    </MorphSurface>
  )
}
```

## States

- 收起：药丸，圆角 20。
- 展开：宽高圆角一起弹簧过渡到面板，内容淡入；收起时延迟 80ms 让内容先淡出。

## Don't

- 不要放进交易主界面：面板盖在内容上，靠点外面收起，盯盘时容易误触。
- 原件写死的文案与输入框不在这里：外壳只管变形，内容由调用方传。

## Composition

```
MorphSurface
  motion.div（变形的外壳）
    button（药丸）
    motion.div（面板内容）
```
