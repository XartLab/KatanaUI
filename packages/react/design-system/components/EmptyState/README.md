# EmptyState

面板的「空」态：点阵小标签、一行标题、说明与动作。没有连接、没选品种、没有数据时摆它，不画假数据。

## Provide

`*` marks a required prop.

### EmptyState

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `tag` | `string` | — | Small dot-matrix tag such as NO DATA (the caller writes the text). |
| `title` * | `string` | — | The title. |
| `children` | `ReactNode` | — | The description under the title. |
| `actions` | `ReactNode` | — | The action area (buttons). |
| `classNames` | `Partial<Record<EmptyStateSlot, string>>` | `{}` | Extra class names per part. |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { Button } from '@katana-ui/react'
import { EmptyState } from '@katana-ui/react/blocks'

export function EmptyStateUsage() {
  return (
    <EmptyState tag="NO DATA" title="Nothing selected" actions={<Button variant="primary">Pick a symbol</Button>}>
      <p>Connect a data source first.</p>
    </EmptyState>
  )
}
```

## States

- 有操作：标题、说明下面带操作区。
- 无操作：只有标题与说明。

## Don't

- 不要拿空态当加载中；加载用 Loading。
- 不要写没有下一步的空态说明。

## Composition

```
EmptyState（role=status）
  标签
  标题（h3）
  说明
  动作
```
