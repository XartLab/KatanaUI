# AgentAvatar

Agent 的像素头像：由字符串种子确定地生成 6×6 的色块，同一个种子永远同一张脸；带呼吸、脉动、斜扫、闪点四种环境动效。多个 Agent（研究员、风控、执行）并存时一眼认出是谁说的话。改自 SmoothUI。

## Provide

`*` marks a required prop.

### AgentAvatar

画在 canvas 上，role=img，读屏名取 label。颜色是按种子生成的身份色，不跟主题。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `seed` * | `string` | — | String seed; the same seed always draws the same avatar. |
| `label` * | `string` | — | Accessible name (required), such as "Risk agent". |
| `size` | `number` | `64` | Diameter in px. |
| `animated` | `boolean` | `true` | Run the ambient pixel animation; a still frame is drawn when false. |
| `className` | `string` | — | Extra class name on the canvas. |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { AgentAvatar } from '@katana-ui/react'

export function AgentAvatarUsage() {
  return <AgentAvatar seed="risk" label="风控 Agent" size={48} />
}
```

## States

- 动画：四种环境动效叠加。
- animated=false：画静止的一帧。

## Don't

- 不要拿它当用户头像。
- 同一个 Agent 的种子要稳定，别用随机数或时间。

## Composition

```
AgentAvatar
  canvas（requestAnimationFrame）
```
