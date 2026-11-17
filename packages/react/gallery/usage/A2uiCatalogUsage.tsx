// SPDX-License-Identifier: MIT
import { Suspense, lazy, useState } from 'react'
import { CodeBlock } from '../../src/index'
import { BLOCKS_MESSAGES, CHART_MESSAGES, MESSAGES, MORE_MESSAGES, READOUT_MESSAGES } from '../a2ui-messages'
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
            labels={{ copy: 'Copy messages', copied: 'Copied' }}
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
              labels={{ copy: 'Copy messages', copied: 'Copied' }}
            />
          </div>
          <div data-testid="a2ui-more" style={{ minWidth: 0 }}>
            <Suspense fallback={null}>
              <HostSurface messages={MORE_MESSAGES} onAction={setReceived} />
            </Suspense>
          </div>
        </div>
      </details>
      <details>
        <summary>Readouts: lights, readings, meters, quotes, ratings, key stats, peers, order flow and regimes</summary>
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
              code={JSON.stringify(READOUT_MESSAGES, null, 2)}
              language="json"
              filename="readout-messages.json"
              labels={{ copy: 'Copy messages', copied: 'Copied' }}
            />
          </div>
          <div data-testid="a2ui-readouts" style={{ minWidth: 0 }}>
            <Suspense fallback={null}>
              <HostSurface messages={READOUT_MESSAGES} onAction={setReceived} />
            </Suspense>
          </div>
        </div>
      </details>
      <details>
        <summary>Charts: equity curve, attribution, uptime and treemap, with the chart tools and actions</summary>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
            gap: 16,
            marginTop: 12,
          }}
        >
          <div style={{ minWidth: 0, maxHeight: 560, overflow: 'auto' }}>
            <CodeBlock
              code={JSON.stringify(CHART_MESSAGES, null, 2)}
              language="json"
              filename="chart-messages.json"
              labels={{ copy: 'Copy messages', copied: 'Copied' }}
            />
          </div>
          <div data-testid="a2ui-charts" style={{ minWidth: 0 }}>
            <Suspense fallback={null}>
              <HostSurface messages={CHART_MESSAGES} onAction={setReceived} />
            </Suspense>
          </div>
        </div>
      </details>
      <details>
        <summary>Blocks and layout: a panel frame around a reading, a data grid and a task list</summary>
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
              code={JSON.stringify(BLOCKS_MESSAGES, null, 2)}
              language="json"
              filename="blocks-messages.json"
              labels={{ copy: 'Copy messages', copied: 'Copied' }}
            />
          </div>
          <div data-testid="a2ui-blocks" style={{ minWidth: 0 }}>
            <Suspense fallback={null}>
              <HostSurface messages={BLOCKS_MESSAGES} onAction={setReceived} />
            </Suspense>
          </div>
        </div>
      </details>
    </div>
  )
}
