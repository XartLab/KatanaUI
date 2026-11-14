# DecimalField

价格、数量的输入框：值是十进制字符串（不经浮点），按品种的最小变动价位或最小下单量走一格；右边可选 − / + 两个图标按钮，↑ / ↓ 走一格、Shift 十格。

## Provide

### DecimalField

其余属性透传给里面的 input（不含 type、step、size）；className 落在最外层。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `value` | `string` | — | 框里的字，十进制写法；打字自由，合不合法由调用方与 Gateway 判。 |
| `onValue` | `(value: string) => void` | — | 打字与走格都回调；走格给的是 toFixed() 的规范字符串。 |
| `step` | `string` | — | 一格有多大（最小变动价位或最小下单量）；"0" 按 1 走。不给用户设步长。 |
| `base` | `string \| null` | `null` | 空框走格从哪起（例：最新价）；没有就空框不动。 |
| `label` | `string` | — | 读屏名（必填：包里没有文字）。 |
| `unit` | `string` | — | 框里右侧的单位后缀，不可点。 |
| `placeholder` | `string` | — | 空框时的占位字。 |
| `disabled` | `boolean` | `false` | 灰掉：不能打字，方向键与按钮都不动它。 |
| `readOnly` | `boolean` | `false` | 能选能复制，方向键与按钮都不改值。 |
| `status` | `'error' \| 'warning'` | — | error：aria-invalid 并换危险色边；warning：只换琥珀色边，不设 aria-invalid。 |
| `buttons` | `{ decrease: string; increase: string }` | — | 给了才显示 − / + 按钮；两个字符串是读屏名，也是悬停提示。包里不带语言。 |

## States

- 默认：打字自由；↑ / ↓ 走一格，Shift 十格；空框从 base 起，不在格子上的第一格先往走的方向对齐。
- 走到 0 或以下、框里不是十进制写法：不动。
- 只读、禁用：方向键与 − / + 都不改值；禁用还不能打字。
- error：aria-invalid=true；warning：只换边色，读屏不报无效。

## Don't

- 不要把值转成 number 再传：价格与数量不经浮点。
- 不要在包里写按钮文字，buttons 由调用方传。
- 不要在这里校验价位：在不在格子上由调用方与 Gateway 判。

## Composition

```
DecimalField
  Input
  Button（icon，− / +，带悬停提示）
  stepDecimal（format 子出口）
```

## Keyboard

- `↑ / ↓`：加或减一格
- `Shift + ↑ / ↓`：十格
- `Tab`：从输入框到 − 再到 +；Enter / Space 触发按钮
