# TagInput

在一个输入框里打字成标签：品种代码清单、策略标签、日志检索的关键词。Enter 或逗号收下，重复的（不分大小写）不收、已有的那个跳一下；光标在框头时退格先选中最后一个、再按才删；粘贴「600519, 000001」这类一串一次拆开。normalize 先整理（如转大写），validate 不过的不收、框下写原因，max 封顶。与 AnimatedTags 的分工：那个是在给定的一组里挑，这个是自由输入。改自 Arc tag-input（MIT）。

## Provide

`*` marks a required prop.

### TagInput

value 受控或 defaultValue 非受控；label 是输入框的读屏名（要可见标签就配 Field 与 id）。labels.remove、labels.duplicate 必填，其余播报可选；播报走一个 aria-live=polite 的屏外区。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `label` * | `string` | — | Accessible name of the field. |
| `value` | `readonly string[]` | — | Tags (controlled). |
| `defaultValue` | `readonly string[]` | `[]` | Starting tags (uncontrolled). |
| `onValueChange` | `(value: string[]) => void` | — | Called with the new list after a tag is added or removed. |
| `placeholder` | `string` | — | Hint shown while there are no tags and no draft. |
| `normalize` | `TagCommitOptions['normalize']` | — | Tidy a raw tag before it is checked, for example uppercasing a symbol. |
| `validate` | `TagCommitOptions['validate']` | — | Return a message to turn a tag down; the draft stays and the message shows under the field. |
| `max` | `number` | — | Largest number of tags. |
| `size` | `'sm' \| 'md'` | `'md'` | Height of the field: md is 30px (default), sm is 26px. |
| `disabled` | `boolean` | — | Grey out the field and its tags. |
| `id` | `string` | — | Id of the text box, for a visible label's htmlFor. |
| `labels` * | `TagInputLabels` | — | Texts: remove and duplicate are required; the other announcements are optional. |
| `className` | `string` | — | Extra class name on the root. |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { useState } from 'react'
import { TagInput } from '@katana-ui/react'

export function TagInputUsage() {
  const [symbols, setSymbols] = useState(['AAPL', 'MSFT'])
  return (
    <TagInput
      label="Symbols"
      value={symbols}
      onValueChange={setSymbols}
      normalize={(tag) => tag.toUpperCase()}
      placeholder="Type a symbol, Enter to add"
      labels={{ remove: (tag) => `Remove ${tag}`, duplicate: (tag) => `${tag} is already in the list` }}
    />
  )
}
```

## States

- 空：显示占位。
- 有标签：标签在框里换行排，输入框跟在最后。
- 选中：退格或方向键选中的标签画一圈焦点色的环，再按退格删掉。
- 被拒：validate 或 max 拦下时框变红边、框下写原因，被拒的字留在框里好改。
- 禁用：整框半透明，标签的 × 也不能点。

## Don't

- 选项是固定一组时不要用它：用 MultiSelect、ChipGroup 或 AnimatedTags。
- 标签不是自由文字（要从品种库里选）时，用 Combobox 的多选，或者给 validate 查库。

## Composition

```
TagInput
  div.k-tagin-box
    span.k-tagin-tag × n
      span（字）
      button（×，不进 Tab 序列）
    input
  p.k-tagin-error（被拒时）
  span.sr-only（aria-live 播报）
```

## Keyboard

- `Enter / ,`：收下草稿（逗号不进框；Enter 草稿空时交给表单）
- `Backspace`：光标在框头：先选中最后一个标签，再按删除
- `← →`：在标签间移选中；过了最后一个回到输入框
- `Delete`：删除选中的标签
- `Esc`：取消选中
