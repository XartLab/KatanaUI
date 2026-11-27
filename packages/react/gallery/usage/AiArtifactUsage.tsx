// SPDX-License-Identifier: MIT
import { AiArtifact } from '../../src/index'

export function AiArtifactUsage() {
  return (
    <AiArtifact
      title="策略参数"
      labels={{ preview: '预览', code: '代码', views: '视图' }}
      preview="快线 12 日 · 慢线 30 日"
      code={'{ "fast": 12, "slow": 30 }'}
    />
  )
}
