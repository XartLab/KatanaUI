# TemplateLibrary

左边可搜索、分组（我的 / 内置）的模板树，右边详情：标题与正文就地编辑（点即编辑，Esc 取消，⌘↵ 保存）、元信息、复制、「使用模板」。量化里放策略模板、提示词模板、回测配置模板。树是 react-aria 的 Tree：↑↓ 走、→ 展开、← 收起、Enter 选中；搜索按标题过滤，命中的字高亮，命中的分支自动展开。内置分组只读，只能复制或使用。交互借自 Jamie Merrill 的「保存模板」「Inline editing」。

## Provide

`*` marks a required prop.

### TemplateLibrary

数据（groups）、选中项都是调用方的；保存、使用、复制都只回调 id。onSave 返回的 Promise reject 时正文退回旧值并提示，标题照 InlineEdit 回滚。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `groups` * | `readonly TemplateGroup[]` | — | Groups of templates, for example mine and built-in. |
| `value` | `string \| null` | — | The selected template id (controlled); null for none. |
| `defaultValue` | `string \| null` | `null` | The selected template id at first (uncontrolled). |
| `onValueChange` | `(id: string) => void` | — | Called with the id of the template that was picked in the tree. |
| `onSave` | `(id: string, patch: { title: string } \| { body: string }) => void \| Promise<unknown>` | — | Persist an edit: the field and the new text (title is trimmed). |
| `onUse` * | `(id: string) => void` | — | Called with the id when "Use template" is pressed. |
| `onCopy` | `(id: string) => void` | — | Called with the id after the text was copied to the clipboard. |
| `onCopyError` | `(id: string, error: unknown) => void` | — | Called with the id and the error when the clipboard refused; the button also says labels.copyFailed. |
| `onSaveError` | `(id: string, patch: { title: string } \| { body: string }, error: unknown) => void` | — | Called when onSave threw or its promise rejected (the field has already rolled back to the last saved text). |
| `onDuplicate` | `(id: string) => void` | — | Called with the id to make an editable copy (give it to show the duplicate button). |
| `labels` * | `TemplateLibraryLabels` | — | Texts. |
| `className` | `string` | — | Extra class names on the root. |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { useState } from 'react'
import { TemplateLibrary, type TemplateGroup, type TemplateLibraryLabels } from '@katana-ui/react'

const LABELS: TemplateLibraryLabels = {
  library: 'Template library',
  search: 'Search templates',
  tree: 'Templates',
  results: (count) => `${count} templates match`,
  noMatch: 'No template matches',
  empty: 'Pick a template on the left',
  titleField: 'Template name',
  titleEmpty: 'The name cannot be empty',
  bodyField: 'Template body',
  editHint: 'Press Enter or click to edit',
  title: {
    editHint: 'Press Enter or click to rename',
    save: 'Save name',
    cancel: 'Discard name change',
    failed: (attempted) => `Could not save "${attempted}"`,
    retry: 'Retry',
  },
  save: 'Save body (⌘↵)',
  cancel: 'Discard (Esc)',
  bodyFailed: 'Could not save; the body is back to the last saved text',
  meta: 'Template details',
  copy: 'Copy',
  copied: 'Copied',
  copyFailed: 'Copy failed',
  duplicate: 'Duplicate to mine',
  use: 'Use template',
  readOnly: 'Built-in template, read only',
}

const GROUPS: readonly TemplateGroup[] = [
  {
    id: 'mine',
    title: 'My templates',
    templates: [
      {
        id: 'momentum',
        title: 'Momentum strategy',
        body: 'Universe: CSI 300.\nSignal: 12-1 month return, ranked by cross-section.\nRebalance: first trading day of the month.',
        meta: [{ label: 'Created by', value: 'Me · 2026-11-20 09:10' }],
      },
    ],
  },
  {
    id: 'builtin',
    title: 'Built-in',
    readOnly: true,
    templates: [{ id: 'reversion', title: 'Mean reversion', body: 'Buy z-score below -2, exit at 0.' }],
  },
]

export function TemplateLibraryUsage() {
  const [groups, setGroups] = useState(GROUPS)
  return (
    <TemplateLibrary
      groups={groups}
      defaultValue="momentum"
      labels={LABELS}
      onSave={(id, patch) =>
        setGroups((current) =>
          current.map((group) => ({
            ...group,
            templates: group.templates.map((template) => (template.id === id ? { ...template, ...patch } : template)),
          })),
        )
      }
      onUse={(id) => console.log('use', id)}
    />
  )
}
```

## States

- 搜索：按标题不分大小写过滤；变体命中时留下它的父模板；没有命中的分组整组去掉；全无命中写 labels.noMatch。命中的字加粗加下划线，屏外区播报命中个数。
- 选中：行上一条左 2px 前景线，不改字重。分组行是小字标题，不可选。
- 就地编辑：标题照 InlineEdit（Enter 保存、Esc 放弃）；正文点一下变输入框，⌘/Ctrl+Enter 保存、Esc 放弃、点到外面也保存。
- 输入法组字（isComposing 或 keyCode 229）时，Enter、Esc、⌘↵ 都不触发保存或放弃，搜索框的 Esc 也一样。
- 内置分组（readOnly）：标题与正文只显示，不可编辑；复制与使用照常。
- 复制：把「标题 + 正文」写进剪贴板，按钮字变「已复制」1.5 秒；剪贴板拒绝（没权限、不是安全上下文）时按钮字变 labels.copyFailed（同一个 aria-live 播报）并回调可选的 onCopyError(id, error)，不降级到 execCommand；给了 onDuplicate 才有「复制为我的模板」。
- 保存失败由调用方提示：onSave 抛错或 Promise reject 时，开着的编辑器退回旧值并在正文下写 labels.bodyFailed；编辑中切走模板时没存的正文会在卸载那一刻补存一次；这时编辑器已卸载、失败看不到，所以件另外回调可选的 onSaveError(id, patch, error)，调用方在这里 toast。受控的外部状态改变（程序化换模板、换 groups）时，没存的草稿会丢。
- 搜索中树可以收起、再展开（每次改搜索词重新全部展开）；清空搜索时把选中项的分组与父模板并进展开集合，选中项不会被藏起来。
- 没选中：右边写 labels.empty。

## Don't

- 不要在件里存模板：groups 与保存都在调用方，件只回调 id 与改动的那一个字段。
- 不要把 id 写重：分组与模板、变体的 id 全树唯一，树靠它定位。
- 不要用它做长文档编辑：正文是纯文本，没有格式。

## Composition

```
TemplateLibrary
  div（左）
    Input（搜索）
    Tree > TreeItem（分组）> TreeItem（模板）> TreeItem（变体）
  div（右）
    InlineEdit（标题）
    dl（元信息）
    正文（button / textarea）
    Button × 2–3（复制、复制为我的、使用模板）
```

## Keyboard

- `↑ ↓`：树里上下走
- `→ / ←`：展开 / 收起，或进子级 / 回父级
- `Enter / Space`：选中这个模板
- `Esc`：搜索框里清空；编辑中放弃修改
- `⌘/Ctrl + Enter`：正文编辑中：保存
