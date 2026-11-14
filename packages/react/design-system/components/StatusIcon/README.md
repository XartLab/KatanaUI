# StatusIcon

提示条里的成功、失败、警告、说明、进行中：换状态时旧的缩小退出、新的弹入，对勾与叉一笔一笔画出来。学自 rare-ui 的 toast。

## Provide

`*` marks a required prop.

### StatusIcon

16 见方，role=img。应用的提示条（AlertToasts）用它表达成功与警告。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `status` * | `StatusIconStatus` | — | The status; pending is a spinning arc. |
| `label` * | `string` | — | Accessible name (required): color and shape alone are not enough. |
| `className` | `string` | — | Extra class name on the icon. |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { StatusIcon } from '@katana-ui/react'

export function StatusIconUsage() {
  return <StatusIcon status="pending" label="Syncing" />
}
```

## States

- 成功、失败、警告、说明、进行中五种。
- 换状态时旧的缩小退出、新的弹入，对勾与叉一笔一笔画出来。

## Don't

- 不要单靠图标说话：旁边要有文字。
- label 必须传（读屏名字）。

## Composition

```
StatusIcon
  svg（按 status 换，笔画画出来）
```
