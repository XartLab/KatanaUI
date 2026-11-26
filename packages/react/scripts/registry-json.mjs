// SPDX-License-Identifier: MIT
// 生成 registry.json（shadcn registry 的清单，shadcn 4.22.2 的 schema；`pnpm --filter @katana-ui/react registry:build` 先跑它再跑 `shadcn build`）。
// 清单由脚本从源码与文档站的页数据（gallery/registry.ts：每个 item 的说明读它的页）生成，不手写：每个源文件一项（文件名短横线小写就是 item 名），registryDependencies 与 npm dependencies 从 import 扫出来，不会漏。
// 约定（#1862 定）：
//   type：primitives/ → registry:ui；layout/ 的件 → registry:component、间距刻度 → registry:lib；lib/（含 lib/chart/ 与 lib/chart/format/）、katana/、patterns/、quotes/ 的纯函数 → registry:lib；patterns/、quotes/、quant/、katana/、cn/、blocks/ 的件 → registry:component；`style`（token、主题、动效）→ registry:style。
//   命名：`@katana/<文件名>`；同名冲突在源码里就不许有（每层文件名唯一，单测查）。
//   落点：每个文件的 target 保持包内的相对结构（~/src/katana/ui/<层>/<文件>），所以件之间的相对 import 与 theme.css 里的 @source 路径在别的项目里原样有效。
// 用法：node scripts/registry-json.mjs           写 registry.json
//       node scripts/registry-json.mjs --check   与已提交的比对，不一样退出 1
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const pkgDir = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const pkg = JSON.parse(readFileSync(join(pkgDir, 'package.json'), 'utf8'))
const TARGET_ROOT = '~/src/katana/ui'

/**
 * 不是组件的 item（样式入口、工具、内部拼件用的零件）的说明：文档站没有它们的页。
 * 有页的件，说明读页数据（gallery/registry.ts 的 PAGES.summary），这里不写第二份。
 */
