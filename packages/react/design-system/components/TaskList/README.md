# TaskList

点一行打勾：圆圈填上强调色、对勾一笔画出来、文字被一道线划掉，划完这一行沉到底部，其余行弹簧补位；再点取消，回到原位。学自 rare-ui。

## Provide

### TaskList

每行是 role=checkbox 的按钮；屏外有 role=status 的区播报勾上与取消。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `tasks / defaultTasks / onTasksChange` | `Task[]` | — | { id, label, done? }；可受控也可不受控。 |
| `labels` | `TaskListLabels` | — | { completed(label), reopened(label) }：播报的话（必填）。 |
| `label` | `string` | — | 清单的读屏名。 |

## States

- 未勾：空圈。
- 已勾：圆圈填强调色、对勾画出、文字划掉，沉到底部。
- 再点取消，回到原位。

## Don't

- 任务文案与标签由调用方传。

## Composition

```
TaskList
  li（layout 动画）
    button role=checkbox（圆圈 + 对勾 + 划线文字）
  li role=status（播报）
```

## Keyboard

- `Tab`：在各行之间移动
- `Space / Enter`：勾上或取消
