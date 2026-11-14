// SPDX-License-Identifier: MIT
import { useState } from 'react'
import { Slider } from '../../src/index'

export function SliderUsage() {
  const [value, setValue] = useState([40])
  return <Slider thumbLabels={['Opacity']} value={value} onValueChange={setValue} min={0} max={100} />
}
