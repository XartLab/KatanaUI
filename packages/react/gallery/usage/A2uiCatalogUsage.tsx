// SPDX-License-Identifier: MIT
import { Suspense, lazy, useState } from 'react'
import { CodeBlock } from '../../src/index'
import { MESSAGES, MORE_MESSAGES } from '../a2ui-messages'
import type { Received } from '../a2ui-host'

// 渲染器与 Lit 都在懒加载的块里：文档站首屏不背它，Node 里的单测也不会载入它。
const HostSurface = lazy(() => import('../a2ui-host'))

/** 左边是智能体发的消息（只读），右边是 KatanaUI 渲染出来的 surface；下面是宿主收到的 Action。 */
export function A2uiCatalogUsage() {
  const [received, setReceived] = useState<Received | null>(null)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, width: '100%' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 16 }}>
        <div data-testid="a2ui-json" style={{ minWidth: 0, maxHeight: 560, overflow: 'auto' }}>
          <CodeBlock
            code={JSON.stringify(MESSAGES, null, 2)}
            language="json"
            filename="messages.json"
            copyLabel="Copy messages"
            copiedLabel="Copied"
          />
        </div>
        <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div data-testid="a2ui-surface">
            <Suspense fallback={null}>
              <HostSurface messages={MESSAGES} onAction={setReceived} />
            </Suspense>
          </div>
          <pre
            data-testid="a2ui-host"
            aria-live="polite"
            style={{
              margin: 0,
              padding: 8,
              border: '1px solid var(--line-100)',
              font: 'var(--text-data)',
              whiteSpace: 'pre-wrap',
            }}
          >
            {received
              ? `Host received ${received.name}\ncontext ${JSON.stringify(received.context)}`
              : 'Host received nothing yet'}
          </pre>
        </div>
      </div>
      <details>
        <summary>More components: a second surface with a form, status, sources, suggestions and hypotheses</summary>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
            gap: 16,
            marginTop: 12,
          }}
        >
          <div style={{ minWidth: 0 }}>
            <CodeBlock
              code={JSON.stringify(MORE_MESSAGES, null, 2)}
              language="json"
              filename="more-messages.json"
              copyLabel="Copy messages"
              copiedLabel="Copied"
            />
          </div>
          <div data-testid="a2ui-more" style={{ minWidth: 0 }}>
            <Suspense fallback={null}>
              <HostSurface messages={MORE_MESSAGES} onAction={setReceived} />
            </Suspense>
          </div>
        </div>
      </details>
    </div>
  )
}
