# InlineEdit

读得多、改得少的短字段（自选分组名、布局名、策略名、预警名）原地改：点一下字变成同样大小的输入框，光标落在点的那个字上（键盘激活是全选）；Enter 保存、Esc 放弃、点到外面也保存。保存是乐观的：字先换成新值，onSave 的 Promise 落定后打一个勾；reject 就退回上次存下的值，框下说为什么并给「重试」。字体字号都继承外面，as 让标题仍是标题。改自 Arc inline-edit（MIT），只做单行。

## Provide

`*` marks a required prop.

### InlineEdit

静止时是一个 button（读屏名「label: 值」，描述是 labels.editHint），编辑时是 input（读屏名 label）。保存结果在 role=status 的屏外区播报。value 是存下的值：外面改了它，没在编辑或保存时直接换上。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `value` * | `string` | — | The saved value; a new value from outside replaces the text while it is not being edited or saved. |
| `onSave` * | `(next: string) => void \| Promise<unknown>` | — | Persists the new value; return a promise to show the saving state, reject it to roll back. |
| `label` * | `string` | — | Accessible name of the field, for example "Watchlist name". |
| `validate` | `(next: string) => string \| null \| undefined` | — | Return a message when the draft cannot be saved; editing stays open and the message shows below. |
| `placeholder` | `string` | `''` | Shown when the value is empty. |
| `as` | `'span' \| 'p' \| 'h1' \| 'h2' \| 'h3' \| 'h4'` | `'span'` | Element that holds the text, so a title can stay a heading. |
| `disabled` | `boolean` | — | Show the text without letting it be edited. |
| `labels` * | `InlineEditLabels` | — | Texts: editHint, save, cancel, failed and retry are required. |
| `className` | `string` | — | Extra class name on the root. |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { useState } from 'react'
import { InlineEdit } from '@katana-ui/react'

export function InlineEditUsage() {
  const [name, setName] = useState('Core holdings')
  return (
    <InlineEdit
      as="h3"
      value={name}
      label="Watchlist name"
      validate={(next) => (next ? null : 'A name is required')}
      onSave={(next) => setName(next)}
      labels={{
        editHint: 'Activate to edit',
        save: 'Save name',
        cancel: 'Cancel editing',
        failed: (text) => `Could not save “${text}”, the last saved name is back.`,
        retry: 'Try again',
      }}
    />
  )
}
```

## States

- 静止：透明边，悬停给按钮的悬停底，右边淡出一支铅笔。
- 编辑：输入框的皮，宽度跟着字长；右边是保存与取消两个图标钮。
- 校验不过：红边，框下写原因，留在编辑态。
- 保存中：字已是新值，右边转圈（只有加载才转）。
- 已保存：右边一个绿勾，1.8 秒后收起（Arc 的时长）。
- 保存失败：退回上次的值，右边红色叹号，框下说明并给「重试」。
- 禁用：只显示字，没有铅笔。

## Don't

- 几个字段要一起存时不要用它：用表单和一个提交按钮。
- 不要拿它改价格、数量这类下单参数：那些用 NumberInput，改完要经下单确认。
- 长段描述不要用它：现在只做单行。

## Composition

```
InlineEdit
  div.k-inedit
    as（span / h1–h4）
      button（静止）或 span.k-inedit-field（编辑：镜像字 + input）
      span.k-inedit-slot（铅笔 / 保存与取消 / 转圈 / 勾 / 叹号）
    p.k-inedit-message（校验或失败，失败带「重试」）
    span.sr-only × 2（编辑提示、role=status 播报）
```

## Keyboard

- `Enter / Space`：静止时：进编辑并全选
- `Enter`：编辑时：保存（输入法组字时不算）
- `Esc`：放弃，字回到原样，焦点回到字上
- `Tab`：焦点离开件就保存
