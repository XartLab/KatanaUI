// SPDX-License-Identifier: MIT
import { NewsReader } from '../../src/blocks'

export function NewsReaderUsage() {
  return (
    <div style={{ width: '100%', maxWidth: 560 }}>
      <NewsReader
        title="演示：虚构公司公布季度业绩，营收好于预期"
        source="演示通讯社"
        meta="7 分钟前 · 演示通讯社 · 2 分钟阅读"
        symbols={[
          { code: 'ALFA', name: '示例阿尔法科技', change: 1.82 },
          { code: 'BETA', name: '示例贝塔零售', change: -0.59 },
        ]}
        keyPoints={['营收同比增长 12%，高于市场预期的 9%', '管理层上调全年指引']}
        labels={{ reader: '新闻阅读', keyPoints: '要点', close: '关闭', report: '举报', copyLink: '复制链接' }}
        onClose={() => undefined}
        onReport={() => undefined}
        onCopyLink={() => undefined}
      >
        <p>以上内容是演示文字，公司、数字与来源都是虚构的。</p>
      </NewsReader>
    </div>
  )
}
