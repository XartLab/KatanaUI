# StepPlayer

左边一个播放 / 暂停 / 重放钮，右边一排圆点：当前一步撑成长条、里面的填充随时间走，走完去下一步。可循环，可点圆点跳步。学自 rare-ui。

## Provide

### StepPlayer

值与播放状态都可受控，也可不受控。文字全由 labels 给，包里没有文案。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `steps` | `number \| { duration?, label? }[]` | `4` | 步数，或每一步的描述（可自带时长）。 |
| `value / defaultValue / onValueChange` | `number` | — | 当前第几步（0 起）。 |
| `playing / defaultPlaying / onPlayingChange` | `boolean` | — | 是否在放。 |
| `duration` | `number` | `4000` | 每步默认放多久（毫秒）。 |
| `loop` | `boolean` | `false` | 最后一步放完回到第一步继续。 |
| `onComplete` | `() => void` | — | 最后一步放完触发一次（循环时也触发）。 |
| `seekable` | `boolean` | `false` | 点圆点直接去那一步；点击区至少 44px 高。 |
| `size` | `number` | `32` | 钮与条的高（px）。 |
| `labels` | `StepPlayerLabels` | — | { play, pause, replay, group(index, count), step(index, count) }（必填）。 |

## States

- 播放中：当前一步撑成长条，里面的填充随时间走。
- 暂停、重放；可循环。
- seekable 时可点圆点跳步。

## Don't

- 它是按时间走的演示进度，不要拿它表示真实任务进度。

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
