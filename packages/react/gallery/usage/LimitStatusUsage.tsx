// SPDX-License-Identifier: MIT
import { LimitStatus } from '../../src/cn'

export function LimitStatusUsage() {
  return (
    <>
      <LimitStatus status="broken" />
      <LimitStatus status={{ status: 'sealed', sealAmount: 3.2e8 }} />
    </>
  )
}
