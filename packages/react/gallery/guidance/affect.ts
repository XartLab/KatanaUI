// SPDX-License-Identifier: MIT
// 参照 affectUI 补的量化、数据处理与 Agent 件（KATANAview #1908）的「怎么用 / 无障碍」。
import type { GuidanceMap } from './types'

const affect: GuidanceMap = {
  'experiment-card': {
    aliases: ['Experiment Card', 'A/B test', 'Variant comparison', '参数对比', '策略对比'],
    use: [
      '两到五组参数或两个策略按同一组指标比，要选一个采用。',
      '回撤、滑点这种越小越好的指标给 lowerIsBetter。',
      '有显著性检验结果时传 confidence；没算就不传，不写假的置信度。',
    ],
    avoid: ['五组以上用 ParallelAttempts 或参数散点图。', '要看走势用 KpiChart。'],
    a11y: [
      '每组是一个 role=radio 的按钮，aria-checked 是否选为胜者；Space 选中，再按撤回。',
      '变化的好坏有箭头加颜色，基准与领先写成字。',
      '底栏的提示是 aria-live=polite，悬停与选中会播报。',
    ],
  },
  'parallel-attempts': {
    aliases: ['Parallel Attempts', 'Best of N', 'Parameter sweep', '参数扫描', '并行回测'],
    use: ['一次扫描的几组同时跑，要边跑边看谁领先，跑完选一组。', '分数越小越好（如回撤）给 lowerIsBetter。'],
    avoid: ['只有一组时用策略报告。', '要比几组的多个指标用 ExperimentCard。'],
    a11y: [
      '所有行在一个 radiogroup 里；只有跑完的行有「用这组」单选，读屏名带组名与分数。',
      '进度条对读屏隐藏，信息都在旁边的字里。',
    ],
  },
  'change-summary': {
    aliases: ["What's changed", 'Change Summary', 'Recap', '周报摘要', '变化'],
    use: ['看板或周报顶上一块，列三到六个指标这段时间的变化。', '变化的文字由你写好：前后两个值、或百分点。'],
    avoid: ['要比精确数值的走势用 KpiChart 或表。', '超过六行用表。'],
    a11y: ['用 dl：每个变化跟它的指标名一起读。', '箭头是装饰，好坏写在颜色上之外还要写进文字（如「回撤变大」）。'],
  },
  'kpi-chart': {
    aliases: ['KPI Chart', 'Metric chart', 'Multi-line chart', '指标并看', '多线图'],
    use: [
      '一个大号读数加几条线并看：权益、回撤、夏普。',
      '单位相同的线用 shared；单位不同用 normalized，提示窗写真值。',
      '几张图共用一个扫读点时，上层持有 index 并传 onIndexChange。',
    ],
    avoid: ['几百个点的长序列用 BrushChart 或权益曲线。', '超过六条线拆成 SmallMultiples。'],
    a11y: [
      '图是 role=slider：←→ 走点，aria-valuetext 写这一点每条线的值。',
      '图例与刻度对读屏隐藏，信息都在 valuetext 与提示窗里。',
      '焦点离开图时清掉扫读点。',
    ],
  },
  'root-cause-tree': {
    aliases: ['Root Cause Tree', 'Fault tree', 'Troubleshooting', '排查树', '故障树'],
    use: [
      'data-check 报了缺口、断流、对不上账，要把排查的假设与证据摆在一起。',
      '根因下面要「修复」「重跑」时传 onAction。',
    ],
    avoid: ['看一次请求的耗时用 TraceWaterfall。', '件不判定根因：状态由排查的人或 Agent 写回。'],
    a11y: [
      'role=tree，一个 Tab 停点，方向键在行间走（APG 树）。',
      '每行的读屏名写标题、状态、是否根因与门（任一 / 同时）。',
      '证据区是 aria-live=polite 的 region；Esc 收起证据并把焦点送回树上。',
    ],
  },
  'trace-waterfall': {
    aliases: ['Trace Waterfall', 'Span timeline', 'Request trace', '链路', '耗时瀑布'],
    use: ['一次取数慢了，要看哪个源慢、重试了几次、解析花了多久。', '运行中的请求传 now，条会长到它。'],
    avoid: ['看一天的任务排程用 RateLimitPlanner。', '看回落顺序用 FallbackChain。'],
    a11y: [
      'role=tree，有子的行有 aria-expanded；一个 Tab 停点。',
      '每行的读屏名写名字、种类、状态、耗时、结果与是否最慢。',
      '时间轴、网格与条对读屏隐藏。',
    ],
  },
  'fallback-chain': {
    aliases: ['Fallback Chain', 'Source failover', 'Provider fallback', '回落', '数据源切换'],
    use: ['一次取数按顺序试几个源，要看这次走到第几级、前面为什么失败。'],
    avoid: ['看每一级的耗时细节用 TraceWaterfall。'],
    a11y: [
      '源是有序列表（ol），级号对读屏隐藏，次序由列表本身表达。',
      '头里的摘要是 role=status，状态变了会播报。',
      '状态与原因都写成字，灯只是辅助。',
    ],
  },
  'rate-limit-planner': {
    aliases: ['Rate Limit Planner', 'Quota schedule', 'Load planner', '限额排程', '抓取排程'],
    use: [
      '一个数据源一天里的回补、轮询、重算排在一起，按它的限额看峰值并错开。',
      '限额与 buffer 从适配器的限流配置读，不写死在页面里。',
    ],
    avoid: ['实时请求监控用 Meter 或系统监控。', '几个限额各用一张。'],
    a11y: [
      '每个任务的条是 role=slider，aria-valuetext 写起止与速率；已开始的 aria-disabled。',
      '负载图对读屏隐藏，状态、峰值与每次挪动的结果写成字（底栏 aria-live）。',
      '删除钮的读屏名带任务名；删除后焦点到下一个任务。',
    ],
  },
  'plan-vs-actual': {
    aliases: ['Plan vs Actual', 'Schedule variance', '计划对实际', '进度偏差'],
    use: ['Agent 跑一份多步计划（取数、清洗、归因、写报告），要看哪一步超时、会晚多少。'],
    avoid: ['Agent 报进度的清单用 AiTaskList。', '几个 Agent 并行时这件不够：它只有一条顺序计划。'],
    a11y: ['步骤是有序列表；状态写成字。', '轨道对读屏隐藏，时长写在行尾的字里。'],
  },
}

export default affect
