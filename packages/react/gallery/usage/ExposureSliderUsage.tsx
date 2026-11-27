// SPDX-License-Identifier: MIT
import { useState } from 'react'
import { ExposureSlider } from '../../src/index'

export function ExposureSliderUsage() {
  const [value, setValue] = useState(0)
  return <ExposureSlider label="Net exposure" min={-20} max={20} value={value} onValueChange={setValue} tone="pnl" />
}
