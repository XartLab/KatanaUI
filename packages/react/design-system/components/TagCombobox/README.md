# TagCombobox

字段本身是输入框：已选项以小标签排在框里（可换行、可带头像或图标、每个有 ×），光标跟在最后一个标签后面，打字就过滤，命中的字加强。列表每行主文字加可选第二行说明与前缀节点，已选行尾画勾；选或取消后列表不收、输入清空。输入框空着时退格第一次选中最后一个标签、第二次删掉；← → 在标签间移。弹层锚在整个字段上，标签多到换行字段长高时弹层跟着下移。交互参照 Jamie Merrill 的 Multi select combobox，只借交互，样子是我们的。

## Provide

`*` marks a required prop.

### TagCombobox

options 是 { id, label, description?, prefix?, keywords? }；value 受控（id 数组，标签按这个先后排）或 defaultValue 非受控；label 是输入框的读屏名。labels.remove、labels.empty 必填，toggle（右端箭头按钮的读屏名，不传就不画）、list、added、removed、picked 可选；播报走一个 aria-live=polite 的屏外区。defaultOpen、onOpenChange 管列表开关。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `label` * | `string` | — | Accessible name of the field. |
| `options` * | `readonly TagComboboxOption[]` | — | Rows, in the order shown. |
| `value` | `readonly string[]` | — | Ids of the selected options (controlled). |
| `defaultValue` | `readonly string[]` | `[]` | Starting ids (uncontrolled). |
| `onValueChange` | `(value: string[]) => void` | — | Called with the new list of ids after one option is picked or removed. |
| `placeholder` | `string` | — | Hint shown while there are no tags and nothing is typed. |
| `labels` * | `TagComboboxLabels` | — | Texts: remove and empty are required. |
| `defaultOpen` | `boolean` | `false` | The list starts open (uncontrolled). |
| `onOpenChange` | `(open: boolean) => void` | — | Called when the list opens or closes. |
| `disabled` | `boolean` | — | Grey out the field and its tags. |
| `id` | `string` | — | Id of the text box, for a visible label's htmlFor. |
| `className` | `string` | — | Extra class name on the field. |
| `contentClassName` | `string` | — | Extra class name on the popup list. |
| `ref` | `Ref<HTMLInputElement>` | — | Ref to the text input, for focusing it from outside. |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { useState } from 'react'
import { TagCombobox } from '@katana-ui/react'

const OPTIONS = [
  { id: 'aisha', label: 'Aisha Khan', description: 'Design lead' },
  { id: 'ben', label: 'Ben Carter', description: 'Engineer' },
  { id: 'elena', label: 'Elena Petrova', description: 'Product manager' },
  { id: 'hiro', label: 'Hiro Tanaka', description: 'Researcher' },
]

export function TagComboboxUsage() {
  const [reviewers, setReviewers] = useState(['aisha'])
  return (
    <div style={{ width: 320 }}>
      <TagCombobox
        label="Reviewers"
        options={OPTIONS}
        value={reviewers}
        onValueChange={setReviewers}
        placeholder="Add people"
        labels={{ remove: (name) => `Remove ${name}`, empty: 'No match', toggle: 'Show options' }}
      />
    </div>
  )
}
```

## States

- 空：显示占位，列表点字段才开。
- 有标签：标签在框里换行排，输入框跟在最后；字段随之长高，弹层贴着字段下沿。
- 过滤：只留含输入词（大小写与重音不分，空格分开的词都要命中）的行，命中的字加粗提亮；没有匹配写 labels.empty。
- 高亮行：底色一档（--k-selectable-subtle-background-hover），键盘移动时滚进视野；已选行主文字加粗，行尾有勾。
- 选中标签：退格或 ← → 选中的标签画一圈焦点色的环，再按退格或 Delete 删掉。
- 禁用：整框半透明，标签的 × 与箭头也不能点。

## Don't

- 标签是用户自由打出来的文字（代码清单、关键词）时用 TagInput，不要用它。
- 选一个值用 Combobox 或 Select。
- 头像、图标放 prefix，不要把名字只放进图片里：prefix 对读屏是隐藏的，label 才是名字。

## Composition

```
TagCombobox
  PopoverAnchor → div.k-tagcb-box
    span.k-tagcb-tag × n
      span（prefix）
      span（字）
      button（×，不进 Tab 序列）
    input（role=combobox）
    button（箭头，不进 Tab 序列，可选）
  PopoverContent
    div.k-tagcb-list（role=listbox，aria-multiselectable）
      div.k-tagcb-option × n（role=option）
        span（prefix）· span（主文字）· span（说明）· span（勾）
    div（没有匹配时，role=status）
```

## Keyboard

- `点字段 / ↓ / 打字`：打开列表；光标在输入框里
- `↑ ↓`：移动高亮（首尾相接）
- `Enter`：切换高亮行：选中或取消，输入清空，列表不收
- `Esc`：收起列表；列表已收时取消标签选中
- `Backspace`：输入框空着：第一次选中最后一个标签，第二次删掉它
- `← →`：在标签间移选中；→ 过了最后一个回到输入框
- `Delete`：删除选中的标签
