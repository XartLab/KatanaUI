# HoldToConfirm

不可撤的动作（全平、全撤、停策略）用的按钮：按住把底色从左填满才触发，松手往回退；键盘按住空格或回车同样。单击不触发。功能参照 Arc，实现原创。

## Provide

### HoldToConfirm

原生 button；进度逐帧直接写样式，不为每一帧重渲染。data-phase（idle / holding / done）与 data-progress（0 到 1）给样式与测试用。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `children` | `ReactNode` | — | 按钮上的字。 |
| `onConfirm` | `() => void` | — | 填满时回调，一次按住只一次；松手再按才能再触发。 |
| `hint` | `string` | — | 读屏与悬停提示，如「按住 2 秒，全部平仓」。必填：没有它读屏用户不知道要按住。 |
| `holdMs` | `number` | `2000` | 按住多久填满。2000 取自 Emil Kowalski 的 hold-to-delete 写法（2026-11-14 读），对交易动作是否合适没有实测，默认值待定；越不可撤越长。 |
| `releaseMs` | `number` | `200` | 松手后从满格退回空格要多久（同一出处）。 |
| `confirmedLabel` | `ReactNode` | — | 填满后的字，原地换掉 children，直到松手退完。 |
| `tone` | `'danger' \| 'default'` | `'danger'` | 填充色：红，或中性。 |
| `disabled` | `boolean` | — | 灰掉，按不动。 |

## States

- 空闲：和普通按钮一样。
- 按住：填充从左往右走；到 holdMs 填满并触发，字换成 confirmedLabel。
- 松手：填充在 releaseMs 内退回；填满后手还按着，填充停在满格，松手才退。
- 焦点移走或指针被抢走：按松手处理，退回。

## Don't

- 不要拿它做可撤销的动作：那些直接用 Button，确认框和按住都是摩擦。
- 不要缩短 holdMs 到几百毫秒：那和单击没有区别。
- hint 要写清按多久、做什么，读屏用户靠它。

## Composition

```
HoldToConfirm
  button
    span.k-hold-fill（scaleX 填充）
    span.k-hold-label
    span.sr-only（hint）
```

## Keyboard

- `空格 / Enter（按住）`：开始填充；松开退回；填满触发。长按产生的连发只算第一下
- `Tab`：焦点移走即当作松手
