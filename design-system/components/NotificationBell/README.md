# NotificationBell

带未读数的铃：数变多时铃从顶端摆一下，角标弹出，数字按增减方向滚；0 时角标收起。学自 rare-ui。

## Provide

### NotificationBell

其余属性透传给 button。角标对读屏隐藏，数变了由名字（label）播报。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `count` | `number` | `0` | 未读数；不是有限数时当 0。 |
| `max` | `number` | `99` | 角标显示到几，超过写「<max>+」。 |
| `variant` | `'count' \| 'dot'` | `'count'` | count 画数字，dot 只画一个点。 |
| `label` | `string` | — | 读屏名（必填），要带上未读数，数变了就换这个字符串。 |

## States

- 0：角标收起。
- 有未读：角标弹出，数字按增减方向滚。
- 数变多：铃从顶端摆一下。

## Don't

- 铃是图标，label 必须传（读屏名字）。

## Composition

```
NotificationBell
  svg（铃，转轴在上）
  span（角标）
  span（role=status 播报）
```

## Keyboard

- `Enter / Space`：点击（按钮）
