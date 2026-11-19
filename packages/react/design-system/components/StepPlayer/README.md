# StepPlayer

左边一个播放 / 暂停 / 重放钮，右边一排圆点：当前一步撑成长条、里面的填充随时间走，走完去下一步。可循环，可点圆点跳步。学自 rare-ui。

## Provide

`*` marks a required prop.

### StepPlayer

值与播放状态都可受控，也可不受控。文字全由 labels 给，包里没有文案。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `steps` | `number \| readonly StepPlayerStep[]` | `4` | Number of steps, or a description of each step (which may carry its own duration). |
| `value` | `number` | — | Current step (0-based). |
| `defaultValue` | `number` | `0` | Initial step when uncontrolled. |
| `onValueChange` | `(index: number) => void` | — | Called with the new step index. |
| `playing` | `boolean` | — | Whether it is playing. |
| `defaultPlaying` | `boolean` | `false` | Initial playing state when uncontrolled. |
| `onPlayingChange` | `(playing: boolean) => void` | — | Called when the playing state changes. |
| `duration` | `number` | `4000` | Default duration of each step in milliseconds. |
| `loop` | `boolean` | `false` | Go back to the first step after the last one finishes and keep playing. |
| `onComplete` | `() => void` | — | Called once when the last step finishes (also when looping). |
| `size` | `StepPlayerSize \| number` | `'md'` | Height of the button and the bar: sm 24px, md 32px (default). |
| `seekable` | `boolean` | `false` | Click a dot to jump to that step; the hit area is at least 44px high. |
| `labels` * | `StepPlayerLabels` | — | Texts for the buttons and announcements: play, pause, replay, group and step (required). |
| `className` | `string` | — | Extra class name on the root. |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { StepPlayer } from '@katana-ui/react'

export function StepPlayerUsage() {
  return (
    <StepPlayer
      steps={3}
      duration={700}
      labels={{
        play: 'Play',
        pause: 'Pause',
        replay: 'Replay',
        group: (at, count) => `Step ${at + 1} of ${count}`,
        step: (at) => `Go to step ${at + 1}`,
      }}
    />
  )
}
```

## States

- 播放中：当前一步撑成长条，里面的填充随时间走。
- 暂停、重放；可循环。
- seekable 时可点圆点跳步。

## Don't

- 它是按时间走的演示进度，不要拿它表示真实任务进度（用 Progress）。
- 尺寸只用 sm（24）与 md（32）：直接写像素数的旧写法留一个版本。
- 可跳时每个圆点都要有读屏名：步上写 label，或给 labels.step。

## Composition

```
StepPlayer
  button（播放 / 暂停 / 重放，图标弹簧缩放着换）
  div role=group（圆点条）
    div（一步：长条 / 亮点 / 暗点）
      button（可跳时的点击区）
```

## Keyboard

- `Tab`：到播放钮，可跳时再到每个圆点
- `Enter / Space`：播放、暂停、重放；在圆点上是跳到那一步
