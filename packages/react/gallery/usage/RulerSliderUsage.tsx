// SPDX-License-Identifier: MIT
import { useState } from 'react'
import { RulerSlider } from '../../src/index'

export function RulerSliderUsage() {
  const [value, setValue] = useState(25)
  return (
    <RulerSlider
      label="Position size"
      min={0}
      max={100}
      majorEvery={25}
      value={value}
      onValueChange={setValue}
      format={(v) => `${v}%`}
    />
  )
}
