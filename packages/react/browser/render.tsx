// SPDX-License-Identifier: MIT
/**
 * Mounts a component into the Vitest browser page with the library styles, for component screenshots.
 * 组件级截图的底座：装上字体与 ui.css、全局 box-sizing 重置、写好主题，框上设正文字体与颜色，把件渲染进一个固定内边距的框。只给 *.browser.test.tsx 用，不进包。
 */
import '@katana-ui/tokens/tokens.css'
import '../src/fonts.css'
import '../src/ui.css'
import type { ReactNode } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { userEvent } from 'vite-plus/test/browser'
import { flushSync } from 'react-dom'

let root: Root | undefined

// 应用的 base.css 有这条全局重置，浏览器测试页没有；放在 head 里，body 换内容时不丢。
const reset = document.createElement('style')
reset.textContent = '*, *::before, *::after { box-sizing: border-box; }'
document.head.append(reset)

/** Renders node in a padded frame under the given theme and returns the frame (screenshot target). */
export async function mount(node: ReactNode, theme: 'graphite' | 'console' = 'graphite'): Promise<HTMLElement> {
  root?.unmount()
  document.body.replaceChildren()
  // 上一个测试开着的模态层（Radix 的 Dialog、Select、Command）连同节点一起被换掉，来不及收尾：body 上留着 pointer-events: none 与
  // data-scroll-locked，下面停指针的 hover 就等不到「可接收指针」、超时 60 秒（#237 的 CI：select、command-palette）。先清干净。
  document.body.removeAttribute('style')
  document.body.removeAttribute('data-scroll-locked')
  if (theme === 'graphite') delete document.documentElement.dataset.theme
  else document.documentElement.dataset.theme = theme
  document.body.style.margin = '0'
  document.body.style.background = 'var(--bg-100)'
  const frame = document.createElement('div')
  frame.dataset.testid = 'frame'
  frame.style.display = 'inline-flex'
  frame.style.gap = '8px'
  frame.style.padding = '12px'
  // 照文档站 body（gallery.css）：正文字体与主文字色，件继承它们。
  frame.style.font = 'var(--text-body) var(--font-sans)'
  frame.style.color = 'var(--ink-100)'
  document.body.append(frame)
  root = createRoot(frame)
  flushSync(() => root!.render(node))
  // 鼠标指针在同一个页面里跨测试、跨文件留在原处（maxWorkers 限并发后，几个文件轮流用同一页）：上一个测试停过的位置若正好压在这次的按钮上，
  // 按钮就是悬停态（Cancel 的字从 205 变 255，#234 的 CI）。每次挂载把指针挪到 body 的左上角（框有 12px 内边距，那里没有件）。
  // 要写明 position：unhover / hover 不带位置时 Playwright 移到元素正中，body 的正中常压在件上（#237 的 CI：symbol-galaxy 出了悬停卡）。
  await userEvent.hover(document.body, { position: { x: 0, y: 0 }, force: true })
  await document.fonts.ready
  return frame
}
