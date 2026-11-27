// SPDX-License-Identifier: MIT
// 反馈组的「怎么用 / 无障碍」（照 Salt 组件页）。
import type { GuidanceMap } from './types'

const feedback: GuidanceMap = {
  skeleton: {
    aliases: ['Placeholder', 'Shimmer', 'Skeleton line'],
    use: ['骨架条本身：一般不单摆，经 loading 出现。', '要在自己的占位里画几条一样的点阵条时。'],
    avoid: [
      '等数据、等 Suspense 用 loading（它决定什么时候出骨架）。',
      '卡片、文章这类形状复杂的，用 measured-skeleton。',
    ],
    a11y: ['role=status、aria-busy，读屏读 label；线条对读屏隐藏。'],
  },
  loading: {
    aliases: ['Loading', 'Spinner', 'Suspense fallback', 'LoadingBoundary', 'LoadingView'],
    use: [
      '等数据：<Loading pending labels>，内容到了再挂 children。',
      '等 React.lazy / use()：pending 这个属性不写，Loading 就是 Suspense 边界；按属性在不在判，pending={undefined} 仍是等数据（当没在等），不会切模式。',
      '文档、测试、截图要看某一段：给 phase（loading / slow / timeout）。',
      '撑满面板主体给 fill，骨架行数按高度量；表头已知就传 header。',
      '骨架出了至少留 500ms（LOADING_MIN_SHOWN_MS）：510ms 到的数据，骨架留到 1000ms 才换成内容；500ms 内到的不出骨架。只管 pending 模式，Suspense 模式的骨架是 React 自己摘的，没有最短停留。出处：kubai Vibe Design Tips 017。',
      '一个按钮等一次请求（0.3 到 3 秒）不用 Loading，用 Button 的 pending：满 300ms 才出转圈、出了至少留 500ms、字与宽度不变、期间再按无效（见 button 页）。',
    ],
    avoid: [
      '知道进度时用 progress。',
      '操作结果的提示用 toast 或 alert。',
      '没数据（不是在等）用 empty-state。',
      '卡片、文章这类形状复杂的，用 measured-skeleton。',
    ],
    a11y: [
      '骨架是 role=status、aria-busy；读屏名取 label，没有就用 labels.skeleton。',
      '「仍在加载」、超时与重试文案全在 labels，由调用方按界面语言给；超时条的灯带「没有回应」的读屏名。',
      '重试钮是普通按钮，Tab 可到。',
    ],
  },
  'measured-skeleton': {
    aliases: ['Skeleton screen', 'Content placeholder', 'Skullet', 'Shimmer'],
    use: [
      '卡片、文章、建议队列这类形状复杂的加载占位，内容到了位置不动。',
      '示例数据排出的版面要和真数据同样的行数与控件。',
      '前 500ms 整块不可见、只占位（连卡片的边框底色也不露），之后才出骨架条；快的请求不闪。骨架条出了至少留 minShown（默认 500ms），数据早到也等满再揭示（kubai Vibe Design Tips 017）。',
    ],
    avoid: ['表格用按行高的 skeleton，图表自己画占位。', '知道进度时用 progress。'],
    a11y: [
      '加载期间有一个 role=status 的读屏文字，名字由调用方传 label（必填）。',
      '骨架本身 aria-hidden 且 inert，加载的容器带 aria-busy。',
      '骨架不闪不脉冲，所以没有动效要另外照顾。',
    ],
  },
  toast: {
    aliases: ['Snackbar', 'Notification', 'Banner', 'Flash message'],
    use: [
      '操作完成这类会自己消失的反馈。',
      '多条提示排在窗口一角。',
      '能撤销的操作（删画线、删自选、撤单后恢复）先做、再弹一条带「撤销」的 toast（ToastAction）；撤销后把同一条改成「已恢复」，约 1.5 秒后收。动作 toast 至少停 5 秒，指针或焦点在上面时暂停（计时在应用的 toast-queue，包里不计时）；可加 ToastCountdown：16px 的空心环随剩余比例变短，不写秒数。出处：kubai Vibe Design Tips 016。',
    ],
    avoid: [
      '要用户处理的事用 dialog 或 alert。',
      '一直在页面里的说明用 alert。',
      '不能撤销的事先确认（DeleteButton / AlertDialog），不要事后 toast。',
      '价格告警这类系统消息是通知，不是 toast（不是人刚做的事）：应进铃下的列表（NotificationBell），toast 只是到达提示。',
    ],
    a11y: [
      'ToastViewport 是 role=region，aria-live=polite：新增的条目读屏等空了再读，不打断；它一直在页面里，往里插的条目才会被读（只靠动态插进来的 role=status 节点，读屏不一定读）。',
      'warn、danger 那一条自带 role=alert（插入即打断播报）；neutral、ok 不带，走视口。',
      'Toast 不抢焦点；「撤销」是普通按钮，Tab 能到，Enter 或空格触发。倒计时环是装饰，aria-hidden，不报剩余秒数。',
      '关闭钮与「全部关掉」的读屏名由调用方传。',
      '语气（tone）只是色条与图标的颜色，标题里也要写明；说明文字用 ink-2，各主题都过 4.5:1。',
    ],
  },
  'toast-stack': {
    aliases: ['Stacked toasts', 'Toast queue', 'Sonner', 'Snackbar stack', '叠加吐司', '叠放提示'],
    use: [
      '同一时间可能弹出好几条的地方（告警、撤销提示）：收拢时只露最新一条、后面缩小 5%、上移 8px、变淡，最多露 3 层，不把窗口角落占满。',
      '指针移进或 Tab 进去展开成列表（间距 8px），移出收回；展开时每条的计时暂停，走开后接着剩下的时间。',
      '横向拖过条宽的 40%，或松手速度 ≥ 500px/s 且已拖开 24px：往那边滑出并关，其余走弹簧补位；不够弹回。数值是看参照的帧估的（待定）。',
      '「撤销」这类动作钮：条目的 action 带 label 与 result，点了这一条原地换成结果态（默认 ok 语气、绿色色条，停留 2.4 秒），不另弹一条；没有 result 就是点了即关。',
      '条目表受控（items + onItemsChange）或不受控（ref.push）都行；超过 max（默认 5）最旧的先收。受控时调用方可以在 onItemsChange 里拒绝变更（items 不变就是拒绝），叠放层不会把被拒的变更悄悄带进后面的操作。',
      '触屏没有悬停：点一下收拢的叠层（点在钮上不算）展开，点叠层外收回；展开时同样暂停计时。',
      '交互借自 Jamie Merrill 的「Stacked toasts」「Dismissing toasts」（2026-11-24 逐帧看，只借交互）；样子是现有的 Toast 皮肤，不用他的白底配色。',
    ],
    avoid: [
      '要用户处理的事用 dialog 或 alert：提示会自己消失，动作钮只当界面别处已有动作的快捷方式。',
      '一次只会有一条、也不需要撤销的用单条 Toast（调用方自己管条目表）。',
    ],
    a11y: [
      '区域是 ToastViewport（role=region、aria-live=polite；warn / danger 的条自己带 role=alert），名字 labels.region 由调用方传；aria-relevant 是 "additions text"：结果态换内容只是文本节点的改动，只写 additions 读屏器不会读「已恢复」。不要靠换 key 重挂来触发朗读，那会丢焦点。',
      '展开不靠指针：Tab 进叠层（:focus-visible）就展开，能 Tab 到每条的动作钮与关闭钮；动作钮读屏名就是钮上的字，关闭钮是 labels.close。',
      '键盘焦点在条里时计时暂停；关掉有焦点的一条，焦点移到相邻一条的关闭钮，关掉最后一条（或被 max 裁掉）就还给进叠层前拿着焦点的元素（照 lib/opener-focus 的思路）；点动作钮后焦点落到同一条的关闭钮，不丢。Esc 关掉焦点所在的一条。',
      'prefers-reduced-motion：不缩放、不滑、不接拖动手势，收拢只留最前面一条，只有淡入淡出。',
      '看不见的层（第 4 层以后；减弱动效下收拢的后面几层）与正在退场的条用 inert，不用 aria-hidden：里面的钮 Tab 不到，也没有「焦点在 aria-hidden 里」。Tab 进叠层落到第一个能聚焦的层，叠层随即展开、inert 撤掉。',
      '页面不可见（切走标签页）时计时自动暂停，回来接着走，「撤销」的窗口不会在没人看见时过完。',
      '滑动关只是指针手势的快捷方式，键盘与读屏用户走关闭钮与 Esc，功能不缺。',
    ],
  },
  'copy-toast': {
    aliases: ['Copy image', 'Snapshot', 'Copy to clipboard', 'Take a snapshot', '复制图', '截图'],
    use: [
      '图右上的相机钮：TradingView 截图（相机）菜单里「复制图片」同一件事；我们只给一个钮直接复制，不另起菜单，下载与直链由宿主另加。',
      '钮的位置固定：表格视图 · 导出 CSV · 复制图 · 全屏，24 × 24、图标 14px，跟另外三件同一套 .k-ck-action。',
      '图里只有图：ChartActions 一组带 data-copy-image="skip" 不进图（TradingView 的截图同样不带工具条）；标题、图例、刻度、来源行都进图。',
      '倍数取 devicePixelRatio（1–3），底色取最近一个不透明祖先的背景色（透明 PNG 贴进聊天会变黑底或白底）。',
      '剪贴板不支持（非 https、浏览器不认 image/png）或被拒：自动改成下载 <图名>.png，提示写「已改为下载」和原因；拍不出图才算失败。',
      '提示：一条 Toast，2400ms 后自己收，指针或焦点在上面时不收；再点一次是新的一条。语气 ok / warn / danger 对应已复制 / 已改为下载 / 失败。',
      '复制文字（代码、直链）用 copyText，提示同一条 CopyToast（copiedText）。',
      '接了相机钮的图（#87）：EquityCurve、QuantileLayers 与用 ChartViewProps 的几张（Ridgeline、FlowSankey、VintageSeries、UptimeBars、SymbolGalaxy、ConnectedScatter、SlopeChart、ParamScatter、MaeMfeScatter、UnderwaterChart、BrushChart）都收 onCopyImage，再给 actions 文案的 copyImage 就出钮；MarketHeatmap 的相机钮在工具条上、全屏钮前（照 TradingView 热力图的相机钮），它与全屏钮不进图。',
      '字体（#87）：图里用到的网页字体内嵌进图片（只嵌用到的族、unicode-range 碰到图里文字的那几片，取过的按地址缓存），拍出来跟页面一致；跨源样式表里的字体（读不到规则）与取失败的照旧退回系统字体。embedFonts: false 关掉。',
    ],
    avoid: [
      '要用户确认的结果（导出了什么文件）不要只靠这条提示，它会自己消失。',
      '跨源加载的字体（如 Google Fonts 的样式表）读不到规则，在图里会退回系统字体；要字形一致，字体随站点同源发布（本包的 fonts.css 就是），或宿主用服务端渲染。',
    ],
    a11y: [
      '相机钮是普通 button，读屏名与悬停提示是 labels.copyImage；复制时不禁用钮（禁用会丢焦点、挡住重试）。',
      '结果经 ToastViewport（aria-live=polite）读出，下载与失败两条自带 role=alert；每次是新插入的节点，同一句也会再读（modern-web-guidance copy-button）。',
      '语气不只靠颜色：标题就是结果，原因写在说明里。',
    ],
  },
  alert: {
    aliases: ['Banner', 'Callout', 'Inline message', 'Notice'],
    use: [
      '页面里常驻的提示、警告或错误说明。',
      '表单或区块顶部说明为什么不可用。',
      '语气 tone 是 Severity：neutral（默认，22% 白色条）· ok · warn · danger，色条与图标读 --k-status-*；旧名 tone="default" 等于 neutral（G1，2026-11-18）。',
    ],
    avoid: ['会自己消失的反馈用 toast。', '必须裁决的用 dialog。', '字段旁的错误用 field。'],
    a11y: [
      'role 按语气定：warn、danger 是 alert，neutral、ok 是 status。',
      '页面一直在的提示改传 role=note，不要反复播报。',
      '语气靠标题写明，不只靠色条。',
    ],
  },
  progress: {
    aliases: ['Progress bar', 'Linear progress', 'Loading bar', 'Meter'],
    use: [
      '上传、回测等知道进度的任务。',
      '不知道进度时用不确定条。',
      '填充色 tone 是 Severity：neutral（默认，亮中性 ink-100）· ok · warn · danger，与 Alert 同一套；轨道读 --k-container-track-background；旧名 tone="default" 等于 neutral。',
    ],
    avoid: ['库存、额度的满格用 meter。', '等待内容区加载用 skeleton。'],
    a11y: [
      'Radix Progress，role=progressbar，确定态带 aria-valuenow。',
      '不确定态不带 aria-valuenow。',
      '名字由调用方传 aria-label。',
    ],
  },
  'status-icon': {
    aliases: ['Status glyph', 'Result icon', 'Check mark', 'Feedback icon'],
    use: ['提示条、列表行里的成功、失败、警告、进行中图标。', '状态切换要有明显动作时。'],
    avoid: ['只是一个在线点用 led。', '没有文字的状态不要单放图标。'],
    a11y: [
      '传了 label 是 role=img 并读出，不传就 aria-hidden。',
      '图标旁边必须有文字。',
      'ok、warn、danger 的字形各不相同（对勾、叹号、叉），不只靠颜色。',
    ],
  },
  'ai-status': {
    aliases: ['Typing indicator', 'Thinking status', 'Agent status', 'Progress text'],
    use: [
      '一行说明 AI 在思考、检索、书写、完成或出错。',
      '长任务里显示耗时。',
      '换文字时宽度在同一帧算好交给弹簧，不先跳一帧。',
    ],
    avoid: ['有真实百分比用 progress。', '只想要状态球用 matrix-orb。', '步骤清单用 task-list。'],
    a11y: ['整行是 role=status，状态变了读屏会播报。', '图标对读屏隐藏，文字是唯一的读法；status 换了要同时换 label。'],
  },
  'web-search': {
    aliases: ['Sources', 'Citations', 'Footnote', 'Reference list'],
    use: ['回答里展示联网检索用了哪些来源。', '正文里用行内引用标出处。'],
    avoid: ['普通外链用链接。', '来源很少且不需要预览时直接写文字。'],
    a11y: [
      '药丸是按钮，用 aria-expanded 表示展开，状态在 aria-live=polite 里播报。',
      '行内引用是按钮，预览是 role=tooltip，聚焦就弹出。',
      '图标与来源小标对读屏隐藏。',
      '「还有 N 条」「收起」是虚线边的按钮，文字 ink-3 在件自己的底上过 4.5:1。',
    ],
  },
  'animated-list': {
    aliases: ['Feed', 'Activity feed', 'Live list', 'Stream'],
    use: [
      '新闻快讯、成交回报、炸板提醒这类往上顶的信息流。',
      '条目有稳定 id、会增删的列表。',
      '读的人可能停在某条上：悬停时新条目先攒着。',
    ],
    avoid: ['上千行的流用 news-feed 的虚拟滚动。', '不会变的列表不需要它。', '要给每一条打分排序的用 data-grid。'],
    a11y: [
      'ul 带读屏名，aria-live=polite，新条目被礼貌播报。',
      'onItemClick 开着时每条是按钮，读屏名取 label。',
      '攒着的条数提示是 role=status。',
    ],
  },
  'dynamic-island': {
    aliases: ['Notch', 'Pill', 'Live activity', 'Island'],
    use: ['成交回报、炸板提醒、连接状态这类「看一眼就退」的通知。', '内容大小不同、切换时想要弹性变形的场合。'],
    avoid: ['要用户处理的事用 toast 或 dialog。', '一条持续显示的状态用 led 或 status-bar。'],
    a11y: ['胶囊是 role=status、aria-live=polite，读屏名由调用方传。', '内容换了会播报新内容。'],
  },
  'grid-loader': {
    aliases: ['Spinner', 'Loading indicator', 'Pixel loader', 'Activity indicator'],
    use: ['按钮里、面板角上、AI 在想这类小的不定长等待。', '像素风的界面里替代圆形转圈。'],
    avoid: ['等一整块数据时用 skeleton 与 Loading。', '有进度时用 progress。'],
    a11y: ['role=status，读屏名取 label（必填）。', '颜色之外靠运动表达「在等」。'],
  },
  'motion-loader': {
    aliases: ['Spinner', 'Loading indicator', 'Throbber', 'Activity indicator'],
    use: ['行内与按钮里的小加载指示。', '连续运动的圆形款，与点阵款 grid-loader 二选一。'],
    avoid: ['等一整块数据时用 skeleton 与 Loading。', '有进度时用 progress。'],
    a11y: ['role=status，读屏名取 label（必填）。', '颜色取当前文字色，不单独传意。'],
  },
  'page-preloader': {
    aliases: ['Splash', 'Page transition', 'Loading screen', 'Curtain'],
    use: ['切换工作区、冷启动首屏的一次性过场。', '数据就绪后想要一个有仪式感的揭开。'],
    avoid: ['每次切页都盖会让人烦，只用一次。', '要显示真实加载状态用 skeleton 与 Loading。'],
    a11y: ['遮罩是 role=status，读屏名取 label。', '整页遮罩时锁住 body 滚动，揭开后还原。'],
  },
  'scroll-progress': {
    aliases: ['Reading progress', 'Scroll indicator', 'Progress bar', 'Scroll spy'],
    use: ['研报、新闻正文、策略报告这类长文里指示读到哪。', '想把进度放进自己顶栏时用 position=inline。'],
    avoid: ['任务做了多少用 progress。', '内容不滚动的页面不要放。'],
    a11y: ['role=progressbar，aria-valuenow 是 0 到 100。', '值经弹簧平滑，读屏取的是整数百分比。'],
  },
}

export default feedback
