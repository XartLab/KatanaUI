# NumberInput

一个框：值加可选的单位后缀，没有 −/+ 按钮；打字、方向键、按住左右拖三种改法。

## Provide

### NumberInput

角色是 spinbutton，带当前值与范围；只在值合法时回调，回调的值一定在 min / max 之内。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `value` | `number` | — | 当前值。 |
| `onValue` | `(value: number) => void` | — | 值变了。空串、非数字不回调。 |
| `unit` | `string` | — | 单位后缀；给了读屏读「值 + 单位」。 |
| `min / max` | `number` | — | 范围；越界夹进去。 |
| `step` | `number` | `1` | 步长。 |
| `size` | `'sm'` | — | 26 高；默认 30 高。 |
| `width` | `number` | `96` | 框宽（像素）。 |
| `label` | `string` | — | 读屏名。 |
| `invalid` | `boolean` | — | 红边。 |
| `disabled` | `boolean` | — | 灰掉：不能打字、不能拖、方向键不动它。 |
| `autoValue / autoText` | `number / string` | — | 哨兵值：值等于 autoValue 又没在打字时，框里写 autoText，不把内部的数露给用户。 |

## States

- 默认、聚焦、悬停、禁用、错误。
- 可带单位后缀；打字、方向键、按住左右拖都能改值。

## Don't

- 不要加 −/+ 按钮：这个框没有。
- 单位、小数位由调用方传，件里不猜。

## Composition

```
NumberInput
  input[role=spinbutton]
  span.k-unit（有 unit 时）
```

## Keyboard

- `↑ ↓`：按步长加减；Shift 十档，Alt 精调
- `PageUp / PageDown`：十档
- `Ctrl + Home / End`：跳到 min / max
- `Enter / Esc`：放弃正在打的字
- `拖动`：按住左右拖：向右变大；Shift 粗调、Alt 精调
