// SPDX-License-Identifier: MIT
/**
 * Mounts a component into the Vitest browser page with the library styles, for component screenshots.
 * 组件级截图的底座：装上字体与 ui.css、写好主题，把件渲染进一个固定内边距的框。只给 *.browser.test.tsx 用，不进包。
 */
import '@katana-ui/tokens/tokens.css'
import '../src/fonts.css'
import '../src/ui.css'
import type { ReactNode } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { flushSync } from 'react-dom'

let root: Root | undefined

/** Renders node in a padded frame under the given theme and returns the frame (screenshot target). */
export async function mount(node: ReactNode, theme: 'graphite' | 'console' = 'graphite'): Promise<HTMLElement> {
  root?.unmount()
  document.body.replaceChildren()
  if (theme === 'graphite') delete document.documentElement.dataset.theme
  else document.documentElement.dataset.theme = theme
  document.body.style.margin = '0'
  document.body.style.background = 'var(--bg-100)'
  const frame = document.createElement('div')
  frame.dataset.testid = 'frame'
  frame.style.display = 'inline-flex'
  frame.style.gap = '8px'
  frame.style.padding = '12px'
  document.body.append(frame)
  root = createRoot(frame)
  flushSync(() => root!.render(node))
  await document.fonts.ready
  return frame
}
