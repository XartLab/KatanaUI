// SPDX-License-Identifier: MIT
import { AsciiRender } from '../../src/index'

export function AsciiRenderUsage() {
  return (
    <AsciiRender
      alt="Sample chart as characters"
      columns={48}
      fontSize={8}
      source={{ src: 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==', type: 'image' }}
    />
  )
}
