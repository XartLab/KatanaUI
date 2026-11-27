// SPDX-License-Identifier: MIT
import { TimeMachineStack } from '../../src/index'

export function TimeMachineStackUsage() {
  return (
    <TimeMachineStack
      label="Strategy history"
      status={(index, total) => `Version ${total - index} of ${total}`}
      items={[
        { id: 'v3', content: <div style={{ padding: 16 }}>v3 · current</div> },
        { id: 'v2', content: <div style={{ padding: 16 }}>v2 · volatility filter</div> },
        { id: 'v1', content: <div style={{ padding: 16 }}>v1 · first cut</div> },
      ]}
    />
  )
}
