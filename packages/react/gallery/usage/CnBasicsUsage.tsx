// SPDX-License-Identifier: MIT
import { cnAxisPosition, cnPhaseOf, formatCnAmount, parseClock } from '../../src/cn'

export function CnBasicsUsage() {
  const minute = parseClock('13:00')
  return (
    <p>
      {formatCnAmount(123_456_789)} {cnPhaseOf(minute)} {cnAxisPosition(minute)}
    </p>
  )
}
