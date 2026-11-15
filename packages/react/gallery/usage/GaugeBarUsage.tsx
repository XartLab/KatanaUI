// SPDX-License-Identifier: MIT
import { GaugeBar } from '../../src/index'

export function GaugeBarUsage() {
  return <GaugeBar label="Ratio" value="72.00%" share={0.72} level="Hot" note="a / (a + b)" />
}
