// SPDX-License-Identifier: MIT
import { Label, RadioGroup, RadioGroupItem } from '../../src/index'

export function RadioGroupUsage() {
  return (
    <RadioGroup defaultValue="limit" aria-label="Order type">
      {['market', 'limit', 'stop'].map((type) => (
        <div key={type} className="flex items-center gap-2">
          <RadioGroupItem value={type} id={`order-${type}`} />
          <Label htmlFor={`order-${type}`}>{type}</Label>
        </div>
      ))}
    </RadioGroup>
  )
}
