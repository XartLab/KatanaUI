# Switch

34 × 18 的轨道画在 40 × 28 的布局盒里；开时轨道换强调色，圆钮挪过去。

## Provide

### Switch

其余属性透传给 Radix Switch.Root。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `checked` | `boolean` | — | 受控的开关状态。 |
| `defaultChecked` | `boolean` | — | 不受控的初值。 |
| `onCheckedChange` | `(checked: boolean) => void` | — | 拨了一下。 |
| `disabled` | `boolean` | — | 灰掉，不响应。 |

## States

- 关、开、禁用关、禁用开。

## Don't

- 不要用开关做「提交」这类一次性动作。

## Composition

```
Switch
```

## Keyboard

- `Tab`：聚焦
- `Space / Enter`：翻转
