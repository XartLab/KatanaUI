// SPDX-License-Identifier: MIT
import { ScrambleText } from '../../src/index'

export function ScrambleTextUsage() {
  return (
    <>
      <ScrambleText>Open order ticket</ScrambleText>
      <ScrambleText settle="left-to-right" trigger="change">
        106,977.40
      </ScrambleText>
    </>
  )
}
