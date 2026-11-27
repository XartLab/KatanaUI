// SPDX-License-Identifier: MIT
import { AnimatedStepper } from '../../src/index'

export function AnimatedStepperUsage() {
  return (
    <AnimatedStepper
      allowClickNavigation
      labels={{
        steps: 'Order steps',
        step: (n, label) => `Step ${n}: ${label}`,
        completed: 'completed',
        current: 'current',
      }}
      steps={[
        { label: 'Symbol', content: <p>Pick BTCUSDT.</p> },
        { label: 'Size', content: <p>0.50 at 106,900.</p> },
        { label: 'Confirm', content: <p>Review and submit.</p> },
      ]}
    />
  )
}
