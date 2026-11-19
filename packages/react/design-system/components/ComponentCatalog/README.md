# ComponentCatalog

PanelTabs 的「+」打开的目录（照 OKX 的「添加组件」抽屉，2026-11-19 实测）：标题与「重置布局」、一句说明、搜索框、类别页签，下面按类别分组的卡片，每张一个缩略图加名字；已在工作区里的打勾，当前品种用不了的置灰并写明原因；卡片可拖（带 CATALOG_ITEM_MIME）。我们加的：搜索（名字与别名）、最前面一组「推荐」（宿主按当前品种与市场包标 recommended）。点卡片回调 onToggle（加或移除）。没给缩略图时按 kind 画一张示意。只是目录本身，放进 Sheet 还是侧栏由宿主定。

## Provide

`*` marks a required prop.

### ComponentCatalog

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `items` * | `readonly CatalogItem[]` | — | Everything that can be added, with its category, in-use and availability flags. |
| `categories` * | `readonly CatalogCategory[]` | — | The categories, in the order their groups appear. |
| `thumbnails` | `Readonly<Record<string, ReactNode>>` | — | Thumbnail node per item id; items without one get a stock drawing by kind. |
| `onToggle` * | `(id: string, add: boolean) => void` | — | Called when a card is clicked: `add` is true for a card not yet in the workspace, false to remove one that is. |
| `onReset` | `() => void` | — | Called when the reset button is clicked; leave out to hide it. |
| `labels` * | `ComponentCatalogLabels` | — | All visible text and accessible names. |
| `className` | `string` | — | Extra class name on the catalog. |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { useState } from 'react'
import { ComponentCatalog, type CatalogItem } from '@katana-ui/react/blocks'

const CATEGORIES = [
  { id: 'market', name: 'Market' },
  { id: 'orders', name: 'Orders & positions' },
  { id: 'trade', name: 'Trading' },
]

// Demo catalog, not a list of what the library ships.
const ITEMS: CatalogItem[] = [
  { id: 'chart', name: 'Chart', category: 'market', kind: 'chart', recommended: true },
  { id: 'book', name: 'Order book', category: 'market', kind: 'table', keywords: ['depth'], recommended: true },
  { id: 'trades', name: 'Trades', category: 'market', kind: 'list' },
  { id: 'funding', name: 'Funding', category: 'market', kind: 'gauge', recommended: true },
  { id: 'company', name: 'Company', category: 'market', kind: 'text', unavailable: 'Stocks only' },
  { id: 'open-orders', name: 'Open orders', category: 'orders', kind: 'table' },
  { id: 'positions', name: 'Positions', category: 'orders', kind: 'table' },
  { id: 'assets', name: 'Assets', category: 'orders', kind: 'gauge' },
  { id: 'ticket', name: 'Order ticket', category: 'trade', kind: 'form' },
]

export function ComponentCatalogUsage() {
  const [used, setUsed] = useState<readonly string[]>(['chart', 'ticket', 'positions'])
  return (
    <div style={{ width: 380 }}>
      <ComponentCatalog
        items={ITEMS.map((item) => ({ ...item, inUse: used.includes(item.id) }))}
        categories={CATEGORIES}
        onToggle={(id, add) => setUsed((list) => (add ? [...list, id] : list.filter((item) => item !== id)))}
        onReset={() => setUsed(['chart', 'ticket', 'positions'])}
        labels={{
          title: 'Add components',
          hint: 'Click to add or remove, or drag a card onto a panel.',
          reset: 'Reset layout',
          search: 'Search components',
          all: 'All',
          recommended: 'For BTC-USDT-SWAP',
          empty: 'No component matches.',
          inUse: 'in workspace',
        }}
      />
    </div>
  )
}
```

## States

- 没搜索、没选类别：先「推荐」一组，再按类别各一组；推荐过的不在类别里重复出现。
- 选了类别：只看这一类，没有「推荐」。
- 在搜索：按名字与别名筛，不分「推荐」；搜不到写 labels.empty。
- 已在工作区：缩略图上盖一层并打勾，名字加粗，aria-pressed=true；再点是移除。
- 用不了：整张置灰、不可拖、点了不回调，名字下面写原因。

## Don't

- 缩略图是示意，不要拿它当真实数据的预览；要真截图由宿主经 thumbnails 传。
- 不要把「用不了」的项直接藏掉：留着并写原因，用户才知道有这个组件、为什么现在加不了。
- 「重置布局」是不可撤的，宿主要自己再确认一次（HoldToConfirm 或对话框）。

## Composition

```
ComponentCatalog
  标题 · Button（重置布局）
  Input（搜索）
  Tabs · TabsList line（类别）
  分组 · 卡片（button aria-pressed：缩略图 · 名字 · 原因）
```

## Keyboard

- `Tab`：搜索框、类别页签、各卡片，依次走
- `← →`：在类别页签间移动
- `Enter / 空格`：在卡片上加进工作区或移除
