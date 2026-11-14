# PasswordInput

带眼睛按钮的输入框：默认遮住，点一下显示或遮住；上下眼睑用弹簧开合，输入框不丢焦点与选区。学自 rare-ui（不要强度条）。

## Provide

### PasswordInput

其余属性透传给 Input（不含 type）；ref 指向里面的 input。自动填充、拼写检查、自动大写默认关。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `toggleLabel` | `string` | — | 眼睛按钮的读屏名（必填）。名字不随状态变，当前是否显示由 aria-pressed 表达。 |
| `defaultVisible` | `boolean` | `false` | 一开始就显示明文。 |
| `onVisibleChange` | `(visible: boolean) => void` | — | 切换时回调。 |
| `size` | `'default' \| 'sm'` | `'default'` | 同 Input：30 高与 26 高。 |

## States

- 默认：内容遮住，眼睛是闭着的。
- 点眼睛：显示明文，输入框不丢焦点与选区，眼睑睁开；再点遮回去。
- 禁用：按钮不可点。

## Don't

- 眼睛按钮的读屏名 toggleLabel 必须传，包里不写文案。
- 不要用它放不需要遮住的普通文本。

## Composition

```
PasswordInput
  Input
  button（眼睛，aria-pressed）
```

## Keyboard

- `Tab`：从输入框到眼睛按钮
- `Enter / Space`：显示或遮住（按钮上）
