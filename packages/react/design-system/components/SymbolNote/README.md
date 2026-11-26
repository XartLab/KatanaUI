# SymbolNote

挂在品种行或报价头上的便签：有备注时显示一个 18px 的便签图标，悬停 200ms 或 Tab 到图标先看全文，点一下钉住，钉住后点「编辑」改；没有备注而能编辑时是加号图标，点开直接进编辑。编辑是受控的：件只管草稿，点「保存」或 Ctrl / ⌘ + Enter 时把去掉首尾空白的文字交给 onValueChange，存哪由调用方定，存空字符串就是删掉。浮层是平台原生 popover（顶层，不被表格的滚动与 overflow 裁掉），外观是 k-mat-overlay 材质，位置用 CSS 锚点定位。功能参照 TradingView 自选与品种页的备注，只取交互。

## Provide

`*` marks a required prop.

### SymbolNote

value 是备注全文（受控，空白算没有）；给了 onValueChange 才能编辑，不给是只读，只读又没有备注时什么都不画；title 是浮层顶上的一行（常写品种代码）。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `value` * | `string` | — | The note text (controlled); an empty or blank string means there is no note. |
| `onValueChange` | `(value: string) => void` | — | Called with the trimmed text when the user saves; an empty string deletes the note. |
| `labels` * | `SymbolNoteLabels` | — | Accessible names and button texts; the package has no built-in language. |
| `title` | `ReactNode` | — | Heading at the top of the popup, usually the symbol ("AAPL"). |
| `maxLength` | `number` | — | Longest note the edit box accepts, in characters. |
| `className` | `string` | — | Extra class name on the root. |

### SymbolNoteLabels

图标与浮层的读屏名（note）、没有备注时加号的读屏名（add）、编辑 / 保存 / 取消三个按钮的字、编辑框的占位字；包里不带语言。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `note` * | `string` | — | Accessible name of the icon and the popup when there is a note, for example "Note". |
| `add` | `string` | — | Accessible name of the plus icon when there is no note yet; falls back to note. |
| `edit` * | `string` | — | Text of the edit button. |
| `save` * | `string` | — | Text of the save button. |
| `cancel` * | `string` | — | Text of the cancel button. |
| `placeholder` | `string` | — | Placeholder of the edit box. |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { useState } from 'react'
import { SymbolNote } from '@katana-ui/react/quotes'

const LABELS = { note: 'Note', add: 'Add note', edit: 'Edit', save: 'Save', cancel: 'Cancel' }

export function SymbolNoteUsage() {
  // The caller stores the note; the component only hands back what the user saved.
  const [note, setNote] = useState('Earnings on 11-28 after the close.')
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <b>AAPL</b>
      <SymbolNote value={note} onValueChange={setNote} title="AAPL" labels={LABELS} />
    </span>
  )
}
```

## States

- 有备注：便签图标用次要灰，悬停或浮层开着时变主文字色、垫一层浅灰底。
- 没有备注、能编辑：加号图标用最淡的灰；放在带 k-row-host 的行里时，行没悬停、没焦点就藏起来。
- 悬停预览：指针停 200ms 出全文，移开 150ms 收起，指针可以移进浮层看长文；钉住之后移开不收。
- 钉住：点图标或在图标上按 Enter；点件外、Tab 走出件或按 Esc 收起，没保存的草稿丢掉。
- 编辑：多行编辑框（4 行，竖向可拖），右下「取消」「保存」；保存后回到全文，存空就关上浮层。

## Don't

- 不要把备注存进包里：值由调用方存，件只交出保存的文字。
- 不要拿它放提醒或告警：图标不上信号色，不会主动弹出。
- 浮层里的点击与按键不会冒泡到宿主行，不要靠它们触发行上的动作。

## Composition

```
SymbolNote span
  button（便签图标 · aria-haspopup=dialog · aria-expanded）
  div popover=manual role=dialog（k-mat-overlay）
    div（title，可选）
    p（全文）· Button（编辑）
    或 Textarea · Button（取消）· Button（保存）
```

## Keyboard

- `Tab`：聚焦图标时出预览；再 Tab 进浮层（焦点进来即钉住）
- `Enter / 空格`：钉住或收起浮层
- `Ctrl / ⌘ + Enter`：编辑框里保存
- `Esc`：编辑时放弃草稿；不在编辑时收起浮层，焦点回到图标
