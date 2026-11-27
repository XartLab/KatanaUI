# AnimatedFileUpload

拖文件进来时区块放大、图标上浮，放下后文件行错落滑入，删除时向右滑出、剩下的补位；整块是一个按钮，超限的文件过滤掉并提示。导入回测数据、策略文件用。

## Provide

`*` marks a required prop.

### AnimatedFileUpload

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `onFilesSelected` * | `(files: File[]) => void` | — | Called with the whole list of chosen files after each change. |
| `labels` * | `FileUploadLabels` | — | All visible and spoken text (required). |
| `accept` | `string` | — | Comma-separated types for the picker, e.g. |
| `multiple` | `boolean` | `true` | Allow more than one file. |
| `maxSize` | `number` | — | Largest allowed file in bytes. |
| `disabled` | `boolean` | `false` | Ignore clicks and drops. |
| `className` | `string` | — | Extra classes for the root element. |

### formatBytes

字节数写成 B / KB / MB。

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { AnimatedFileUpload } from '@katana-ui/react'

export function AnimatedFileUploadUsage() {
  return (
    <AnimatedFileUpload
      accept=".csv,.parquet"
      maxSize={5 * 1024 * 1024}
      onFilesSelected={() => {}}
      labels={{
        zone: 'Import backtest data. Drag files here or press to browse',
        idle: 'Drag a file here or click to browse',
        dragging: 'Drop to import',
        list: 'Chosen files',
        remove: (name) => `Remove ${name}`,
        tooLarge: (count, limit) => `${count} file(s) are over ${limit}`,
      }}
    />
  )
}
```

## States

- 待机：虚线框与说明。
- 拖入：框放大、实线强调色、图标上浮、说明换成「松开」。
- 有文件：下面列出文件行，每行可移除。
- 超限：红字提示（role=alert），超限文件不进列表。
- 禁用：45% 不透明度，不响应拖放。

## Don't

- 不要在这里做上传进度：它只收文件，上传由调用方做。
- 不要把 accept 当安全校验：它只是选择器的提示，要在服务端再验。

## Composition

```
AnimatedFileUpload
  input[type=file]（隐藏）
  div role=button（落点）
  p role=alert（错误）
  ul（文件行）
```

## Keyboard

- `Enter / Space`：打开文件选择
