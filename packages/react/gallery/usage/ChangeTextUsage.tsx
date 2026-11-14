// SPDX-License-Identifier: MIT
import { ChangeText } from '../../src/quant'

export function ChangeTextUsage() {
  return (
    <>
      <ChangeText value={1.234} />
      <ChangeText value={-0.5} arrow />
    </>
  )
}
