// SPDX-License-Identifier: MIT
import { DitherImage } from '../../src/index'

export function DitherImageUsage() {
  return (
    <DitherImage
      alt="Sample chart"
      algorithm="atkinson"
      height={120}
      src="data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw=="
      width={200}
    />
  )
}
