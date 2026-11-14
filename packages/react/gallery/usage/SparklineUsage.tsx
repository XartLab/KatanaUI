// SPDX-License-Identifier: MIT
import { Sparkline } from '../../src/index'

export function SparklineUsage() {
  return <Sparkline values={[10, 10.4, 10.2, 11, 11.8]} label="Price trend, up" />
}
