// SPDX-License-Identifier: MIT
import { Tag } from '../../src/index'

export function TagUsage() {
  return (
    <>
      <Tag>Delayed</Tag>
      <Tag tone="ok">Filled</Tag>
      <Tag tone="warn" outlined>
        Estimated
      </Tag>
      <Tag tone="danger" size="sm">
        ST
      </Tag>
    </>
  )
}
