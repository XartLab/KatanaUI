# EmphasisGuide

三档分量各什么时候用：hero 给这个区里用户第一眼要看的那一个数（一个区最多一处），standard 给区里读、比、点的主体内容（拿不准就用它），compact 给看一眼就走的边角（边栏、列表项里）。选档看这一块在这个区里的重要程度，不看它摆在哪个位置。表里的件名链到各自的组件页；档位的具体样子见 Emphasis 分量页。

## Provide

`*` marks a required prop.

### 三档

没有属性：这一页是选法，不是组件。用法见 Emphasis 分量页。

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { DataGrid } from '@katana-ui/react/blocks'
import { EmphasisProvider, QuoteCard, Stack } from '@katana-ui/react'

const rows = [{ id: 'a', name: 'Alpha' }]

// 一个区：最多一处 hero（这一块的主角），正文用默认，边栏里的一行用 compact。
export function EmphasisGuideUsage() {
  return (
    <Stack gap="space-4">
      <EmphasisProvider value="hero">
        <QuoteCard name="Alpha" symbol="AAA" price="11.80" change="+1.80" percent="+18.00%" tone="up" />
      </EmphasisProvider>
      <DataGrid
        columns={[{ id: 'name', type: 'text', value: (row: (typeof rows)[number]) => row.name }]}
        layout={[{ id: 'name', label: 'Name', width: 160, visible: true }]}
        rows={rows}
        rowId={(row) => row.id}
        label="Watchlist"
      />
    </Stack>
  )
}
```

## States

- hero：指数、账户权益、当前品种的价。一个区里最多一处。
- standard：完整的表、图、列表；不确定时用它，也是不包 Provider 时的样子。
- compact：边栏、列表项里、卡片的角落：标签加读数并排、表前几行、列表一行一条。

## Don't

- 不要把所有块都设成 hero：什么都是主角就没有主角。
- 不要因为「空间小」就把应该读的表设成 compact：compact 的表只有前几行、没有表头。
- 不要为了换个样子去改件的字号：改分量。

## Composition

```
EmphasisProvider（hero，一个区一处）
EmphasisProvider（standard，默认）
EmphasisProvider（compact，边栏里的一行）
```
