// SPDX-License-Identifier: MIT
import { Redo2Icon, Undo2Icon } from 'lucide-react'
import { useRef } from 'react'
import { Button, Slider, useUndoStack } from '../../src/index'

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
