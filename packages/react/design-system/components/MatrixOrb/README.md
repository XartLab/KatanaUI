# MatrixOrb

一盘方点排成圆：待命慢呼吸，聆听同心波跟音量走，思考几个热点绕着转。点阵签名件的动态版，用来表达 Agent 在做什么。学自 rare-ui。

## Provide

`*` marks a required prop.

### MatrixOrb

画在 canvas 上，role=img；状态用文字另外读出。颜色取元素的 color，跟主题走。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `state` | `OrbState` | `'idle'` | The state; when it changes the weights of the three patterns interpolate, with no jump. |
| `level` | `number` | — | Volume of the listening state from 0 to 1; a simulated envelope is used when omitted. |
| `cells` | `number` | `16` | Dots per side; the pitch is 6px, so 16 is 96px square. |
| `label` * | `string` | — | Accessible name (required). |
| `color` | `string` | `'var(--signal-orange)'` | Color of the dots, a CSS color or a CSS variable reference; defaults to the theme accent. |
| `className` | `string` | — | Extra class name on the root. |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { MatrixOrb } from '@katana-ui/react'

export function MatrixOrbUsage() {
  return <MatrixOrb state="idle" label="Assistant" />
}
```

## States

- 待命：慢呼吸。
- 聆听：同心波跟 level 音量走。
- 思考：几个热点绕着转。

## Don't

- 只表达 Agent 真实在做的事，不当装饰。
- label 要传（读屏名字）。

## Composition

```
MatrixOrb
  canvas（requestAnimationFrame 循环）
```
