# FileImport

研究资料的导入面板：顶部「上传 / 粘贴 / 链接」三个来源页签，下面是多文件清单，每行类型图标、名字、大小、上传百分比、完成或失败，失败行有「重试 / 移除」。上传本身由调用方做：件只显示 items 给的状态，选了文件、粘了文字、给了链接、按了重试与移除都只回调。上传区是现有的 AnimatedFileUpload（list={false}）。研报 PDF、因子 CSV、回测结果 parquet 用。交互借自 Jamie Merrill 的「文档上传」，样子是我们的。

## Provide

`*` marks a required prop.

### FileImport

items 是调用方跟踪的清单；onPaste、onLink 给了才出现对应页签，两个都不给就只有上传区。id 在回调里带回来。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `items` * | `readonly ImportItem[]` | — | The list as the caller tracks it: one row per file, link or pasted text. |
| `onFiles` * | `(files: File[]) => void` | — | Called with the files just picked or dropped (after the size check); the caller starts the uploads and adds the rows. |
| `onRetry` * | `(id: string) => void` | — | Called with the row id when the retry button of a failed row is pressed. |
| `onRemove` * | `(id: string) => void` | — | Called with the row id when its remove button is pressed (it also cancels an upload in progress). |
| `onPaste` | `(text: string) => void` | — | Called with the pasted text (trimmed); give it to show the paste tab. |
| `onLink` | `(url: string) => void` | — | Called with a valid http(s) link; give it to show the link tab. |
| `labels` * | `FileImportLabels` | — | Texts. |
| `accept` | `string` | — | Comma-separated types for the picker, for example ".pdf,.csv,.parquet". |
| `maxSize` | `number` | — | Largest allowed file in bytes. |
| `disabled` | `boolean` | `false` | Ignore all input. |
| `className` | `string` | — | Extra class names on the root. |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { useState } from 'react'
import { FileImport, type FileImportLabels, type ImportItem } from '@katana-ui/react'

const LABELS: FileImportLabels = {
  sources: 'Sources',
  source: { upload: 'Upload', paste: 'Paste', link: 'Link' },
  upload: {
    zone: 'Import research material. Drag files here or press to browse',
    idle: 'Drop reports, factor tables or backtest results, or click to browse',
    dragging: 'Drop to import',
    tooLarge: (count, limit) => `${count} file(s) are over ${limit}`,
  },
  list: 'Added material',
  count: (total) => `${total} ${total === 1 ? 'item' : 'items'} added`,
  status: {
    queued: 'Waiting',
    uploading: (percent) => (percent === null ? 'Uploading' : `${percent}% uploading`),
    done: 'Complete',
    failed: 'Failed',
  },
  retry: (name) => `Retry ${name}`,
  remove: (name) => `Remove ${name}`,
  paste: { label: 'Pasted text', placeholder: 'Paste a research summary', submit: 'Add' },
  link: {
    label: 'Material link',
    placeholder: 'https://',
    submit: 'Add',
    invalid: 'Enter a link that starts with http or https',
  },
}

export function FileImportUsage() {
  const [items, setItems] = useState<readonly ImportItem[]>([
    { id: '1', name: 'alpha_report_q3.pdf', size: 2_411_000, status: 'uploading', progress: 62 },
    { id: '2', name: 'factors_2026.csv', size: 18_300_000, status: 'done' },
    { id: '3', name: 'backtest_result.parquet', size: 692_000, status: 'failed', error: 'Network lost' },
  ])
  return (
    <FileImport
      items={items}
      accept=".pdf,.csv,.parquet"
      labels={LABELS}
      // Uploading is yours: start it here, then update the rows' status and progress.
      onFiles={(files) =>
        setItems((list) => [
          ...list,
          ...files.map((file, index) => ({
            id: `${file.name}-${list.length + index}`,
            name: file.name,
            size: file.size,
            status: 'uploading' as const,
            progress: 0,
          })),
        ])
      }
      onPaste={(text) =>
        setItems((list) => [...list, { id: `p${list.length}`, name: text.slice(0, 24), status: 'done' }])
      }
      onLink={(url) => setItems((list) => [...list, { id: `l${list.length}`, name: url, status: 'queued' }])}
      onRetry={(id) =>
        setItems((list) => list.map((item) => (item.id === id ? { ...item, status: 'uploading', progress: 0 } : item)))
      }
      onRemove={(id) => setItems((list) => list.filter((item) => item.id !== id))}
    />
  )
}
```

## States

- 排队：灰字「等待中」。
- 上传中：状态字写百分比，行底贴 3 高的进度条；不给 progress 是不确定态的条。
- 完成：ok 色的字加勾。
- 失败：整行换危险色的边与底，状态字加叹号，原因（error）写在名字下面（role=alert），出现「重试」与「移除」。
- 「移除」每行都有（上传中的也能移除，等于取消）；移除后焦点接给相邻的一行，没有了就回上传区。交接只在移除之后的第一次 items 变化里生效：调用方不同意移除（行还在）就作废。
- 粘贴页签：文字框加「添加」，⌘/Ctrl+Enter 也添加，添加后清空；在框里粘贴文件或截图时转给 onFiles（同上传区的大小限制，超限提示 role=alert），件不去读剪贴板。
- 链接页签：只认 http 与 https，不合法时框标红、框下写 labels.link.invalid；Enter 添加。
- 超限的文件在上传区被拦下并提示，不进回调。
- 禁用：整件不响应，上传区降到 45%。

## Don't

- 不要指望件去上传：它没有网络与定时器，进度、重试次数、失败原因都由调用方更新 items。
- 不要把 accept 当安全校验：它只是选择器的提示，要在服务端再验。
- 输入法组字时的 Enter 不算添加（isComposing 或 keyCode 229），别在外面再包一层去绕。

## Composition

```
FileImport
  Tabs（上传 / 粘贴 / 链接）
    AnimatedFileUpload（list={false}）
    Textarea + Button
    Input + Button
  section
    p（计数）
    ul > li × n（图标、名字、大小、状态、重试 / 移除、Progress）
```

## Keyboard

- `← →`：在来源页签间走
- `Enter / Space`：上传区：打开文件选择
- `⌘/Ctrl + Enter`：粘贴页签：添加
- `Enter`：链接页签：添加（输入法组字时不算）
- `Tab`：行内：重试、移除两个按钮
