// SPDX-License-Identifier: MIT
import { Markdown } from '../../src/index'

export function MarkdownUsage() {
  return (
    <Markdown
      text={'**结论**：板块与资金面共振。\n\n- 批价回落\n- 融资净卖出\n\n用 `katana quote 600519` 看原始数据。'}
    />
  )
}
