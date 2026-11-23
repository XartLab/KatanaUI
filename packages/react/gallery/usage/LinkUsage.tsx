// SPDX-License-Identifier: MIT
import { Link } from '../../src/index'

export function LinkUsage() {
  return (
    <p style={{ margin: 0 }}>
      Reserve ratio cut by 0.5 points (
      <Link href="#/link" external externalLabel="(opens in a new tab)">
        source
      </Link>
      ), see <Link href="#/link">sector flows</Link>.
    </p>
  )
}
