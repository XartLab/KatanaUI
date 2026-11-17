# WorkspaceTabs

顶层工作区标签条：当前标签凹陷、底部橙线用弹簧滑过去，右侧快捷键提示，最右「+」新建；放不下的标签收进末尾的「…」下拉（当前标签始终可见），拖动或 Alt+方向键排序，双击或 F2 改名。宿主给数据与回调。

## Provide

`*` marks a required prop.

### WorkspaceTabs

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `workspaces` | `{ id, name, hotkey? }[]` | — | 标签；hotkey 只显示，不绑定。 |
| `activeId` | `string` | — | 当前标签。 |
| `onSelect` | `(id) => void` | — | 切换。 |
| `onReorder` | `(id, targetId) => void` | — | 把 id 挪到 targetId 的位置；不给就不能排序。 |
| `onRename` | `(id) => void` | — | 进改名；输入框是宿主的事；不给就不能改名。 |
| `onCreate / labels` | `() => void / { create?, more? }` | — | 「+」与它的名字、「更多」下拉的名字；不给 onCreate 就不画「+」（旧名 createLabel / moreLabel 留一个版本）。 |
| `label` | `string` | — | 标签条的名字（读屏念）。 |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { useState } from 'react'
import { WorkspaceTabs, type WorkspaceTab } from '@katana-ui/react/blocks'

const TABS: readonly WorkspaceTab[] = [
  { id: 'overview', name: 'Overview', hotkey: '⌘1' },
  { id: 'desk', name: 'Desk', hotkey: '⌘2' },
  { id: 'lab', name: 'Lab', hotkey: '⌘3' },
  { id: 'portfolio', name: 'Portfolio', hotkey: '⌘4' },
  { id: 'runs', name: 'Runs', hotkey: '⌘5' },
  { id: 'my-long-workspace-name', name: 'My very long workspace name' },
]

export function WorkspaceTabsUsage() {
  const [tabs, setTabs] = useState(TABS)
  const [active, setActive] = useState('desk')
  const [renamed, setRenamed] = useState<string | null>(null)
  return (
    <div className="gal-stack" style={{ width: '100%', maxWidth: 640 }}>
      <div style={{ width: 520 }} data-testid="tabs-demo">
        <WorkspaceTabs
          workspaces={tabs}
          activeId={active}
          label="Workspaces"
          labels={{ create: 'New workspace', more: 'More workspaces' }}
          onSelect={setActive}
          onRename={setRenamed}
          onCreate={() => setTabs((prev) => [...prev, { id: `ws${prev.length}`, name: `Workspace ${prev.length}` }])}
          onReorder={(id, target) =>
            setTabs((prev) => {
              const from = prev.findIndex((item) => item.id === id)
              const to = prev.findIndex((item) => item.id === target)
              if (from < 0 || to < 0) return prev
              const next = [...prev]
              next.splice(to, 0, ...next.splice(from, 1))
              return next
            })
          }
        />
      </div>
      <p className="gal-note" data-testid="tabs-rename">
        {renamed ? `Rename requested: ${renamed}` : 'No rename requested'}
      </p>
    </div>
  )
}
```

## States

- 当前标签：bg-000 凹陷、ink-100，橙线停在它下面。
- 切换：橙线用 snappy 弹簧从旧标签滑到新标签。
- 拖动中：落点标签左边亮一条线。
- 标签多：放不下的收进末尾「…」下拉，选中即切换；当前标签始终在条上（被收起时与最后一个可见的换位）；名字过长截断，悬停看全名。

## Don't

- 不要在包里绑 ⌘1–9、Ctrl+Tab，宿主的快捷键表管。
- 不要在标签里放按钮（tab 里再放可交互元素违反 ARIA）。
- 不要做横向滚动：放不下就收进「…」下拉。
- 标签名不超过 8 个汉字 / 12 个字母。

## Composition

```
WorkspaceTabs
  tablist
    tab（名字 · 快捷键提示）
    橙色指示线
  DropdownMenu（「…」，收起的标签）
  「+」按钮
```

## Keyboard

- `← →`：在可见标签间移动焦点（整条只占一个 Tab 站）
- `Tab`：到「…」按钮，Enter 打开，↑ ↓ 选，Enter 切换
- `Home / End`：到第一个 / 最后一个标签
- `Enter / Space`：切换到聚焦的标签
- `Alt+← / Alt+→`：把聚焦的标签往前 / 往后挪一位
- `F2`：进改名
