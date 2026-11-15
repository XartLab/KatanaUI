// SPDX-License-Identifier: MIT
import { Led } from '../../src/index'

export function LedUsage() {
  return (
    <>
      <Led state="ok" label="Connected" />
      <Led state="danger" label="Disconnected" />
    </>
  )
}
