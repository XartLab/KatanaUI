// SPDX-License-Identifier: MIT
import { Power } from 'lucide-react'
import { PowerOffSlide } from '../../src/index'

export function PowerOffSlideUsage() {
  return (
    <PowerOffSlide
      label="Slide to close all"
      busyLabel="Closing…"
      icon={<Power aria-hidden="true" />}
      onConfirm={() => undefined}
    />
  )
}
