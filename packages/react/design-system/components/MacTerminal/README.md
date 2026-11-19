# MacTerminal

一段「命令逐字敲入、输出逐行出现」的脚本回放，用来演示回测日志、部署输出、AI 的推理过程。是回放，不是真终端：没有输入。离开屏幕或标签页隐藏时暂停。

## Provide

`*` marks a required prop.

### MacTerminal

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `lines` * | `readonly TerminalLine[]` | — | The script to replay. |
| `title` * | `string` | — | Window title in the bar. |
| `labels` * | `MacTerminalLabels` | — | Spoken names and hint text (required). |
| `autoPlay` | `boolean` | `true` | Start playing as soon as it is on screen; off waits for a click or Enter. |
| `loop` | `boolean` | `false` | Play again after the last line. |
| `prompt` | `string` | `'$'` | Prompt text in front of a command. |
| `typingSpeed` | `number` | `40` | Characters typed per second. |
| `maxHeight` | `number \| string` | `320` | Tallest the output area gets before it scrolls. |
| `showTrafficLights` | `boolean` | `true` | Draw the three coloured lights in the title bar. |
| `onClose` | `() => void` | — | Makes the red light a button that calls this. |
| `onMinimize` | `() => void` | — | Makes the amber light a button that calls this. |
| `onComplete` | `() => void` | — | Called after the last line has played. |
| `className` | `string` | — | Extra classes for the root element. |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { MacTerminal } from '@katana-ui/react'

export function MacTerminalUsage() {
  return (
    <MacTerminal
      title="backtest"
      labels={{ window: 'Backtest log replay' }}
      lines={[
        { id: '1', type: 'command', text: 'katana backtest momentum --from 2024-01-01' },
        { id: '2', type: 'output', text: 'loaded 1,248 bars' },
        { id: '3', type: 'success', text: 'sharpe 1.42  maxdd -8.3%' },
      ]}
    />
  )
}
```

## States

- 播放：命令打字、输出按 delay 出现，光标闪烁，自动滚到底。
- autoPlay 关：等点一下或按 Enter 开始。
- loop：播完停 1.5 秒后重来。
- 成功、错误、注释行各用自己的 token 色。

## Don't

- 不要拿它当日志查看器：真的日志用 CodeBlock 或表格，它只回放脚本。
- 不要把重要信息只放在逐字出现的行里：完整文本另有一份给读屏。

## Composition

```
MacTerminal
  div role=group
    顶栏（交通灯 · 标题）
    pre aria-hidden（回放内容）
    div sr-only（完整文本）
```
