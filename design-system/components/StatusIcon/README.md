# StatusIcon

提示条里的成功、失败、警告、说明、进行中：换状态时旧的缩小退出、新的弹入，对勾与叉一笔一笔画出来。学自 rare-ui 的 toast。

## Provide

### StatusIcon

16 见方，role=img。应用的提示条（AlertToasts）用它表达成功与警告。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `status` | `'success' \| 'error' \| 'warning' \| 'info' \| 'pending'` | — | 状态；pending 是转动的弧。 |
| `label` | `string` | — | 读屏名（必填）：不单靠颜色与形状说话。 |

## States

- 成功、失败、警告、说明、进行中五种。
- 换状态时旧的缩小退出、新的弹入，对勾与叉一笔一笔画出来。

## Don't

- 不要单靠图标说话：旁边要有文字。
- label 必须传（读屏名字）。

## Composition

```
StatusIcon
  svg（按 status 换，笔画画出来）
```
