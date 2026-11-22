// SPDX-License-Identifier: MIT
// A 股面板几件（#11，开盘啦对照）的「怎么用 / 无障碍」。设计决定（2026-11-18，#11 第二批）：
// 口径（情绪分、阶段、强度）一律调用方传，件不带算法；样子照 TradingView 小组件与列表的手感，配色是工作台 Graphite，不用 TradingView 蓝；
// 涨跌色只读 --k-tone-* / ChangeText，A 股面板在根上设 data-updown="cn" 得红涨绿跌，件里不写死红绿；这一组的文档站演示与组件截图都按 cn。
// 评审改动（2026-11-18，#78）：数据上不用品牌橙（#50：橙只给焦点角括号）——情绪分项小线图改中性前景色，题材热度底色改中性浓度五档；
// 情绪阶段色从类别色（紫蓝橙粉）改成状态语气 --k-status-*（Graphite 的油画颜料信号色）。
import type { GuidanceMap } from './types'

const cnPack: GuidanceMap = {
  'sentiment-cycle': {
    aliases: ['情绪温度', 'Market sentiment', 'Sentiment cycle', '赚钱效应'],
    use: [
      'A 股盘中、复盘看当日情绪分与近 20 日处在周期的哪一段。',
      '分项（涨停数、连板高度、亏钱数、封板率）一起看，十字线同步对日。',
      'A 股面板在根上设 data-updown="cn"：昨日差红涨绿跌。',
      '阶段语气按演示的划分：冰点 neutral（灰）、修复 warn（土黄）、发酵 ok（铬绿）、高潮 danger（玫瑰茜红，过热即风险）；口径与划分由调用方定。',
      '分项小线图与主走势线一样用主文字色，不用 series-1 橙。',
    ],
    avoid: ['只看一个读数用 meter 或 lcd。', '状态模型的长历史用 regime-strip 叠在净值图下。'],
    a11y: [
      '读数块是 role="status"，分数与阶段名都是文字。',
      '阶段不只靠颜色：图例写名字，今天的阶段标「当前」。',
      '仪表是 role="meter"，有 aria-valuenow 与 aria-valuetext。',
    ],
  },
  'theme-heat-matrix': {
    aliases: ['题材轮动', 'Theme heatmap', 'Sector rotation matrix', '板块热度'],
    use: [
      '复盘看近一到两周哪些题材持续有涨停、哪些退潮。',
      '点格子联动板块与个股列表（onSelect 给题材与第几天）。',
      '底色：主文字色 10% / 20% / 34% / 52% / 74% 混透明五档。tokens 里只有品牌橙系的 seq-*，没有不含橙的语义顺序档，先用中性浓度；要不要加一组语义顺序 token（如 --k-heat-1…5）待定。',
    ],
    avoid: ['一年的逐日格用 calendar-heatmap。', '市场全景的面积图用 market-heatmap。'],
    a11y: [
      '整张是 role="grid"，题材名是 rowheader，日期是 columnheader。',
      '每格的读屏句子由调用方写（含只数与名次），颜色之外有字。',
      'Tab 只停一个格子，方向键走格（APG Grid）。',
    ],
  },
  'reason-group-list': {
    aliases: ['涨停原因', 'Limit-up reasons', 'Catalyst groups', '涨停归因'],
    use: ['复盘按涨停原因看各题材的家数、最高板与梯队。', '用芯片只看关心的几个原因。'],
    avoid: ['按板位分层看晋级用 limit-ladder。', '不分组的普通列表直接用 data-grid。'],
    a11y: [
      '表是 treegrid：组头 aria-level=1 带 aria-expanded，个股 aria-level=2。',
      '芯片是 aria-pressed 的开关，芯片上写家数。',
      '连板写成文字（「3 板」「首板」），不只靠位置。',
    ],
  },
  'board-strength-rank': {
    aliases: ['板块强度', 'Sector strength', 'Industry ranking', '板块排行'],
    use: ['盘中看哪些板块最强、名次在升还是在降。', '配合题材热度矩阵：点板块联动个股。'],
    avoid: ['板块涨跌幅的面积分布用 market-heatmap。', '多日的强度对比用 theme-heat-matrix。'],
    a11y: [
      '名次变化是文字（▲2、▼1、新），颜色只是重复方向。',
      '每根强度线有调用方写的读屏名。',
      '表的键盘照 DataGrid：上下键走行，Enter 打开。',
    ],
  },
  'net-buy-bar': {
    aliases: ['龙虎榜', 'Dragon tiger list', 'Top traders', '席位'],
    use: ['盘后看上榜个股的净买方向与大小，点开看买卖前五席位。', '机构席位一眼分出来（「机构」标签）。'],
    avoid: ['盈亏归因（今天的钱从哪来）用 attribution-bars。', '只看净买数值用 data-grid 的 pnl 列。'],
    a11y: [
      '每行是 button，带 aria-expanded 与 aria-controls 指向席位区。',
      '净买额带正负号，方向不只靠颜色与条的朝向。',
      '机构席位用文字标签，不只靠颜色。',
    ],
  },
}

export default cnPack
