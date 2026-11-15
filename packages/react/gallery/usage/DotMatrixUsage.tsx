// SPDX-License-Identifier: MIT
import { DotMatrix } from '../../src/index'

export function DotMatrixUsage() {
  return (
    <svg width={120} height={40} role="img" aria-label="Dot pattern">
      <defs>
        <DotMatrix id="usage-dots" />
      </defs>
      <rect width={120} height={40} fill="url(#usage-dots)" />
    </svg>
  )
}
