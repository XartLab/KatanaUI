# Button

30 高的默认按钮，六种变体与三种尺寸；悬停提亮、按下缩到 0.97，禁用降到 45% 不透明度。颜色只读 actionable（bold = primary、subtle = icon、negative = danger）、content、separable、focused 这几类 characteristic，高度与内距读密度（data-density 的 size-base、size-row、spacing-*）；「主题 × 密度」那三行在 high、medium、low 下各摆一遍。

## Provide

### Button

其余属性透传给原生 button；type 默认 button，放进表单不会误提交。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `variant` | `'default' \| 'primary' \| 'danger' \| 'ghost' \| 'icon' \| 'link'` | `'default'` | primary 是实心浅色主按钮；danger 字色走危险色；icon 是 28 见方无边的图标钮。 |
| `size` | `'default' \| 'sm' \| 'icon'` | `'default'` | default 30 高；sm 26 高圆角 8；icon 28 见方。 |
| `asChild` | `boolean` | `false` | 渲染成子元素自己（链接、菜单触发器），不套一层 button。 |

### buttonVariants

返回类名的函数，给不是 button 的元素画成按钮（包着文件输入的 label 之类）。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `variant` | `同 Button` | — | 同上。 |
| `size` | `同 Button` | — | 同上。 |

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
