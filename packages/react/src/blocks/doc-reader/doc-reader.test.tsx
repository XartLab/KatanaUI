// SPDX-License-Identifier: MIT
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vite-plus/test'
import { DocReader, type DocReaderLabels } from './doc-reader.tsx'
import { docMatches, docOutline, splitHits, type DocBlock } from './doc-reader-model.ts'

const blocks: DocBlock[] = [
  { id: 'h1', kind: 'heading', text: '第一节 重要提示', level: 1 },
  { id: 'p1', kind: 'paragraph', text: '本公司营业收入同比增长 12%。' },
  { id: 'h2', kind: 'heading', text: '资本开支计划', level: 2 },
  { id: 'p2', kind: 'paragraph', text: '计划资本开支 30 亿元，其中营业网点 5 亿元。' },
]
const labels: DocReaderLabels = {
  reader: '公告',
  outline: '目录',
  search: '查找',
  matches: (c, t) => `${c} / ${t}`,
  noMatch: '没有找到',
  previous: '上一个',
  next: '下一个',
  cite: '引用这一段',
  empty: '没有正文',
}

describe('doc-reader-model', () => {
  it('目录只收标题，level 夹到 1..4', () => {
    expect(
      docOutline([...blocks, { id: 'h9', kind: 'heading', text: 'x', level: 9 }]).map((i) => [i.id, i.level]),
    ).toEqual([
      ['h1', 1],
      ['h2', 2],
      ['h9', 4],
    ])
  })
  it('命中按文档次序，不分大小写；空查询没有命中', () => {
    expect(docMatches(blocks, '营业')).toEqual(['p1', 'p2'])
    expect(docMatches([{ id: 'a', kind: 'paragraph', text: 'Capex Plan' }], 'capex')).toEqual(['a'])
    expect(docMatches(blocks, '  ')).toEqual([])
  })
  it('切片保留原文大小写，多处命中都切出来', () => {
    expect(splitHits('Capex and CAPEX', 'capex')).toEqual([
      { text: 'Capex', hit: true },
      { text: ' and ', hit: false },
      { text: 'CAPEX', hit: true },
    ])
    expect(splitHits('abc', '')).toEqual([{ text: 'abc', hit: false }])
  })
})

describe('DocReader', () => {
  it('画目录、正文与引用钮；没给 onCite 不画引用钮；没有块时写空态', () => {
    const html = renderToStaticMarkup(<DocReader title="年报" blocks={blocks} labels={labels} onCite={() => {}} />)
    expect(html).toContain('data-slot="doc-reader-outline"')
    expect(html).toContain('资本开支计划')
    expect(html.match(/data-slot="doc-reader-cite"/g)?.length).toBe(2)
    expect(renderToStaticMarkup(<DocReader title="年报" blocks={blocks} labels={labels} />)).not.toContain(
      'doc-reader-cite',
    )
    expect(renderToStaticMarkup(<DocReader title="年报" blocks={[]} labels={labels} />)).toContain('没有正文')
  })
  it('activeId 的块带标记', () => {
    const html = renderToStaticMarkup(<DocReader title="年报" blocks={blocks} labels={labels} activeId="p2" />)
    expect(html).toContain('data-block="p2" data-kind="paragraph" data-active="true"')
  })
})
