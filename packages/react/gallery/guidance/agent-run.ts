// SPDX-License-Identifier: MIT
// Agent 单次运行详情与运行列表（KatanaUI #196）的「怎么用 / 无障碍」。
import type { GuidanceMap } from './types'

const agentRun: GuidanceMap = {
  'agent-run-detail': {
    aliases: ['Agent run detail', 'Run drawer', 'Agent workflow', 'Task progress', '运行详情', '任务进度'],
    use: [
      '点开列表里的一个 Agent 运行，看它走到哪一步、卡在哪里、还要多久；放页面里或抽屉里都行。',
      '运行阻塞要人拍板时给 question 与 onConfirm；回调只告诉你人点了确认，改状态由你。',
      '运行完成后有顺手的下一步，给 next 与 onNext，每个带预估时长。',
      '已用、约剩、阻塞多久、用时都按毫秒传，用 formatDuration 写成字：件不读钟，进度跟着你的节奏刷新。',
    ],
    avoid: ['看很多个运行用 AgentRunList、AgentFleet 或 AgentQueue。', '看子 Agent 的树用 AgentTree。'],
    a11y: [
      '进度条是 role=progressbar，aria-label 由 labels.progress 给，aria-valuenow 是向下取整的整数百分比，aria-valuetext 由 labels.progressValue 拼成「76%，阻塞」（百分比加状态词，连接的字由调用方写）；刻度全是 aria-hidden。',
      '状态词与灯在 role=status 里，换状态会播报；百分比数字对读屏隐藏（进度条已经读了）。',
      '问题卡是以标题命名的区域；确认钮是原生按钮，aria-describedby 指向问题的标题与说明，读屏按钮列表里也知道在确认什么。',
      '右上「取消」是 danger 样式；要不要二次确认由调用方在 onAction 收到 cancel 时定（件不加）。',
      '「接着跑」「详情」「步骤」标题是按钮，aria-expanded 与 aria-controls 成对；收起的内容 hidden="until-found"，浏览器内查找命中时自动展开并同步按钮。',
      '步骤是有序列表，每步读屏词写状态（完成、在跑、等待、阻塞、失败），在跑与阻塞的那步 aria-current="step"；图标对读屏隐藏。完成步骤的耗时读屏读得到；在跑、阻塞、失败右边写的状态词跟读屏词重复，才对读屏隐藏。',
      '文字读 secondary 与 body 色，不读 tertiary（它在 Graphite 里只有 3.6:1，axe 会报）；两个主题下 axe 无违规。转圈只用在「在跑」的步骤上。',
    ],
  },
  'agent-run-list': {
    aliases: ['Agent run list', 'Agent tracker', 'Runs', 'Agent list', '运行列表', '运行清单'],
    use: [
      '要列出一个 Agent 的最近几次运行或几个 Agent 的当前状态，一行一个，点开看详情。',
      '分组按「进行中」「本周」这类写，组名由调用方给。',
      '相对时间文字由调用方写好，件不读钟。',
    ],
    avoid: ['看一个运行的步骤用 AgentRunDetail。', '标题栏里的小胶囊用 RunningNow。'],
    a11y: [
      '每组是 role=group，用 aria-labelledby 指向分组标题（真标题 h4，读屏按 H 键能跳）；每行是原生按钮，读屏名依次写名字、副标题、状态词、时间；选中的行 aria-current="true"。',
      '状态字前的灯对读屏隐藏，状态词本身在读屏名里；行尾箭头对读屏隐藏。',
    ],
  },
}

export default agentRun
