# ToggleGroup

一组互斥的按钮，选中块是一块跟着滑的底（弹簧）。default 是设置页样式，sm 是工具条样式。

## Provide

### ToggleGroup

其余属性透传给 Radix ToggleGroup.Root。单选语义：点已选中的项不会取消。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `value` | `string \| null` | — | 当前选中项；null 是一个都没选。 |
| `onValueChange` | `(value: string) => void` | — | 选了另一项。 |
| `variant` | `'default' \| 'sm'` | `'default'` | default 带边的设置页样式；sm 是 26 高的工具条样式。 |
| `pillClassName / textClassName` | `string` | — | 选中块、文字外壳上追加的类名。 |

### ToggleGroupItem

其余属性透传给 Radix ToggleGroup.Item。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `value` | `string` | — | 这一项的值。 |
| `disabled` | `boolean` | — | 这一项灰掉。 |

### toggleGroupVariants / toggleItemVariants

外壳与按钮的类名函数。

## States

- 选中、未选、禁用项。
- 键盘 Tab 到每个按钮，Space 或 Enter 选中。

## Don't

- 超过五项换 Select。

## Composition

```
ToggleGroup
  ToggleGroupItem
```

## Keyboard

- `Tab`：每个按钮都是停靠点（不是方向键走的一组）
- `Space / Enter`：选中这一项