const INTERNAL = {
  'tag-input-model':
    'TagInput 的纯逻辑：草稿与粘贴的拆分（逗号、分号、换行、制表符）、判重（不分大小写）、校验与上限，以及键盘在标签之间怎么走。',
  'delayed-flag':
    '「晚出、出了就留够」的旗子：等了 delay 才出、出了至少留 min（Button 的 pending 与 Loading 的骨架共用），以及图标停在整圈上的 useSpinWholeTurns。',
  'scaled-decimal':
    '盘口三件（订单簿、深度图、成交明细）共用的十进制整数运算：价格与数量按小数位乘成整数再加减比，不经浮点累加。',
  'research-color':
    '研究报告件共用的色阶：涨跌发散色（零附近中性灰）与顺序色，周期收益表与参数曲面热力图用，只引用 token。',
  'order-ticket-parts':
    'OrderTicket 与 PositionCalculator 共用的小件：买卖切换、带标签与单位的数字框、读数行、数字格式。',
  'arcade-pixel-sprites': 'ArcadePixel 的数据：5x7 点阵字形、现成精灵与把文字排成格子的纯函数。',
  'arcade-pixel-paint': 'ArcadePixel 的画法：把调色板里的 var(--token) 读成颜色、画一帧（亮点、荧光、熄灭的点阵）。',
  'sparkline-ascii': 'Sparkline 的 ascii 画风：方块或盲文字形画走势，一个 pre，新列乱码落定。',
  'sparkline-instrument': 'Sparkline 的 instrument 画风：点阵、对位角标、投影谱、极值十字与批注、档案编号与 SOURCES。',
  'sparkline-shared': 'Sparkline 各画风共用的钩子：量容器、设备像素比、文字测量重置。',
  'cascade-model':
    '级联菜单的时间与几何（#250）：打开 220ms、安全窗口 1200ms、关闭 360ms 等具名常量，安全三角（三条边叉积同号）与保护带的纯函数。',
  'cascade-controller':
    '级联菜单的悬停控制器（#250）：在父菜单 Content 的捕获阶段接管子菜单的悬停开合、安全三角、1.2s 安全窗口与 360ms 关闭延时；下拉菜单与右键菜单共用。',
  'truncation-title':
    '真被截断时悬停出全文：installTruncationTitles() 装一个委托监听，只给真放不下的省略号文字补 title（#250）。',
  'flash-price': '最新价只闪变了的尾数（照 TradingView 自选栏）：Watchlist 与 QuoteTable 的价格格共用。',
  'cell-type':
    '表格的格内排版（#92）：代码芯片 CodeChip、全称 CodeName、单位小字 UnitValue、按 locale 缩写的 CompactValue；DataGrid、QuoteTable、Watchlist、LimitLadder、EventCalendar 共用，样式在 theme/cell-type.css。',
  'readout-value': '读数壳里的数值一格：没有数据写「—」，变了闪涨跌色或滚轮，单位小字；MetricCard 的卡与瓦片共用。',
  'metric-tile': 'MetricCard variant="tile" 的瓦片本体（原 SparkTile 的画法）与它的几何 sparkTileShape。',
  'gravity-model':
    'GravityLetters 的纯物理：掉落（重力、地面与墙的反弹、摩擦、静止判定）与回位（弹簧把每个字拉回原位）。',
  split: '文字动效共用的切分：按字、词（Intl.Segmenter，中文按词）、行切成片段，保留空白。',
  'agent-avatar-model': 'AgentAvatar 的纯逻辑：名字取首字、按 id 稳定取色调、状态到光环的映射。',
  'ai-context-model': 'AiContextMeter 的纯逻辑：用量比例、80% 琥珀与 95% 红的分档、数字缩写。',
  'ai-core': 'AI 件共用的状态名（与 MatrixOrb 的 OrbState 同一组）与各态动效参数、语义色。',
  'ai-diff-model': 'AiDiff 的纯逻辑：前后两版逐行比对出增删与上下文行。',
  'ai-prompt-model': 'AiPromptInput 的纯逻辑：回车发送与输入法选词判断、字数上限。',
  'ai-response-model': 'AiResponse 的纯逻辑：按 Intl.Segmenter 切词（中文一词一词进场）与 [n] 引用切分。',
  'ai-task-model': 'AiTaskList 的纯逻辑：计划与子步骤的状态汇总、进度。',
  'fine-pointer': '判断是否精细指针（鼠标、触控板）的钩子，倾斜卡、玻璃卡、光斑卡这类跟手装饰件用，触屏上不开。',
  'cn-session':
    'A 股件包的时段轴（纯函数）：09:15–09:25 竞价、09:30–11:30、13:00–15:00，午休不占宽度；时刻解析、时段归类。',
  'cn-format':
    'A 股件包的金额写法 formatCnAmount（万 / 亿），从 quant-format 再导出（#158：compact 在中文下也用它，源码挪到下层）。',
  'cn-labels': 'A 股件包的文案结构与随包的简体中文默认（cnLabelsZh），可整份换。',
  'cn-value': 'A 股件包的「取不到写 —」读数写法：数或 { value, reason }。',
  'cn-badge-model':
    'StreakBadge、LimitStatus、BoardMark 与 DataGrid 的 streak / limitStatus 列共用的纯函数：连板写法与排序、涨停状态、板块判断。',
  style: '设计 token（Console 与 Graphite 两个主题、红涨绿跌切换）、Tailwind v4 主题与动效 CSS。ui.css 最后引。',
  cn: 'shadcn-ui/cn 引擎（替 clsx 加 tailwind-merge），认得 k-text-* 字号档。',
  focus: '各控件共用的焦点环类名。',
  tone: '涨跌三态 Tone（up / down / flat）的唯一定义与 --k-tone-* 取色；QuoteTone、EconomicTone 是它的旧名。',
  severity:
    '状态语气 Severity（neutral / ok / warn / danger，加 off / accent 为 SeverityExt）、ledOf 映射到状态灯、--k-status-* 取色。',
  num: '数字小工具：clamp、pad（补零）、signed（带正负号）、extent（最低最高）、pct（百分比字符串）。',
  date: '日期与钟点的文字：UTC 的 YYYY-MM-DD、时区里的日期键、HH:MM、M:SS。',
  'font-catalog':
    '字体目录（纯数据与函数）：界面、汉字、数据字、代码四个角色可选的系统、开源、本机字体，与选择算出的字体变量。RenderingSettings 用。',
  motion: '三条弹簧参数（snappy、gentle、settle），给 motion/react 用。',
  'motion-shared':
    '过场、背景、特效、媒体共用的小工具：DPR 封顶、CSS 颜色解析成画布能用的数值、离屏与标签页隐藏时暂停的钩子。',
  spring: '把三条弹簧的停止阈值收到 0.001，给 scale、opacity、pathLength 这类 0 到 1 的量用。',
  'series-geometry':
    '序列图共用的几何（纯函数）：好看的刻度、比例尺、折线与面积路径，BrushChart、HorizonChart、SmallMultiples、SeriesExplorer 都用。',
  'brush-model': 'BrushChart 与 SeriesExplorer 共用的刷选窗口几何（纯函数，lib/chart）：夹取、平移、缩放、居中。',
  'event-calendar-model': 'EventCalendar 的纯函数：按显示时区分天、今天 / 本周 / 下周区间、筛选、倒计时分钟。',
  'attribution-model':
    'AttributionBars 的排序与折叠（纯函数）：正负分组降序、超 7 项折「其他 ×n」、费用·税放底、对称刻度。',
  'symbol-overview-model':
    'SymbolOverview 的纯逻辑：相对起点的百分比口径、按时刻摆的横坐标、二分找最近的点、几条序列合起来的时间范围。',
  'cross-rates-model': 'CrossRates 的纯逻辑：报价摆成货币矩阵、汇率的默认位数、方向键在格子间怎么走（照 APG grid）。',
  'equity-curve-model': 'EquityCurve 的纯逻辑：按时刻摆的横轴、线性 / 对数纵轴、镜像回撤的纵轴、默认横轴刻度。',
  'chart-kit':
    '图表共用底座：配色分配（series / seq / div）、点阵纹理、LCD tooltip、末点、轴与网格、图右上三件（表格视图、导出、全屏）。',
  'market-heatmap-types': 'MarketHeatmap 的公开类型：格子数据、大小与着色指标、文案、属性。',
  'market-heatmap-toolbar':
    'MarketHeatmap 的工具条：数据集、大小、颜色、分组（下拉或分段），全屏，显示开关，「在选股器打开」。',
  'market-heatmap-cell':
    'MarketHeatmap 的一格：按格子真实像素分四档写字（徽标 + 代码 + 读数 / 代码 + 读数 / 只有徽标 / 只有色块）。',
  'market-heatmap-card': 'MarketHeatmap 的悬停卡片：跟着鼠标，写价格、各着色指标、大小指标与分组，不伸出图外。',
  'market-heatmap-legend': 'MarketHeatmap 的图例：七档色块与值边界，悬停预览、点一档隐藏。',
  'market-heatmap-hooks':
    'MarketHeatmap 的副作用钩子：量绘图区尺寸、放大返回的焦点、按底色现算字色、格子位置的弹簧过渡、涨跌翻向时闪一下。',
  'event-calendar-types': 'EventCalendar 的公开类型：四类事件的行、文案（labels）、财报行下的链接、属性。',
  'event-calendar-cells': 'EventCalendar 的表格部分：四个类别的列集、一行的单元格、重要程度格条、经济事件的详情行。',
  'event-calendar-regions':
    'EventCalendar 的国家选择：触发按钮加模态框（搜索、两个预设、按地区分组复选、取消 / 应用）。',
  'market-heatmap-model':
    'MarketHeatmap 的纯函数：色阶七档的档宽取好数、值落在哪一档、图例的值边界、方向键找邻居的格子。',
  'theme-heat-model':
    'ThemeHeatMatrix 的数据形状、五档档位（与 CalendarHeatmap 换手视图同一条规则）与键盘走格（纯函数）。',
  'calendar-model': 'CalendarHeatmap 的格子排布、档位与键盘（纯函数）：日历日按 UTC 算，一周一列。',
  'horizon-model': 'HorizonChart 的分带（纯函数）：把带正负的一列数折成几条叠起来的窄带。',
  'live-line':
    '走势线新点追加时的延伸过场（钩子加纯函数）：旧线各点平滑走到新位置，新点从末端长出来，Sparkline、SparkTile、EquityCurve 用。',
  'live-readout':
    '读数变了闪涨跌色的外壳与取数：从已格式化的文字里取开头的数，走 live 的 useValueFlash。MetricCard、QuoteCard、PriceTag、KeyStats、Lcd、StatusBar 用。',
  'scroll-dismiss': '非模态浮层的滚动即关：页面或装着锚点的容器把锚点滚走了就关（Popover 用）。',
  'hover-intent': '悬停意图：停一会儿才开、离开等一会儿再收、键盘聚焦立即开的钩子。',
  'code-highlight': 'CodeBlock 用的小型词法切分：注释、字符串、数字、关键字、函数、标点（纯函数，不加依赖）。',
  'matrix-orb-model': 'MatrixOrb 的纯数学：某状态下圆盘上一点在某一时刻的亮度。',
  'step-player-model': 'StepPlayer 的纯逻辑：一步放完后是前进、循环还是结束。',
  overlay: '浮层内容的 Portal 包装：平时挂到 body，包在 InlineOverlays 里时原地渲染（静态预览用）。',
  'hover-open': '悬停打开弹层、延迟关闭的钩子。',
  'menu-any': '同一份菜单内容既能下拉又能右键时，按种类挑对应的零件。',
  'menu-kind': '告诉菜单零件自己在哪一种菜单里的上下文。',
  'menu-parts': '菜单共用的容器、行、分隔线与勾选列样式。',
  'tone-text': 'ChangeText 与 PnlText 共用的底：方向到颜色与箭头。',
  'date-time-model': 'DateTimeInput 的解析与格式化（纯函数）。',
  'number-field-model': 'NumberInput 的解析与取整（纯函数）。',
  'sparkline-model':
    'Sparkline 的几何（纯函数）：断点分段、刻度、设备像素对齐、单调曲线、基准切分、最高最低、标签放左放右、悬停取点。',
  'number-expression': 'NumberInput 的算式输入：+10%、*2、100*1.5 按当前值算（纯函数，不用 eval）。',
  'shortcut-model': 'ShortcutRecorder 的规则：一次按键变成规范组合串（修饰键次序、物理键）。',
  'date-range-model': 'DateRangePicker 的预设规则：今天、本周、本月、年初至今（截至今天）与区间认预设（纯函数）。',
  'json-viewer-model': 'JsonViewer 的数据模型：把任意值建成带稳定 id 的节点树，查找命中与要展开的祖先（纯函数）。',
  'hold-model': 'HoldToConfirm 的进度规则：按住填满、松手退回的时长与每帧推进（纯函数）。',
  'duration-picker-model': 'DurationPicker 的输入规则：框里的字与数互转，空当 0，超上限夹住并标记要抖一下（纯函数）。',
  'password-input-model': 'PasswordInput 的眼睛轮廓：睁开程度 0..1 到 SVG 路径（纯函数）。',
  'task-list-model': 'TaskList 的任务形状与次序：没完成的保持原位，划完的按沉下去的先后排到底部（纯函数）。',
  'theme-selector-model': 'ThemeSelector 的键盘规则：方向键与 Home / End 移到哪一张，到头循环（纯函数）。',
  'loading-gate': 'Loading 的计时与行数量取（纯函数）。',
  'opener-focus': '对话框与抽屉共用：关闭后把焦点还给打开前拿着它的元素。',
  label: 'Radix Label，Field 用它做标签（文档站在 field 页）。',
  'chart-scale':
    '分布与关系类的图（Ridgeline、SlopeChart、ConnectedScatter）共用的纯函数：线性比例尺、好看的刻度、分位数。',
  'loading-wait': 'Loading 的计时外壳：500ms、2s、10s 三个阶段。',
  space: '排版原语共用：间距刻度名（对应 tokens 的 space-*）、它们的 CSS 值，与原语可以渲染成的元素。',
}

