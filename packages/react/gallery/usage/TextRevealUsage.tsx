// SPDX-License-Identifier: MIT
import { TextReveal } from '../../src/index'

export function TextRevealUsage() {
  return (
    <>
      <TextReveal preset="per-word-crossfade">Fed holds rates steady and signals one cut</TextReveal>
      <TextReveal by="char" from="top" order="center">
        Order filled
      </TextReveal>
    </>
  )
}
