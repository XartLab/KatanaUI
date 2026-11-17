// SPDX-License-Identifier: MIT
import { Led } from '../../src/index'

export function LedUsage() {
  return (
    <>
      <Led tone="ok" label="Connected" />
      <Led tone="danger" label="Disconnected" />
    </>
  )
}
