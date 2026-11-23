# RunModeBadge

一块小牌写清现在是哪种模式：模拟、回放、前向测试、实盘。四种样子分明、不混：模拟是虚线灰框，回放是蓝色细框加倒带图形，前向测试是绿色框加淡底与前进箭头，实盘是强调色实心底、粗字与外圈（最醒目，点缓缓呼吸，减弱动效偏好下不动）。每种带自己的图形，灰度或色盲下也分得出。可在词后带一小段补充文字（回放日期、账户名）。文字由调用方传。

## Provide

`*` marks a required prop.

### RunModeBadge

labels 给四种模式各一个词；同一个徽标只有一种模式。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `mode` * | `RunMode` | — | Which mode to show: paper, replay, forward or live. |
| `labels` * | `Readonly<Record<RunMode, string>>` | — | One word per mode, written by the caller (for example Paper, Replay, Forward, Live). |
| `detail` | `string` | — | A short extra text after the word, such as the replay date. |
| `className` | `string` | — | Extra class name on the root. |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { RunModeBadge } from '@katana-ui/react'

const LABELS = { paper: '模拟', replay: '回放', forward: '前向测试', live: '实盘' } as const

export function RunModeBadgeUsage() {
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      <RunModeBadge mode="paper" labels={LABELS} />
      <RunModeBadge mode="replay" labels={LABELS} />
      <RunModeBadge mode="forward" labels={LABELS} />
      <RunModeBadge mode="live" labels={LABELS} />
    </div>
  )
}
```

## States

- 模拟（paper）：灰、虚线框。
- 回放（replay）：蓝、倒带图形。
- 前向测试（forward）：绿、前进箭头、淡底。
- 实盘（live）：强调色实心底、粗字、外圈与呼吸的点。

## Don't

- 不要让 fixture、模拟、回放、实盘共用一块牌或一种样子：用户必须一眼分出现在动的是真钱还是假的。
- 不要用它表达连接是否正常：那是状态灯的事。

## Composition

```
RunModeBadge
  svg（图形，对读屏隐藏）
  span（词）
  span（补充文字，可省）
```
