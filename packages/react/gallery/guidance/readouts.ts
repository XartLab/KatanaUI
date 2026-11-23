// SPDX-License-Identifier: MIT
// 读数与状态组的「怎么用 / 无障碍」（照 Salt 组件页）。
import type { GuidanceMap } from './types'

const readouts: GuidanceMap = {
  led: {
    aliases: ['Status indicator', 'Status dot', 'Badge dot', 'Pulse'],
    use: [
      '连接、数据源、任务是否在线的一点小标记。',
      '多个面板按联动组着色，表示它们同步。',
      '状态变了（如行情断线）在灯外闪一圈光晕：变坏用警示色，变好用涨色，各一次。',
      '语气传 tone（Severity 加 off / accent）：在线、进行中是 accent，已连上是 ok；手里是 Severity 的直接传，不用再写映射表。',
    ],
    avoid: ['要读出具体状态词时用 StatusIcon 或文字，不要只放灯。', '表示未读数用 notification-bell 的角标。'],
    a11y: ['role=img，读屏名取 label；只有灯没有文字时 label 必传。', '颜色不单独传意，旁边写状态文字。'],
  },
  lcd: {
    aliases: ['Stat', 'Metric', 'Readout', 'Display value'],
    use: [
      '面板顶部的一个关键读数（净值、持仓数）。',
      '需要标签、数值、注释三层的小读数窗。',
      '数字变大闪涨色、变小闪跌色，约 600ms，同一处 1 秒内最多一次。',
    ],
    avoid: ['带涨跌与迷你图的读数用 metric-card。', '行内的价格用 price-tag。'],
    a11y: ['是普通文本，标签、数字、小字按 DOM 顺序读出。', '没有数据时读到「—」，不会读成 0。'],
  },
  'dot-matrix': {
    aliases: ['Pattern fill', 'Dotted pattern', 'Hatch'],
    use: ['图表里回撤、区间等「面」的填充。', '想给一块面一点材质又不抢数据色时。'],
    avoid: ['要读数的色块用实色。', '需要叠文字的面，先看对比度再用。'],
    a11y: ['纯装饰的 SVG 纹理，不带信息，读屏不应依赖它。', '纹理静止，没有动效。'],
  },
  'rolling-text': {
    aliases: [
      'Odometer',
      'Animated number',
      'Number flow',
      'Price flow',
      'Digit roll',
      'Ticker',
      'rolling-text',
      'Split-flap',
    ],
    use: [
      '实时价格、盈亏这类会跳动的数字。',
      '想让人一眼看出涨还是跌的方向。',
      '品种代码这类字母位换了，给 ramp 让它转过几个中间字再落下。',
      '报价跳动想让个位先转，给 stagger；计数器样子给 boxed；位数会变（999 到 1,000）给 resize。',
    ],
    avoid: ['值不常变的数用 lcd 或普通文字。', '一次性大批量刷新的表格不要逐格滚。'],
    a11y: ['动效只是辅助，别用它承载唯一信息。', '涨跌除了闪色还要有符号或箭头。'],
  },
  badge: {
    aliases: ['Superscript tag', 'Label', 'Marker'],
    use: ['品种名后标板块、风险（ST、科创板）。', '一个名字后挂几个小标记；风险标记给 tone。'],
    avoid: [
      '需要点击或带数字的用 chip-group 或 notification-bell。',
      '必须读到的警告用 alert。',
      '行内（不是上标）的小标签用 tag。',
    ],
    a11y: ['每个徽标是 role=img，读屏名取全称而不是单字。', '悬停的 title 也是全称。'],
  },
  tag: {
    aliases: ['Pill', 'Label', 'Chip', 'Lozenge', 'Badge'],
    use: [
      '行内的一个小标记：延迟、估算、停牌、已成交。',
      '语气只有四种（Severity）：neutral、ok、warn、danger；要强调又不想用底色时用 outlined。',
      'sm 给品种名后的上标（BadgeGroup 就是它），md 给正文与表格里的标记。',
    ],
    avoid: [
      '可点或可删的选项用 chip-group。',
      '带未读数的用 count-badge 或 notification-bell。',
      '一整句提示用 alert。',
    ],
    a11y: [
      '只是 span，没有角色；读屏读它的字。只放单字时给 role=img 与 aria-label 写全称（BadgeGroup 的做法）。',
      '语气靠字说清，颜色只是重复；各语气的字色在自己的底上过 4.5:1。',
    ],
  },
  kbd: {
    aliases: ['Keyboard key', 'Shortcut', 'Key cap', 'Hotkey'],
    use: ['菜单、命令面板、提示里标注快捷键。', '说明文字里指一个按键组合。'],
    avoid: ['要让用户录入快捷键用 shortcut-recorder。'],
    a11y: ['外层 span 带 aria-label，读成完整组合而不是一串单键。', '只是展示，不可聚焦。'],
  },
  'flag-mark': {
    aliases: ['Flag', 'Color label', 'Marker', 'Watchlist flag'],
    use: [
      '自选、筛选结果里给行做私人标记（要盯、待入场、已持有），再按旗过滤。照 TradingView 自选表（2026-11-18 实看）。',
      '旗在行最左端，10×12 燕尾旗，格子 16×18；没插时空心三级灰，平时透明，行悬停或键盘落在这一行才出。',
      '点旗：插着就拔掉，没插就插上最近用过的那面（头一次是第一面）；选别的颜色走右键菜单（useFlags 的 menu(id)，每面旗一项，最后「拔掉」）。',
      '颜色只用状态色：danger 玫瑰茜红、warn 土黄、ok 铬绿、neutral 灰，最多 4 面；名字由调用方给。TradingView 有 7 色，我们不为它造新色（待用户定是否要更多）。',
      '按旗过滤：FlagFilter 一排旗加个数的按钮，按下的那面是浅底加描边，再点取消；过滤中挪行，藏起来的行留在原位。',
    ],
    avoid: ['表达状态好坏（成交、告警），用 status-icon 或 tag。', '不要用品牌橙当旗色：橙只给焦点角括号。'],
    a11y: [
      '可点的旗是 button，aria-pressed 表示插没插，读屏名由调用方给（「给 BTCUSDT 插旗」），插着时 title 带旗名。',
      '在 DataGrid 里设 focusable={false}：表只占一个 Tab 停靠点，键盘用户从行的右键菜单（菜单键 / Shift+F10）插旗、换色。',
      '过滤按钮是 role=group 里的 aria-pressed 按钮，读屏名是旗名加个数，不只靠颜色。',
      'Alt+Enter 插旗 / 拔旗（照 TradingView 自选表，#87）：DataGrid 不认识旗，由调用方用 useHotkeys 登记（scope 写 watchlist），作用在 onCursorChange 给的键盘所在行上；enabled 接表的焦点（focus-within），表没焦点时这个键留给别处。分节标题行上不插。',
    ],
  },
  'notification-bell': {
    aliases: ['Notification', 'Bell icon', 'Alert indicator', 'Badge'],
    use: [
      '顶栏放提醒入口并显示未读数。',
      '只想提示「有新内容」不报数时用 dot 变体。',
      '未读数变多时按钮底色闪一下（橙色，600ms），变少不闪；列表里的新通知由调用方用 useEnterMarks 高亮 1.2 秒。',
    ],
    avoid: ['不是未读数而是状态时用 led。', '要列出提醒内容用 popover 或 sheet 接在它后面。'],
    a11y: ['本身是按钮，读屏名取 label，必传。', '带一个 role=status、aria-live=polite 的隐藏播报，未读数变了会读。'],
  },
  'matrix-orb': {
    aliases: ['Voice orb', 'AI orb', 'Activity indicator', 'Agent status'],
    use: [
      '展示 Agent 正在待命、聆听、思考、流式输出、完成或出错。',
      '语音输入时让波纹跟着音量走。',
      '同一个状态名也传给 AiPromptInput 的 state，整面一起动。',
    ],
    avoid: ['要写具体进展用 ai-status。', '后台任务进度用 progress。'],
    a11y: ['role=img，读屏名取 label，必传。', '状态变化不会自动播报，要读出变化时配 ai-status。'],
  },
  'arcade-pixel': {
    aliases: ['Pixel display', 'LED matrix', 'Marquee', 'Retro banner'],
    use: ['装饰性的状态牌、空态、欢迎屏。', '短的拉丁文字或精灵图的像素风展示。'],
    avoid: ['行情与价格读数用 lcd。', '含中文的文字，用普通文本。'],
    a11y: [
      '画布 aria-hidden，真正的文字放在 sr-only 里读屏读它；纯精灵给 label，不给就整块当装饰。',
      'marquee 在屏外或标签页隐藏时暂停。',
    ],
  },
  'json-viewer': {
    aliases: ['Tree view', 'JSON tree', 'Object inspector', 'Data inspector'],
    use: ['看原始消息、Agent 调用结果、连接调试输出。', '要在一大块 JSON 里查键名或值。'],
    avoid: ['要复制或高亮代码用 code-block。', '规整的行列用 data-grid。', '层级是业务目录时用 tree-view。'],
    a11y: [
      '底座是 react-aria 的 Tree（treegrid），整棵树的名字取 label。',
      '查找框有 aria-label，命中数在 role=status 里播报。',
    ],
  },
  'step-player': {
    aliases: ['Stepper', 'Story progress', 'Slideshow indicator', 'Pagination dots'],
    use: ['按时间自动走的演示或引导，可暂停重放。', '要让人跳到某一步时打开 seekable。'],
    avoid: ['真实任务进度用 progress。', '多步表单的步骤导航用 tabs 或普通按钮。'],
    a11y: [
      '播放钮的读屏名随状态换（播放、暂停、重放），文案由调用方传。',
      '圆点条是 role=group，当前步带 aria-current=step。',
    ],
  },
  'code-block': {
    aliases: ['Code snippet', 'Syntax highlighter', 'Pre', 'Code viewer'],
    use: ['展示一段要复制的代码或配置。', '带文件名和行号的示例。'],
    avoid: ['看结构化数据用 json-viewer。', '行内一个词的代码用普通文字。'],
    a11y: [
      '滚动区是 role=region 且可聚焦，键盘能滚动。',
      '行号对读屏隐藏，不会混进代码。',
      '复制钮的读屏名由调用方传（labels.copy），复制后换成 labels.copied。',
    ],
  },
  'uptime-bars': {
    aliases: ['Status history', 'Uptime bar', 'Heartbeat', 'Availability chart'],
    use: [
      '数据源、连接按天或按小时的健康历史。',
      '一眼看哪天断过流。',
      '新进来的格子高亮 1200ms（按格子的 id 认新旧）。',
    ],
    avoid: ['连续数值（延迟、用量）用 spark-tile 或 sparkline。', '当前状态一个点用 led。'],
    a11y: ['整条是 role=group，每格 role=img，读屏名取该格的 label。', '状态用颜色加高度两路表达，不靠颜色单独传意。'],
  },
  'dither-chart': {
    aliases: ['Pixel chart', 'Halftone chart', 'Bayer dither', 'Retro chart'],
    use: ['总览卡里装饰性的小图，要像素风。', '线、柱、堆叠、环、仪表、漏斗、热力一套调子。'],
    avoid: ['要读精确数的图用 sparkline、equity-curve。', '需要悬停取值的图不要用它。'],
    a11y: ['画布 aria-hidden，读屏读 description（必填）。', '序列靠点阵密度区分，不只靠颜色。'],
  },
  'count-badge': {
    aliases: ['Badge', 'Notification dot', 'Counter', 'Status dot'],
    use: ['头像、标签页、图标按钮角上的未读数或状态点。', '数字会涨会落，想看到增减方向。'],
    avoid: ['铃加未读数用 notification-bell。', '品种名后的上标用 badge。'],
    a11y: ['角标是 role=status，读屏名取 label（要带数字），变了会播报。', '状态点除了颜色，label 里写状态词。'],
  },
  'switchboard-card': {
    aliases: ['LED board', 'Light grid', 'Activity card', 'Dot display'],
    use: ['「市场活跃度」「在线品种」这类带装饰意味的总览卡。', '用 lit 矩阵点亮一个字或形状。'],
    avoid: ['要读数的用 lcd 或 metric-card。', '一页放多块随机闪的卡。'],
    a11y: ['灯阵是装饰性的，信息写在标题与说明里。', '有 onClick 时整卡是按钮，读屏名取 title。'],
  },
}

export default readouts
