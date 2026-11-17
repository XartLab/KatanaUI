// SPDX-License-Identifier: MIT
// 量化组的「怎么用 / 无障碍」（照 Salt 组件页）。
import type { GuidanceMap } from './types'

const quant: GuidanceMap = {
  'change-text': {
    aliases: ['Change %', 'Chg%', 'Delta text', 'Price change'],
    use: [
      '行情表、自选列表里的涨跌幅列。',
      '盘中看板的指标旁标日内变化。',
      '实时更新的数传 flash：变大闪涨色、变小闪跌色；默认不闪，静态表格排序翻页不该闪。',
    ],
    avoid: ['带币种的盈亏金额用 pnl-text。', '要画走势而不只是一个数时用 spark-tile。'],
    a11y: ['符号 + / - 写在字里，不只靠红绿区分。', '零不着色也不带号，读屏照读数字。'],
  },
  'event-calendar': {
    aliases: ['Economic Calendar', 'Earnings Calendar', 'ECO', 'Events calendar'],
    use: ['盘前看当天与本周的宏观数据发布、财报、分红、IPO。', '回测或研究时核对某个事件落在哪一天。'],
    avoid: ['按日看收益或成交的月历格用 calendar-heatmap。', '没有数据时传空数组，别拿它放占位样本。'],
    a11y: [
      '经济与财报表用 table 语义，列头可被读屏关联。',
      'EPS / 营收意外带正负号，不只靠涨跌色。',
      '类别药丸、重要性开关用 aria-pressed 报状态；条数变化用 aria-live 播报。',
    ],
  },
  'limit-ladder': {
    aliases: ['涨停梯队', 'Limit-up ladder', 'Streak board', '连板榜'],
    use: [
      'A 股盘中看各板位的涨停只数与晋级率。',
      '复盘时对照炸板、跌停的分布。',
      '刷新：封单额与涨幅变了闪涨跌色，汇总读数滚动；封板转炸板整行琥珀警示闪（跌停用跌红），回封闪涨色；升板时整行移到新层并闪涨色，新晋的票蓝线高亮 1.2 秒。',
    ],
    avoid: ['非 A 股市场没有连板概念，用 market-heatmap。', '只看某一只票的状态用 rating-text 或 change-text。'],
    a11y: [
      '列表是 listbox，每行是 option，选中状态由读屏报出。',
      '状态用文字胶囊写出（封住、炸板、跌停），不只靠颜色与淡显。',
      '汇总读数用 role="status"。',
    ],
  },
  'market-heatmap': {
    aliases: ['Stock Heatmap', 'Treemap', 'Market map', 'Finviz map'],
    use: ['盘中扫一眼全市场或板块的涨跌与资金分布。', '按行业分组找出领涨、领跌的板块。'],
    avoid: ['要精确比较几只票的数值时用表格（watchlist）。', '看一个因子的时间变化用 horizon-chart。'],
    a11y: [
      '每组一个停靠点，格子可聚焦，焦点所在格子出悬停卡片。',
      '格内字色按底色亮度现算黑白，保证对比。',
      '图例写出每档值边界，点一档隐藏这一档，颜色之外有数。',
    ],
  },
  'metric-card': {
    aliases: ['Metric explorer', 'KPI card', 'Stat card', 'Scorecard'],
    use: [
      '研究页展示一个宏观或市场指标的当前值与区间变化。',
      '多个指标排成卡片墙做宏观看板。',
      '大号当前值与变化变了闪涨跌色；走势线新点追加时平滑延伸，换区间直接换。',
    ],
    avoid: ['一行放多个小指标用 spark-tile。', '要读完整时间序列与扫读时用 brush-chart 或 vintage-series。'],
    a11y: [
      '走势线有读屏名，数值与变化都是文字。',
      '阶段带的档名写在带下面，不只靠颜色。',
      '没有数据时写 —，不画样本。',
    ],
  },
  'rating-text': {
    aliases: ['Analyst Rating', 'Recommendation', 'Rating badge', 'Consensus rating'],
    use: ['选股器里的分析师评级列。', '技术评级的单元格结论。'],
    avoid: ['要同时看分数、买卖计数与指标明细时用 technical-rating。', '表示必要条件是否满足用 consensus-block。'],
    a11y: ['档位写在文字里，图标是装饰（aria-hidden）。', '强弱靠一或两层箭头，不只靠颜色。'],
  },
  'technical-rating': {
    aliases: ['Technicals', 'Technical Analysis gauge', 'Summary gauge', 'Technical Ratings'],
    use: [
      '看一只票在各时间周期的技术面总评。',
      '单品种详情页里并列振荡指标与均线的结论。',
      '评级变了闪：总评档位升了闪涨色、降了闪跌色，买 / 卖个数与明细里的单项结论变了同理（卖的个数变多算偏空）。',
    ],
    avoid: ['只要一个评级标签时用 rating-text。', '它是读数不是买卖信号，下单前走 consensus-block。'],
    a11y: [
      '仪表有读屏名，档名、买 / 中性 / 卖计数都是文字。',
      '明细表是真 table，带 aria-label；结论文字上色，不靠色块。',
    ],
  },
  'pnl-text': {
    aliases: ['P&L', 'PnL cell', 'Profit/Loss text', 'Gain/Loss'],
    use: [
      '持仓、订单表里的浮动与已实现盈亏。',
      '账户摘要里的当日盈亏。',
      '实时更新的盈亏传 flash，按 value 的增减闪涨跌色；默认不闪。',
    ],
    avoid: ['百分比涨跌幅用 change-text。', '格式化（币种、位数、符号）由调用方做，不要指望它格式化。'],
    a11y: ['符号由调用方写进字里，不只靠颜色。', '颜色跟 data-updown，红涨绿跌互换时文字不变。'],
  },
  'decimal-field': {
    aliases: ['Price input', 'Quantity stepper', 'Number input', 'Order entry field'],
    use: ['下单面板输入价格与数量，按最小变动价位走一格。', '风控参数、止损止盈价位的输入。'],
    avoid: ['不要求十进制精度的一般数字用普通输入框。', '价位在不在格子上由调用方与 Gateway 判，不在这里校验。'],
    a11y: [
      'error 状态设 aria-invalid；warning 只换边色，读屏不报无效。',
      '− / + 按钮的读屏名由调用方传 buttons。',
      '只读、禁用时方向键与按钮都不改值。',
    ],
  },
  'quant-format': {
    aliases: ['Number formatter', 'Intl.NumberFormat', 'Price formatter', 'Tick size format'],
    use: ['表格、图表、画布与 Worker 里统一价格、涨跌幅、数量的写法。', '回测报告输出前统一小数位。'],
    avoid: [
      '要显示盈亏颜色时用 pnl-text 或 change-text，它们读 toneOf 的方向。',
      '币种与语言不在这里猜，小数位由调用方传。',
    ],
    a11y: ['不是有限数时写 —，读屏读到的是明确的缺失而不是 NaN。', '舍入成 0 的小负数当「平」，不带负号。'],
  },
  'use-scrubber': {
    aliases: ['Crosshair hook', 'Chart scrub', 'Tooltip tracking', 'Trace cursor'],
    use: ['自己写序列图时接上指针与键盘扫读。', '几张图共用一个选中格（受控）。'],
    avoid: ['选一段区间用 brush-chart。', '现成的图（equity-curve、horizon-chart）已内置，不用再接。'],
    a11y: [
      '给容器的键盘事件，←→ Home End Esc 与指针等价。',
      '不拦截 Ctrl、Alt、Meta 组合键；没选中时 Esc 照常往外冒。',
      '图上要配读数行（aria-live），选中格的值才有文字出口。',
    ],
  },
  'brush-chart': {
    aliases: ['Range slider', 'Navigator', 'Zoom brush', 'Context chart'],
    use: ['回测权益线先看全貌，再拖窗口细看某一段。', '研究时在长序列里框出一段对比。'],
    avoid: ['多条序列用 series-explorer 或 small-multiples。', '需要表格视图与回撤区时用 equity-curve。'],
    a11y: [
      '窗口与两端手柄是 role="slider"，各有读屏名与 aria-valuenow。',
      '扫读读数行用 aria-live 播报时间与值。',
      '此图没有表格视图，精确值靠读数行。',
    ],
  },
  'equity-curve': {
    aliases: ['Equity Curve', 'Cumulative P&L', 'Strategy Report', 'Drawdown chart'],
    use: [
      '回测结束后看权益线、基准与回撤。',
      '实盘监控账户权益与最大回撤。',
      '新点追加时权益线与基准线平滑延伸、末点闪一圈光晕；窗口停在最新点时跟着走，拖到别处就不动。',
    ],
    avoid: ['要看分层累计收益用 quantile-layers。', '多策略同图对比用 series-explorer。'],
    a11y: [
      '图头有「表格视图」，可切到逐点的表格读数。',
      '回撤用纹理区分，权益与基准线型不同，不靠颜色。',
      '概览窗口是 slider，有读屏名与 aria-valuenow。',
    ],
  },
  'spark-tile': {
    aliases: ['Sparkline card', 'KPI tile', 'Stat tile', 'Mini chart'],
    use: [
      '盘中监控一排关键指标（延迟、敞口、成交率）。',
      '回测摘要里并排放几个核心数。',
      '数值变了闪涨跌色（有 rollValue 时滚轮加闪）；新点追加时线平滑延伸，末点闪一圈光晕。',
    ],
    avoid: ['超过 5 个指标改用表格。', '要读历史序列细节时用 metric-card 或 brush-chart。'],
    a11y: ['迷你线是 role="img" 加读屏名，没有数据时写 —。', '接近阈值要在说明里写字，不只靠边框变色。'],
  },
  meter: {
    aliases: ['Progress bar', 'Gauge', 'Level meter', 'Utilization bar'],
    use: ['保证金占用、仓位敞口、风控额度的占用比。', '同步率、延迟等 0 到 100 的状态读数。'],
    avoid: ['高频（> 2Hz）更新的量用读数。', '普通任务进度别用 sync 形态，用 bar 形态。'],
    a11y: [
      '是 role="meter"，带 aria-valuenow 与 aria-labelledby 指向名字。',
      '越界、受限在名字或数里写字，不只靠琥珀色。',
    ],
  },
  'flow-gauges': {
    aliases: ['Order Flow gauges', 'Market Pressure', 'DOM Pressure', 'Delta divergence'],
    use: ['盘中看买卖压力、盘口挂单与多周期 delta 背离。', '下单前看一眼订单流是否同向。'],
    avoid: ['看长期走势用 horizon-chart 或 equity-curve。', '告警走告警中心，这里不加声音与闪烁。'],
    a11y: [
      '每个仪表是 role="img" 加读屏名，数字带符号写在字里。',
      '窗口不足写 N/A，读屏读到明确的缺失。',
      '压力不用涨跌色，不依赖红绿区分。',
    ],
  },
  'regime-strip': {
    aliases: ['Regime band', 'Market regime', 'State timeline', 'Hidden Markov states'],
    use: ['在权益线或价格图下标出牛熊、高低波动等状态段。', '回测报告里看策略在哪个状态下赚钱。'],
    avoid: ['需要表示好坏时用涨跌语义的件，状态色是类别。', '状态超过 6 个时合并后再画。'],
    a11y: [
      '色带是 role="img" 加读屏名，图例逐个写出状态名。',
      '图例按钮用 aria-pressed 报高亮状态。',
      '估算段叠斜纹并在图例写「估算」，不只靠颜色。',
    ],
  },
  'consensus-block': {
    aliases: ['Pre-trade checks', 'Approval gate', 'Risk checklist', 'Compliance check'],
    use: ['下单、改单、撤单提交前列出风控与合规的必要条件。', '实盘命令确认时显示意图与参数 hash。'],
    avoid: ['研究类命令不需要它，直接执行。', '它不做裁决，授权永远在执行网关，不要拿它当最终判定。'],
    a11y: [
      '每一格都有状态字与一句话，不只靠灯色与形状。',
      '有详情的格用 aria-expanded 报展开状态。',
      '结论用 role="status" 播报。',
    ],
  },
  'calendar-heatmap': {
    aliases: ['日历热力图', 'Activity heatmap', 'PnL Calendar', 'GitHub contributions', 'Calendar view'],
    use: [
      '回测或实盘按日看收益的分布，找连续亏损的日子。',
      '看换手、事件在月内的节奏。',
      '图第一次出现时想要进场感，给 reveal；之后换月、换视图不必再给。',
    ],
    avoid: [
      '要看宏观事件与时间用 event-calendar（页名「日历」）；这页叫「日历热力图」，两者不混用一个名字（2026-11-17 体检定）。',
      '要精确读数用表格视图，不要靠颜色深浅。',
    ],
    a11y: [
      '月历是 grid，行、列头与格子有读屏名。',
      '图头有「表格视图」；数值写在格内右下，不靠颜色。',
      '休市写「休」、无数据写「·」，与持平区分。',
    ],
  },
  'horizon-chart': {
    aliases: ['Horizon graph', 'Stacked band chart', 'Heat strip', 'Time series small multiples'],
    use: ['盘中十几个品种的收益叠成窄带，一屏对比。', '板块或因子的日内走势一览。'],
    avoid: ['超过十来行用 small-multiples 或表。', '要读精确值时看右列读数，不要看颜色深浅。'],
    a11y: [
      '图有读屏名，扫读读数行用 aria-live 播报。',
      '每行右侧写最新值与扫读值，不靠颜色深浅。',
      '此图没有表格视图。',
    ],
  },
  ridgeline: {
    aliases: ['Joyplot', 'Ridge plot', 'Density stack', 'Distribution by group'],
    use: ['比较各因子分层或各策略收益的分布形状。', '研究时看分布位置与宽窄随分组的变化。'],
    avoid: ['样本很少的组用箱线或直接列数。', '比较随时间的变化用 quantile-layers。'],
    a11y: [
      '图是 role="img" 加读屏名，每条有整句读数。',
      '图头有「表格视图」。',
      '分层是序数色，中位数竖标与读数写出数值。',
    ],
  },
  'quantile-layers': {
    aliases: ['Quantile returns', 'Factor layers', 'Decile chart', 'Alphalens quantile plot'],
    use: ['因子研究看分层累计收益是否单调。', '检查多空差在样本内外是否稳定。'],
    avoid: ['看分层的收益分布用 ridgeline。', '层数超过 10 改看表格视图或热力图。'],
    a11y: [
      '图头有「表格视图」，列各层与多空差的值。',
      '单调性是灯加词，通过与不通过各一个词。',
      '层按钮用 aria-pressed 报锁定状态；颜色是序数色，层号写在标签里。',
    ],
  },
  'slope-chart': {
    aliases: ['Slopegraph', 'Rank change chart', 'Before-after chart', 'Dumbbell'],
    use: ['看再平衡前后的权重变化。', '因子或股票池排名在两个时点的升降。'],
    avoid: ['连续走势用折线（brush-chart、equity-curve）。', '项超过二三十条改用表格。'],
    a11y: [
      '图有读屏名，每条线有整句读数，聚焦即读。',
      '图头有「表格视图」。',
      '涨跌色只上变化后的数字，前后值都写在文字里。',
    ],
  },
  'connected-scatter': {
    aliases: ['Connected scatterplot', 'Trajectory plot', 'Path plot', 'Style drift chart'],
    use: ['看策略的波动与收益按月的路径。', '风格漂移、因子暴露随时间的移动。'],
    avoid: ['两个量没有先后顺序用 param-scatter。', '只看一个量随时间的变化用折线。'],
    a11y: [
      '图头有「表格视图」。',
      '方向不靠颜色：起点空心圈，终点实心圈加箭头。',
      '每个点有整句读数，图例与读数里都有轨迹名。',
    ],
  },
  'param-scatter': {
    aliases: ['Parameter sweep', 'Optimization heatmap', 'Strategy Tester optimizer', 'Grid search plot'],
    use: ['回测参数扫描后找最优一组参数。', '看目标值在参数平面上是尖峰还是平台，判断是否过拟合。'],
    avoid: ['有时间顺序的轨迹用 connected-scatter。', '点超过几千个先聚合再画。'],
    a11y: [
      '图头有「表格视图」。',
      '点可聚焦，读数区写两个参数与目标值，不只靠颜色。',
      '最优点用琥珀环加「最优」字标出；无结果的点画空心灰点。',
    ],
  },
  'flow-sankey': {
    aliases: ['Sankey diagram', 'Flow of funds', 'Capital flow', 'Alluvial diagram'],
    use: ['看资金从来源到用途与受益方的流向。', '拆开交易流量与价格重估，判断资金是否真的移动。'],
    avoid: ['有环（回流）时先拆成另一个节点再画。', '演示数据是虚构的，不要当真实资金流向。'],
    a11y: [
      '图头有「表格视图」。',
      '节点可聚焦并钉住上下游；钉住的按钮用 aria-pressed。',
      '价格重估是斜纹带，图例分开写，不只靠颜色。',
      '节点名放不下时截断加省略号，全文在 title 里。',
    ],
  },
  'vintage-series': {
    aliases: ['Point-in-time series', 'Vintage data', 'ALFRED vintages', 'Revision chart'],
    use: ['回测宏观因子时只用当时已知的值，避免偷看未来。', '看某个指标被修订了多少、往哪个方向。'],
    avoid: ['不涉及修订的普通序列用 brush-chart。', '没有发布时刻的数据别传，件要每次发布的值与时刻。'],
    a11y: [
      '图头有「表格视图」。',
      '十字线是 role="slider"，有读屏名与 aria-valuenow。',
      '修订柱带符号与数，空心点、灰点各有图例，不只靠颜色。',
    ],
  },
}

export default quant
