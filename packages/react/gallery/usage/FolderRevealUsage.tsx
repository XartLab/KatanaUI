// SPDX-License-Identifier: MIT
import { FolderReveal } from '../../src/index'

export function FolderRevealUsage() {
  return (
    <FolderReveal
      label="Reports"
      tone="accent"
      items={[
        { id: 'a', content: <div style={{ padding: 8 }}>Q1</div> },
        { id: 'b', content: <div style={{ padding: 8 }}>Q2</div> },
        { id: 'c', content: <div style={{ padding: 8 }}>Q3</div> },
      ]}
    />
  )
}
