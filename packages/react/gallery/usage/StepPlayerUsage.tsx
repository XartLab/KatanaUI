// SPDX-License-Identifier: MIT
import { StepPlayer } from '../../src/index'

export function StepPlayerUsage() {
  return (
    <StepPlayer
      steps={3}
      duration={700}
      labels={{
        play: 'Play',
        pause: 'Pause',
        replay: 'Replay',
        group: (at, count) => `Step ${at + 1} of ${count}`,
        step: (at) => `Go to step ${at + 1}`,
      }}
    />
  )
}
