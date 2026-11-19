# PanelTabs

一个面板格子里叠几个组件，各一个页签（照 OKX 交易页每个面板顶上的页签栏，2026-11-19 实测）：文字页签、当前页签底下一道线；悬停或聚焦页签出「×」移除；末尾「+」打开添加组件；放不下的收进「…」下拉且当前页签始终可见；栏右端是这个面板自己的动作（设置、浮窗）。拖动或 Alt+方向键排序，拖出去的页签带 PANEL_TAB_MIME，跨面板的落点由宿主接。智能的部分：每个页签声明自己的 kind 与 tools，栏上只显示当前页签的工具（K 线是品种、周期、指标、画线；表是筛选、列、导出），切页签工具跟着换；一行放不下时工具落到第二行，页签不被挤掉；「+」把当前页签的 kind 带给宿主，目录按它推荐；页签可带状态点与当前对象。与 PanelFrame（一个面板一个固定标题）并存，两种做法都支持。宿主给数据与回调。

## Provide

`*` marks a required prop.

### PanelTabs

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `tabs` * | `readonly PanelTab[]` | — | The tabs, in order. |
| `activeId` * | `string` | — | Id of the selected tab. |
| `onSelect` * | `(id: string) => void` | — | Called when a tab is chosen. |
| `onClose` | `(id: string) => void` | — | Called when a tab's × is clicked or Delete is pressed on it; leave out to make tabs permanent. |
| `onAdd` | `(kind: string \| undefined) => void` | — | Called when the + is clicked, with the selected tab's kind, to open the component catalog; leave out to hide it. |
| `onReorder` | `(id: string, targetId: string) => void` | — | Moves tab `id` to where `targetId` is (drag within the bar, Alt+arrows); leave out to fix the order. |
| `actions` | `ReactNode` | — | This panel's own actions at the right end (settings, pop out). |
| `label` * | `string` | — | Accessible name of the tab list. |
| `labels` | `PanelTabsLabels` | — | Accessible names of the buttons. |
| `className` | `string` | — | Extra class name on the bar. |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { Download, Maximize2, PencilLine, SlidersHorizontal } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Button, ToggleGroup, ToggleGroupItem } from '@katana-ui/react'
import { PanelTabs, type PanelTab } from '@katana-ui/react/blocks'

// Each component brings its own tools: a chart needs symbol, interval, indicators and drawing; a table needs filter, columns and export.
function ChartTools({ interval, onInterval }: { interval: string; onInterval: (value: string) => void }) {
  return (
    <>
      <Button size="sm">BTCUSDT</Button>
      <ToggleGroup size="sm" aria-label="Interval" value={interval} onValueChange={onInterval}>
        {['15m', '1H', '1D'].map((value) => (
          <ToggleGroupItem key={value} value={value}>
            {value}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      <Button size="sm">Indicators</Button>
      <Button size="icon" variant="icon" aria-label="Draw">
        <PencilLine aria-hidden="true" />
      </Button>
    </>
  )
}

const TableTools = (
  <>
    <Button size="sm">All symbols</Button>
    <Button size="sm">Columns</Button>
    <Button size="icon" variant="icon" aria-label="Export">
      <Download aria-hidden="true" />
    </Button>
  </>
)

type Entry = Omit<PanelTab, 'id' | 'tools' | 'context'> & { tools?: 'chart' | 'table' }
const ALL: Record<string, Entry> = {
  chart: { name: 'Chart', kind: 'chart', status: 'live', closable: false, tools: 'chart' },
  orders: { name: 'Open orders', kind: 'table', badge: '3', tools: 'table' },
  info: { name: 'Info', kind: 'text' },
  feed: { name: 'Feed', kind: 'list', status: 'stale' },
  funding: { name: 'Funding', kind: 'gauge' },
}

export function PanelTabsUsage() {
  const [ids, setIds] = useState<readonly string[]>(['chart', 'orders', 'info'])
  const [active, setActive] = useState('chart')
  const [interval, setInterval] = useState('15m')
  const [asked, setAsked] = useState<string>()
  const toolsOf: Record<string, ReactNode> = {
    chart: <ChartTools interval={interval} onInterval={setInterval} />,
    table: TableTools,
  }
  const tabs: PanelTab[] = ids.map((id) => {
    const { tools, ...entry } = ALL[id]!
    return {
      id,
      ...entry,
      tools: tools ? toolsOf[tools] : undefined,
      context: id === 'chart' ? `BTCUSDT · ${interval}` : undefined,
    }
  })
  const rest = Object.keys(ALL).filter((id) => !ids.includes(id))
  return (
    <div
      className="k-text-body"
      style={{ width: '100%', maxWidth: 720, border: '1px solid var(--k-separable-tertiary-borderColor)' }}
    >
      <PanelTabs
        label="Panel components"
        labels={{
          close: 'Remove {name}',
          add: 'Add component',
          more: 'More tabs',
          tools: '{name} tools',
          status: { live: 'Live', stale: 'Not updating', error: 'Error' },
        }}
        tabs={tabs}
        activeId={active}
        onSelect={setActive}
        onClose={(id) => {
          setIds((list) => list.filter((item) => item !== id))
          if (id === active) setActive('chart')
        }}
        onAdd={(kind) => {
          setAsked(kind)
          if (!rest[0]) return
          setIds((list) => [...list, rest[0]!])
          setActive(rest[0]!)
        }}
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
        {ALL[active]!.name}
        {asked ? <output style={{ marginLeft: 8 }}>catalog asked next to: {asked}</output> : null}
      </div>
    </div>
  )
}
```

## States

- 当前页签有 tools：画在页签右边、一道竖线隔开；没有 tools 的页签不留空位。
- 页签加工具一行放不下：工具落到第二行（data-stacked），页签用整行；宽度够了再回到一行。
- 当前页签有 context：名字后面淡一档写当前对象（BTCUSDT · 15m）；没选中的页签不写。
- status：名字前一个小点，live 绿、stale 琥珀、error 红，读屏名取 labels.status。
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
  role=tablist · 页签（状态点 · 图标 · 名字 · 当前对象 · 角标）· 「×」
  DropdownMenu（「…」）
  「+」
  当前页签的 tools（role=group，放不下落到第二行）
  actions（宿主给的按钮）
```

## Keyboard

- `← → Home End`：在页签间移焦点
- `Enter / 空格`：切到聚焦的页签
- `Delete / Backspace`：移除聚焦的页签，焦点落到相邻的页签
- `Alt + ← →`：把聚焦的页签往前 / 往后挪一位