const read = (rel) => readFileSync(join(pkgDir, rel), 'utf8')
const listDir = (rel) => (existsSync(join(pkgDir, rel)) ? readdirSync(join(pkgDir, rel)).sort(compare) : [])
function compare(a, b) {
  return a < b ? -1 : a > b ? 1 : 0
}

/** 源文件 → item 的描述（不含依赖）。 */
function collectItems() {
  const items = []
  const add = (name, type, files, extra = {}) => items.push({ name, type, files, ...extra })
  const isCode = (f) => /\.(?:tsx?|json)$/.test(f) && !/\.test\./.test(f)
  const byFile = (dir, type, filter = isCode) =>
    listDir(dir)
      .filter((f) => filter(f) && !f.endsWith('.json'))
      .forEach((f) => add(f.replace(/\.[^.]+$/, ''), type, [`${dir}/${f}`]))

  add(
    'style',
    'registry:style',
    [
      'src/ui.css',
      'src/tokens.css',
      'src/theme/theme.css',
      ...listDir('src/theme')
        .filter((f) => f.endsWith('.css') && f !== 'theme.css')
        .map((f) => `src/theme/${f}`),
    ],
    {
      fileType: 'registry:file',
      extraDependencies: [
        `tailwindcss@${pkg.dependencies.tailwindcss}`,
        `@katana-ui/tokens@${pkg.peerDependencies['@katana-ui/tokens']}`,
      ],
    },
  )
  for (const f of listDir('src/lib').filter((f) => /\.tsx?$/.test(f) && !/\.test\./.test(f))) {
    const name = f.replace(/\.tsx?$/, '')
    add(name, 'registry:lib', [`src/lib/${f}`])
  }
  // lib/chart/：图表共用底座（G5 从 quant 下沉，blocks 与 quant 都用）。比例尺、几何、刷选窗口一文件一项；
  // chart-kit/（带 JSX 的零件与配色）合成一项；format/（价格、涨跌幅、数量的纯函数）合成 quant-format 一项。
  for (const f of listDir('src/lib/chart').filter((f) => /\.tsx?$/.test(f) && !/\.test\./.test(f)))
    add(f.replace(/\.tsx?$/, ''), 'registry:lib', [`src/lib/chart/${f}`])
  add(
    'chart-kit',
    'registry:component',
    listDir('src/lib/chart/chart-kit')
      .filter((f) => /\.tsx?$/.test(f) && !/\.test\./.test(f))
      .map((f) => `src/lib/chart/chart-kit/${f}`),
  )
  add(
    'quant-format',
    'registry:lib',
    listDir('src/lib/chart/format')
      .filter((f) => f.endsWith('.ts') && !/\.test\./.test(f))
      .map((f) => `src/lib/chart/format/${f}`),
  )
  byFile('src/primitives', 'registry:ui')
  // layout/：排版原语（#115）与分量。带 JSX 的是 component，间距刻度（纯函数与类型）是 lib。
  for (const f of listDir('src/layout').filter(isCode)) {
    add(f.replace(/\.[^.]+$/, ''), f.endsWith('.tsx') ? 'registry:component' : 'registry:lib', [`src/layout/${f}`])
  }
  // katana/ 自有的件：带 JSX 的是 component，纯函数（解析、计时）是 lib。
  for (const f of listDir('src/katana').filter(isCode)) {
    add(f.replace(/\.[^.]+$/, ''), f.endsWith('.tsx') ? 'registry:component' : 'registry:lib', [`src/katana/${f}`])
  }
  // patterns/ 同 katana/：带 JSX 的是 component，纯函数（模型、目录数据）是 lib。
  for (const f of listDir('src/patterns').filter(isCode)) {
    add(f.replace(/\.[^.]+$/, ''), f.endsWith('.tsx') ? 'registry:component' : 'registry:lib', [`src/patterns/${f}`])
  }
  // quotes/：行情套件（G4 从 katana、quant、patterns 收拢）：带 JSX 的是 component，纯函数（模型、涨跌三态）是 lib。
  for (const f of listDir('src/quotes').filter((f) => isCode(f) && f !== 'index.ts'))
    add(f.replace(/\.[^.]+$/, ''), f.endsWith('.tsx') ? 'registry:component' : 'registry:lib', [`src/quotes/${f}`])
  // AI 对话类件（改自 SmoothUI）：一文件一项，带 JSX 的是 component，纯函数（切词、计数、种子散列）与状态约定是 lib。
  for (const f of listDir('src/ai').filter(isCode))
    add(f.replace(/\.[^.]+$/, ''), f.endsWith('.tsx') ? 'registry:component' : 'registry:lib', [`src/ai/${f}`])
  // 文字动效（改自 SmoothUI）：一文件一项，带 JSX 的是 component，纯函数（切分、物理）是 lib。
  for (const f of listDir('src/motion/text').filter(isCode))
    add(f.replace(/\.[^.]+$/, ''), f.endsWith('.tsx') ? 'registry:component' : 'registry:lib', [`src/motion/text/${f}`])
  // 过场、背景、特效、媒体（改自 SmoothUI）：共用的 shared.ts 一项；着色器过场的引擎（shader-reveal/ 子目录）合成一项，其余一文件一项。
  add('motion-shared', 'registry:lib', ['src/motion/shared.ts'])
  add(
    'shader-reveal',
    'registry:component',
    listDir('src/motion/transition/shader-reveal')
      .filter(isCode)
      .map((f) => `src/motion/transition/shader-reveal/${f}`),
  )
  for (const dir of ['transition', 'background', 'effect', 'media', 'icon', 'surface'])
    for (const f of listDir(`src/motion/${dir}`).filter((f) => isCode(f) && f.endsWith('.tsx')))
      add(f.replace(/\.[^.]+$/, ''), 'registry:component', [`src/motion/${dir}/${f}`])
  if (existsSync(join(pkgDir, 'src/quant'))) {
    byFile('src/quant', 'registry:component', (f) => isCode(f) && f !== 'index.ts')
  }
  // cn/：A 股件包（#110）。带 JSX 的是 component，纯函数（金额、时段、模型、文案）是 lib；文件名加 cn- 前缀避开别的层。
  if (existsSync(join(pkgDir, 'src/cn'))) {
    for (const f of listDir('src/cn').filter((f) => isCode(f) && f !== 'index.ts')) {
      add(`cn-${f.replace(/\.[^.]+$/, '')}`, f.endsWith('.tsx') ? 'registry:component' : 'registry:lib', [
        `src/cn/${f}`,
      ])
    }
  }
  // blocks/：拼面板用的积木（#1869）。数据表与工具条各自一个子目录合成一项，空态、估算标记一文件一项。
  if (existsSync(join(pkgDir, 'src/blocks'))) {
    const codeIn = (dir) => listDir(dir).filter((f) => /\.tsx?$/.test(f) && !/\.test\./.test(f))
    add(
      'data-grid',
      'registry:component',
      codeIn('src/blocks/data-grid')
        .filter((f) => f !== 'column-set-tabs.tsx' && f !== 'grid-summary-row.tsx')
        .map((f) => `src/blocks/data-grid/${f}`),
    )
    // 列集标签行有自己的文档页，页的说明要有归属：单独一项，依赖 data-grid（引它的模型）。
    add('column-set-tabs', 'registry:component', ['src/blocks/data-grid/column-set-tabs.tsx'])
    // 表尾合计行也有自己的页（#77），同样单独一项。
    add('grid-summary-row', 'registry:component', ['src/blocks/data-grid/grid-summary-row.tsx'])
    add(
      'toolbar',
      'registry:component',
      codeIn('src/blocks/toolbar').map((f) => `src/blocks/toolbar/${f}`),
    )
    add(
      'series-explorer',
      'registry:component',
      codeIn('src/blocks/series-explorer').map((f) => `src/blocks/series-explorer/${f}`),
    )
    add(
      'attribution-bars',
      'registry:component',
      codeIn('src/blocks/attribution-bars').map((f) => `src/blocks/attribution-bars/${f}`),
    )
    add(
      'symbol-galaxy',
      'registry:component',
      codeIn('src/blocks/symbol-galaxy').map((f) => `src/blocks/symbol-galaxy/${f}`),
    )
    // 面板壳、状态栏、工作区标签（#1901）：各一个子目录，文件合成一项（组件与它的纯函数一起装）。
    for (const dir of [
      'panel-frame',
      'status-bar',
      'workspace-tabs',
      'news-feed',
      'decision-queue',
      'hypothesis-ledger',
      'system-monitor',
      'strategy-report',
      'transmission-chain',
      // G6：事件时间线挪进子目录；仪表、必要条件块、状态带、订单流仪表、可用条从 src/quant 挪来（体检 §2）。
      'event-timeline',
      'meter',
      'consensus-block',
      'regime-strip',
      'flow-gauges',
      'uptime-bars',
      // #77：品种搜索（组件与纯函数一起装）。
      'symbol-search',
      // 面板页签组与添加组件的目录（2026-11-19）。
      'panel-tabs',
      'component-catalog',
      // #11 A 股面板：情绪周期、涨停原因分组、板块强度、龙虎榜净买，各一个子目录（组件与它的纯函数一起装）。
      'sentiment-cycle',
      'reason-group-list',
      'board-strength-rank',
      'net-buy-bar',
      // #104 账户四件：各一个子目录（组件与它的纯函数一起装）。
      'positions-table',
      'orders-table',
      'account-equity',
      'funding-rate',
      // #245 交易数据看板：六张卡、画法与纯函数在一个子目录里。
      'derivatives',
      'options-chain',
      // #104 盘口三件：订单簿、深度图、成交明细，各一个子目录（组件与它的纯函数一起装；深度图用订单簿的档位合并）。
      'order-book',
      'depth-chart',
      'trade-tape',
      // 白板（#51）：组件、节点与边、纯函数合成一项。
      'whiteboard',
      // #121：前向测试与回放的件，各一个子目录。
      'portfolio-run-grid',
      'replay-transport',
      'run-mode-badge',
      // KATANAview #1908：参照 affectUI 补的数据处理件，各一个子目录（组件与它的纯函数一起装）。
      'root-cause-tree',
      'trace-waterfall',
      'fallback-chain',
      'rate-limit-planner',
      'scheduled-runs',
      'agent-queue',
      'cost-waterfall',
      'flow-builder',
      'agent-tree',
      'agent-fleet',
      'agent-crew',
    ])
      add(
        dir,
        'registry:component',
        codeIn(`src/blocks/${dir}`)
          .filter((f) => !(dir === 'news-feed' && f === 'news-reader.tsx'))
          .map((f) => `src/blocks/${dir}/${f}`),
      )
    // 阅读窗有自己的文档页，页的说明要有归属：单独一项。
    add('news-reader', 'registry:component', ['src/blocks/news-feed/news-reader.tsx'])
    byFile('src/blocks', 'registry:component', (f) => isCode(f) && f !== 'index.ts')
  }
  return items
}

