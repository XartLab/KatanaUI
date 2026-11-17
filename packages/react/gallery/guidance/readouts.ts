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
    aliases: ['Odometer', 'Animated number', 'Number flow', 'Ticker'],
    use: ['实时价格、盈亏这类会跳动的数字。', '想让人一眼看出涨还是跌的方向。'],
    avoid: ['值不常变的数用 lcd 或普通文字。', '一次性大批量刷新的表格不要逐格滚。'],
    a11y: ['动效只是辅助，别用它承载唯一信息。', '涨跌除了闪色还要有符号或箭头。'],
  },
  badge: {
    aliases: ['Superscript tag', 'Tag', 'Label', 'Marker'],
    use: ['品种名后标板块、风险（ST、科创板）。', '一个名字后挂几个小标记。'],
    avoid: ['需要点击或带数字的用 chip-group 或 notification-bell。', '必须读到的警告用 alert。'],
    a11y: ['每个徽标是 role=img，读屏名取全称而不是单字。', '悬停的 title 也是全称。'],
  },
  kbd: {
    aliases: ['Keyboard key', 'Shortcut', 'Key cap', 'Hotkey'],
    use: ['菜单、命令面板、提示里标注快捷键。', '说明文字里指一个按键组合。'],
    avoid: ['要让用户录入快捷键用 shortcut-recorder。'],
    a11y: ['外层 span 带 aria-label，读成完整组合而不是一串单键。', '只是展示，不可聚焦。'],
  },
  'symbol-mark': {
    aliases: ['Avatar', 'Logo chip', 'Ticker icon', 'Symbol icon'],
    use: ['自选、行情行里品种名前的小圆标。', '没有图时用代码字母占位。'],
    avoid: ['用户头像用 Avatar 类件，这里不是。', '要按数据着色时不要用它的底色。'],
    a11y: ['role=img，读屏名取 name，没有就取 code。', '退回字母时字母对读屏隐藏，不会重复读。'],
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
    use: ['展示 Agent 正在待命、聆听或思考。', '语音输入时让波纹跟着音量走。'],
    avoid: ['要写具体进展用 ai-status。', '后台任务进度用 progress。'],
    a11y: ['role=img，读屏名取 label，必传。', '状态变化不会自动播报，要读出变化时配 ai-status。'],
  },
  'arcade-pixel': {
    aliases: ['Pixel display', 'LED matrix', 'Marquee', 'Retro banner'],
    use: ['装饰性的状态牌、空态、欢迎屏。', '短的拉丁文字或精灵图的像素风展示。'],
    avoid: ['行情与价格读数用 lcd。', '含中文的文字，用普通文本。'],
    a11y: ['画布 aria-hidden，真正的文字放在 sr-only 里读屏读它。', 'marquee 在屏外或标签页隐藏时暂停。'],
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
      '复制钮的读屏名由调用方传，复制后换成 copiedLabel。',
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
}

export default readouts
