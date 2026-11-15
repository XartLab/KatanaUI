# Toolbar

面板头的工具条零件：role=toolbar 的容器、左右两组、每个工具一个槽、图标或文字按钮。哪些放得下、收进「»」是宿主的事（要量宽度）。

## Provide

`*` marks a required prop.

### Toolbar

其余属性透传给 div；ref 给宿主量宽度、找子元素。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `ref` | `Ref<T> \| undefined` | — | Allows getting a ref to the component instance. |
| `label` * | `string` | — | Name of the toolbar (read by screen readers). |

### ToolbarGroup

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `side` * | `'left' \| 'right'` | — | Left group or right group. |

### ToolSlot

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `tool` * | `string` | — | Tool id, written as data-tool so the host can measure widths. |
| `folded` | `boolean` | — | Folded: hidden but not removed (it is still measured). |
| `separator` | `boolean` | — | Draw a divider before it (neighbouring tools belong to different groups). |

### ToolButton

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `label` * | `string` | — | Name of the button: read by screen readers, and the hover hint when there is no title. |
| `title` | `string` | — | Hover hint (one more sentence than the name). |
| `keys` | `ReactNode` | — | Shortcut written after the hint (the host writes it from its key map). |
| `pressed` | `boolean` | — | Whether a toggle tool is on (aria-pressed, orange). |
| `disabled` | `boolean` | — | Disable the button. |
| `onClick` * | `() => void` | — | Called when clicked. |
| `className` | `string` | — | Extra class name on the button. |
| `renderTooltip` | `(button: ReactElement) => ReactElement` | — | Wrap the button in the host's own tooltip component; the package tooltip is used when omitted. |
| `children` * | `ReactNode` | — | The icon. |

### useRovingToolbar(ref)

Toolbar 内部用；自己拼工具条的也可以拿去。整条只占一个 Tab 站。

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { Bell } from 'lucide-react'
import { ToolButton, Toolbar, ToolbarGroup, ToolSlot } from '@katana-ui/react/blocks'

export function ToolbarUsage() {
  return (
    <Toolbar label="Chart toolbar">
      <ToolbarGroup side="left">
        <ToolSlot tool="alerts">
          <ToolButton label="Alerts" onClick={() => {}}>
            <Bell />
          </ToolButton>
        </ToolSlot>
      </ToolbarGroup>
    </Toolbar>
  )
}
```

## States

- 按下：pressed 为真时底色常亮。
- 禁用：不可点。
- 折叠：folded 的按钮收进溢出菜单。

## Don't

- 不要在工具条里放表单输入。
- 图标按钮必须带 label。

## Composition

```
Toolbar
  ToolbarGroup
    ToolSlot
      ToolButton
```

## Keyboard

- `Tab`：整条工具条只占一个 Tab 站
- `← / →`：在项间移动（到头不环绕）
- `Home / End`：到第一项 / 最后一项
