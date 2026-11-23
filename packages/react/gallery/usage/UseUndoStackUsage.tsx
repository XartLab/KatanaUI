// SPDX-License-Identifier: MIT
import { Redo2Icon, Undo2Icon } from 'lucide-react'
import { useState } from 'react'
import { Button, Slider, useUndoHotkeys, useUndoStack } from '../../src/index'

type Layout = { order: readonly string[]; width: number }

const INITIAL: Layout = { order: ['代码', '最新价', '涨跌幅', '成交量'], width: 96 }

// 列布局的撤销：拖宽度是同一种操作（kind 写「列宽」，也拿来写按钮提示），800ms 内连拖只算一步；换列序是另一种。
// Mod+Z / Mod+Shift+Z 登记进快捷键注册表（useUndoHotkeys），只在这一块有焦点时可用；没有注册表的应用改给 useUndoStack 的 hotkeys。
export function UseUndoStackUsage() {
  const [focused, setFocused] = useState(false)
  const history = useUndoStack(INITIAL)
  useUndoHotkeys(history, { labels: { undo: '撤销', redo: '重做' }, scope: 'columns', enabled: focused })
  const { order, width } = history.value
  const rotate = () => history.push({ order: [...order.slice(1), order[0]!], width }, { kind: '列序' })

  return (
    <div
      tabIndex={-1}
      data-gallery-undo
      style={{ display: 'grid', gap: 12, width: 420, outline: 'none' }}
      onFocus={() => setFocused(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false)
      }}
    >
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
