# DockWorkspace

可以自己摆的工作区：每个格子是一组页签；把页签拖到别的格子的上、下、左、右、中五个落点就分屏或并组，拖动时实时预览落在哪；格子之间拖分隔条改大小；页签组可以浮起来、最大化再还原；整个布局存成 JSON 再还原。引擎是 Dockview（MIT），我们接上自己的几层：面板由组件清单定义（最小尺寸、只许一个的组件）；页签带状态点、当前对象与角标；页签栏右端只放当前页签那个组件的工具；左端「+」把当前组件的种类带给宿主去开目录；ComponentCatalog 的卡片可以直接拖进来落在任意落点。手感参照 Blender 4.x 的区域停靠。

## Provide

`*` marks a required prop.

### DockWorkspace

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `ref` | `Ref<DockWorkspaceHandle>` | — | Imperative handle: add, reset, save and the raw Dockview API. |
| `manifests` * | `readonly ComponentManifest[]` | — | Everything that can be placed; panels are created from these by id. |
| `render` * | `(component: string, panelId: string) => ReactNode` | — | Draws a component's content. |
| `tools` | `(component: string, panelId: string) => ReactNode` | — | Draws a component's own tools, shown in its group's tab bar while its tab is selected. |
| `meta` | `(panelId: string, component: string) => DockPanelMeta \| undefined` | — | Live tab details per panel: status dot, current object, badge. |
| `defaultPanels` * | `readonly DockPanelSeed[]` | — | The layout used at first and after reset. |
| `layout` | `SerializedDockview` | — | A saved layout to restore instead of the default; falls back to the default if it cannot be read. |
| `onLayoutChange` | `(layout: SerializedDockview) => void` | — | Called with the layout JSON whenever it changes. |
| `onPlacedChange` | `(components: string[]) => void` | — | Called with the component ids currently placed whenever panels are added or removed. |
| `onRequestAdd` | `(panelId: string \| undefined, kind: string \| undefined) => void` | — | Called when a group's + is clicked, with the active panel id and its component kind; leave out to hide the +. |
| `labels` * | `DockWorkspaceLabels` | — | Accessible names. |
| `className` | `string` | — | Extra class name on the workspace. |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { useRef, useState } from 'react'
import { Button, ToggleGroup, ToggleGroupItem } from '@katana-ui/react'
import {
  ComponentCatalog,
  DockWorkspace,
  catalogFromManifests,
  type ComponentManifest,
  type DockWorkspaceHandle,
} from '@katana-ui/react/blocks'

const CATEGORIES = [
  { id: 'market', name: 'Market' },
  { id: 'orders', name: 'Orders' },
  { id: 'trade', name: 'Trading' },
]

// Demo manifests: what each component is, where it applies and what it needs.
const MANIFESTS: ComponentManifest[] = [
  { id: 'chart', name: 'Chart', category: 'market', kind: 'chart', minSize: { width: 240, height: 140 } },
  { id: 'book', name: 'Order book', category: 'market', kind: 'table', pairsWith: ['chart'], keywords: ['depth'] },
  { id: 'trades', name: 'Trades', category: 'market', kind: 'list', pairsWith: ['chart'] },
  { id: 'funding', name: 'Funding', category: 'market', kind: 'gauge', markets: ['crypto-perp'] },
  { id: 'company', name: 'Company', category: 'market', kind: 'text', markets: ['us-stock'] },
  { id: 'orders', name: 'Open orders', category: 'orders', kind: 'table' },
  { id: 'positions', name: 'Positions', category: 'orders', kind: 'table', needs: ['account'] },
  { id: 'ticket', name: 'Order ticket', category: 'trade', kind: 'form', singleton: true },
]

