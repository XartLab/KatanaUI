# Panel

不带标题栏、不画边的纯容器：一块 container 的底色占满格子的高度，内容超出自己滚，内距 12。用在分栏的一栏、对话框里的一块滚动区。三档底：primary（默认）、secondary、tertiary。照 Salt Panel（Apache-2.0，只取结构）。

## Provide

`*` marks a required prop.

### Panel

其余属性透传给 div；高度跟着父元素，父元素要有确定的高度。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `variant` | `'primary' \| 'secondary' \| 'tertiary'` | `'primary'` | Fill: primary (default, the brightest container fill), secondary or tertiary. |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { Panel } from '@katana-ui/react'

export function PanelUsage() {
  return (
    <div style={{ width: 240, height: 120 }}>
      <Panel variant="secondary">Positions go here.</Panel>
    </div>
  )
}
```

## States

- primary（默认）、secondary、tertiary 三档底色，同 Card 的三档。
- 内容超出：自己出滚动条（overflow: auto）。

## Don't

- 要标题栏、折叠、工具条的用 PanelFrame；要边框和圆角的用 Card。
- 内容会超出时让里面有可聚焦的东西，或给 Panel 加 tabIndex={0} 与读屏名，键盘才滚得动。

## Composition

```
Panel（div）
```
