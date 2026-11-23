# FolderReveal

一个合着的文件夹，悬停（或点击）时前盖翻开、里面几张卡扇形展开。装饰件：适用首页、营销页里「一组东西收在一起」的示意；不进交易主界面。

## Provide

`*` marks a required prop.

### FolderReveal

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `items` * | `readonly FolderRevealItem[]` | — | The cards inside, back to front. |
| `label` * | `string` | — | Text on the tab and the spoken name of the folder (required). |
| `tone` | `FolderTone` | `'neutral'` | Hue of the folder. |
| `trigger` | `'hover' \| 'click'` | `'hover'` | Open on hover or on click; touch devices always use click. |
| `open` | `boolean` | — | Whether the folder is open (controlled). |
| `onOpenChange` | `(open: boolean) => void` | — | Called when it opens or closes. |
| `rotation` | `number` | `7` | Fan angle per card, degrees. |
| `spread` | `number` | `62` | Fan spread per card, px. |
| `size` | `number` | `260` | Width of the folder, px. |
| `className` | `string` | — | Extra classes for the root element. |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { FolderReveal } from '@katana-ui/react'

export function FolderRevealUsage() {
  return (
    <FolderReveal
      label="Reports"
      tone="accent"
      items={[
        { id: 'a', content: <div style={{ padding: 8 }}>Q1</div> },
        { id: 'b', content: <div style={{ padding: 8 }}>Q2</div> },
        { id: 'c', content: <div style={{ padding: 8 }}>Q3</div> },
      ]}
    />
  )
}
```

## States

- 合着：只露最上面一张卡的边。
- 悬停或聚焦：前盖翻开，卡依次扇出。
- trigger=click：点开合；触屏一律点。

## Don't

- 不要放进交易主界面：它是插画式交互，不是数据容器。
- 卡里不要放要点的东西：卡合着时 aria-hidden。

## Composition

```
FolderReveal
  div（透视）
    svg（后板）
    div aria-hidden（卡）
    button（前盖）
```
