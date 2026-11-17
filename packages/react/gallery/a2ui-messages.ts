// SPDX-License-Identifier: MIT
// A2UI 演示用的消息：单独放一个不带 @a2ui 的文件，Node 里的单测（registry.test 会载入 usage/）才不会把渲染器拉进来。
// 智能体发来的消息（v1.0）：建一个 surface，下组件，再给数据。真实场景里它们从 SSE 或 WebSocket 来，这里写死。
export const MESSAGES = [
  {
    version: '1.0',
    createSurface: { surfaceId: 'desk', catalogId: 'https://xartlab.github.io/KatanaUI/a2ui/katana/v1.json' },
  },
  {
    version: '1.0',
    updateComponents: {
      surfaceId: 'desk',
      components: [
        { id: 'root', component: 'Column', children: ['suggestion', 'readings'] },
        { id: 'suggestion', component: 'Card', child: 'suggestionBody' },
        { id: 'suggestionBody', component: 'Column', children: ['title', 'why', 'result', 'actions'] },
        { id: 'title', component: 'Text', text: { '@path': '/suggestion/title' } },
        { id: 'why', component: 'Text', variant: 'caption', text: { '@path': '/suggestion/why' } },
        { id: 'result', component: 'Row', align: 'center', children: ['pnlLabel', 'pnl', 'move'] },
        { id: 'pnlLabel', component: 'Text', variant: 'caption', text: 'Backtest P&L' },
        {
          id: 'pnl',
          component: 'KatanaPnlText',
          text: { '@path': '/pnl/text' },
          value: { '@path': '/pnl/value' },
          arrow: true,
        },
        { id: 'move', component: 'KatanaChangeText', value: { '@path': '/pnl/move' }, arrow: true },
        { id: 'actions', component: 'Row', children: ['accept', 'reject'] },
        {
          id: 'accept',
          component: 'KatanaButton',
          label: 'Accept',
          variant: 'primary',
          action: {
            event: {
              name: 'suggestion.accept',
              context: { suggestionId: 'sg-1', symbol: { '@path': '/suggestion/symbol' } },
            },
          },
        },
        {
          id: 'reject',
          component: 'KatanaButton',
          label: 'Reject',
          action: { event: { name: 'suggestion.reject', context: { suggestionId: 'sg-1' } } },
        },
        { id: 'readings', component: 'Row', children: ['vix', 'basis'] },
        {
          id: 'vix',
          component: 'KatanaMetricCard',
          weight: 1,
          title: 'VIX',
          value: '18.4',
          changes: [{ label: 'vs yesterday', value: -3.2 }],
          trend: { '@path': '/vix' },
          trendLabel: 'VIX over the last 20 sessions',
          trendTone: 'inverse',
          source: 'Demo data',
        },
        {
          id: 'basis',
          component: 'KatanaMetricCard',
          weight: 1,
          title: 'Basis',
          unit: 'bp',
          value: '52.1',
          changes: [{ label: 'vs yesterday', value: 1.8 }],
          trend: { '@path': '/basis' },
          trendLabel: 'Basis over the last 20 sessions',
          source: 'Demo data',
        },
      ],
    },
  },
  {
    version: '1.0',
    updateDataModel: {
      surfaceId: 'desk',
      path: '/',
      value: {
        suggestion: {
          title: 'Buy ACME 600001, 3% of the book',
          why: 'Capacity ramp beats guidance; the same event type earned an excess return 20 days later in the backtest.',
          symbol: '600001',
        },
        pnl: { text: '+1,240.50 USDT', value: 1240.5, move: 2.31 },
        vix: [
          17.2, 17.9, 17.4, 18.1, 19.0, 18.6, 18.8, 19.4, 19.0, 19.2, 18.7, 18.9, 19.1, 19.0, 19.5, 19.1, 18.9, 19.0,
          19.0, 18.4,
        ],
        basis: [
          48, 49.2, 48.8, 50.1, 49.6, 50.4, 51, 50.2, 50.8, 51.3, 50.6, 50.9, 51.4, 51.0, 51.8, 51.2, 51.6, 51.9, 51.3,
          52.1,
        ],
      },
    },
  },
] as const

