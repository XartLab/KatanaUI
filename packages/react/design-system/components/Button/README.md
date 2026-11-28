# Button

30 高的默认按钮，六种变体与三种尺寸；悬停提亮、按下缩到 0.97，禁用降到 45% 不透明度。颜色只读 actionable（bold = primary、subtle = icon、negative = danger）、content、separable、focused 这几类 characteristic，高度与内距读密度（data-density 的 size-base、size-row、spacing-*）；「主题 × 密度」那三行在 high、medium、low 下各摆一遍。

## Provide

`*` marks a required prop.

### Button

其余属性透传给原生 button；type 默认 button，放进表单不会误提交。pending：动作进行中，满 300ms 才在原地出转圈（出了至少留 500ms），字与宽度不变，期间再按无效但仍可聚焦，aria-busy=true；spinIcon 配 pending，按钮自己的图标就是动作（刷新、同步）时转它自己，至少一整圈、停在整圈上。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `variant` | `"link" \| "default" \| "danger" \| "primary" \| "ghost" \| "icon"` | `'default'` | Visual style: primary is the solid light button, danger uses the danger text color, icon is a borderless 28px icon button. |
| `size` | `ButtonSize \| 'default' \| null` | — | Height: sm is 26px, md (default) is 30px, icon is a 28px square. |
| `asChild` | `boolean` | `false` | Render the child element itself (a link, a menu trigger) instead of wrapping it in a button. |
| `effect` | `ButtonEffect` | — | Optional hover effect from SmoothUI: magnetic leans toward the pointer, dot-morph stretches a leading dot into a bar, clip-corners cuts the corners wider. |
| `magnetStrength` | `number` | `0.3` | How far a magnetic button leans: the fraction of the pointer offset it follows (0 to 1). |
| `magnetRadius` | `number` | `120` | Distance in px from the button center within which a magnetic button reacts. |
| `pending` | `boolean` | `false` | The action is running. |
| `spinIcon` | `boolean` | `false` | Use with pending when the button's own icon already means the action (refresh, sync): that icon turns from the press, at least one whole turn, and stops on a whole turn; no separate spinner. |

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
- 尺寸：md（默认，30 高）、sm（26 高、圆角 8、字 11 粗 600）、icon（28 见方，只放图标）；旧名 size="default" 等于 md。
- 禁用：45% 不透明度，不响应指针。
- 进行中（pending）：满 300ms 才出一个小环（有字的按钮画在左内边距里，图标按钮里换掉原图标），出了至少留 500ms；字与宽度不变，不灰，aria-busy，再按无效但键盘与读屏仍能到；300ms 内结束的不出转圈。
- 焦点：键盘 Tab 到时画 focus-ring 的外框。
- effect（改自 SmoothUI，MIT）：magnetic 指针靠近时按钮朝它偏、离开弹回；dot-morph 前面一颗点悬停时拉成竖条；clip-corners 四个角切掉、悬停时切口变大。三种只在有精确指针的设备上动。

## Don't

- 不要在一个区域放两个主要按钮。
- 图标按钮必须带 aria-label。
- 不要用颜色以外没有字的危险按钮。
- effect 一个界面里最多给一两个主操作用，不要成排；dot-morph 不能与 asChild 同用。
- 不要在按钮转圈的同时再盖整页遮罩或顶部进度条：一次等待只留一个指示。

## Composition

```
Button
```

## Keyboard

- `Tab`：聚焦，焦点环 2px
- `Enter / Space`：触发点击
