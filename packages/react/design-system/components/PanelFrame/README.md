# PanelFrame

所有工作台面板共用的外框：标题栏（联动色点、标题、当前对象、工具条、右侧动作）、内容区、可折叠、焦点四角括号。面板自己不画边框与阴影。

## Provide

`*` marks a required prop.

### PanelFrame

其余属性透传给 section。拖动重排、关闭、右键菜单、改名由宿主接。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `focused` | `boolean` | `false` | 焦点面板：标题提亮，其余面板标题退后。 |
| `brackets` | `boolean` | `false` | 画四角括号（大屏模式的焦点面板；什么时候算大屏由宿主定）。 |
| `collapsed / defaultCollapsed` | `boolean` | — | 折叠：只剩标题栏。受控或自管。 |
| `onCollapsedChange` | `(collapsed: boolean) => void` | — | 折叠状态变了。 |
| `classNames` | `Partial<Record<PanelFrameSlot, string>>` | — | 各部分额外挂的类名（宿主的旧类名钩子）。 |

### PanelFrameHeader

其余属性（含 title 悬停提示、onDoubleClick、ref）展开到 header，宿主可以拿 ContextMenuTrigger asChild 包它。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `heading` | `ReactNode` | — | 标题（h2）。不传就没有标题行（空格子）。 |
| `headingHidden` | `boolean` | `false` | 标题只给读屏、不画出来（工具条占着标题栏时）。 |
| `object` | `ReactNode` | — | 标题后的当前对象（品种、过滤条件），等宽小字。 |
| `linkGroup` | `'A' \| 'B' \| 'C' \| 'D' \| null` | — | 联动色点：给组名画那组的颜色；null 画熄灭的环；不传不画。 |
| `labels` | `{ link?, collapse?, expand? }` | — | 色点的名字（有 linkGroup 时必填）、折叠按钮两态的名字（collapsible 时必填）；旧名 linkLabel / collapseLabel / expandLabel 留一个版本。 |
| `pinned` | `boolean` | `false` | 固定（不跟随联动）：色点变空心圆。 |
| `toolbar` | `ReactNode` | — | 标题后的局部工具条（Toolbar）。 |
| `actions` | `ReactNode` | — | 右侧动作槽（设置、最大化、关闭）；不超过三个，更多进设置。 |
| `collapsible` | `boolean` | `false` | 画折叠按钮（名字经 labels.collapse、labels.expand 传）。 |

### PanelFrameBody

其余属性透传给 div（tabpanel 的 role、id 也走这里）。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `status` | `'ready' \| 'loading' \| 'empty' \| 'disconnected'` | `'ready'` | ready 画 children；loading 画骨架；empty、disconnected 画空态（旧名 state 留一个版本）。 |
| `labels` | `{ loading? }` | — | loading 时骨架的名字（读屏念；旧名 loadingLabel）。 |
| `view` | `{ tag?, title, description?, actions? }` | — | empty、disconnected 时空态的文字与动作。 |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { Maximize2, X } from 'lucide-react'
import { useState } from 'react'
import { PanelFrame, PanelFrameBody, PanelFrameHeader } from '@katana-ui/react/blocks'
import { Button } from '@katana-ui/react'

export function PanelFrameUsage() {
  const [focused, setFocused] = useState(true)
  return (
    <div className="gal-stack" style={{ width: '100%', maxWidth: 560 }}>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ width: 270, height: 150 }} data-testid="frame-focus" onPointerDown={() => setFocused(!focused)}>
          <PanelFrame focused={focused} brackets={focused} aria-label="Chart panel">
            <PanelFrameHeader
              heading="Chart"
              object="· BTCUSDT · 1h"
              linkGroup="A"
              labels={{ link: 'Link group A' }}
              actions={
                <>
                  <Button variant="icon" aria-label="Maximize">
                    <Maximize2 />
                  </Button>
                  <Button variant="icon" aria-label="Close">
                    <X />
                  </Button>
                </>
              }
            />
            <PanelFrameBody>
              <p className="gal-note" style={{ padding: 8 }}>
                Panel content decides its own density.
              </p>
            </PanelFrameBody>
          </PanelFrame>
        </div>
        <div style={{ width: 270, height: 150 }}>
          <PanelFrame aria-label="Collapsible panel">
            <PanelFrameHeader
              heading="Watchlist"
              object="· Core · 24"
              linkGroup="B"
              labels={{ link: 'Link group B, pinned', collapse: 'Collapse', expand: 'Expand' }}
              pinned
              collapsible
            />
            <PanelFrameBody>
              <p className="gal-note" style={{ padding: 8 }}>
                Collapse leaves only the title bar.
              </p>
            </PanelFrameBody>
          </PanelFrame>
        </div>
        <div style={{ width: 270, height: 150 }}>
          <PanelFrame aria-label="Orders panel">
            <PanelFrameHeader heading="Orders" linkGroup={null} labels={{ link: 'No link group' }} />
            <PanelFrameBody
              status="disconnected"
              view={{ tag: 'OFFLINE', title: 'Not connected', description: 'Connect an account to see orders.' }}
            />
          </PanelFrame>
        </div>
        <div style={{ width: 270, height: 150 }}>
          <PanelFrame aria-label="Trades panel">
            <PanelFrameHeader heading="Trades" />
            <PanelFrameBody status="loading" labels={{ loading: 'Loading' }} />
          </PanelFrame>
        </div>
      </div>
    </div>
  )
}
```

## States

- 焦点：标题 ink-100，且在大屏下画四角括号；其余面板标题 ink-300。
- 折叠：只剩 32 高的标题栏，内容区隐藏（不拆掉）。
- 固定：联动色点变空心圆；无联动：熄灭的环。
- 加载：内容区是骨架；未连接 / 空：空态，不画假数据。

## Don't

- 面板不要自己画边框、阴影，只用这个壳。
- 标题栏不要放超过三个图标按钮。
- 不要把拖动、关闭、工作区的逻辑写进壳里，经 props 与展开的属性接。

## Composition

```
PanelFrame
  PanelFrameHeader（折叠钮 · 联动色点 · 标题 · 对象 · 工具条 · 动作）
  PanelFrameBody（children / 骨架 / EmptyState）
```

## Keyboard

- `Enter / Space`：折叠按钮：折叠或展开（Tab 进到按钮上）
