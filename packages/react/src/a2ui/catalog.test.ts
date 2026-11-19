// SPDX-License-Identifier: MIT
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import Ajv2020 from 'ajv/dist/2020.js'
import { describe, expect, it, vi } from 'vite-plus/test'

// @a2ui/react 在模块顶层继承 HTMLElement，单测在 Node 环境，先垫一个空类再载入目录（只为载入，不渲染）。
vi.hoisted(() => {
  globalThis.HTMLElement ??= class {} as typeof HTMLElement
})

const here = dirname(fileURLToPath(import.meta.url))
const read = (path: string) => JSON.parse(readFileSync(join(here, path), 'utf8')) as Record<string, unknown>

const { KATANA_APIS, KATANA_CATALOG_ID, BASIC_LAYOUT_NAMES, EXCLUDED_FUNCTIONS, katanaCatalog } =
  await import('./catalog.ts')

// 带必填 labels 的件：示例里的文案直接取 schema 里的键名，不手写几十行。
const wordsOf = (name: string, field = 'labels'): Record<string, string> => {
  const api = KATANA_APIS.find((item) => item.name === name)!
  const shape = (api.schema as unknown as { shape: Record<string, { shape: Record<string, unknown> }> }).shape
  return Object.fromEntries(Object.keys(shape[field]!.shape).map((key) => [key, key]))
}

// 每个组件一份示例属性：新加组件没写示例，下面「每个组件都有示例」就红，逼着补。
const CHART_ACTIONS = { group: 'Chart tools', table: 'Table view', exportCsv: 'Export', fullscreen: 'Full screen' }

