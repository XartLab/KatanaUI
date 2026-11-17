// SPDX-License-Identifier: MIT
import { SvgClipMask } from '../../src/index'

export function SvgClipMaskUsage() {
  return (
    <SvgClipMask shape="blob">
      <div style={{ width: 128, height: 128, background: 'var(--accent)' }} />
    </SvgClipMask>
  )
}
