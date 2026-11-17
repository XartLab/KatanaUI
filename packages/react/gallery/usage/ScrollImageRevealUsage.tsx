// SPDX-License-Identifier: MIT
import { ScrollImageReveal } from '../../src/index'

export function ScrollImageRevealUsage() {
  return (
    <div style={{ height: 160, overflowY: 'auto' }}>
      <div style={{ height: 120 }} />
      <ScrollImageReveal
        alt="Sample chart"
        mask="wipe"
        src="data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw=="
      />
      <div style={{ height: 200 }} />
    </div>
  )
}
