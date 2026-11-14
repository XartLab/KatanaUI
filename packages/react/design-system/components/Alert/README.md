# Alert

嵌在页面里的一条说明（弹出的提示是 Toast）：左边一道 2px 色条标语气，第一个子元素是 svg 时当图标。

## Provide

`*` marks a required prop.

### Alert

其余属性透传给 div。语气不能只靠颜色：标题或说明里要写字。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `tone` | `"default" \| "ok" \| "warn" \| "danger"` | — | Color of the stripe and the icon. |

### AlertTitle / AlertDescription

都是 div。

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { Alert, AlertDescription, AlertTitle } from '@katana-ui/react'

export function AlertUsage() {
  return (
    <Alert tone="warn">
      <AlertTitle>Close to the daily loss limit</AlertTitle>
      <AlertDescription>80% used; trading locks at 100%.</AlertDescription>
    </Alert>
  )
}
```

## States

- default、ok：role=status；warn、danger：role=alert。
- 左边 2px 色条取语气的颜色。

## Don't

- 不要用它代替弹出提示：Alert 是页面里一直在的说明。
- 不要给一直在页面里的 Alert 保留 role=alert，传 role=note。
- 不要只靠颜色区分语气，标题要写明。

## Composition

```
Alert
  svg（图标，可选）
  AlertTitle
  AlertDescription
```
