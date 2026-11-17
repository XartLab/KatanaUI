// SPDX-License-Identifier: MIT
// KatanaCodeBlock：只读的代码块，行号、高亮行、复制钮。代码只当文字画（自带的小切分器上色），不执行、不当 HTML；配色用库里的强调色，不收颜色值。
import { createComponentImplementation } from '@a2ui/react'
import type { ComponentApi } from '@a2ui/web_core'
import { CommonSchemas } from '@a2ui/web_core/v1_0'
import { z } from 'zod'
import { CodeBlock } from '../../index.ts'
import { Cell, weightSchema } from '../support.tsx'

export const KatanaCodeBlockApi = {
  name: 'KatanaCodeBlock',
  schema: z
    .object({
      code: CommonSchemas.DynamicString.describe(
        'The source text. It is only displayed, with syntax coloring: it is never executed and never interpreted as HTML.',
      ),
      language: z
        .string()
        .max(32)
        .describe('The language name, for example "python" or "json". Shown in the header when there is no filename.')
        .optional(),
      filename: CommonSchemas.DynamicString.describe('A file name shown in the header.').optional(),
      showLineNumbers: z.boolean().default(true).describe('Whether to show line numbers.').optional(),
      highlightLines: z
        .array(z.number().int().min(1))
        .describe('Line numbers (starting at 1) to highlight.')
        .optional(),
      showCopyButton: z.boolean().default(true).describe('Whether to show the copy button.').optional(),
      copyLabel: CommonSchemas.DynamicString.describe('Accessible name of the copy button.'),
      copiedLabel: CommonSchemas.DynamicString.describe('Accessible name of the copy button right after copying.'),
      weight: weightSchema,
    })
    .strict(),
} satisfies ComponentApi

export const KatanaCodeBlock = createComponentImplementation(KatanaCodeBlockApi, ({ props }) => (
  <Cell weight={props.weight}>
    <CodeBlock
      code={props.code ?? ''}
      language={props.language}
      filename={props.filename}
      showLineNumbers={props.showLineNumbers}
      highlightLines={props.highlightLines}
      showCopyButton={props.showCopyButton}
      copyLabel={props.copyLabel ?? ''}
      copiedLabel={props.copiedLabel ?? ''}
    />
  </Cell>
))
