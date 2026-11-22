// SPDX-License-Identifier: MIT
import { useState } from 'react'
import { TextMorph } from '../../src/index'

export function TextMorphUsage() {
  const [filled, setFilled] = useState(false)
  return (
    <>
      <TextMorph mode="words" text={filled ? 'Filled' : 'Pending approval'} />
      <button type="button" onClick={() => setFilled((value) => !value)}>
        Toggle
      </button>
    </>
  )
}