// 第二个 surface：表单、状态、建议队列、假说账、来源，把其余的件在真浏览器里也过一遍。时间写死（now），倒计时不随真实时间走。
export const MORE_MESSAGES = [
  {
    version: '1.0',
    createSurface: { surfaceId: 'more', catalogId: 'https://xartlab.github.io/KatanaUI/a2ui/katana/v1.json' },
  },
  {
    version: '1.0',
    updateComponents: {
      surfaceId: 'more',
      components: [
        { id: 'root', component: 'Column', children: ['status', 'notice', 'search', 'form', 'queue', 'ledger'] },
        {
          id: 'status',
          component: 'KatanaAiStatus',
          state: 'searching',
          label: 'Reading the filing',
          detail: 'ACME 10-K',
          elapsed: 12,
        },
        {
          id: 'notice',
          component: 'KatanaAlert',
          tone: 'warn',
          title: 'Stale quotes',
          description: 'The feed is 5 minutes behind; sizes below may be off.',
        },
        {
          id: 'search',
          component: 'KatanaWebSearch',
          label: 'Searched 3 sources',
          sources: { '@path': '/sources' },
          onOpen: { event: { name: 'source.open', context: { from: 'search' } } },
        },
        { id: 'form', component: 'Card', child: 'formBody' },
        { id: 'formBody', component: 'Column', children: ['symbol', 'venue', 'size', 'from', 'reduce', 'spark'] },
        {
          id: 'symbol',
          component: 'KatanaTextField',
          label: 'Symbol',
          value: { '@path': '/form/symbol' },
          placeholder: 'e.g. 600001',
        },
        {
          id: 'venue',
          component: 'KatanaSelect',
          label: 'Venue',
          value: { '@path': '/form/venue' },
          options: [
            { label: 'Binance', value: 'binance' },
            { label: 'bit.com', value: 'bitcom' },
          ],
        },
        {
          id: 'size',
          component: 'KatanaSlider',
          label: 'Size (% of book)',
          min: 0,
          max: 10,
          step: 0.5,
          value: { '@path': '/form/size' },
        },
        {
          id: 'from',
          component: 'KatanaDateTimeInput',
          label: 'From',
          enableTime: true,
          value: { '@path': '/form/from' },
        },
        { id: 'reduce', component: 'KatanaSwitch', label: 'Reduce only', value: { '@path': '/form/reduce' } },
        {
          id: 'spark',
          component: 'KatanaSparkline',
          label: 'Price over the last 12 bars',
          values: { '@path': '/spark' },
        },
        {
          id: 'queue',
          component: 'KatanaDecisionQueue',
          now: '2026-11-17T09:30:00Z',
          items: { '@path': '/decisions' },
          onAccept: { event: { name: 'decision.accept' } },
          onReject: { event: { name: 'decision.reject' } },
          onSnooze: { event: { name: 'decision.snooze' } },
          onOpenSource: { event: { name: 'source.open', context: { from: 'queue' } } },
        },
        {
          id: 'ledger',
          component: 'KatanaHypothesisLedger',
          now: '2026-11-17T09:30:00Z',
          items: { '@path': '/hypotheses' },
        },
      ],
    },
  },
  {
    version: '1.0',
    updateDataModel: {
      surfaceId: 'more',
      path: '/',
      value: {
        sources: [
          {
            id: 's1',
            site: 'Reuters',
            title: 'ACME lifts capacity guidance',
            snippet: 'The maker raised its output target.',
          },
          { id: 's2', site: 'Filings', title: 'ACME annual report' },
          { id: 's3', site: 'Exchange', title: 'Trading notice 2026-11' },
        ],
        form: { symbol: '600001', venue: 'binance', size: 3, from: '2026-11-17T09:30', reduce: false },
        spark: [10, 10.4, 10.2, 10.9, 11.3, 11.1, 11.8, 12.0, 11.6, 12.2, 12.5, 12.4],
        decisions: [
          {
            id: 'd1',
            action: 'Buy',
            target: 'ACME',
            targetTag: '600001',
            rationale:
              'Capacity ramp beats guidance; the same event type earned an excess return 20 days later in the backtest.',
            confidence: 0.72,
            basis: 'Event backtest 2023-2026, 38 samples',
            sources: [{ label: 'Backtest report 12', href: 'https://example.com/demo/backtest-12' }],
            createdAt: '2026-11-17T09:26:00Z',
            expiresAt: '2026-11-17T09:35:00Z',
          },
        ],
        hypotheses: [
          {
            id: 'h1',
            claim: 'Credit easing lifts small caps within a quarter.',
            layer: 'credit',
            status: 'pending',
            failure: 'Small caps trail the index for three months in a row.',
            deadline: '2027-01-31',
            evidence: [
              {
                id: 'e1',
                kind: 'data',
                source: 'Central bank',
                href: 'https://example.com/demo/loans',
                publishedAt: '2026-11-01',
                summary: 'New loans rose for a third month.',
                stance: 'support',
              },
            ],
            assets: [{ label: 'CSI 1000', tag: 'index' }],
          },
        ],
      },
    },
  },
] as const
