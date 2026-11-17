# RenderingSettings

应用「设置 → 渲染」那一页：文字平滑（灰度 / 系统）、像素对齐、字重补偿（-60..+60，相当于终端的 font-thicken）、字号缩放（取整到整像素）、斜线零、中英对齐（font-size-adjust）。每项一行：名称、一句说明、控件。值写在根节点上（theme/rendering.css 读），件是受控的，调用方存值，启动时用 applyRendering 写回。字样表与本机字体检测见总览里的 rendering 页。

## Provide

`*` marks a required prop.

### RenderingSettings

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `value` | `RenderingSettingsValue` | — | { smoothing, pixelSnap, weightAdjust, textScale, slashedZero, cjkAdjust }；默认值是 DEFAULT_RENDERING。 |
| `onChange` | `(next: RenderingSettingsValue) => void` | — | 改了任一项；一般在这里 applyRendering(next) 并存盘。 |
| `labels` | `RenderingSettingsLabels` | — | 全部文字，默认 RENDERING_LABELS_ZH。 |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { useState } from 'react'
import { RenderingSettings, applyRendering, readRendering, type RenderingSettingsValue } from '@katana-ui/react'

// 应用启动时：读存盘的设置，applyRendering 写回根节点；改了就存盘。
export function RenderingSettingsUsage() {
  const [value, setValue] = useState<RenderingSettingsValue>(readRendering)
  return (
    <RenderingSettings
      value={value}
      onChange={(next) => {
        setValue(next)
        applyRendering(next)
      }}
    />
  )
}
```

## States

- 默认值：灰度、像素对齐开、字重 0、字号 100%、斜线零关、中英对齐关
- 改任一项立刻生效（写在根节点上）

## Don't

- 不要在件里存值：存盘交给调用方
- 不要只在某个面板上改这些属性：渲染设置是整个应用一份

## Composition

```
RenderingSettings
  行 × 6（名称、说明、ToggleGroup 或 Slider）
  恢复默认（Button）
```
