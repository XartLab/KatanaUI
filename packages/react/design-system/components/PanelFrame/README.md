# PanelFrame

面板的外壳：编号、标题、对象、联动灯、点阵元信息位、局部工具条、右侧图标钮与底部来源行。聚焦时四角画橙色括号。面板不自己画边框与阴影。

## Provide

`*` marks a required prop.

### PanelFrame

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `index` | `string` | — | 面板编号（01、02……），强调色点阵字。 |
| `title` | `string` | — | 标题，同时是外壳的读屏名。 |
| `object` | `string` | — | 当前对象，标题后的小字；前面的「·」由外壳画。 |
| `linkGroup / linkLabel / pinned` | `LinkGroup \| null / string / boolean` | — | 联动组色灯；pinned 画空心圈。 |
| `meta` | `string` | — | 点阵元信息位（刷新频率、周期之类）。 |
| `toolbar` | `ReactNode` | — | 局部工具条，放在标题与图标钮之间。 |
| `source` | `ReactNode` | — | 来源行位：底部一行点阵字，不给就没有。 |
| `focused / brackets` | `boolean` | — | 聚焦面板标题 ink-100；brackets 默认跟着 focused，画四角橙色括号。 |
| `maximized / onSettings / onMaximize / onClose` | `boolean / () => void` | — | 右侧图标钮；不传回调就不画那个钮。 |
| `labels` | `PanelFrameLabels` | — | 设置 / 最大化 / 还原 / 关闭的读屏名，由调用方传。 |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { EmptyState, PanelFrame } from '@katana-ui/react/blocks'

const FRAME_LABELS = { settings: 'Settings', maximize: 'Maximize', restore: 'Restore', close: 'Close' }

// 三种状态并排：普通、聚焦（橙色角括号）、空态（未连接）。内容是写死的示例，不是行情。

export function PanelFrameUsage() {
  return (
    <div
      style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12, width: '100%', height: 250 }}
    >
      <PanelFrame
        index="01"
        title="Watchlist"
        object="Core"
        linkGroup="A"
        linkLabel="Link group A"
        meta="1S"
        source="SOURCE · SIM FEED"
        labels={FRAME_LABELS}
        onMaximize={() => {}}
        onClose={() => {}}
      >
        <p style={{ margin: 12, color: 'var(--ink-300)', font: 'var(--text-data) var(--font-sans)' }}>Normal panel.</p>
      </PanelFrame>
      <PanelFrame
        index="02"
        title="Chart"
        object="AAPL"
        linkGroup="B"
        linkLabel="Link group B"
        meta="LIVE"
        source="SOURCE · SIM FEED"
        focused
        labels={FRAME_LABELS}
        onMaximize={() => {}}
        onClose={() => {}}
      >
        <p style={{ margin: 12, color: 'var(--ink-300)', font: 'var(--text-data) var(--font-sans)' }}>
          Focused panel: brighter title and orange corner brackets.
        </p>
      </PanelFrame>
      <PanelFrame
        index="03"
        title="Order book"
        linkLabel="Link group"
        meta="OFFLINE"
        source="SOURCE · NONE"
        labels={FRAME_LABELS}
        onSettings={() => {}}
        onClose={() => {}}
      >
        <EmptyState tag="NOT CONNECTED" title="No data source">
          <p>Connect a source to see the book.</p>
        </EmptyState>
      </PanelFrame>
    </div>
  )
}
```

## States

- 普通：标题 ink-300。
- 聚焦：标题 ink-100，四角橙色括号。
- 空态：正文摆 EmptyState，不画假数据。

## Don't

- 不要在面板里再画边框与阴影。
- 不要把橙色用在数据上；它只给括号与状态灯。
- 标题栏图标钮不超过 3 个。

## Composition

```
PanelFrame（section）
  头：编号 | 联动灯 | 标题 | 对象 | 工具条 | 元信息 | 图标钮
  正文
  来源行
  角括号（装饰）
```
