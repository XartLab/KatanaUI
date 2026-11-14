# CodeBlock

带文件名头、行号、一键复制的代码块；配色由一个强调色混出来（关键字取强调色，字符串、数字、函数是它与正文色的不同比例，注释灰），两个主题自动跟着换。词法切分是自己写的，不加依赖。学自 rare-ui。

## Provide

### CodeBlock

认得 ts / tsx / js / json / py / sh / css；别的语言当纯文本。开头的空行与结尾的空白会去掉。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `code` | `string` | — | 源码（必填）。 |
| `language` | `string` | `'plain'` | 语言。 |
| `accent` | `string` | `'var(--signal-orange)'` | 强调色，任何 CSS 颜色。 |
| `filename` | `string` | — | 头里写的名字；不给写语言。 |
| `showHeader / showLineNumbers / showCopyButton` | `boolean` | `true` | 关掉头时复制钮浮在右上角。 |
| `highlightLines` | `number[]` | — | 要高亮的行（1 起）。 |
| `copyLabel / copiedLabel` | `string` | — | 复制钮的读屏名，与复制成功后的读屏名（必填）。 |

## States

- 带文件名头、行号、复制钮；复制后钮上写 copiedLabel。
- 可高亮指定的行。

## Don't

- 复制钮的文案由调用方传（copyLabel、copiedLabel）。

## Composition

```
CodeBlock
  div（头：名字 + 复制钮）
  div role=region（滚动区，可聚焦）
    pre > 每行一个 div（行号 + token）
```

## Keyboard

- `Tab`：复制钮、再到滚动区
- `方向键`：滚动区聚焦时滚动
- `Enter / Space`：复制
