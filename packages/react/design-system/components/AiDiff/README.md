# AiDiff

一份等人点头的修改：新增行从左往右擦进来，上下文行不动；接受闪一下绿，拒绝闪一下红并把各行收到零高让出版面。交易里用来展示 AI 改了哪些策略参数。改自 SmoothUI。

## Provide

`*` marks a required prop.

### AiDiff

只有给了 onAccept / onReject 才画对应按钮；决定后按钮收起，状态词在 role=status 里。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `lines` * | `readonly AiDiffLine[]` | — | The lines of the change. |
| `labels` * | `AiDiffLabels` | — | Texts in the UI language (required). |
| `title` | `string` | — | What is changing, such as a file path or "Strategy parameters". |
| `onAccept` | `() => void` | — | Called when the reader accepts; the accept button is shown only when this is given. |
| `onReject` | `() => void` | — | Called when the reader rejects; the reject button is shown only when this is given. |
| `className` | `string` | — | Extra class name on the root. |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { AiDiff } from '@katana-ui/react'

export function AiDiffUsage() {
  return (
    <AiDiff
      title="策略参数"
      lines={[
        { kind: 'removed', content: 'stop_loss: 0.05' },
        { kind: 'added', content: 'stop_loss: 0.035' },
      ]}
      labels={{
        accept: '接受',
        reject: '拒绝',
        accepted: '已接受',
        rejected: '已拒绝',
        added: '新增',
        removed: '删除',
        context: '未变',
      }}
      onAccept={() => undefined}
      onReject={() => undefined}
    />
  )
}
```

## States

- 待决定：标题栏 +N -M，底部两个按钮。
- 接受：绿色一闪，写「已接受」。
- 拒绝：红色一闪，行收起，写「已拒绝」。

## Don't

- 别用它做长文件的行级审阅：它没有折叠与跳转。
- 改动要真的落地，调用方在 onAccept 里做，组件只记录决定。

## Composition

```
AiDiff
  div（标题 + 增删计数）
  div role=list（行：行号 + 符号 + 内容）
  div（拒绝 / 接受）
  p role=status
```

## Keyboard

- `Tab`：依次聚焦拒绝、接受
- `Enter / Space`：触发
