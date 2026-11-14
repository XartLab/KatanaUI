# Tabs

页签的选中块是一块跟着滑的底（弹簧）；default 是药丸底，line 是下划线。

## Provide

### Tabs

其余属性透传给 Radix Tabs.Root。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `value / defaultValue / onValueChange` | `string / string / (value: string) => void` | — | 受控与不受控。 |
| `bare` | `boolean` | — | 不带皮肤。 |

### TabsList

其余属性透传给 Radix Tabs.List。tabsListVariants 是它的类名函数。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `variant` | `'default' \| 'line' \| 'bare'` | `'default'` | bare 不带皮肤，样子由调用方的类名给。 |

### TabsTrigger

其余属性透传给 Radix Tabs.Trigger。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `value` | `string` | — | 对应 TabsContent 的 value。 |
| `disabled` | `boolean` | — | 这一页签灰掉。 |
| `bare` | `boolean` | — | 不带皮肤。 |

### TabsContent

其余属性透传给 Radix Tabs.Content。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `value` | `string` | — | 对应 TabsTrigger 的 value。 |

## States

- 选中、未选、禁用页签。
- 默认与 line 两种样式。

## Don't

- 页签名保持短，一行放得下。

## Composition

```
Tabs
  TabsList
    TabsTrigger
  TabsContent
```

## Keyboard

- `← →`：在页签间走并选中
- `Home / End`：跳到首、末页签
- `Tab`：从页签列表跳进当前内容