export function DockWorkspaceUsage() {
  const dock = useRef<DockWorkspaceHandle>(null)
  const [placed, setPlaced] = useState<readonly string[]>([])
  const [interval, setInterval] = useState('15m')
  const [target, setTarget] = useState<{ panelId?: string; kind?: string } | null>(null)
  const items = catalogFromManifests(
    MANIFESTS,
    { market: 'crypto-perp', capabilities: [], inUse: placed },
    { market: () => 'Stocks only', needs: (_, capability) => `Needs ${capability}` },
  )
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%' }}>
      <div style={{ height: 380, border: '1px solid var(--k-separable-tertiary-borderColor)' }}>
        <DockWorkspace
          ref={dock}
          manifests={MANIFESTS}
          defaultPanels={[
            { component: 'chart' },
            { component: 'book', beside: 'chart', direction: 'right', size: 220 },
            { component: 'orders', beside: 'chart', direction: 'below', size: 130 },
          ]}
          render={(component) => (
            <div style={{ padding: 12, color: 'var(--k-content-secondary-foreground)' }}>
              {MANIFESTS.find((manifest) => manifest.id === component)?.name}
            </div>
          )}
          tools={(component) =>
            component === 'chart' ? (
              <ToggleGroup size="sm" aria-label="Interval" value={interval} onValueChange={setInterval}>
                {['15m', '1H', '1D'].map((value) => (
                  <ToggleGroupItem key={value} value={value}>
                    {value}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            ) : component === 'orders' || component === 'positions' ? (
              <Button size="sm">Columns</Button>
            ) : null
          }
          meta={(_, component) =>
            component === 'chart'
              ? { status: 'live', context: `BTCUSDT · ${interval}` }
              : component === 'orders'
                ? { badge: '3' }
                : undefined
          }
          onPlacedChange={setPlaced}
          onRequestAdd={(panelId, kind) => setTarget({ panelId, kind })}
          labels={{
            add: 'Add component',
            close: 'Close {name}',
            maximize: 'Maximise',
            restore: 'Restore',
            float: 'Float',
            tools: '{name} tools',
            status: { live: 'Live', stale: 'Not updating', error: 'Error' },
          }}
        />
      </div>
      {target ? (
        <div style={{ maxWidth: 420 }}>
          <ComponentCatalog
            items={items}
            categories={CATEGORIES}
            context={target.kind}
            onToggle={(id, add) => {
              if (add) dock.current?.add(id, target.panelId ? { groupOf: target.panelId } : undefined)
              else dock.current?.api?.panels.find((panel) => panel.params?.component === id)?.api.close()
            }}
            onReset={() => dock.current?.reset()}
            labels={{
              title: 'Add components',
              hint: target.kind
                ? `Adding next to: ${target.kind}`
                : 'Click to add or remove, or drag a card onto a panel.',
              reset: 'Reset layout',
              search: 'Search components',
              all: 'All',
              recommended: 'Recommended here',
              empty: 'No component matches.',
              inUse: 'in workspace',
            }}
          />
        </div>
      ) : null}
    </div>
  )
}
```

## States

- 起始：按 defaultPanels 搭；给了 layout 就还原它，读不了退回默认布局。
- 拖页签到别的格子：落点高亮预览（上、下、左、右是分屏，中间是并进那一组）。
- 最大化：这一组铺满工作区，按钮换成还原；再点回到原来的布局。
- 浮起：这一组变成浮在工作区上的小窗，可拖动与改大小；浮窗的页签栏上没有浮起钮。
- 加一个 singleton 的组件而它已经在：不新建，切到已有的那个页签。
- 同一个组件放第二份：面板 id 自动加序号（chart、chart-2）。

## Don't

- 不要自己再写一套拖放分屏：页签的拖动、落点、分隔条都交给引擎。
- 不要把固定不变的页面做成它；内容固定的用 PanelFrame 加 Splitter。
- 「重置布局」会丢掉用户摆好的布局，宿主要先确认。

## Composition

```
DockWorkspace（DockviewReact）
  每组的页签栏：「+」· 页签（状态点 · 名字 · 当前对象 · 角标 · 「×」）· 当前组件的 tools · 浮起 · 最大化
  面板内容（render 给的）
```

## Keyboard

- `Tab`：进到页签栏与面板内容
- `Enter / 空格`：在「+」、「×」、浮起、最大化上触发
