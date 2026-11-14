// SPDX-License-Identifier: MIT
import { CodeBlock } from '../../src/index'

export function CodeBlockUsage() {
  return (
    <CodeBlock
      code={`export const answer = 42`}
      language="ts"
      filename="answer.ts"
      copyLabel="Copy code"
      copiedLabel="Copied"
    />
  )
}
