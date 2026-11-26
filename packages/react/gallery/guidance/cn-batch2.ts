// SPDX-License-Identifier: MIT
// A 股件包第 2 批（#110）的「怎么用 / 无障碍」。口径一律由调用方给（席位清单、交易日历、行情、异动类型），件只负责摆；
// 涨跌色只读语义色调，根上设 data-updown="cn" 得红涨绿跌；文字走 labels（cnLabelsZh 是简体中文默认，可整份换）。
import type { GuidanceMap } from './types'

const cnBatch2: GuidanceMap = {
  'seat-table': {
    aliases: ['龙虎榜', '席位', 'Dragon-tiger board', 'Seat table', '游资席位'],
    use: [
      '一只票上榜后看当日买入前五与卖出前五席位，游资标签（调用方给）一眼看出谁在做。',
      '席位清单与金额由调用方传，件按买入额 / 卖出额取前五、算净额与合计；一只票的上榜总览用 NetBuyBar。',
    ],
    avoid: ['多只票上榜的横向对比用 NetBuyBar，不要摆多个 SeatTable。', '不要在包里维护游资名单：标签由调用方给。'],
    a11y: [
      '每侧是一张真表格（caption 用 aria-label），列头 scope=col，合计行 scope=row。',
      '净额的涨跌带正负号文字，不只靠颜色。',
      '没有席位时写一行 role="status" 的字。',
    ],
  },
  'auction-step': {
    aliases: ['集合竞价', '竞价台阶', 'Opening auction', 'Call auction chart'],
    use: [
      '看 09:15–09:25 的撮合价怎么一步步走到开盘价，09:20 后不可撤单的分界一眼可见。',
      '表格里用 DataGrid 的 auctionStep 列类型画迷你台阶，可按相对昨收的涨跌幅排序。',
    ],
    avoid: ['盘中分时走势用 EquityCurve 或 Sparkline，竞价件只认 09:15–09:25。'],
    a11y: [
      '整张图是 role="img"，读屏名里写最新撮合价；读数（撮合价、涨跌幅、匹配量）是文字。',
      '涨跌除了颜色还有带正负号的涨跌幅文字；没有昨收就不着色。',
    ],
  },
  'trading-date-picker': {
    aliases: ['交易日选择', '复盘日期', 'Trading day picker', 'Session date picker'],
    use: [
      '复盘、回放、龙虎榜日期切换：只能选开市的日子，前后按钮直接跳到上一个 / 下一个交易日。',
      '交易日历（一组日期或判定函数）由调用方传；包里没有日历数据。',
    ],
    avoid: ['任意日期或区间用 DateTimeInput、DateRangePicker。'],
    a11y: [
      '日历是 react-aria 的 Calendar：方向键走日子，PageUp / PageDown 换月，Enter 选中。',
      '休市的日子是 aria-disabled（灰色加删除线），不只靠颜色。',
      '前后按钮有读屏名（上一个 / 下一个交易日），到边界时禁用。',
    ],
  },
  'flow-race': {
    aliases: ['板块资金', '资金流向', 'Sector money flow', 'Flow race'],
    use: [
      '盘中看各板块分钟累计净流入的多线对比：横轴只有 09:30–15:00，午休不占宽度，右端按最新值排名。',
      '线只用涨跌色（正涨负跌）与粗细区分；悬停或聚焦右端一行，对应的线加粗。',
    ],
    avoid: ['一条净值曲线用 EquityCurve；板块热度矩阵用 ThemeHeatMatrix。'],
    a11y: [
      '线图是装饰性的 aria-hidden，同样的信息在右端排行里：每行可聚焦，读屏名写名次、板块名与最新值。',
      '正负靠带正负号的文字，不只靠颜色。',
    ],
  },
  'mini-k-card-grid': {
    aliases: ['选股结果', '小K线卡片', 'Screener cards', 'Mini candlestick grid'],
    use: [
      '选股结果一屏扫一眼走势：一行 2 / 3 / 4 只，每张卡一个小 K 线加最新价与涨跌幅。',
      '点卡片联动个股页或大图（给 onSelect）。',
    ],
    avoid: ['看单只的走势细节用 MiniChart 或完整图表；要排序、筛选、批量操作用 DataGrid。'],
    a11y: [
      '给了 onSelect 卡片是 button，可 Tab、Enter；读屏名写名称、代码与涨跌幅。',
      'K 线是 role="img"，读屏名写根数；涨跌幅是带正负号的文字，不只靠颜色。',
    ],
  },
  'move-feed': {
    aliases: ['异动', '盘口异动', '异动流', 'Intraday alerts feed', 'Tape'],
    use: [
      '盘中盘口异动的流：一行一条（时间 · 名称 · 类型 · 数值），新的从顶上进，点行联动个股。',
      '顶上的类型多选筛：点一个只看它，再点取消，一个都没选是全部。',
      '加密市场：条目的 symbol 写币对，传 currentSymbol 多出「只看当前品种」勾选；类型名写进 labels.types（「5 分钟涨幅」），没有的窗口用 types 自定色调。',
    ],
    avoid: ['新闻、公告用 NewsFeed；公司事件用 EventTimeline。'],
    a11y: [
      '类型筛选是一组 aria-pressed 的按钮；类型胶囊上有字，不只靠颜色。',
      '「只看当前品种」是带 label 的勾选框，Space 切换；勾上后顶上的总条数跟着变。',
      '给了 onSelect 行是 button，读屏名写时间、名称、类型与数值；联动那一行标 aria-pressed。',
      '新行淡入的动画在 prefers-reduced-motion 下不播，列表不使用 aria-live（高频更新会吵）。',
    ],
  },
}

export default cnBatch2
