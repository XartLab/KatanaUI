// SPDX-License-Identifier: MIT
// 参照 affectUI 补的第二批（KATANAview #1908）：定时运行、任务队列、花费瀑布与 Agent 件的「怎么用 / 无障碍」。
import type { GuidanceMap } from './types'

const affectAgent: GuidanceMap = {
  'scheduled-runs': {
    aliases: ['Scheduled Runs', 'Weekly planner', 'Quota schedule', '定时任务', '周排程'],
    use: [
      '一周的回补、新闻、因子重算要排进有额度的时段（数据源配额、Agent 会话用量）。',
      '要自动排就用 auto；要手工摆就切 manual，订好的（at）不会动。',
      '挪动要落库时接 onMove。',
    ],
    avoid: ['看一天里的请求峰值用 RateLimitPlanner。', '盯正在跑的用 AgentQueue。'],
    a11y: [
      '每张卡是按钮，aria-describedby 写 Enter 与 Space 的用法；过去的卡写「已过」。',
      '每格是带名字的 group（天、时段与已用额度）；拿着卡时每一步在 aria-live 里播报有没有空位、落在哪。',
      '放下后焦点跟到新位置的卡；Esc 放回原处。',
    ],
  },
  'agent-queue': {
    aliases: ['Agent Queue', 'Job queue', 'Worker pool', '任务队列', '回补队列'],
    use: ['仓库回补、抓取任务排队等并发槽，要看积压、限流与失败。', '要让人调并发、暂停、插队或取消时，给对应的回调。'],
    avoid: ['看几个 Agent 随时间的分工用 AgentLanes。', '分析一次请求的耗时用 TraceWaterfall。'],
    a11y: [
      '每个任务是按钮，读屏名写名字、种类、状态、排第几、优先级、第几次与限流倒计时；一个 Tab 停点，方向键走。',
      '暂停是 aria-pressed 的开关；步进器的两个钮写动作，数字是 output。',
      '深度图对读屏隐藏，旁边有写成字的摘要；限流与背压在 aria-live 里播报。',
    ],
  },
  'cost-waterfall': {
    aliases: ['Cost Waterfall', 'Token usage', 'Run cost', '花费', 'token 用量'],
    use: [
      '一次 Agent 会话结束（或进行中）要看钱和 token 花在哪一步。',
      '子 Agent 的数不要预先加，件会把子步加上去。',
      '有抵扣（缓存命中、退款）就写负的 cost。',
    ],
    avoid: ['看耗时用 TraceWaterfall。', '看几天的预算用 Meter 或 AiContextMeter。'],
    a11y: [
      'role=tree，每行 treeitem 带层级，读屏名写名字、种类、状态、花费、token 与时长；子 Agent 有 aria-expanded。',
      '花费 / token 是两个 aria-pressed 的切换钮。',
      '详情里的长文本框可以 Tab 进去用键盘滚；Esc 收起并回到这一行。',
    ],
  },
  'agent-recap': {
    aliases: ['Agent Recap', 'While you were away', 'Overnight summary', '离开期间', '昨夜回顾'],
    use: ['隔夜或离开几小时回来，要把要人拍板的、失败的、做完的分开看。', '动作要等服务端确认时让回调返回 Promise。'],
    avoid: ['对话里的小卡用 AwaySummary。', '盯正在跑的用 RunningNow。'],
    a11y: [
      '整块是以标题命名的 section；三列各有带总数的列头。',
      '每个按钮的读屏名带动作与条目标题，重复的「查看」也分得清。',
      '分布图对读屏隐藏（卡里都有）；做完的动作在 aria-live 里播报，焦点移到撤销。',
    ],
  },
  'away-summary': {
    aliases: ['Away Summary', 'Catch-up card', '离开摘要', '回来看看'],
    use: ['回到对话或面板，Agent 在你不在时做了几件事，要一眼看完再折起来。', '要记「看过了」接 onDismiss。'],
    avoid: ['整夜的回顾与分布用 AgentRecap。', '高风险的批准用 AiApproval。'],
    a11y: [
      '整块是以标题命名的 section，清单是 ul，每行的状态写成字。',
      '「知道了」与分隔条都写 aria-expanded；折起的内容不在焦点里。',
      '处理中的按钮仍可聚焦，焦点不会掉到页面上。',
    ],
  },
  'running-now': {
    aliases: ['Running Now', 'Background tasks', 'Activity pill', '后台任务', '正在跑'],
    use: ['标题栏或状态栏上放一颗胶囊，告诉人后台有几个任务在跑、几个要他。'],
    avoid: ['完整的任务管理放到另一页，用 onOpenAll 过去。', '几个 Agent 的分工用 AgentLanes。'],
    a11y: [
      '胶囊的读屏名是完整摘要，带 aria-haspopup 与 aria-expanded（Popover 给）。',
      '每行读标题、状态、当前步与步数；图标钮的名字带任务标题。',
      '要你与完成的变化在 aria-live 里播报。',
    ],
  },
  'agent-lanes': {
    aliases: ['Agent Lanes', 'Multi-agent timeline', 'Swimlanes', '多 Agent 泳道', '泳道'],
    use: ['几个 Agent 并行，要看谁在忙、谁空着、谁在等人、活从谁交给了谁。'],
    avoid: ['排将来的任务用 ScheduledRuns。', '一个 Agent 分给很多 worker 用 FanOutGrid。'],
    a11y: [
      '每条泳道是以 Agent 名命名的列表；每个块是按钮，读 Agent、任务、状态与起止。',
      '等人的块弹出带名字的对话框，焦点先到批准；Esc 关上回到块。',
      '交接线对读屏隐藏，交给谁写在块的详情里；等人的个数在 aria-live 里播报。',
    ],
  },
  'fan-out-grid': {
    aliases: ['Fan-out Grid', 'Map step', 'Batch progress', '分发', '批量进度'],
    use: ['一个 Agent 把一批同样的活（每只票、每篇研报一个）分给很多 worker，要看进度、失败与剩余时间。'],
    avoid: ['几个 Agent 各干各的用 AgentLanes。', '一个队列的积压用 AgentQueue。'],
    a11y: [
      '格子是一个 Tab 停点，方向键走；聚焦的格的详情经 aria-describedby 读出。',
      '状态计数是 aria-pressed 的开关钮，一次亮一种。',
      '进度每过一成在 aria-live 里播报一次，不逐格播。',
    ],
  },
  'smart-recommendation': {
    aliases: ['Smart Recommendation', 'Suggestion card', 'Nudge', '建议卡', '推荐'],
    use: ['Agent 有一个明显更好的下一步（调止损、换数据源），要人一键采用、可撤销。'],
    avoid: ['几项差不多时并排给人比（ExperimentCard）。', '高风险动作用 AiApproval。'],
    a11y: [
      '标题是带 aria-expanded 的按钮。',
      '其他选项是菜单里的单选项。',
      '置信度写成字，格子只是辅助；采用后的结果在 aria-live 里播报。',
    ],
  },
  'decision-tree': {
    aliases: ['Decision Tree', 'Branching choice', 'Agent fork', '决策树', '岔口'],
    use: [
      'Agent 走到岔口，几个选项的后果是要人判断的主要内容（清洗、回补、调仓）。',
      '允许人写自己的指示时保留「其他…」。',
    ],
    avoid: ['是 / 否的问题用 DecisionQueue 或 AiApproval。', '审做完的活用 AgentRecap。'],
    a11y: [
      '每个分支是按钮，读屏名带「Agent 倾向」；aria-keyshortcuts 写数字键。',
      '有风险的后果可聚焦，经 aria-describedby 连到 role=tooltip 的注释。',
      '「其他…」是带 label 的 textarea；选择、指示与回话在 aria-live 里播报。',
    ],
  },
}

export default affectAgent
