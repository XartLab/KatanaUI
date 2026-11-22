# StatusIcon

提示条里的成功、失败、警告、说明、进行中：换状态时旧的缩小退出、新的弹入，对勾与叉一笔一笔画出来。学自 rare-ui 的 toast。

## Provide

`*` marks a required prop.

### StatusIcon

16 见方，role=img。tone：Severity（ok 对勾、warn 叹号、danger 叉、neutral 说明）加 info（蓝的说明）与 pending（转圈）；旧的 status（success / error / warning）留一个版本。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `tone` | `StatusIconTone` | — | Tone: ok, warn, danger, neutral, info, or pending (a spinning arc). |
| `status` | `StatusIconStatus` | — | Old name kept for one release. |
| `label` * | `string` | — | Accessible name (required): color and shape alone are not enough. |
| `className` | `string` | — | Extra class name on the icon. |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { StatusIcon } from '@katana-ui/react'

export function StatusIconUsage() {
  return <StatusIcon tone="pending" label="Syncing" />
}
```

## States

- ok、danger、warn、info、neutral、pending 六种，颜色取 --k-status-*；pending 是一圈匀速转的弧。
- 换状态时旧的缩小退出、新的弹入，对勾与叉一笔一笔画出来。

## Don't

- 不要单靠图标说话：旁边要有文字。
- label 必须传（读屏名字）。

## Composition

```
StatusIcon
  svg（按 tone 换，笔画画出来）
```
