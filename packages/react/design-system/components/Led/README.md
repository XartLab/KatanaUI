# Led

8px 的 StatusLED：默认熄灭，只表达真实状态；必须配文字或读屏名，不单靠颜色说话。

## Provide

### Led

一个 role=img 的 span，名字是 label。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `state` | `'off' \| 'on' \| 'ok' \| 'warn' \| 'danger'` | `'off'` | on 是橙色发光，ok / warn / danger 是绿、琥珀、红。 |
| `group` | `'A' \| 'B' \| 'C' \| 'D' \| null` | — | 联动组：同组的面板跟着同一个品种走；给了就用组的颜色，盖过 state。 |
| `hollow` | `boolean` | — | 空心：透明底加 1px 边，不发光。 |
| `bare` | `boolean` | — | 旁边没有写出状态的文字时给：熄灭态画一圈 3:1 的环，不靠几乎看不见的暗点（WCAG 1.4.11）。 |
| `small` | `boolean` | — | 6px 的小灯，药丸这样的行内小件里用。 |
| `label` | `string` | — | 读屏名（必填）。 |

### LINK_GROUPS

联动组名的列表 A、B、C、D；组的颜色是 token link-a 到 link-d。

## States

- 熄灭（默认）、on、ok、warn、danger；联动组按组色。
- 空心、小号两种形态；无文字的灯必须带读屏名。

## Don't

- 不要拿它当装饰：只表达真实状态。
- 不要单靠颜色说话，旁边要有文字或读屏名。

## Composition

```
Led
```
