# Hotkeys

组件里声明快捷键：useHotkeys 挂上登记、卸下注销，注册表一个 window 监听分发。作用域、冲突检测、平台 Mod 映射（Mac ⌘、别处 Ctrl）、输入框与输入法组字里不误触发。ShortcutSheet 列出来，CommandPalette 用它开。没有 HotkeysProvider 时用默认注册表。

## Provide

`*` marks a required prop.

### useHotkeys(bindings)

每条 HotkeyBinding：id、combo（可写 Mod，数组是几种按法）、label、scope（省略 global）、handler、enabled、allowInInput、preventDefault（默认 true）。handler 总读最新的，不用 useCallback。

### createHotkeyRegistry({ platform?, target? }) / HotkeysProvider

注册表：register、entries、conflicts、setActiveScopes（null 全开，global 总在）、dispatch（测试与宿主自己的监听用）、subscribe。有登记才挂 keydown 监听。

### useHotkeyEntries(registry?)

读现在的登记与冲突（变了会重画），ShortcutSheet 用它。

### normalizeCombo / comboOfEvent / comboKeys / partLabelFor / detectPlatform / isEditableTarget / findConflicts

纯函数：声明串规范化（Mod、cmd、option、esc 这类别名）、按键的规范串（组字中返回 null）、按平台写成键帽字、可打字的目标、冲突（同作用域或碰上 global）。

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { useState } from 'react'
import { useHotkeys } from '@katana-ui/react'

export function HotkeysUsage() {
  const [count, setCount] = useState(0)
  useHotkeys([
    { id: 'chart-reset', combo: 'Alt+R', label: 'Reset chart', scope: 'chart', handler: () => setCount((n) => n + 1) },
    { id: 'chart-clear', combo: 'Mod+Alt+R', label: 'Clear count', scope: 'chart', handler: () => setCount(0) },
  ])
  return <p>Alt+R pressed {count} times (Mod+Alt+R clears)</p>
}
```

## States

- 作用域关掉：它的快捷键不触发，总览里灰着。
- 冲突：同组合两条以上都开着，总览两行都标出。

## Don't

- 不要在 global 里登记单个无修饰键：会跟读屏和表单的键撞。
- 不要只给快捷键不给可点的入口。
- 不要在包里写死键位：默认键位与改过的键位都是调用方的。

## Composition

```
HotkeysProvider（可省）
  组件 × n（useHotkeys 登记）
注册表（window keydown → 匹配 → handler）
```

## Keyboard

- `Mod+/`：（演示）打开快捷键总览
- `Mod+Shift+P`：（演示）打开命令面板；文档站目录的搜索占着 Mod+K（连带 Mod+Shift+K）
- `Alt+R`：（演示）图表作用域：重置图表；在输入框里不触发
