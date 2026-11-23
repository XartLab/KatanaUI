# HoverExpand

并排的一组面板，鼠标移到哪块哪块撑开（flex-grow 弹簧 4 比 1），其余收窄、标题竖排；键盘聚焦与方向键同样展开。拿来放板块概览、策略卡、情景对比这类「同时只看一块细节」的并列项。触屏没有悬停，点击展开。

## Provide

`*` marks a required prop.

### HoverExpand

activeIndex 受控；面板是 aria-pressed 的按钮，children 只在展开时渲染。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `items` * | `readonly HoverExpandItem[]` | — | The panels in order; each has an id, a title and the content shown when open. |
| `label` * | `string` | — | Accessible name of the group. |
| `orientation` | `'horizontal' \| 'vertical'` | `'horizontal'` | Whether the panels sit side by side or one under another. |
| `activeIndex` | `number` | — | Active index (controlled); omit to let the component keep it. |
| `onActiveIndexChange` | `(index: number) => void` | — | Called with the index of the panel that just opened. |
| `expandedFlex` | `number` | `DEFAULT_EXPANDED_FLEX` | Flex-grow of the open panel and of the others. |
| `collapsedFlex` | `number` | `DEFAULT_COLLAPSED_FLEX` | Flex-grow of the closed panels. |
| `className` | `string` | — | Extra class name on the group. |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { HoverExpand } from '@katana-ui/react'

export function HoverExpandUsage() {
  return (
    <div style={{ height: 140 }}>
      <HoverExpand
        label="Sectors"
        items={[
          { id: 'semi', title: 'Semiconductors', children: '+2.34%' },
          { id: 'bank', title: 'Banks', children: '-0.41%' },
          { id: 'ai', title: 'AI compute', children: '+3.10%' },
        ]}
      />
    </div>
  )
}
```

## States

- 展开：flex-grow 4，显示 children。
- 收起：flex-grow 1，只剩竖排标题。
- 聚焦：同悬停，立即展开。

## Don't

- 展开区不要放可点击的控件：悬停到别的面板它就收起了；要交互的内容用 Tabs。
- 不要超过 5 个面板：收起后标题挤不下。

## Composition

```
HoverExpand
  div（role=group）
    motion.button
      motion.div（标题与内容）
```

## Keyboard

- `← → / ↑ ↓`：横排 / 竖排时切到相邻面板
- `Tab`：聚焦即展开
