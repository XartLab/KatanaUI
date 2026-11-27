# DocReader

读长文（公告、年报、招股书，KATANAview #2395）：左边目录（标题块抽出来，点了滚到那一节），上边查找（命中数、上一个 / 下一个、命中字高亮），正文一块一块排，悬停或聚焦一段右侧出引用钮，点了把这一块交给宿主（宿主拼 kref: 给智能体）。activeId 给了就滚到那一块并标出来。件不取数、不解析 PDF：宿主把原文抽成块交进来。块用 content-visibility 省排版，不做虚拟滚动（查找与锚点要全部块在 DOM 里）。功能参照 PDF 阅读器的目录与查找。

## Provide

`*` marks a required prop.

### DocReader

文字全由 props 传。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `title / meta` | `string` | — | 标题与下一行元信息。 |
| `blocks` | `DocBlock[]` | — | { id, kind: 'heading' \| 'paragraph', text, level }；id 稳定，宿主拿它拼引用。 |
| `activeId` | `string` | — | 滚到这一块并标出来（从引用点回来时用）。 |
| `onCite` | `(block) => void` | — | 引用钮；不给不画。 |
| `hideOutline` | `boolean` | `false` | 窄格子里不画目录。 |
| `height` | `number` | `560` | 整块高度。 |
| `labels` | `DocReaderLabels` | — | 读屏名、目录、查找、命中计数、上一个 / 下一个、引用、空态。 |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { useState } from 'react'
import { DocReader } from '@katana-ui/react/blocks'
import { DEMO_DOC_BLOCKS } from '../fundamentals-data'

export function DocReaderUsage() {
  const [cited, setCited] = useState<string | null>(null)
  return (
    <div className="gal-wide" data-gallery-doc="main" style={{ maxWidth: 900 }}>
      <DocReader
        title="示例公司 2026 年半年度报告（摘录）"
        meta="2026-08-28 · 半年度报告 · 演示"
        blocks={DEMO_DOC_BLOCKS}
        height={420}
        onCite={(block) => setCited(block.id)}
        labels={{
          reader: '示例：公告阅读',
          outline: '目录',
          search: '在文中查找',
          matches: (current, total) => `${current} / ${total}`,
          noMatch: '没有找到',
          previous: '上一个',
          next: '下一个',
          cite: '引用这一段',
          empty: '没有正文',
        }}
        source="来源 / 演示数据（虚构公司）"
      />
      <p className="gal-note" data-slot="doc-demo-cited">
        {cited ? `已引用：kref:doc/demo#${cited}` : '悬停一段，点右侧的引用钮'}
      </p>
    </div>
  )
}
```

## States

- 默认：目录加正文。
- 查找：命中字高亮，当前命中块左侧竖线，计数「3 / 12」；没找到写一行字。
- 引用：悬停或聚焦一段右侧出钮。
- 没有块：空态。

## Don't

- 不要在件里解析 PDF 或取数。
- 不要用虚拟滚动：查找与锚点要全部块在 DOM 里。

## Composition

```
DocReader
  头（标题 · 元信息 · 查找条）
  目录 | 正文（块 · 引用钮）
  来源行
```

## Keyboard

- `Enter / Shift+Enter`：在查找框里：下一个 / 上一个命中
- `Esc`：在查找框里：清空
- `Tab`：目录项、正文、引用钮
