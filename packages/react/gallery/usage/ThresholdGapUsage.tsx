// SPDX-License-Identifier: MIT
import { ThresholdGap } from '../../src/cn'

export function ThresholdGapUsage() {
  return <ThresholdGap label="Example Tech" value={19.96} threshold={20} warnAt={16} period="3-day deviation" />
}