const EXAMPLES: Record<string, Record<string, unknown>> = {
  KatanaButton: { label: 'Accept', variant: 'primary', action: { event: { name: 'accept', context: { id: 'a1' } } } },
  KatanaTextField: { label: 'Symbol', value: { '@path': '/form/symbol' }, inputType: 'text' },
  KatanaSelect: {
    label: 'Venue',
    options: [{ label: 'Binance', value: 'binance' }],
    value: { '@path': '/form/venue' },
  },
  KatanaSwitch: { label: 'Reduce only', value: { '@path': '/form/reduce' } },
  KatanaSlider: { label: 'Size', min: 0, max: 100, step: 5, value: { '@path': '/form/size' } },
  KatanaDateTimeInput: {
    label: 'From',
    value: '2026-11-17T09:30',
    enableTime: true,
    min: '2026-01-01',
    labels: {
      date: '{label} date',
      pickDate: 'Pick {label} date',
      calendar: '{label} calendar',
      time: '{label} time',
      previousMonth: 'Previous month',
      nextMonth: 'Next month',
    },
  },
  KatanaPnlText: { text: '+1,240.50 USDT', value: 1240.5, arrow: true },
  KatanaMetricCard: {
    label: 'VIX',
    value: '18.4',
    changes: [{ label: 'vs yesterday', value: -1.2 }],
    series: { '@path': '/vix' },
    labels: { spark: 'VIX over the last 30 days' },
  },
  KatanaChangeText: { value: 1.5, digits: 2 },
  KatanaSparkline: { values: [1, 2, 3], label: 'Price trend' },
  KatanaDecisionQueue: {
    items: [
      {
        id: 'd1',
        action: 'Buy',
        target: 'ACME',
        rationale: 'Backtest is positive.',
        sources: [{ label: 'Report', href: 'https://example.com/report' }],
        createdAt: '2026-11-17T09:00:00Z',
      },
    ],
    labels: wordsOf('KatanaDecisionQueue'),
    onAccept: { event: { name: 'decision.accept' } },
  },
  KatanaHypothesisLedger: {
    labels: wordsOf('KatanaHypothesisLedger'),
    items: [
      {
        id: 'h1',
        claim: 'Credit easing lifts small caps.',
        layer: 'credit',
        status: 'pending',
        failure: 'Small caps lag for 3 months.',
        deadline: '2027-01-31',
        evidence: [
          {
            id: 'e1',
            kind: 'data',
            source: 'Central bank',
            href: 'https://example.com/data',
            publishedAt: '2026-11-01',
            summary: 'Loan growth rose.',
            stance: 'support',
          },
        ],
      },
    ],
  },
  KatanaAiStatus: { status: 'searching', label: 'Reading the filing', elapsed: 12 },
  KatanaWebSearch: {
    sources: [{ id: 's1', site: 'Reuters', title: 'Headline' }],
    label: 'Searched 1 source',
    labels: { more: '{count} more', less: 'Show fewer' },
  },
  KatanaAlert: { tone: 'warn', title: 'Stale data', description: 'The feed is 5 minutes behind.' },
  KatanaDataGrid: {
    label: 'Positions',
    columns: [
      { id: 'symbol', title: 'Symbol', type: 'symbol' },
      { id: 'side', title: 'Side', type: 'side', sideLabels: { buy: 'Buy', sell: 'Sell' } },
      { id: 'pnl', title: 'P&L', type: 'pnl', digits: 2, align: 'end', width: 120 },
      { id: 'at', title: 'Time', type: 'time' },
    ],
    rows: [{ id: 'r1', symbol: 'BTCUSDT', side: 'buy', pnl: 12.5, at: '2026-11-17T09:30:00Z' }],
    selectable: true,
    selectLabels: { rowActions: 'Row actions', selectedRows: '{count} rows selected' },
    rowActions: [{ key: 'chart', label: 'Open chart', action: { event: { name: 'row.chart' } } }],
    onRowClick: { event: { name: 'row.open' } },
  },
  KatanaNewsFeed: {
    items: [
      {
        id: 'n1',
        time: '2026-11-17T09:00:00Z',
        channel: 'macro',
        source: 'reuters',
        title: 'Headline',
        href: 'https://example.com/news/1',
      },
    ],
    channels: [{ value: 'macro', label: 'Macro' }],
    sources: [{ value: 'reuters', label: 'Reuters' }],
    labels: wordsOf('KatanaNewsFeed'),
    onSelect: { event: { name: 'news.open' } },
  },
  KatanaNewsReader: {
    title: 'Headline',
    source: 'Reuters',
    meta: '7 min ago',
    body: ['First paragraph.', 'Second paragraph.'],
    labels: wordsOf('KatanaNewsReader'),
    onClose: { event: { name: 'reader.close' } },
  },
  KatanaEventTimeline: {
    events: [{ id: 'e1', at: '2026-11-17T01:35:00Z', kind: 'fill', label: 'Filled', side: 'buy' }],
    timeZone: 'Asia/Shanghai',
    session: [
      [570, 690],
      [780, 900],
    ],
    label: 'Events today',
    labels: wordsOf('KatanaEventTimeline'),
    onSelect: { event: { name: 'event.pick' } },
  },
  KatanaStatusBar: {
    left: [{ id: 'quote', label: 'QUOTE', value: 'OK', tone: 'ok', ledLabel: 'Quote feed healthy', pressable: true }],
    right: [{ id: 'clock', value: '09:30' }],
    label: 'Status',
    labels: { more: 'More' },
    onItem: { event: { name: 'status.open' } },
  },
  KatanaSystemMonitor: {
    links: [{ id: 'l1', name: 'Exchange', state: 'ok', latencyMs: 42 }],
    strategies: [{ id: 's1', name: 'Grid', account: 'A', symbol: 'BTCUSDT', status: 'running', quota: 0.4 }],
    metrics: [],
    events: [{ id: 'v1', at: '2026-11-17T09:00:00Z', severity: 'info', kind: 'order', text: 'Order sent' }],
    eventKinds: [{ value: 'order', label: 'Orders' }],
    labels: wordsOf('KatanaSystemMonitor'),
    onStrategyAction: { event: { name: 'strategy.action' } },
  },
  KatanaEmptyState: { title: 'No positions', tag: 'NO DATA', description: 'Nothing is open.', actions: ['go'] },
  KatanaTaskList: {
    tasks: [{ id: 't1', label: 'Read the filing', done: true }],
    label: 'Plan',
    labels: { completed: '{label} done', reopened: '{label} reopened' },
    onToggle: { event: { name: 'task.toggle' } },
  },
  KatanaStepPlayer: {
    steps: 4,
    loop: true,
    seekable: true,
    playLabel: 'Play',
    pauseLabel: 'Pause',
    replayLabel: 'Replay',
    groupLabel: 'Step {step} of {count}',
    stepLabel: 'Go to step {step}',
    onStepChange: { event: { name: 'step.change' } },
  },
  KatanaConsensusBlock: {
    label: 'Pre-trade check',
    subject: 'Order · Buy 300750 x 2,000',
    parties: [{ id: 'gw', label: 'Gateway', state: 'pass', message: 'Lot size ok' }],
    verdict: 'ok',
    verdictText: 'Ready to submit',
    stateLabels: wordsOf('KatanaConsensusBlock', 'stateLabels'),
  },
  KatanaLimitLadder: {
    levels: [
      {
        board: 3,
        promoted: [1, 3],
        items: [{ code: '600001', name: 'ACME', change: 10, status: 'sealed', firstSeal: '09:31' }],
      },
    ],
    labels: wordsOf('KatanaLimitLadder'),
    onSelect: { event: { name: 'stock.select' } },
  },
  KatanaTechnicalRating: {
    groups: [
      { key: 'osc', label: 'Oscillators', value: -0.2, counts: { sell: 3, neutral: 5, buy: 2 } },
      { key: 'all', label: 'Summary', value: 0.4, counts: { sell: 4, neutral: 6, buy: 12 } },
      { key: 'ma', label: 'Moving averages', value: 0.8, counts: { sell: 1, neutral: 2, buy: 12 } },
    ],
    rows: [{ key: 'rsi', name: 'RSI', group: 'osc', reading: '54.20', verdict: 'neutral' }],
    timeframes: [
      { value: '1h', label: '1h' },
      { value: '1d', label: '1d' },
    ],
    labels: wordsOf('KatanaTechnicalRating'),
    onValueChange: { event: { name: 'timeframe.change' } },
  },
  KatanaWatchlist: {
    rows: [{ id: 'a', symbol: 'ACME', last: 12.34, change: 0.2, changePct: 1.6 }],
    digits: 2,
    labels: wordsOf('KatanaWatchlist'),
    onSelect: { event: { name: 'watch.open' } },
  },
  KatanaQuoteTable: {
    groups: [
      {
        id: 'idx',
        label: 'Indices',
        rows: [{ id: 'q1', symbol: '000300', name: 'CSI 300', last: 3912, change: 31, changePct: 0.8 }],
      },
    ],
    digits: 0,
    labels: wordsOf('KatanaQuoteTable'),
    onSelect: { event: { name: 'quote.open' } },
  },
  KatanaAccordion: { items: [{ id: 'a', title: 'Details', child: 'detail', open: true }], multiple: true },
  KatanaPanelFrame: {
    heading: 'Reading',
    object: 'ACME',
    children: ['body'],
    toolbar: ['tool'],
    collapsible: true,
    labels: { collapse: 'Fold', expand: 'Unfold' },
  },
  KatanaSplitter: {
    axis: 'row',
    first: 'left',
    second: 'right',
    ratio: 0.4,
    label: 'Resize panes',
    valueLabel: 'First pane {percent}%',
  },
  KatanaEquityCurve: {
    points: [
      { time: '2026-11-10', equity: 100 },
      { time: '2026-11-11', equity: 104 },
      { time: '2026-11-12', equity: 101 },
    ],
    title: 'Equity',
    name: 'Equity',
    label: 'Equity curve for the last three days',
    labels: {
      drawdown: 'Drawdown',
      time: 'Time',
      scale: { group: 'Axis', linear: 'Linear', log: 'Log' },
      brush: { start: 'Window start', end: 'Window end', window: 'Window' },
      actions: CHART_ACTIONS,
    },
    onValueChange: { event: { name: 'chart.window' } },
  },
  KatanaSeriesExplorer: {
    points: [
      { at: '2026-11-10', values: { pnl: 5, equity: 100 } },
      { at: '2026-11-11', values: { pnl: -2, equity: 98 } },
    ],
    series: [
      { key: 'pnl', label: 'Net profit', kind: 'bar' },
      { key: 'equity', label: 'Equity', kind: 'line' },
    ],
    ranges: [{ key: 'all', label: 'All', months: null }],
    kpis: [
      {
        key: 'pnl',
        label: 'Net profit',
        series: 'pnl',
        reduce: 'sum',
        format: { style: 'money', unit: 'USDT', signed: true },
      },
    ],
    columns: [{ key: 'pnl', label: 'Net profit', series: 'pnl', signed: true }],
    labels: {
      chart: 'Daily profit',
      ranges: 'Range',
      metrics: 'Metric',
      compare: 'Compare',
      previous: 'Previous',
      table: 'Details',
      time: 'Time',
      empty: 'No data',
      spark: 'Trend of {metric}',
      limit: 'Limit',
      actions: CHART_ACTIONS,
      brush: { start: 'Start', end: 'End', window: 'Window' },
    },
  },
  KatanaSmallMultiples: {
    items: [
      { key: 'a', label: 'ACME', values: [1, 2, 3] },
      { key: 'b', label: 'BETA', values: [3, 2, 2] },
    ],
    label: 'Prices of two instruments',
    xLabels: ['Mon', 'Tue', 'Wed'],
    onSelect: { event: { name: 'chart.select' } },
  },
  KatanaAttributionBars: {
    items: [
      { key: 'a', label: 'ACME', value: 120 },
      { key: 'b', label: 'BETA', value: -40 },
    ],
    title: 'Attribution',
    label: 'Profit and loss by instrument',
    labels: { other: 'Other x{n}', share: 'Share' },
    heads: { index: 'No.', item: 'Item', value: 'Contribution', share: 'Share' },
    footer: { count: '2 items' },
    actionLabels: CHART_ACTIONS,
    onSelect: { event: { name: 'chart.select' } },
  },
  KatanaCalendarHeatmap: {
    days: [
      { date: '2026-11-03', value: 10 },
      { date: '2026-11-04', value: -4 },
    ],
    weekdayLabels: ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'],
    monthLabels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    weekLabel: 'W{week}',
    closedLabel: 'Closed',
    describe: '{date}: {value}',
    describeEmpty: '{date}: no data',
    label: 'Daily profit for November',
    actionLabels: CHART_ACTIONS,
    tableHeads: { date: 'Date', value: 'Profit' },
    onSelect: { event: { name: 'chart.select' } },
  },
  KatanaHorizonChart: {
    rows: [{ key: 'a', label: 'ACME', values: [1, -2, 3, -1] }],
    label: 'Excess return of one instrument',
  },
  KatanaBrushChart: {
    values: [1, 2, 3, 4, 5],
    xLabels: ['a', 'b', 'c', 'd', 'e'],
    label: 'Price with an overview window',
    labels: { start: 'Window start', end: 'Window end', window: 'Window' },
    onValueChange: { event: { name: 'chart.window' } },
  },
  KatanaTreemap: {
    items: [{ id: 'a', name: 'ACME', group: 'Tech', size: 10, change: 0.01, text: '+1.00%' }],
    label: 'Sector map',
    legend: ['-3%', '-2%', '-1%', '0%', '+1%', '+2%', '+3%'],
    onItem: { event: { name: 'chart.select' } },
  },
  KatanaMarketHeatmap: {
    items: [{ symbol: 'ACME', name: 'Acme Corp', group: 'Tech', size: { cap: 10 }, value: { change: 1.2 } }],
    sizeBy: [{ key: 'cap', label: 'Market cap' }],
    colorBy: [{ key: 'change', label: 'Change', unit: '%' }],
    labels: {
      sizeBy: 'Size',
      colorBy: 'Color',
      view: 'View',
      grouped: 'Grouped',
      flat: 'Flat',
      all: 'All',
      other: 'Other',
      price: 'Price',
      group: 'Sector',
      summary: { count: 'Count', up: 'Up', down: 'Down' },
      segment: 'Hide {range}',
      list: 'Market heatmap',
      empty: 'Nothing to show',
    },
    onSelect: { event: { name: 'chart.select' } },
  },
  KatanaFlowSankey: {
    nodes: [
      { id: 'a', label: 'Funds' },
      { id: 'b', label: 'Stocks' },
    ],
    links: [{ source: 'a', target: 'b', value: 5 }],
    labels: {
      chart: 'Fund flow',
      flow: 'Flow',
      revaluation: 'Revaluation',
      showRevaluation: 'Show revaluation',
      amount: 'Amount',
      shareOfSource: 'Share of source',
      shareOfTotal: 'Share of total',
      inflow: 'Inflow',
      outflow: 'Outflow',
      revalIn: 'Revaluation in',
      revalOut: 'Revaluation out',
      empty: 'No flows',
      cycle: 'Loop found',
    },
    actionLabels: CHART_ACTIONS,
    tableLabel: 'Flow table',
    tableHead: ['Link', 'Amount'],
  },
  KatanaParamScatter: {
    points: [
      { id: 'p1', x: 1, y: 2, value: 1.4 },
      { id: 'p2', x: 2, y: 3, value: null },
    ],
    label: 'Sharpe over two parameters',
    axes: { x: 'Fast', y: 'Slow' },
    valueName: 'Sharpe',
    bestLabel: 'Best',
    jumpLabel: 'Jump to best',
    noValue: 'No result',
    idle: 'Choose a point',
    actionLabels: CHART_ACTIONS,
    tableLabel: 'Parameter table',
    tableHead: ['Set', 'Fast', 'Slow', 'Sharpe'],
    onSelect: { event: { name: 'chart.select' } },
  },
  KatanaSlopeChart: {
    items: [{ id: 'a', label: 'ACME', before: 1, after: 3 }],
    label: 'Weights before and after',
    columns: { before: 'Before', after: 'After' },
    describe: '{label}: {before} to {after}',
    actionLabels: CHART_ACTIONS,
    tableLabel: 'Slope table',
    tableHead: ['Item', 'Before', 'After'],
    onSelect: { event: { name: 'chart.select' } },
  },
  KatanaRidgeline: {
    groups: [{ id: 'a', label: 'Q1', values: [1, 2, 2, 3, 4] }],
    label: 'Return distribution by quarter',
    describe: '{label}: {n} samples, median {median}',
    actionLabels: CHART_ACTIONS,
    tableLabel: 'Distribution table',
    tableHead: ['Group', 'Samples', 'Mean'],
  },
  KatanaQuantileLayers: {
    layers: [
      { rank: 1, label: 'Q1', points: [0, 1, 2] },
      { rank: 2, label: 'Q2', points: [0, 2, 4] },
    ],
    longShort: [0, 1, 2],
    longShortLabel: 'Long-short',
    xLabels: ['a', 'b', 'c'],
    stats: [{ key: 'ann', label: 'Annualized', value: '12%' }],
    labels: {
      chart: 'Factor layers',
      actions: CHART_ACTIONS,
      x: 'Date',
      layers: 'Layers',
      table: 'Layer table',
      monotonicPass: 'Monotonic',
      monotonicFail: 'Not monotonic',
      monotonic: 'Monotonicity',
      tooMany: 'Too many layers',
    },
  },
  KatanaConnectedScatter: {
    series: [
      {
        id: 'a',
        label: 'ACME',
        points: [
          { x: 1, y: 2, label: 'March: 1, 2' },
          { x: 2, y: 3, label: 'April: 2, 3' },
        ],
      },
    ],
    label: 'Risk and return over time',
    axes: { x: 'Risk', y: 'Return' },
    actionLabels: CHART_ACTIONS,
    tableLabel: 'Path table',
    tableHead: ['Point', 'Risk', 'Return'],
  },
  KatanaVintageSeries: {
    observations: [
      {
        period: '2026-09-01',
        releases: [
          { at: '2026-10-15T00:00:00Z', value: 2.1 },
          { at: '2026-11-15T00:00:00Z', value: 2.4 },
        ],
      },
    ],
    labels: {
      chart: 'Revisions of inflation',
      mode: 'View',
      known: 'As known',
      latest: 'Latest',
      both: 'Both',
      revisions: 'Revisions',
      revision: 'Revision',
      notYet: 'Not yet published',
      stats: { revised: 'Revised', meanAbs: 'Mean size', bias: 'Bias', largest: 'Largest' },
      empty: 'No data',
    },
    actionLabels: CHART_ACTIONS,
    tableLabel: 'Release table',
    tableHead: ['Period', 'First', 'Latest'],
  },
  KatanaUptimeBars: {
    cells: [
      { id: 'd1', status: 'up', label: 'Nov 1: normal' },
      { id: 'd2', status: 'down', label: 'Nov 2: outage' },
    ],
    label: 'Market data feed A, last 2 days',
    actionLabels: CHART_ACTIONS,
    tableLabel: 'Uptime table',
    tableHead: ['Day', 'State'],
    onSelect: { event: { name: 'chart.select' } },
  },
  KatanaTransmissionChain: {
    nodes: [
      { id: 'a', label: 'Credit' },
      { id: 'b', label: 'Small caps' },
    ],
    edges: [
      {
        id: 'e1',
        from: 'a',
        to: 'b',
        status: 'supported',
        evidence: [
          {
            id: 'v1',
            kind: 'data',
            source: 'Central bank',
            href: 'https://example.com/data',
            publishedAt: '2026-11-01',
            summary: 'Loans rose.',
            stance: 'support',
          },
        ],
      },
    ],
    labels: {
      chain: 'Transmission chain',
      notConnected: 'No nodes',
      status: { untested: 'Untested', supported: 'Supported', contradicted: 'Contradicted', partial: 'Partial' },
      stance: { support: 'Supports', oppose: 'Opposes' },
      kind: { scholar: 'Scholar', policy: 'Policy', data: 'Data', filing: 'Filing' },
      legend: 'Legend',
      evidence: 'Evidence',
      noEvidence: 'No evidence',
      failureCondition: 'Fails if',
      noFailureCondition: 'Not written',
      feedback: 'Feedback',
      upstream: 'Upstream',
      downstream: 'Downstream',
      none: 'None',
      pickHint: 'Choose a node or an edge',
      counts: 'for {support} against {oppose}',
      edgeName: '{from} to {to}',
      zoomIn: 'Zoom in',
      zoomOut: 'Zoom out',
      fit: 'Fit',
    },
    onSelect: { event: { name: 'chart.select' } },
    onOpenSource: { event: { name: 'chart.source' } },
  },
  KatanaCheckbox: { label: 'Accept the risk note', value: { '@path': '/form/risk' } },
  KatanaToggleGroup: {
    label: 'Side',
    options: [
      { label: 'Buy', value: 'buy' },
      { label: 'Sell', value: 'sell' },
    ],
    value: { '@path': '/form/side' },
  },
  KatanaMultiSelect: {
    label: 'Venues',
    options: [
      { label: 'Binance', value: 'binance' },
      { label: 'bit.com', value: 'bitcom' },
    ],
    values: { '@path': '/form/venues' },
    empty: 'None',
    separator: ', ',
  },
  KatanaChipGroup: {
    label: 'Filters',
    items: [
      { value: 'open', label: 'Open', count: 3 },
      { value: 'done', label: 'Done' },
    ],
    value: { '@path': '/filters' },
    labels: { clear: 'Clear filters' },
  },
  KatanaNumberInput: { label: 'Leverage', value: { '@path': '/form/lev' }, min: 1, max: 10, unit: 'x' },
  KatanaDecimalField: {
    label: 'Price',
    value: { '@path': '/order/price' },
    step: '0.01',
    unit: 'USDT',
    labels: { decrease: 'One tick down', increase: 'One tick up' },
  },
  KatanaDateRangePicker: {
    label: 'Period',
    start: { '@path': '/range/start' },
    end: { '@path': '/range/end' },
    today: '2026-11-17',
    labels: {
      start: 'Start date',
      end: 'End date',
      pickRange: 'Pick a range',
      calendar: 'Range calendar',
      previousMonth: 'Previous month',
      nextMonth: 'Next month',
      presets: 'Presets',
      today: 'Today',
      week: 'This week',
      month: 'This month',
      ytd: 'Year to date',
      custom: 'Custom',
    },
  },
  KatanaDurationPicker: {
    label: 'Valid for',
    hours: { '@path': '/ttl/hours' },
    minutes: { '@path': '/ttl/minutes' },
    labels: {
      hours: 'h',
      minutes: 'min',
      edit: 'Edit',
      save: 'Confirm',
      hoursInput: 'Hours',
      minutesInput: 'Minutes',
    },
  },
  KatanaCombobox: {
    label: 'Instrument',
    options: [{ label: 'ACME 600001', value: '600001', keywords: ['acme'] }],
    value: { '@path': '/form/symbol' },
    placeholder: 'Choose',
    searchPlaceholder: 'Search',
    emptyText: 'No match',
  },
  KatanaPasswordInput: { label: 'API secret', value: { '@path': '/form/secret' }, labels: { toggle: 'Show or hide' } },
  KatanaToast: { title: 'Order sent to the host', description: 'Waiting for your confirmation.', closeLabel: 'Close' },
  KatanaCodeBlock: {
    code: 'print(1)',
    language: 'python',
    highlightLines: [1],
    labels: { copy: 'Copy', copied: 'Copied' },
  },
  KatanaJsonViewer: {
    value: { '@path': '/raw' },
    label: 'Raw reply',
    labels: { search: 'Search', matches: '{count} matches', noMatches: 'No matches', more: '{count} more' },
  },
  KatanaSymbolMark: { symbol: 'BTCUSDT', name: 'Bitcoin', size: 'md' },
  KatanaCommand: {
    label: 'Commands',
    items: [{ id: 'open.report', label: 'Open the report', group: 'Go to', hint: 'G R' }],
    placeholder: 'Type a command',
    emptyText: 'No command',
    onSelect: { event: { name: 'command.select' } },
  },
  KatanaBadgeGroup: { items: [{ id: 'b1', label: 'S', text: 'Special treatment' }] },
  KatanaLed: { tone: 'ok', label: 'Market feed: connected', group: 'A' },
  KatanaLcd: { label: 'NET ASSET', value: '1,240.50', tone: 'up', note: 'USDT' },
  KatanaRollingText: { text: '1,240.50', value: 1240.5, animate: true },
  KatanaStatusIcon: { tone: 'ok', label: 'Backtest finished' },
  KatanaProgress: { label: 'Backtest progress', value: 40, max: 100, tone: 'ok' },
  KatanaMeter: {
    label: 'Exposure',
    value: 62,
    valueText: '62%',
    tone: 'warn',
    display: 'bar',
    mark: 80,
    markLabel: 'limit',
  },
  KatanaRatingText: { level: 'strong-buy', text: 'Strong buy' },
  KatanaEstimateBadge: { label: 'Estimated', title: 'Estimated from candles.' },
  KatanaPriceTag: { name: 'ACME', last: 12.4, changePct: 1.2, label: 'ACME 12.40, up 1.20%' },
  KatanaQuoteCard: {
    name: 'ACME',
    symbol: '600001',
    last: 12.4,
    change: 0.15,
    changePct: 1.2,
    spark: [1, 2, 3],
    labels: { spark: 'ACME price today' },
    onSelect: { event: { name: 'quote.select' } },
  },
  KatanaGaugeBar: { label: 'Sentiment', value: '62', share: 0.62, level: 'Greedy', note: 'Mean of five inputs.' },
  KatanaRatingGauge: {
    score: 0.4,
    zones: ['Strong sell', 'Sell', 'Neutral', 'Buy', 'Strong buy'],
    label: 'Technical rating',
    extra: '3 sell, 8 neutral, 12 buy',
  },
  KatanaRangeBar: { low: 10, high: 14, value: 12.4, label: 'Day range', lowLabel: 'Low', highLabel: 'High', digits: 2 },
  KatanaSparkTile: {
    label: 'NET ASSET',
    value: '1.24M',
    series: [1, 2, 3],
    labels: { spark: 'Net asset over 30 days' },
    changePct: 1.5,
    status: 'near',
    note: 'near the limit',
  },
  KatanaKeyStats: {
    title: 'Key stats',
    items: [{ id: 'cap', label: 'Market cap', value: '3.4T', unit: 'USD', badge: 'MEGA CAP' }],
    columns: 3,
    onSelect: { event: { name: 'stat.open' } },
  },
  KatanaPerformanceStrip: {
    items: [{ id: '1m', label: '1 month', change: 4.2 }],
    label: 'Performance by period',
    value: { '@path': '/range' },
    onSelect: { event: { name: 'range.select' } },
  },
  KatanaPeerCards: {
    items: [{ id: 'p1', symbol: 'PEER', name: 'Peer Corp', last: 10, unit: 'USD', changePct: -0.5 }],
    digits: 2,
    labels: { list: 'Peers', prev: 'Previous', next: 'Next', compare: 'Select to compare', add: 'Add {symbol}' },
    onSelect: { event: { name: 'peer.select' } },
  },
  KatanaFlowGauges: {
    gauges: [
      { kind: 'pressure', id: 'g1', title: 'Market pressure 1m', value: 62, valueText: '+62' },
      { kind: 'dom', id: 'g2', title: 'Depth', bids: [3, 2], asks: [1, 1], summary: 'Bids 71%, asks 29%' },
      {
        kind: 'divergence',
        id: 'g3',
        title: 'Divergence',
        rows: [{ window: '1m', cells: ['on', 'off'], summary: 'Delta up, price flat' }],
      },
    ],
    label: 'Order flow',
    labels: { na: 'N/A', estimate: 'est.' },
  },
  KatanaRegimeStrip: {
    states: [{ id: 'calm', name: 'Calm', color: 1, detail: '60%' }],
    segments: [{ from: 0, to: 10, state: 'calm', estimated: false }],
    label: 'Market regimes over the last year',
    labels: { estimate: 'est.' },
    activeState: { '@path': '/regime/active' },
    onSelect: { event: { name: 'regime.pick' } },
  },
}

