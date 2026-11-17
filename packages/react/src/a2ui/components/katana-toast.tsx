// SPDX-License-Identifier: MIT
// KatanaToast：智能体发通知用的声明式组件。宿主提供了 KatanaToastHostContext 就在出现（或文字变了）时调宿主的 toast，组件自己不画；
// 没有宿主就在原位画一条（不固定在窗口角上），带关闭钮。库里的 Toast 只管样子，条目表、定时、暂停归宿主，所以这里不自己做队列与计时。
import { createComponentImplementation } from '@a2ui/react'
import type { ComponentApi } from '@a2ui/web_core'
import { CommonSchemas } from '@a2ui/web_core/v1_0'
import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { z } from 'zod'
import {
  Toast,
  ToastClose,
  ToastContent,
  ToastDescription,
  ToastIcon,
  ToastText,
  ToastTitle,
  type Severity,
} from '../../index.ts'
import { Cell, actionSchema, weightSchema } from '../support.tsx'

export type KatanaToastRequest = { title: string; description?: string; tone?: Severity }

/** 宿主在 A2uiSurface 外面包一层它，toast 就走宿主自己的队列与定时；不包就在原位画。 */
export const KatanaToastHostContext = createContext<((toast: KatanaToastRequest) => void) | null>(null)

const TONES = ['neutral', 'ok', 'warn', 'danger'] as const

export const KatanaToastApi = {
  name: 'KatanaToast',
  schema: z
    .object({
      title: CommonSchemas.DynamicString.describe(
        'A short notification heading. Write what happened in the words, not only in a color.',
      ),
      description: CommonSchemas.DynamicString.describe('The detail text.').optional(),
      tone: z
        .enum(TONES)
        .describe(
          "Tone of the color bar and icon: 'neutral' (default), 'ok', 'warn' or 'danger'. Say it in the title too.",
        )
        .optional(),
      closeLabel: CommonSchemas.DynamicString.describe(
        'Accessible name of the close button. Used only when the host has no toast of its own and the notice is drawn in place.',
      ),
      onClose: actionSchema(
        'Dispatched when the user closes the notice drawn in place. It is not dispatched when the host shows the toast.',
      ).optional(),
      weight: weightSchema,
    })
    .strict(),
} satisfies ComponentApi

export const KatanaToast = createComponentImplementation(KatanaToastApi, ({ props }) => {
  const host = useContext(KatanaToastHostContext)
  const [closed, setClosed] = useState(false)
  const title = props.title ?? ''
  const description = props.description
  const tone = TONES.find((item) => item === props.tone)
  // 同一段文字只通知一次（开发模式下 effect 会跑两遍）。
  const sent = useRef<string | null>(null)
  useEffect(() => {
    if (!host) return
    const key = `${title}\n${description ?? ''}\n${tone ?? ''}`
    if (sent.current === key) return
    sent.current = key
    host({ title, ...(description === undefined ? {} : { description }), ...(tone === undefined ? {} : { tone }) })
  }, [host, title, description, tone])
  if (host || closed) return null
  return (
    <Cell weight={props.weight}>
      <Toast role="status" tone={tone}>
        <ToastContent>
          <ToastIcon />
          <ToastText>
            <ToastTitle>{title}</ToastTitle>
            {description ? <ToastDescription>{description}</ToastDescription> : null}
          </ToastText>
          <ToastClose
            label={props.closeLabel ?? ''}
            onClick={() => {
              setClosed(true)
              void props.onClose?.()
            }}
          />
        </ToastContent>
      </Toast>
    </Cell>
  )
})
