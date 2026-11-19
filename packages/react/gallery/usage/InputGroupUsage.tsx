// SPDX-License-Identifier: MIT
import { Input, InputGroup, InputGroupAddon, InputGroupText } from '../../src/index'

export function InputGroupUsage() {
  return (
    <InputGroup>
      <InputGroupAddon>
        <InputGroupText>¥</InputGroupText>
      </InputGroupAddon>
      <Input aria-label="Limit price" placeholder="0.00" />
      <InputGroupAddon align="end">
        <InputGroupText>CNY</InputGroupText>
      </InputGroupAddon>
    </InputGroup>
  )
}
