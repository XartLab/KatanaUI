# UseUndoStack

通用的撤销 / 重做栈：存整份快照，值由调用方定。push 带 kind，同种操作在 800ms 内合并成一步（拖一次滑块只撤一次）；最多 100 步；可选绑定 Mod+Z 撤销、Mod+Shift+Z 与 Ctrl+Y 重做。用于列布局、行序、分组这类「拖错了」的恢复，不进存档。

## Provide

`*` marks a required prop.

### useUndoStack(initial, { limit?, mergeMs?, hotkeys? })

返回 { value, push, undo, redo, reset, canUndo, canRedo, undoCount, redoCount, undoKind, redoKind }，函数引用稳定。hotkeys：true 绑在 document，给 ref 只在那块有焦点时接；焦点在输入框、文本域、contenteditable 里不接（让浏览器的文字撤销生效）。

### undoPush / undoBack / undoForward / undoInit

钩子用的纯函数（状态是 { past, present, future }），单测与不用 React 的地方直接用。撤销或重做回来的那步封住，不再跟下一次 push 合并。

### undoKeyOf(event, isMac)

一次按键是 undo、redo 还是 null：Mac 上 ⌘Z / ⇧⌘Z，别处 Ctrl+Z / Ctrl+Shift+Z / Ctrl+Y；带 Alt 的不算。

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { Redo2Icon, Undo2Icon } from 'lucide-react'
import { useRef } from 'react'
import { Button, Slider, useUndoStack } from '@katana-ui/react'

type Layout = { order: readonly string[]; width: number }

const INITIAL: Layout = { order: ['代码', '最新价', '涨跌幅', '成交量'], width: 96 }

// 列布局的撤销：拖宽度是同一种操作（kind 写「列宽」，也拿来写按钮提示），800ms 内连拖只算一步；换列序是另一种。
// Mod+Z / Mod+Shift+Z 只在这一块有焦点时接（hotkeys 给 ref）。
export function UseUndoStackUsage() {
  const scope = useRef<HTMLDivElement>(null)
  const history = useUndoStack(INITIAL, { hotkeys: scope })
  const { order, width } = history.value
  const rotate = () => history.push({ order: [...order.slice(1), order[0]!], width }, { kind: '列序' })

  return (
    <div ref={scope} tabIndex={-1} data-gallery-undo style={{ display: 'grid', gap: 12, width: 420, outline: 'none' }}>
      <div style={{ display: 'flex', gap: 4 }}>
        <Button
          size="sm"
          disabled={!history.canUndo}
          onClick={history.undo}
          title={history.undoKind ? `撤销 ${history.undoKind}` : '撤销'}
        >
          <Undo2Icon aria-hidden="true" />
          撤销（{history.undoCount}）
        </Button>
        <Button size="sm" disabled={!history.canRedo} onClick={history.redo}>
          <Redo2Icon aria-hidden="true" />
          重做（{history.redoCount}）
        </Button>
        <Button size="sm" variant="ghost" onClick={rotate}>
          换列序
        </Button>
      </div>
      <Slider
        thumbLabels={['列宽']}
        value={[width]}
        min={48}
        max={160}
        onValueChange={([next]) => history.push({ order, width: next! }, { kind: '列宽' })}
      />
      <div style={{ display: 'flex', gap: 4 }} data-slot="undo-columns">
        {order.map((name) => (
          <span
            key={name}
            style={{
              width,
              padding: '4px 6px',
              border: '1px solid var(--k-separable-primary-borderColor)',
              borderRadius: 4,
              color: 'var(--k-content-secondary-foreground)',
              overflow: 'hidden',
              whiteSpace: 'nowrap',
            }}
          >
            {name}
          </span>
        ))}
      </div>
    </div>
  )
}
```

## States

- 没有可撤：canUndo=false，撤销钮 disabled。
- 撤过之后：canRedo=true；再 push 一步就清掉重做。
- 合并中：同 kind 连续 push，undoCount 不涨。

## Don't

- 不要把它存进 localStorage：历史只活在这一次打开里（存档用 usePersistedState 存当前值）。
- 不要每次按键都 push 不带 kind：连续输入要给 kind 合并，否则撤一次只退一个字。
- 不要在两个地方同时绑 Mod+Z：用了 useHotkeys 注册表就关掉这里的 hotkeys。

## Composition

```
useUndoStack
  { past[], present, future[] }
  键盘：Mod+Z · Mod+Shift+Z · Ctrl+Y（可选）
```

## Keyboard

- `Mod+Z`：撤销（Mac 是 ⌘Z）
- `Mod+Shift+Z`：重做
- `Ctrl+Y`：重做（非 Mac）
