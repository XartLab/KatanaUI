// SPDX-License-Identifier: MIT
import { SvgClipMask } from '../../src/index'

// 裁切路径按外框算：外框给定宽高（这里由外面一层定成 128 × 128），不然被父级撑宽，形状跟着拉扁。
export function SvgClipMaskUsage() {
  return (
    <div style={{ width: 128, height: 128 }}>
      <SvgClipMask shape="blob">
        <div style={{ width: 128, height: 128, background: 'var(--accent)' }} />
      </SvgClipMask>
    </div>
  )
}
