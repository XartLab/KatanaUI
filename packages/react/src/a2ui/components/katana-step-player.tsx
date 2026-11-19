// SPDX-License-Identifier: MIT
// KatanaStepPlayer：分步进度条（播放 / 暂停 / 重放加一排圆点）。步与播放状态由用户操作，件自己记；换步与放完只发 Action。
import { createComponentImplementation } from '@a2ui/react'
import type { ComponentApi } from '@a2ui/web_core'
import { z } from 'zod'
import { StepPlayer } from '../../index.ts'
import { text, withExtension } from '../blocks-support.ts'
import { Cell, actionSchema, fill, weightSchema } from '../support.tsx'

export const KatanaStepPlayerApi = {
  name: 'KatanaStepPlayer',
  schema: z
    .object({
      steps: z
        .union([
          z.number().int().min(2).max(24),
          z
            .array(
              z
                .object({
                  duration: z
                    .number()
                    .min(200)
                    .max(120_000)
                    .describe('How long this step plays, in milliseconds.')
                    .optional(),
                  label: text("Accessible name of this step's dot when the bar is seekable.").optional(),
                })
                .strict(),
            )
            .min(2)
            .max(24),
        ])
        .describe('The number of steps, or one object per step when a step has its own duration or name.'),
      duration: z
        .number()
        .min(200)
        .max(120_000)
        .default(3000)
        .describe('Default length of a step in milliseconds.')
        .optional(),
      loop: z
        .boolean()
        .default(false)
        .describe('Go back to the first step after the last and keep playing.')
        .optional(),
      seekable: z.boolean().default(false).describe('Clicking a dot jumps to that step.').optional(),
      autoplay: z.boolean().default(false).describe('Start playing at once.').optional(),
      playLabel: text('Name of the play button.'),
      pauseLabel: text('Name of the pause button.'),
      replayLabel: text('Name of the replay button, shown after the last step.'),
      groupLabel: text(
        'Name of the whole bar; {step} is the current step from 1 and {count} the total, for example "Step {step} of {count}".',
      ),
      stepLabel: text(
        'Name of a dot when the step has no label of its own; {step} from 1 and {count}, for example "Go to step {step}".',
      ),
      onStepChange: actionSchema(
        'Dispatched when the current step changes. metadata.extensions.katanaStep carries {index} (0-based).',
      ).optional(),
      onComplete: actionSchema('Dispatched once when the last step finishes.').optional(),
      weight: weightSchema,
    })
    .strict(),
} satisfies ComponentApi

export const KatanaStepPlayer = createComponentImplementation(KatanaStepPlayerApi, ({ props }) => (
  <Cell weight={props.weight}>
    <StepPlayer
      steps={props.steps as number | { duration?: number; label?: string }[]}
      duration={props.duration}
      loop={props.loop}
      seekable={props.seekable}
      defaultPlaying={props.autoplay}
      onValueChange={(index) => void props.onStepChange?.(withExtension('katanaStep', { index }))}
      onComplete={props.onComplete ? () => void props.onComplete?.() : undefined}
      labels={{
        play: props.playLabel,
        pause: props.pauseLabel,
        replay: props.replayLabel,
        group: (index, count) => fill(props.groupLabel, { step: index + 1, count }),
        step: (index, count) => fill(props.stepLabel, { step: index + 1, count }),
      }}
    />
  </Cell>
))
