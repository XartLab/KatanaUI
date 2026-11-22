# PowerOffSlide

把圆钮从左拖到头才算数，拖不到头松手就弹回。拿来做「全部平仓」「清仓」「关闭策略」这类不可轻易误触的操作。轨上的字有一道光扫过，圆钮拖远了字渐渐淡掉；确认后轨换成「执行中」文字，到点圆钮回位。键盘与读屏另有路：圆钮聚焦后按 Enter 或空格直接确认。

## Provide

`*` marks a required prop.

### PowerOffSlide

label、busyLabel 与 icon 必填；onConfirm 只在拖到头或键盘确认时调一次。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `label` * | `string` | — | Text on the track, for example "Slide to close all". |
| `onConfirm` * | `() => void` | — | Called once the knob reaches the end (or Enter is pressed on it). |
| `busyLabel` * | `string` | — | Shown instead of the track while busy, for example "Closing positions…". |
| `icon` * | `ReactNode` | — | Icon on the knob. |
| `duration` | `number` | `2000` | How long the busy text stays before the knob returns, in milliseconds. |
| `disabled` | `boolean` | `false` | Stop the knob from being dragged or confirmed. |
| `className` | `string` | — | Extra class name on the root. |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { Power } from 'lucide-react'
import { PowerOffSlide } from '@katana-ui/react'

export function PowerOffSlideUsage() {
  return (
    <PowerOffSlide
      label="Slide to close all"
      busyLabel="Closing…"
      icon={<Power aria-hidden="true" />}
      onConfirm={() => undefined}
    />
  )
}
```

## States

- 待机：圆钮在左端，轨上字闪光。
- 拖动：圆钮跟手，超过 160px 松手算确认。
- 执行中：轨换成 busyLabel（role=status），duration 后回位。
- 禁用：圆钮半透明不可拖。

## Don't

- 不要用来确认可撤销的小事：普通确认用 Dialog 或 Button。
- 不要把它当唯一的确认入口：键盘与读屏靠 Enter，要在文档里写出来。

## Composition

```
PowerOffSlide
  div
    div（轨）
      motion.div（字）
      motion.div（role=button，圆钮）
    p（执行中）
```

## Keyboard

- `Enter / Space`：圆钮聚焦时直接确认
