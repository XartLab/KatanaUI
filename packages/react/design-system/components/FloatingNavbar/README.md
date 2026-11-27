# FloatingNavbar

一条胶囊浮在内容上，当前项的底块用弹簧滑到点中的项；往下滚时条淡出上移让路，往回滚立即出现，滚过 120px 后收紧。研究报告、长文档的页内跳转用。

## Provide

`*` marks a required prop.

### FloatingNavbar

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `items` * | `readonly FloatingNavbarItem[]` | — | The entries to show. |
| `label` * | `string` | — | What screen readers call this navigation (required). |
| `activeId` | `string` | — | Id of the active item (controlled). |
| `onActiveChange` | `(id: string) => void` | — | Called with the id the user picked. |
| `logo` | `ReactNode` | — | Content at the left end. |
| `actions` | `ReactNode` | — | Content at the right end. |
| `hideOnScroll` | `boolean` | `true` | Slide away while scrolling down. |
| `position` | `'top' \| 'bottom'` | `'top'` | Where the bar sits. |
| `containerRef` | `RefObject<HTMLElement \| null>` | — | The scrolling element; leave it out for the window. |
| `className` | `string` | — | Extra classes for the root element. |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { FloatingNavbar } from '@katana-ui/react'

export function FloatingNavbarUsage() {
  return (
    <div style={{ position: 'relative', height: 80 }}>
      <FloatingNavbar
        label="Report sections"
        items={[
          { id: 'summary', label: 'Summary' },
          { id: 'risk', label: 'Risk' },
          { id: 'trades', label: 'Trades' },
        ]}
      />
    </div>
  )
}
```

## States

- 静止：胶囊在顶（或底）部居中。
- 往下滚：淡出上移，不接收指针。
- 往回滚：立即出现。
- 滚过 120px：内边距收紧。

## Don't

- 不要当整个应用的导航：那是 SideNav。
- 不要在没有滚动的页面里设 hideOnScroll：它没有可隐藏的时机。

## Composition

```
FloatingNavbar
  motion.nav
    logo
    ul > li > a / button（含滑动底块）
    actions
```
