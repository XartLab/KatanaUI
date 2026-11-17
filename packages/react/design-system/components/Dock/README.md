# Dock

一排工具图标，指针靠近时按距离放大（升余弦衰减，邻居跟着长）；悬停或聚焦出标签；选中时往上弹跳；active 的在底下画一个点。

## Provide

`*` marks a required prop.

### Dock

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `items` * | `readonly DockItem[]` | — | The entries to show. |
| `label` * | `string` | — | What screen readers call this toolbar (required). |
| `baseSize` | `number` | `40` | Resting edge length of every tile in px. |
| `gap` | `number` | `8` | Space between tiles in px. |
| `magnification` | `number` | `1.6` | Scale of the tile right under the pointer. |
| `distance` | `number` | `140` | Radius of the pointer's influence in px; about three tile pitches reads best. |
| `orientation` | `'horizontal' \| 'vertical'` | `'horizontal'` | Lay the tiles out in a row or a column. |
| `className` | `string` | — | Extra classes for the root element. |

### falloff

放大的衰减曲线：指针正下是 1，影响半径外是 0。

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { BarChart3, FlaskConical, Newspaper } from 'lucide-react'
import { Dock } from '@katana-ui/react'

export function DockUsage() {
  return (
    <Dock
      label="Workbench tools"
      items={[
        { id: 'chart', label: 'Chart', icon: <BarChart3 />, active: true },
        { id: 'backtest', label: 'Backtest', icon: <FlaskConical /> },
        { id: 'news', label: 'News', icon: <Newspaper /> },
      ]}
    />
  )
}
```

## States

- 静止：所有图标原大小。
- 指针靠近：按距离放大，标签出现。
- 键盘聚焦：标签出现。
- 选中：图标弹跳一次。

## Don't

- 不要当主导航：它是工具坞，放四到八个常用动作。
- 不要在触屏为主的界面放它：放大靠指针。
- 没有简化的积分布局：整排的中心会随指针略有漂移。

## Composition

```
Dock
  div role=toolbar
    div（一格）
      button（图标）
      span（标签，隐藏时不进读屏）
```

## Keyboard

- `← →`：在图标间走（竖排为 ↑ ↓）
- `Enter / Space`：选中
