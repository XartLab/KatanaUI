// SPDX-License-Identifier: MIT
// 补漏：没有别的件再引用、又没被各目录截图覆盖的件（快速模式的覆盖检查报出来的）。数据取 gallery 的 usage 演示。
import type { ReactNode } from 'react'
import { beforeAll, describe, expect, test } from 'vite-plus/test'
import { page } from 'vite-plus/test/browser'
import { CheckboxGroupUsage } from '../gallery/usage/CheckboxGroupUsage.tsx'
import { InputGroupUsage } from '../gallery/usage/InputGroupUsage.tsx'
import { TextareaUsage } from '../gallery/usage/TextareaUsage.tsx'
import { ToastUsage } from '../gallery/usage/ToastUsage.tsx'
import { mount } from './render.tsx'

const items: Record<string, ReactNode> = {
  toast: <ToastUsage />,
  'checkbox-group': <CheckboxGroupUsage />,
  'input-group': <InputGroupUsage />,
  textarea: <TextareaUsage />,
}

beforeAll(async () => {
  await page.viewport(900, 700)
})

for (const theme of ['graphite', 'console'] as const) {
  describe(theme, () => {
    for (const [name, node] of Object.entries(items))
      test(name, async () => {
        await mount(
          <div
            style={{
              width: 420,
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            {node}
          </div>,
          theme,
        )
        await new Promise((r) => setTimeout(r, 250))
        await expect(page.getByTestId('frame')).toMatchScreenshot(`${theme}-gaps-${name}`)
      })
  })
}
