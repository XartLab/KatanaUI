// SPDX-License-Identifier: MIT
import { useState } from 'react'
import { DocReader } from '../../src/blocks'
import { DEMO_DOC_BLOCKS } from '../fundamentals-data'

export function DocReaderUsage() {
  const [cited, setCited] = useState<string | null>(null)
  return (
    <div className="gal-wide" data-gallery-doc="main" style={{ maxWidth: 900 }}>
      <DocReader
        title="示例公司 2026 年半年度报告（摘录）"
        meta="2026-08-28 · 半年度报告 · 演示"
        blocks={DEMO_DOC_BLOCKS}
        height={420}
        onCite={(block) => setCited(block.id)}
        labels={{
          reader: '示例：公告阅读',
          outline: '目录',
          search: '在文中查找',
          matches: (current, total) => `${current} / ${total}`,
          noMatch: '没有找到',
          previous: '上一个',
          next: '下一个',
          cite: '引用这一段',
          empty: '没有正文',
        }}
        source="来源 / 演示数据（虚构公司）"
      />
      <p className="gal-note" data-slot="doc-demo-cited">
        {cited ? `已引用：kref:doc/demo#${cited}` : '悬停一段，点右侧的引用钮'}
      </p>
    </div>
  )
}
