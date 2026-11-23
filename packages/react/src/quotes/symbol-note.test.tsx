// SPDX-License-Identifier: MIT
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vite-plus/test'
import { SymbolNote, symbolNoteCommit, symbolNoteKey, type SymbolNoteLabels } from './symbol-note.tsx'

const labels: SymbolNoteLabels = { note: '备注', add: '添加备注', edit: '编辑', save: '保存', cancel: '取消' }
const noop = () => {}

describe('SymbolNote', () => {
  it('没有备注又不能编辑：什么都不画', () => {
    expect(renderToStaticMarkup(<SymbolNote value="" labels={labels} />)).toBe('')
    expect(renderToStaticMarkup(<SymbolNote value={'  \n '} labels={labels} />)).toBe('')
  })

  it('有备注：便签图标按钮，读屏名取 labels.note，aria-expanded 与 aria-controls 指向原生 popover', () => {
    const out = renderToStaticMarkup(<SymbolNote value="  财报 11-28 盘后  " labels={labels} title="AAPL" />)
    const trigger = /<button[^>]*data-slot="symbol-note-trigger"[^>]*>/.exec(out)![0]
    expect(trigger).toContain('aria-label="备注"')
    expect(trigger).toContain('aria-haspopup="dialog"')
    expect(trigger).toContain('aria-expanded="false"')
    const controls = /aria-controls="([^"]+)"/.exec(trigger)![1]
    expect(out).toContain(`id="${controls}" popover="manual"`)
    expect(out).toContain('lucide-sticky-note')
    expect(out).toMatch(/class="k-snote-pop k-mat-overlay"[^>]*role="dialog" aria-label="备注"/)
    expect(out).toContain('<div class="k-snote-title">AAPL</div>')
    // 全文去掉首尾空白，换行照留（CSS pre-wrap）。
    expect(out).toContain('data-slot="symbol-note-text">财报 11-28 盘后</p>')
    expect(out).not.toContain('data-empty')
  })

  it('只读时没有「编辑」；给了 onValueChange 才有', () => {
    expect(renderToStaticMarkup(<SymbolNote value="x" labels={labels} />)).not.toContain('symbol-note-edit')
    expect(renderToStaticMarkup(<SymbolNote value="x" labels={labels} onValueChange={noop} />)).toMatch(
      /data-slot="symbol-note-edit"[^>]*>编辑</,
    )
  })

  it('没有备注但能编辑：加号图标，读屏名取 labels.add（不给退回 note），根上标 data-empty', () => {
    const out = renderToStaticMarkup(<SymbolNote value="" labels={labels} onValueChange={noop} />)
    expect(out).toContain('data-empty=""')
    expect(out).toContain('aria-label="添加备注"')
    expect(out).toContain('lucide-sticky-note-plus')
    const { add: _add, ...rest } = labels
    expect(renderToStaticMarkup(<SymbolNote value="" labels={rest} onValueChange={noop} />)).toContain(
      'aria-label="备注"',
    )
  })

  it('两个备注的浮层 id 与锚点名各不相同', () => {
    const out = renderToStaticMarkup(
      <>
        <SymbolNote value="a" labels={labels} />
        <SymbolNote value="b" labels={labels} />
      </>,
    )
    const ids = [...out.matchAll(/popover="manual"/g)].length
    expect(ids).toBe(2)
    const anchors = [...out.matchAll(/--k-snote-anchor:([^;"]+)/g)].map((m) => m[1])
    expect(new Set(anchors).size).toBe(2)
    for (const name of anchors) expect(name).toMatch(/^--k-snote-[\w-]+$/)
  })

  it('保存交出去掉首尾空白的字（空字符串就是删除）；Esc 放弃，Ctrl / ⌘ + Enter 保存', () => {
    expect(symbolNoteCommit('  等回踩 20 日线\n')).toBe('等回踩 20 日线')
    expect(symbolNoteCommit('   ')).toBe('')
    expect(symbolNoteKey('Escape', false)).toBe('cancel')
    expect(symbolNoteKey('Enter', true)).toBe('save')
    expect(symbolNoteKey('Enter', false)).toBeNull()
    expect(symbolNoteKey('a', true)).toBeNull()
  })
})
