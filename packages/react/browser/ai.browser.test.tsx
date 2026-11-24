// SPDX-License-Identifier: MIT
// 组件截图：src/ai 里的公开件。演示取自 gallery/usage；动画件（头像、推理、进行中任务）关掉动画或取静止态。
import { beforeAll, describe, expect, test } from 'vite-plus/test'
import { page } from 'vite-plus/test/browser'
import { AgentAvatar, AiReasoning } from '../src/index.ts'
import { AiApprovalUsage } from '../gallery/usage/AiApprovalUsage.tsx'
import { AiArtifactUsage } from '../gallery/usage/AiArtifactUsage.tsx'
import { AiBranchUsage } from '../gallery/usage/AiBranchUsage.tsx'
import { AiContextMeterUsage } from '../gallery/usage/AiContextMeterUsage.tsx'
import { AiConversationUsage } from '../gallery/usage/AiConversationUsage.tsx'
import { AiDiffUsage } from '../gallery/usage/AiDiffUsage.tsx'
import { AiMessageUsage } from '../gallery/usage/AiMessageUsage.tsx'
import { AiPromptInputUsage } from '../gallery/usage/AiPromptInputUsage.tsx'
import { AiResponseUsage } from '../gallery/usage/AiResponseUsage.tsx'
import { AiSuggestionsUsage } from '../gallery/usage/AiSuggestionsUsage.tsx'
import { AiTaskListUsage } from '../gallery/usage/AiTaskListUsage.tsx'
import { AiToolCallUsage } from '../gallery/usage/AiToolCallUsage.tsx'
import { MarkdownUsage } from '../gallery/usage/MarkdownUsage.tsx'
import { mount } from './render.tsx'

const settle = () => new Promise((r) => setTimeout(r, 700))

// 固定等 700ms 在自建机忙时不够，展开弹簧截在半路（#190，2026-11-24 run 45319988571 的 ai-reasoning）。
// 再等有限时长的动画走完，然后等画框尺寸连续 5 帧不变（最多 3 秒）。
const frame = () => new Promise((r) => requestAnimationFrame(r))
const steady = async () => {
  await Promise.all(
    document
      .getAnimations()
      .filter((animation) => animation.effect?.getComputedTiming().endTime !== Infinity)
      .map((animation) => animation.finished.catch(() => undefined)),
  )
  const node = document.querySelector<HTMLElement>('[data-testid="frame"]')
  if (!node) return
  const size = () => {
    const box = node.getBoundingClientRect()
    return `${box.width}x${box.height}`
  }
  let last = size()
  let same = 0
  const deadline = performance.now() + 3000
  while (same < 5 && performance.now() < deadline) {
    await frame()
    const next = size()
    same = next === last ? same + 1 : 0
    last = next
  }
}

beforeAll(async () => {
  await page.viewport(900, 900)
})

for (const theme of ['graphite', 'console'] as const) {
  const shot = async (name: string, node: React.ReactNode, act?: () => void) => {
    await mount(<div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: 480 }}>{node}</div>, theme)
    act?.()
    await settle()
    await steady()
    await expect(page.getByTestId('frame')).toMatchScreenshot(`${theme}-${name}`)
  }
  describe(theme, () => {
    test('agent-avatar', () =>
      shot(
        'agent-avatar',
        <div style={{ display: 'flex', gap: 12 }}>
          {['risk', 'macro', 'quant'].map((seed) => (
            <AgentAvatar key={seed} seed={seed} label={seed} size={48} animated={false} />
          ))}
        </div>,
      ))
    test('ai-approval', () => shot('ai-approval', <AiApprovalUsage />))
    test('ai-artifact', () => shot('ai-artifact', <AiArtifactUsage />))
    test('ai-branch', () => shot('ai-branch', <AiBranchUsage />))
    test('ai-context-meter', () => shot('ai-context-meter', <AiContextMeterUsage />))
    test('ai-conversation', () => shot('ai-conversation', <AiConversationUsage />))
    test('ai-diff', () => shot('ai-diff', <AiDiffUsage />))
    test('ai-message', () => shot('ai-message', <AiMessageUsage />))
    test('ai-prompt-input', () => shot('ai-prompt-input', <AiPromptInputUsage />))
    test('ai-reasoning', () =>
      shot(
        'ai-reasoning',
        <AiReasoning
          defaultOpen
          duration={4.2}
          labels={{
            thinking: '思考中',
            reasoning: '推理过程',
            thought: (seconds) => `思考了 ${seconds.toFixed(1)} 秒`,
          }}
        >
          先看是个股事件还是板块行情，再查新闻与资金流向。
        </AiReasoning>,
        () => document.querySelector<HTMLElement>('[aria-expanded="false"]')?.click(),
      ))
    test('ai-response', () => shot('ai-response', <AiResponseUsage />))
    test('markdown', () => shot('markdown', <MarkdownUsage />))
    test('ai-suggestions', () => shot('ai-suggestions', <AiSuggestionsUsage />))
    test('ai-task-list', () => shot('ai-task-list', <AiTaskListUsage />))
    test('ai-tool-call', () =>
      shot('ai-tool-call', <AiToolCallUsage />, () =>
        document.querySelector<HTMLElement>('[aria-expanded="false"]')?.click(),
      ))
  })
}
