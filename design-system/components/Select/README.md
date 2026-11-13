# Select

单选下拉：触发器 30 高，列表贴在触发器下面（不盖住当前项），当前项加粗。

## Provide

### Select

其余属性透传给 Radix Select.Root。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `value` | `string` | — | 当前值；传空串显示 SelectValue 的 placeholder。 |
| `onValueChange` | `(value: string) => void` | — | 选了一项。 |
| `disabled` | `boolean` | — | 整个下拉灰掉。 |

### SelectTrigger

其余属性透传给 Radix Select.Trigger。没有可见文字时要给 aria-label。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `className` | `string` | — | 追加类名（宽度、对齐在这里调）。 |

### SelectValue

其余属性透传给 Radix Select.Value。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `placeholder` | `ReactNode` | — | 没有值时写的字，文案由调用方传。 |

### SelectItem

其余属性透传给 Radix Select.Item。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `value` | `string` | — | 这一项的值。 |
| `leading` | `ReactNode` | — | 文字前面的东西（色带之类），不进触发器上的值。 |

### SelectContent

其余属性透传给 Radix Select.Content。位置固定在触发器下方，偏移 2px。

### SelectArrow

触发器右边的小箭头，自己拼触发器时用。

### selectTriggerVariants / selectItemClass

触发器与列表项的类名，MultiSelect 与应用里别的下拉用它们跟单选下拉长一个样。

## States

- 默认、已选、未选（占位）、禁用。
- 展开：列表项左侧留一列放勾；当前项加粗。

## Don't

- 不要把可以直接点的两三个选项藏进下拉。

## Composition

```
Select
  SelectTrigger
    SelectValue
    SelectArrow
  SelectContent
    SelectItem
```

## Keyboard

- `Enter / Space / ↓`：在触发器上打开列表
- `↑ ↓`：在项之间走
- `Enter`：选中并收起
- `Esc`：收起，焦点回触发器
- `打字`：跳到以它开头的项
