# ShortcutRecorder

热键设置用的录键框：点一下进入录键态，按下组合键就记下来；冲突由调用方传的占用表判断，冲突时不写入并说占着的是谁。功能参照 Arc，实现原创。

## Provide

`*` marks a required prop.

### ShortcutRecorder

值是规范串：修饰键按 Ctrl、Alt、Shift、Meta 的次序再加主键，如 Ctrl+Shift+K；主键取物理键（event.code），Mac 的 Option 变形不影响。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `value` | `string \| null` | — | 当前快捷键（规范串）；null 是没设。 |
| `onValue` | `(next: string \| null) => void` | — | 录到新的或清除。冲突与不合规的不回调。 |
| `label` | `string` | — | 读屏名：哪个动作的快捷键。 |
| `labels` | `ShortcutRecorderLabels` | — | 文字：empty、recording、clear、conflict(action)、needModifier；包里不带语言。 |
| `conflicts` | `Record<string, string>` | — | 已被占用的组合：组合串 → 占着它的动作名。自己当前的值不算冲突。 |
| `partLabel` | `(part: string) => string` | — | 规范串里一块怎么写（Meta → ⌘ 之类）；不给原样写。 |
| `requireModifier` | `boolean` | `false` | 要求至少带一个修饰键（单个字母键会和打字撞）。 |
| `disabled` | `boolean` | — | 灰掉，点不动。 |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { useState } from 'react'
import { ShortcutRecorder, type ShortcutRecorderLabels } from '@katana-ui/react'

const RECORDER_LABELS: ShortcutRecorderLabels = {
  empty: '未设置',
  recording: '按下新的快捷键',
  clear: '清除快捷键',
  conflict: (action) => `已被「${action}」使用`,
  needModifier: '要带 Ctrl、Alt、Shift 或 Meta',
}

// 演示用的占用表：另外两个动作的快捷键。

const TAKEN = { 'Ctrl+Shift+K': '全部撤单', 'Alt+B': '市价买入' }

export function ShortcutRecorderUsage() {
  const [flatten, setFlatten] = useState<string | null>('Ctrl+Shift+F')
  const [bare, setBare] = useState<string | null>(null)
  return (
    <>
      <ShortcutRecorder
        label="全部平仓快捷键"
        value={flatten}
        onValue={setFlatten}
        labels={RECORDER_LABELS}
        conflicts={TAKEN}
      />
      <output data-gallery-recorder>{flatten ?? '未设置'}</output>

      <ShortcutRecorder
        label="切换品种快捷键"
        value={bare}
        onValue={setBare}
        labels={RECORDER_LABELS}
        requireModifier
      />
      <output data-gallery-recorder-mod>{bare ?? '未设置'}</output>

      <ShortcutRecorder label="只读快捷键" value="F5" onValue={() => {}} labels={RECORDER_LABELS} disabled />
    </>
  )
}

// 演示用的筛选项与命中数（不是行情）。
```

## States

- 空闲：显示当前快捷键的方块，没有就写「未设置」；右边有清除钮。
- 录键：边框强调色，框里实时显示按着的修饰键；按下主键即记下并退出。
- 冲突：边框红，框下说「已被 xx 使用」，不写入，留在录键态等下一次按键。

## Don't

- 不要在包里判断冲突：占用表由应用（热键表）给，件只比对。
- 不要用它录文字：它只认一次按键组合。
- 浏览器自己拦的组合（Ctrl+W、Ctrl+T 之类）网页收不到，录不到是预期。

## Composition

```
ShortcutRecorder
  button.k-rec-field
    Kbd（当前值或按着的修饰键）
  button.k-rec-clear
  span[role=status]（冲突与提示）
```

## Keyboard

- `Enter / 空格`：聚焦时进入录键态
- `任意组合键`：录键态下记下；带冲突则提示不写入
- `Esc`：退出录键态，不改值
- `Backspace / Delete`：录键态下清除快捷键
- `Tab`：移走焦点并退出录键态（不会把键盘用户困住）
