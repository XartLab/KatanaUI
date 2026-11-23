// SPDX-License-Identifier: MIT
// 联动组（#22 G8）的演示：自选与两张「图」同在 A 组，点品种一起换、十字线一起走；换到别的组或不联动就各走各的。数据是示例，不是行情。
import { LinkGroupUsage } from '../usage/LinkGroupUsage.tsx'
import { Row } from './parts.tsx'

export function LinkGroupDemo() {
  return (
    <Row name="自选 → 图 1、图 2（A 组）；在图的灰条上移动指针，同组的图同时画十字线">
      <LinkGroupUsage />
    </Row>
  )
}
