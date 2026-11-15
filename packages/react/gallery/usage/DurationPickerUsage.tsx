// SPDX-License-Identifier: MIT
import { DurationPicker } from '../../src/index'

export function DurationPickerUsage() {
  return (
    <DurationPicker
      defaultValue={{ hours: 2, minutes: 30 }}
      labels={{
        hours: 'h',
        minutes: 'm',
        edit: 'Edit duration',
        save: 'Confirm duration',
        hoursInput: 'Hours',
        minutesInput: 'Minutes',
      }}
    />
  )
}
