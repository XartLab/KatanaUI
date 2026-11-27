// SPDX-License-Identifier: MIT
// KatanaConsensusBlock：下单前的多方共识（网关、风控、账户……各给一个状态与一句话）加结论。件只画智能体给的状态与结论，
// 不合成判断；真正放不放行由宿主的执行网关决定。哈希可点（复制），只发 Action。
import { createComponentImplementation } from '@a2ui/react'
import type { ComponentApi } from '@a2ui/web_core'
import { CommonSchemas } from '@a2ui/web_core/v1_0'
import { z } from 'zod'
import { ConsensusBlock } from '../../blocks/index.ts'
import { text, withExtension } from '../blocks-support.ts'
import { Cell, actionSchema, weightSchema } from '../support.tsx'

const STATES = ['pass', 'warn', 'blocked', 'unknown', 'timeout', 'stale', 'pending'] as const

export const KatanaConsensusBlockApi = {
  name: 'KatanaConsensusBlock',
  schema: z
    .object({
      label: CommonSchemas.DynamicString.describe('Accessible name of the whole block.'),
      subject: CommonSchemas.DynamicString.describe(
        'What is being checked, for example "Order · Account A · Buy 300750 x 2,000".',
      ).optional(),
      parties: z
        .array(
          z
            .object({
              id: z.string().min(1).describe('Stable id of the party.'),
              label: text('Short name of the party, for example "Gateway".'),
              state: z.enum(STATES).describe('The state this party reports.'),
              message: text('One short sentence from the party, ten words at most.'),
              detail: text(
                'Longer detail shown when the user opens the party, such as a limit or a rule id.',
              ).optional(),
            })
            .strict(),
        )
        .min(1)
        .max(8)
        .describe('The parties and what each one reports.'),
      verdict: z
        .enum(['ok', 'warn', 'blocked'])
        .describe('The overall conclusion. The block never works it out itself.'),
      verdictText: CommonSchemas.DynamicString.describe('The conclusion in words, for example "Ready to submit".'),
      summary: CommonSchemas.DynamicString.describe(
        'The count line beside the conclusion, for example "2 passed · 1 near limit".',
      ).optional(),
      hash: CommonSchemas.DynamicString.describe('Parameter hash of the check. Omit while it is not ready.').optional(),
      stateLabels: z
        .object({
          pass: text('State word: pass.'),
          warn: text('State word: near the limit.'),
          blocked: text('State word: blocked.'),
          unknown: text('State word: no answer yet.'),
          timeout: text('State word: timed out.'),
          stale: text('State word: stale, check again.'),
          pending: text('State word: being evaluated.'),
        })
        .strict()
        .describe('The word shown for each state, in the language of the user.'),
      onHashClick: actionSchema(
        'Dispatched when the user presses the hash. metadata.extensions.katanaConsensus carries {hash}.',
      ).optional(),
      weight: weightSchema,
    })
    .strict(),
} satisfies ComponentApi

export const KatanaConsensusBlock = createComponentImplementation(KatanaConsensusBlockApi, ({ props }) => (
  <Cell weight={props.weight}>
    <ConsensusBlock
      label={props.label ?? ''}
      subject={props.subject}
      parties={(props.parties ?? []).map((party) => ({
        id: party.id,
        label: party.label,
        state: party.state,
        message: party.message,
        ...(party.detail === undefined ? {} : { detail: party.detail }),
      }))}
      verdict={props.verdict}
      verdictText={props.verdictText ?? ''}
      summary={props.summary}
      hash={props.hash ?? null}
      onHashClick={
        props.onHashClick && props.hash
          ? () => void props.onHashClick?.(withExtension('katanaConsensus', { hash: props.hash }))
          : undefined
      }
      stateLabels={props.stateLabels}
    />
  </Cell>
))
