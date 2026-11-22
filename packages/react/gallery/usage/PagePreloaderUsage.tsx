// SPDX-License-Identifier: MIT
import { PagePreloader } from '../../src/index'

export function PagePreloaderUsage() {
  return (
    <div style={{ position: 'relative', height: 120 }}>
      <p>Workspace ready</p>
      <PagePreloader label="Loading workspace" variant="curtain" duration={900} />
    </div>
  )
}
