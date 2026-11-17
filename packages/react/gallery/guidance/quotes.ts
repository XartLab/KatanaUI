// SPDX-License-Identifier: MIT
// 报价与行情组的「怎么用 / 无障碍」（照 Salt 组件页）。
import type { GuidanceMap } from './types'

const quotes: GuidanceMap = {
  sparkline: {
    aliases: ['Mini chart', 'Trend line', 'Spark chart', 'Inline chart', 'Symbol overview'],
    use: [
      '表格行、卡片里一眼看走势。',
      '没有空间放坐标轴的小图。',
      '有昨收、开盘这类基准时传 baseline，涨跌色就按最后值对基准。',
      '要逐点的涨跌或正负用 bars、winloss；趋势用默认的 area 或 line。',
      '需要读某一点的数时开 interactive，悬停与键盘都能出读数。',
      '新点追加时线与面积平滑延伸 240ms，末端点脉动一次；换一列数直接换。',
      'look 三种画风：default 用在行情面板（涨跌色、面积渐变）；instrument 用在研究与复盘这种要「看清分布」的场合（投影谱、极值与批注、档案编号与来源行）；ascii 用在终端感的状态栏、日志旁、加载等场合。',
      '日内走势（大图）给毫秒 times 与整个交易时段的 domain，线只画到现在；A 股再给 sessions 压缩午休；加 axis 与 lastTag 得到右侧价格刻度、底部时间刻度与最新价价签。',
    ],
    avoid: [
      '表格里一行一个时不要开 interactive，也别留末端点（行高 22px 这种）。',
      '高度低于 60px 时不要指望 axis：太挤，会被忽略。',
      '要完整坐标轴、缩放、多条线对比用 equity-curve 或 small-multiples。',
      'instrument 与 ascii 不是行情面板的默认，别把它们混进同一张表的各行；一屏里一种画风。',
      '不要把读数、标签的文字写进包里，由调用方传。',
    ],
    a11y: [
      'svg 是 role=img，读屏名由调用方按界面语言传。',
      '没有数据时留「—」，读屏名说明没有数据。',
      '涨跌不只靠线色，旁边配价格或涨跌文字。',
      'interactive 时 svg 可聚焦，左右键走点、Esc 退出，当前点的日期、时间与数值节流后由 aria-live 播报。',
      '价格刻度、时间刻度与价签是普通文本，由调用方格式化；涨跌不只靠价签颜色，旁边配价格文字。',
      '最高最低、最新值的字是调用方格式化好的普通文本，不靠颜色区分高低。',
      'instrument 的眉头、来源行、刻度、极值与批注都是 svg 里的普通文本，由调用方写；ascii 的 pre 是 aria-hidden，读屏只读外层 role=img 的名字。',
    ],
  },
  'mini-chart': {
    aliases: ['Mini chart widget', 'Symbol card', 'Ticker card', 'Single ticker with chart'],
    use: [
      '看板、自选里一只品种一张小卡：图标、代码、价、涨跌幅与走势。',
      '要显示「今天走了多久」时给 times 与 domain：线只画到现在，右边留空。',
      '数据实时变时传 live：价格滚动、涨跌幅闪色、走势平滑延伸。',
      '要仪器档案或终端字形的走势时传 look（instrument、ascii），默认外观不变。',
    ],
    avoid: [
      '表格行里用 sparkline，不要放整张卡。',
      '要完整的价格刻度、时间刻度与价签用 sparkline 的 axis 与 lastTag。',
      '只要价与涨跌幅、不要走势用 quote-card 或 price-tag。',
    ],
    a11y: [
      '整张卡 role=group（给了 onSelect 是按钮），读屏名取 labels.card；走势 svg 是 role=img，名取 labels.chart。',
      '涨跌不只靠颜色：涨跌幅前有三角，旁边有数字。',
      '价格实时滚动时读屏拿到的是当前完整数字，转轮里的字不进文本。',
    ],
  },
  'gauge-bar': {
    aliases: ['Meter', 'Progress bar', 'Level indicator', 'Scale bar'],
    use: ['一个数在区间里的位置，带档位词（如估值分位）。', '需要附一句数是怎么来的。'],
    avoid: ['表示任务进度用 progress。', '上下界都有的现价位置用 range-bar。', '多值用 meter 或 attribution-bars。'],
    a11y: ['轨道对读屏隐藏，名字、数、档位词与说明都是普通文本，按顺序读出。', '取不到数时写原因的文字会被读到。'],
  },
  treemap: {
    aliases: ['Heatmap', 'Market map', 'Squarified treemap', 'Block chart'],
    use: [
      '看一个板块或持仓里谁大谁涨谁跌。',
      '需要从组下钻到组内成员。',
      '数据实时变时：颜色线性渐变，换位与改大小平滑过渡，涨跌方向翻了的格子闪一次；传 cellKey 让格子认得自己。',
    ],
    avoid: ['带涨停、连板的热力格用 market-heatmap。', '项目很少时用 attribution-bars。'],
    a11y: [
      '给了 onItem 的格子是 role=button，读屏名为「名字 数」。',
      '色例对读屏隐藏，涨跌要靠格内文字读出。',
      '组头是原生按钮。',
    ],
  },
  'price-tag': {
    aliases: ['Inline price', 'Ticker chip', 'Quote chip', 'Price label'],
    use: [
      '一句话或一行里提到品种，附价格与涨跌。',
      '新闻、对话正文里的行内引用。',
      '价格变了闪一下涨跌色，约 600ms，同一处 1 秒内最多一次。',
    ],
    avoid: ['需要卡片版面用 quote-card。', '只显示盈亏数用 pnl-text。'],
    a11y: ['外层 aria-label 读成完整的一句，三角符号对读屏隐藏。', '涨跌靠三角与带符号的文字，不只靠颜色。'],
  },
  'quote-card': {
    aliases: ['Ticker card', 'Stock card', 'Stat card', 'Quote tile'],
    use: [
      '看一只品种的价、涨跌与走势。',
      '顶部一排指数行情，用 QuoteStrip 横向滚动。',
      '价格变了闪涨跌色，迷你图新点追加时平滑延伸。',
    ],
    avoid: ['要比较很多指标用 metric-card。', '多品种列表用 quote-table 或 watchlist。'],
    a11y: [
      '给了 onSelect 整张卡是一个原生按钮，不含其它可点元素。',
      'QuoteStrip 是 role=list，每张卡 role=listitem。',
      '涨跌带三角与符号，不只靠颜色。',
    ],
  },
  'performance-strip': {
    aliases: ['Performance row', 'Returns table', 'Period selector', 'Segmented stats'],
    use: ['品种页上按周期（1 日到全部）看涨跌幅。', '点一格同时切换图表区间。'],
    avoid: ['只选区间不显示涨跌用 toggle-group 或 tabs。', '要列多只品种用 quote-table。'],
    a11y: ['整排是 role=group，读屏名取 label。', '每格是按钮，选中用 aria-pressed。', '涨跌带符号，不只靠颜色。'],
  },
  'peer-cards': {
    aliases: ['Related symbols', 'Carousel', 'Comparison cards', 'Similar stocks'],
    use: ['品种页底部列出同业，点一张跳转。', '让人把几只放进对比。'],
    avoid: ['要完整表格用 quote-table 或 data-grid。', '只有两三张时直接平铺，不用翻页。'],
    a11y: [
      '卡片带是 role=list，每张 role=listitem。',
      '「+」是卡旁边独立的按钮，有自己的读屏名。',
      '翻页箭头到头会禁用。',
    ],
  },
  'key-stats': {
    aliases: ['Stat grid', 'Description list', 'Fundamentals', 'Key metrics'],
    use: [
      '品种页上市值、市盈率等一屏基本数据。',
      '指标要点开看详情时给 onItem。',
      '数值是字符串或数字时，变了闪一下涨跌色。',
    ],
    avoid: ['单个重点指标用 metric-card 或 lcd。', '随时间变化的数用 sparkline 类件。'],
    a11y: ['用 dl 结构，标签是 dt，数值是 dd，读屏能成对读。', '「›」装饰符号对读屏隐藏。', '没有值读到「—」。'],
  },
  watchlist: {
    aliases: ['Symbol list', 'Quote list', 'Market watch', 'Portfolio table'],
    use: [
      '右侧自选栏，看一批品种的最新价与涨跌。',
      '要点列头排序、标旗。',
      '价格变了只有变了的尾数闪涨跌色，涨跌幅也闪；排序下价格变了行平滑换位，新加的行蓝线高亮 1.2 秒。',
    ],
    avoid: ['需要几十列与大量行时用 data-grid。', '只要一屏概览用 quote-table。'],
    a11y: [
      '是真表格，列头是按钮，当前排序列 th 带 aria-sort。',
      '旗标是带 aria-pressed 的按钮。',
      '价格闪色只是视觉，不播报；涨跌另有文字列。',
    ],
  },
  'range-bar': {
    aliases: ['Range slider', '52-week range', 'Min-max bar', 'Position bar'],
    use: ['当日区间、52 周区间里现价的位置。', '用 CompareBar 对比两个区间。'],
    avoid: ['可拖动选区间用 slider 或 range-histogram-slider。', '没有上下界的量用 gauge-bar。'],
    a11y: [
      'RangeBar 是 role=meter，带最小、最大、当前值与可读的 aria-valuetext，名字取 label，必传。',
      'CompareBar 是 role=group，名字也必传。',
    ],
  },
  'rating-gauge': {
    aliases: ['Gauge', 'Speedometer', 'Technical rating', 'Semi-circle gauge'],
    use: ['技术面评级，从强烈卖出到强烈买入。', '一个分数落在五档里的哪一档。'],
    avoid: ['只想显示评级文字用 technical-rating 或 rating-text。', '连续数值进度用 gauge-bar。'],
    a11y: ['role=img，读屏名为「label: 档位名」。', '弧与指针对读屏隐藏，档位词与统计数是普通文字。'],
  },
  'row-actions': {
    aliases: ['Row actions', 'Hover toolbar', 'Quick actions', 'Context actions'],
    use: ['带品种的表格行、热力格上的开图、加自选、告警等操作。', '同一份动作既给悬停按钮也给右键菜单。'],
    avoid: ['整页的工具栏用 toolbar。', '一个行只有一个动作时直接放普通按钮。'],
    a11y: [
      '按钮是图标按钮，读屏名取各项的 label，必传。',
      '按钮条在键盘落到这一行时也会出现。',
      '禁用项用 aria-disabled。',
      '右键菜单也能由菜单键或 Shift+F10 打开。',
    ],
  },
  'quote-table': {
    aliases: ['Market table', 'Tabbed list', 'Index table', 'Quote list'],
    use: [
      '首页总览：指数、自选、热门分组一屏看。',
      '行可点进入品种。',
      '最新价与涨跌幅变了闪涨跌色（方向由 value 或价格文字读出），调用方重排行时行平滑换位，新加的行蓝线高亮 1.2 秒。',
    ],
    avoid: ['要排序、筛选、很多行用 data-grid 或 watchlist。', '只有一组时不用页签，直接用 quote-card 的一排。'],
    a11y: [
      '分组页签底座是 Radix Tabs（role=tablist），内容是 role=tabpanel。',
      '表头用 th，可点的行可聚焦。',
      '迷你图读屏名由调用方传。',
    ],
  },
  'infinite-slider': {
    aliases: ['Ticker tape', 'Marquee', 'News ticker', 'Carousel'],
    use: ['顶栏或底栏一条滚动的行情跑马灯。', '竖向的滚动榜（direction=vertical）。'],
    avoid: ['要点击的行情用 watchlist 或 quote-table。', '读准数的用 lcd 或 price-tag。'],
    a11y: ['外层 role=group，读屏名由调用方传；复制出来的一份 aria-hidden，只读一遍。', '悬停可减速，paused 可停住。'],
  },
  'pinned-list': {
    aliases: ['Favorites', 'Pin list', 'Starred list', 'Watchlist order'],
    use: ['自选股、常用面板按「钉在最上面」排序。', '置顶数有上限的列表。'],
    avoid: ['多选用 multi-select 或 chip-group。', '几百行的自选用 data-grid。'],
    a11y: [
      '每行是 role=button、aria-pressed 表示是否置顶，读屏名由 labels 给。',
      '漫游 tabindex：只有一行可 Tab 进入，方向键走。',
      '满额后其余行 aria-disabled。',
    ],
  },
  'animated-avatar-group': {
    aliases: ['Avatar stack', 'Symbol stack', 'Face pile', 'Overlapping marks'],
    use: ['ETF 前几大持仓、板块成分、相关品种一行放下。', '想悬停时看清每一枚。'],
    avoid: ['人的头像用 avatar-group。', '要点击某个品种用 watchlist。'],
    a11y: ['整组 role=group，每枚的名字取 name。', '悬停展开只是视觉，读屏顺序不变。'],
  },
}

export default quotes
