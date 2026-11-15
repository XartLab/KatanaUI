# Button

30 高的默认按钮，六种变体与三种尺寸；悬停提亮、按下缩到 0.97，禁用降到 45% 不透明度。颜色只读 actionable（bold = primary、subtle = icon、negative = danger）、content、separable、focused 这几类 characteristic，高度与内距读密度（data-density 的 size-base、size-row、spacing-*）；「主题 × 密度」那三行在 high、medium、low 下各摆一遍。

## Provide

`*` marks a required prop.

### Button

其余属性透传给原生 button；type 默认 button，放进表单不会误提交。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `variant` | `"link" \| "default" \| "danger" \| "primary" \| "ghost" \| "icon"` | `'default'` | Visual style: primary is the solid light button, danger uses the danger text color, icon is a borderless 28px icon button. |
| `size` | `"default" \| "icon" \| "sm"` | `'default'` | Height: default is 30px, sm is 26px with an 8px radius, icon is a 28px square. |
| `asChild` | `boolean` | `false` | Render the child element itself (a link, a menu trigger) instead of wrapping it in a button. |

### buttonVariants

返回类名的函数，给不是 button 的元素画成按钮（包着文件输入的 label 之类）。

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { Button } from '@katana-ui/react'

export function ButtonUsage() {
  return (
    <>
      <Button variant="primary">Save</Button>
      <Button>Cancel</Button>
    </>
  )
}
```

## States

- 默认：4% 白底 8% 白边，悬停提亮，按下缩到 0.97。
- 禁用：45% 不透明度，不响应指针。
- 焦点：键盘 Tab 到时画 focus-ring 的外框。

## Don't

- 不要在一个区域放两个主要按钮。
- 图标按钮必须带 aria-label。
- 不要用颜色以外没有字的危险按钮。

## Composition

```
Button
```

## Keyboard

- `Tab`：聚焦，焦点环 2px
- `Enter / Space`：触发点击
