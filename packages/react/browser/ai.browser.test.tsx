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
import { mount } from './render.tsx'

const settle = () => new Promise((r) => setTimeout(r, 700))

beforeAll(async () => {
  await page.viewport(900, 900)
})

for (const theme of ['graphite', 'console'] as const) {
  const shot = async (name: string, node: React.ReactNode, act?: () => void) => {
    await mount(
      <div style={{ display: 'contents', font: 'var(--text-body) var(--font-sans)', color: 'var(--ink-100)' }}>
        {/* the app's base.css resets box-sizing; the browser page has no such reset */}
        <style>{'*,*::before,*::after{box-sizing:border-box}'}</style>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: 480 }}>{node}</div>
      </div>,
      theme,
    )
    act?.()
    await settle()
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
          labels={{ thinking: '思考中', reasoning: '推理过程', thought: (seconds) => `思考了 ${seconds.toFixed(1)} 秒` }}
        >
          先看是个股事件还是板块行情，再查新闻与资金流向。
        </AiReasoning>,
        () => document.querySelector<HTMLElement>('[aria-expanded="false"]')?.click(),
      ))
    test('ai-response', () => shot('ai-response', <AiResponseUsage />))
    test('ai-suggestions', () => shot('ai-suggestions', <AiSuggestionsUsage />))
    test('ai-task-list', () => shot('ai-task-list', <AiTaskListUsage />))
    test('ai-tool-call', () =>
      shot('ai-tool-call', <AiToolCallUsage />, () => document.querySelector<HTMLElement>('[aria-expanded="false"]')?.click()))
  })
}