/** 页数据（文档站的 PAGES）：说明与「哪一页覆盖哪些出口」只写在那里。node 直接载入 .ts（registry.ts 只有类型与常量，没有引入）。 */
async function loadPages() {
  const { PAGES } = await import(pathToFileURL(join(pkgDir, 'gallery/registry.ts')).href)
  return PAGES
}

/** 某个源文件里声明了（或转出了）这个名字吗。 */
const declares = (source, name) =>
  new RegExp(`export\\s+(?:default\\s+)?(?:async\\s+)?(?:function|const|class|type|interface|let)\\s+${name}\\b`).test(
    source,
  ) || new RegExp(`export\\s*(?:type\\s*)?\\{[^}]*\\b${name}\\b[^}]*\\}`).test(source)

const IMPORT = /(?:from|import)\s+['"]([^'"]+)['"]/g

export async function buildRegistry() {
  const items = collectItems()
  const pages = await loadPages()
  const owner = new Map() // 文件 → item 名
  for (const item of items) for (const f of item.files) owner.set(f, item.name)
  const names = items.map((i) => i.name)
  const dup = names.filter((n, i) => names.indexOf(n) !== i)
  if (dup.length) throw new Error(`registry：item 名重复 ${dup.join('、')}（每层文件名要唯一）`)

  // 每页归到声明它第一个出口的那个 item；每页都要有归属，页上写的出口都要找得到。
  const pageOf = new Map() // item 名 → 页
  for (const page of pages) {
    for (const name of page.exports) {
      const hit = items.find((item) =>
        item.files.some((f) => /\.tsx?$/.test(f) && !f.endsWith('/index.ts') && declares(read(f), name)),
      )
      if (!hit) throw new Error(`registry：文档页 ${page.id} 的出口 ${name} 在源码里找不到声明`)
      if (!pageOf.has(hit.name)) pageOf.set(hit.name, page)
    }
  }

  const out = items.map((item) => {
    const npm = new Set(item.extraDependencies ?? [])
    const deps = new Set()
    const types = new Set()
    for (const file of item.files) {
      if (!/\.tsx?$/.test(file)) continue
      for (const [, spec] of read(file).matchAll(IMPORT)) {
        if (spec.startsWith('.')) {
          const base = relative(pkgDir, resolve(pkgDir, dirname(file), spec))
            .split('\\')
            .join('/')
          const hit = [base, `${base}.ts`, `${base}.tsx`, `${base}.json`, `${base}/index.ts`].find((c) => owner.has(c))
          if (!hit) throw new Error(`registry：${file} 引入 ${spec}，找不到属于哪个 item`)
          if (owner.get(hit) !== item.name) deps.add(owner.get(hit))
        } else if (!spec.startsWith('node:')) {
          const bare = spec.startsWith('@') ? spec.split('/').slice(0, 2).join('/') : spec.split('/')[0]
          if (bare === 'react' || bare === 'react-dom') continue
          const version =
            pkg.dependencies[bare] ?? (bare.startsWith('@katana-ui/') ? pkg.peerDependencies[bare] : undefined)
          if (!version) throw new Error(`registry：${file} 引入 ${bare}，但 package.json 的 dependencies 里没有`)
          npm.add(`${bare}@${version}`)
          // 类型包（DefinitelyTyped：@scope/name → @types/scope__name）在 devDependencies 里就跟着写进 item，
          // 否则别的项目装完件 tsc 找不到类型（#1890 treemap 的 d3-hierarchy）。
          const typesName = `@types/${bare.startsWith('@') ? bare.slice(1).replace('/', '__') : bare}`
          const typesVersion = pkg.devDependencies?.[typesName]
          if (typesVersion) types.add(`${typesName}@${typesVersion}`)
        }
      }
    }
    const description = pageOf.get(item.name)?.summary ?? INTERNAL[item.name]
    if (!description)
      throw new Error(
        `registry：${item.name} 没有说明：文档站没有覆盖它的页，也不在 scripts/registry-json.mjs 的 INTERNAL 里`,
      )
    return {
      name: item.name,
      type: item.type,
      title: item.name
        .split('-')
        .map((w) => w[0].toUpperCase() + w.slice(1))
        .join(' '),
      description,
      ...(npm.size ? { dependencies: [...npm].sort(compare) } : {}),
      ...(types.size ? { devDependencies: [...types].sort(compare) } : {}),
      ...(deps.size ? { registryDependencies: [...deps].sort(compare).map((n) => `@katana/${n}`) } : {}),
      files: item.files.map((path) => ({
        path,
        type: item.fileType ?? item.type,
        target: `${TARGET_ROOT}/${path.replace(/^src\//, '')}`,
      })),
    }
  })
  return {
    $schema: 'https://ui.shadcn.com/schema/registry.json',
    name: 'katana',
    homepage: 'https://github.com/XartLab/KatanaUI/tree/main/packages/react',
    items: out,
  }
}

export const registryText = async () => `${JSON.stringify(await buildRegistry(), null, 2)}\n`

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const text = await registryText()
  const file = join(pkgDir, 'registry.json')
  if (process.argv.includes('--check')) {
    if (!existsSync(file) || readFileSync(file, 'utf8') !== text) {
      console.error('registry.json 与源码对不上，跑 pnpm --filter @katana-ui/react registry:build')
      process.exit(1)
    }
    console.log('registry.json 与源码一致')
  } else {
    writeFileSync(file, text)
    console.log(`registry.json 已生成（${JSON.parse(text).items.length} 项）`)
  }
}
