# RadioGroup

一组互斥的单选钮：14px 凹陷圆框，选中后框换亮中性，中心一颗深色点从小弹到位。方向键在选项间移动并选中。改自 SmoothUI（MIT）。

## Provide

`*` marks a required prop.

### RadioGroup

其余属性透传给 UI SDK RadioGroup。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `value` | `string` | — | Selected value (controlled). |
| `defaultValue` | `string` | — | Selected value at first (uncontrolled). |
| `onValueChange` | `(value: string) => void` | — | Called with the chosen value. |
| `orientation` | `'horizontal' \| 'vertical'` | `'vertical'` | Layout direction: vertical (default) or horizontal; also written to aria-orientation. |

### RadioGroupItem

其余属性透传给 UI SDK Radio；文字用 Label 包在外面。

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { Label, RadioGroup, RadioGroupItem } from '@katana-ui/react'

export function RadioGroupUsage() {
  return (
    <RadioGroup defaultValue="limit" aria-label="Order type">
      {['market', 'limit', 'stop'].map((type) => (
        <div key={type} className="flex items-center gap-2">
          <RadioGroupItem value={type} id={`order-${type}`} />
          <Label htmlFor={`order-${type}`}>{type}</Label>
        </div>
      ))}
    </RadioGroup>
  )
}
```

## States

- 未选、已选、禁用、禁用已选。
- 错误（aria-invalid）：框变危险色。
- 竖排（默认）与横排（orientation=horizontal）。

## Don't

- 选项不超过五个才用；更多换 Select。
- 只在两三个选项里切换的工具条，用 ToggleGroup。

## Composition

```
RadioGroup
  RadioGroupItem
  Label
```

## Keyboard

- `Tab`：聚焦到选中项（没有选中项就到第一项）
- `↑ ↓ ← →`：移到上一项或下一项并选中
- `Space`：选中当前项
