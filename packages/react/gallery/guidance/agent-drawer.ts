// SPDX-License-Identifier: MIT
// Agent 档案抽屉（KatanaUI #225）的「怎么用 / 无障碍」。
import type { GuidanceMap } from './types'

const agentDrawer: GuidanceMap = {
  'agent-drawer': {
    aliases: ['Agent drawer', 'Agent profile', 'Agent detail panel', 'Agent 档案', 'Agent 抽屉'],
    use: [
      '要看一个 Agent 本身：它是什么、怎么触发、谁负责、用得怎样、最近跑了哪些（盘前扫描、回补日线、风控巡检、新闻摘要）。',
      '从 Agent 列表点一行打开：列表用 DataGrid 的 custom 列加 onOpen，抽屉放进 Sheet；窄屏或常驻右栏时直接摆成面板。',
      '最近运行的行点开接 onOpenRun(id)，再用 AgentRunDetail 看那一次；配置、历史页签的内容经 configure、history 槽给。',
      '时间、时长、金额都由调用方写好（件不读钟）；热力格要跨 Agent 比较时给同一个 max。',
    ],
    avoid: [
      '看一次运行的过程用 AgentRunDetail。',
      '看几个并行的主 Agent 用 AgentFleet。',
      '要分派任务别用它，它只看。',
    ],
    a11y: [
      '「在跑」用中性亮色（--k-content-primary-foreground），不用 accent：Graphite 下 accent 是橙，色弱下与失败红分不出（#211）；在动靠转圈图标与状态词表达，状态、结果都是图标加词。',
      '属性区是 dl：名与值成对读出。头像是装饰（aria-hidden），名字写在旁边。',
      '热力格选 role=grid 而不是「一张 img 加说明」：每一天都是能逐个读到的数据点（读屏用户要能问「周三跑了几次」），一张图加长说明只能把数字全念一遍。一行一个星期（row，有星期名）、一天一个 gridcell，每格 aria-label 是整句（「11-03 跑了 12 次」），aria-colindex 是第几周（首周残缺时也对）。',
      '热力格只有一个 Tab 停点（roving tabindex）：← → 前后一周（残缺的首尾周取最近的一行，不会卡住），↑ ↓ 前后一天，PageUp / PageDown 前后 4 周，Home / End 这一行的头尾，Ctrl+Home / Ctrl+End 全图首尾；到头不拦方向键，页面照常滚。颜色只表示多少，读数靠字，悬停与聚焦都在格子下面写同一句。',
      '分档按跑过的日子的次数分位数（20 / 40 / 60 / 80 分位）：一天跑 300 次的离群值不会让其余日子全是最浅一档；要跨 Agent 比较给同一个 max（线性）。',
      '格子最小 10px，放不下时整张图横向滚动并停在最新一端；月份与星期标签是给眼睛的（aria-hidden），读屏靠每格的整句名字与每行的星期名。',
      '页签是 role=tablist，方向键切换；最近运行是一排按钮，Enter 或点击回调运行 id；每行的触发方式（定时 / 事件 / 上传 / 手动）有只给读屏的文字，图标是装饰。',
      '放进 Sheet 时 renderTitle、renderDescription 接 SheetTitle、SheetDescription，对话框的名字就是 Agent 名字；Esc 关闭，焦点回到列表里那一行。',
    ],
  },
}

export default agentDrawer
