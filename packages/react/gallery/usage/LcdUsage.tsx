// SPDX-License-Identifier: MIT
import { Lcd } from '../../src/index'

export function LcdUsage() {
  return (
    <>
      <Lcd label="PNL" value="+1,284.50" tone="up" note="USDT today" />
      <Lcd label="LAST" value={null} />
    </>
  )
}
