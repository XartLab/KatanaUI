// SPDX-License-Identifier: MIT
// 参照 affectUI 补的第三批（KATANAview #1908）：流程编排、Agent 树、Agent 总览、多角色小组的「怎么用 / 无障碍」。
import type { GuidanceMap } from './types'

const affectFlow: GuidanceMap = {
  'flow-builder': {
    aliases: ['Flow Builder', 'Workflow builder', 'Automation editor', '流程编排', '自动化'],
    use: [
      '盘后、告警触发的自动化要人搭：触发 → 动作 / Agent → 条件分路 → 提醒。',
      '要测试运行时给 onRun / onStop，每步的状态与时间经 run 回给件；时钟经 now 给。',
      '检查器（改一步的参数）由调用方在 onSelect 里开。',
    ],
    avoid: ['自由连线、要摆位置的图用 Whiteboard。', '回看跑过的一次用 TraceWaterfall。'],
    a11y: [
      '每步是 aria-pressed 的切换钮，读屏名写种类、名字与测试运行的状态；aria-describedby 写挪与删的键。',
      '每个「+」的读屏名写它加在哪；模板菜单是真的菜单，Esc 回到「+」。',
      '加、删、挪、撤销与测试运行的结果在 aria-live 里播报。',
    ],
  },
  'agent-tree': {
    aliases: ['Agent Tree', 'Orchestrator tree', 'Sub-agents', 'Agent 树', '子 Agent'],
    use: [
      '一次运行里子 Agent 还会派生子 Agent，要看哪条分支在跑、哪条要你、哪条最贵。',
      '运行中每次重建 root 交给件；在跑的耗时要显示就给 now。',
      '回答（批准、重试……）落库时接 onResolve，再改数据里的状态。',
    ],
    avoid: ['常驻的小组用 AgentCrew。', '几个并行的主 Agent 用 AgentFleet。'],
    a11y: [
      'role=tree，每张卡是带层级的 treeitem，读屏名写名字、状态、任务、花费与耗时；有子的带 aria-expanded。',
      '卡里没有可聚焦的钮（nested-interactive）：收起展开走 ← →，小窗走 Enter。',
      '小窗是带名字的 dialog，打开时焦点到第一个回答，Esc 关了回卡；合计在 aria-live 里播报。',
    ],
  },
  'agent-fleet': {
    aliases: ['Agent Fleet', 'Agent overview', 'Multi-agent dashboard', 'Agent 总览', 'Agent 群'],
    use: [
      '同时有几个主 Agent 在跑（研究、风控、回补），要一眼看出哪个要你、哪个失败。',
      '点开一个主 Agent 看它的子 Agent；回答在树里，接 onResolve。',
    ],
    avoid: ['只有一次编排用 AgentTree。', '看时间先后用 AgentLanes。'],
    a11y: [
      '主卡是带 aria-expanded 与 aria-controls 的按钮，指向打开的那棵树；方向键在主卡间走。',
      '环对读屏隐藏，旁边那句说明写成字。',
      '打开的树是带名字的 region，里面同 AgentTree；合计在 aria-live 里播报。',
    ],
  },
  'agent-crew': {
    aliases: ['Agent Crew', 'Agent team', 'Multi-agent crew', '多角色小组', 'Agent 小组'],
    use: [
      '一组常驻的 Agent（主管带研究员、风控、撰稿）一直在，要看谁在忙、谁要你、上下文快满了没有。',
      '交接接 handoffs（新 id 才点亮）；引导动作接 onSteer，再改数据里的状态。',
      '几个项目各一组时给 projects 与 onProjectChange。',
    ],
    avoid: ['来来去去、按分支算花费的子 Agent 用 AgentTree。', '一个 Agent 的步骤用 AiTaskList。'],
    a11y: [
      'role=tree，每张卡是 treeitem，读屏名写名字、状态、在做什么与上下文占比；aria-haspopup 为 dialog。',
      '详情是以成员命名的 Dialog，关了焦点回卡；留言框有 label，Esc 先收起它。',
      '交接与引导动作在 aria-live 里播报；项目切换是按钮加 listbox（Select）。',
    ],
  },
}

export default affectFlow
