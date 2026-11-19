# PanelTabs

一个面板格子里叠几个组件，各一个页签（照 OKX 交易页每个面板顶上的页签栏，2026-11-19 实测）：文字页签、当前页签底下一道线；悬停或聚焦页签出「×」移除；末尾「+」打开添加组件；放不下的收进「…」下拉且当前页签始终可见；栏右端是这个面板自己的动作（设置、浮窗）。拖动或 Alt+方向键排序，拖出去的页签带 PANEL_TAB_MIME，跨面板的落点由宿主接。与 PanelFrame（一个面板一个固定标题）并存，两种做法都支持。宿主给数据与回调。

## Provide

`*` marks a required prop.

### PanelTabs

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `tabs` * | `readonly PanelTab[]` | — | The tabs, in order. |
| `activeId` * | `string` | — | Id of the selected tab. |
| `onSelect` * | `(id: string) => void` | — | Called when a tab is chosen. |
| `onClose` | `(id: string) => void` | — | Called when a tab's × is clicked or Delete is pressed on it; leave out to make tabs permanent. |
| `onAdd` | `() => void` | — | Called when the + is clicked, to open the component catalog; leave out to hide it. |
| `onReorder` | `(id: string, targetId: string) => void` | — | Moves tab `id` to where `targetId` is (drag within the bar, Alt+arrows); leave out to fix the order. |
| `actions` | `ReactNode` | — | This panel's own actions at the right end (settings, pop out). |
| `label` * | `string` | — | Accessible name of the tab list. |
| `labels` | `PanelTabsLabels` | — | Accessible names of the buttons. |
| `className` | `string` | — | Extra class name on the bar. |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { Maximize2, SlidersHorizontal } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@katana-ui/react'
import { PanelTabs, type PanelTab } from '@katana-ui/react/blocks'

const ALL: Record<string, string> = {
  chart: 'Chart',
  info: 'Info',
  data: 'Trading data',
  feed: 'Feed',
  funding: 'Funding',
}

export function PanelTabsUsage() {
  const [ids, setIds] = useState<readonly string[]>(['chart', 'info', 'data', 'feed'])
  const [active, setActive] = useState('data')
  const tabs: PanelTab[] = ids.map((id) => ({ id, name: ALL[id]!, closable: id !== 'chart' }))
  const rest = Object.keys(ALL).filter((id) => !ids.includes(id))
  return (
    <div className="k-text-body" style={{ width: 460, border: '1px solid var(--k-separable-tertiary-borderColor)' }}>
      <PanelTabs
        label="Panel components"
        labels={{ close: 'Remove {name}', add: 'Add component', more: 'More tabs' }}
        tabs={tabs}
        activeId={active}
        onSelect={setActive}
        onClose={(id) => {
          setIds((list) => list.filter((item) => item !== id))
          if (id === active) setActive('chart')
        }}
        onAdd={
          rest.length > 0
            ? () => {
                setIds((list) => [...list, rest[0]!])
                setActive(rest[0]!)
              }
            : undefined
        }
        onReorder={(id, targetId) =>
          setIds((list) => {
            const next = list.filter((item) => item !== id)
            next.splice(list.indexOf(targetId), 0, id)
            return next
          })
        }
        actions={
          <>
            <Button size="icon" variant="icon" aria-label="Panel settings">
              <SlidersHorizontal aria-hidden="true" />
            </Button>
            <Button size="icon" variant="icon" aria-label="Open in a floating window">
              <Maximize2 aria-hidden="true" />
            </Button>
          </>
        }
      />
      <div role="tabpanel" style={{ padding: 12, minHeight: 72, color: 'var(--k-content-secondary-foreground)' }}>
        {ALL[active]}
      </div>
    </div>
  )
}
```

## States

- 放得下：全部页签在栏上。
- 放不下：末尾的页签收进「…」下拉；当前页签在被收起的一段时，与最后一个看得见的换位。
- closable=false 或没给 onClose：这个页签没有「×」，Delete 也不动它。
- 没给 onAdd：不画「+」。
- 拖到另一个页签上：那个页签左边出一道竖线，松手换到它的位置。

## Don't

- 面板里只有一个组件、也不让用户加时，用 PanelFrame 的固定标题，不要摆一个只有一项的页签栏。
- 页签名不要超过四五个字；放不下靠「…」，不要截断成看不懂的半截。
- 顶层的工作区切换用 WorkspaceTabs，不是它。

## Composition

```
PanelTabs
  role=tablist · 页签（button role=tab）· 「×」
  DropdownMenu（「…」）
  「+」
  actions（宿主给的按钮）
```

## Keyboard

- `← → Home End`：在页签间移焦点
- `Enter / 空格`：切到聚焦的页签
- `Delete / Backspace`：移除聚焦的页签，焦点落到相邻的页签
- `Alt + ← →`：把聚焦的页签往前 / 往后挪一位
