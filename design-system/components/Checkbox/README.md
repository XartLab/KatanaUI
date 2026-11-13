# Checkbox

14px 凹陷方框；选中后中心一块 6px 橙色发光方块（像一颗 LED），框换暗橙边、暗橙底，不画勾。

## Provide

### Checkbox

其余属性透传给 Radix Checkbox.Root。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `checked` | `boolean \| 'indeterminate'` | — | 受控的选中状态。 |
| `defaultChecked` | `boolean` | — | 不受控的初值。 |
| `onCheckedChange` | `(checked: boolean \| 'indeterminate') => void` | — | 点了。 |
| `disabled` | `boolean` | — | 灰掉，不响应。 |
| `aria-invalid` | `boolean` | — | 为真时框边变红。 |

## States

- 未勾、已勾、禁用、禁用已勾、错误（aria-invalid）。

## Don't

- 不要让勾选框单独承载状态而不带文字。

## Composition

```
Checkbox
```

## Keyboard

- `Tab`：聚焦
- `Space`：翻转选中
