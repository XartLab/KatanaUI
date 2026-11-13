# Toolbar

面板头的工具条零件：role=toolbar 的容器、左右两组、每个工具一个槽、图标或文字按钮。哪些放得下、收进「»」是宿主的事（要量宽度）。

## Provide

### Toolbar

其余属性透传给 div；ref 给宿主量宽度、找子元素。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `label` | `string` | — | 工具条的名字（屏幕阅读器念）。 |

### ToolbarGroup

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `side` | `'left' \| 'right'` | — | 左组或右组。 |

### ToolSlot

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `tool` | `string` | — | 工具 id，写成 data-tool，宿主据此量宽度。 |
| `folded` | `boolean` | — | 收起：藏起来但不拆掉（量宽度还要用）。 |
| `separator` | `boolean` | — | 前面画一道分隔线（相邻工具属于不同用途组）。 |

### ToolButton

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `label` | `string` | — | 按钮的名字（aria-label，也是没有 title 时的悬停提示）。 |
| `title` | `string` | — | 悬停提示（比名字多一句说明）。 |
| `keys` | `ReactNode` | — | 提示里跟在后面的快捷键写法。 |
| `pressed` | `boolean` | — | 开关类工具是否开着（aria-pressed，橙色）。 |
| `renderTooltip` | `(button) => ReactElement` | — | 宿主有自己的提示件时包按钮。 |

### useRovingToolbar(ref)

Toolbar 内部用；自己拼工具条的也可以拿去。整条只占一个 Tab 站。

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
