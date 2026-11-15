# Led

8px 的 StatusLED：默认熄灭，只表达真实状态；必须配文字或读屏名，不单靠颜色说话。

## Provide

`*` marks a required prop.

### Led

一个 role=img 的 span，名字是 label。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `state` | `LedState` | `'off'` | on glows orange; ok, warn and danger are green, amber and red. |
| `group` | `LinkGroup \| null` | — | Link group: panels in the same group follow the same symbol; the group color overrides state. |
| `hollow` | `boolean` | — | Hollow: transparent fill with a 1px border, no glow. |
| `bare` | `boolean` | — | Set when no text next to the light names the state: the off state draws a 3:1 ring instead of a barely visible dark dot. |
| `small` | `boolean` | — | A 6px light for inline pieces such as pills. |
| `label` * | `string` | — | Accessible name (required). |

### LINK_GROUPS

联动组名的列表 A、B、C、D；组的颜色是 token link-a 到 link-d。

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { Led } from '@katana-ui/react'

export function LedUsage() {
  return (
    <>
      <Led state="ok" label="Connected" />
      <Led state="danger" label="Disconnected" />
    </>
  )
}
```

## States

- 熄灭（默认）、on、ok、warn、danger；联动组按组色。
- 空心、小号两种形态；无文字的灯必须带读屏名。

## Don't

- 不要拿它当装饰：只表达真实状态。
- 不要单靠颜色说话，旁边要有文字或读屏名。
- 联动组 A-D 的颜色取自 Graphite 信号色（赭、粉红、绿、琥珀），不含蓝：设计决定不用 TradingView 蓝。

## Composition

```
Led
```
