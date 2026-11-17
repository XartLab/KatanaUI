# AiArtifact

模型产出的东西的框：标题、预览 / 代码两个视图、复制。两个视图沿同一条水平轴走，预览永远在代码左边，所以切换有方向；选中指示块是一个共享元素在页签间滑。改自 SmoothUI。

## Provide

`*` marks a required prop.

### AiArtifact

只给 preview 或只给 code 时不画页签；copyText 与 labels.copy 都给了才画复制钮。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `title` * | `string` | — | Name of the artifact, so it can be referred to in conversation. |
| `labels` * | `AiArtifactLabels` | — | Texts in the UI language (required). |
| `preview` | `ReactNode` | — | The rendered form. |
| `code` | `ReactNode` | — | The raw form (source, JSON, markup), shown in a monospace block. |
| `defaultPane` | `AiArtifactPane` | `'preview'` | Which pane to start on. |
| `copyText` | `string` | — | Plain text for the clipboard; the copy button needs this and `labels.copy`. |
| `className` | `string` | — | Extra class name on the root. |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { AiArtifact } from '@katana-ui/react'

export function AiArtifactUsage() {
  return (
    <AiArtifact
      title="策略参数"
      labels={{ preview: '预览', code: '代码', views: '视图' }}
      preview="快线 12 日 · 慢线 30 日"
      code={'{ "fast": 12, "slow": 30 }'}
    />
  )
}
```

## States

- 预览 / 代码：内容横向挪 24px 淡入淡出。
- 复制：图标换对勾约 1.6 秒。

## Don't

- 两个视图内容要对得上：预览是代码的渲染结果。

## Composition

```
AiArtifact
  div（标题 + role=tablist + 复制钮）
  div role=tabpanel（预览 / 代码）
```

## Keyboard

- `← →`：在页签间移动并切换
- `Tab`：页签、复制钮
