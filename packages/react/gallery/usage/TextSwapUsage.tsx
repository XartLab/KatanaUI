// SPDX-License-Identifier: MIT
import { useState } from 'react'
import { TextSwap } from '../../src/index'

const HEADLINES = ['Fed holds rates steady', 'NVDA beats on data center demand']

export function TextSwapUsage() {
  const [index, setIndex] = useState(0)
  return (
    <>
      <TextSwap phrases={HEADLINES} />
      <button type="button" onClick={() => setIndex((value) => (value + 1) % HEADLINES.length)}>
        Next
      </button>
      <TextSwap index={index} phrases={HEADLINES} variant="axis-x" />
    </>
  )
}
