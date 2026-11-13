# ThemeSelector

每个主题一张缩略预览（迷你控制台），选中的那张加一圈环，环在选项之间用弹簧滑过去。缩略颜色由调用方传，所以能同时预览别的主题。学自 rare-ui。

## Provide

### ThemeSelector

role=radiogroup；tab 只停在选中那张。value 传 null 表示受控但还没选。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `themes` | `ThemeOption[]` | — | { value, label, colors: { rail, panel, line, strong, muted, tile } }（必填）。 |
| `value / defaultValue / onChange` | `string` | — | 当前主题。 |
| `label` | `string` | — | 整组的读屏名（必填）。 |
| `showLabels` | `boolean` | `true` | 缩略下面写不写名字（读屏名不受影响）。 |
| `disabled` | `boolean` | — | 整组禁用。 |

## States

- 选中的那张加一圈环，环在选项之间用弹簧滑过去。
- 禁用：不响应。

## Don't

- 缩略颜色由调用方传，不要在包里写死主题色。

## Composition

```
ThemeSelector
  button role=radio（缩略 SVG + 选中环）
  span（名字）
```

## Keyboard

- `Tab`：进入 / 离开整组（停在选中那张）
- `← → ↑ ↓`：移到上一张 / 下一张并选中，到头循环
- `Home / End`：第一张 / 最后一张
