# Input

单行文本框：30 高（sm 26 高），4% 白底 8% 白边；聚焦边变亮，禁用降到 45%。

## Provide

### Input

其余属性透传给原生 input；type 默认 text。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `size` | `'default' \| 'sm'` | `'default'` | default 30 高；sm 26 高、字号取 data 档。 |

### inputVariants

返回类名的函数，给 textarea 等非 input 元素用。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `size` | `'default' \| 'sm'` | `'default'` | 同 Input。 |
| `multiline` | `boolean` | `false` | 多行：高度由内容定。 |

## States

- 默认、有值、禁用。
- aria-invalid 时边框变危险色。
- 焦点：边框提亮（focus-ring）。

## Don't

- 不要不带 label 就放出去。
- 不要在占位符里放必须读的信息。

## Composition

```
Input
```

## Keyboard

- `Tab`：聚焦；聚焦时边框提亮
