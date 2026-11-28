// SPDX-License-Identifier: MIT
// 表单控件组的「怎么用 / 无障碍」（照 Salt 组件页）。
import type { GuidanceMap } from './types'

const forms: GuidanceMap = {
  button: {
    aliases: ['Action', '操作按钮', 'Button (Salt / MUI)'],
    use: [
      '下单面板、对话框底部的确认与取消。',
      '工具条上带图标的单点操作（icon 变体）。',
      '表单提交，一个区域只放一个主按钮。',
      '尺寸只有 sm（26 高）与 md（30 高，默认）；size="icon" 是 28 的正方形，给只有图标的按钮。旧名 size="default" 等于 md，留一个版本（G1，2026-11-18）。',
      '颜色只读 characteristics（--k-actionable-*），是所有件迁移 token 的模板。',
      '按钮等一次请求（约 0.3 到 3 秒）用 pending：在按钮原地说，字与宽度不变；pending 满 300ms 才出转圈、出了至少留 500ms（useDelayedFlag，数值在 lib/delayed-flag.ts：PENDING_DELAY_MS、PENDING_MIN_MS），300ms 内结束的不出；不灰整页，不再叠别的加载指示。出处：kubai Vibe Design Tips 017。',
      '按钮自己的图标就是动作（刷新、同步）：加 spinIcon，按下立刻转那颗图标（不等 300ms、不另出转圈），至少转一整圈（640ms），停在整圈上。',
      '进行中的结果由调用方说：成功、失败用 toast 或行内状态（Button 不管），失败要用户处理的事留在原处并给重试。',
    ],
    avoid: ['不可撤销的动作（全平、全撤）改用 HoldToConfirm。', '只在两三个选项里切换，用 ToggleGroup。'],
    a11y: [
      '原生 button，读屏名取按钮文字；纯图标按钮必须传 aria-label。',
      '禁用走 disabled 属性，读屏读作「不可用」，同时降到 45% 不透明度。',
      '进行中（pending）：aria-busy=true，再按无效（aria-disabled 加吞掉点击，Enter 与空格也一样），不用 disabled 属性，所以键盘与读屏仍能到按钮、焦点不丢；不降不透明度；完成或失败由调用方经 toast 或行内状态播报。asChild 时没有转圈，只有 aria 与吞掉传给 Button 的 onClick。',
      '键盘聚焦画 focus-ring 外框，鼠标点击不画。',
    ],
  },
  input: {
    aliases: ['Text field', 'Input (Salt / Radix)', '文本框'],
    use: [
      '填代码、名称、备注这类单行文字。',
      '放进 Field 里，由 Field 接好标签与错误。',
      '尺寸 sm（26 高，字 12）与 md（30 高，默认）；旧名 size="default" 等于 md。底、边、聚焦边读 --k-editable-*（4% 白底、8% 白边、聚焦 22% 白边）。',
    ],
    avoid: ['只收数字、要步进或单位时用 NumberInput。', '收密钥用 PasswordInput。', '几行以上的文字不是这个件。'],
    a11y: [
      '原生 input，读屏名来自关联的 Label（Field 自动接）或自己传的 aria-label。',
      'aria-invalid 为真时边框变危险色，同时读屏读作「无效」。',
      '禁用走 disabled 属性；说明与错误通过 aria-describedby 读出。',
    ],
  },
  select: {
    aliases: ['Dropdown', 'Select (Salt / MUI / Radix)', '下拉菜单', 'Symbol 周期选择'],
    use: ['从五个以上的固定选项里选一个，如周期、账户、订单类型。', '空间窄，放不下一排按钮的工具条里。'],
    avoid: ['选项很多且要搜索用 Combobox。', '要选多个用 MultiSelect。', '两三个选项用 ToggleGroup。'],
    a11y: [
      '基于 Radix Select：触发器 role=combobox，列表 role=listbox，每项 role=option。',
      '读屏名来自触发器上的 aria-label 或关联的 Label。',
      '当前项在列表里加粗并带勾，不只靠颜色。',
      '禁用的触发器与单项读作「不可用」。',
    ],
  },
  'multi-select': {
    aliases: ['Multi-select dropdown', 'MultiSelect (Salt)', 'Autocomplete multiple (MUI)'],
    use: ['筛选器里选多个市场、板块、标签。', '选项在十来个以内，不需要搜索。'],
    avoid: [
      '只选一个用 Select。',
      '选项几十个以上并要搜索用 Combobox（多选模式）。',
      '选项很少且想一眼看全用 ChipGroup。',
    ],
    a11y: [
      '触发器 role=combobox，带 aria-expanded 与 aria-haspopup=listbox。',
      '弹层 role=listbox 且 aria-multiselectable，每项 role=option、aria-selected 表示是否已选。',
      '读屏名取 label 属性，同时给触发器与列表。',
    ],
  },
  checkbox: {
    aliases: ['Checkbox (Salt / MUI / Radix)', '复选框', '勾选框'],
    use: ['设置页里独立的开关式选项，如「启用声音提醒」。', '多条记录里批量勾选。', '同意条款这类需要显式确认的项。'],
    avoid: ['立即生效的开关用 Switch。', '互斥的几项用 ToggleGroup。'],
    a11y: [
      'UI SDK Checkbox：role=checkbox，状态在 aria-checked，读屏读「已选中 / 未选中」。',
      '读屏名来自旁边关联的 Label，没有文字时必须传 aria-label。',
      '选中画的是一块方块（或描边的勾），状态同时由 aria-checked 传达，不只靠颜色；半选是 aria-checked=mixed。',
      'aria-invalid 时边框变危险色。',
    ],
  },
  textarea: {
    aliases: ['Textarea (Salt / MUI / Radix)', 'Multiline text field', '多行文本框', '备注框'],
    use: ['下单备注、策略说明、决策理由这类几行的文字。', '放进 Field 里，由 Field 接好标签与错误。'],
    avoid: ['单行文字用 Input。', '要代码高亮或富文本不是这个件。'],
    a11y: [
      '原生 textarea，读屏名来自关联的 Label 或 aria-label。',
      'aria-invalid 为真时边框变危险色，同时读屏读作「无效」。',
    ],
  },
  'radio-group': {
    aliases: ['Radio buttons (Salt / MUI / Radix)', '单选按钮', '单选组'],
    use: ['委托类型、买卖方向这类三五个互斥选项，要一眼看全。', '选项带说明文字时，逐行排开。'],
    avoid: ['选项超过五个换 Select。', '工具条里两三个切换用 ToggleGroup。', '独立的开与关用 Switch 或 Checkbox。'],
    a11y: [
      'UI SDK Radio：组 role=radiogroup，每项 role=radio，状态在 aria-checked。',
      '组的读屏名用 aria-label；每项的名字来自旁边的 Label，没有文字时传 aria-label。',
      '方向键移动并选中，Tab 只停在选中项上；选中同时有点的形状变化，不只靠颜色。',
    ],
  },
  toggle: {
    aliases: ['Toggle button (Radix)', 'Pressed button', 'Toggle (Salt)', '开关按钮'],
    use: ['图表工具条里「显示均线」「跟随最新」这类单个开关。', '带图标的单个开关（icon 尺寸）。'],
    avoid: ['互斥的几项用 ToggleGroup。', '设置页里的开关用 Switch。', '一次性动作用 Button。'],
    a11y: [
      '原生 button，状态在 aria-pressed，读屏读「已按下 / 未按下」。',
      '纯图标必须传 aria-label，名字不随状态变。',
    ],
  },
  'checkbox-group': {
    aliases: ['Checkbox group (Salt / MUI / Radix)', '复选框组', '全选'],
    use: ['筛选里选多个市场、板块，要一眼看全。', '要「全选」父项时，部分选中显示半选。'],
    avoid: ['选项很多或要搜索用 MultiSelect。', '单个确认项直接用 Checkbox。'],
    a11y: [
      '组 role=group，名字用 aria-label；每项是 Checkbox，文字用 label 关联，点文字也能勾。',
      '父项半选时 aria-checked=mixed，读屏读「部分选中」。',
    ],
  },
  'input-group': {
    aliases: ['Input group (Salt / Bootstrap)', 'Input with addon', '输入框附件'],
    use: ['限价、数量这类带币种符号、单位、「全仓」按钮的输入。', '前后要放图标时。'],
    avoid: ['只要一个单位后缀的数字框用 NumberInput。', '附件多到比输入框还宽时拆成两行。'],
    a11y: [
      '外框 role=group；里面的 Input 照常带 aria-label 或 Label。',
      '附件里的图标 aria-hidden，按钮必须传 aria-label。',
      '焦点环与无效边框画在外框上，状态仍由里面输入框的 aria-invalid 传达。',
    ],
  },
  'otp-field': {
    aliases: ['OTP input', 'Verification code', 'PIN input', '验证码输入', '二次验证'],
    use: ['下单、出金前的二次验证码。', '短信与身份验证器的一次性码，长度固定。'],
    avoid: ['长度不定的口令用 PasswordInput。', '要在格间用方向键改中间某一位时，它不支持（只在末尾输入与退格）。'],
    a11y: [
      '真正的输入是一个透明的 input，读屏名取 aria-label（必传）；格子对读屏隐藏。',
      'autocomplete=one-time-code，手机的短信自动填充能直接填满。',
      '数字模式弹数字键盘（inputmode=numeric）；填满时调 onComplete。',
      '无效时 aria-invalid，格与外框变危险色；错误原因写在旁边的文字里，不只靠颜色。',
    ],
  },
  'morph-toggle': {
    aliases: ['Animated switch', 'Theme toggle', 'Morph switch', '变形开关'],
    use: ['实盘 / 模拟、主题、静音这类有仪式感的单个开关。', '开关状态要靠图标一眼认出（icon 变体）。'],
    avoid: ['设置页成排的开关用 Switch。', '一次性动作不要用开关。'],
    a11y: [
      'UI SDK Switch：role=switch，状态在 aria-checked，读屏名取 aria-label（必传）。',
      '状态同时由圆钮的位置与形状传达，不只靠颜色。',
    ],
  },
  'morph-icon': {
    aliases: ['Animated icon', 'Icon morph', 'Hamburger to close', '变形图标'],
    use: ['菜单与关闭、播放与停止、列表与网格这类成对状态的按钮图标。', '侧栏收起展开的开关图标。'],
    avoid: ['纯装饰的循环动画不要用它，它只在状态变化时动。', '要换成完全不同的图标时直接换，不用补间。'],
    a11y: ['装饰时 aria-hidden，名字写在外面的按钮上。', '单独成为内容时传 label，渲染成 role=img 带 title。'],
  },
  switch: {
    aliases: ['Toggle', 'Switch (Salt / MUI / Radix)', '开关'],
    use: [
      '设置项立即生效，如「实时推送」「深色模式」。',
      '策略的启停。',
      '即时生效的单项开关用 Switch，不要做成「开 / 关」两段的分段切换：读的人要读两边才知道状态（kubai Vibe Design Tips 020）。RenderingSettings 的像素对齐、斜线零、中英对齐已换成 Switch。',
    ],
    avoid: ['要点提交才生效的选项用 Checkbox。', '一次性动作用 Button 或 HoldToConfirm。'],
    a11y: [
      'UI SDK Switch：role=switch，状态在 aria-checked，读屏读「开 / 关」；只认空格拨动，回车不再拨动（WAI-ARIA 的 switch 只要求空格）。',
      '读屏名来自关联的 Label 或 aria-label。',
      '开关状态靠圆钮位置与轨道颜色两个通道一起传达。',
    ],
  },
  'toggle-group': {
    aliases: [
      'Segmented control',
      'Toggle button group (MUI)',
      'ToggleButtonGroup (Salt)',
      '分段切换',
      'TradingView 周期切换',
    ],
    use: [
      'K 线周期、买卖方向、视图模式这类二到五项的互斥切换。',
      '设置页里少量选项并排摆开。',
      '2 到 5 个短选项、互斥、各有名字：用分段，选项一直看得见，不藏进下拉。例：下单面板的保证金模式（全仓 / 逐仓，改错代价大）（kubai Vibe Design Tips 020）。',
      '例外：下单面板的计量方式（按金额 / 数量 / 风险）保持下拉：它嵌在数量框的标签位里，一行放不下分段；切换会清空数量，藏在一次点击后面反而合适。',
      '尺寸用 size：md（默认，设置页：有边框、按钮 24 高）与 sm（工具条：无边框、选中块滑动）。原来叫 variant="default | sm"，体检认定那是尺寸，改名 size；variant 留一个版本（G1，2026-11-18）。',
    ],
    avoid: ['选项多于五个用 Select。', '切换页面内容用 Tabs。'],
    a11y: [
      '整组 role=group，每个按钮是 aria-pressed 的开关，读屏读「已按下 / 未按下」。',
      '键盘：Tab 只停在组里一个按钮上，方向键在按钮间走（UI SDK ToggleGroup，照 WAI-ARIA 的 toolbar 模式；以前每个按钮都是 Tab 停靠点，用户 2026-11-27 接受这个变化，#263），空格选中。',
      '整组的名字要传 aria-label；仅图标的按钮各自传 aria-label。',
      '禁用项读作「不可用」，仍可被读屏浏览到。',
    ],
  },
  'chip-group': {
    aliases: ['Filter chips (MUI)', 'Toggle chip', 'Pill filter', '标签筛选'],
    use: ['自选分组、选股结果的快速分面筛选。', '选项在十个以内，需要一眼看到全部并带命中数。'],
    avoid: ['选项很多时用 MultiSelect 或 Combobox。', '互斥的几项用 ToggleGroup。'],
    a11y: [
      '整组 role=group，名字取 label 属性。',
      '每个芯片是 aria-pressed 的开关；组内只有一个停靠点，方向键在芯片间走。',
      '清除钮的读屏名取 labels.clear，图标本身 aria-hidden。',
    ],
  },
  slider: {
    aliases: ['Range slider', 'Slider (Salt / MUI / Radix)', '滑动条'],
    use: ['风险比例、仓位百分比这类有上下限的连续取值。', '区间（两个把手）：价格范围、止盈止损线。'],
    avoid: ['需要输入精确值用 NumberInput。', '要在全体分布上选区间用 RangeHistogramSlider。'],
    a11y: [
      'Radix Slider：每个把手 role=slider，带 aria-valuemin / max / now。',
      '读屏名来自 thumbLabels，每个把手各传一个（区间要分清「最小」「最大」）。',
      '禁用时把手读作「不可用」。',
    ],
  },
  'shortcut-recorder': {
    aliases: ['Hotkey input', 'Keybinding recorder', '热键录入', '快捷键设置'],
    use: ['设置页里给下单、切图表等操作绑定热键。', '需要提示冲突并说明占用者的热键表。'],
    avoid: ['录入普通文字用 Input。', '固定快捷键的展示用 Kbd。'],
    a11y: [
      '录键框是 button，读屏名取 label，当前快捷键写在 aria-describedby 指向的屏外文字里。',
      '冲突与状态提示放在 role=status 区，出现时读屏播报。',
      '清除钮有独立读屏名（labels.clear）。',
      'Tab 在录键态也会移走焦点，不会把键盘用户困住。',
    ],
  },
  hotkeys: {
    aliases: ['Keyboard shortcuts', 'Hotkey manager', 'Keybindings', '快捷键注册表'],
    use: [
      '组件里用 useHotkeys 声明自己的快捷键（id、组合、名字、作用域、处理函数），挂上登记、卸下注销，ShortcutSheet 与冲突检测都读同一张表。',
      '组合写 Mod 跨平台：Mac 是 ⌘，别处 Ctrl；规范串同 ShortcutRecorder（Ctrl、Alt、Shift、Meta 的次序加主键），录出来的直接能用。',
      '同一个组合多条都开着：非 global 作用域的先得，同类里后登记的先得（打开的面板盖过底下的）；setActiveScopes 整组关掉某个作用域。',
      '焦点在文本框、textarea、select、contenteditable 里不触发，Esc、Mod+K 这类写 allowInInput；输入法组字中（isComposing、keyCode 229）一律不触发（照 modern-web-guidance ime-safe-enter-submit）。',
      '同作用域或碰上 global 的同组合算冲突，ShortcutSheet 在两行上都标出来；不同作用域的同键不算（自选表与图表都用 ↑↓ 很正常）。',
    ],
    avoid: ['只在一个输入框里处理 Enter 这类键，直接写 onKeyDown。', '展示固定的快捷键用 Kbd。'],
    a11y: [
      '不抢方向键、Tab、Enter 这类读屏与表单要用的键：用 global 作用域登记单个无修饰键前先想清楚，最好放进有焦点的组件的作用域里。',
      '每条快捷键都要有可点的入口（按钮、菜单项），快捷键只是加速，不是唯一的路（WCAG 2.1.1）。',
      '单字符快捷键（没有修饰键）要能关或改（WCAG 2.1.4）：配 ShortcutSheet 的改键。',
    ],
  },
  'shortcut-sheet': {
    aliases: ['Keyboard shortcuts dialog', 'Shortcut cheat sheet', 'Hotkey list', '快捷键总览'],
    use: [
      '照 TradingView 的 Keyboard shortcuts 面板（Ctrl/Cmd+/，2026-11-18 实看）：顶上「查找快捷键」搜索框，下面按作用域分节，行左名右键，几种按法之间写「或」。',
      '分节跟 TradingView 一样默认收起（#87）：节名是整行宽的展开钮，三角朝右是收起、展开转 90°；defaultOpenScopes 给一开始就展开的节。搜索时命中的节都展开、没命中的不出，节名钮这时不可点；清空搜索回到用户自己展开过的样子。',
      '行高 30、分节标题三级色小号大写；冲突的行名字下一行 warn 色小字写跟谁冲突；关掉的作用域整行 45% 透明。',
      '搜索认动作名、作用域名与按键（⌘K、Ctrl+K 都能搜到）。',
      '给 onComboChange 与 labels.recorder 时每行变成 ShortcutRecorder 改键，占用表是同作用域与 global 的别的动作；键位存哪由调用方定。',
      '件只是内容：放进 Dialog（文档站的做法，宽 460）、Sheet 或侧栏由调用方定；打开它的键一般是 Mod+/。',
    ],
    avoid: ['设置页里只改一两个键，直接用 shortcut-recorder。'],
    a11y: [
      '搜索框有屏外 label；每节是带标题的 section（aria-labelledby 指向节名钮），节名钮带 aria-expanded 与 aria-controls（照 APG Accordion），行是列表项。',
      '按键用 Kbd，读屏念整串（「⌘+K」），不逐块念。',
      '没有匹配时 role=status 念空态文字。',
    ],
  },
  'number-input': {
    aliases: ['Number field', 'NumberInput (Salt / MUI)', 'Spinbutton', '价格 / 数量输入'],
    use: [
      '下单面板的价格、数量、止损价。',
      '带单位的参数（%、手、点），要按住拖动微调。',
      '需要「+10%」「*2」这类算式输入。',
    ],
    avoid: ['固定几档的选择用 Select 或 ToggleGroup。', '要看分布再选区间用 RangeHistogramSlider。'],
    a11y: [
      '输入框 role=spinbutton，带 aria-valuenow / min / max。',
      '有单位时 aria-valuetext 读「数值 单位」。',
      '读屏名取 label 属性；框内标签只是视觉，aria-hidden。',
      '错误或算式写错时 aria-invalid 为真。',
    ],
  },
  'date-time-input': {
    aliases: ['Date field', 'DatePicker (Salt / MUI)', 'DateTimeField', '日期时间选择'],
    use: ['回放起点、报告日期、订单有效期。', '需要精确到分钟，又想直接打字的场合。'],
    avoid: ['选起止两个日期用 DateRangePicker。', '只要时长（如 2 小时 30 分）用 DurationPicker。'],
    a11y: [
      '基于 UI SDK 的 DateInput：每一段是独立的可聚焦段，读屏读出段名与值。',
      '日期、时间、日历按钮、日历各有读屏名，由 labels 传入，文案不写死在件里。',
      '日期不合法时按 aria 校验标红，错误随控件读出。',
    ],
  },
  'date-range-picker': {
    aliases: ['Date range', 'DateRangePicker (Salt / MUI)', 'Range calendar', '日期区间'],
    use: ['回放、台账、绩效报告选起止日期。', '常用区间（本周、本月、年初至今）要一键选。'],
    avoid: ['选单个日期用 DateTimeInput。', '要选未来区间（事件日历）时预设不适用。'],
    a11y: [
      '起点、终点各是一个 UI SDK 的分段日期框，读屏名分别取 labels.start、labels.end。',
      '预设列是 role=group，每项 aria-pressed；「自定义」带 aria-current。',
      '日历是 UI SDK 的 Calendar（range 模式），翻月按钮有读屏名。',
      '终点早于起点时按 aria 校验标红。',
    ],
  },
  combobox: {
    aliases: ['Autocomplete', 'Combobox (Salt / Radix)', 'Searchable select', '可搜索下拉', '代码搜索框'],
    use: [
      '选标的、账户、策略这类上十项并需要搜索的列表。',
      '多选并想边搜边勾。',
      '行要带头像、图标或一句说明时传 prefix 与 description（都可选，不传行还是 30 高的一行）。',
    ],
    avoid: ['少量固定选项用 Select。', '纯文本自由输入用 Input。', '要在输入框里看到已选的标签用 TagCombobox。'],
    a11y: [
      '触发器 role=combobox，带 aria-expanded。',
      '搜索框与列表必须各传 label，否则读屏读不出名字。',
      '行的 aria-selected 只表示高亮；已选状态用 selected，画勾并写 data-checked。',
      '无匹配时 ComboboxEmpty 的文字会被读出。',
      'prefix 对读屏隐藏（纯装饰），名字要写在行的文字里；description 是行文字的一部分，会跟着读出。',
      '带 prefix 或 description 时 value 默认取主文字（children 是字符串），说明不被搜到；要搜说明放 keywords；children 不是字符串时一定要传 value。',
    ],
  },
  field: {
    aliases: ['Form field', 'FormField (Salt)', 'FormControl (MUI)', '表单项'],
    use: ['把标签、控件、说明、错误排成一组并接好 ARIA。', '一组相关的字段用 FieldSet 加 FieldLegend 包起来。'],
    avoid: ['单独一个控件且标签已写在旁边时不必包。', '全局提示用 Alert，不用 FieldError。'],
    a11y: [
      '点标签聚焦控件；控件用 useFieldControl 拿 id，与标签对上。',
      '说明与错误只在渲染后才写进控件的 aria-describedby，不会指向不存在的 id。',
      'invalid 时控件 aria-invalid，FieldError 是 role=alert，出现时读屏马上读。',
      'FieldSet / FieldGroup 是 role=group，组名取 FieldLegend。',
    ],
  },
  'hold-to-confirm': {
    aliases: ['Press and hold button', 'Hold to confirm', '长按确认', '按住确认'],
    use: ['全平、全撤、停止策略这类不可撤的动作。', '误触代价高、又不想弹对话框的面板。'],
    avoid: ['可撤销的动作用 Button。', '要先预览内容再确认用 Dialog。'],
    a11y: [
      '原生 button，读屏名取按钮文字。',
      'labels.hint 写进屏外文字并挂在 aria-describedby 上，读屏用户靠它知道要按多久、做什么。',
      '填满后文字换成 labels.confirmed，按钮上同步更新。',
    ],
  },
  'password-input': {
    aliases: ['Password field', 'PasswordInput (Salt / Mantine)', '密钥输入', 'API key 输入'],
    use: ['券商 API Key、密钥、令牌的录入。', '需要临时显示明文核对的敏感字段。'],
    avoid: ['不需要遮住的内容用 Input。', '要强度提示时件里没有，自己在 Field 里写说明。'],
    a11y: [
      '遮住时是原生 password 输入框，读屏名来自关联的 Label 或 aria-label。',
      '眼睛按钮读屏名取 labels.toggle（必传），名字不随状态变，是否显示由 aria-pressed 表达。',
      '切换后输入框保持焦点与选区。',
    ],
  },
  'delete-button': {
    aliases: ['Inline confirm', 'Confirm button', 'Two-step delete', '原地确认'],
    use: ['删自选、删预警、删模板这类轻量但不可撤的操作。', '列表行内，弹对话框太重。'],
    avoid: ['影响全局或资金的动作用 HoldToConfirm。', '确认前需要看详情用 Dialog。'],
    a11y: [
      '静止时是图标按钮，读屏名取 label，aria-expanded 表示是否已展开。',
      '展开后的「确认」「取消」各是带读屏名的按钮（labels.confirm、labels.cancel）。',
      '屏外有 aria-live=polite 的 role=status 区，播报展开与完成。',
    ],
  },
  'theme-selector': {
    aliases: ['Theme picker', 'Theme switcher', '主题切换', '外观选择'],
    use: ['设置页里选界面主题，要看到缩略预览。', '主题不止深浅两种的场合。'],
    avoid: ['只有明暗两档用 Switch 或 ToggleGroup。', '选字体、字号这类非主题项用 RenderingSettings。'],
    a11y: [
      '整组 role=radiogroup，名字取 label；每张预览 role=radio，aria-checked 表示选中。',
      '每张的读屏名取该主题的 label，缩略图 aria-hidden。',
      '整组禁用时 aria-disabled。',
    ],
  },
  'task-list': {
    aliases: ['Checklist', 'To-do list', 'Task checklist', '待办清单'],
    use: ['开盘前检查、复盘步骤这类要逐项勾掉的清单。', '已完成项想自动沉到底部。'],
    avoid: ['设置项的开关用 Checkbox 或 Switch。', '需要进度条或步骤状态时用 Progress。'],
    a11y: [
      '每行是 role=checkbox 的按钮，aria-checked 表示是否完成，整行都能点。',
      '屏外有 role=status 的 aria-live=polite 区，勾上与取消时播报「某某已完成 / 已重开」。',
      '整份清单的名字取 label。',
    ],
  },
  'refresh-control': {
    aliases: ['Auto refresh', 'Refresh interval', 'Polling control', '自动刷新'],
    use: [
      '筛选器、行情表、新闻流这类轮询的数据：TradingView 筛选器是「10 秒 / 1 分钟 / 不刷新」三档（#22 G12），演示照这三档；档位由调用方给。',
      '次序：间隔分段（ToggleGroup sm，26 高）· 立即刷新钮（24 × 24，图标 14px）· 「上次 HH:MM:SS」· 「下次 12s」；时刻主文字色，前缀次要文字色，等宽数字。',
      '倒计时从 lastRefreshed + interval 算，每秒一格；60 秒以内写 12s，以上写 1:05。',
      '在刷（refreshing）：图标转圈（1.2s 一圈），倒计时不显示，到点不重复调。',
      '标签页隐藏时停（不白拉数据），回到前台已过点就马上刷一次。',
    ],
    avoid: ['推送来的实时数据（WebSocket）不需要它：用 live 的连接状态。', '一次性的手动刷新只要一个钮，用 Button。'],
    a11y: [
      '间隔是 ToggleGroup（读屏名 labels.interval，当前档 aria-pressed）；刷新钮读屏名 labels.refresh。',
      '在刷时刷新钮是 aria-disabled，不是 disabled：焦点不丢。',
      '倒计时不放 aria-live（每秒读太吵）；上次时刻用 <time datetime>。',
    ],
  },
  'duration-picker': {
    aliases: ['Time duration input', 'Duration field', '时长输入'],
    use: ['订单有效时长、冷却时间、回放步长。', '值在一天以内，用「时 + 分」表达。'],
    avoid: ['选具体时刻用 DateTimeInput。', '长到天、周的时长不适用，上限由 maxHours、maxMinutes 定。'],
    a11y: ['整条药丸的名字取 label。', '笔钮读屏名随状态变：编辑中读 labels.save，否则读 labels.edit。'],
  },
  'filter-bar': {
    aliases: ['Filter builder', 'Screener filters', 'Filter pills', '选股器过滤条', 'TradingView Screener'],
    use: ['选股器顶部，按市值、涨幅、换手等字段筛。', '字段多、条件要随时增减的表格视图。'],
    avoid: ['只有三五个固定筛选用 ChipGroup。', '单个字段的值域选择用 RangeHistogramSlider。'],
    a11y: [
      '整条 role=group，名字取 labels.bar。',
      '每个字段胶囊打开的浮层以字段名为读屏名。',
      '撤销、重做、「+」「⋯」、移除钮都是带读屏名的图标按钮，图标 aria-hidden。',
      '已在条上的字段在「+」列表里 aria-disabled。',
    ],
  },
  'rendering-settings': {
    aliases: ['Appearance settings', 'Font settings', '字体设置', '渲染设置'],
    use: ['应用「设置 → 渲染」页，整个应用一份。', '用户要自己挑字体、平滑、字重补偿。'],
    avoid: ['只切主题颜色用 ThemeSelector。', '某个面板自己的字号不要另开，用全局字号缩放。'],
    a11y: [
      '每项一行：名称、说明、控件，控件读屏名取该项名称。',
      '各字体角色的下拉读屏名取角色标题。',
      '像素对齐、斜线零、中英对齐是 Switch（role=switch，aria-checked 跟值，读屏名取该项名称），点一下立即生效，没有保存钮；文字平滑是互斥的两项，用分段（ToggleGroup）。',
      '用的是 Select、Slider、Switch、ToggleGroup 等原件，读屏行为随各原件。',
    ],
  },
  'decimal-field': {
    aliases: ['Price input', 'Quantity stepper', 'Number input', 'Order entry field'],
    use: ['下单面板输入价格与数量，按最小变动价位走一格。', '风控参数、止损止盈价位的输入。'],
    avoid: ['不要求十进制精度的一般数字用普通输入框。', '价位在不在格子上由调用方与 Gateway 判，不在这里校验。'],
    a11y: [
      'error 状态设 aria-invalid；warning 只换边色，读屏不报无效。',
      '− / + 按钮的读屏名由调用方传 labels（decrease、increase）。',
      '只读、禁用时方向键与按钮都不改值。',
      '输入法组字时（isComposing 或 keyCode 229）↑ ↓ 不改价，这些键也不传给调用方的 onKeyDown，调用方接 Enter 下单不会被选字误触。',
    ],
  },
  'range-histogram-slider': {
    aliases: ['Range histogram slider', 'Histogram range filter', 'Distribution slider', '分布区间滑块'],
    use: ['选股器里在全市场分布上拖市值、涨幅、换手的区间。', '想一边看分布一边定上下限。'],
    avoid: ['单值用 Slider。', '没有分布数据、只要上下限用两个 NumberInput。'],
    a11y: [
      '整组 role=group，名字取 label；按 APG 多把手滑块，两个把手各是 role=slider。',
      '把手读屏名取 labels.low / labels.high，带 aria-valuemin / max / now 与 aria-valuetext（由 formatValue 生成）。',
      '柱子与轨道 aria-hidden，数值只靠把手与读数行读出。',
    ],
  },
  'animated-tags': {
    aliases: ['Tag picker', 'Tag input', 'Token field', 'Chips'],
    use: ['选关注板块、策略标签、自选分组，要看清选了哪几个。', '选中的要单独放一处。'],
    avoid: ['原地开关的筛选用 chip-group。', '选项很多用 multi-select 带搜索。'],
    a11y: ['每个标签是按钮，读屏名由 labels.add / labels.remove 给（带标签名）。', '焦点环取自全局 focus-ring。'],
  },
  'exposure-slider': {
    aliases: ['Dial', 'Bipolar slider', 'Tape measure'],
    use: ['调净敞口、仓位偏移、杠杆这类有正有负的量。', '手感想要拨盘。'],
    avoid: ['只有一侧的量（仓位比例、杠杆、数量占可用）用 ruler-slider。', '要输入精确数字用 number-input。'],
    a11y: [
      'role=slider，aria-valuemin / max / now 与 aria-valuetext 齐全。',
      '键盘 ← → 一格、PageUp / PageDown 十格、Home / End 到两端。',
    ],
  },
  'ruler-slider': {
    aliases: ['Ruler slider', 'Quantity slider', 'Tape measure', '单向刻度尺', '数量滑块'],
    use: ['下单面板里调数量占可用的百分比、仓位比例。', '调杠杆这类从 min 往上走的量，手感想要拨盘。'],
    avoid: [
      '有正有负、中点是 0 的量用 exposure-slider。',
      '表单里普通的单值与区间用 slider。',
      '要输入精确数字用 number-input。',
    ],
    a11y: [
      'role=slider，名字取 label，aria-valuemin / max / now 与 aria-valuetext（format 的结果）齐全。',
      '键盘 ← → 一格、Shift + ← → 或 PageUp / PageDown 一大格、Home / End 到两端。',
      '环形读数 aria-hidden，大刻度的数字在 role=slider 里面，读屏只读当前值。',
    ],
  },
  scrubber: {
    aliases: ['Scrub bar', 'Timeline scrubber', 'Drag to adjust', 'Value scrubber'],
    use: ['回测里擦洗回看的时间点。', '拖动调整下单数量、价格偏移这类一行里的单个量。'],
    avoid: [
      '表单里的单值与区间用 slider。',
      '要输入精确数字用 number-input。',
      '图上悬停选一格的读数用 use-scrubber 钩子。',
    ],
    a11y: [
      'role=slider，名字取 label，aria-valuetext 是 format 的结果。',
      '键盘 ← → 一步、Shift 或 PageUp / PageDown 十步、Home / End 到两端。',
    ],
  },
  'power-off-slide': {
    aliases: ['Slide to confirm', 'Swipe to confirm', 'Slide to unlock', 'Slider button'],
    use: ['全部平仓、清仓、关闭策略这类不可轻易误触的操作。', '鼠标与触屏上想要有手感的确认。'],
    avoid: ['长按确认的用 hold-to-confirm。', '可撤销的小事用 button。'],
    a11y: [
      '圆钮是 role=button，读屏名取 label；Enter 或空格直接确认（键盘与读屏走这条路）。',
      '执行中是 role=status。',
    ],
  },
}

export default forms