describe('A2UI 目录', () => {
  it('每个组件都有示例，示例能被自己的 schema 解析', () => {
    expect(KATANA_APIS.map((api) => api.name).toSorted()).toEqual(Object.keys(EXAMPLES).toSorted())
    for (const api of KATANA_APIS) {
      const parsed = api.schema.safeParse(EXAMPLES[api.name])
      expect(parsed.success, `${api.name}: ${parsed.success ? '' : parsed.error.message}`).toBe(true)
    }
  })

  it('schema 是严格的：多写一个属性就拒绝', () => {
    for (const api of KATANA_APIS) {
      expect(api.schema.safeParse({ ...EXAMPLES[api.name], executeScript: 'alert(1)' }).success, api.name).toBe(false)
    }
  })

  it('组件名都带 Katana 前缀，不跟基础目录撞名；并进来的排版件都在基础目录里', () => {
    for (const api of KATANA_APIS) expect(api.name).toMatch(/^Katana[A-Z][A-Za-z]+$/)
    expect([...katanaCatalog.components.keys()]).toEqual([...BASIC_LAYOUT_NAMES, ...KATANA_APIS.map((api) => api.name)])
    expect(katanaCatalog.id).toBe(KATANA_CATALOG_ID)
  })

  it('每个属性都有英文说明（智能体靠它理解），没有中文', () => {
    const json = katanaCatalog.toJson() as {
      components: Record<string, { properties: Record<string, { description?: string }> }>
    }
    const bad: string[] = []
    for (const api of KATANA_APIS) {
      for (const [name, prop] of Object.entries(json.components[api.name]!.properties)) {
        if (name === 'component') continue
        if (!prop.description || /[一-鿿]/.test(prop.description)) bad.push(`${api.name}.${name}`)
      }
    }
    expect(bad).toEqual([])
  })

  it('安全：目录里没有 openUrl，来源链接只收 https，多余的属性与 javascript: 链接都被拒', () => {
    expect([...katanaCatalog.functions.keys()]).not.toContain('openUrl')
    expect(EXCLUDED_FUNCTIONS).toContain('openUrl')
    const queue = KATANA_APIS.find((api) => api.name === 'KatanaDecisionQueue')!
    const item = (EXAMPLES.KatanaDecisionQueue!.items as Record<string, unknown>[])[0]!
    for (const href of ['http://example.com', 'javascript:alert(1)', 'data:text/html,x', '/relative']) {
      const bad = { ...EXAMPLES.KatanaDecisionQueue, items: [{ ...item, sources: [{ label: 'x', href }] }] }
      expect(queue.schema.safeParse(bad).success, href).toBe(false)
    }
    // 没有任何属性能放 HTML、脚本或原始 URL：整份目录 JSON 里不出现这些字段名。
    const text = JSON.stringify(katanaCatalog.toJson())
    for (const field of ['"html"', '"innerHTML"', '"script"', '"dangerouslySetInnerHTML"', '"url"', '"openUrl"']) {
      expect(text.includes(field), field).toBe(false)
    }
  })

  it('密钥输入只收不回显：value 只收绑定，不收字面量；品种徽标不收图片地址；不带文案的件缺了文字就拒绝', () => {
    const api = (name: string) => KATANA_APIS.find((item) => item.name === name)!
    const password = api('KatanaPasswordInput')
    expect(password.schema.safeParse({ ...EXAMPLES.KatanaPasswordInput, value: 'hunter2' }).success).toBe(false)
    expect(
      api('KatanaSymbolMark').schema.safeParse({ ...EXAMPLES.KatanaSymbolMark, src: 'https://example.com/a.png' })
        .success,
    ).toBe(false)
    const { labels: _drop, ...noLabels } = EXAMPLES.KatanaDateTimeInput!
    expect(api('KatanaDateTimeInput').schema.safeParse(noLabels).success).toBe(false)
    const { labels: _copy, ...noCopy } = EXAMPLES.KatanaCodeBlock!
    expect(api('KatanaCodeBlock').schema.safeParse(noCopy).success).toBe(false)
  })
})

describe('目录 JSON', () => {
  const ajv = new Ajv2020({ strict: false, allErrors: true })
  const common = read('__fixtures__/common_types.json')
  ajv.addSchema(common)
  const validate = ajv.compile(read('__fixtures__/catalog_definition.json'))
  const document = katanaCatalog.toJson()

  it('过 A2UI v1.0 的 catalog_definition 校验', () => {
    expect(validate(document), JSON.stringify(validate.errors, null, 1)).toBe(true)
    expect(document.protocolVersion).toBe('1.0')
    expect(document.catalogId).toBe(KATANA_CATALOG_ID)
  })

  it('校验器是认真的：缺 catalogId、多一个顶层字段都不过', () => {
    const { catalogId: _drop, ...noId } = document
    expect(validate(noId)).toBe(false)
    expect(validate({ ...document, surprise: true })).toBe(false)
  })

  it('已提交的 public/a2ui/katana/v1.json 与 schema 算出来的一致（pnpm a2ui:catalog）', () => {
    const committed = readFileSync(resolve(here, '../../public/a2ui/katana/v1.json'), 'utf8')
    expect(committed).toBe(`${JSON.stringify(document, null, 2)}\n`)
  })
})
