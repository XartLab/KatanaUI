# PagePreloader

面板或整页的进场遮罩：先盖住内容停一会儿，数据就绪后用幕布、阶梯、像素、文字四种方式之一揭开。用在切换工作区、冷启动首屏。默认只盖住父级，整页遮罩要显式 fullScreen。与 Loading 的分工：Loading 管等数据时的骨架与超时，PagePreloader 只管「揭开」这一下，两者可叠着用。

## Provide

`*` marks a required prop.

### PagePreloader

active 受控：设为 false 播揭开；不传就停 duration 毫秒后自己揭开。揭开完成后卸载并调 onComplete。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `label` * | `string` | — | Accessible name announced while the cover is up, for example "Loading workspace". |
| `variant` | `PagePreloaderVariant` | `'curtain'` | How the cover is lifted. |
| `active` | `boolean` | — | Cover shown (controlled); setting it false plays the reveal. |
| `defaultActive` | `boolean` | `true` | Whether the cover starts up when uncontrolled. |
| `duration` | `number` | `1400` | How long the uncontrolled cover holds before it reveals, in milliseconds. |
| `columns` | `number` | `6` | Columns of the stairs variant, and rows and columns of the pixel variant. |
| `words` | `readonly string[]` | `[]` | Words cycled by the words variant while holding. |
| `background` | `string` | `'var(--bg-000)'` | Any CSS colour of the cover pieces. |
| `fullScreen` | `boolean` | `false` | Cover the whole window instead of the parent box. |
| `onComplete` | `() => void` | — | Called once the reveal has finished and the cover is gone. |
| `className` | `string` | — | Extra class name on the cover. |

### PAGE_PRELOADER_VARIANTS

常量：四个款式的名字。

### preloaderExitMs

纯函数 (款式, 列数)：揭开这一下要多少毫秒。

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { PagePreloader } from '@katana-ui/react'

export function PagePreloaderUsage() {
  return (
    <div style={{ position: 'relative', height: 120 }}>
      <p>Workspace ready</p>
      <PagePreloader label="Loading workspace" variant="curtain" duration={900} />
    </div>
  )
}
```

## States

- hold：遮罩盖住，文字款循环换词。
- exiting：按款式揭开（幕布向两侧、阶梯逐列下沉、像素乱序消失、文字上滑）。
- idle：卸载，什么也不画。

## Don't

- 不要用来掩盖慢：停留时间超过 1.5 秒就该显示真实的加载状态。
- 不要每次切页都用：只在工作区或整页冷启动时用一次。

## Composition

```
PagePreloader
  div（role=status）
    （款式层：幕布 / 阶梯 / 像素 / 文字）
```
