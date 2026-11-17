# SideNav

分组的侧栏导航：组名小号大写；没选中的字淡，悬停变亮，当前项最亮。每组左边一条 1px 虚线从组顶走到当前项、用 6px 弯钩拐进去，悬停另一项时以淡色画一条到悬停项，切换时 200ms 滑过去。顶上过滤框（⌘K / Ctrl+K 聚焦，Enter 打开第一项，Esc 清空），底部淡出。照 rareui.com 组件站左栏（2026-11-17 实测），实现原创。件不管路由：链接给 href，当前项由调用方传。轨迹颜色走 --k-sidenav-trail，默认品牌橙。

## Provide

`*` marks a required prop.

### SideNav

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `groups` | `SideNavGroup[]` | — | { id, title, items: { id, label, href, keywords?, title? }[] }；keywords 只用来搜。 |
| `current` | `string` | — | 当前项的 id；轨迹画到它。 |
| `header` | `ReactNode` | — | 顶部（品牌、面包屑、收起按钮）。 |
| `footer` | `ReactNode` | — | 底部。 |
| `searchLabel` | `string` | — | 过滤框的占位与读屏名；不给就没有过滤框。 |
| `emptyLabel` | `string` | — | 过滤没有结果时的文字。 |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { useState } from 'react'
import { SideNav } from '@katana-ui/react'

const GROUPS = [
  {
    id: 'markets',
    title: 'Markets',
    items: [
      { id: 'watchlist', label: 'Watchlist', href: '#watchlist' },
      { id: 'heatmap', label: 'Heatmap', href: '#heatmap' },
      { id: 'screener', label: 'Screener', href: '#screener' },
    ],
  },
  {
    id: 'trading',
    title: 'Trading',
    items: [
      { id: 'positions', label: 'Positions', href: '#positions' },
      { id: 'orders', label: 'Orders', href: '#orders' },
      { id: 'bots', label: 'Bots', href: '#bots', keywords: 'automation strategies' },
    ],
  },
]

// 件不管路由：这里用点击记住当前项；应用里 current 来自路由。
export function SideNavUsage() {
  const [current, setCurrent] = useState('heatmap')
  return (
    <div
      style={{ height: 360, width: 280 }}
      onClickCapture={(event) => {
        const id = (event.target as HTMLElement).closest('a')?.getAttribute('href')?.slice(1)
        if (id) {
          event.preventDefault()
          setCurrent(id)
        }
      }}
    >
      <SideNav groups={GROUPS} current={current} searchLabel="Search" emptyLabel="No match" aria-label="Workspace" />
    </div>
  )
}
```

## States

- 当前项：最亮，轨迹用 --k-sidenav-trail
- 悬停：变亮，淡色轨迹画到悬停项
- 过滤中：没命中的组整组隐藏，全没命中显示 emptyLabel

## Don't

- 不要一组放太多项：超过二十来项拆组
- 不要把轨迹颜色设成跟正文一样亮：它是指引，不是内容

## Composition

```
SideNav
  头部（header）
  过滤框
  分组 × n（组名、轨迹、链接）
  底部（footer）
```

## Keyboard

- `⌘K / Ctrl+K`：聚焦过滤框
- `Enter`：在过滤框里：打开第一项
- `Esc`：在过滤框里：清空
