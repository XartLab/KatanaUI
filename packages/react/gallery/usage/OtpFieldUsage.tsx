// SPDX-License-Identifier: MIT
import { OtpField } from '../../src/index'

export function OtpFieldUsage() {
  return (
    <OtpField aria-label="Trade verification code" length={6} groupSize={3} onComplete={(code) => console.log(code)} />
  )
}
