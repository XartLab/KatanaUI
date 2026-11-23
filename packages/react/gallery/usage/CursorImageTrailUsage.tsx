// SPDX-License-Identifier: MIT
import { CursorImageTrail } from '../../src/index'

const IMAGES = [
  { alt: 'Sample chart', src: 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==' },
]

export function CursorImageTrailUsage() {
  return (
    <CursorImageTrail images={IMAGES} imageSize={48}>
      <div style={{ height: 160, display: 'grid', placeItems: 'center' }}>Move the pointer here</div>
    </CursorImageTrail>
  )
}
