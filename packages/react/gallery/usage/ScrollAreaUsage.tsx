// SPDX-License-Identifier: MIT
import { ScrollArea } from '../../src/index'

export function ScrollAreaUsage() {
  return (
    <ScrollArea style={{ height: 120, width: 200 }}>
      {Array.from({ length: 30 }, (_, index) => (
        <div key={index}>{`Row ${index + 1}`}</div>
      ))}
    </ScrollArea>
  )
}
