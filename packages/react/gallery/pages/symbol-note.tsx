// SPDX-License-Identifier: MIT
// #150：品种备注 SymbolNote 的演示。品种、价格与备注都是演示数据（不是行情），备注存在本页的 state 里：件只交出保存的值，存哪是调用方的事。
import { useState } from 'react'
import { SymbolNote, type SymbolNoteLabels } from '../../src/quotes'
import { Row } from './parts'

const SAMPLE = '示例数据，不是行情'

export const SYMBOL_NOTE_LABELS: SymbolNoteLabels = {
  note: '备注',
  add: '添加备注',
  edit: '编辑',
  save: '保存',
  cancel: '取消',
  placeholder: '写点什么：计划、提醒、为什么关注它',
}

const ROWS = [
  { symbol: 'AAPL', last: '228.52' },
  { symbol: 'NVDA', last: '141.20' },
  { symbol: 'BTCUSDT', last: '97 412.5' },
  { symbol: '600519', last: '1 512.00' },
]

const INITIAL: Record<string, string> = {
  AAPL: '财报 11-28 盘后。\n守 220 不破就拿着，破了减半。',
  BTCUSDT: '等回踩 95k 再看，别追。',
}

export function SymbolNoteDemo() {
  const [notes, setNotes] = useState(INITIAL)
  const [selected, setSelected] = useState('AAPL')
  const [saved, setSaved] = useState<string | null>(null)
  return (
    <>
      <Row name="自选行">
        <div role="list" aria-label="示例自选" style={{ width: 320 }}>
          {ROWS.map((row) => (
            <div
              key={row.symbol}
              role="listitem"
              className="k-row-host"
              data-gallery-note-row={row.symbol}
              data-selected={row.symbol === selected || undefined}
              onClick={() => setSelected(row.symbol)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                height: 28,
                padding: '0 8px',
                borderRadius: 6,
                cursor: 'default',
                background: row.symbol === selected ? 'var(--k-container-tertiary-background)' : undefined,
              }}
            >
              {/* 代码列定宽，备注图标排成一列：浮层开在图标右侧，不盖住下面几行的图标。 */}
              <span style={{ flex: 'none', width: 64, font: 'var(--text-data) var(--font-sans)', fontWeight: 600 }}>
                {row.symbol}
              </span>
              <SymbolNote
                value={notes[row.symbol] ?? ''}
                title={row.symbol}
                labels={SYMBOL_NOTE_LABELS}
                maxLength={500}
                onValueChange={(next) => {
                  setNotes((all) => ({ ...all, [row.symbol]: next }))
                  setSaved(`${row.symbol}：${next || '（已删除）'}`)
                }}
              />
              <span style={{ marginLeft: 'auto', fontVariantNumeric: 'tabular-nums' }}>{row.last}</span>
            </div>
          ))}
        </div>
      </Row>
      <Row name="只读（报价头）">
        <span data-gallery-note-readonly style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <b>TSLA</b>
          <SymbolNote value="交割日前后波动大，仓位减到三成。" title="TSLA" labels={SYMBOL_NOTE_LABELS} />
        </span>
      </Row>
      <p className="gal-note">
        {SAMPLE}。选中的行：<span data-testid="symbol-note-selected">{selected}</span>
        ；最近一次保存：<span data-testid="symbol-note-saved">{saved ?? '—'}</span>。点图标不会选中行。
      </p>
    </>
  )
}
