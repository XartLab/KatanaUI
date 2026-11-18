// SPDX-License-Identifier: MIT
// 组件文档站的目录与每页的文字（#1860）：只有数据，不引组件，单测（registry.test.ts）拿它跟 src/index.ts 的出口对账。
// 版式照 kobra.systems/components/<件名> 的结构（2026-11-14 读）：左侧目录按类分组，右侧一个组件一页，页上依次是预览、属性、组成、键盘。
// 属性表不手写（#1902）：页上只记「哪几个部件、各一句说明」（propParts），每个部件的自有属性由 pnpm docs:props 从 TS 类型与 JSDoc 生成到 props.generated.json；
// 继承来的 DOM / Radix 属性不逐条列，note 里写透传给谁。每页的「用法」是 usage/<页 id>.tsx：真实可运行的最小例子，页上渲染它也展示它的源码（Vite ?raw）。

export type GroupId =
  | 'forms'
  | 'overlays'
  | 'layout'
  | 'layout-primitives'
  | 'readouts'
  | 'feedback'
  | 'motion'
  | 'ai'
  | 'quotes'
  | 'quant'
  | 'cn'
  | 'blocks'
  | 'decisions'

export const GROUPS: readonly { id: GroupId; title: string }[] = [
  { id: 'forms', title: '表单控件' },
  { id: 'overlays', title: '浮层' },
  { id: 'layout', title: '布局与导航' },
  { id: 'layout-primitives', title: '排版原语' },
  { id: 'readouts', title: '读数与状态' },
  { id: 'feedback', title: '反馈' },
  // 动效：文字进场、切换过场、背景与特效（多数照 SmoothUI 改，MIT）；信息流不只靠闪烁。
  { id: 'motion', title: '动效' },
  // AI：对话、推理、工具调用、审批、来源（交易里 AI 建议要人审，审批件是关键）。
  { id: 'ai', title: 'AI' },
  { id: 'quotes', title: '报价与行情' },
  { id: 'quant', title: '量化' },
  { id: 'cn', title: 'A 股' },
  { id: 'blocks', title: '积木' },
  { id: 'decisions', title: '设计决策' },
]

/** 旧的手写属性表（#1902 过渡：页上有 propParts 就不读它；三个并行 PR 合完后删，见 PR 说明）。 */
export type PropRow = { name: string; type: string; default?: string; desc: string }
export type PropTable = { part: string; note?: string; rows: readonly PropRow[] }
/** 一个部件的属性表：属性行读 props.generated.json 里 symbol（缺省为 part）那条；symbol 不是导出名（几个部件并写的标题）就只显示 note。 */
export type PropPart = { part: string; symbol?: string; note?: string }

export type DocPage = {
  /** 地址 `#/<id>`，也是预览容器的 data-gallery。 */
  id: string
  group: GroupId
  /** 设计系统包里预览卡的高度（px）：按预览摆出来的实际高度留，不留空白（ds-build 读；用 pnpm ds:build 后在卡里量）。 */
  cardHeight: number
  title: string
  summary: string
  /** 这一页覆盖的 `@katana-ui/react` 出口名（量化组的页是 `@katana-ui/react/quant` 的出口）（部件、变体函数、类名常量、钩子）。registry.test.ts 要求：出口与页一一对应。 */
  exports: readonly string[]
  /** 新：生成的属性表（优先）。 */
  propParts?: readonly PropPart[]
  /** 旧：手写属性表，只在没有 propParts 时读。 */
  props?: readonly PropTable[]
  /** 状态：每个状态一句，何时出现、长什么样（设计系统包的 README 与文档站都读它）。 */
  states: readonly string[]
  /** 不要怎么用：每条一句。 */
  donts: readonly string[]
  /** 组成：由哪几个导出的部件拼出来，缩进表示嵌套。 */
  composition: string
  /** 键盘：[键, 做什么]；没有键盘交互的件留空。 */
  keys: readonly (readonly [string, string])[]
}

/** 不是组件的出口：样式合并与焦点环的类名工具，不单独成页。 */
export const NON_COMPONENT_EXPORTS: readonly string[] = [
  'cn',
  'focusRing',
  'focusRingInset',
  'InlineOverlays',
  'LOADING_TIMEOUT_MS',
]

export const PAGES: readonly DocPage[] = [
  {
    id: 'button',
    group: 'forms',
    cardHeight: 350,
    title: 'Button 按钮',
    summary:
      '30 高的默认按钮，六种变体与三种尺寸；悬停提亮、按下缩到 0.97，禁用降到 45% 不透明度。颜色只读 actionable（bold = primary、subtle = icon、negative = danger）、content、separable、focused 这几类 characteristic，高度与内距读密度（data-density 的 size-base、size-row、spacing-*）；「主题 × 密度」那三行在 high、medium、low 下各摆一遍。',
    exports: ['Button', 'buttonVariants'],
    propParts: [
      { part: 'Button', note: '其余属性透传给原生 button；type 默认 button，放进表单不会误提交。' },
      { part: 'buttonVariants', note: '返回类名的函数，给不是 button 的元素画成按钮（包着文件输入的 label 之类）。' },
    ],
    states: [
      '默认：4% 白底 8% 白边，悬停提亮，按下缩到 0.97。',
      '尺寸：md（默认，30 高）、sm（26 高、圆角 8、字 11 粗 600）、icon（28 见方，只放图标）；旧名 size="default" 等于 md。',
      '禁用：45% 不透明度，不响应指针。',
      '焦点：键盘 Tab 到时画 focus-ring 的外框。',
      'effect（改自 SmoothUI，MIT）：magnetic 指针靠近时按钮朝它偏、离开弹回；dot-morph 前面一颗点悬停时拉成竖条；clip-corners 四个角切掉、悬停时切口变大。三种只在有精确指针的设备上动。',
    ],
    donts: [
      '不要在一个区域放两个主要按钮。',
      '图标按钮必须带 aria-label。',
      '不要用颜色以外没有字的危险按钮。',
      'effect 一个界面里最多给一两个主操作用，不要成排；dot-morph 不能与 asChild 同用。',
    ],
    composition: 'Button',
    keys: [
      ['Tab', '聚焦，焦点环 2px'],
      ['Enter / Space', '触发点击'],
    ],
  },
  {
    id: 'input',
    group: 'forms',
    cardHeight: 62,
    title: 'Input 输入框',
    summary:
      '单行文本框：30 高（sm 26 高），4% 白底 8% 白边；聚焦边变亮，禁用降到 45%。可选 floatingLabel：标签从框里升到框上。',
    exports: ['Input', 'inputVariants'],
    propParts: [
      { part: 'Input', note: '其余属性透传给原生 input；type 默认 text。' },
      { part: 'inputVariants', note: '返回类名的函数，给 textarea 等非 input 元素用。' },
    ],
    states: [
      '默认、有值、禁用。',
      '尺寸：md（默认，30 高）、sm（26 高，字 12）；旧名 size="default" 等于 md。',
      'aria-invalid 时边框变危险色。',
      '焦点：边框提亮（focus-ring）。',
      'floatingLabel：标签静止时盖在框里，聚焦或有内容时缩小升到框上面一条 14px 的留白里（改自 SmoothUI float-input，MIT）。',
    ],
    donts: [
      '不要不带 label 就放出去。',
      '不要在占位符里放必须读的信息。',
      '用 floatingLabel 时 placeholder 不显示，提示写进标签或说明。',
    ],
    composition: 'Input',
    keys: [['Tab', '聚焦；聚焦时边框提亮']],
  },
  {
    id: 'select',
    group: 'forms',
    cardHeight: 234,
    title: 'Select 下拉',
    summary: '单选下拉：触发器 30 高，列表贴在触发器下面（不盖住当前项），当前项加粗。',
    exports: [
      'Select',
      'SelectArrow',
      'SelectContent',
      'SelectItem',
      'SelectTrigger',
      'SelectValue',
      'selectItemClass',
      'selectTriggerVariants',
    ],
    propParts: [
      { part: 'Select', note: '其余属性透传给 Radix Select.Root。' },
      { part: 'SelectTrigger', note: '其余属性透传给 Radix Select.Trigger。没有可见文字时要给 aria-label。' },
      { part: 'SelectValue', note: '其余属性透传给 Radix Select.Value。' },
      { part: 'SelectItem', note: '其余属性透传给 Radix Select.Item。' },
      { part: 'SelectContent', note: '其余属性透传给 Radix Select.Content。位置固定在触发器下方，偏移 2px。' },
      { part: 'SelectArrow', note: '触发器右边的小箭头，自己拼触发器时用。' },
      {
        part: 'selectTriggerVariants / selectItemClass',
        symbol: 'selectTriggerVariants',
        note: '触发器与列表项的类名，MultiSelect 与应用里别的下拉用它们跟单选下拉长一个样。',
      },
    ],
    states: ['默认、已选、未选（占位）、禁用。', '展开：列表项左侧留一列放勾；当前项加粗。'],
    donts: [
      '不要把可以直接点的两三个选项藏进下拉。',
      '选项多到要找（十几项以上）用 Combobox，能搜。',
      '要选多个用 MultiSelect，不要拿单选下拉连选几次。',
    ],
    composition: 'Select\n  SelectTrigger\n    SelectValue\n    SelectArrow\n  SelectContent\n    SelectItem',
    keys: [
      ['Enter / Space / ↓', '在触发器上打开列表'],
      ['↑ ↓', '在项之间走'],
      ['Enter', '选中并收起'],
      ['Esc', '收起，焦点回触发器'],
      ['打字', '跳到以它开头的项'],
    ],
  },
  {
    id: 'multi-select',
    group: 'forms',
    cardHeight: 62,
    title: 'MultiSelect 多选下拉',
    summary: '触发器写已选项的名字，列表项前面一列勾；点一项只切这一项，列表不收。由 Popover 加勾选组出来。',
    exports: ['MultiSelect'],
    propParts: [
      {
        part: 'MultiSelect',
        note: '选项、已选值、文案全由调用方传；列表是 Radix Popover，点一项只切这一项、不收起。',
      },
    ],
    states: [
      '一个都没选：写 empty。',
      '已选若干：按选项的顺序写名字，separator 隔开。',
      '点一项只切这一项，列表不收。',
    ],
    donts: [
      '不要在包里写死分隔符与空态文案，由调用方传。',
      '只能选一个时用 Select。',
      '已选很多时触发器会截断，选项多于十几项用可搜索的 Combobox（多选）。',
    ],
    composition: 'MultiSelect（内部：Popover + PopoverTrigger + PopoverContent，列表项为 role=option）',
    keys: [
      ['Enter / Space / ↓', '在触发器上打开；焦点落在第一个已选项'],
      ['↑ ↓', '在项之间走，首尾相接'],
      ['Home / End', '跳到首项、末项'],
      ['Space / Enter', '切换当前项'],
      ['打字', '跳到以它开头的项'],
      ['Esc', '收起，焦点回触发器'],
    ],
  },
  {
    id: 'checkbox',
    group: 'forms',
    cardHeight: 48,
    title: 'Checkbox 勾选',
    summary:
      '14px 凹陷方框；选中后中心一块 6px 方块，框换亮中性底，符号弹进来。半选画 2px 横杠。可选 indicator="check"：一笔写出来的勾（改自 SmoothUI，MIT）。',
    exports: ['Checkbox'],
    propParts: [{ part: 'Checkbox', note: '其余属性透传给 Radix Checkbox.Root。' }],
    states: [
      '未勾、已勾、半选（indeterminate）、禁用、禁用已勾、错误（aria-invalid）。',
      'indicator="check"：勾的路径从头画到尾，半选画横杠。',
    ],
    donts: [
      '不要让勾选框单独承载状态而不带文字。',
      '不要用勾选框做立刻生效的开关（那是 Switch），勾选框配「保存 / 应用」。',
      '半选只给「部分子项已勾」的父项用，不要拿它表示「未知」。',
    ],
    composition: 'Checkbox',
    keys: [
      ['Tab', '聚焦'],
      ['Space', '翻转选中'],
    ],
  },
  {
    id: 'switch',
    group: 'forms',
    cardHeight: 60,
    title: 'Switch 开关',
    summary: '34 × 18 的轨道画在 40 × 28 的布局盒里；开时轨道换强调色，圆钮挪过去。',
    exports: ['Switch'],
    propParts: [{ part: 'Switch', note: '其余属性透传给 Radix Switch.Root。' }],
    states: [
      '关：10% 白轨道 + 9% 白内描边，圆钮 ink-300（--k-selectable-track-* / -thumb-background）。',
      '开：轨道换实心亮中性（--k-selectable-bold-background-selected），圆钮换深色并滑 16px（snappy）。',
      '悬停：关时轨道提到 18% 白，开时实心降到 ink-200。',
      '禁用关、禁用开：45% 不透明度，不响应指针。',
    ],
    donts: [
      '不要用开关做「提交」这类一次性动作。',
      '不要把开关放进要点「保存」才生效的表单里，那用 Checkbox。',
      '标签写开着时的意思（「显示成交量」），不要写成问句或「开 / 关」。',
    ],
    composition: 'Switch',
    keys: [
      ['Tab', '聚焦'],
      ['Space / Enter', '翻转'],
    ],
  },
  {
    id: 'toggle-group',
    group: 'forms',
    cardHeight: 66,
    title: 'ToggleGroup 分段',
    summary: '一组互斥的按钮，选中块是一块跟着滑的底（弹簧）。default 是设置页样式，sm 是工具条样式。',
    exports: ['ToggleGroup', 'ToggleGroupItem', 'toggleGroupVariants', 'toggleItemVariants'],
    propParts: [
      { part: 'ToggleGroup', note: '其余属性透传给 Radix ToggleGroup.Root。单选语义：点已选中的项不会取消。' },
      { part: 'ToggleGroupItem', note: '其余属性透传给 Radix ToggleGroup.Item。' },
      {
        part: 'toggleGroupVariants / toggleItemVariants',
        symbol: 'toggleGroupVariants',
        note: '外壳与按钮的类名函数。',
      },
    ],
    states: [
      '选中、未选、禁用项。',
      'size：md（默认，有边框、按钮 24 高、选中 700）与 sm（工具条：无边框、选中块随选中项滑动）；旧名 variant 留一个版本。',
      '键盘 Tab 到每个按钮，Space 或 Enter 选中。',
    ],
    donts: [
      '超过五项换 Select。',
      '不要拿它切换页面内容，那是 Tabs。',
      '不要一组里混着文字项与纯图标项；纯图标项各自要 aria-label。',
    ],
    composition: 'ToggleGroup\n  ToggleGroupItem',
    keys: [
      ['Tab', '每个按钮都是停靠点（不是方向键走的一组）'],
      ['Space / Enter', '选中这一项'],
    ],
  },
  {
    id: 'chip-group',
    group: 'forms',
    cardHeight: 135,
    title: 'ChipGroup 芯片组',
    summary:
      '分面筛选用的一排可开关小标签：多选或单选，可带命中数与清除钮。筛选器、自选分组的快速过滤用它。功能参照 Arc，实现原创。',
    exports: ['ChipGroup'],
    props: [
      {
        part: 'ChipGroup',
        note: '每个芯片是 aria-pressed 的开关，整组 role=group；底座是 Radix ToggleGroup。受控：value 与 onValueChange。',
        rows: [
          {
            name: 'items',
            type: '{ value: string; label: string; count?: number; disabled?: boolean }[]',
            desc: '芯片：count 是命中数，写在字右边（等宽数字），由调用方算好。',
          },
          { name: 'value', type: 'string[]', desc: '选中的 value。' },
          { name: 'onValueChange', type: '(value: string[]) => void', desc: '选中项变了。' },
          { name: 'label', type: 'string', desc: '整组的读屏名。' },
          {
            name: 'selection',
            type: "'multiple' | 'single'",
            default: "'multiple'",
            desc: 'single 最多选一个，点已选的就取消（取消 = 不筛）。',
          },
          {
            name: 'labels',
            type: 'ChipGroupLabels',
            desc: '{ clear? }：给了 clear，有选中项时末尾出现清除钮，读屏名与提示用它。旧名 clearLabel 留一个版本（@deprecated）。',
          },
        ],
      },
    ],
    states: [
      '未选：3% 白底 7% 白边（同按钮的 actionable）。',
      '选中：实心浅底深字（同分段切换）。',
      '禁用：降到 35% 不透明度。',
      '有选中项且给了 labels.clear：末尾出现 ×。',
    ],
    donts: [
      '不要拿它当导航：它筛数据，不换页面。',
      '选项很多（几十个）时用 MultiSelect 或 Combobox，别摆成一面芯片墙。',
      '命中数由调用方算：件不碰数据。',
    ],
    composition: 'ChipGroup\n  ToggleGroup（Radix，type=multiple）\n    Item × n（字 + 命中数）\n  button.k-chip-clear',
    keys: [
      ['← →', '在芯片间移动焦点'],
      ['Space / Enter', '切换焦点所在的芯片'],
      ['Tab', '进出整组（组内只停一个）'],
    ],
  },
  {
    id: 'slider',
    group: 'forms',
    cardHeight: 60,
    title: 'Slider 滑块',
    summary:
      '凹槽轨 + 点阵填充 + 圆把手；拖动跟手，松手 settle 弹簧吸附到步进，按住时把手放大到 1.12（改自 SmoothUI，MIT）；一个值或一段范围。',
    exports: ['Slider'],
    propParts: [{ part: 'Slider', note: '其余属性透传给 Radix Slider.Root。只做横向，受控。' }],
    states: ['单值、区间、禁用。', '键盘 ← → 走一格。', '按住或拖动：把手放大 1.12，松手弹回。'],
    donts: [
      '滑钮必须有 thumbLabels。',
      '要输入精确值（价格、数量）时旁边配 NumberInput，别只给滑杆。',
      '区间的两个把手不要叠在一起还用同一个名字，读屏分不清。',
    ],
    composition: 'Slider',
    keys: [
      ['← →', '走一个步进'],
      ['Home / End', '跳到最小、最大'],
      ['PageUp / PageDown', '走十个步进'],
    ],
  },
  {
    id: 'tooltip',
    group: 'overlays',
    cardHeight: 152,
    title: 'Tooltip 提示',
    summary: '悬停或聚焦时出现的短说明，从触发处轻升；默认没有延迟。',
    exports: ['Tooltip', 'TooltipContent', 'TooltipProvider', 'TooltipTrigger', 'tooltipContentClass'],
    propParts: [
      { part: 'TooltipProvider', note: '其余属性透传给 Radix Tooltip.Provider。' },
      { part: 'Tooltip', note: '其余属性透传给 Radix Tooltip.Root。' },
      { part: 'TooltipTrigger', note: '其余属性透传给 Radix Tooltip.Trigger。用 asChild 套在按钮上。' },
      { part: 'TooltipContent', note: '其余属性透传给 Radix Tooltip.Content。' },
      { part: 'tooltipContentClass', note: '提示的皮肤类名，应用里自己定位的提示（图表悬停）借它长一个样。' },
    ],
    states: [
      '触发器静止；悬停或聚焦后浮出提示（默认没有延迟）。',
      '浮出：最深底 + 1px 分隔线色边 + --k-overlay-tooltip-shadow，没有小箭头。',
      '内容里有键帽（.k-kbd）：压成实心浅色块，字用最深底色。',
      '移开或 Esc：直接消失，不播退场动画（#1849）。',
    ],
    donts: ['提示里不放可点的东西，要放用 Popover。', '重要的信息不要只放在提示里。'],
    composition: 'TooltipProvider\n  Tooltip\n    TooltipTrigger\n    TooltipContent',
    keys: [
      ['Tab', '聚焦触发器时出现'],
      ['Esc', '收起'],
    ],
  },
  {
    id: 'popover',
    group: 'overlays',
    cardHeight: 234,
    title: 'Popover 弹层',
    summary:
      '点触发器打开的一块浮层，跟菜单同一块材质；三种皮肤：panel（带内边的面板）、menu（菜单容器）、bare（只给定位）。',
    exports: [
      'Popover',
      'PopoverAnchor',
      'PopoverClose',
      'PopoverContent',
      'PopoverDescription',
      'PopoverHeader',
      'PopoverTitle',
      'PopoverTrigger',
      'useHoverOpen',
    ],
    propParts: [
      { part: 'Popover', note: '其余属性透传给 Radix Popover.Root。' },
      { part: 'PopoverContent', note: '其余属性透传给 Radix Popover.Content。' },
      {
        part: 'PopoverTrigger / PopoverAnchor / PopoverClose',
        symbol: 'PopoverTrigger',
        note: '透传 Radix 同名部件；Anchor 用来把弹层定位在触发器以外的元素上。',
      },
      {
        part: 'PopoverHeader / PopoverTitle / PopoverDescription',
        symbol: 'PopoverHeader',
        note: '面板里的标题区，纯排版。',
      },
      {
        part: 'useHoverOpen',
        note: 'Radix 没有悬停打开，这个钩子补上：返回 open、setOpen 与挂在触发器和内容上的 hover 事件。',
      },
    ],
    states: ['收起；打开后焦点落进去，Esc 收起并还回焦点。', '三种皮肤：panel、menu、bare。'],
    donts: [
      '不要在弹层里再开弹层。',
      '只读的说明用 Tooltip 或 HoverCard，不要用 Popover。',
      '要打断用户、必须裁决的事用 Dialog。',
    ],
    composition:
      'Popover\n  PopoverTrigger\n  PopoverContent\n    PopoverHeader\n      PopoverTitle\n      PopoverDescription\n    PopoverClose',
    keys: [
      ['Enter / Space', '在触发器上打开'],
      ['Tab', '焦点在弹层里循环'],
      ['Esc', '收起，焦点回触发器'],
    ],
  },
  {
    id: 'dialog',
    group: 'overlays',
    cardHeight: 334,
    title: 'Dialog 对话框',
    summary: '模态对话框，560 宽，从下方升起。由代码打开（没有触发器）的对话框，关闭后焦点回到打开前的元素。',
    exports: [
      'Dialog',
      'DialogBody',
      'DialogClose',
      'DialogContent',
      'DialogDescription',
      'DialogFooter',
      'DialogHeader',
      'DialogOverlay',
      'DialogPortal',
      'DialogTitle',
      'DialogTrigger',
    ],
    propParts: [
      { part: 'Dialog', note: '其余属性透传给 Radix Dialog.Root。' },
      { part: 'DialogContent', note: '其余属性透传给 Radix Dialog.Content。' },
      { part: 'DialogTitle', note: '其余属性透传给 Radix Dialog.Title。' },
      {
        part: 'DialogHeader / DialogBody / DialogFooter',
        symbol: 'DialogHeader',
        note: '标题栏（50 高）、正文、按钮栏，纯排版。',
      },
      {
        part: 'DialogTrigger / DialogClose / DialogDescription / DialogPortal / DialogOverlay',
        symbol: 'DialogTrigger',
        note: '透传 Radix 同名部件。',
      },
    ],
    states: [
      '收起；打开后焦点圈在对话框里，Esc 关闭并还回焦点。',
      '打开：surface-raised 底、9% 白边（--k-overlay-dialog-borderColor）、--k-overlay-dialog-shadow，背后压一层遮罩。',
      '头脚：标题栏 50 高、按钮栏上下各一道 5% 白分隔（--k-separable-subtle-borderColor）；正文太长时只滚正文。',
      '确认类（.k-dlg.confirm）：边换成 line-200。',
    ],
    donts: ['不要用对话框放不重要的通知。', '对话框必须有标题。'],
    composition:
      'Dialog\n  DialogTrigger\n  DialogContent\n    DialogHeader\n      DialogTitle\n    DialogBody\n      DialogDescription\n    DialogFooter\n      DialogClose',
    keys: [
      ['Esc', '关闭，焦点回到打开前的元素'],
      ['Tab / Shift+Tab', '焦点在对话框里循环，不出去'],
    ],
  },
  {
    id: 'dropdown-menu',
    group: 'overlays',
    cardHeight: 314,
    title: 'DropdownMenu 下拉菜单',
    summary: '点触发器打开的菜单：普通项、勾选项、单选项、分组标题、分隔线、快捷键提示，二级菜单最多一层。',
    exports: [
      'DropdownMenu',
      'DropdownMenuCheckboxItem',
      'DropdownMenuContent',
      'DropdownMenuGroup',
      'DropdownMenuItem',
      'DropdownMenuLabel',
      'DropdownMenuPortal',
      'DropdownMenuRadioGroup',
      'DropdownMenuRadioItem',
      'DropdownMenuSeparator',
      'DropdownMenuShortcut',
      'DropdownMenuSub',
      'DropdownMenuSubContent',
      'DropdownMenuSubTrigger',
      'DropdownMenuTrigger',
      'MenuCheckColumn',
      'MenuItemHint',
      'MenuItemIcon',
      'MenuItemLabel',
      'menuContainerClass',
      'menuRowClass',
      'menuSeparatorClass',
      'useMenuParts',
    ],
    propParts: [
      {
        part: 'DropdownMenu / DropdownMenuTrigger / DropdownMenuContent',
        symbol: 'DropdownMenu',
        note: '其余属性透传给 Radix DropdownMenu 的同名部件。',
      },
      { part: 'DropdownMenuItem', note: '其余属性透传给 Radix DropdownMenu.Item。' },
      {
        part: 'DropdownMenuCheckboxItem / DropdownMenuRadioGroup / DropdownMenuRadioItem',
        symbol: 'DropdownMenuCheckboxItem',
        note: '勾选项与单选组，透传 Radix 同名部件（checked / onCheckedChange、value / onValueChange）。',
      },
      {
        part: 'DropdownMenuSub / DropdownMenuSubTrigger / DropdownMenuSubContent',
        symbol: 'DropdownMenuSub',
        note: '二级菜单。安全三角：斜着朝二级走时路过下一行不误收。',
      },
      {
        part: 'DropdownMenuLabel / DropdownMenuSeparator / DropdownMenuShortcut / DropdownMenuGroup / DropdownMenuPortal',
        symbol: 'DropdownMenuLabel',
        note: '分组标题、分隔线、快捷键提示（右对齐）、分组、传送门。',
      },
      {
        part: 'menuContainerClass / menuRowClass / menuSeparatorClass',
        symbol: 'menuContainerClass',
        note: '菜单容器、行、分隔线的类名，别的浮层（Popover 的 menu 皮肤、应用里的菜单）借它们长一个样。',
      },
      {
        part: 'useMenuParts / MenuCheckColumn / MenuItemIcon / MenuItemLabel / MenuItemHint',
        symbol: 'useMenuParts',
        note: '行内的对齐列：勾选列、图标、文字、右侧提示；useMenuParts 让同一份菜单内容既能画在下拉菜单里也能画在右键菜单里。',
      },
    ],
    states: ['行：默认、悬停、禁用、危险。', '勾选行左侧占一列放勾。'],
    donts: [
      '菜单项不超过一屏，更长的换命令面板。',
      '不要拿它选表单里的一个值，那是 Select。',
      '二级菜单不要超过一层。',
    ],
    composition:
      'DropdownMenu\n  DropdownMenuTrigger\n  DropdownMenuContent\n    DropdownMenuLabel\n    DropdownMenuItem（含 DropdownMenuShortcut）\n    DropdownMenuSeparator\n    DropdownMenuCheckboxItem\n    DropdownMenuRadioGroup\n      DropdownMenuRadioItem\n    DropdownMenuSub\n      DropdownMenuSubTrigger\n      DropdownMenuSubContent',
    keys: [
      ['Enter / Space / ↓', '在触发器上打开'],
      ['↑ ↓', '在项之间走'],
      ['Enter / Space', '选中'],
      ['→', '在二级菜单的触发行上打开二级'],
      ['←', '收起二级，回到触发行'],
      ['Esc', '收起当前一层'],
    ],
  },
  {
    id: 'context-menu',
    group: 'overlays',
    cardHeight: 322,
    title: 'ContextMenu 右键菜单',
    summary: '在区域上右键打开，行与皮肤同下拉菜单；Esc 只关最里面一层。',
    exports: [
      'ContextMenu',
      'ContextMenuCheckboxItem',
      'ContextMenuContent',
      'ContextMenuGroup',
      'ContextMenuItem',
      'ContextMenuLabel',
      'ContextMenuPortal',
      'ContextMenuRadioGroup',
      'ContextMenuRadioItem',
      'ContextMenuSeparator',
      'ContextMenuShortcut',
      'ContextMenuSub',
      'ContextMenuSubContent',
      'ContextMenuSubTrigger',
      'ContextMenuTrigger',
    ],
    propParts: [
      {
        part: 'ContextMenu / ContextMenuTrigger / ContextMenuContent',
        symbol: 'ContextMenu',
        note: '其余属性透传给 Radix ContextMenu 的同名部件。触发器常用 asChild 套在要响应右键的元素上。',
      },
      { part: 'ContextMenuItem', note: '其余属性透传给 Radix ContextMenu.Item。' },
      { part: '其余部件', note: '与 DropdownMenu 的同名部件一一对应，属性也相同。' },
    ],
    states: ['行：默认、悬停、禁用、危险。', '勾选行左侧占一列放勾。'],
    donts: ['菜单项不超过一屏，更长的换命令面板。', '常用动作也要有按钮入口，不只放在右键里。'],
    composition:
      'ContextMenu\n  ContextMenuTrigger\n  ContextMenuContent\n    ContextMenuLabel\n    ContextMenuItem（含 ContextMenuShortcut）\n    ContextMenuSeparator\n    ContextMenuCheckboxItem\n    ContextMenuSub\n      ContextMenuSubTrigger\n      ContextMenuSubContent',
    keys: [
      ['右键', '在触发区域上打开'],
      ['↑ ↓', '在项之间走'],
      ['→ / ←', '开、关二级菜单'],
      ['Esc', '只关最里面一层；再按关整个菜单'],
    ],
  },
  {
    id: 'tabs',
    group: 'layout',
    cardHeight: 90,
    title: 'Tabs 页签',
    summary: '页签的选中块是一块跟着滑的底（弹簧）；default 是药丸底，line 是下划线。',
    exports: ['Tabs', 'TabsContent', 'TabsList', 'TabsTrigger', 'tabsListVariants'],
    propParts: [
      { part: 'Tabs', note: '其余属性透传给 Radix Tabs.Root。' },
      { part: 'TabsList', note: '其余属性透传给 Radix Tabs.List。tabsListVariants 是它的类名函数。' },
      { part: 'TabsTrigger', note: '其余属性透传给 Radix Tabs.Trigger。' },
      { part: 'TabsContent', note: '其余属性透传给 Radix Tabs.Content。' },
    ],
    states: ['选中、未选、禁用页签。', '默认与 line 两种样式。'],
    donts: [
      '页签名保持短，一行放得下。',
      '只切换一个值、不换内容时用 ToggleGroup。',
      '页签多到放不下时不要折两行，收进下拉或改导航。',
    ],
    composition: 'Tabs\n  TabsList\n    TabsTrigger\n  TabsContent',
    keys: [
      ['← →', '在页签间走并选中'],
      ['Home / End', '跳到首、末页签'],
      ['Tab', '从页签列表跳进当前内容'],
    ],
  },
  {
    id: 'accordion',
    group: 'layout',
    cardHeight: 135,
    title: 'Accordion 折叠',
    summary: '一组可展开收起的标题与内容；展开时高度从 0 长出来。',
    exports: ['Accordion', 'AccordionContent', 'AccordionItem', 'AccordionTrigger'],
    propParts: [
      { part: 'Accordion', note: '其余属性透传给 Radix Accordion.Root。' },
      { part: 'AccordionItem', note: '其余属性透传给 Radix Accordion.Item。' },
      {
        part: 'AccordionTrigger / AccordionContent',
        symbol: 'AccordionTrigger',
        note: '标题行（带箭头）与展开的内容，透传 Radix 同名部件。',
      },
    ],
    states: ['展开、收起。', '键盘 ↑ ↓ 在标题间走，Enter 或 Space 展开。'],
    donts: [
      '不要把用户必须读的内容收起来。',
      '只有一段可收起时用 Collapsible。',
      '标题里不放按钮或链接，整行就是展开的触发。',
    ],
    composition: 'Accordion\n  AccordionItem\n    AccordionTrigger\n    AccordionContent',
    keys: [
      ['Enter / Space', '展开或收起'],
      ['↑ ↓', '在标题之间走'],
      ['Home / End', '跳到首、末标题'],
    ],
  },
  {
    id: 'led',
    group: 'readouts',
    cardHeight: 142,
    title: 'Led 状态灯',
    summary: '8px 的 StatusLED：默认熄灭，只表达真实状态；必须配文字或读屏名，不单靠颜色说话。',
    exports: ['Led', 'LINK_GROUPS'],
    propParts: [
      { part: 'Led', note: '一个 role=img 的 span，名字是 label。' },
      { part: 'LINK_GROUPS', note: '联动组名的列表 A、B、C、D；组的颜色是 token link-a 到 link-d。' },
    ],
    states: [
      'tone（SeverityExt）：off / neutral 熄灭（默认），accent 亮强调色，ok、warn、danger 亮状态色；联动组按组色。旧的 state（on 等于 accent）留一个版本。',
      '空心、小号两种形态；无文字的灯必须带读屏名。',
      '状态变了在灯外闪一圈：变坏（warn、danger）用警示闪，变好用涨色闪。',
    ],
    donts: [
      '不要拿它当装饰：只表达真实状态。',
      '不要单靠颜色说话，旁边要有文字或读屏名。',
      '联动组 A-D 的颜色取自 Graphite 信号色（赭、粉红、绿、琥珀），不含蓝：设计决定不用 TradingView 蓝。',
    ],
    composition: 'Led',
    keys: [],
  },
  {
    id: 'lcd',
    group: 'readouts',
    cardHeight: 270,
    title: 'Lcd 读数窗',
    summary: '点阵小标签在上、LCD 数字在中、一行灰色小字在下的读数窗；没有数据显示「—」。',
    exports: ['Lcd'],
    propParts: [
      {
        part: 'Lcd',
        note: '数字由调用方格式化好传字符串，件不算；变了闪一下涨跌色（ReadoutFlash）。fill 撑满格子（KPI 行），inline 标签与数字同一行。',
      },
    ],
    states: [
      '有值：标签在上、数字在中、小字在下。',
      '没有数据：数字位置写「—」，不写 0。',
      'tone：neutral 不着色；ok、warn、danger 取 --k-status-*；up、down、flat 取 --k-tone-*（跟 data-updown 换红绿）；accent 是当前关注。',
    ],
    donts: ['不要在没有数据时写 0。', '不要在件里写死币种与位数，由调用方传。'],
    composition: 'Lcd',
    keys: [],
  },
  {
    id: 'dot-matrix',
    group: 'readouts',
    cardHeight: 104,
    title: 'DotMatrix 点阵纹理',
    summary: '4px 实、2px 空的方点，铺满一个面：本系统图表的签名，回撤面用它而不用实色。',
    exports: ['DotMatrix', 'DOT_PITCH', 'DOT_SIZE'],
    propParts: [
      { part: 'DotMatrix', note: '返回一个 SVG pattern，放进 <svg><defs>，用 fill="url(#id)" 引用。' },
      {
        part: 'DOT_SIZE / DOT_PITCH',
        symbol: 'DOT_SIZE',
        note: '点的边长 4 与点距 6（像素），给要自己算对齐的图表用。',
      },
    ],
    states: [
      '静态纹理：4px 实、2px 空；颜色默认 --seq-300，可传 token。',
      '每张图一个 id：同页两张图共用一个 id 时后一张会读到前一张的颜色。',
    ],
    donts: [
      '不要用它代替需要读数的实色块；它只给面（回撤面等）。',
      '不要传写死的颜色值：传 var(--token)，换主题才跟着换。',
      '不要改点的大小与点距：4 / 6 是点阵签名，跟 MatrixOrb、Loading 骨架是同一套。',
    ],
    composition: 'svg\n  defs\n    DotMatrix\n  rect (fill="url(#id)")',
    keys: [],
  },
  {
    id: 'rolling-text',
    group: 'readouts',
    cardHeight: 116,
    title: 'RollingText 滚动数字',
    summary:
      '里程表式的数字滚动：变了的那几位像里程表一样把中间的数字依次转过去（7 到 9 会看到 8 掠过），涨往上、跌往下，整串闪一下涨色或跌色。转得越远用得越久，最远 300ms。',
    exports: ['RollingText', 'rollSlots', 'rollStrip'],
    propParts: [
      {
        part: 'RollingText',
        note: '旧字只在样式里画，不进文本：复制、读屏拿到的只有当前的完整数字。ramp（并入 SmoothUI rolling-text 的做法）让品种代码这类字母位转过几个中间字再落下，默认 0 不转。stagger（SmoothUI price-flow）让变了的位从个位起一位一位错开；boxed（number-flow）给每一位一格带边的小窗；resize（digit-roll）让位数变了时变了的位淡入，三者默认都关。',
      },
      { part: 'rollSlots', note: '纯函数 (text, from, rolling)：每一位的当前字，和滚出去的旧字。' },
      {
        part: 'rollStrip',
        note: '纯函数 (char, out, direction, ramp)：一位从旧字转到新字时转轮上经过的字（一行一个）与格数；9 到 0 走一格；不是数字的位默认只走一格，给了 ramp 的字母位会再转过 ramp 个中间字。',
      },
    ],
    states: [
      '值没变：静止。',
      '值变了：变了的那几位滚动，涨往上、跌往下，整串闪一下涨色或跌色。',
      'stagger：个位先转，十位、百位依次晚一拍。',
      'resize：位数变了（999 到 1,000），变了的位淡入并从涨跌方向滑一小段。',
    ],
    donts: [
      '值没变时不要滚；价格、盈亏的变化只用它给的一次闪，不再加别的动效。',
      '十字线在看历史时传 animate=false：回看的数不是新到的，不滚不闪。',
      '不要把千分位、小数位交给它算：text 由调用方格式化好，value 只用来判涨跌方向。',
    ],
    composition: 'RollingText',
    keys: [],
  },
  {
    id: 'badge',
    group: 'readouts',
    cardHeight: 110,
    title: 'BadgeGroup 上标徽标',
    summary: '品种名后的上标小字（板块、风险标记）：次要文字色，不抢品种名；悬停写全称。',
    exports: ['BadgeGroup'],
    propParts: [
      {
        part: 'BadgeGroup',
        note: '没有徽标时什么都不画。每个徽标是一个 Tag（sm 档）、role=img，名字是全称，读屏读「科创板：涨跌幅 20%」。风险标记给 tone（warn、danger）。',
      },
    ],
    states: [
      'Tag 的 sm 档：micro 小字、行高 1、一块 neutral 的浅底，贴在品种名右上；悬停写全称，指针是 help。',
      '风险标记：item.tone 给 warn 或 danger，字与底换成状态色。',
      '没有徽标：什么都不画（不留空位）。',
    ],
    donts: [
      '不要用它放必须读的信息：它在品种名旁边，是次要的。',
      '上标只放一个字：全称写在 text 里（读屏名与悬停）。',
      '不要自己再画一种徽标：行内标记用 Tag，品种名后的上标用 BadgeGroup。',
    ],
    composition: 'BadgeGroup\n  Tag（sm）× n',
    keys: [],
  },
  {
    id: 'tag',
    group: 'readouts',
    cardHeight: 150,
    title: 'Tag 小标签',
    summary:
      '小标签的底座：语气（Severity：neutral、ok、warn、danger）× 尺寸（sm、md）× 填充或描边。BadgeGroup 的上标徽标、EstimateBadge 的估算标记都是它；颜色只读 --k-status-*。',
    exports: ['Tag'],
    propParts: [
      {
        part: 'Tag',
        note: '其余属性透传给 span。填充：字取 foreground、底取 background；outlined：底透明、1px 边取字色。sm 是 micro 字号、行高 1，md 是 caption 500。',
      },
    ],
    states: [
      'neutral（默认）、ok、warn、danger 四种语气。',
      '填充（默认）或描边（outlined）。',
      'sm：品种名后的上标；md：行内标记。',
    ],
    donts: [
      '不要只靠颜色说语气：字本身要说清（「估算」「停牌」）。',
      '不要拿它做按钮或可删的筛选项：它不可交互，可点的用 Button、可删的用 ChipGroup。',
      '不要写死颜色：只有四种语气，要别的颜色说明语气不对。',
    ],
    composition: 'Tag（span）',
    keys: [],
  },
  {
    id: 'kbd',
    group: 'readouts',
    cardHeight: 88,
    title: 'Kbd 快捷键方块',
    summary: '把一个快捷键组合画成一串小方块：20 高、圆角 4、6% 白底 12% 白边。',
    exports: ['Kbd'],
    propParts: [{ part: 'Kbd', note: '怎么把「Mod+Shift+H」拆成块、Mod 在这个平台叫什么，是调用方的事。' }],
    states: ['一个组合画成一串小方块；单键与多键。', '读屏读 label（整串，如「Ctrl+Shift+H」），不逐块读。'],
    donts: [
      '不要把快捷键写成普通文字加方括号。',
      '不要在件里拆「Mod」：平台上叫 Ctrl 还是 ⌘ 由调用方定好再传 parts。',
      '不要拿它画可点的按钮：它只是标注，按键录入用 ShortcutRecorder。',
    ],
    composition: 'Kbd',
    keys: [],
  },
  {
    id: 'symbol-mark',
    group: 'quotes',
    cardHeight: 220,
    title: 'SymbolMark 品种徽标',
    summary:
      '品种名前的小圆标（学 TradingView 列表里企业 / 币种标志）：有图显示圆形裁切的图片，加载失败退回字母；没有图就是字母圆标，底 bg-400、字 ink-200，不按代码随机上色。尺寸两档：sm 18（行高 28 的一行，默认）、md 28（卡片）；热力图格子这类要别的直径的仍可传数。字号跟直径走（28 以上 16，其余 12），在 css 里按 data-size 取字号 token，不内联。',
    exports: ['SymbolMark', 'symbolMarkLetters'],
    props: [
      {
        part: 'SymbolMark',
        note: '图片从哪来由调用方给；件里不带任何企业或币种的标志（商标）。读屏名用 name，没有就用 symbol。旧名 code 照认一个版本（@deprecated）。',
        rows: [
          { name: 'symbol', type: 'string', desc: '品种代码；字母圆标取其中的拉丁字母前 2 个（旧名 code）。' },
          { name: 'name', type: 'string', desc: '名称：读屏名；代码里没有字母（600519、00700）时取名称首字。' },
          { name: 'src', type: 'string', desc: '图片地址；不给或加载失败就画字母。' },
          {
            name: 'size',
            type: "'sm' | 'md' | number",
            default: "'sm'",
            desc: 'sm 18px（列表行）、md 28px（卡片）；数是自定直径（像素）。',
          },
        ],
      },
      {
        part: 'symbolMarkLetters',
        note: '字母圆标上写什么的纯函数。',
        rows: [
          {
            name: '(code, name?)',
            type: 'string',
            desc: '代码里的拉丁字母前 2 个（大写）；没有就取名称首字，再没有取代码首字符。',
          },
        ],
      },
    ],
    states: [
      '字母圆标：底 surface-overlay（bg-400）、字 content-body（ink-200），中性，不按代码上色。',
      '有图：圆形裁切、铺满；图加载失败退回字母，换了 src 会重新尝试。',
      '代码里没有拉丁字母（600519、00700）：取名称首字，再没有取代码首字符。',
      'sm（18）字号 12，md（28）及以上字号 16；data-size 标出档位。',
    ],
    donts: [
      '不要按代码随机上色：颜色留给数据。',
      '不要在件里内置真实公司或币种的标志。',
      '不要拿它当按钮：它是 role=img 的徽标，可点的是它所在的行或卡。',
    ],
    composition: 'SymbolMark\n  span[role=img][aria-label][data-size]\n    img（有图且没失败）| span 字母',
    keys: [],
  },
  {
    id: 'shortcut-recorder',
    group: 'forms',
    cardHeight: 193,
    title: 'ShortcutRecorder 快捷键录入',
    summary:
      '热键设置用的录键框：点一下进入录键态，按下组合键就记下来；冲突由调用方传的占用表判断，冲突时不写入并说占着的是谁。功能参照 Arc，实现原创。',
    exports: ['ShortcutRecorder'],
    props: [
      {
        part: 'ShortcutRecorder',
        note: '值是规范串：修饰键按 Ctrl、Alt、Shift、Meta 的次序再加主键，如 Ctrl+Shift+K；主键取物理键（event.code），Mac 的 Option 变形不影响。',
        rows: [
          { name: 'value', type: 'string | null', desc: '当前快捷键（规范串）；null 是没设。' },
          {
            name: 'onValueChange',
            type: '(next: string | null) => void',
            desc: '录到新的或清除。冲突与不合规的不回调。旧名 onValue 留一个版本（@deprecated）。',
          },
          { name: 'label', type: 'string', desc: '读屏名：哪个动作的快捷键。' },
          {
            name: 'labels',
            type: 'ShortcutRecorderLabels',
            desc: '文字：empty、recording、clear、conflict(action)、needModifier；包里不带语言。',
          },
          {
            name: 'conflicts',
            type: 'Record<string, string>',
            desc: '已被占用的组合：组合串 → 占着它的动作名。自己当前的值不算冲突。',
          },
          {
            name: 'partLabel',
            type: '(part: string) => string',
            desc: '规范串里一块怎么写（Meta → ⌘ 之类）；不给原样写。',
          },
          {
            name: 'requireModifier',
            type: 'boolean',
            default: 'false',
            desc: '要求至少带一个修饰键（单个字母键会和打字撞）。',
          },
          { name: 'disabled', type: 'boolean', desc: '灰掉，点不动。' },
        ],
      },
    ],
    states: [
      '空闲：显示当前快捷键的方块，没有就写「未设置」；右边有清除钮。',
      '录键：边框强调色，框里实时显示按着的修饰键；按下主键即记下并退出。',
      '冲突：边框红，框下说「已被 xx 使用」，不写入，留在录键态等下一次按键。',
    ],
    donts: [
      '不要在包里判断冲突：占用表由应用（热键表）给，件只比对。',
      '不要用它录文字：它只认一次按键组合。',
      '浏览器自己拦的组合（Ctrl+W、Ctrl+T 之类）网页收不到，录不到是预期。',
    ],
    composition:
      'ShortcutRecorder\n  button.k-rec-field\n    Kbd（当前值或按着的修饰键）\n  button.k-rec-clear\n  span[role=status]（冲突与提示）',
    keys: [
      ['Enter / 空格', '聚焦时进入录键态'],
      ['任意组合键', '录键态下记下；带冲突则提示不写入'],
      ['Esc', '退出录键态，不改值'],
      ['Backspace / Delete', '录键态下清除快捷键'],
      ['Tab', '移走焦点并退出录键态（不会把键盘用户困住）'],
    ],
  },
  {
    id: 'number-input',
    group: 'forms',
    cardHeight: 301,
    title: 'NumberInput 数字框',
    summary: '一个框：值加可选的单位后缀，没有 −/+ 按钮；打字、方向键、按住左右拖三种改法，可选框内标签与算式输入。',
    exports: ['NumberInput'],
    propParts: [
      {
        part: 'NumberInput',
        note: '角色是 spinbutton，带当前值与范围；只在值合法时回调，回调的值一定在 min / max 之内。',
      },
    ],
    states: [
      '默认、聚焦、悬停、禁用、错误。',
      '可带单位后缀；打字、方向键、按住左右拖都能改值。',
      'expression 打开时，写 +10%、*2 这类算式；写到一半（如 +1）不会先被当成 1 写进去，回车才算。',
    ],
    donts: ['不要加 −/+ 按钮：这个框没有。', '单位、小数位由调用方传，件里不猜。'],
    composition: 'NumberInput\n  input[role=spinbutton]\n  span.k-unit（有 unit 时）',
    keys: [
      ['↑ ↓', '按步长加减；Shift 十档，Alt 精调'],
      ['PageUp / PageDown', '十档'],
      ['Ctrl + Home / End', '跳到 min / max'],
      ['Enter', 'expression 打开时按当前值算算式；否则收起正在打的字'],
      ['Esc', '放弃正在打的字'],
      ['拖动', '按住左右拖：向右变大；Shift 粗调、Alt 精调'],
    ],
  },
  {
    id: 'date-time-input',
    group: 'forms',
    cardHeight: 148,
    title: 'DateTimeInput 日期时间框',
    summary: '可以逐段打字的「年-月-日」与「时:分」，日期框右边的日历按钮打开日历；不随浏览器语言变格式。',
    exports: ['DateTimeInput'],
    propParts: [
      {
        part: 'DateTimeInput',
        note: '值一律是字符串（日期 YYYY-MM-DD，时刻 HH:mm 或 HH:mm:ss，空串是没填完）；按哪个时区解读由调用方定。',
      },
    ],
    states: ['默认、聚焦、错误（日期或时间不合法）。', '日期框右边的日历按钮打开日历。'],
    donts: [
      '不要依赖浏览器语言的日期格式：这个件不随它变。',
      '不要传 Date 对象或时间戳：值是字符串，时区由调用方换算好再传。',
      '选区间用 DateRangePicker，别并排放两个 DateTimeInput。',
    ],
    composition: 'DateTimeInput\n  DateField（年 月 日各一段）\n  Popover\n    Calendar\n  TimeField（时 分 [秒]）',
    keys: [
      ['0–9', '在当前段打字，满了跳到下一段'],
      ['← →', '在段之间走'],
      ['↑ ↓', '当前段加减'],
      ['Backspace', '清空当前段'],
      ['Enter（日历按钮上）', '打开日历；日历里方向键选日'],
    ],
  },
  {
    id: 'date-range-picker',
    group: 'forms',
    cardHeight: 151,
    title: 'DateRangePicker 日期区间',
    summary:
      '起点—终点两个可逐段打字的日期框，右边的日历按钮打开双月日历，左边一列预设：今天、本周、本月、年初至今，不在预设里的显示「自定义」。回放、台账、报告的区间用它。功能参照 Arc，实现原创。',
    exports: ['DateRangePicker'],
    props: [
      {
        part: 'DateRangePicker',
        note: '值是 { start, end } 一对 YYYY-MM-DD（含两头），按哪个时区解读由调用方定。底座是 react-aria 的 DateField 与 RangeCalendar；浮层用我们的 Popover。',
        rows: [
          { name: 'value', type: '{ start: string; end: string } | null', desc: '当前区间；null 是没选。' },
          {
            name: 'onValueChange',
            type: '(range: DateRange) => void',
            desc: '凑成合法区间（起点不晚于终点）才回调；只填了一头不回调。旧名 onValue 留一个版本（@deprecated）。',
          },
          {
            name: 'today',
            type: 'string',
            desc: '今天（YYYY-MM-DD），预设从它算。由调用方按显示时区算好传进来，件里不读时钟。',
          },
          {
            name: 'weekStart',
            type: "'mon' | 'sun'",
            default: "'mon'",
            desc: '一周从哪天起；「本周」是它到今天。A 股与国际交易所都是周一。',
          },
          { name: 'min / max', type: 'string', desc: '能选的最早、最晚日期。' },
          {
            name: 'labels',
            type: 'DateRangeLabels',
            desc: '文字：start、end、pickRange、calendar、previousMonth、nextMonth、presets、preset（今天 / 本周 / 本月 / 年初至今）、custom；包里不带语言。',
          },
          { name: 'locale', type: 'string', desc: '给 react-aria 的语言：中文界面 zh-CN，英文界面 en-CA。' },
        ],
      },
    ],
    states: [
      '框内：起点、终点各一个分段输入；终点早于起点标红，不上报。',
      '预设：口径是截至今天（本周 = 周起始日到今天，本月 = 1 号到今天，年初至今 = 1 月 1 日到今天）；当前区间正好是某个预设时它高亮。',
      '区间不在预设里：预设列末尾显示「自定义」。',
      '日历：双月；点两下选起止，起止之间的日子是淡底；选完自动收起。',
    ],
    donts: [
      '不要在件里取「今天」：时区是应用的事，由 today 传进来。',
      '预设是截至今天，不含未来的日子；要未来区间（日历、事件预告）另做，别改这组预设的口径。',
      '单日选择用 DateTimeInput，别拿起止同一天凑。',
    ],
    composition:
      'DateRangePicker\n  DateField（起点）\n  DateField（终点）\n  Popover\n    预设按钮 × 4 + 自定义\n    RangeCalendar（两个 CalendarGrid）',
    keys: [
      ['← → / Tab', '在日期框的年、月、日各段间走；数字直接打，↑↓ 加减'],
      ['日历按钮 Enter / 空格', '打开日历，焦点进日历'],
      ['方向键 / PageUp / PageDown', '日历里移动日期、翻月'],
      ['Enter / 空格', '日历里选起点，再选终点；选完收起'],
      ['Esc', '收起日历，焦点回到按钮'],
    ],
  },
  {
    id: 'skeleton',
    group: 'feedback',
    cardHeight: 554,
    title: 'Skeleton 加载骨架',
    summary:
      '骨架条本身：12 高的点阵圆角条（bg-200 底、line-200 边），第一行 40%、最后一行 70%、中间满宽；不脉冲、不转圈。什么时候出、出多久由 Loading 管。',
    exports: ['Skeleton'],
    propParts: [
      {
        part: 'Skeleton',
        note: 'role=status、aria-busy；读屏读 label（必填）。rows 为真时每行占一个表格行高（--row-base），撑满面板主体用；一般经 Loading 用，不单摆。',
      },
    ],
    states: [
      'lines 行：第一行 40%、最后一行 70%、中间满宽；只有一行时 70%。',
      'rows：每行占一个表格行高，行数由 Loading 量。',
    ],
    donts: ['不要脉冲、不要转圈。', '不要自己判断什么时候摆它：500ms 延迟与 2s / 10s 两段在 Loading 里。'],
    composition: 'Skeleton（role=status）\n  span.sr-only（label）\n  span.k-loading-line × lines',
    keys: [],
  },
  {
    id: 'loading',
    group: 'feedback',
    cardHeight: 554,
    title: 'Loading 加载态',
    summary:
      '加载态的唯一入口：给 pending 等数据，不给 pending 当 Suspense 边界，给 phase 钉在某一段直接画。500ms 内到了什么也不画；超过了出点阵骨架，2s 说「仍在加载」，10s 转琥珀条加重试。',
    exports: ['Loading', 'LoadingBoundary', 'LoadingView'],
    propParts: [
      {
        part: 'Loading',
        note: 'pending 为真时 children 不挂载；骨架出过的内容用 2px 模糊揭示，没出过的直接出现。只管显示，不管取数。文字全在 labels（LoadingLabels，原 texts）。',
      },
      { part: 'LoadingBoundary', note: '@deprecated：等于不给 pending 的 Loading（Suspense 边界），留一个版本。' },
      { part: 'LoadingView', note: '@deprecated：等于给 phase 的 Loading（只画、不计时），留一个版本。' },
    ],
    states: [
      '500ms 内：什么也不画。',
      '超过 500ms：caption（亮强调色灯 +「加载 <内容> · <来源>」）加点阵骨架；2s：说「仍在加载」。',
      '10s：琥珀条（warn 灯 + 文案 + 重试），骨架留着、降到半透明；没给 onRetry 就没有重试钮。',
      '数据到了：骨架出过的内容用 2px 模糊揭示，没出过的直接出现。',
    ],
    donts: [
      '不要脉冲、不要转圈。',
      '表头与外框已知时保留（header），骨架只占内容区。',
      '不要再拼 LoadingView / LoadingBoundary：一个 Loading 全包了，按 pending 与 phase 选用法。',
      '错误文案每句不超过 12 字，先说怎么办（「点重试」），再说原因。',
    ],
    composition:
      'Loading\n  LoadingWait（计时，内部）\n    caption：Led + 文案 / 琥珀条：Led + 文案 + Button（重试）\n    Skeleton',
    keys: [['Tab', '10 秒后的重试按钮可聚焦；Enter / Space 触发']],
  },
  {
    id: 'measured-skeleton',
    group: 'feedback',
    cardHeight: 340,
    title: 'MeasuredSkeleton 量出来的骨架',
    summary:
      '卡片、文章这类形状复杂的加载占位：用真组件加示例数据在不可见层排一次版，量出每行文字、每张图、每个控件的位置再画骨架，内容到了位置不动。外观与 Skeleton 同色、不闪不脉冲。',
    exports: ['MeasuredSkeleton'],
    propParts: [
      {
        part: 'MeasuredSkeleton',
        note: '包 skullet（MIT，锁精确版本）的 Skeleton，件里不直接引第三方；label 必填，读屏读 role=status。',
      },
    ],
    states: [
      '加载中：不到 500ms 不露骨架条（不可见层照样占位），超过了才出，快的请求不闪。',
      '骨架：每行文字一条 line-200 的圆角条，图片、按钮、标签各一块，圆角跟随内容；不闪、不脉冲。',
      '数据到了：真内容淡入到骨架的位置，onReveal 调一次；给了 id 的下次进来第一帧就是上次的形状。',
    ],
    donts: [
      '示例数据的文字行数、有没有图要和真的一样，否则内容到了会跳。',
      '表格与图表不用它：表格用按行高的 Skeleton，图表自己画占位。',
      '图片要给宽高或 aspect-ratio，否则加载完才有大小，会跳一次。',
    ],
    composition: 'MeasuredSkeleton\n  span role=status（读屏名）\n  skullet Skeleton（不可见层 + 骨架条）',
    keys: [],
  },
  {
    id: 'change-text',
    group: 'quotes',
    cardHeight: 122,
    title: 'ChangeText 涨跌幅',
    summary:
      '百分数的涨跌幅文字，写成「+1.23%」；颜色只读 --pnl-up / --pnl-down，根上设 data-updown="cn" 就互换成红涨绿跌；零不着色。',
    exports: ['ChangeText'],
    propParts: [{ part: 'ChangeText', note: '其余属性透传给 span。四舍五入成 0 的小负数也按「平」处理，不带正负号。' }],
    states: [
      '涨：带 + 号，颜色取 pnl-up；跌：带 - 号，颜色取 pnl-down。',
      '平：舍入到 digits 位后是 0 就不带号、不着色，继承周围的字色。',
      '根元素设 data-updown="cn" 时 pnl-up 与 pnl-down 互换（红涨绿跌），件不用改。',
    ],
    donts: ['不要自己写 is-up、is-down 类去着色。', '不要把已经乘过 100 的值再乘一次。', '没有行情时不要传 0，写 — 。'],
    composition: 'ChangeText（内部：ToneText）',
    keys: [],
  },
  {
    id: 'event-calendar',
    group: 'quant',
    cardHeight: 670,
    title: 'EventCalendar 日历（经济 / 财报 / 分红 / IPO）',
    summary:
      '照 TradingView 日历的布局（主会话 2026-11-15 登录态实测）：导航行（今天、选日期、按周翻页、范围文字、时区读数），周条（周一到周日七张日卡，列出当天各类别条数，点卡选日），类别药丸（经济 / 财报 / 分红 / IPO，给了哪类数据才有哪个），重要性单开关（只看高重要）、经济类别下拉（12 类，单选）、国家选择框（模态：搜索、全球与前 20 预设、按地区分组两列复选、取消 / 应用）。经济表：日期分隔行粘顶、数字列名写在它右侧；同一时间同一国家的事件合并；实际值加粗不上涨跌色；点开一行看说明、来源、历史值小图、下次发布（比 TradingView 多的部分）。财报表：时段图标 + 时间、徽标、代码、公司名，预期 / 实际 EPS 与营收，EPS 意外与营收意外（只有这两列上涨跌色），市值，币种小字，行下可选「财报材料 / 电话会」。分红、IPO 各有自己的列。数据、现在、时区、文字都由调用方传。',
    exports: ['EventCalendar'],
    props: [
      {
        part: 'EventCalendar',
        rows: [
          {
            name: 'events',
            type: 'EconomicEvent[]',
            desc: '经济事件：{ id, at（毫秒）, region, regionName, flag?, name, importance（1–3）, actual?, forecast?, previous?（格式化好的文字）, category?（12 类之一）, regionGroup?（国家框的地区分组）, description?, source?, history?（数字，从旧到新）, nextAt? }。给了说明 / 来源 / 历史值 / 下次发布任一项，这一行才能点开。',
          },
          {
            name: 'earnings / dividends / ipos',
            type: 'EarningsEvent[] / DividendEvent[] / IpoEvent[]',
            desc: '可选；给了哪类就多一个页签。数字都是原值（EPS、营收、市值、每股金额、股息率百分数），件按 formatVolume 等写；财报的实际对预期自己比，高于预期用涨色。分红的 at 是除权日，派息日用 payAt。',
          },
          {
            name: 'labels',
            type: 'EventCalendarLabels',
            desc: '类别、区间、重要程度、国家多选、各类列名、盘前盘后、倒计时、「现在」、详情小标题、日期标题、空态等文字，由调用方传。',
          },
          {
            name: 'now',
            type: 'number',
            desc: '现在（毫秒）：今天 / 本周 / 下周、倒计时与「现在」线从它算；件里不读时钟。',
          },
          {
            name: 'timeZone / locale',
            type: 'string',
            desc: '显示时区（IANA）与语言：分天、时间格式（时间列头带时区缩写）、周起点（周一）都按它。',
          },
          {
            name: 'defaultRange',
            type: "'yesterday' | 'today' | 'tomorrow' | 'week' | 'next'",
            desc: '起始区间，默认今天。',
          },
          { name: 'defaultCategory', type: 'CalendarCategory', desc: '起始类别，默认经济。' },
          {
            name: 'rowActions',
            type: '(event, category) => RowAction[]',
            desc: '悬停或键盘聚焦一行时浮在行尾的图标按钮（RowActions），不占列宽；右键出同一份菜单。',
          },
        ],
      },
    ],
    states: [
      '涨色 / 跌色：只给财报的 EPS 意外与营收意外（正涨色、负跌色，带正负号百分比）；实际值一律只加粗，不上色。',
      '已发布：时间与事件名用亮字；未发布：实际写「—」，还没到点的在下面写倒计时（「45 分后」）。',
      '同一时间同一国家的经济事件合并：时间与国家只在组首行写。',
      '现在线：只在今天那天的经济 / 财报页出现，插在已过与未到的行之间。',
      '行展开：点一行或在行上按 Enter / 空格，详情行在它下面；再点收起。',
    ],
    donts: [
      '不要把橙色用在数据上。',
      '不要在件里写死中文或国家表；文字与国家由调用方传。',
      '没有数据时不要放样本行，传空数组。',
    ],
    composition:
      'EventCalendar\n  导航行：今天 | 选日期 | ‹ › | 范围 | 时区\n  周条：七张日卡\n  类别药丸 | 重要性开关 | 经济类别下拉 | 国家 | 条数\n  table\n    天（rowgroup）：粘顶的日期标题 + 数字列名\n      行：按类别不同的列（行尾悬停浮出 RowActions）\n      现在线（今天）\n      详情行（经济，点开后）/ 动作行（财报）',
    keys: [
      ['Tab', '在行间移动焦点'],
      ['Enter / 空格', '展开或收起有详情的行'],
    ],
  },
  {
    id: 'limit-ladder',
    group: 'quant',
    cardHeight: 690,
    title: 'LimitLadder 连板天梯（A 股专有）',
    summary:
      'A 股专有件（连板、涨停、炸板是 A 股的概念）。按板位从高到低分层的涨停梯队：顶上一行汇总读数（涨停只数、最高板、整体晋级率），下面按层：层头是粗体板位、只数与晋级率（加 2px 细进度条），层间留白；层里列个股：徽标、代码（主）、名称（次）。炸板、跌停、没涨停的文字淡显，状态胶囊保持全亮。数据与文字都由调用方传，件不认数据集。',
    exports: ['LimitLadder'],
    props: [
      {
        part: 'LimitLadder',
        rows: [
          {
            name: 'levels',
            type: 'LadderLevel[]',
            desc: '{ board, promoted?: [已晋级, 候选], items }；件自己按 board 从高到低排。空数组画空态。',
          },
          {
            name: 'levels[].items',
            type: 'LadderItem[]',
            desc: '{ code, name, change（百分数）, firstSeal?, sealAmount?（元，写成 520.00 M）, opens?, industry?, logo?, status }；没有的值写「—」。',
          },
          {
            name: 'labels',
            type: 'LimitLadderLabels',
            desc: '板位单位、晋级率与只数文字、状态名、汇总读数名、列名、读屏名、空态文字，由调用方传。',
          },
          { name: 'selected', type: 'string | null', desc: '选中个股的代码；选中行左侧画 2px 强调条。' },
          {
            name: 'onSelect',
            type: '(item: LadderItem) => void',
            desc: '点击或 Enter / Space 选一行；给出整条（G6 起不再只给代码）。',
          },
          {
            name: 'rowActions',
            type: '(item: LadderItem) => RowAction[]',
            desc: '行快捷操作（#23，一般传 symbolMenu(...)）：悬停或键盘落到这一行时右端浮出前三颗带图标的按钮，右键、菜单键、Shift+F10 出整份菜单。不传就没有。按钮条与菜单的读屏名取 labels.rowActions、labels.rowMenu（可选，省略用英文）。',
          },
        ],
      },
    ],
    states: [
      '封住：状态标签取涨色（pnl-up，data-updown 互换时跟着换）。',
      '炸板：文字 55% 不透明，胶囊琥珀、全亮。跌停：文字淡显，胶囊跌色。没涨停：文字淡显，胶囊灰。',
      '选中：行底 6.5% 白，左侧 2px 强调条。',
    ],
    donts: [
      '不要把橙色用在数据上，它只给选中条。',
      '不要在件里写死中文或数据集字段；文字与数据由调用方传。',
      '没有数据时不要放样本行，传空数组。',
    ],
    composition:
      'LimitLadder\n  汇总读数（涨停 | 最高板 | 晋级率）\n  列头\n  listbox\n    层（group）：板位（粗体）| 单位 | 只数 | 晋级率 + 细条\n      行（option）：徽标 + 代码 + 名称 | 涨跌幅 | 首封 | 封单额 | 开板 | 行业 | 状态标签',
    keys: [
      ['↑ / ↓', '在行间移动焦点'],
      ['Enter / Space', '选中当前行'],
    ],
  },
  {
    id: 'market-heatmap',
    group: 'quant',
    cardHeight: 700,
    title: 'MarketHeatmap 市场热力图（跨市场共用）',
    summary:
      '照 TradingView 的股票热力图：格子面积是所选的大小指标（市值、成交额或等大），颜色是所选指标落在七档色阶的哪一档，按行业分组或平铺。顶上一行汇总读数（只数、上涨、下跌），工具条用分段控件切大小、颜色、视图；点组名放大到只看这一组（面包屑返回，Esc 也行）；悬停出这只票的价格与各项读数；底部图例写出每一档的值边界，点一档就隐藏这一档的格子。A 股、港股、美股、加密共用，只换数据与分组；不认数据集，品种、指标、文字都由调用方传。排布与着色档用包里矩形树图的 layoutTreemap、colorStep。',
    exports: ['MarketHeatmap'],
    props: [
      {
        part: 'MarketHeatmap',
        note: '放在 PanelFrame 里用，件自己撑满容器的高度（排布按真实像素算，随容器改变重排）。',
        rows: [
          {
            name: 'items',
            type: 'HeatmapItem[]',
            desc: '{ symbol, name, group?, logo?, price?, size: Record<键, number>, value: Record<键, number | null> }（旧名 code 留一个版本，@deprecated）。size 里不是正数的格子不画；value 是 null 画成灰（没有数）；没有 group 的品种归到 labels.other，所有品种都没有 group 就不分组、也不出视图切换。',
          },
          {
            name: 'sizeBy',
            type: 'HeatmapSizeBy[]',
            desc: '大小指标：{ key, label, equal?, format? }。key 对 item.size 的键；equal 为真是等大，不读 size；format 不给用 formatVolume。',
          },
          {
            name: 'colorBy',
            type: 'HeatmapColorBy[]',
            desc: '着色指标：{ key, label, unit?, digits?, format?, step? }。key 对 item.value 的键。step 是一档的宽（指标的单位），不给就按这批值的最大绝对值除以 3 再向上取到好数，载入与切指标时重算；写 1 就是 ±3%。',
          },
          {
            name: 'labels',
            type: 'MarketHeatmapLabels',
            desc: '工具条、面包屑、汇总读数、悬停卡片、图例读屏名、空态的文字，由调用方传。',
          },
          {
            name: 'defaultSizeBy / defaultColorBy',
            type: 'string',
            desc: '一开始用哪个大小、着色指标；默认各自的第一个。',
          },
          { name: 'defaultGrouped', type: 'boolean', default: 'true', desc: '一开始分不分组（有分组数据时）。' },
          {
            name: 'scheme',
            type: "'classic' | 'mono'",
            default: "'classic'",
            desc: '配色。classic 涨跌色（跟 data-updown 互换）加中性灰；mono 同一灰阶从暗到亮。色盲友好第二步做。',
          },
          { name: 'formatPrice', type: '(value: number) => string', desc: '悬停卡片上的价格写法；不给写 2 位小数。' },
          { name: 'selected', type: 'string | null', desc: '选中的代码；选中的格子画 2px 白色内圈。' },
          { name: 'onSelect', type: '(symbol: string) => void', desc: '点格子，或焦点在格子上按 Enter / Space。' },
          {
            name: 'cellActions',
            type: '(item: HeatmapItem) => RowAction[]',
            desc: '格子的右键菜单（#23，一般传 symbolMenu(...)）：右键、菜单键、Shift+F10 出同一份品种菜单。格子小，不画悬停按钮。读屏名取 labels.cellMenu（可选）。不传就没有。',
          },
          {
            name: 'labels.display',
            type: 'HeatmapDisplayLabels',
            desc: '给了，工具条多三个显示开关（照 TradingView 热图，主会话 2026-11-15 实测）：Logo 开关、标题（无 / 代码 / 全名）、格内数值（无 / 价格 / 当前大小指标的值 / 着色指标的读数）。不给格子照旧。',
          },
          {
            name: 'labels.fullscreen',
            type: 'string',
            desc: '给了，工具条最右出全屏钮（容器 requestFullscreen），字是读屏名与提示。',
          },
        ],
      },
    ],
    states: [
      '色阶七档（−3…+3）：档 0 是以零为中心的中性灰，边界在 (k ± 0.5) × 档宽；最外两档一头开口。',
      '格子够大才写字：宽 ≥ 40、高 ≥ 24 写代码，高 ≥ 40 再写一行读数；更小的靠悬停。字色按底色亮度现算黑白。',
      '图例点一档：这一档的格子隐藏（位置保留，不重排），色块变淡、边界值划线；再点恢复。切着色指标时全部恢复。',
      '放大：只剩这一组，大小与颜色设置保留；面包屑的「全部」或 Esc 返回。',
    ],
    donts: [
      '不要在件里写死中文、币种或数据集字段；指标、单位、文字都由调用方传。',
      '没有数据时传空数组，件画空态，不要放样本格子。',
      '不要用橙色表示数据；这件里没有橙色。',
    ],
    composition:
      'MarketHeatmap（figure）\n  汇总读数（只数 | 上涨 | 下跌）+ 面包屑\n  工具条（大小 | 颜色 | 视图，分段控件）\n  图（group）\n    组块（组名按钮）\n      格子（button：代码 + 读数）\n    悬停卡片（徽标 + 代码 + 名称；价格、各着色指标、大小指标、分组）\n  图例（七个按钮：色块 + 档中心值）',
    keys: [
      ['Tab', '在组之间走（每组一个停靠点，组名按钮也是）'],
      ['← → ↑ ↓', '在组内的格子间走，焦点所在格子出悬停卡片'],
      ['Enter / Space', '选中当前格子'],
      ['Esc', '放大状态下返回全部'],
    ],
  },
  {
    id: 'metric-card',
    group: 'quotes',
    cardHeight: 780,
    title: 'MetricCard 指标卡与卡片墙（跨市场共用）',
    summary:
      '报价类读数卡的共用壳（2026-11-18）：variant="card" 照 uiarc 的 Metric explorer 的结构，variant="tile" 是 KPI 瓦片（原 SparkTile）。卡：标题、大号当前值、较前日 / 周 / 月 / 年的变化（涨跌色）、迷你走势线（1 月 / 3 月 / 6 月 / 1 年分段）、可选阶段带（五档边界与文案由调用方给）、来源与更新时间一行；MetricCardGrid 把卡排成墙。组件只画不算，数据与文字都由调用方传，没有数据就是空态。',
    exports: ['MetricCard', 'MetricCardGrid', 'metricTrendTone', 'metricStageIndex'],
    props: [
      {
        part: 'MetricCard',
        rows: [
          {
            name: 'variant',
            type: "'card' | 'tile'",
            default: "'card'",
            desc: 'card 是完整指标卡；tile 是 KPI 瓦片（原 SparkTile，字段见 SparkTile 页）。',
          },
          {
            name: 'label / value / unit',
            type: 'string / string | null / string',
            desc: '标题（旧名 title）、已格式化的当前值（没有数据传 null，写 —）、数值后的小字。',
          },
          {
            name: 'changePct / changes',
            type: 'number / MetricChange[]',
            desc: 'changePct 一个变化（百分数）；changes 多个：{ id, label, value（百分数，null 写 —） }，涨跌色带箭头。',
          },
          {
            name: 'series / ranges',
            type: 'number[] / MetricRange[]',
            desc: 'series 一段走势；ranges 多段：{ id, label, values }（从旧到新），多于一段时出分段控件。',
          },
          {
            name: 'range / defaultRange / onRangeChange',
            type: 'string / string / (key) => void',
            desc: '当前段；不给就内部管。',
          },
          {
            name: 'trendTone',
            type: "'direction' | 'neutral' | 'inverse'",
            desc: '走势线着色：direction 头尾涨跌（默认）；neutral 中性灰白（恐惧贪婪、情绪分这类没有好坏方向的）；inverse 涨是坏（如 VIX），涨取跌色。',
          },
          {
            name: 'labels',
            type: '{ range?, spark }',
            desc: '分段控件与走势线的读屏名（整句；旧名 rangeLabel / sparkLabel）。',
          },
          {
            name: 'stages / current',
            type: 'MetricStage[] / number',
            desc: '阶段带：{ label, from, to } 从低到高，current 是当前值；所在档全亮、其余 35%，带上一根竖线标当前，下面写档名。',
          },
          { name: 'source / updatedAt', type: 'ReactNode', desc: '来源与更新时间，底部一行。' },
        ],
      },
      {
        part: 'MetricCardGrid',
        rows: [
          { name: 'label', type: 'string', desc: '整墙的读屏名。' },
          {
            name: 'ranges / range / defaultRange / onRangeChange / rangeLabel',
            type: '{ id, label }[] / string / string / (id) => void / string',
            desc: '共用区间分段，放在墙顶一次；传了它卡片不再各画分段控件，都按这个 id 取自己 ranges 里同 id 的一段。',
          },
          { name: 'minWidth', type: 'number', desc: '每张卡最小宽（px），默认 260；一行几张由容器宽决定。' },
        ],
      },
      {
        part: 'metricTrendTone(trend, values) / metricStageIndex(stages, value)',
        note: '纯函数，跟件里用的同一份。metricTrendTone：按 trendTone 与走势线头尾给 up / down / flat（neutral 恒为 flat，inverse 涨跌色互换）。metricStageIndex：当前值落在第几档（最后一档含上界），没有值或落在所有档外返回 -1。',
        rows: [],
      },
    ],
    states: [
      '变化与走势线用涨跌色（跟 data-updown）；走势线颜色按所选区间的头尾涨跌。',
      '阶段带从跌色经灰到涨色，当前档全亮；档名写在带下面，不只靠颜色。',
      '没有数据：数值写 —，变化写 —，线的位置写 —，不画样本。',
      'variant="tile"：DOM 与样子同原 SparkTile（k-spark-tile*），数值一格与卡共用 ReadoutValue（— / 闪色 / 滚轮 / 单位）。',
    ],
    donts: [
      '不要在件里算指标、写死中文或写死阶段边界；都由调用方传。',
      '不要再新写 SparkTile：用 MetricCard variant="tile"，SparkTile 只是兼容的旧名。',
      '不要把阶段带当买卖信号；它只是读数落在哪一档。',
      '不要用橙色或蓝色画数据。',
    ],
    composition:
      'MetricCardGrid\n  MetricCard\n    标题 | 分段控件（ToggleGroup）\n    当前值\n    变化（ChangeText）\n    走势线（Sparkline）\n    阶段带\n    来源 · 更新时间',
    keys: [['Tab', '到分段控件（← → 移动，Space / Enter 选）']],
  },
  {
    id: 'distribution-bars',
    group: 'quant',
    cardHeight: 220,
    title: 'DistributionBars 分档分布柱',
    summary:
      '把一批品种按涨跌幅分成 9 或 11 档（跌停…涨停），每档一根柱，柱顶标家数，底部一行汇总（涨 x / 平 y / 跌 z）。档的边界、档名与汇总的名字都由调用方传，件只按家数画柱、按色调汇总；没有数据显示空态，不画样本。',
    exports: ['DistributionBars', 'distributionTotals', 'distributionBarHeight'],
    propParts: [
      { part: 'DistributionBars', note: '示例数据写死在页里，不是行情。柱高按最大档归一，有家数的至少 1px。' },
      { part: 'distributionTotals', note: '纯函数：各色调（up / muted / down）的家数之和，汇总行用它。' },
      { part: 'distributionBarHeight', note: '纯函数：柱高（px），按最大档归一并扣掉柱顶那一行。' },
    ],
    states: [
      '有数据：每档一列，柱色跟档的色调（up / down / muted / accent），柱顶是家数。',
      '某档没有数（count 为 null）：不画柱，柱顶写「—」。',
      '汇总：给了 totals 才有，按 up / muted / down 的次序，没写名字的项不出现。',
      '没有数据（空数组或全是 null）：只写 empty 的字，不画样本。',
    ],
    donts: [
      '不要给柱传色值：只选色调名。',
      '不要在包里写档名或汇总的字：都由调用方传。',
      '不要用它画连续分布（直方图拖区间用 RangeHistogramSlider）：它画的是已经分好档的家数。',
    ],
    composition: 'DistributionBars\n  柱区（每档：家数 + 柱）\n  档名行\n  汇总行',
    keys: [],
  },
  {
    id: 'rating-text',
    group: 'quotes',
    cardHeight: 140,
    title: 'RatingText 五档评级',
    summary:
      '分析师评级、技术评级结论的单元格写法：图标加文字，强力买入双上箭头、买入单上箭头、中性等号、卖出单下箭头、强力卖出双下箭头；买入档取涨色、卖出档取跌色（跟 data-updown），中性不着色。照 TradingView 选股器「分析师评级」列（主会话 2026-11-15 登录态实测），实现原创。放进 DataGrid 的 custom 列里用（见 FilterBar 页的选股器）。',
    exports: ['RatingText'],
    props: [
      {
        part: 'RatingText',
        note: '其余属性透传给 span。',
        rows: [
          { name: 'level', type: "'strong-sell' | 'sell' | 'neutral' | 'buy' | 'strong-buy'", desc: '五档。' },
          { name: 'children', type: 'string', desc: '档名，由调用方传（包里不带语言）。' },
        ],
      },
    ],
    states: [
      '买入、强力买入：涨色；卖出、强力卖出：跌色；中性：继承周围字色。',
      '方向不只靠颜色：图标一至两层箭头表示强弱。',
    ],
    donts: [
      '不要自己拼箭头字符着色；用这个件，涨跌色才会跟 data-updown。',
      '不要只写档名不给图标：方向与强弱靠箭头层数，不只靠颜色。',
      '不要拿它写涨跌幅：那是 ChangeText。',
    ],
    composition: 'RatingText（内部：lucide 图标）；放在 DataGrid 的 custom 列 cell 里',
    keys: [],
  },
  {
    id: 'technical-rating',
    group: 'quotes',
    cardHeight: 780,
    title: 'TechnicalRating 技术评级仪表（跨市场共用）',
    summary:
      '照 TradingView 技术页（2026-11-15 实测）：顶上十个时间周期（选中是灰底胶囊），三个半圆仪表（振荡指标、总评、均线，总评居中放大；弧两端取涨跌色、中段灰；刻度字只写中间三档），指针按 −1…1 的分数转到所在档（分界 −0.5、−0.1、0.1、0.5），下面是档名大字、圆角三列「卖 / 中性 / 买」计数框与指标总数；再下面每组一张并排明细表（名称、读数、结论文字上色，标题带「›」），最底下是整宽的 Pivots 表（R3…S3 × Classic、Fibonacci、Camarilla、Woodie、DM，缺值「—」）。组件只画不算：分数、个数、读数与结论都由调用方传；档名、列名、免责一句也由调用方传，件只留位置。颜色走涨跌语义色与中性灰，不用橙色。放在 PanelFrame 里用。',
    exports: ['TechnicalRating'],
    props: [
      {
        part: 'TechnicalRating',
        rows: [
          {
            name: 'groups',
            type: 'RatingGroup[]',
            desc: '{ key, label, value（−1…1）, counts: { sell, neutral, buy } }；通常三组。空数组画空态。',
          },
          {
            name: 'rows',
            type: 'RatingRow[]',
            desc: '指标明细：{ key, name, group?（对 groups 的 key，按组分节）, reading?（写好的文字，没有写「—」）, verdict }；不给就只画仪表。',
          },
          {
            name: 'labels',
            type: 'TechnicalRatingLabels',
            desc: '五档名（从卖到买）、卖 / 中性 / 买、指标总数文字、列名、周期控件与整件的读屏名、空态文字。',
          },
          {
            name: 'primary',
            type: 'string',
            desc: '放大居中的那一组的 key；不给取中间那一组。窄于 440px 时它独占一行。',
          },
          {
            name: 'timeframes / value / onValueChange',
            type: 'TechnicalRatingTimeframe[] / string / (value) => void',
            desc: '时间周期分段控件的选项、当前值与回调（旧名 timeframe / onTimeframeChange）；不给 timeframes 就没有这一条。切周期后传新的 groups 与 rows。',
          },
          { name: 'disclaimer', type: 'ReactNode', desc: '免责一句，画在仪表与明细之间；不给就不画。' },
          {
            name: 'pivots',
            type: 'PivotTable',
            desc: '{ title, columns: string[], rows: { key, label, values: (string | null)[] }[] }；整宽的枢轴点表，放在明细表下面；值由调用方算好，缺的传 null 画「—」。不给就不画。',
          },
        ],
      },
    ],
    states: [
      '档：分数小于 −0.5 强卖，−0.5 到 −0.1 卖，−0.1 到 0.1 中性，0.1 到 0.5 买，大于 0.5 强买；正好落在 ±0.1 算中性，落在 ±0.5 算卖 / 买。分数 −1 指针在最左，1 在最右，0 竖直。',
      '所在档的弧全亮，其余弧 30% 不透明；指针与亮档用 gentle 弹簧过渡。总评只写中间三档的刻度字（两端靠弧色与大字），小仪表不画刻度字。弧：两端涨跌色，中段灰。',
      '明细行悬停整行提亮；结论是纯文字上色，不带底色（买取涨色、卖取跌色、中性灰），涨跌色跟 data-updown。',
    ],
    donts: [
      '不要把评级当买卖建议；免责一句由调用方写，别删这个位置。',
      '不要在件里算评级或写死中文；分数、个数、文字都由调用方传。',
      '没有数据时传空数组，件画空态，不要放样本读数。',
    ],
    composition:
      'TechnicalRating（group）\n  时间周期（分段控件）\n  仪表（figure ×3）：组名 | 半圆五档弧 + 刻度字 + 指针 | 档名 | 三列计数框（卖 / 中性 / 买）| 共 n 项指标\n  免责一句\n  明细表（每组一张 section）：标题 › | 列头 | 行（指标 | 读数 | 结论）\n  Pivots 表（section）：列头 | 行（R3…S3）',
    keys: [['Tab', '依次到周期控件的按钮（← → 在其中移动，Space / Enter 选）']],
  },
  {
    id: 'pnl-text',
    group: 'quotes',
    cardHeight: 70,
    title: 'PnlText 盈亏',
    summary: '盈亏文字：字由调用方格式化好（币种、位数、符号都由调用方定），本件只按方向着色，颜色规则同 ChangeText。',
    exports: ['PnlText'],
    propParts: [{ part: 'PnlText', note: '其余属性透传给 span。' }],
    states: ['盈：pnl-up；亏：pnl-down；零或没有值：不着色。', '亏损额写成正数时传 tone="down"。'],
    donts: ['不要在件里拼币种与位数，由调用方传。', '不要用颜色以外没有符号或箭头的写法表达盈亏。'],
    composition: 'PnlText（内部：ToneText）',
    keys: [],
  },
  {
    id: 'decimal-field',
    group: 'forms',
    cardHeight: 300,
    title: 'DecimalField 十进制框',
    summary:
      '价格、数量的输入框：值是十进制字符串（不经浮点），按品种的最小变动价位或最小下单量走一格；右边可选 − / + 两个图标按钮，↑ / ↓ 走一格、Shift 十格。',
    exports: ['DecimalField'],
    props: [
      {
        part: 'DecimalField',
        note: '其余属性透传给里面的 input（不含 type、step、size）；className 落在最外层。',
        rows: [
          { name: 'value', type: 'string', desc: '框里的字，十进制写法；打字自由，合不合法由调用方与 Gateway 判。' },
          {
            name: 'onValueChange',
            type: '(value: string) => void',
            desc: '打字与走格都回调；走格给的是 toFixed() 的规范字符串。旧名 onValue 留一个版本（@deprecated）。',
          },
          {
            name: 'step',
            type: 'string',
            desc: '一格有多大（最小变动价位或最小下单量）；"0" 按 1 走。不给用户设步长。',
          },
          {
            name: 'base',
            type: 'string | null',
            default: 'null',
            desc: '空框走格从哪起（例：最新价）；没有就空框不动。',
          },
          { name: 'label', type: 'string', desc: '读屏名（必填：包里没有文字）。' },
          { name: 'unit', type: 'string', desc: '框里右侧的单位后缀，不可点。' },
          { name: 'placeholder', type: 'string', desc: '空框时的占位字。' },
          { name: 'disabled', type: 'boolean', default: 'false', desc: '灰掉：不能打字，方向键与按钮都不动它。' },
          { name: 'readOnly', type: 'boolean', default: 'false', desc: '能选能复制，方向键与按钮都不改值。' },
          {
            name: 'status',
            type: "'error' | 'warning'",
            desc: 'error：aria-invalid 并换危险色边；warning：只换琥珀色边，不设 aria-invalid。',
          },
          {
            name: 'labels',
            type: 'DecimalFieldLabels',
            desc: '{ decrease, increase }：给了才显示 − / + 按钮；两个字符串是读屏名，也是悬停提示。包里不带语言。旧名 buttons 留一个版本（@deprecated）。',
          },
        ],
      },
    ],
    states: [
      '默认：打字自由；↑ / ↓ 走一格，Shift 十格；空框从 base 起，不在格子上的第一格先往走的方向对齐。',
      '走到 0 或以下、框里不是十进制写法：不动。',
      '只读、禁用：方向键与 − / + 都不改值；禁用还不能打字。',
      'error：aria-invalid=true；warning：只换边色，读屏不报无效。',
    ],
    donts: [
      '不要把值转成 number 再传：价格与数量不经浮点。',
      '不要在包里写按钮文字，labels 由调用方传。',
      '不要在这里校验价位：在不在格子上由调用方与 Gateway 判。',
    ],
    composition: 'DecimalField\n  Input\n  Button（icon，− / +，带悬停提示）\n  stepDecimal（format 子出口）',
    keys: [
      ['↑ / ↓', '加或减一格'],
      ['Shift + ↑ / ↓', '十格'],
      ['Tab', '从输入框到 − 再到 +；Enter / Space 触发按钮'],
    ],
  },
  {
    id: 'quant-format',
    group: 'quant',
    cardHeight: 120,
    title: 'format 格式化函数',
    summary:
      '价格、涨跌幅、数量的写法（纯函数，不带 React；另有 @katana-ui/react/quant/format 出口给画布与 Worker）。小数位由调用方传，不在这里猜。',
    exports: [
      'AUTO_SIZE',
      'compactParts',
      'decimalsOfTick',
      'formatCompact',
      'formatCount',
      'formatPercentChange',
      'formatPrice',
      'formatQuantity',
      'formatVolume',
      'stepDecimal',
      'toneOf',
    ],
    propParts: [
      {
        part: 'formatPrice(value, { precision, tick, fallback })',
        symbol: 'formatPrice',
        note: '千分位固定 en-US；不是有限数写 —。',
      },
      {
        part: 'decimalsOfTick(tick)',
        symbol: 'decimalsOfTick',
        note: '1e-8 在 String() 里是科学计数，拆开尾数与指数数位。',
      },
      {
        part: 'formatPercentChange(value, digits) / toneOf(value, digits)',
        symbol: 'formatPercentChange',
        note: '都先四舍五入再定符号与方向。',
      },
      {
        part: 'formatQuantity / formatCount / formatCompact / compactParts / AUTO_SIZE',
        symbol: 'formatQuantity',
        note: '数量的缩写（K / M / B）与千分位；单位 base 是币量、usd 带 $。',
      },
      {
        part: 'formatVolume(value)',
        note: '列表里的量与金额（照 TradingView 涨幅榜页，2026-11-15 读）：835.49 K、2.95 M、7.29 B，两位小数、数字与单位之间空一格；不到 1,000 取整；不带币种符号。',
      },
    ],
    states: [
      'formatPrice：定了小数位就恒写这么多位；不是有限数写 —。',
      'formatPercentChange 与 toneOf 先舍入再定符号与方向：舍入成 0 的小负数是「平」。',
    ],
    donts: ['不要在格式化函数里猜品种的精度，由调用方传 precision 或 tick。', '不要自己拼千分位。'],
    composition:
      'formatPrice\n  decimalsOfTick\nformatPercentChange\ntoneOf\nformatQuantity\n  formatCount\nformatCompact\n  compactParts\nformatVolume',
    keys: [],
  },
  {
    id: 'toast',
    group: 'feedback',
    cardHeight: 135,
    title: 'Toast 弹出提示',
    summary:
      '固定在窗口一角的弹出提示：只管样子与读屏语义（live region），条目表、定时、暂停由调用方管（应用里 AlertToasts 配 toast-queue.ts）。进出走 translate 与不透明度的过渡。',
    exports: [
      'TOAST_EXIT_MS',
      'Toast',
      'ToastClear',
      'ToastClose',
      'ToastContent',
      'ToastDescription',
      'ToastIcon',
      'ToastText',
      'ToastTitle',
      'ToastViewport',
    ],
    propParts: [
      {
        part: 'ToastViewport',
        note: '其余属性透传给 div。role=region、aria-live=assertive：新插进来的条目读屏马上读；aria-label 由调用方给。',
      },
      {
        part: 'Toast',
        note: '其余属性透传给 div。过渡的起点与终点由 data-starting-style、data-ending-style 给（phase 换的）。tone（Severity）定色条与图标的颜色，neutral 是主文字色色条加强调色图标。',
      },
      { part: 'ToastClose', note: '其余属性透传给 Button（icon 变体）。' },
      {
        part: 'ToastClear / ToastIcon / ToastText / ToastTitle / ToastDescription / ToastContent',
        symbol: 'ToastClear',
      },
    ],
    states: [
      '进入：从边上平移加淡入（phase=entering 画一帧再切 open）。',
      '收起：反向平移淡出，播完（TOAST_EXIT_MS）调用方再摘节点。',
      '多条：按位置叠，两条以上出「全部关掉」。',
      '语气：neutral（默认）、ok、warn、danger，色条与图标取 --k-status-*-foreground；说明文字是 ink-2（console 主题下 ink-3 不到 4.5:1）。',
    ],
    donts: [
      '不要把需要用户处理的事只放在弹出提示里，它会自己消失。',
      '不要只靠色条说语气：标题里写明（「下单被拒」而不是「出错了」）。',
      '不要在包里写死文案，关闭名与「全部关掉」都由调用方传。',
      '不要自己再做一套计时与队列放进 Toast，那是调用方的事。',
    ],
    composition:
      'ToastViewport\n  Toast\n    ToastContent\n      ToastIcon\n      ToastText\n        ToastTitle\n        ToastDescription\n      ToastClose\n  ToastClear',
    keys: [
      ['Tab', '走到关闭钮、「全部关掉」'],
      ['Enter / Space', '关掉这一条或全部'],
    ],
  },
  {
    id: 'alert',
    group: 'feedback',
    cardHeight: 288,
    title: 'Alert 行内提示',
    summary: '嵌在页面里的一条说明（弹出的提示是 Toast）：左边一道 2px 色条标语气，第一个子元素是 svg 时当图标。',
    exports: ['Alert', 'AlertDescription', 'AlertTitle', 'alertVariants'],
    propParts: [
      { part: 'Alert', note: '其余属性透传给 div。语气不能只靠颜色：标题或说明里要写字。' },
      { part: 'AlertTitle / AlertDescription', symbol: 'AlertTitle', note: '都是 div。' },
    ],
    states: [
      'tone 是 Severity：neutral（默认）、ok 是 role=status；warn、danger 是 role=alert。旧名 default 等于 neutral。',
      '左边 2px 色条与图标取 --k-status-<tone>-foreground；neutral 的色条是 --k-status-neutral-bold-borderColor（22% 白）。',
    ],
    donts: [
      '不要用它代替弹出提示：Alert 是页面里一直在的说明。',
      '不要给一直在页面里的 Alert 保留 role=alert，传 role=note。',
      '不要只靠颜色区分语气，标题要写明。',
    ],
    composition: 'Alert\n  svg（图标，可选）\n  AlertTitle\n  AlertDescription',
    keys: [],
  },
  {
    id: 'progress',
    group: 'feedback',
    cardHeight: 126,
    title: 'Progress 进度条',
    summary: '4 高的细条，填充走 snappy 弹簧滑到新位置；不知道进度（不给 value）是一块来回滑的不确定条。',
    exports: ['Progress'],
    propParts: [{ part: 'Progress', note: '其余属性透传给 Radix Progress.Root。读屏要一个名字：传 aria-label。' }],
    states: [
      '确定：按 value 填充，aria-valuenow 跟值。',
      '不确定：value 缺省，来回滑动的条，不带 aria-valuenow。',
      'tone（Severity）：neutral（默认，亮中性）、ok、warn、danger 换填充颜色；旧名 default 等于 neutral。',
    ],
    donts: ['不要在不知道进度时传一个假的 value。', '不要用它表示库存或额度的满格，用 Meter。', '不要省掉可访问名。'],
    composition: 'Progress\n  （内部：Progress.Indicator）',
    keys: [],
  },
  {
    id: 'sheet',
    group: 'overlays',
    cardHeight: 62,
    title: 'Sheet 抽屉',
    summary:
      '贴着窗口一边滑出来的面板，行为同对话框（Radix Dialog）：Esc 关、焦点锁在里面、点背板关、关了焦点回打开前拿着它的元素。左右宽 360，上下最高半屏。',
    exports: [
      'Sheet',
      'SheetBody',
      'SheetClose',
      'SheetContent',
      'SheetDescription',
      'SheetFooter',
      'SheetHeader',
      'SheetOverlay',
      'SheetPortal',
      'SheetTitle',
      'SheetTrigger',
      'sheetVariants',
    ],
    propParts: [
      { part: 'Sheet', note: '其余属性透传给 Radix Dialog.Root。' },
      {
        part: 'SheetContent',
        note: '其余属性透传给 Radix Dialog.Content。要有 SheetTitle（读屏靠它报名字），不想显示就加 sr-only。',
      },
      { part: 'SheetHeader / SheetBody / SheetFooter / SheetTitle / SheetDescription', symbol: 'SheetHeader' },
    ],
    states: [
      '关闭、打开：从所在边滑入滑出，遮罩淡入淡出。',
      'side：right、left 宽 360，top、bottom 最高半屏。',
      '焦点锁在里面，关了回到打开前拿着焦点的元素。',
    ],
    donts: ['不要拿它当确认框，要用户裁决的事用 Dialog。', '不要不带标题与说明，读屏要用。', '不要在抽屉里再开抽屉。'],
    composition:
      'Sheet\n  SheetTrigger\n  SheetContent\n    SheetHeader\n      SheetTitle\n      SheetDescription\n    SheetBody\n    SheetFooter\n      SheetClose',
    keys: [
      ['Tab', '焦点在抽屉里走一圈，不会出去'],
      ['Esc', '关闭，焦点回触发器'],
    ],
  },
  {
    id: 'hover-card',
    group: 'overlays',
    cardHeight: 50,
    title: 'HoverCard 悬停卡',
    summary:
      '指针停在触发器上（或键盘焦点到了它）弹出的一小块补充信息，跟弹层同一块材质；延迟用 Radix 默认（700ms 开、300ms 关）。卡里不放必须操作的东西。',
    exports: ['HoverCard', 'HoverCardContent', 'HoverCardTrigger'],
    propParts: [
      { part: 'HoverCard', note: '其余属性透传给 Radix HoverCard.Root。openDelay、closeDelay 在这里改。' },
      { part: 'HoverCardContent', note: '其余属性透传给 Radix HoverCard.Content。' },
    ],
    states: ['悬停约 700ms 后出，移开约 300ms 后收；键盘焦点到触发器也出。', 'Esc 收起。'],
    donts: [
      '不要把必须读到的信息只放在悬停卡里，触屏没有悬停。',
      '不要放可点的主要操作，用 Popover。',
      '不要放太长的内容，它是补充。',
    ],
    composition: 'HoverCard\n  HoverCardTrigger\n  HoverCardContent',
    keys: [
      ['Tab', '焦点到触发器时卡也出来'],
      ['Esc', '收起'],
    ],
  },
  {
    id: 'command',
    group: 'overlays',
    cardHeight: 375,
    title: 'Command 命令面板',
    summary:
      '一个输入框加一串过滤出来的行：焦点一直在输入框里，↑↓ 移动高亮，回车选中。底座是 cmdk（过滤、键盘、分组）；自己排名的传 shouldFilter={false}。',
    exports: [
      'Command',
      'CommandDialog',
      'CommandEmpty',
      'CommandGroup',
      'CommandInput',
      'CommandItem',
      'CommandList',
      'CommandSeparator',
      'CommandShortcut',
    ],
    propParts: [
      { part: 'Command', note: '其余属性透传给 cmdk 的 Command（shouldFilter、filter、loop、value、onValueChange）。' },
      { part: 'CommandItem', note: '其余属性透传给 cmdk 的 Item。aria-selected 说的是当前高亮，不是已选。' },
      { part: 'CommandDialog', note: '其余属性透传给 Dialog。' },
      {
        part: 'CommandInput / CommandList / CommandEmpty / CommandGroup / CommandSeparator / CommandShortcut',
        symbol: 'CommandInput',
      },
    ],
    states: [
      '有输入：按行的 value 与 keywords 过滤；没有匹配显示 CommandEmpty。',
      '高亮行 data-selected，aria-selected 说的是高亮不是已选。',
      'shouldFilter=false：由调用方自己排名，行序照传入的。',
    ],
    donts: [
      '不要不传 label 或标题，输入框需要可访问名。',
      '不要拿它当长表单的下拉，用 Combobox 或 Select。',
      '不要在包里写占位与空态文字，由调用方传。',
    ],
    composition:
      'Command\n  CommandInput\n  CommandList\n    CommandEmpty\n    CommandGroup\n      CommandItem\n        CommandShortcut\n    CommandSeparator',
    keys: [
      ['↑ ↓', '移动高亮（首尾相接）'],
      ['Home / End', '跳到首项、末项'],
      ['Enter', '执行高亮的那一行'],
      ['打字', '过滤；没有匹配显示 CommandEmpty'],
      ['Esc', '（在 CommandDialog 里）关闭，焦点回打开前拿着它的元素'],
    ],
  },
  {
    id: 'combobox',
    group: 'forms',
    cardHeight: 104,
    title: 'Combobox 可搜索下拉',
    summary:
      'Popover 加 Command 拼出来：触发器跟单选下拉一个样，打开后焦点在搜索框，打字过滤，回车选中。单选选了就收（受控 open），多选不收；每行用 selected 画勾。',
    exports: [
      'Combobox',
      'ComboboxContent',
      'ComboboxEmpty',
      'ComboboxGroup',
      'ComboboxInput',
      'ComboboxItem',
      'ComboboxList',
      'ComboboxTrigger',
    ],
    propParts: [
      { part: 'Combobox', note: '其余属性透传给 Radix Popover.Root。open、onOpenChange 受控。' },
      { part: 'ComboboxContent', note: '其余属性透传给 Radix Popover.Content。宽跟触发器一样（最窄 220）。' },
      { part: 'ComboboxItem', note: '同 CommandItem。' },
      {
        part: 'ComboboxTrigger / ComboboxInput / ComboboxList / ComboboxEmpty / ComboboxGroup',
        symbol: 'ComboboxTrigger',
      },
    ],
    states: [
      '关闭：触发器 role=combobox，aria-expanded=false。',
      '打开：焦点在搜索框，列表可过滤。',
      '单选：选中后收起；多选：点一项不收，触发器写已选个数。',
      '已选的行 data-checked 且前面有勾。',
    ],
    donts: [
      '不要少于十来项就用它，少的用 Select。',
      '不要忘了给搜索框与列表传 label。',
      '行的 aria-selected 是高亮不是已选，已选用 selected。',
    ],
    composition:
      'Combobox\n  ComboboxTrigger\n  ComboboxContent\n    ComboboxInput\n    ComboboxList\n      ComboboxEmpty\n      ComboboxItem',
    keys: [
      ['Enter / Space / ↓', '在触发器上打开；焦点落在搜索框'],
      ['打字', '过滤'],
      ['↑ ↓', '移动高亮'],
      ['Enter', '选中'],
      ['Esc', '收起，焦点回触发器'],
    ],
  },
  {
    id: 'separator',
    group: 'layout',
    cardHeight: 117,
    title: 'Separator 分隔线',
    summary: '1px 的线，取 line 色（跟菜单里的分隔线一条白线）；默认只是装饰，读屏不报。',
    exports: ['Separator'],
    propParts: [{ part: 'Separator', note: '其余属性透传给 Radix Separator.Root。' }],
    states: ['横：1px 高；竖：1px 宽，取 line 色。', 'decorative 默认真，读屏不报；decorative=false 才是 separator。'],
    donts: ['不要用它占位留白，用间距。', '不要在读屏需要知道分组的地方用装饰分隔，改 decorative=false 或用分组标题。'],
    composition: 'Separator',
    keys: [],
  },
  {
    id: 'scroll-area',
    group: 'layout',
    cardHeight: 181,
    title: 'ScrollArea 滚动区',
    summary:
      'Radix 的自绘滚动条，4px 宽，平时不出现，指针到了这一块才出一条淡线（18% 墨色，指到滚动条上 32%）。调用方要给它一个确定的高。',
    exports: ['ScrollArea', 'ScrollBar'],
    propParts: [
      {
        part: 'ScrollArea',
        note: '其余属性透传给 Radix ScrollArea.Root。给 Root 一个确定的高（或 max-height），内容比它高才滚。',
      },
      { part: 'ScrollBar', note: '自己拼时用；orientation 默认 vertical。' },
    ],
    states: ['平时没有滚动条；指到或滚动时出 4px 的线。', '悬停滚动条提亮；视口可键盘聚焦，方向键能滚。'],
    donts: [
      '不要给应用里已经靠全局原生滚动条的容器再套一层，两套并存会重复。',
      '不要隐藏视口的键盘聚焦。',
      '不要在需要原生滚动行为（回弹、系统设置）的地方用。',
    ],
    composition: 'ScrollArea\n  （内部：Viewport、ScrollBar 竖与横、Corner）',
    keys: [
      ['Tab', '聚焦滚动区'],
      ['↑ ↓ PageUp PageDown Home End', '滚动'],
    ],
  },
  {
    id: 'tree-view',
    group: 'layout',
    cardHeight: 304,
    title: 'TreeView 树',
    summary:
      '可展开收起的层级列表：数据集目录、品种分类树用它。方向键走、→ 展开、← 收起，单选或多选，展开与选中都可受控。功能参照 Arc，实现原创。',
    exports: ['TreeView'],
    props: [
      {
        part: 'TreeView',
        note: '底座是 react-aria-components 的 Tree（角色 treegrid）：焦点、键盘、选中、展开都是它的。树数据用 items 传，一层层 children。',
        rows: [
          {
            name: 'items',
            type: '{ id: string; label: string; icon?: ReactNode; count?: number; disabled?: boolean; children?: TreeNode[] }[]',
            desc: '树。id 在整棵树里唯一；有 children 才能展开；count 写在字后。',
          },
          { name: 'label', type: 'string', desc: '整棵树的读屏名。' },
          {
            name: 'selectionMode',
            type: "'none' | 'single' | 'multiple'",
            default: "'single'",
            desc: 'none 只展开收起，点行不选。',
          },
          {
            name: 'value / defaultValue',
            type: 'string[]',
            desc: '选中的 id，受控 / 非受控（旧名 selectedKeys / defaultSelectedKeys 留一个版本）。',
          },
          { name: 'onValueChange', type: '(value: string[]) => void', desc: '选中变了（旧名 onSelectionChange）。' },
          { name: 'expandedKeys / defaultExpandedKeys', type: 'string[]', desc: '展开的 id，受控 / 非受控。' },
          { name: 'onExpandedChange', type: '(keys: string[]) => void', desc: '展开变了。' },
          {
            name: 'onAction',
            type: '(id: string) => void',
            desc: '激活一行（Enter 或双击）：打开这个数据集之类。给了它，点行是「选中这一行」（多选按 Ctrl / Shift 加减），方向键走到哪选到哪；不给，点行是切换选中，方向键只移焦点。',
          },
        ],
      },
    ],
    states: [
      '默认、悬停、选中（8% 白底）、键盘焦点（焦点环画在行内）、禁用（40% 不透明度）。',
      '展开的行箭头转 90 度。',
      '缩进按层级 16px 一档。',
    ],
    donts: [
      '不要拿它画很深很大的树（几千个节点）：它不做虚拟滚动。大目录先在数据层折叠。',
      '不要在包里放图标集：图标由调用方传 icon。',
      '不要拿它当导航菜单：菜单用 DropdownMenu 或工具条。',
    ],
    composition: 'TreeView\n  Tree（react-aria）\n    TreeItem × n（递归）\n      行：箭头按钮、图标、字、数量',
    keys: [
      ['↑ ↓', '上下走一行'],
      ['→', '收起的行展开；已展开则进第一个子项'],
      ['← ', '展开的行收起；否则回父级'],
      ['Home / End', '第一行 / 最后一行'],
      ['空格', '选中（单选换掉，多选切换）'],
      ['Enter', '激活（onAction）'],
      ['打字', '跳到以它开头的行'],
    ],
  },
  {
    id: 'field',
    group: 'forms',
    cardHeight: 326,
    title: 'Field 表单字段',
    summary:
      '标签加控件加说明加错误排成一组，并把它们的 ARIA 关联好：标签点一下聚焦控件，说明与错误进控件的 aria-describedby，出错时 aria-invalid、错误条 role=alert。可选 shakeOnInvalid：变成无效的那一刻整组抖一下（改自 SmoothUI form，MIT）。',
    exports: [
      'Field',
      'FieldContent',
      'FieldDescription',
      'FieldError',
      'FieldGroup',
      'FieldLabel',
      'FieldLegend',
      'FieldSeparator',
      'FieldSet',
      'Label',
      'useFieldControl',
    ],
    propParts: [
      {
        part: 'Field',
        note: '其余属性透传给 div。控件调 useFieldControl() 拿 { id, aria-describedby, aria-invalid, disabled } 展开到自己身上。',
      },
      { part: 'FieldError', note: 'Field 的 invalid 为真才渲染；children 是调用方写的话。' },
      { part: 'Label', note: '其余属性透传给 Radix Label.Root。不在 Field 里单独用也行。' },
      {
        part: 'FieldLabel / FieldDescription / FieldContent / FieldGroup / FieldSet / FieldLegend / FieldSeparator',
        symbol: 'FieldLabel',
      },
    ],
    states: [
      '默认：标签、控件、说明。',
      'invalid：标签变危险色、控件 aria-invalid、FieldError 显示并进 aria-describedby。',
      'disabled：控件禁用，标签降到禁用样式。',
    ],
    donts: [
      '不要在 Field 外面调用 useFieldControl 还指望有关联。',
      '不要只靠红色表示出错，要写错误文字。',
      '不要把标签藏起来，要隐藏用 sr-only。',
    ],
    composition:
      'FieldSet\n  FieldLegend\n  FieldGroup\n    Field\n      FieldLabel（或 FieldContent 里 FieldLabel + FieldDescription）\n      控件（useFieldControl）\n      FieldDescription\n      FieldError\n    FieldSeparator',
    keys: [['Tab', '控件按自己的方式走；点标签聚焦控件']],
  },
  {
    id: 'hold-to-confirm',
    group: 'forms',
    cardHeight: 195,
    title: 'HoldToConfirm 按住确认',
    summary:
      '不可撤的动作（全平、全撤、停策略）用的按钮：按住把底色从左填满才触发，松手往回退；键盘按住空格或回车同样。单击不触发。功能参照 Arc，实现原创。',
    exports: ['HoldToConfirm'],
    props: [
      {
        part: 'HoldToConfirm',
        note: '原生 button；进度逐帧直接写样式，不为每一帧重渲染。data-phase（idle / holding / done）与 data-progress（0 到 1）给样式与测试用。',
        rows: [
          { name: 'children', type: 'ReactNode', desc: '按钮上的字。' },
          { name: 'onConfirm', type: '() => void', desc: '填满时回调，一次按住只一次；松手再按才能再触发。' },
          {
            name: 'labels',
            type: 'HoldToConfirmLabels',
            desc: '{ hint, confirmed? }。hint 是读屏与悬停提示，如「按住 2 秒，全部平仓」，必填：没有它读屏用户不知道要按住；confirmed 是填满后的字，原地换掉 children，直到松手退完。旧名 hint、confirmedLabel 留一个版本（@deprecated）。',
          },
          {
            name: 'holdMs',
            type: 'number',
            default: '2000',
            desc: '按住多久填满。2000 取自 Emil Kowalski 的 hold-to-delete 写法（2026-11-14 读），对交易动作是否合适没有实测，默认值待定；越不可撤越长。',
          },
          { name: 'releaseMs', type: 'number', default: '200', desc: '松手后从满格退回空格要多久（同一出处）。' },
          {
            name: 'tone',
            type: 'Severity',
            default: "'danger'",
            desc: '填充色：danger 红、warn 琥珀、ok 绿（38% 语气色），neutral 中性（9% 白）。旧值 default 等于 neutral，留一个版本。',
          },
          { name: 'disabled', type: 'boolean', desc: '灰掉，按不动。' },
        ],
      },
    ],
    states: [
      '空闲：和普通按钮一样。',
      '按住：填充从左往右走；到 holdMs 填满并触发，字换成 labels.confirmed。',
      '松手：填充在 releaseMs 内退回；填满后手还按着，填充停在满格，松手才退。',
      '焦点移走或指针被抢走：按松手处理，退回。',
    ],
    donts: [
      '不要拿它做可撤销的动作：那些直接用 Button，确认框和按住都是摩擦。',
      '不要缩短 holdMs 到几百毫秒：那和单击没有区别。',
      'labels.hint 要写清按多久、做什么，读屏用户靠它。',
    ],
    composition:
      'HoldToConfirm\n  button\n    span.k-hold-fill（scaleX 填充）\n    span.k-hold-label\n    span.sr-only（hint）',
    keys: [
      ['空格 / Enter（按住）', '开始填充；松开退回；填满触发。长按产生的连发只算第一下'],
      ['Tab', '焦点移走即当作松手'],
    ],
  },
  {
    id: 'password-input',
    group: 'forms',
    cardHeight: 171,
    title: 'PasswordInput 密钥输入',
    summary:
      '带眼睛按钮的输入框：默认遮住，点一下显示或遮住；上下眼睑用弹簧开合，输入框不丢焦点与选区。学自 rare-ui（不要强度条）。',
    exports: ['PasswordInput'],
    propParts: [
      {
        part: 'PasswordInput',
        note: '其余属性透传给 Input（不含 type）；ref 指向里面的 input。自动填充、拼写检查、自动大写默认关。',
      },
    ],
    states: [
      '默认：内容遮住，眼睛是闭着的。',
      '点眼睛：显示明文，输入框不丢焦点与选区，眼睑睁开；再点遮回去。',
      '禁用：按钮不可点。',
    ],
    donts: [
      '眼睛按钮的读屏名 labels.toggle 必须传，包里不写文案（旧名 toggleLabel 留一个版本）。',
      '不要用它放不需要遮住的普通文本。',
    ],
    composition: 'PasswordInput\n  Input\n  button（眼睛，aria-pressed）',
    keys: [
      ['Tab', '从输入框到眼睛按钮'],
      ['Enter / Space', '显示或遮住（按钮上）'],
    ],
  },
  {
    id: 'delete-button',
    group: 'forms',
    cardHeight: 133,
    title: 'DeleteButton 原地确认',
    summary:
      '危险操作不弹对话框：点一下按钮在原地展开出「确认」「取消」，垃圾桶的盖子掀开。Esc、点外面、Tab 走开都是取消。学自 rare-ui。',
    exports: ['DeleteButton'],
    propParts: [
      {
        part: 'DeleteButton',
        note: '外层是 div（data-phase：idle / armed / done / kept）；原按钮 aria-expanded 表达是否展开。文字都在 label 与 labels 里，包里不带语言。',
      },
    ],
    states: [
      '静止：垃圾桶图标按钮。',
      '展开：原地出现「确认」「取消」，垃圾桶的盖子掀开。',
      'Esc、点外面、Tab 走开都算取消。',
      '禁用：不响应。',
    ],
    donts: ['不要在它旁边再叠一个确认对话框。', '确认、取消与完成的文案由调用方传，包里不写。'],
    composition: 'DeleteButton\n  button（垃圾桶，aria-expanded）\n  button（确认）\n  button（取消，展开后默认焦点）',
    keys: [
      ['Enter / Space', '展开；在确认或取消上则执行它'],
      ['Esc', '取消并把焦点还给原按钮'],
      ['Tab', '确认与取消之间移动；走出去算取消'],
    ],
  },
  {
    id: 'notification-bell',
    group: 'readouts',
    cardHeight: 211,
    title: 'NotificationBell 提醒铃',
    summary: '带未读数的铃：数变多时铃从顶端摆一下，角标弹出，数字按增减方向滚；0 时角标收起。学自 rare-ui。',
    exports: ['NotificationBell'],
    propParts: [
      { part: 'NotificationBell', note: '其余属性透传给 button。角标对读屏隐藏，数变了由名字（label）播报。' },
    ],
    states: ['0：角标收起。', '有未读：角标弹出，数字按增减方向滚。', '数变多：铃从顶端摆一下。'],
    donts: [
      '铃是图标，label 必须传（读屏名字），而且要带未读数：数变了就换这个字符串。',
      '不要拿角标数表示别的量（价格、进度）：它只表示未读条数，超过 max 写「99+」。',
      '不需要数字的场合用 variant=dot，不要传 1 假装。',
    ],
    composition: 'NotificationBell\n  svg（铃，转轴在上）\n  span（角标）\n  span（role=status 播报）',
    keys: [['Enter / Space', '点击（按钮）']],
  },
  {
    id: 'status-icon',
    group: 'feedback',
    cardHeight: 139,
    title: 'StatusIcon 状态图标',
    summary:
      '提示条里的成功、失败、警告、说明、进行中：换状态时旧的缩小退出、新的弹入，对勾与叉一笔一笔画出来。学自 rare-ui 的 toast。',
    exports: ['StatusIcon'],
    propParts: [
      {
        part: 'StatusIcon',
        note: '16 见方，role=img。tone：Severity（ok 对勾、warn 叹号、danger 叉、neutral 说明）加 info（蓝的说明）与 pending（转圈）；旧的 status（success / error / warning）留一个版本。',
      },
    ],
    states: [
      'ok、danger、warn、info、neutral、pending 六种，颜色取 --k-status-*；pending 是一圈匀速转的弧。',
      '换状态时旧的缩小退出、新的弹入，对勾与叉一笔一笔画出来。',
    ],
    donts: ['不要单靠图标说话：旁边要有文字。', 'label 必须传（读屏名字）。'],
    composition: 'StatusIcon\n  svg（按 tone 换，笔画画出来）',
    keys: [],
  },
  {
    id: 'ai-status',
    group: 'feedback',
    cardHeight: 171,
    title: 'AiStatus 行内 AI 状态',
    summary:
      '一行：随状态变的小图标加状态文字（进行中带流光），可带细节与耗时。换状态时图标缩放着换、文字上下滑着换、整行宽度弹簧伸缩。学自 rare-ui。',
    exports: ['AiStatus'],
    propParts: [{ part: 'AiStatus', note: '整行是 role=status，状态变了读屏播报。' }],
    states: [
      '按 status（状态机：thinking、searching、writing、done、error）换图标与文字；进行中带流光。旧的 state 留一个版本。',
      '可带 detail 与耗时 elapsed。',
      '换状态时图标缩放、文字上下滑、整行宽度弹簧伸缩。',
    ],
    donts: [
      '没有真实进展时不要显示进行中。',
      '状态变了要换 label：图标换了文字没换，读屏听不到。',
      '不要给 done、error 传耗时：只在进行中显示，结束就收起。',
    ],
    composition: 'AiStatus\n  span（图标，按 status 换）\n  span（文字，按 label 换）\n  span（细节）\n  span（耗时）',
    keys: [],
  },
  {
    id: 'matrix-orb',
    group: 'readouts',
    cardHeight: 261,
    title: 'MatrixOrb 点阵状态球',
    summary:
      '一盘方点排成圆：待命慢呼吸，聆听同心波跟输入电平（麦克风音量）走，思考几个热点绕着转；另有流式、完成、出错三态（并入自 SmoothUI siri-orb / ai-core 的六态约定，用点阵自己的方式表达）。点阵签名件的动态版，用来表达 Agent 在做什么。学自 rare-ui。',
    exports: ['MatrixOrb'],
    propParts: [
      { part: 'MatrixOrb', note: '画在 canvas 上，role=img；状态用文字另外读出。颜色取元素的 color，跟主题走。' },
    ],
    states: [
      '待命：慢呼吸。',
      '聆听：同心波跟 level（输入电平）走。',
      '思考：几个热点绕着转。',
      '流式：由内向外的脉冲环，节奏固定、不跟电平（并入自 SmoothUI 的六态约定）。',
      '完成：亮而平，点变绿。',
      '出错：亮斑在原地乱跳，点变红。',
    ],
    donts: [
      '只表达 Agent 真实在做的事，不当装饰。',
      'label 要传（读屏名字）；状态用 status 传（状态机，旧的 state 留一个版本）。',
    ],
    composition: 'MatrixOrb\n  canvas（requestAnimationFrame 循环）',
    keys: [],
  },
  {
    id: 'arcade-pixel',
    group: 'readouts',
    cardHeight: 520,
    title: 'ArcadePixel 像素屏',
    summary:
      '街机式像素屏：5x7 点阵字体或自带精灵画在 canvas 上，可选打字、擦除、闪烁、跑马灯四种进场，再叠扫描线、CRT 暗角与荧光。取自 SmoothUI（MIT）。',
    exports: ['ArcadePixel', 'ARCADE_SPRITES'],
    props: [
      {
        part: 'ArcadePixel',
        note: '画布 aria-hidden，文字另放 sr-only 给读屏；屏外与标签页隐藏时动画暂停。文字与精灵二选一，都给时精灵优先。',
        rows: [
          {
            name: 'text',
            type: 'string',
            desc: '用内置 5x7 字体画的文字；只认拉丁字母、数字与 - , : ! ? . * 空格，其余画成空格。',
          },
          {
            name: 'sprite',
            type: 'number[][]',
            desc: '二维数组，值是色板下标，0 为空。内置 ARCADE_SPRITES：alien、alienAlt、arrow、heart。',
          },
          {
            name: 'palette',
            type: 'string[]',
            default: "['transparent', 'var(--accent)']",
            desc: '下标对应的颜色，CSS 颜色或 var(--token)；下标 0 是底。',
          },
          { name: 'pixelSize', type: 'number', default: '8', desc: '一个像素格的边长（CSS 像素）。' },
          { name: 'gap', type: 'number', default: '1', desc: '像素格之间的间隔。' },
          { name: 'columns', type: 'number', desc: '显示窗口的宽（格数），默认等于内容宽；跑马灯用它定窗口。' },
          {
            name: 'animate',
            type: "'none' | 'type' | 'wipe' | 'blink' | 'marquee'",
            default: "'none'",
            desc: '进场动画；marquee 一直滚。',
          },
          { name: 'loop', type: 'boolean', default: 'false', desc: '进场动画是否反复；blink 在 loop 下一直闪。' },
          { name: 'speed', type: 'number', default: '1', desc: '动画速度倍数。' },
          {
            name: 'glow',
            type: 'boolean | number',
            default: 'false',
            desc: '荧光外溢；数字是强度 0 到 1，true 为 0.65。',
          },
          { name: 'scanlines', type: 'boolean', default: 'false', desc: '缓慢上漂的扫描线。' },
          { name: 'crt', type: 'boolean', default: 'false', desc: '暗角、红蓝边色散、滚动亮带与轻微闪烁。' },
          {
            name: 'label',
            type: 'string',
            desc: '读屏名，不给用 text；纯精灵又没给就当装饰，整块对读屏隐藏（包里不带兜底文案）。',
          },
        ],
      },
    ],
    states: [
      '静态（animate=none）：画好就停，不占动画帧。',
      'type / wipe / blink：播完停在整屏；loop 时反复。',
      'marquee：一直滚；屏外或标签页隐藏时暂停。',
    ],
    donts: [
      '没有中日韩字：5x7 字体只有拉丁字母、数字与几个标点，中文要用别的件。',
      '不要拿它画行情数字或价格；它是装饰与状态牌，读数用 Lcd。',
      '它不是可读的文本控件：文字在 sr-only 里，别指望复制画布上的字。',
      '不要写死颜色：色板传 var(--token)；CRT 叠层的暗、亮、色散三色读 --lcd-bg / --lcd-fg / 状态色，可用 --arcade-* 覆盖。',
    ],
    composition: 'ArcadePixel\n  canvas（aria-hidden）\n  CRT 叠层（扫描线、暗角、色散、闪烁）\n  span.sr-only',
    keys: [],
  },
  {
    id: 'use-scrubber',
    group: 'quant',
    cardHeight: 200,
    title: 'useScrubber 序列扫读',
    summary:
      '序列图共用的扫读钩子：指针在图上移动或键盘走，选中一格。←→ 一格，Shift+←→ 三格，Home / End 到头尾，Esc 清掉。可受控，几张图共用一个选中格。功能参照 Arc 的 Revenue explorer。',
    exports: ['useScrubber'],
    props: [
      {
        part: 'useScrubber(options)',
        note: '返回 { index, set, pointer, keys, props }：props 是 pointer 与 keys 的合并，整个摊在图的容器上；几张图共用时把 pointer 摊在每张上、keys 摊在外层。',
        rows: [
          { name: 'count', type: 'number', desc: '一共几格。格数变少时越界的选中格当作没选中。' },
          {
            name: 'mode',
            type: "'point' | 'band'",
            default: "'point'",
            desc: 'point：格是点（折线），指针落到最近的点；band：格是带（柱），落在哪条带里。',
          },
          { name: 'index', type: 'number | null', desc: '受控的选中格；不给就钩子自己管。' },
          { name: 'onIndexChange', type: '(index: number | null) => void', desc: '选中格变了（含清掉，null）。' },
        ],
      },
    ],
    states: [
      '没选中：index 为 null，图上不画十字线。',
      '没选中时按 ←→：先落到最新一格（最后一格）。',
      '指针离开或失焦：清掉。',
      'Esc：清掉；已经没选中时不拦截，Esc 照常往外冒（关对话框）。',
    ],
    donts: [
      '不要把 pointer 摊在比图大的元素上：横坐标按那个元素的宽换成格号。',
      '不要用它做一段区间的刷选：那是 BrushChart。',
      '组合键（Ctrl、Alt、Meta）不拦截，留给浏览器与应用快捷键。',
    ],
    composition: 'useScrubber\n  scrubKey（键位表，纯函数）\n  scrubIndexAt（横坐标到格号，纯函数）',
    keys: [
      ['← →', '选中格前后一格；没选中时先落到最新一格'],
      ['Shift + ← →', '一次三格（Arc Revenue explorer 页面写明 Shift+arrow 走三个月，2026-11-14 读）'],
      ['Home / End', '第一格 / 最后一格'],
      ['Esc', '清掉选中'],
    ],
  },
  {
    id: 'brush-chart',
    group: 'quant',
    cardHeight: 330,
    title: 'BrushChart 刷选条与主图联动',
    summary:
      '一条整段序列的概览条，上面套一个可拖的窗口，主图只画窗口里的那一段：拖中间平移、拖两端缩放、点窗口外的地方把窗口移过去。主图上指针或 ←→ 扫读。可作 EquityCurve 的底座。功能参照 Arc 的 Brush chart。',
    exports: ['BrushChart', 'BrushStrip'],
    props: [
      {
        part: 'BrushChart',
        note: '图画在 viewBox 里（竖向就是像素），文字与十字线是叠在上面的 HTML，不用量尺寸。窗口是 [start, end)：含起点、不含终点，单位是点的下标。',
        rows: [
          { name: 'values', type: 'number[]', desc: '整段序列，从旧到新。主图画窗口里的，概览条画全部。' },
          { name: 'label', type: 'string', desc: '整张图的读屏名（必填，包里没有文案）。' },
          {
            name: 'formatX',
            type: '(index: number) => string',
            desc: '第几个点写成什么：时间轴刻度、读数、手柄的读屏值都用它。',
          },
          { name: 'formatValue', type: '(value: number) => string', desc: '数值写成什么：纵轴刻度与读数。' },
          { name: 'labels', type: '{ start, end, window }', desc: '三个手柄的读屏名（起点、终点、整个窗口）。' },
          {
            name: 'value / defaultValue',
            type: '[number, number]',
            desc: '受控 / 不受控的窗口，默认整段。旧名 window / defaultWindow 留一个版本（@deprecated）。',
          },
          {
            name: 'onValueChange',
            type: '(window: [number, number]) => void',
            desc: '窗口变了（拖、键盘、点概览条）。旧名 onWindowChange 留一个版本。',
          },
          { name: 'minSpan', type: 'number', default: '2', desc: '窗口最少几个点：折线至少两个点才画得出来。' },
          { name: 'height / brushHeight', type: 'number', default: '160 / 40', desc: '主图与概览条的高（px）。' },
        ],
      },
      {
        part: 'BrushStrip',
        note: '只有概览条（SeriesExplorer 这类自己画主图的件用它）。属性是 values、value、onValueChange、formatX、labels、minSpan、height（旧名 window / onWindowChange 留一个版本）。',
        rows: [{ name: 'value / onValueChange', type: '[number, number]', desc: '窗口由上层持有（受控）。' }],
      },
    ],
    states: [
      '默认：窗口整段（或 defaultValue），概览条上窗口外变暗。',
      '拖动中：窗口换成抓取手形，主图同步变。',
      '扫读：主图上出现竖线与点，下面一行写时间与值。',
      '窗口到了最小（minSpan）：继续缩小被夹住，不再变。',
    ],
    donts: [
      '不要用它画多条序列：它是单条权益线这类的概览加细看，多条走 SeriesExplorer 或 SmallMultiples。',
      '不要在包里写时间格式：用 formatX 传，时区与语言是调用方的事。',
      'values 里不要夹 NaN 想表示断点：窗口与概览条按下标走，断开会让下标对不上；先补好再传。',
    ],
    composition:
      'BrushChart\n  div[role=group]（主图：svg 折线与面积 · 纵轴刻度 · 十字线与点）\n  横轴刻度 · 读数行（aria-live）\n  BrushStrip\n    svg 概览线\n    窗口（slider）· 起点手柄（slider）· 终点手柄（slider）',
    keys: [
      ['← →', '主图上：扫读前后一格；手柄上：窗口或该端移一点'],
      ['Shift + ← →', '一次三点'],
      ['Home / End', '主图上：第一格 / 最后一格；手柄上：窗口或该端到头尾'],
      ['Esc', '主图上：清掉选中'],
    ],
  },
  {
    id: 'attribution-bars',
    group: 'blocks',
    cardHeight: 560,
    title: 'AttributionBars 盈亏归因',
    summary:
      '今天（或选中区间）的钱从哪来：工作台顶行（宽体标题、维度与区间分段、表格 / 导出），点阵元信息与列头，每行编号加零轴条形（正在右、负在左，条是点阵纹理不用红绿，只有数字用涨跌色），已平仓的行整行删除线并在名称后挂点阵小标签，元信息行下面一行汇总（合计大号左带 2px 强调竖条，正负贡献小一号）；按 |贡献| 正负分组降序，超过 7 项折「其他 ×n」，费用·税永远在最底。对设计稿的 PnLAttribution 卡（卡明写不用瀑布图），语言同 SeriesExplorer。',
    exports: ['AttributionBars'],
    props: [
      {
        part: 'AttributionBars',
        note: '数据只有 items；维度与区间切换由调用方做（换 items），组件只画分段并上报。文字全从 props 来。外观读 CSS 变量，见 theme/chart-kit.css 开头。',
        rows: [
          {
            name: 'items',
            type: '{ key, label, value, kind?, detail? }[]',
            desc: 'kind 为 fee 的是费用·税，永远单独一行放最底；closed 是名称后的点阵小标签（整行删除线）；detail 是 tooltip 里多写的几行。',
          },
          { name: 'formatValue / formatShare', type: '(n) => string', desc: '贡献与占比写成什么字。' },
          {
            name: 'labels',
            type: '{ other: (n) => string, share: string }',
            desc: '「其他 ×n」与占比那一行的字。旧名 otherLabel / shareLabel 留一个版本（@deprecated）。',
          },
          {
            name: 'title / meta',
            type: 'string / (scale) => string',
            desc: '标题（宽体大写英文）与下一行点阵元信息；刻度 ±max 只在元信息里写一次。',
          },
          {
            name: 'dimensions / ranges',
            type: '{ label, options, value, onValueChange }',
            desc: '顶行的两组分段；换了就换 items，同一位置的条长会过渡。旧名 onChange 留一个版本。',
          },
          {
            name: 'readouts',
            type: '{ key, label, text, value? }[]',
            desc: '汇总行：第一个是合计（大号，左 2px 强调竖条），其余小一号跟在右边；标签点阵小字，value 决定涨跌色。',
          },
          {
            name: 'focusKey / onSelect',
            type: 'string / (key) => void',
            desc: '联动的品种：它的条转强调色纹理；点击或 Enter 写联动上下文。',
          },
          {
            name: 'footer',
            type: '{ count, source?, note? }',
            desc: '页脚一行：左边点阵 SOURCE，右端「项数 · 声明」（研究账本不计入）。',
          },
          {
            name: 'actionLabels / heads',
            type: 'object',
            desc: '顶行按钮的读屏名与列头（编号、项、贡献、占比，可带 shareTitle 写明分母；点阵小字）；导出与全屏的回调不给就不画那个按钮，表格视图总有。',
          },
          { name: 'maxItems', type: 'number', default: '7', desc: '超过几项折进「其他」（含「其他」这一行）。' },
        ],
      },
    ],
    states: [
      '默认：正组在上、负组在下，各按 |贡献| 降序；刻度 ±max 写在页脚。',
      '焦点：focusKey 对应的条转强调色纹理。',
      '悬停或聚焦一行：LCD tooltip 写数值、占比与明细。',
      '表格视图：右上角第一个按钮切到表格，键盘可达（无障碍兜底）。',
    ],
    donts: [
      '不要用瀑布图：阅读要跟踪累计基线，认知负荷高。',
      '不要用颜色区分账户或策略：标签说清楚就够。',
      '不要在条上用涨跌色：涨跌色不上面积，只有右侧数字用。',
      '不要在这里拆已实现 / 未实现：这里只回答「谁贡献了多少」。',
      '不要做庆祝性反馈（实时更新只让数字滚动、条跟随）。',
    ],
    composition:
      'AttributionBars\n  Toolbar 顶行（标题 · 维度 / 区间分段 · 表格 / 导出 / 全屏）\n  点阵元信息\n  汇总行（合计 · 正贡献 · 负贡献）\n  列头 + ul 每行（编号 · 标签 + 平仓小标签 · 零轴 + 条 · 数字 · 占比；悬停出 LCD tooltip）\n  页脚一行（SOURCE · 项数与声明）',
    keys: [
      ['Enter', '点击当前行（写联动）'],
      ['Esc', '收起 tooltip'],
    ],
  },
  {
    id: 'equity-curve',
    group: 'quant',
    cardHeight: 460,
    title: 'EquityCurve 权益曲线',
    summary:
      '权益线加镜像回撤：上区 2px 权益线（series-1）、可选 1px 灰虚线基准，下区回撤面用点阵 / 斜线纹理，末点橙色旁标最终值；线性 / 对数纵轴、底下概览刷选条、表格视图。横轴按点的时刻摆。对设计稿的 EquityCurve 卡。',
    exports: ['EquityCurve'],
    props: [
      {
        part: 'EquityCurve',
        note: '包里不带语言：标题、图例、数值与时间的写法都由调用方传。外观读 CSS 变量，见 theme/chart-kit.css 开头。',
        rows: [
          {
            name: 'points',
            type: '{ time, equity, drawdown, title, equityText, drawdownText }[]',
            desc: '一点一笔；time 是毫秒时刻，横轴按它摆；文字已按币种位数格式化。',
          },
          { name: 'benchmark', type: '{ name, values }', desc: '与 points 一一对应的基准数值；不给就不画。' },
          { name: 'axis / formatTime', type: '(n) => string', desc: '纵轴刻度与基准读数、横轴默认刻度的写法。' },
          {
            name: 'xTicks',
            type: '(start, end) => { time, label }[]',
            desc: '宿主自己给整点 / 整日刻度（按显示时区）；不给就在窗口里均分 5 个。',
          },
          { name: 'labels', type: 'object', desc: '回撤、时刻列头、线性 / 对数、概览条三个手柄、右上三件的文字。' },
          {
            name: 'onValueChange',
            type: '(window) => void',
            desc: '拖概览条改窗口后回调，宿主可把别的表跟着筛。旧名 onWindowChange 留一个版本。',
          },
          { name: 'onExport / onFullscreen', type: '() => void', desc: '不给就不画那个按钮；表格视图总有。' },
        ],
      },
    ],
    states: [
      '默认：全段，线性轴，末点标最终值。',
      '悬停或聚焦后 ←→：十字线与 LCD tooltip 写序号时刻、权益、基准、回撤。',
      '对数轴：权益与基准都大于 0 才能切；有 ≤ 0 的值时按钮禁用。',
      '没有回撤（一直创新高）：下区只留 0 线。',
    ],
    donts: ['不要把回撤画成实色面：用纹理。', '不要在线与面上用涨跌色：涨跌色只给文字。', '不要标除末点以外的数值。'],
    composition:
      'EquityCurve\n  头（标题 · 图例 · 线性/对数 · 表格视图/导出/全屏）\n  上区（网格 · 基准 · 权益线 · 末点 · 十字线与 LCD tooltip）\n  下区（镜像回撤纹理）\n  横轴 · 概览刷选条 · 来源行',
    keys: [
      ['← →', '在图上扫读一点（Shift 三点）'],
      ['Home / End', '扫读到头 / 尾'],
      ['Esc', '清除扫读点'],
    ],
  },
  {
    id: 'spark-tile',
    group: 'quotes',
    cardHeight: 358,
    title: 'SparkTile KPI 瓦片',
    summary:
      'KPI 瓦片：点阵小标签、LCD 数值、24px 迷你折线（可画阈值虚线）、一行变化说明；数据由调用方给，没有数据是空态，一行最多放 5 个。2026-11-18 起它就是 MetricCard variant="tile"，SparkTile 留作兼容的旧名。',
    exports: ['SparkTile'],
    props: [
      {
        part: 'SparkTile',
        note: '等于 <MetricCard variant="tile">：delta → changePct、sparkLabel → labels.spark、state → status、onClick → onSelect，新代码写 MetricCard。给了 onClick（onSelect）整块就是按钮，不给是普通块。文案都由调用方传。',
        rows: [
          { name: 'label', type: 'string', desc: '点阵小标签。' },
          { name: 'value', type: 'string | null', desc: '已格式化的数值；null 是没有数据，写 —。' },
          { name: 'unit', type: 'string', desc: '数值后面的小字（/月、/ 150%）。' },
          { name: 'rollValue', type: 'number', desc: '给了数值就像里程表一样滚着变；不给直接换字。' },
          { name: 'series', type: 'readonly number[]', desc: '迷你线的数，从旧到新；少于两个数画不出线，写 —。' },
          { name: 'sparkLabel', type: 'string', desc: '线的读屏名（整句，含「没有数据」的说法）。' },
          {
            name: 'trendTone',
            type: "'series' | 'neutral'",
            default: "'series'",
            desc: 'neutral 给越低越好的指标（线用 ink-300）。',
          },
          {
            name: 'threshold',
            type: 'number',
            desc: '阈值（跟 series 同一单位）：画 1px 琥珀虚线，纵向刻度把它算进去。',
          },
          {
            name: 'state',
            type: "'normal' | 'near' | 'over'",
            default: "'normal'",
            desc: 'near、over：边框转暗橙、说明转琥珀；over 另有一次 2px 脉冲。',
          },
          { name: 'delta', type: 'number', desc: '变化百分数，写成带符号带箭头的 ChangeText，涨跌色跟 data-updown。' },
          { name: 'note', type: 'ReactNode', desc: '变化行的小字说明；near、over 时要在这里写字。' },
          { name: 'onClick', type: '() => void', desc: '给了就是按钮。' },
        ],
      },
    ],
    states: [
      '平常：bg-200 单元格加发丝边，线 1.5px series-1，末点橙。',
      '接近 / 越过阈值：边框转暗橙，说明转琥珀；越过时脉冲一次。',
      '没有数据：数值写 —，线的位置写 —，不画样本。',
      '可点：悬停底色提亮，键盘聚焦画焦点环。',
    ],
    donts: [
      '一行不要超过 5 个；更多拆两行或进表格。',
      '迷你线不画轴、网格、数值。',
      '不要用颜色区分瓦片类型，只用标签；接近阈值要在说明里写字，不只靠边框颜色。',
      '没有数据时不要传一列 0 凑数。',
    ],
    composition:
      'SparkTile = MetricCard variant="tile"\n  ReadoutValue（数值 · RollingText 给了 rollValue 时）\n  迷你线（svg）\n  ChangeText · note',
    keys: [['Enter / Space', '给了 onClick 时触发']],
  },
  {
    id: 'meter',
    group: 'quant',
    cardHeight: 477,
    title: 'Meter 仪表',
    summary:
      '横向仪表，三种形态：条（进度、负载、敞口）、刻度（0 到 100 的读数带指针）、同步率条（带齿分段加琥珀评估刻度与右侧大百分比）；颜色只传 tone。',
    exports: ['Meter'],
    props: [
      {
        part: 'Meter',
        note: '名字与数永远在，不做只有一根条。填充与指针走 gentle 弹簧；tone 一变成 warn，条体脉冲一次。',
        rows: [
          { name: 'label', type: 'ReactNode', desc: '名字（左上，ink-300）。' },
          { name: 'value', type: 'number', desc: '当前值；越界贴边。' },
          { name: 'max', type: 'number', default: '100', desc: '满量程。' },
          { name: 'valueText', type: 'string', desc: '右边的数怎么写；不给就是四舍五入的百分数。' },
          {
            name: 'tone',
            type: 'SeverityExt',
            default: "'accent'",
            desc: '进行中 accent（橙）、健康 ok（绿）、受限或越界 warn（琥珀）、弱势 danger（红）、停用 off / neutral。',
          },
          {
            name: 'display',
            type: "'bar' | 'gauge' | 'sync'",
            default: "'bar'",
            desc: 'sync 只给 paper 进度、容量使用、偏离门距离、回放进度。',
          },
          { name: 'mark', type: 'number', desc: '刻度（跟 value 同单位）：琥珀竖线，sync 里是评估点；gauge 不画。' },
          { name: 'markLabel', type: 'string', desc: '读屏用：刻度是什么（评估点、上限）；有 mark 时要给。' },
        ],
      },
    ],
    states: [
      'bar：10px 凹槽里点阵纹理填充（4px 实 2px 空），长度编码量。',
      'gauge：34px 凹槽、中线、底部 0/25/50/75/100 刻度，指针带光；弱势用 danger（红）。',
      'sync：14px 带齿条，右侧大百分比（display-dense 字），琥珀刻度是评估点。',
      'warn：条与数转琥珀，条体脉冲一次；off：全部转灰。',
      'tone 是 SeverityExt（G6）：neutral 画法同 off（没有判断就不着色）。',
    ],
    donts: [
      '不要传颜色，只传 tone。',
      '越界、受限要在名字或数里写字，不只靠琥珀色。',
      '不要用 sync 做普通进度条。',
      '高频（> 2Hz）更新的量不要用它，用读数。',
    ],
    composition: 'Meter\n  role="meter" 的槽（读屏读 aria-valuenow 与 valuetext）',
    keys: [],
  },
  {
    id: 'flow-gauges',
    group: 'quant',
    cardHeight: 390,
    title: 'FlowGauges 订单流仪表行',
    summary:
      '订单流四个仪表一行：Market Pressure、Price Change（零轴居中，−100…+100）、DOM Pressure（前 N 档买卖挂单柱）、Delta Divergence（多周期 LED 矩阵）；只收算好的数，窗口不足写 N/A。',
    exports: ['FlowGauges'],
    props: [
      {
        part: 'FlowGauges',
        note: '口径（窗口、逐笔方向、档位怎么算）不在包里，由调用方（应用的 Worker）算好传入。一屏最多放一行（仪器预算）。不做声音、不做闪烁。',
        rows: [
          {
            name: 'gauges',
            type: 'readonly FlowGaugeData[]',
            desc: '每格一个，kind 是 pressure | priceChange | dom | divergence。',
          },
          { name: 'label', type: 'string', desc: '整行的读屏名。' },
          {
            name: 'labels',
            type: '{ na?, estimate? }',
            desc: "没有数的位置写什么（默认 'N/A'）、估算标记的字（默认 'est.'）；旧名 naText / estimateText 留一个版本。",
          },
        ],
      },
      {
        part: 'pressure / priceChange 格',
        rows: [
          { name: 'value', type: 'number | null', desc: '−100 到 +100；窗口不足传 null，不填零。' },
          { name: 'valueText', type: 'string', desc: '已格式化的带符号数。' },
          { name: 'estimated', type: 'boolean', desc: '无逐笔方向、数是估的：灰显并标估算。' },
          { name: 'title / note', type: 'string / ReactNode', desc: '点阵小标题（含周期）与一行说明。' },
        ],
      },
      {
        part: 'dom 格',
        rows: [
          { name: 'bids / asks', type: 'readonly number[]', desc: '各档的量，从最优价往外；两边都空是 N/A。' },
          { name: 'summary', type: 'string', desc: '读屏用的整句，柱子本身对读屏是空的。' },
        ],
      },
      {
        part: 'divergence 格',
        rows: [
          {
            name: 'rows',
            type: '{ window, cells, summary }[]',
            desc: 'cells 是 off | on | ok | warn 的一行 LED；null 是 N/A（数据不足）；summary 是读屏整句。',
          },
        ],
      },
    ],
    states: [
      '正常：压力条从中线往右（series-1）或往左（series-2），数字带符号。',
      '窗口不足：写 N/A，条不画，不填零。',
      '估算：数与条灰显，旁边写估算字。',
      '压力不是盈亏：不用涨跌色，data-updown 对它不起作用。',
    ],
    donts: [
      '不要把算法放进组件，传算好的数。',
      '窗口不足不要传 0。',
      '不要加声音或闪烁；告警走告警中心。',
      '一屏不要放两行。',
    ],
    composition: 'FlowGauges\n  每格 section（点阵标题、读数、一行说明）',
    keys: [],
  },
  {
    id: 'regime-strip',
    group: 'quant',
    cardHeight: 219,
    title: 'RegimeStrip 市场状态带',
    summary:
      '市场状态带：状态模型把历史分成几种状态，画成无缝色带叠在任何时间轴下，配图例；颜色是类别（series-1…7）不是好坏；RegimeBand 只画带。',
    exports: ['RegimeBand', 'RegimeStrip'],
    props: [
      {
        part: 'RegimeStrip',
        note: '带加图例；RegimeBand 的属性全部适用。分状态收益表不在本件里，由调用方用表格摆在下面。',
        rows: [
          { name: 'title', type: 'ReactNode', desc: '图例上方的标题行。' },
          { name: 'current', type: 'string', desc: '当前所处状态的 id。' },
          {
            name: 'labels',
            type: '{ current?, estimate? }',
            desc: "「当前」的字（给了 current 就要给）、有估算段时图例末尾的字（默认 'est.'）；旧名 currentText / estimateText 留一个版本。",
          },
          {
            name: 'onSelect',
            type: '(state: RegimeState | null) => void',
            desc: '给了图例每项就是按钮：点选高亮，再点同一项取消（传 null）；旧名 onPickState（给 id）留一个版本。',
          },
        ],
      },
      {
        part: 'RegimeBand',
        note: '只画带。宽度与时间的对应由调用方传 scale，把它放在跟上面时间轴同宽的容器里。',
        rows: [
          {
            name: 'segments',
            type: 'readonly { from, to, state, estimated? }[]',
            desc: '状态段；时间单位由调用方定，跟 scale 一致。',
          },
          {
            name: 'states',
            type: 'readonly { id, name, color, detail? }[]',
            desc: 'color 是 1 到 7（series-N）；≤ 6 态，挑色距大的（1、2、4、7）。',
          },
          {
            name: 'scale',
            type: '(time: number) => number',
            desc: '时间到 0–1 的位置；不给就在最早与最晚之间线性排。',
          },
          { name: 'activeState', type: 'string | null', desc: '高亮某状态，其余变淡到 25%。' },
          { name: 'describe', type: '(segment, state) => string', desc: '每段的悬停与读屏文字；不给只写状态名。' },
          { name: 'label', type: 'string', desc: '整条带的读屏名。' },
        ],
      },
    ],
    states: [
      '平常：14px 无缝色带，图例里每个状态一个色块加名字。',
      '高亮：选中的状态保持，其余变淡。',
      '估算段（样本外最后一段常见）：带上叠斜纹，图例末尾写估算字。',
      '当前状态：图例里它后面写「当前」。',
    ],
    donts: [
      '不要用涨跌色或 signal 色：危机也是 series 色，颜色是类别不是好坏。',
      '不要超过 6 个状态。',
      '不要只靠颜色认状态，图例里一定有名字。',
    ],
    composition: 'RegimeStrip\n  RegimeBand\n  图例（色块 + 名字 + 小字）',
    keys: [['Enter / Space', '给了 onSelect 时，图例项点选或取消高亮']],
  },
  {
    id: 'consensus-block',
    group: 'quant',
    cardHeight: 473,
    title: 'ConsensusBlock 必要条件块',
    summary:
      '写命令提交前的必要条件块：当前意图、各必要条件的满足或阻止、结论与参数 hash；不是投票，任一方未过、未返回、超时、失效都不可提交，裁决永远在执行网关与账户服务。',
    exports: ['ConsensusBlock', 'countConsensus'],
    props: [
      {
        part: 'ConsensusBlock',
        note: '各方的判定来自各自的权威，件只画不判，不合成第四种判断。一个表单只放一个。结构不皮肤化。',
        rows: [
          { name: 'label', type: 'string', desc: '整块的读屏名。' },
          {
            name: 'subject',
            type: 'ReactNode',
            desc: '要提交的是什么（下单 · 账户 A · 买 300750 × 2,000）；旧名 intent 留一个版本。',
          },
          {
            name: 'parties',
            type: 'readonly ConsensusParty[]',
            desc: '各方：key、label、state、message、detail?；detail 有就整格是按钮，点开才看。',
          },
          {
            name: 'verdict',
            type: "'ok' | 'warn' | 'blocked'",
            desc: '结论，由调用方给；warn 可提交但确认框要列出警告。',
          },
          { name: 'verdictText', type: 'string', desc: '结论的字（可提交 / 不可提交）。' },
          { name: 'summary', type: 'ReactNode', desc: '结论行左边的计数句，用 countConsensus 的结果拼。' },
          { name: 'hash', type: 'string | null', desc: '参数 hash；未就绪传 null，显示 —。' },
          { name: 'onHashClick', type: '() => void', desc: '给了 hash 就是按钮（复制）。' },
          { name: 'stateLabels', type: 'Partial<Record<ConsensusState, string>>', desc: '各状态的字，缺省是英文。' },
        ],
      },
      {
        part: 'countConsensus(parties)',
        note: '数各状态的个数，给计数句用：unknown、timeout、stale、pending 都归 open，不算通过。',
        rows: [{ name: 'parties', type: 'readonly ConsensusParty[]', desc: '返回 { pass, warn, blocked, open }。' }],
      },
    ],
    states: [
      'pass 满足；warn 接近（不阻止）；blocked 未过（红菱形，抖一次）。',
      'unknown 未返回（暗灯）；timeout 超时（琥珀灯闪一次）；stale 已失效（琥珀空心环，需重检）。',
      'pending 评估中（橙环，句子写评估中）。',
      '每一格都有状态字与一句话：状态不只靠灯的颜色。',
    ],
    donts: [
      '不要把它当投票：多方同意不等于授权。',
      '不要在前端合成第四种判断，verdict 由权威给。',
      '研究类命令不要用它。',
      '一个表单不要放两个。',
    ],
    composition:
      'ConsensusBlock\n  各方的格（点阵名、灯 + 状态字、一句话）\n  详情（点开）\n  结论行（计数、结论、hash）',
    keys: [
      ['Tab', '在有详情的格与 hash 之间移动'],
      ['Enter / Space', '展开或收起该方的详情；点 hash'],
    ],
  },
  {
    id: 'calendar-heatmap',
    group: 'quant',
    cardHeight: 560,
    title: 'CalendarHeatmap 日历热力图',
    summary:
      '月历格：底色是收益（或换手）的低饱和发散热力，格内日期左上、数值右下，左下点阵事件点（最多 3 个，更多写 +n）；休市日灰底写「休」，今天强调色描边，周标 W40。切「事件」视图时格子不着色。mode 为 year 是整年的格子。对设计稿的 Calendar 卡；功能参照 Arc 的 Activity heatmap。',
    exports: ['CalendarHeatmap'],
    props: [
      {
        part: 'CalendarHeatmap',
        note: '日期是不带时区的日历日 YYYY-MM-DD，用 @internationalized/date 的 CalendarDate 算（不碰本地时区）。样式在 theme/calendar-heatmap.css。年视图用的是整年的格子（一周一列），不是 12 个缩小月历（待定：第一版先做整年格子）。',
        rows: [
          {
            name: 'days',
            type: '{ date, value, open?, events? }[]',
            desc: 'value 没有数据传 null（与 0 持平分开）；open 为 false 是休市日；events 是事件点（tone 为 holding / high 的画琥珀点）。',
          },
          {
            name: 'mode / month',
            type: 'month | year / YYYY-MM',
            default: 'month',
            desc: '月历显示哪个月（不给取最晚那天所在的月）；year 用 from / to。',
          },
          {
            name: 'view',
            type: 'pnl | turnover | events',
            default: 'pnl',
            desc: '收益用发散色；换手用序数色 seq；事件视图格子不着色、列事件文字。',
          },
          { name: 'today', type: 'string', desc: '今天：强调色描边；晚于今天的日子不着色、只有事件点。' },
          { name: 'weekStart', type: '0 | 1', default: '1', desc: '一周从周日（0）还是周一（1）起。' },
          {
            name: 'weekdayLabels / monthLabels / weekLabel / closedLabel',
            type: 'strings',
            desc: '星期、月份、周标（W40）与「休」，文字由调用方按界面语言传。',
          },
          {
            name: 'formatValue / describe',
            type: 'functions',
            desc: '格里的数值怎么写；选中的一天读成一句（读数行与读屏）。',
          },
          {
            name: 'total / toolbar',
            type: '{ text, value } / ReactNode',
            desc: '顶行右侧的月合计（按正负用涨跌色）；左边放视图切换与月份说明。',
          },
          {
            name: 'actionLabels / tableHeads',
            type: 'object',
            desc: '右上角三件与表格视图的文字；导出与全屏回调不给就不画，表格视图总有。',
          },
          { name: 'onSelect', type: '(date: string) => void', desc: '点一天或选中后按 Enter（写联动 range）。' },
          {
            name: 'reveal',
            type: 'boolean',
            default: 'false',
            desc: '进场时格子依次淡入长大（年视图一列一列、月历一天一天）；月份或区间变了会重播。',
          },
        ],
      },
    ],
    states: [
      '默认：开市日按收益着色，休市日灰底写「休」，今天描边。',
      '格色：发散色浅档是大多数，深档只给超月内 80 分位的格；全饱和不出现。',
      '换手视图：序数色，格从暗到亮。',
      '事件视图：格子不着色，每格最多列两条事件文字。',
      '没有数据的日子：只有日期与「·」，与持平（中点灰）不同。',
      '悬停：tooltip 从 0.8 倍弹到 1，格子的描边与色平滑过渡；reveal 开着时进场格子依次淡入。',
    ],
    donts: [
      '不要用涨跌色填格：涨跌色不上面积，只有月合计的数字用。',
      '不要拿颜色深浅读精确值：数在格子右下，颜色只给方向与大概多大。',
      '不要做 streak、「连胜」计数。',
      '不要传带时区的时间戳：传日历日字符串，休市与否由调用方（交易日历）定。',
    ],
    composition:
      'CalendarHeatmap\n  顶行（toolbar · 月合计 · 表格视图 / 导出 / 全屏）\n  月历 div[role=grid]（周标 · 每天一个 button：日期 · 数值 · 事件点）或 年视图 svg\n  LCD tooltip · 读数行（aria-live）· 色例',
    keys: [
      ['← →', '前后一天；没选中时先落到最后一天'],
      ['↑ ↓', '前后一周'],
      ['Home / End', '区间第一天 / 最后一天'],
      ['Enter', '触发 onSelect'],
      ['Esc', '清掉选中'],
    ],
  },
  {
    id: 'horizon-chart',
    group: 'quant',
    cardHeight: 360,
    title: 'HorizonChart 地平线图',
    summary:
      '十几个品种的日内收益叠成窄带，一屏看完：每行把正负值折成几条叠起来的带，颜色越深值越大，涨跌色跟涨跌配色走。所有行共用一个扫读位置。功能参照 Arc 的 Horizon chart。',
    exports: ['HorizonChart'],
    props: [
      {
        part: 'HorizonChart',
        note: '每行一个 svg（viewBox，竖向是像素），右边一列写值：没选中写最新值，选中后写那一格。各行点数应当相同，短的行末尾当没有值。',
        rows: [
          { name: 'rows', type: '{ key, label, values }[]', desc: '每行一个品种：名字与从旧到新的值（带正负）。' },
          { name: 'label', type: 'string', desc: '整张图的读屏名（必填）。' },
          {
            name: 'formatValue',
            type: '(value: number) => string',
            desc: '右边一列的值写成什么字，正负号由调用方定。',
          },
          { name: 'formatX', type: '(index: number) => string', desc: '读数行写第几个点是什么时间；不给没有读数行。' },
          {
            name: 'bands',
            type: 'number',
            default: '3',
            desc: '几条带（待核对：Heer 等《Sizing the Horizon》比较过 2 到 4 带，没读到原文结论）。',
          },
          {
            name: 'scale',
            type: "'shared' | 'row'",
            default: "'shared'",
            desc: 'shared：所有行同一把满刻度，行与行可比；row：每行各用自己的最大值，只看形状。',
          },
          { name: 'max', type: 'number', desc: '固定满刻度；不给按数据算。' },
          { name: 'rowHeight', type: 'number', default: '24', desc: '一行高（px）。' },
        ],
      },
    ],
    states: [
      '默认：每行涨色带在基线上方叠起、跌色带同一基线叠起，右边写最新值。',
      '扫读：每行同一根竖线，右边一列写那一格的值，读数行写时间。',
      '共用刻度：小行只有浅带；各自刻度：每行都填满。',
      '一行全是 0 或没数据：画成空行，值写「—」或 0。',
    ],
    donts: [
      '不要拿它读精确值：颜色深浅只是量级，精确值在右边一列与读数里。',
      '不要在 scale 为 row 时比较不同行的高低：每行的满刻度不一样。',
      '不要超过十来行：行高 24px，几十行用 SmallMultiples 或表。',
    ],
    composition:
      'HorizonChart\n  div[role=group]\n    每行：名字 · 窄带 svg（正、负各 bands 条 path）· 值\n  读数行（aria-live）',
    keys: [
      ['← →', '选中前后一格；没选中时先落到最新一格'],
      ['Shift + ← →', '一次三格'],
      ['Home / End', '第一格 / 最后一格'],
      ['Esc', '清掉选中'],
    ],
  },
  {
    id: 'small-multiples',
    group: 'blocks',
    cardHeight: 600,
    title: 'SmallMultiples 小图阵列',
    summary:
      '自选、组合里多个品种并排各一张小折线，同一个十字线：指针在任一张上移动，所有张的竖线与读数一起走；每张标题写名字与那一格的值。功能参照 Arc 的 Small multiples。',
    exports: ['SmallMultiples'],
    props: [
      {
        part: 'SmallMultiples',
        note: '一行放几张由容器宽与 minWidth 定。各张点数应当相同，短的张在超出的格上不画竖线。',
        rows: [
          { name: 'items', type: '{ key, label, values }[]', desc: '每张一个品种：名字与从旧到新的值。' },
          { name: 'label', type: 'string', desc: '整个阵列的读屏名（必填）。' },
          {
            name: 'formatValue',
            type: '(value: number) => string',
            desc: '标题右边的值写成什么字：没选中写最新值，选中后写那一格。',
          },
          { name: 'formatX', type: '(index: number) => string', desc: '读数行写第几个点是什么时间；不给没有读数行。' },
          {
            name: 'yScale',
            type: "'each' | 'shared'",
            default: "'each'",
            desc: 'each：每张用自己的上下范围（看形状）；shared：所有张同一把（可比）。',
          },
          { name: 'minWidth', type: 'number', default: '160', desc: '每张的最小宽（px）。' },
          { name: 'height', type: 'number', default: '56', desc: '折线区高（px）。' },
          {
            name: 'onSelect',
            type: '(key: string) => void',
            desc: '给了标题就是按钮（可聚焦），点了拿到这一张的 key。',
          },
        ],
      },
    ],
    states: [
      '默认：每张画一条线，线色按头尾比（涨跌色跟涨跌配色走，持平中性色），标题写最新值。',
      '扫读：所有张同一格画竖线与点，标题的值换成那一格。',
      '某张没数据：线不画，值写「—」。',
    ],
    donts: [
      '不要在 each 时比较不同张的高低：每张的上下范围不一样，要比用 shared。',
      '不要放几十张：每张都是一个 svg，量大用 HorizonChart 或表格里的迷你图。',
      '不要在包里写品种名或单位：名字与值的写法都由调用方传。',
    ],
    composition:
      'SmallMultiples\n  div[role=group]（网格）\n    每张：标题（名字 · 值；可点时是 button）· 折线区（svg 折线 · 竖线与点）\n  读数行（aria-live）',
    keys: [
      ['← →', '选中前后一格；没选中时先落到最新一格'],
      ['Shift + ← →', '一次三格'],
      ['Home / End', '第一格 / 最后一格'],
      ['Esc', '清掉选中'],
      ['Tab / Enter', '可点时到标题、触发 onSelect'],
    ],
  },
  {
    id: 'series-explorer',
    group: 'blocks',
    cardHeight: 1100,
    title: 'SeriesExplorer 序列探索',
    summary:
      '盈亏探索积木：一排 KPI 瓦片（SparkTile），点一张展开成下面的图面板；面板顶上是指标页签、区间切换、对比上一期、右上三件，图是该指标的序列（柱或线），下面是刷选条；顶行可以对账（期初到期末、差额、灯加词），页脚来源行。交互参照 Arc 的 Metric explorer，样子与内容照设计稿 IntradayPnL、PnLLedger、EquityCurve 三张卡。',
    exports: ['SeriesExplorer'],
    props: [
      {
        part: 'SeriesExplorer',
        note: '序列、区间、指标、明细表的列都由调用方传，包里没有文案。点按时间从旧到新，at 是毫秒时间戳（UTC）；区间是最近 N 个日历月。',
        rows: [
          {
            name: 'points',
            type: '{ at, values, closed? }[]',
            desc: '每个点一个时间戳与各序列的值（指标用到的、不画的值——权益、出入金——也放在这里）。closed 是休市：图上画灰色竖带，时间轴不压缩。',
          },
          {
            name: 'series',
            type: '{ key, label, kind: "bar" | "line", color?, cost? }[]',
            desc: 'bar 柱；line 折线（2px，不填面，不用涨跌色）。颜色按在完整列表里的次序取 series-1..7，筛选不重新上色；cost 是成本类（费税），柱用 ink-100 不着色。',
          },
          {
            name: 'kpis',
            type: '{ key, label, series, reduce, format, lowerIsBetter?, limit? }[]',
            desc: '每个指标一张瓦片、一个页签。limit 是限额线：图上红虚线、瓦片上琥珀虚线；lowerIsBetter 用灰色迷你线。',
          },
          {
            name: 'ranges / defaultRange',
            type: '{ key, label, months: number | null }[]',
            desc: '区间按钮；months 是最近几个日历月，null 是全部；默认选最后一个。',
          },
          {
            name: 'reconcile',
            type: '{ net, equity, cashflow?, openingEquity, format }',
            desc: '对账：期末 − 期初 应等于 Σ净盈亏 + 出入金；对得上亮 ok 灯，否则 warn 灯并写差额。三个键指向 points 里的序列。',
          },
          {
            name: 'columns / labels',
            type: 'object',
            desc: '明细表的列（表格视图里）；所有说明文字（读屏名、开关字、来源行、对账的词、右上三件的名字、刷选条手柄名）。',
          },
          {
            name: 'formatAt / formatValue / formatChange',
            type: 'functions',
            desc: '时间（ISO 次序）、图上的数、相对上一期的变化各写成什么。',
          },
          {
            name: 'onExport / onFullscreen / defaultMetric',
            type: 'callbacks / string | null',
            desc: '导出与全屏回调不给就不画按钮；初始展开哪个指标，null 是收起。',
          },
          { name: 'chartHeight', type: 'number', default: '220', desc: '图高（px）。' },
          {
            name: 'regimes',
            type: 'Omit<RegimeStripProps, "scale">',
            desc: '市场状态带：画在时间轴下，跟序列共用横轴与十字线，悬停框多一行当前所处的状态。段是左闭右开 [from, to)，单位同 points 的 at；不给就没有这一块。十字线按 14px 的带画，所以不要传 title（它会把带挤下去一行）。',
          },
        ],
      },
    ],
    states: [
      '默认：展开第一个指标，最后一个区间，对比关。',
      '点瓦片：展开那个指标的面板；再点同一张收起；Esc 先清扫读点、再收起。',
      '切指标或区间：线平滑变形（Chromium），页签高亮滑过去。',
      '拖刷选条：窗口改了，区间按钮都不亮；点区间按钮回到那个区间。',
      '对比上一期：窗口前面够长才可开，画同一序列的上一期（灰色虚线，按下标对齐）；不够长开关禁用。',
      '对账对不上：灯转琥珀，差额写在后面。',
      '表格视图：右上角第一个按钮切到明细表（键盘可达）。',
      '给了 regimes：图和时间轴下多一条状态带与图例，状态段与图里的一格一点对齐；悬停某点时带上也有十字线，悬停框多一行当前状态。',
    ],
    donts: [
      '不要在包里算盈亏：已实现、手续费、净值都由调用方在 points 里给好。',
      '不要给线填面或用涨跌色：涨跌色只上数字（明细表的盈亏列、瓦片的变化行）。',
      '不要给费税着色：成本不是亏损，柱用 ink-100。',
      '不要用它画不按时间排的数据：点必须按时间从旧到新。',
      '上一期没有或为 0 时变化写破折号，不要自己补一个百分比。',
    ],
    composition:
      'SeriesExplorer\n  对账顶行（LCD：期初 → 期末 · 差额 · 灯 + 词）\n  SparkTile × n\n  面板（页签 · 区间 · 对比 · ChartActions）\n    图（div[role=slider]：svg 柱或线 · 休市带 · 限额线 · 末点 · LCD tooltip）或 表格视图\n    BrushStrip\n  来源行',
    keys: [
      ['← →', '页签上：切指标；图上：扫读前后一点（没选中时先落到最新一点）'],
      ['Shift + ← →', '图上一次三点'],
      ['Home / End', '页签：第一个 / 最后一个指标；图：第一点 / 最后一点'],
      ['Esc', '先清扫读点，再收起面板'],
      ['Enter / Space', '瓦片：展开或收起'],
    ],
  },
  {
    id: 'json-viewer',
    group: 'readouts',
    cardHeight: 511,
    title: 'JsonViewer JSON 查看器',
    summary:
      '只读的 JSON 树：对象与数组可折叠，叶子按类型上色，上面一个查找框，命中的键名与值高亮、祖先自动展开。原始消息、Agent 调用结果、连接调试用它。功能参照 Arc，实现原创。',
    exports: ['JsonViewer'],
    props: [
      {
        part: 'JsonViewer',
        note: '底座是 react-aria-components 的 Tree（角色 treegrid）。value 换了，展开状态重来。不是 JSON 的值（undefined、日期、bigint、循环引用）不抛错：画成看得见的字。',
        rows: [
          { name: 'value', type: 'unknown', desc: '要看的值，通常是 JSON.parse 的结果。' },
          { name: 'label', type: 'string', desc: '整棵树的读屏名。' },
          {
            name: 'labels',
            type: 'JsonViewerLabels',
            desc: '文字：search（查找框的读屏名与占位）、matches(n)（命中数）、more(n)（被截掉的子项）；包里不带语言。',
          },
          {
            name: 'defaultExpandDepth',
            type: 'number',
            default: '1',
            desc: '一开始展开几层：1 只开根，2 连根的子容器。',
          },
          {
            name: 'maxChildren',
            type: 'number',
            default: '200',
            desc: '一个容器最多画多少个子项，多出的折成一行「还有 N 项」。200 没有出处，是让一次展开最多出几百行的估计，待定。',
          },
        ],
      },
    ],
    states: [
      '折叠的容器写概要：对象 {3}，数组 [5]；展开的箭头转 90 度。',
      '叶子按类型上色：字符串琥珀、数字蓝、布尔与 null 橙。',
      '查找：键名或叶子的字含查询词（不分大小写）就高亮，命中的祖先自动展开且查找期间收不掉；清空后回到你自己展开的样子。',
      '超出 maxChildren：末尾一行「还有 N 项」。',
    ],
    donts: [
      '不要用它编辑或复制：它只读；要复制用 CodeBlock。',
      '不要喂几十万行的值：它不做虚拟滚动，超大的先在数据层裁一刀，或调小 maxChildren。',
      '不要拿它显示业务表格：规整的行列用 DataGrid。',
    ],
    composition:
      'JsonViewer\n  label > input[type=search] + span[role=status]\n  Tree（react-aria）\n    TreeItem × n（递归）：箭头、键名、概要或值',
    keys: [
      ['↑ ↓', '上下走一行'],
      ['→ / ←', '展开 / 收起，或进子级 / 回父级'],
      ['Home / End', '第一行 / 最后一行'],
      ['打字', '在树里：跳到以它开头的键名；在查找框里：查找'],
    ],
  },
  {
    id: 'step-player',
    group: 'readouts',
    cardHeight: 155,
    title: 'StepPlayer 分步进度条',
    summary:
      '左边一个播放 / 暂停 / 重放钮，右边一排圆点：当前一步撑成长条、里面的填充随时间走，走完去下一步。可循环，可点圆点跳步。学自 rare-ui。',
    exports: ['StepPlayer'],
    propParts: [{ part: 'StepPlayer', note: '值与播放状态都可受控，也可不受控。文字全由 labels 给，包里没有文案。' }],
    states: ['播放中：当前一步撑成长条，里面的填充随时间走。', '暂停、重放；可循环。', 'seekable 时可点圆点跳步。'],
    donts: [
      '它是按时间走的演示进度，不要拿它表示真实任务进度（用 Progress）。',
      '尺寸只用 sm（24）与 md（32）：直接写像素数的旧写法留一个版本。',
      '可跳时每个圆点都要有读屏名：步上写 label，或给 labels.step。',
    ],
    composition:
      'StepPlayer\n  button（播放 / 暂停 / 重放，图标弹簧缩放着换）\n  div role=group（圆点条）\n    div（一步：长条 / 亮点 / 暗点）\n      button（可跳时的点击区）',
    keys: [
      ['Tab', '到播放钮，可跳时再到每个圆点'],
      ['Enter / Space', '播放、暂停、重放；在圆点上是跳到那一步'],
    ],
  },
  {
    id: 'theme-selector',
    group: 'forms',
    cardHeight: 457,
    title: 'ThemeSelector 主题选择',
    summary:
      '每个主题一张缩略预览（迷你控制台），选中的那张加一圈环，环在选项之间用弹簧滑过去。缩略颜色由调用方传，所以能同时预览别的主题。学自 rare-ui。',
    exports: ['ThemeSelector'],
    propParts: [
      { part: 'ThemeSelector', note: 'role=radiogroup；tab 只停在选中那张。value 传 null 表示受控但还没选。' },
    ],
    states: ['选中的那张加一圈环，环在选项之间用弹簧滑过去。', '禁用：不响应。'],
    donts: [
      '缩略颜色由调用方传，不要在包里写死主题色。',
      '不要拿它选主题以外的东西：缩略图画的是一块控制台，别的选项用 ToggleGroup 或 Select。',
      '主题超过四五个时别全摆成缩略：改成下拉，缩略只放常用的。',
    ],
    composition: 'ThemeSelector\n  button role=radio（缩略 SVG + 选中环）\n  span（名字）',
    keys: [
      ['Tab', '进入 / 离开整组（停在选中那张）'],
      ['← → ↑ ↓', '移到上一张 / 下一张并选中，到头循环'],
      ['Home / End', '第一张 / 最后一张'],
    ],
  },
  {
    id: 'code-block',
    group: 'readouts',
    cardHeight: 565,
    title: 'CodeBlock 代码块',
    summary:
      '带文件名头、行号、一键复制的代码块；配色由一个强调色混出来（关键字取强调色，字符串、数字、函数是它与正文色的不同比例，注释灰），两个主题自动跟着换。词法切分是自己写的，不加依赖。学自 rare-ui。',
    exports: ['CodeBlock'],
    propParts: [
      {
        part: 'CodeBlock',
        note: '认得 ts / tsx / js / json / py / sh / css；别的语言当纯文本。开头的空行与结尾的空白会去掉。',
      },
    ],
    states: [
      '带文件名头、行号、复制钮；复制后钮变对勾、读屏名换成 labels.copied，1.8 秒复原。',
      '可高亮指定的行（强调色 12% 的底）。',
      '没有头：复制钮浮在右上角。',
    ],
    donts: [
      '复制钮的文案由调用方传（labels.copy、labels.copied；旧的 copyLabel / copiedLabel 留一个版本）。',
      '注释不要用 ink-4：深底上不到 3:1，注释色是 ink-3 斜体。',
      '不要拿它执行或渲染代码：代码只当文字画。',
    ],
    composition:
      'CodeBlock\n  div（头：名字 + 复制钮）\n  div role=region（滚动区，可聚焦）\n    pre > 每行一个 div（行号 + token）',
    keys: [
      ['Tab', '复制钮、再到滚动区'],
      ['方向键', '滚动区聚焦时滚动'],
      ['Enter / Space', '复制'],
    ],
  },
  {
    id: 'web-search',
    group: 'feedback',
    cardHeight: 311,
    title: 'WebSearch 检索来源',
    summary:
      '联网检索的来源：一枚药丸（带进度环的地球、状态文字、叠起来的来源小标）点开是一排来源卡片；WebSearchCitation 是回答正文里的行内引用，悬停或键盘聚焦弹出预览。不存也不开 URL，来源小标是站名首字母。学自 rare-ui。',
    exports: ['WebSearch', 'WebSearchCitation', 'useHoverIntent'],
    propParts: [
      {
        part: 'WebSearch',
        note: '检索中的进度环每来一条结果补上剩下的 30%，不会自己走满；第四条起最后一格是「还有 N 条」。',
      },
      { part: 'WebSearchCitation', note: '悬停停 300ms 才开、离开 150ms 才收；键盘聚焦立即开。' },
      {
        part: 'useHoverIntent',
        note: '钩子 (openDelay = 300, closeDelay = 150)：返回 { active, set(next, delay), hover }，hover 展开到触发处与弹层上。触屏不处理。',
      },
    ],
    states: [
      '药丸：进度环、状态文字、叠起来的来源小标。',
      '点开是一排来源卡片；「还有 N 条」展开全部。',
      '行内引用：悬停或键盘聚焦弹出预览。',
    ],
    donts: [
      '不存也不开 URL：要打开来源由调用方在 onOpen 里处理。',
      '「还有 N 条」「收起」由调用方传（labels.more / labels.less；旧的 moreLabel / lessLabel 留一个版本）。',
      '不要去取网站图标：来源小标是站名首字母（micro 字号），不发网络请求。',
    ],
    composition:
      'WebSearch\n  button（药丸：地球 + 文字 + 小标 + 箭头）\n  ol（来源卡片 / 骨架 / 更多 / 收起）\nWebSearchCitation\n  button（行内小标）\n  span role=tooltip（预览）',
    keys: [
      ['Enter / Space', '展开或收起来源区；在「还有 N 条」上展开全部'],
      ['Tab', '药丸、卡片（给了 onOpen 时）、行内引用；聚焦行内引用立即弹出预览'],
    ],
  },
  {
    id: 'task-list',
    group: 'forms',
    cardHeight: 231,
    title: 'TaskList 任务清单',
    summary:
      '点一行打勾：圆圈填上强调色、对勾一笔画出来、文字被一道线划掉，划完这一行沉到底部，其余行弹簧补位；再点取消，回到原位。学自 rare-ui。',
    exports: ['TaskList'],
    propParts: [{ part: 'TaskList', note: '每行是 role=checkbox 的按钮；屏外有 role=status 的区播报勾上与取消。' }],
    states: ['未勾：空圈。', '已勾：圆圈填强调色、对勾画出、文字划掉，沉到底部。', '再点取消，回到原位。'],
    donts: [
      '任务文案与标签由调用方传。',
      '不要拿它做多选筛选：勾上的行会沉底换位置，筛选用 ChipGroup 或 Checkbox。',
      '任务的真实状态以数据为准：勾选只回调 onValueChange，写不写回由调用方定。',
    ],
    composition:
      'TaskList\n  li（layout 动画）\n    button role=checkbox（圆圈 + 对勾 + 划线文字）\n  li role=status（播报）',
    keys: [
      ['Tab', '在各行之间移动'],
      ['Space / Enter', '勾上或取消'],
    ],
  },
  {
    id: 'refresh-control',
    group: 'forms',
    cardHeight: 80,
    title: 'RefreshControl 自动刷新',
    summary:
      '自动刷新的间隔分段（TradingView 筛选器是 10 秒 / 1 分钟 / 不刷新）+ 立即刷新钮 + 上次刷新时刻 + 下次倒计时。受控：间隔、上次时刻、在不在刷都由调用方给，到点调 onRefresh；标签页隐藏时停，回来过了点马上刷。',
    exports: ['RefreshControl', 'useAutoRefresh', 'formatRemaining', 'formatClock'],
    propParts: [
      {
        part: 'RefreshControl',
        note: 'options 每项 { value 毫秒（0 是不刷新）, label }；文字都在 labels。refreshing 时图标转圈、倒计时停、钮 aria-disabled（不丢焦点）。',
      },
      {
        part: 'useAutoRefresh({ interval, lastRefreshed, onRefresh, refreshing?, pauseWhenHidden? })',
        note: '只要计时不要界面时用：返回离下次刷新的毫秒数（关着、在刷、标签页隐藏时是 null）；同一个到点时刻只调一次 onRefresh。',
      },
      {
        part: 'formatRemaining / formatClock',
        note: '倒计时写 12s / 1:05；时刻写本地 HH:MM:SS。',
      },
    ],
    states: [
      '开着：「下次 12s」每秒走一格，到 0 调 onRefresh。',
      '在刷：图标转圈，倒计时不显示。',
      '不刷新：没有倒计时，只有上次时刻与立即刷新。',
      '还没刷过：上次那段写 labels.never（默认 —）。',
    ],
    donts: [
      '不要把倒计时放进 aria-live：每秒读一遍太吵。',
      '不要在包里拉数据：onRefresh 里调用方自己拉，拉完更新 lastRefreshed。',
    ],
    composition: 'RefreshControl\n  ToggleGroup（间隔）\n  立即刷新钮\n  上次 <time> · 下次 倒计时',
    keys: [
      ['Tab', '走到间隔分段（按钮组，aria-pressed 标当前档）与刷新钮'],
      ['Enter / Space', '选间隔；在刷新钮上立即刷新'],
    ],
  },
  {
    id: 'duration-picker',
    group: 'forms',
    cardHeight: 141,
    title: 'DurationPicker 时长选择',
    summary:
      '平时是连成一整条的药丸「2 时 30 分」加笔钮；点笔钮三段用弹簧分开、内侧圆角长出来，数字变成可输入的框，笔变对勾；点对勾确认。输入超上限夹住并抖一下。学自 rare-ui。',
    exports: ['DurationPicker'],
    propParts: [
      {
        part: 'DurationPicker',
        note: '可受控（value）也可不受控（defaultValue）；打字时立刻回调夹好的值，确认另走 onConfirm。data-editing 表示在编辑。',
      },
    ],
    states: [
      '平时：连成一整条的药丸加笔钮。',
      '编辑中：三段分开，数字变成输入框，笔变对勾。',
      '输入超上限：夹住并抖一下。',
      '禁用：笔点不动。',
    ],
    donts: [
      '上限 maxHours、maxMinutes 由调用方定，不要省略。',
      '不要拿它输入时刻（几点几分）：那是 DateTimeInput 的时间段。',
      '要秒或天时别硬塞：它只有时、分两段。',
    ],
    composition: 'DurationPicker\n  div（时 + 数字框）\n  div（分 + 数字框）\n  button（笔 / 对勾）',
    keys: [
      ['Enter', '确认'],
      ['Esc', '放弃这次编辑，回到编辑前的值'],
      ['↑ ↓', '当前字段加减 1'],
    ],
  },
  {
    id: 'data-grid',
    group: 'blocks',
    cardHeight: 520,
    title: 'DataGrid 数据表',
    summary:
      '拼面板用的数据表：TanStack Table 管排序、列宽、顺序、显隐，虚拟滚动只画看得见的行；列声明一个类型（价格、数量、盈亏、涨跌幅、方向、时间、品种……），格式化、对齐、着色、排序由类型给。列的状态受控（调用方存）；应用的能力经 DataGridHost 注入。',
    exports: [
      'DataGrid',
      'DataGridHostProvider',
      'tableCsv',
      'ColumnPicker',
      'usePersistedState',
      'readPersisted',
      'useSavedViews',
      'reorderColumn',
      'moveColumn',
      'setColumnVisible',
      'setColumnFixed',
      'applyColumnSet',
      'activeColumnSet',
    ],
    propParts: [
      {
        part: 'DataGrid',
        note: '示例数据写死在页里，不是行情。行高档：compact 20、default 24、relaxed 32。没有 DataGridHost 时能点、能排序、能键盘选行，只是没有快捷键与标准右键项。',
      },
      {
        part: '列类型 ColumnType',
        note: '数字类默认靠右，用等宽数字；pnl、change、side 用 ToneText 跟 data-updown 着色（红涨绿跌时互换）。bar 是以 0 为中线的居中条（正在右用涨色、负在左用跌色，长度按本列绝对值最大者归一，数字写在条旁；format 的 digits 与 suffix 同 pnl）。pill 是一格多枚短标签（值是字符串或 { label, tone } 的数组，tone 只有 up / down / muted / accent 四种，不传色值），一行放不下的按格子宽度收成「+n」、悬停的 title 写全部，format.maxPills 可再限个数。progress 是分子 / 分母加一条 3px 细条（值是 { done, total } 或 [done, total]，分母不是正数不画条，排序按比例）。任何列都可以再声明 heat: { domain, rank? }：格子底色按值深浅（跨 0 的 domain 里正数用涨色、负数用跌色，不跨 0 的按单边从最小到最大），rank 给了就在格子右上角写名次小字，不占行高行宽；颜色只由 token 给，不传色值。',
      },
      {
        part: 'DataGridHost（经 DataGridHostProvider 提供）',
        symbol: 'DataGridHost',
        note: '应用才有的能力；包里不带语言，文案都是宿主经 labels（DataGridLabels）传的；旧名 texts / DataGridTexts 留一个版本（G6）。',
      },
      {
        part: 'ColumnPicker',
        symbol: 'ColumnPicker',
        note: '触发按钮加弹层：上面列集芯片（整套列一键切换，亮着哪个由看得见的列恰好等于它的列推出来），下面逐列勾选。不存状态，layout 受控；最后一列看得见的不许藏。',
      },
      {
        part: 'usePersistedState(key, initial, { version, storage?, validate? })',
        note: '像 useState，值存进存储（默认 localStorage，读写包 try/catch）；版本不符、坏了、validate 不过都当没存过，不写迁移。返回 [值, 设值, 重置]。',
      },
      {
        part: 'readPersisted(key, { version, storage?, validate? })',
        note: '读 usePersistedState 存的值；没有、坏了、版本不符、validate 不过都返回 undefined。',
      },
      {
        part: 'useSavedViews({ key, version, storage?, recentLimit? })',
        note: '命名视图的快照仓库（值由调用方定，件只当不透明 JSON）：saveAs 另存、save 覆盖、remove、setDefault、use（记进最近并返回值）、recent、exportJson / importJson。',
      },
      {
        part: 'reorderColumn / moveColumn / setColumnVisible / setColumnFixed / applyColumnSet / activeColumnSet',
        note: '列摆法（layout）的纯函数，列头菜单、拖动重排与 ColumnPicker 用的同一份，都返回新数组。reorderColumn(layout, from, to) 拖到目标位置；moveColumn(layout, id, ±1) 跳过藏起来的列移一格；setColumnVisible 不许藏最后一列；setColumnFixed 固定的列挨着排在最前；applyColumnSet(layout, columns) 套列集；activeColumnSet(layout, sets) 返回看得见的列恰好等于的那个列集 id。',
      },
      {
        part: 'tableCsv(header, rows)',
        symbol: 'tableCsv',
        note: '导出的 CSV：含逗号、引号、换行的格子加引号，公式开头的补单引号。',
      },
    ],
    states: [
      '无行：显示 emptyText 或空白，表头仍在。',
      '有选中行：一整行底色，Esc 清掉。',
      '键盘所在行：焦点环；排序列：表头带升降箭头。',
      '只读（interactive=false）：table 语义，表头不是按钮。',
      '子行：有子行的行带 aria-expanded（true 摊开、false 收起）；没有子行的行没有这个属性，按 → 没反应。',
      'custom 列没有 text 时复制与导出是空字；有按钮的格子别指望整行点击。',
      '列优先级（standard 与 hero 分量，有表头）：可见列放不下容器时按 GridColumn.priority 从低到高收起（没写的按声明顺序，第一列 1、第二列 2……），至少留两列，固定在左边的列不收；表头右端出「+N 列」胶囊（文案 texts.moreColumns，默认英文 +N cols），点了切成横向滚动、显示全部列，胶囊变 texts.collapseColumns，再点收起。出胶囊时表头与数据行在右端让出它的宽度，不盖住最后一列（stretch 的表，保留的列撑满的是容器宽减胶囊宽）。状态只在组件里，不存；容器变宽放得下了胶囊就消失。只影响显示：复制与导出仍是全部可见列。compact 分量与不画表头的表不走这一套；collapseColumns={false} 关掉，一直横向滚动。',
    ],
    donts: [
      '不要把例子里的数据当真实行情；调用方要传真实行。',
      '不要为了放进窄容器自己去藏列或截断：给列写 priority，放不下的由表收起并写出收了几列。',
      '不要给数值列自己写 text-align；列类型决定对齐。',
      '不要靠颜色以外没有符号的方式表达涨跌。',
      '不要在 custom 列里重画 price、pnl 这类有类型的格子；有类型的用类型，custom 留给类型表达不了的。',
      '不要把整张子表塞进子行；子行放一两段说明或一个表单，更多的另开页面。',
    ],
    composition:
      'DataGrid\n  ContextMenu（行与空白处的右键菜单）\n  表头行（列头按钮、拖动把手）\n  虚拟滚动的行（单元格：文字 | ToneText | 品种两段 | 调用方 render / cell）\n  子行（renderSubRow，展开的行后面）\n  foot',
    keys: [
      ['↑ / ↓', '移一行；Home / End 到头尾'],
      ['Enter', '打开键盘所在的行（onOpen）'],
      ['→ / ←', '展开 / 收起键盘所在行的子行（renderSubRow）'],
      ['Shift / Ctrl 点击', '选一段 / 点选加减'],
      ['Esc', '清掉选择（右键菜单开着时归菜单）'],
      ['列头右键', '列头菜单：排序、固定、隐藏、左右移、重置列'],
      ['拖动列头', '重排列（放在目标列的位置）'],
      ['菜单键 / Shift+F10', '开右键菜单（宿主的 matchKey 提供）'],
      ['Ctrl+C / Ctrl+S / Ctrl+R', '复制所选行 / 导出 CSV / 重置列（宿主的键位表）'],
    ],
  },
  {
    id: 'grid-summary-row',
    group: 'blocks',
    cardHeight: 300,
    title: 'GridSummaryRow 表尾合计',
    summary:
      'DataGrid 的 summary 属性：表尾一到几行合计 / 均值 / 中位数，按列配聚合（sum、avg、min、max、median、count 或自己的函数），对全部行算；跟表同一份列宽与固定列，横向滚动跟着走、纵向粘在底边。字照列类型写，跟上面的行对得齐。',
    exports: ['GridSummaryRow', 'aggregateValues', 'summaryCells'],
    propParts: [
      {
        part: 'DataGrid summary: GridSummary[]',
        symbol: 'GridSummary',
        note: '每行 { id, label, columns: { 列 id: 聚合 | { aggregate, text? } } }；label（合计、均值）写在第一个没配聚合的列，都配了就挂在行的读屏名上。',
      },
      {
        part: 'aggregateValues(aggregate, values, rows?)',
        note: '一组数的聚合：空的是 null（count 是 0）；median 取中间两个的平均。',
      },
      {
        part: 'summaryCells(columns, rows, summary, env?)',
        note: '一行汇总各列的值与字（纯函数）：数值类照原类型写（价格按精度、盈亏带符号与方向），count 与非数值列按整数写；精度随行变的列取第一行的。',
      },
      {
        part: 'GridSummaryRow',
        note: 'DataGrid 内部画汇总行的件（列模板、固定列、aria-rowindex 由表给）；一般经 DataGrid 的 summary 用，不单摆。',
      },
    ],
    states: [
      '有汇总：表尾一组 rowgroup，上面一道分隔线、底色 surface-raised、600 字重；行名次要文字色。',
      '固定列：汇总行的固定格同样粘在左边。',
      '没有有效值：sum / avg 这类写 —，count 写 0。',
      '看得见的列都没配聚合的汇总行不画。',
    ],
    donts: [
      '不要对涨跌幅、价格求和：用 avg 或 median。',
      '不要只汇总看得见的行：汇总对全部行算（虚拟滚动只画几十行）。',
    ],
    composition:
      'DataGrid\n  表头\n  行\n  GridSummaryRow × n（rowgroup，粘在底边）\n    行名格 · 聚合格（ToneText 或字）',
    keys: [],
  },
  {
    id: 'empty-state',
    group: 'blocks',
    cardHeight: 260,
    title: 'EmptyState 空态',
    summary: '面板的「空」态：点阵小标签、一行标题、说明与动作。没有连接、没选品种、没有数据时摆它，不画假数据。',
    exports: ['EmptyState'],
    propParts: [
      {
        part: 'EmptyState',
        note: 'role=status；标题是 h3。点阵标签、说明、动作都可省；classNames 按部位挂额外的类。',
      },
    ],
    states: ['有操作：标题、说明下面带操作区。', '无操作：只有标题与说明。'],
    donts: ['不要拿空态当加载中；加载用 Loading。', '不要写没有下一步的空态说明。'],
    composition: 'EmptyState（role=status）\n  标签\n  标题（h3）\n  说明\n  动作',
    keys: [],
  },
  {
    id: 'panel-frame',
    group: 'blocks',
    cardHeight: 400,
    title: 'PanelFrame 面板壳',
    summary:
      '所有工作台面板共用的外框：标题栏（联动色点、标题、当前对象、工具条、右侧动作）、内容区、可折叠、焦点四角括号。面板自己不画边框与阴影。',
    exports: ['PanelFrame', 'PanelFrameHeader', 'PanelFrameBody'],
    props: [
      {
        part: 'PanelFrame',
        note: '其余属性透传给 section。拖动重排、关闭、右键菜单、改名由宿主接。',
        rows: [
          { name: 'focused', type: 'boolean', default: 'false', desc: '焦点面板：标题提亮，其余面板标题退后。' },
          {
            name: 'brackets',
            type: 'boolean',
            default: 'false',
            desc: '画四角括号（大屏模式的焦点面板；什么时候算大屏由宿主定）。',
          },
          { name: 'collapsed / defaultCollapsed', type: 'boolean', desc: '折叠：只剩标题栏。受控或自管。' },
          { name: 'onCollapsedChange', type: '(collapsed: boolean) => void', desc: '折叠状态变了。' },
          {
            name: 'classNames',
            type: 'Partial<Record<PanelFrameSlot, string>>',
            desc: '各部分额外挂的类名（宿主的旧类名钩子）。',
          },
        ],
      },
      {
        part: 'PanelFrameHeader',
        note: '其余属性（含 title 悬停提示、onDoubleClick、ref）展开到 header，宿主可以拿 ContextMenuTrigger asChild 包它。',
        rows: [
          { name: 'heading', type: 'ReactNode', desc: '标题（h2）。不传就没有标题行（空格子）。' },
          {
            name: 'headingHidden',
            type: 'boolean',
            default: 'false',
            desc: '标题只给读屏、不画出来（工具条占着标题栏时）。',
          },
          { name: 'object', type: 'ReactNode', desc: '标题后的当前对象（品种、过滤条件），等宽小字。' },
          {
            name: 'linkGroup',
            type: "'A' | 'B' | 'C' | 'D' | null",
            desc: '联动色点：给组名画那组的颜色；null 画熄灭的环；不传不画。',
          },
          {
            name: 'labels',
            type: '{ link?, collapse?, expand? }',
            desc: '色点的名字（有 linkGroup 时必填）、折叠按钮两态的名字（collapsible 时必填）；旧名 linkLabel / collapseLabel / expandLabel 留一个版本。',
          },
          { name: 'pinned', type: 'boolean', default: 'false', desc: '固定（不跟随联动）：色点变空心圆。' },
          { name: 'toolbar', type: 'ReactNode', desc: '标题后的局部工具条（Toolbar）。' },
          { name: 'actions', type: 'ReactNode', desc: '右侧动作槽（设置、最大化、关闭）；不超过三个，更多进设置。' },
          {
            name: 'collapsible',
            type: 'boolean',
            default: 'false',
            desc: '画折叠按钮（名字经 labels.collapse、labels.expand 传）。',
          },
        ],
      },
      {
        part: 'PanelFrameBody',
        note: '其余属性透传给 div（tabpanel 的 role、id 也走这里）。',
        rows: [
          {
            name: 'status',
            type: "'ready' | 'loading' | 'empty' | 'disconnected'",
            default: "'ready'",
            desc: 'ready 画 children；loading 画骨架；empty、disconnected 画空态（旧名 state 留一个版本）。',
          },
          { name: 'labels', type: '{ loading? }', desc: 'loading 时骨架的名字（读屏念；旧名 loadingLabel）。' },
          {
            name: 'view',
            type: '{ tag?, title, description?, actions? }',
            desc: 'empty、disconnected 时空态的文字与动作。',
          },
        ],
      },
    ],
    states: [
      '焦点：标题 ink-100，且在大屏下画四角括号；其余面板标题 ink-300。',
      '折叠：只剩 32 高的标题栏，内容区隐藏（不拆掉）。',
      '固定：联动色点变空心圆；无联动：熄灭的环。',
      '加载：内容区是骨架；未连接 / 空：空态，不画假数据。',
    ],
    donts: [
      '面板不要自己画边框、阴影，只用这个壳。',
      '标题栏不要放超过三个图标按钮。',
      '不要把拖动、关闭、工作区的逻辑写进壳里，经 props 与展开的属性接。',
    ],
    composition:
      'PanelFrame\n  PanelFrameHeader（折叠钮 · 联动色点 · 标题 · 对象 · 工具条 · 动作）\n  PanelFrameBody（children / 骨架 / EmptyState）',
    keys: [['Enter / Space', '折叠按钮：折叠或展开（Tab 进到按钮上）']],
  },
  {
    id: 'status-bar',
    group: 'blocks',
    cardHeight: 280,
    title: 'StatusBar 状态栏',
    summary:
      '顶栏、底栏的分段模型：左 / 中 / 右三段，每段一组项（点阵键名、值、状态灯、可点）；项由数据声明，宽度不够时按优先级收进「…」。实盘项有琥珀框、不可收起。',
    exports: ['StatusBar', 'collapsedItems'],
    props: [
      {
        part: 'StatusBar',
        rows: [
          { name: 'left / center / right', type: 'StatusItem[]', desc: '三段各一组项。' },
          { name: 'label', type: 'string', desc: '状态栏的名字（读屏念）。' },
          { name: 'labels', type: '{ more }', desc: '「…」按钮的名字（旧名 moreLabel 留一个版本）。' },
        ],
      },
      {
        part: 'StatusItem',
        note: '一项的数据。',
        rows: [
          { name: 'id', type: 'string', desc: '稳定的 id。' },
          { name: 'label / value', type: 'string / ReactNode', desc: '点阵键名（灰）与等宽的值（亮）。' },
          {
            name: 'tone / ledLabel',
            type: 'SeverityExt / string',
            desc: '前面状态灯的语气（灯由 ledOf 取，accent 是点亮的强调色）与它的名字（给了灯就必须给名字）；旧名 led（LedState）留一个版本。',
          },
          { name: 'onClick', type: '() => void', desc: '给了整项是按钮（QUOTE → 数据源）。' },
          { name: 'priority', type: 'number', default: '0', desc: '越大越晚被收起。' },
          { name: 'pinned / live', type: 'boolean', desc: '永不收起；live 另外画琥珀内描边（实盘账户）。' },
          { name: 'hidden', type: 'boolean', desc: '隐藏（宿主「无事则隐藏」算出的结果），不占位。' },
        ],
      },
      {
        part: 'collapsedItems(items, available, gap, moreWidth)',
        note: '收起哪些项的纯函数，StatusBar 内部用，自己排版时也能拿去。',
        rows: [],
      },
    ],
    states: [
      '宽度够：所有项都在条上，段与段交替 bg-400 / bg-200，斜切叠接。',
      '宽度不够：先收优先级最低的（同级收靠后的）进「…」弹层，pinned 与 live 不收。',
      '项可点：悬停提亮，是按钮；不可点是纯读数。',
      '实盘项：琥珀内描边，不能被隐藏策略收掉。',
      '灯：项给 tone（Severity，加 off / accent），灯由 ledOf 取——neutral、off 不亮，accent 是点亮的强调色（实盘项用它）；旧的 led（LedState）留一个版本。',
    ],
    donts: [
      '段不要超过 8 个，更多进运行中心。',
      '整条栏亮灯不超过两盏（时钟不算）。',
      '不要把键名与值写成一个长句，键名用短大写词。',
    ],
    composition: 'StatusBar\n  group（左 / 中 / 右）\n    StatusItem：Led · 键名 · 值\n  Popover（「…」收起的项）',
    keys: [
      ['Tab', '依次到可点的项与「…」'],
      ['Enter / Space', '触发项；「…」打开收起的项'],
    ],
  },
  {
    id: 'splitter',
    group: 'layout',
    cardHeight: 210,
    title: 'Splitter 分割线',
    summary:
      '一条 role=separator 的分割线：拖动零延迟、方向键 8px（Shift 32px）、Home / End、双击或 Enter 复位、靠近 1/3 1/2 2/3 吸附、两边最小尺寸。宿主只管排版，线只管比例。',
    exports: ['Splitter', 'clampSplitRatio', 'snapSplitRatio', 'splitKeyRatio', 'DEFAULT_SNAP_POINTS'],
    props: [
      {
        part: 'Splitter',
        note: '线放在它分开的两块之间，量父元素的宽高换算比例（父元素是 grid，线占中间一条轨道）。',
        rows: [
          { name: 'axis', type: "'row' | 'column'", desc: 'row = 左右两块（竖线）；column = 上下两块（横线）。' },
          { name: 'ratio', type: 'number', desc: '第一块占可用长度的比例，0 到 1。' },
          { name: 'defaultRatio', type: 'number', default: '0.5', desc: '双击与 Enter 回到的比例。' },
          { name: 'minFirst / minSecond', type: 'number', default: '0', desc: '两边最小尺寸（px）。' },
          {
            name: 'snapPoints / snapThresholdPx',
            type: 'number[] / number',
            default: '1/3 1/2 2/3 / 6',
            desc: '吸附点与半径；传空数组或 0 关掉吸附。',
          },
          {
            name: 'keyStepPx / fastStepPx',
            type: 'number',
            default: '8 / 32',
            desc: '方向键一步与 Shift 加速的一步。',
          },
          {
            name: 'onPreview',
            type: '(ratio) => void',
            desc: '拖动中每次移动：宿主直接写样式改布局（不要 setState）。',
          },
          { name: 'onChange', type: '(ratio) => void', desc: '提交：松手、方向键、双击、Enter。' },
          { name: 'onDraggingChange', type: '(dragging: boolean) => void', desc: '开始 / 结束拖动。' },
          {
            name: 'label / valueText',
            type: 'string / (ratio) => string',
            desc: '线的名字与读屏念的值（说明第一块占几成）。',
          },
        ],
      },
    ],
    states: [
      '默认：1px line-100 的线，中央 16×2 的把手。',
      '悬停：线变 line-200，把手提亮。',
      '拖动中：线 2px signal-orange 加发光，把手同色；两侧实时重排。',
      '键盘焦点：2px 焦点环。',
    ],
    donts: [
      '不要拿它拖出新面板或拖到边缘分裂（不是 docking）。',
      '拖动中不要触发面板内部的重渲染。',
      '不要让松手改掉用户拖到的精确位置（吸附只在半径内）。',
    ],
    composition: 'Splitter（role=separator）\n  把手',
    keys: [
      ['← →（或 ↑ ↓）', '挪 8px；Shift 挪 32px'],
      ['Home / End', '第一块缩到最小 / 放到最大'],
      ['Enter', '回到默认位置（APG 里 Enter 是折叠，这里没有折叠）'],
    ],
  },
  {
    id: 'text-measure',
    group: 'layout',
    cardHeight: 300,
    title: 'measureText 文字测量',
    summary:
      '不碰 DOM 量文字：一行多宽、放不放得下、放不下截尾加省略号、按宽度折成几行、一段字多高。包一层 @chenglou/pretext（MIT）：同一段字同一字体只准备一次，宽度变了只重算排版。给 SVG / canvas 里的字（没有自动换行与省略号）、按字宽决定写不写字的格子、按内容定列宽、虚拟列表预先定行高用。字体按 CSS 变量解析成具名字体（去掉 -apple-system 这类量不准的系统别名）；Web 字体加载完、缩放、换字体时自动清缓存；没有 canvas 的环境退回估宽。',
    exports: ['measureText', 'fitsWidth', 'truncateText', 'wrapText', 'textHeight', 'fontFor', 'resetTextMeasure'],
    props: [
      {
        part: 'measureText',
        rows: [
          { name: 'measureText(text, font)', type: 'number', desc: '一行字的宽度（像素，像 max-content）。' },
          { name: 'fitsWidth(text, font, maxWidth)', type: 'boolean', desc: '放不放得下，留 2px 余量。' },
          {
            name: 'truncateText(text, font, maxWidth, ellipsis?)',
            type: 'string',
            desc: '放不下就按字素截尾加省略号。',
          },
          {
            name: 'wrapText(text, font, maxWidth, lineHeight, maxLines?)',
            type: '{ lines, height }',
            desc: '折成多行；超过 maxLines 的折进最后一行加省略号。',
          },
          { name: 'textHeight(text, font, maxWidth, lineHeight)', type: 'number', desc: '一段字的高度，给虚拟列表。' },
          {
            name: 'fontFor(weight, sizePx, familyVar?, element?)',
            type: 'string',
            desc: '拼 canvas 字体串：读 CSS 字体变量（默认 --font-sans），去掉系统别名。',
          },
          { name: 'resetTextMeasure()', type: 'void', desc: '手动清缓存（字体变了而自动监听没覆盖到时）。' },
        ],
      },
    ],
    states: ['有 canvas：pretext 实测', '没有 canvas（单测、服务端渲染）：按全角 1em、半角 0.6em 估'],
    donts: [
      '不要在每次渲染里 prepare 新文本又丢掉：同一段字会缓存，别拼随机串',
      '能用 CSS 的 text-overflow 解决的 HTML 文字不用它',
    ],
    composition:
      'measureText / fitsWidth / truncateText / wrapText / textHeight\n  fontFor（字体串）\n  @chenglou/pretext（prepare → layout）',
    keys: [],
  },
  {
    id: 'live',
    group: 'layout',
    cardHeight: 360,
    title: 'live 数据刷新',
    summary:
      '数据在动时的四个钩子，照行情终端（TradingView、Bloomberg、同花顺）的做法：useValueFlash 数值变了给涨 / 跌方向（闪 600ms，同一格 1 秒内最多一次）；useEnterMarks 认出新来的条目（高亮 1200ms）；useFlipList 顺序变了让行平滑换位（FLIP，240ms）；useStatusFlash 状态变了给一次性的闪（炸板这类用警示色）。皮肤是 ui.css 里的 .k-live-flash / .k-live-enter / .k-live-alert，涨跌色跟「涨跌颜色」设置走；时长是 token --dur-flash / --dur-enter / --dur-reorder。RollingText、MarketHeatmap、Watchlist 已经走这一层。',
    exports: [
      'useValueFlash',
      'useEnterMarks',
      'useFlipList',
      'useStatusFlash',
      'LIVE_FLASH_MS',
      'LIVE_ENTER_MS',
      'LIVE_REORDER_MS',
      'LIVE_FLASH_GAP_MS',
    ],
    props: [
      {
        part: 'live',
        rows: [
          {
            name: 'useValueFlash(value, { enabled?, gapMs? })',
            type: '{ flash: "up" | "down" | null, key: number }',
            desc: '变大 up、变小 down；key 每闪一次加一，放在元素的 key 上让动画重放。首次渲染、null / NaN、1 秒内的第二次变化都不闪；闪完 flash 自己回到 null。',
          },
          {
            name: 'useEnterMarks(ids)',
            type: 'ReadonlySet<string>',
            desc: '本次新出现的 id。首次渲染的全算旧的；1200ms 后自动清掉；走了又回来的算新的。',
          },
          {
            name: 'useFlipList(containerRef, ids)',
            type: 'void',
            desc: 'ids 的顺序变了，让容器里带 data-live-id 的子元素从旧位置平滑移到新位置（transform，240ms，--ease-snappy）。没渲染的行与新行跳过。',
          },
          {
            name: 'useStatusFlash(status)',
            type: '{ flash: boolean, key: number }',
            desc: '状态字符串变了，flash 为 true 约 600ms；key 每变一次加一。首次渲染与 null 不闪；不节流。',
          },
          {
            name: 'LIVE_FLASH_MS / LIVE_ENTER_MS / LIVE_REORDER_MS / LIVE_FLASH_GAP_MS',
            type: 'number',
            desc: '600 / 1200 / 240 / 1000：毫秒数，与 token 一致（单测盯着）；最后一个只有 JS 用。',
          },
        ],
      },
    ],
    states: [
      '数值闪：data-flash="up" | "down" 的 .k-live-flash，背景从涨 / 跌色的弱化档淡到透明',
      '新条目：.k-live-enter，左侧 2px 强调线加底色高亮，1200ms 淡出',
      '状态警示：.k-live-alert，炸板这类用琥珀（data-tone="negative" 用跌红）闪两下',
      '没有动画的环境（单测、服务端渲染）：钩子照常给出状态，只是没人播',
    ],
    donts: [
      '不要自己再写一套 @keyframes 闪烁：时长与颜色都从这一层取',
      '不要给每一格都加高亮：只有变了的才闪，同一格 1 秒内最多一次',
      '用户滚离顶部时不要把新条目插进视野：只计数，点「新增 n 条」再合入（插入会把正在读的内容顶走）',
      '不要为重排动画去改 DOM 顺序之外的东西：useFlipList 只写 transform，不碰 className 与 style',
    ],
    composition:
      'useValueFlash / useStatusFlash（返回 flash 与 key）\n  .k-live-flash / .k-live-alert\nuseEnterMarks（返回新 id 集合）\n  .k-live-enter\nuseFlipList（容器 ref + ids，子元素 data-live-id）',
    keys: [],
  },
  {
    id: 'side-nav',
    group: 'layout',
    cardHeight: 520,
    title: 'SideNav 侧栏导航',
    summary:
      '分组的侧栏导航：组名小号大写；没选中的字淡，悬停变亮，当前项最亮。每组左边一条 1px 虚线从组顶走到当前项、用 6px 弯钩拐进去，悬停另一项时以淡色画一条到悬停项，切换时 200ms 滑过去。顶上过滤框（⌘K / Ctrl+K 聚焦，Enter 打开第一项，Esc 清空），底部淡出。照 rareui.com 组件站左栏（2026-11-17 实测），实现原创。件不管路由：链接给 href，当前项由调用方传。轨迹颜色走 --k-sidenav-trail，默认品牌橙。',
    exports: ['SideNav'],
    props: [
      {
        part: 'SideNav',
        rows: [
          {
            name: 'groups',
            type: 'SideNavGroup[]',
            desc: '{ id, title, items: { id, label, href, keywords?, title? }[] }；keywords 只用来搜。',
          },
          { name: 'current', type: 'string', desc: '当前项的 id；轨迹画到它。' },
          { name: 'header', type: 'ReactNode', desc: '顶部（品牌、面包屑、收起按钮）。' },
          { name: 'footer', type: 'ReactNode', desc: '底部。' },
          {
            name: 'labels',
            type: '{ search?, empty? }',
            desc: '过滤框的占位与读屏名（不给就没有过滤框）、过滤没有结果时的文字；旧名 searchLabel / emptyLabel 留一个版本。',
          },
        ],
      },
    ],
    states: [
      '当前项：最亮，轨迹用 --k-sidenav-trail',
      '悬停：变亮，淡色轨迹画到悬停项',
      '过滤中：没命中的组整组隐藏，全没命中显示 emptyLabel',
    ],
    donts: ['不要一组放太多项：超过二十来项拆组', '不要把轨迹颜色设成跟正文一样亮：它是指引，不是内容'],
    composition: 'SideNav\n  头部（header）\n  过滤框\n  分组 × n（组名、轨迹、链接）\n  底部（footer）',
    keys: [
      ['⌘K / Ctrl+K', '聚焦过滤框'],
      ['Enter', '在过滤框里：打开第一项'],
      ['Esc', '在过滤框里：清空'],
    ],
  },
  {
    id: 'workspace-tabs',
    group: 'blocks',
    cardHeight: 260,
    title: 'WorkspaceTabs 工作区标签',
    summary:
      '顶层工作区标签条：当前标签凹陷、底部橙线用弹簧滑过去，右侧快捷键提示，最右「+」新建；放不下的标签收进末尾的「…」下拉（当前标签始终可见），拖动或 Alt+方向键排序，双击或 F2 改名。宿主给数据与回调。',
    exports: ['WorkspaceTabs'],
    props: [
      {
        part: 'WorkspaceTabs',
        rows: [
          { name: 'workspaces', type: '{ id, name, hotkey? }[]', desc: '标签；hotkey 只显示，不绑定。' },
          { name: 'activeId', type: 'string', desc: '当前标签。' },
          { name: 'onSelect', type: '(id) => void', desc: '切换。' },
          { name: 'onReorder', type: '(id, targetId) => void', desc: '把 id 挪到 targetId 的位置；不给就不能排序。' },
          { name: 'onRename', type: '(id) => void', desc: '进改名；输入框是宿主的事；不给就不能改名。' },
          {
            name: 'onCreate / labels',
            type: '() => void / { create?, more? }',
            desc: '「+」与它的名字、「更多」下拉的名字；不给 onCreate 就不画「+」（旧名 createLabel / moreLabel 留一个版本）。',
          },
          { name: 'label', type: 'string', desc: '标签条的名字（读屏念）。' },
        ],
      },
    ],
    states: [
      '当前标签：bg-000 凹陷、ink-100，橙线停在它下面。',
      '切换：橙线用 snappy 弹簧从旧标签滑到新标签。',
      '拖动中：落点标签左边亮一条线。',
      '标签多：放不下的收进末尾「…」下拉，选中即切换；当前标签始终在条上（被收起时与最后一个可见的换位）；名字过长截断，悬停看全名。',
    ],
    donts: [
      '不要在包里绑 ⌘1–9、Ctrl+Tab，宿主的快捷键表管。',
      '不要在标签里放按钮（tab 里再放可交互元素违反 ARIA）。',
      '不要做横向滚动：放不下就收进「…」下拉。',
      '标签名不超过 8 个汉字 / 12 个字母。',
    ],
    composition:
      'WorkspaceTabs\n  tablist\n    tab（名字 · 快捷键提示）\n    橙色指示线\n  DropdownMenu（「…」，收起的标签）\n  「+」按钮',
    keys: [
      ['← →', '在可见标签间移动焦点（整条只占一个 Tab 站）'],
      ['Tab', '到「…」按钮，Enter 打开，↑ ↓ 选，Enter 切换'],
      ['Home / End', '到第一个 / 最后一个标签'],
      ['Enter / Space', '切换到聚焦的标签'],
      ['Alt+← / Alt+→', '把聚焦的标签往前 / 往后挪一位'],
      ['F2', '进改名'],
    ],
  },
  {
    id: 'toolbar',
    group: 'blocks',
    cardHeight: 150,
    title: 'Toolbar 工具条',
    summary:
      '面板头的工具条零件：role=toolbar 的容器、左右两组、每个工具一个槽、图标或文字按钮。哪些放得下、收进「»」是宿主的事（要量宽度）。',
    exports: ['Toolbar', 'ToolbarGroup', 'ToolSlot', 'ToolButton', 'useRovingToolbar'],
    propParts: [
      { part: 'Toolbar', note: '其余属性透传给 div；ref 给宿主量宽度、找子元素。' },
      { part: 'ToolbarGroup' },
      { part: 'ToolSlot' },
      { part: 'ToolButton' },
      {
        part: 'useRovingToolbar(ref)',
        symbol: 'useRovingToolbar',
        note: 'Toolbar 内部用；自己拼工具条的也可以拿去。整条只占一个 Tab 站。',
      },
    ],
    states: ['按下：pressed 为真时底色常亮。', '禁用：不可点。', '折叠：folded 的按钮收进溢出菜单。'],
    donts: ['不要在工具条里放表单输入。', '图标按钮必须带 label。'],
    composition: 'Toolbar\n  ToolbarGroup\n    ToolSlot\n      ToolButton',
    keys: [
      ['Tab', '整条工具条只占一个 Tab 站'],
      ['← / →', '在项间移动（到头不环绕）'],
      ['Home / End', '到第一项 / 最后一项'],
    ],
  },
  {
    id: 'estimate-badge',
    group: 'blocks',
    cardHeight: 90,
    title: 'EstimateBadge 估算标记',
    summary:
      '琥珀色描边的小字标记（例如「按 K 线估算」），悬停写规则摘要；字与规则由调用方传。是 Tag 的 warn、描边、md 档。',
    exports: ['EstimateBadge'],
    propParts: [
      {
        part: 'EstimateBadge',
        note: '就是 <Tag tone="warn" outlined>：caption 500、左右 6px、1px 同色边、圆角 radius-sm。',
      },
    ],
    states: ['只有一种样子：琥珀字、同色描边的小标。', '悬停：title 写估算依据（浏览器原生提示）。'],
    donts: ['不要在精确值上挂估算标记。', '不要省略 title 里的依据。', '别的语气的行内标记直接用 Tag，不要拿它改色。'],
    composition: 'EstimateBadge\n  Tag（warn · outlined · md）',
    keys: [],
  },
  {
    id: 'filter-bar',
    group: 'forms',
    cardHeight: 520,
    title: 'FilterBar 过滤条',
    summary:
      '选股器的顶部过滤行：一行可换行的胶囊，每个胶囊是一个字段；点开浮层有标题与垃圾桶（把这个过滤从条上拿掉）、搜索框、预设条件列表（主文字加灰色副标题）、底部「手动设置」（运算符加值）。最后是「+」（按分组列出所有字段，进组再选）与「⋯」（重置全部条件）。照 TradingView 选股器（主会话 2026-11-15 登录态实测），实现原创。字段、运算符、预设与文字都由调用方定义；条件受控，件不过滤数据，调用方用 applyFilters 或自己的方式过滤。',
    exports: ['FilterBar', 'ViewSwitcher', 'applyFilters', 'conditionText', 'matchCondition'],
    props: [
      {
        part: 'FilterBar',
        rows: [
          {
            name: 'fields',
            type: 'FilterField[]',
            desc: '{ key, label, group?, input?（number / text）, operators: {value,label}[], presets?: {key,label,hint?,op,value}[], shown? }。',
          },
          {
            name: 'value',
            type: 'FilterCondition[]',
            desc: '{ id, field, op, value, label? }；同一字段只留最后设的一条。',
          },
          {
            name: 'onValueChange',
            type: '(next: FilterCondition[]) => void',
            desc: '条件变了（设、清除、移除字段、重置、撤销、重做）。旧名 onChange 留一个版本（@deprecated）。',
          },
          {
            name: 'labels',
            type: 'FilterBarLabels',
            desc: '全部文字，由调用方传。传了 undo 与 redo 两个读屏名，条的最左多一对撤销 / 重做按钮（件自己记它改过的条件快照，最多 50 步；从外面换掉条件不进栈）。',
          },
          {
            name: 'defaultShown',
            type: 'string[]',
            desc: '条上一开始有哪些字段；不给取 shown 为真的，再没有取前 6 个。',
          },
        ],
      },
      {
        part: 'ViewSwitcher',
        note: '标题位置的「已保存的视图」下拉（选股器标题的保存的筛选、新闻流标题的 Full feed）；件不存视图，列表与当前项由调用方传。',
        rows: [
          { name: 'views', type: 'ViewOption[]', desc: '{ key, label }；下拉里按这个顺序列。' },
          { name: 'value', type: 'string', desc: '当前视图的键。' },
          { name: 'onValueChange', type: '(key: string) => void', desc: '选了另一个视图。' },
          {
            name: 'onSave',
            type: '() => void',
            desc: '给了，列表底部多一项「另存为」（文字 labels.save）；命名对话框与存哪里归调用方。',
          },
          { name: 'labels', type: 'ViewSwitcherLabels', desc: '{ trigger, save? }：读屏名与「另存为」文字。' },
        ],
      },
      {
        part: 'applyFilters / matchCondition',
        note: '纯函数；约定的运算符名：gt、gte、lt、lte、eq、neq、between（值写成「下限..上限」）、contains、in（逗号分隔）。别的运算符名调用方自己匹配。',
        rows: [
          {
            name: 'applyFilters(rows, conditions, getCell)',
            type: 'Row[]',
            desc: '所有条件都满足（且）；getCell 按字段键取这一行的值。',
          },
        ],
      },
    ],
    states: ['设了条件的胶囊：底色加深，字提亮并带条件文字。', '字段被移除：从条上拿掉，它的条件一并清除。'],
    donts: ['不要把过滤逻辑写进件：件只出条件，数据由调用方过滤。', '字段很多时别全摆在条上：用「+」加。'],
    composition:
      'FilterBar\n  胶囊 × n（Popover：标题 + 垃圾桶、搜索、预设列表、手动设置）\n  「+」（Popover：搜索、分组列表带计数）\n  「⋯」（重置）',
    keys: [
      ['Tab', '在胶囊、「+」、「⋯」间移动'],
      ['Enter', '打开浮层或选中预设'],
    ],
  },
  {
    id: 'rendering-settings',
    group: 'forms',
    cardHeight: 560,
    title: 'RenderingSettings 渲染设置',
    summary:
      '应用「设置 → 渲染」那一页：字体（界面、汉字、数据字、代码四个角色，各从字体目录 FONT_CATALOG 里挑：系统、开源、本机已装三类）、文字平滑（灰度 / 系统）、像素对齐、字重补偿（-60..+60，相当于终端的 font-thicken）、字号缩放（取整到整像素）、斜线零、中英对齐（font-size-adjust）。每项一行：名称、一句说明、控件。值写在根节点上（theme/rendering.css 读），件是受控的，调用方存值，启动时用 applyRendering 写回。字样表与本机字体检测见总览里的 rendering 页。',
    exports: [
      'RenderingSettings',
      'applyRendering',
      'readRendering',
      'DEFAULT_RENDERING',
      'RENDERING_LABELS_ZH',
      'FONT_CATALOG',
      'DEFAULT_FONTS',
      'fontVariables',
      'fontsFor',
    ],
    props: [
      {
        part: 'RenderingSettings',
        rows: [
          {
            name: 'value',
            type: 'RenderingSettingsValue',
            desc: '{ smoothing, pixelSnap, weightAdjust, textScale, slashedZero, cjkAdjust, fonts }；fonts 是按角色（ui、cjk、num、mono）选的字体 id，见 FONT_CATALOG。默认值是 DEFAULT_RENDERING。',
          },
          {
            name: 'onValueChange',
            type: '(next: RenderingSettingsValue) => void',
            desc: '改了任一项或按了恢复默认，给整份新值；一般在这里 applyRendering(next) 并存盘。旧名 onChange 留一个版本（@deprecated）。',
          },
          { name: 'labels', type: 'RenderingSettingsLabels', desc: '全部文字，默认 RENDERING_LABELS_ZH。' },
        ],
      },
    ],
    states: ['默认值：灰度、像素对齐开、字重 0、字号 100%、斜线零关、中英对齐关', '改任一项立刻生效（写在根节点上）'],
    donts: ['不要在件里存值：存盘交给调用方', '不要只在某个面板上改这些属性：渲染设置是整个应用一份'],
    composition:
      'RenderingSettings\n  行 × 6（名称、说明、ToggleGroup 或 Slider）\n  字体小节\n    行 × 4（界面、汉字、数据字、代码：Select）\n  恢复默认（Button）',
    keys: [
      ['Tab', '按行的次序走过每个控件，最后是恢复默认'],
      ['← →', '开关与平滑方式（分段切换）里换一段'],
      ['← → / ↑ ↓', '字重、字号滑块走一格（字重 10，字号 5%）；Home / End 到两头'],
      ['Enter / Space', '打开字体下拉；下拉里 ↑ ↓ 选、Enter 确定、Esc 收起'],
    ],
  },
  {
    id: 'column-set-tabs',
    group: 'blocks',
    cardHeight: 520,
    title: 'ColumnSetTabs 列集标签行',
    summary:
      '表上方的一行页签（概览、估值、分红…），点一个就把 DataGrid 的列换成这一套。照 TradingView 选股器的列组标签（主会话 2026-11-15 实测）；与 ColumnPicker 里的列集芯片是同一份数据与同一个纯函数。不存状态：哪个亮着由看得见的列恰好等于它的列推出来，手动改过列之后没有页签亮着。',
    exports: ['ColumnSetTabs'],
    props: [
      {
        part: 'ColumnSetTabs',
        rows: [
          { name: 'layout / onLayoutChange', type: 'GridColumnLayout[]', desc: 'DataGrid 的列摆法，受控。' },
          { name: 'sets', type: 'ColumnSet[]', desc: '{ id, label, columns: 列 id[] }。' },
          { name: 'label', type: 'string', desc: '整行的读屏名。' },
          { name: 'children', type: 'ReactNode', desc: '右侧按钮位（刷新、全屏）。' },
        ],
      },
    ],
    states: ['选中：白底黑字小胶囊。', '手动改过列：没有页签选中。'],
    donts: [
      '不要自己存「当前列集」：它由列推出来。',
      '不要拿它代替 ColumnPicker：页签只套整套列，单列的显隐与次序在 ColumnPicker 里改。',
      '页签不要超过一行能放下的数量（约 8 个）；更多的套用放进 ColumnPicker 的列集芯片。',
    ],
    composition: 'ColumnSetTabs\n  tablist\n    tab × n\n  右侧按钮位',
    keys: [
      ['Tab', '在页签间移动'],
      ['Enter', '套用这一套列'],
    ],
  },
  {
    id: 'news-reader',
    group: 'blocks',
    cardHeight: 520,
    title: 'NewsReader 新闻阅读窗',
    summary:
      'NewsFeed 点开一条后的阅读窗：来源与操作（复制链接、举报、关闭）、标题、元信息、品种胶囊带涨跌、「要点」列表（闪电图标）、正文。照 TradingView 新闻流的阅读窗（主会话 2026-11-15 实测）。件不取数：标题、元信息、要点、正文都由调用方传；正文里的品种胶囊用 NewsSymbolChip 内联。',
    exports: ['NewsReader', 'NewsSymbolChip'],
    props: [
      {
        part: 'NewsReader',
        rows: [
          {
            name: 'title / source / sourceLogo / meta',
            type: 'string',
            desc: '标题、来源、来源徽标、写好的元信息一行。',
          },
          {
            name: 'symbols',
            type: 'NewsReaderSymbol[]',
            desc: '{ code, name?, logo?, change?（涨跌幅百分数） }；涨跌色走 pnl token。',
          },
          { name: 'keyPoints', type: 'string[]', desc: '要点；空数组不画这一块。' },
          { name: 'children', type: 'ReactNode', desc: '正文。' },
          {
            name: 'version',
            type: 'string | number',
            desc: '内容版本（修订号或更新时间）：正文改了但标题、要点没变时，靠它让件知道这一条被更新了。',
          },
          {
            name: 'labels',
            type: 'NewsReaderLabels',
            desc: '读屏名与「要点」「关闭」「举报」「复制链接」；updated（「已更新」）传了，这一条被更新时标题闪一次并留标记，不传就不闪。',
          },
          {
            name: 'onClose / onReport / onCopyLink / onSymbolSelect',
            type: 'function',
            desc: '给了才画对应的按钮；点品种胶囊回调。',
          },
        ],
      },
    ],
    states: ['品种涨跌：正涨色、负跌色，0 不上色。', '被更新：标题闪警示色，旁边留「已更新」。'],
    donts: [
      '不要在件里取数或翻译：文字由调用方传。',
      '品种胶囊的涨跌不要用橙色或蓝色：只用涨跌色（pnl token，跟 data-updown 互换）。',
      '「已更新」不要当警告：只在同一条被改了时闪一次（新信息的蓝），不要拿它提示别的条。',
    ],
    composition: 'NewsReader（article）\n  header：来源 + 操作\n  标题、元信息\n  品种胶囊\n  要点\n  正文',
    keys: [['Tab', '在操作与品种胶囊间移动']],
  },
  {
    id: 'news-feed',
    group: 'blocks',
    cardHeight: 560,
    title: 'NewsFeed 新闻流',
    summary:
      '快讯与要闻的流：列表（时间、来源、标题、相关品种胶囊、重要标记）与卡片网格（来源 + 时间、标题、两行摘要、胶囊）两种排法；顶上频道分段、来源多选、关键词搜索、暂停。新到的不打断阅读：在顶部且没暂停时淡入插入，否则出「n 条新消息」，点了才插入。功能参照 TradingView News Flow 帮助页（只读到：新闻集中在一处、可设多种过滤）与 uiarc.dev 的卡片结构（待核对），实现原创。演示数据是虚构的。',
    exports: ['NewsFeed'],
    props: [
      {
        part: 'NewsFeed',
        note: '筛选与排法的状态在件内；数据、频道、来源、文字、当前时间都由调用方传，件不认识任何应用。高度由外层给（件撑满外层，列表自己滚）。',
        rows: [
          {
            name: 'items',
            type: 'NewsItem[]',
            desc: '{ id, time（毫秒）, channel, source, title, summary?, symbols?: {code, name?}[], important?, href? }。传入顺序不用排，件按时间新的在前；新出现的 id 算「新消息」。',
          },
          {
            name: 'channels',
            type: '{ value: string; label: string }[]',
            desc: '频道分段；「全部」由件加在最前，字是 labels.all。',
          },
          {
            name: 'sources',
            type: '{ value: string; label: string }[]',
            desc: '来源多选芯片；一个都不选 = 全部来源。',
          },
          { name: 'now', type: 'number', desc: '当前毫秒时间：相对时间按它算，调用方定时更新（件不在渲染里取时间）。' },
          {
            name: 'labels',
            type: 'NewsFeedLabels',
            desc: '全部文字：all、feed、channels、sources、clearSources、search、layout、layoutList、layoutCard、pause、resume、important、empty，以及 newItems(n)、ago(秒)、absolute(时间)。包里没有语言。',
          },
          { name: 'defaultLayout', type: "'list' | 'card'", desc: '起始排法，默认 list。' },
          {
            name: 'facets',
            type: 'NewsFacet[]',
            desc: '组合过滤（照 TradingView News Flow，主会话 2026-11-15 实测）：{ key, label, options, single?, shown? }；条目用 NewsItem.facets 带取值。每个分面一个胶囊，浮层里复选、可重置、可移除，「+ 添加过滤」再加；取值之间「或」，分面之间「且」。需要 labels.facets 的文字。',
          },
          {
            name: 'categories / onCategoriesChange / NewsItem.category / labels.categories',
            type: '{ value, label }[] / (values) => void / string / string',
            desc: '类别筛选：条目带 category，来源行下面多一行类别芯片（多选，复用 ChipGroup，不选是全部，选了之后没带类别的条目被筛掉）；不传 categories 或没写 labels.categories（读屏名，labels.clearCategories 是清除钮）就没有这一行。',
          },
          { name: 'selected', type: 'string | null', desc: '阅读窗开着的那条：行底色加深。' },
          {
            name: 'onSymbolSelect',
            type: '(symbol, item) => void',
            desc: '点品种胶囊（旧名 onSymbolPick 留一个版本）。',
          },
          {
            name: 'reader',
            type: '(item, { close }) => ReactNode',
            desc: '给了就是左列表右阅读窗的并排排法（照 TradingView News Flow，主会话 2026-11-15 实测）：点标题打开这一条，返回的节点（一般是 NewsReader）画在右边，选中行底色加深；件的宽度不到 900px 时阅读窗改成盖在列表上的浮层。',
          },
          {
            name: 'views / view / onViewChange / onSaveView',
            type: 'ViewOption[] / string / (key) => void / () => void',
            desc: '标题行的已保存过滤视图下拉（Full feed 那样）；需要 labels.views。切换与另存由调用方处理，一般换 key 让件里的过滤状态重置。',
          },
          {
            name: 'symbolStyle',
            type: "'stack' | 'chips'",
            default: "'stack'",
            desc: '相关品种：stack = 重叠的一排徽标（悬停出代码与名称），chips = 带代码的胶囊。',
          },
          {
            name: 'NewsItem.readMinutes / labels.read / labels.collapse',
            type: 'number / (n) => string / string',
            desc: '条目写「n 分钟阅读」（labels.read 与 readMinutes 都有才写）；labels.collapse 给了，标题行右边有收起 / 展开过滤区的按钮。',
          },
          {
            name: 'itemActions',
            type: '(item) => RowAction[]',
            desc: '每条的快捷操作：悬停出前几颗图标按钮，右键出同一份菜单；读屏名在 labels.itemActions（旧名 itemActionsLabel）。',
          },
          {
            name: 'onSelect',
            type: '(item) => void',
            desc: '选中一条：给了，标题是按钮；没给而条目有 href，标题是新窗口链接（旧名 onOpen 留一个版本）。',
          },
          {
            name: 'onChannelChange / onSourcesChange / onPausedChange',
            type: 'callback',
            desc: '筛选或暂停变了通知调用方（可选）。',
          },
        ],
      },
    ],
    states: [
      '在顶部、没暂停：新条目直接淡入插入。',
      '滚离顶部或已暂停：顶上出「n 条新消息」（只数符合当前筛选的），点了才插入并回到顶部。',
      '时间是相对的（3 分钟前），悬停出绝对时间；重要条目有琥珀小方块，读屏名「重要」。',
      '筛选没有命中：写 labels.empty。',
    ],
    donts: [
      '不要在件里取当前时间：传 now。',
      '不要用橙色标重要：橙色留给数据，重要标记是琥珀。',
      '不要一次传几万条：不做虚拟滚动，分段加载由调用方管。',
    ],
    composition:
      'NewsFeed\n  顶行：频道 ToggleGroup、搜索 Input、排法 ToggleGroup、暂停按钮\n  来源 ChipGroup\n  「n 条新消息」按钮\n  ol\n    li × 条目：来源、time、重要标记、标题、摘要（卡片）、品种胶囊（SymbolMark）',
    keys: [
      ['Tab', '在频道、搜索、排法、暂停、来源芯片、新消息按钮、标题、胶囊间移动'],
      ['Enter / Space', '触发当前按钮'],
    ],
  },
  {
    id: 'transmission-chain',
    group: 'blocks',
    cardHeight: 760,
    title: 'TransmissionChain 传导链图',
    summary:
      '研究「谁创造资金 → 谁先取得购买力 → 经过什么通道 → 用于什么 → 谁获得收入与利润 → 哪类资产拥有收益权」这类传导框架的有向图：节点是传导环节，边是传导关系，每条边有验证状态（未检验 / 有证据支持 / 证据反对 / 部分成立）与证据计数，边上的标签写状态图标与「支 n 反 n」。点边，右侧出这条判断的失败条件与证据列表（每条证据有立场，并标来源类别：学者观点 / 政策与资金变化 / 数据 / 财报）；点节点，列出它的上下游边，不挨着的边淡出。支持沿链回到上游的反馈边（如资产价格经抵押品与再融资回到信用）。布局用 dagre（MIT，一层一层排，环由它先反转再还原），滚轮缩放、拖动平移、一键适应。状态色：支持 = 涨色、反对 = 跌色、部分 = 琥珀点划线、未检验 = 灰虚线，状态另有图标与状态字，不只靠颜色；橙色不画数据，不用蓝。画法参照 TradingView 的缩放与平移手感；证据行与数据类型同 HypothesisLedger（HypothesisEvidence，样式用它的 k-hl-ev）。演示数据（状态与证据条数）是编的，页上与证据行都写明。',
    exports: ['TransmissionChain'],
    props: [
      {
        part: 'TransmissionChain',
        note: '件只画、只回调：节点、边、证据与全部文字由调用方传，件不认识任何应用或研究框架；高度由外层给。',
        rows: [
          {
            name: 'nodes',
            type: 'ChainNode[]',
            desc: '{ id, label, note? }：传导环节。没有节点写 labels.notConnected，不补样本。',
          },
          {
            name: 'edges',
            type: 'ChainEdge[]',
            desc: '{ id, from, to, status: untested | supported | contradicted | partial, label?, feedback?, failureCondition?, evidence?: HypothesisEvidence[]（kind、source、href、publishedAt、summary、stance: support | oppose） }。证据计数由 evidence 数出来，不另传；指向不存在节点的边、自环与重复 id 被丢掉。',
          },
          {
            name: 'labels',
            type: 'TransmissionChainLabels',
            desc: '全部文字（状态名、立场名、来源类别、各区标题、提示与 counts / edgeName 函数）。包里没有语言。',
          },
          {
            name: 'direction',
            type: "'LR' | 'TB'",
            desc: '布局方向，默认从上到下（链长时横排会宽到缩得看不清）；LR 从左到右。',
          },
          {
            name: 'defaultSelected / onSelect',
            type: 'ChainSelection',
            desc: '起始选中（{ kind: edge | node, id }）与选中变化的回调；选中的 id 不存在时当作没选。',
          },
        ],
      },
    ],
    states: [
      '没有节点：写 labels.notConnected。',
      '边没有证据：右侧写 labels.noEvidence，标签上不写计数。',
      '边没有失败条件：右侧写 labels.noFailureCondition（琥珀提示），不替调用方编。',
      '选中节点：不挨着它的节点与边淡出到 30%。',
      '反馈边：data-feedback，布局时权重很低，不参与定层，画出来绕回上游。',
    ],
    donts: [
      '不要用橙色或蓝色画状态：状态用涨色、跌色、琥珀、灰加图标与文字。',
      '不要把演示数据当研究结论。',
      '不要在件里写文字或判断状态：状态由调用方按证据定，件只显示。',
    ],
    composition:
      'TransmissionChain\n  画布：svg（dagre 布局）× 边（路径、箭头、标签）+ 节点；缩放 / 适应按钮；状态图例\n  详情：边（状态、失败条件、证据行）或节点（上下游边）',
    keys: [
      ['Tab', '在缩放按钮、边、节点间移动'],
      ['Enter / Space', '选中当前的边或节点'],
      ['滚轮 / 拖动', '缩放（以指针为中心）/ 平移'],
    ],
  },
  {
    id: 'strategy-report',
    group: 'blocks',
    cardHeight: 720,
    title: 'StrategyReport 策略报告',
    summary:
      '回测结果的一整页，页签照 TradingView 策略测试器：概览（一排关键读数：净利润、总收益率、最大回撤、胜率、盈亏比、交易次数、夏普；下面是权益曲线与回撤，可叠同期买入持有）、绩效（全部 / 多 / 空三列的指标表）、交易分析（盈亏分布与持仓时长的直方图、连续盈亏条、读数清单）、风险比率（夏普、索提诺、卡玛、恢复因子、回撤与上冲）、交易列表（DataGrid，每笔进出场、数量、盈亏、累计、最大浮盈浮亏，行可展开看信号与持仓时长）、属性（参数与回测设置的分组键值）。顶上「全部 / 多 / 空」管概览、交易分析与交易列表；绩效与风险比率三列并排，当前那列加亮。指标全由逐笔平仓算，口径写在 strategy-report-model.ts 的注释里（夏普与索提诺按日收益年化，年化日数由 periodsPerYear 给）。结构参照 TradingView 策略测试器帮助页（2026-11-15 读到概览页；其余页签没读到页面，按需求稿的结构做，待核对）。演示数据是固定种子合成的，页上与小标都写明。',
    exports: ['StrategyReport', 'computeReport', 'filterTrades', 'histogram'],
    props: [
      {
        part: 'StrategyReport',
        note: '页签与多空的状态在件内；数据、数字格式与全部文字由调用方传，件不认识任何应用或交易所，包里没有语言。高度由外层给（件撑满外层，每页自己滚；交易列表的表撑满页签区）。',
        rows: [
          {
            name: 'trades',
            type: 'ReportTrade[]',
            desc: '{ id, side: long | short, entryTime, exitTime（毫秒）, entryPrice, exitPrice, quantity, pnl（已扣费）, maxRunup（≥ 0）, maxDrawdown（≤ 0）, entrySignal?, exitSignal? }。不用排序，件按平仓时间算。',
          },
          { name: 'initialCapital', type: 'number', desc: '初始资金：总收益率、回撤比例、年化收益按它算。' },
          {
            name: 'periodsPerYear / riskFree',
            type: 'number',
            default: '252 / 0',
            desc: '夏普与索提诺的年化日数（A 股、美股 252，加密 365）与年化无风险利率（小数）。',
          },
          {
            name: 'benchmark',
            type: '{ name: string; at: (time: number) => number }',
            desc: '同期买入持有：给一个时刻，返回那时的买入持有权益（起点是初始资金）。不给就不画虚线与概览里的买入持有读数。',
          },
          {
            name: 'properties',
            type: '{ id, title, rows: { label, value }[] }[]',
            desc: '属性页：参数与回测设置，分组的键值，值已是写好的字。',
          },
          {
            name: 'format',
            type: 'StrategyReportFormat',
            desc: 'money、percent（0.12 → 12%）、price、quantity、time、duration（毫秒）必填；ratio（默认两位小数）与 axisTime（图横轴的短时刻）可选。件不格式化数值。',
          },
          {
            name: 'labels',
            type: 'StrategyReportLabels',
            desc: '全部文字：tabs、side、metrics（每个指标名）、equity（权益曲线的标题、线名、读屏名与图自带的文字）、analysis（直方图每根柱与连续条每一笔的整句）、list（列名、多空、展开行的字）、empty。',
          },
          { name: 'badge', type: 'string', desc: '页签行右端的小标，如「演示数据」。' },
          { name: 'defaultTab / defaultSide', type: 'string', desc: '起始页签与多空，默认概览与全部。' },
          { name: 'onTabChange / onSideChange', type: 'callback', desc: '页签或多空变了通知调用方（可选）。' },
          { name: 'onExport', type: '(csv, fileName) => void', desc: '给了，交易列表的表头菜单里出「导出 CSV」。' },
        ],
      },
      {
        part: 'computeReport(trades, options)',
        note: '逐笔平仓 → 全部读数与权益曲线的纯函数（净盈亏、盈亏因子、胜率、盈亏比、期望、连胜连亏、最大回撤与上冲、回撤段、夏普、索提诺、卡玛、年化、恢复因子）；没有亏损时盈亏因子、盈亏比是 null。件内部用它，调用方想在别处出同样的数也可以直接调。',
        rows: [],
      },
    ],
    states: [
      '没有交易（或筛选后没有）：概览、交易分析、交易列表写 labels.empty；绩效与风险比率照常出表，数值为 0 或「—」。',
      '读数算不出来（没有亏损的盈亏因子、日收益全相同的夏普）写「—」，不写 0。',
      '涨跌色只给字；直方图与连续条的面用中档涨跌色（灰是持平），没有橙色与蓝色。',
      '多空切换时，绩效与风险比率三列不变，当前那列加亮；别的页按所选的多空重算。',
    ],
    donts: [
      '不要传已经汇总好的指标：件只收逐笔平仓，这样多空、绩效、分布的数永远对得上。',
      '不要把演示数据当回测结果：真实回测的接入在应用里另做。',
      '不要在件里写文字：指标名、列名、整句都由 labels 传。',
    ],
    composition:
      'StrategyReport\n  Tabs\n    顶行：TabsList（line）· 小标 · ToggleGroup（全部 / 多 / 空）\n    概览：关键读数条 · EquityCurve（权益与回撤，可带买入持有）\n    绩效 / 风险比率：table（三列：全部、多、空）\n    交易分析：直方图 svg × 2 · 连续盈亏条 · dl\n    交易列表：DataGrid（renderSubRow 展开）\n    属性：分组 dl',
    keys: [
      ['← / →', '在页签间移动（Radix Tabs）'],
      ['Tab', '页签行、多空切换、各页里的图与表之间移动'],
      ['→ / ←', '交易列表里：焦点所在行展开 / 收起'],
    ],
  },
  {
    id: 'hypothesis-ledger',
    group: 'blocks',
    cardHeight: 640,
    title: 'HypothesisLedger 假说账',
    summary:
      '研究「地缘与国内利益结构 → 货币与信用流向 → 购买力与利润再分配 → 资产定价」这类框架用的面板。每条假说一行、可展开：命题、所属传导层（国家战略 / 信用供给 / 财政分配 / 跨境流动 / 产业承接 / 利润归属 / 资产配置 / 避险）、状态（待验证 / 有支持 / 被否定 / 过期）、提前写好的失败条件与检验期限（到期倒计时，过了期限的待验证项自动标过期）、证据列表（学者观点 / 政策原文 / 数据 / 财报，各带发布时间、来源链接、支持或反对）、关联品种或资产。顶上按层与状态筛选；同一面板可切「观察表」：传导层 × 核心证据 × 最容易混淆的地方。学者观点、已发生的政策与资金变化、我们的假说分开放，不混排。件不改状态，由调用方写回。字段按用户 2026-11-15 给的框架，对设计稿 HypothesisLedger 卡的功能（假设账、证据与反例）重写；样子照 TradingView 告警列表的读法，实现原创。演示数据是虚构的。',
    exports: ['HypothesisLedger'],
    props: [
      {
        part: 'HypothesisLedger',
        note: '筛选、视图与展开状态在件内；数据、文字、当前时间都由调用方传，件不认识任何应用或交易所。高度由外层给（列表自己滚）。',
        rows: [
          {
            name: 'items',
            type: 'Hypothesis[]',
            desc: '{ id, claim, layer, status, failure, deadline, evidence[], assets? }。evidence 每条 { id, kind: scholar / policy / data / filing, source, href, publishedAt, summary, stance: support / oppose }。status 是 pending / supported / refuted / expired。',
          },
          {
            name: 'watch',
            type: 'WatchRow[]',
            desc: '观察表的行 { layer, evidence, confusion }；不给就没有「观察表」视图。',
          },
          {
            name: 'now',
            type: 'number',
            desc: '当前毫秒时间：倒计时与过期都按它算，调用方更新它（件不在渲染里取时间）。',
          },
          {
            name: 'labels',
            type: 'HypothesisLedgerLabels',
            desc: '全部文字，包括八层、四个状态、四类证据、支持 / 反对、倒计时 deadlineIn(天)、过期 overdueBy(天)、日期 date(毫秒) 与观察表三列。包里没有语言。',
          },
          { name: 'renderAsset', type: '(asset) => ReactNode', desc: '关联资产旁的内容，如品种徽标。' },
          { name: 'defaultView', type: "'ledger' | 'watch'", default: 'ledger', desc: '起始视图。' },
        ],
      },
    ],
    states: [
      '待验证：灯亮、有倒计时；14 天内到期的倒计时变琥珀；快到期的排在前。',
      '过了检验期限还没结论：自动按「过期」画（调用方不必先改状态），倒计时换成已过期天数。',
      '有支持 / 被否定：人下了结论，行上显示期限日期；一行上的「n 支持 · m 反对」是证据对比。',
      '筛选：状态与传导层叠加，两边的计数各自不被对方的筛选影响；没有结果出空态。',
      '灯的语气（hypothesisSeverity → ledOf，G6）：待验证 accent（点亮的强调色）、支持 ok、证伪 danger、过期 warn；不再在件里手写灯表。',
    ],
    donts: [
      '不要把学者观点当成已发生的事实：证据按类型打标，假说自己永远是命题。',
      '不要在件里取当前时间：传 now。',
      '不要让件自己改状态：判定是人的动作，由调用方写回。',
    ],
    composition:
      'HypothesisLedger\n  视图 ToggleGroup（假说 / 观察表）、状态 ToggleGroup（带计数）\n  传导层 ChipGroup\n  ol\n    li × 假说：一行按钮（灯、状态、传导层、命题、证据对比、倒计时），展开后失败条件、证据列表（类型、支持或反对、时间、来源链接、摘要）、关联资产\n  观察表：table（传导层、核心证据、最容易混淆的地方）',
    keys: [
      ['Tab', '在视图、状态、传导层芯片、每行、证据来源链接间移动'],
      ['Enter / Space', '展开或收起一行；切换视图与筛选'],
      ['← / →', '在状态分段与传导层芯片间移动'],
    ],
  },
  {
    id: 'decision-queue',
    group: 'blocks',
    cardHeight: 600,
    title: 'DecisionQueue 建议队列',
    summary:
      '产品底线「Agent 输出只是带来源的建议，人接受后才生效」的界面：每张卡写建议动作、对象、理由摘要、置信与依据、来源链接、生成时间、过期倒计时，按钮 接受 / 拒绝 / 稍后，回调由调用方给。接受用按住确认（HoldToConfirm），单击不触发。队列按 待处理 / 已接受 / 已拒绝 / 已过期 筛选；已处理的收成一行（结果、谁、何时），点开看全文。件不改状态：回调后由调用方把条目状态改了再传回来。卡片照 uiarc（待核对）、一行记录照 TradingView 告警列表的读法，实现原创。演示数据是虚构的。',
    exports: ['DecisionQueue'],
    props: [
      {
        part: 'DecisionQueue',
        note: '筛选页与展开状态在件内；数据、文字、当前时间都由调用方传，件不认识任何应用或交易所。高度由外层给（列表自己滚）。',
        rows: [
          {
            name: 'items',
            type: 'DecisionItem[]',
            desc: '{ id, action, target, targetTag?, rationale, confidence?（0 到 1）, basis?, sources: {label, href}[], createdAt, expiresAt?, status, resolvedBy?, resolvedAt? }。status 是 pending / snoozed / accepted / rejected / expired。',
          },
          {
            name: 'now',
            type: 'number',
            desc: '当前毫秒时间：倒计时与过期都按它算，调用方每秒更新（件不在渲染里取时间）。',
          },
          {
            name: 'labels',
            type: 'DecisionQueueLabels',
            desc: '全部文字，包括各筛选页、各状态、按钮、接受的按住提示（acceptHint）、倒计时 expiresIn(秒)、各页空态。包里没有语言。',
          },
          {
            name: 'onAccept / onReject / onSnooze',
            type: '(item) => void',
            desc: '三个按钮的回调；接受要按住 holdMs 才回调。',
          },
          { name: 'holdMs', type: 'number', desc: '按住多久算接受，传给 HoldToConfirm（默认见该件）。' },
          {
            name: 'renderDetail',
            type: '(item) => ReactNode',
            desc: '卡上「详情」展开的内容，如 ConsensusBlock 的执行前检查；返回空就没有详情按钮。',
          },
          { name: 'renderTarget', type: '(item) => ReactNode', desc: '对象名旁的内容，如品种徽标。' },
          {
            name: 'defaultFilter / onFilterChange',
            type: 'DecisionFilter / callback',
            desc: '起始页（默认待处理）与切页通知。',
          },
        ],
      },
    ],
    states: [
      '待处理：灯亮、有倒计时，最后一分钟倒计时变琥珀；快过期的排在前。',
      '稍后：仍在待处理页，带「已推后」标记，不再给「稍后」按钮。',
      '过了有效期没人处理：按已过期画，不能再接受或拒绝（调用方不必先改状态）。',
      '已接受 / 已拒绝 / 已过期：收成一行（灯、结果、动作、对象、谁与何时），点开看理由与来源。',
      '灯的语气（decisionSeverity → ledOf，G6）：待处理 accent、稍后 warn、接受 ok、拒绝 danger、过期 off。',
    ],
    donts: [
      '不要把接受做成单击：它是不可撤的，必须按住。',
      '不要在件里取当前时间：传 now。',
      '不要让件自己改状态：回调后由调用方写回，来源才对得上账。',
    ],
    composition:
      'DecisionQueue\n  筛选 ToggleGroup（带计数）\n  ol\n    li 待处理：灯、生成时间、倒计时、动作与对象、理由、置信条与依据、来源链接、详情（ConsensusBlock）、HoldToConfirm 接受、拒绝、稍后\n    li 已处理：一行按钮（灯、结果、动作、对象、谁与何时），展开后理由与来源',
    keys: [
      ['Tab', '在筛选、卡上的来源、详情、按钮、已处理行间移动'],
      ['Space / Enter（按住）', '在「接受」上按住到填满才确认；松手退回'],
      ['Enter / Space', '触发拒绝、稍后、详情与已处理行的展开'],
    ],
  },
  {
    id: 'system-monitor',
    group: 'blocks',
    cardHeight: 760,
    title: 'SystemMonitor 交易系统监控',
    summary:
      '一眼看出交易系统是否正常：顶上连接状态条（每个连接 / 交易所 API / 行情源 / 引擎一盏灯 + 名称 + 状态字 + 延迟 + 最后心跳，异常的排前面）；延迟与错误率小图（SparkTile）；策略实例表（名称、账户、品种、状态、持仓、今日盈亏、额度占用条、最后一笔，行尾启停按钮由调用方回调）；事件流（按严重程度着色，可按类别与严重程度筛）。急停放面板头，按住确认。没有数据的块写「未连接」。功能参照 NinjaTrader 8 Control Center 的 Strategies 页签（2026-11-15 读到列与启停操作）与 Hummingbot 状态文档（2026-11-15 读到连接状态与错误信息；策略状态字段该页没写，待核对），实现原创。演示数据是虚构的。',
    exports: ['SystemMonitor'],
    props: [
      {
        part: 'SystemMonitor',
        note: '件只画、只回调：连接、策略、事件的数据与全部文字由调用方传，件不认识任何应用或交易所；高度由外层给，内容自己滚。',
        rows: [
          {
            name: 'links',
            type: 'MonitorLink[]',
            desc: '{ id, name, group?, state: ok | degraded | error | offline, latencyMs?, lastBeat?（毫秒时间戳）, detail? }。件把异常的排前面。',
          },
          {
            name: 'strategies',
            type: 'MonitorStrategy[]',
            desc: '{ id, name, account, symbol, status: running | paused | stopped | error, position?, pnl?, pnlText?, quota?（0 到 1）, quotaText?, lastTradeAt?, error? }。出错的排前面，其余保持传入顺序。',
          },
          {
            name: 'metrics',
            type: 'SystemMonitorMetric[]',
            desc: 'SparkTile 的 label、value、unit、series、sparkLabel、threshold、state、note 加 key；延迟与错误率各一块。',
          },
          {
            name: 'events / eventKinds',
            type: 'MonitorEvent[] / { value, label }[]',
            desc: '事件 { id, at, severity: info | warn | error, kind, text }；类别（下单、成交、拒单、断线、重连、风控触发……）由调用方定。',
          },
          {
            name: 'now',
            type: 'number',
            desc: '当前毫秒时间：「3 秒前」按它算，调用方定时更新（件不在渲染里取时间）。',
          },
          {
            name: 'labels',
            type: 'SystemMonitorLabels',
            desc: '全部文字（含状态名、列名、启停按钮名、急停提示、筛选名与 ago / latency / quotaUsed 函数）。包里没有语言。',
          },
          {
            name: 'onStrategyAction',
            type: '(strategy, action: start | pause | stop) => void',
            desc: '行尾启停按钮的回调：运行中给暂停与停止，暂停给继续与停止，停止与出错给启动；不给就没有按钮。件不改状态。',
          },
          {
            name: 'onEmergencyStop',
            type: '() => void',
            desc: '面板头的急停：按住 HoldToConfirm 填满才回调；不给就没有急停按钮。',
          },
          {
            name: 'quotaWarnAt',
            type: 'number',
            desc: '额度条转琥珀的占用比；不给不预警，≥ 1 总是红。预警线属于账户风控，由调用方给。',
          },
          {
            name: 'onSelect',
            type: '(link) => void',
            desc: '选中一个连接：给了，连接条上每个连接是按钮（旧名 onLinkPick 留一个版本）。',
          },
        ],
      },
    ],
    states: [
      '每块没有数据：写 labels.notConnected，不补样本。',
      '连接出错：红灯 + 状态字 + 左侧红边；断开 / 变慢：琥珀。状态不只靠颜色。',
      '策略出错：整行左侧红边，名字下写出错说明；排在最前。',
      '额度 ≥ 1：条贴边变红；达到 quotaWarnAt：琥珀。',
      '事件筛选没有命中：写 labels.noEvents。',
      '灯的语气（linkSeverity / strategySeverity / eventSeverity → ledOf，G6）：连接 ok / degraded warn / error danger / offline off；策略 running ok / paused warn / error danger / stopped off；事件 info neutral（不亮）/ warn / error danger。',
    ],
    donts: [
      '不要用橙色画状态或数据：橙色不画数据，状态用绿、琥珀、红加文字。',
      '不要在件里取当前时间：传 now。',
      '不要让件自己改策略状态：回调后由调用方改数据回传。',
      '不要在件里写预警线：额度预警属于账户风控。',
    ],
    composition:
      'SystemMonitor\n  头：标题、急停 HoldToConfirm\n  连接条：li × 连接（Led、名称、状态字、延迟、心跳）\n  小图：SparkTile × n\n  策略表：table（Led 状态、PnlText、额度条、启停 Button）\n  事件流：严重程度 ToggleGroup、类别 ChipGroup、ol（Led、time、类别、说明）',
    keys: [
      ['Tab', '在急停、连接、启停按钮、筛选间移动'],
      ['按住 Space / Enter', '在急停上按住填满后触发'],
    ],
  },
  {
    id: 'event-timeline',
    group: 'blocks',
    cardHeight: 597,
    title: 'EventTimeline 事件时间线',
    summary:
      '发现区的统一事件流（公告、告警、成交、数据源事件）：按显示时区的自然日分组，新的在前，每条一个钟点、一个按类型上色的圆点、标题加来源标签与说明。对设计稿的 EventTimeline 卡。功能参照 Arc，实现原创。',
    exports: ['EventTimeline'],
    props: [
      {
        part: 'EventTimeline',
        note: '件只管分组与排版：事件从哪来、怎么翻页由应用定。region 角色；每天一段 section，日标题是 h3，事件是有序列表里的 li，钟点是 time。',
        rows: [
          {
            name: 'events',
            type: '{ id: string; at: number; title: string; detail?: string; source?: string; tone?: TimelineTone }[]',
            desc: '事件。at 是毫秒时间戳；tone 是圆点颜色：neutral（默认）、up、down、warn、info。传进来的顺序不用排，件自己排；同一刻保持传入的先后。',
          },
          {
            name: 'timeZone',
            type: 'string',
            desc: '显示时区（IANA 名）：决定事件落在哪一天、钟点写几点。必填：件不读系统时区。',
          },
          { name: 'label', type: 'string', desc: '整条时间线的读屏名。' },
          {
            name: 'dayLabel',
            type: '(day: string, count: number) => ReactNode',
            desc: '一天的标题：day 是 YYYY-MM-DD，count 是这天的事件数；今天 / 昨天怎么写由调用方定。',
          },
          { name: 'emptyText', type: 'ReactNode', desc: '没有事件时写的字。' },
          {
            name: 'onSelect',
            type: '(event: TimelineEvent) => void',
            desc: '给了，每条事件变成按钮；不给就是纯展示。',
          },
        ],
      },
    ],
    states: [
      '有事件：每天一段，日标题粘在滚动容器顶上；竖线穿过当天的圆点。',
      '圆点颜色：up / down 跟红涨绿跌设置走，warn 琥珀，info 蓝，neutral 灰。',
      '可点（给了 onSelect）：悬停有底色，键盘焦点有环。',
      '空：只写 emptyText。',
    ],
    donts: [
      '不要在件里取今天、昨天：日标题的字由 dayLabel 给，「今天」是应用知道的。',
      '不要一次传几万条：它不做虚拟滚动，翻页或分段加载由应用管。',
      '不要拿它画行情或逐笔成交：那些用 DataGrid。',
    ],
    composition:
      'EventTimeline\n  section × 天\n    h3 日标题\n    ol\n      li × 事件：time、圆点、正文（标题 + 来源标签、说明；可点时是 button）',
    keys: [['Tab（可点时）', '在事件间走；Enter / 空格选中']],
  },
  {
    id: 'sparkline',
    group: 'quotes',
    cardHeight: 60,
    title: 'Sparkline 迷你图',
    summary:
      '一列数从旧到新，按容器的真实像素画（不拉伸、线宽 1.5px，高 80 以上 2px、圆角连接）。默认是线加线下渐变（贴线 22% 渐到 0），最新值处是实心点加常驻空心环；给毫秒时间戳与 domain 时横轴是整个交易时段、线只画到现在（对齐 TradingView Markets 页的日内图），可加右侧价格刻度、底部时间刻度与最新价价签；另有 line、baseline（基准上涨色下跌色）、bars、winloss（胜负格）四种画法。look 给两种可选画风（默认外观不变）：instrument 是把数据当科学档案来排版的仪器档案页（细线、一个信号色、点阵与角标、投影谱、极值与研究员批注、档案编号与来源行），ascii 是终端字形（块字符或盲文点阵、可换点阵字体）。可加基准虚线、最高最低点、右端最新值、成交量、断点、单调曲线；interactive 时悬停出一根竖线、吸附点与紧挨光标的三行读数（数值、日期、时间），键盘左右键走点。线色按最后值对基准（没基准按头尾），涨跌色跟涨跌配色走，没有数据只留「—」。',
    exports: ['Sparkline', 'sparkPoints', 'sparkTone', 'quoteTone'],
    propParts: [
      {
        part: 'Sparkline',
        note: '值是数（从旧到新）；读数、标签、刻度字由调用方的 format 与 label 写。interactive 时才可聚焦、走点。',
      },
      {
        part: '纯函数',
        note: 'sparkPoints(values, width, height) 给 polyline 的点；sparkTone(values) 取头尾三态；quoteTone(change) 由一个涨跌数取三态（报价类的件共用）。几何（断点分段、基准切分、单调插值、设备像素对齐、时间到横坐标与休市压缩、时间与价格刻度、读数框位置）在 quotes/sparkline-model.ts，都是纯函数。',
      },
    ],
    states: [
      '有数据：默认 area，一根线加线下渐变，末端点在最新值处；线色按最后值对基准，没基准按头尾（涨、跌、平）。',
      'line：只一根线；baseline：以基准为界，上面涨色、下面跌色，线与面积都分色；bars：每个值一根细柱；winloss：每个值只表示正负，等高小方块。',
      '给了 baseline：画 1px 虚线（dash 2 2）；给了 lastLabel：右端写最新值，线留出位置不压字；showExtremes：最高最低各一个点，extremeLabels 在点旁写字，放不下自动换边。',
      'values 里的 null 或 NaN 是断点：线与面积在那里断开（午休、停牌），末端点取最后一个有效值。',
      '给了数字 times（毫秒）：按时间定横坐标；给了 domain 整个时段是横轴，线只画到最后一个点，右边留空；domain 之外与休市里的点裁掉。不给 times 与 domain 仍按序号铺满整宽。',
      '给了 sessions（如 A 股上午、下午）：时段之间的休市在横轴上压成一道 4px 的细缝，线与面积在那里断开。',
      '给了 axis（高度 60px 以上才生效）：右侧价格刻度（默认 4 档，从最低均分到最高）与底部时间刻度（自动挑放得下的间隔，或按分钟数），挤在一起的刻度字丢掉；lastTag：右轴上涨跌色实底的最新价价签，字用对比色。',
      '值变化：末端环外的光晕从 0 放大淡出一次（环本身常驻），新点追加时线、面积与末端点一起平滑延伸；窗口左移不跳。',
      'interactive：悬停出一根竖线（没有横线）、吸附到最近点的圆点和紧挨光标的读数框（HTML 三行：粗体数值、日期、时间，贴边左右翻转，不出容器；图太矮放不下时放到图上方）；只给了 times 没给 formatTime 时只显示数值；聚焦后左右键走点，Home / End 到头尾，Esc 退出。',
      '有 volumes：底部四分之一高度画细量柱，价格线在它上方；volumeTone 为 updown 时按涨跌着色。',
      '没有数据（有效值少于两个）：只留「—」，读屏名说清没有数据。',
      'look="instrument"（仪器档案）：1px 中性墨色线（不用涨跌色），底上是很淡的 + 点阵，四角 6px 的 L 形对位角标（reticle 加中心十字）；全图只有末端点与批注用信号色（--accent，可传 signal）；刻度是 2 到 3px 的短线加宽字距（0.15em）等宽小字；baseline 画成细虚线，interactive 悬停是横竖两条细线的十字准星加读数框。',
      'instrument 的大图（高 80 以上）：projection 在右侧画这列值的分布（默认高斯核密度、Silverman 带宽，projectionMode 可换直方图），与主图共享纵轴，横线标当前值，新点进来柱子平滑过渡；showExtremes 的最高最低是小十字加引线加 extremeLabels 写的 H / L；annotation 是一圈手绘圈（按下标播种，不随渲染变）加一句话；meta 是左上档案编号与左下 SOURCES 行。高度低于 80 时只画线、点阵与末端点。',
      'look="ascii"（终端字形）：整幅是一个 pre（aria-hidden），外层 role=img；glyphs 取 blocks（每列一个 ▁▂▃▄▅▆▇█，高了多行、每行 8 级）或 braille（盲文 2 × 4 点连续折线）；列数按容器宽与字宽算；默认中性墨色、最新一列信号色，给 tone 着涨跌色；font="dot" 换点阵字体。',
      'ascii 的断点那一列是空格，时段横轴按列映射、休市压成一列 ┊，baseline 是一行 ┄；新点进来整幅左移一列，新列先在字形集里乱跳几帧再落定（--dur-reorder）；interactive 的读数框照旧。',
    ],
    donts: [
      '不要在静态的折线上读具体数值：要数请配价格文字，或开 interactive。',
      '表格里一行一个时不要开 interactive；行高很矮（如 22px）时用 showLast={false}。',
      '不要把读数、标签、读屏名写死在包里：format、extremeLabels、lastLabel、label 都由调用方按界面语言传。',
      '不要拿 bars 或 winloss 表达趋势：它们是逐点的涨跌与正负，趋势用 area 或 line。',
      '不要给一个根本没有基准意义的数列硬传 baseline：画出的虚线会被当成昨收。',
      '不要在 instrument 里再加第二个信号色或涨跌色：信号色只标「此刻要看的地方」（末端点、批注）。',
      '不要把 ascii 放进要读准数的地方：字符画只给走势的形状，要数配文字或开 interactive。',
    ],
    composition:
      'Sparkline\n  svg role=img（viewBox = 容器真实宽高；interactive 时 tabIndex=0）\n    defs（线下渐变、基准分色的两块裁剪）\n    量柱 · 基准虚线 · 面积 · 线（每段一个 M）· 柱 / 胜负格\n    最高最低点与字 · 光晕 · 末端点 · 右端最新值\n    价格刻度 · 时间刻度 · 最新价价签\n    悬停：竖线 · 吸附点 · 读数框（foreignObject 里的 HTML）\n  span[aria-live]（interactive 时，节流播报当前点的读数）\n\nlook="instrument"\n  svg role=img\n    + 点阵 · 四角角标 · 眉头与 SOURCES 行\n    价格刻度（短线 + 字）· 时间刻度 · 基准细虚线\n    投影谱（脊线 · 横向细柱 · 当前值横线）· 线 · 极值（小十字 + 引线 + 字）· 批注（手绘圈 + 引线 + 字）· 末端点 · 价签\n    悬停：横竖十字线 · 读数框\n\nlook="ascii"\n  span[role=img]\n    pre[aria-hidden]（每行一个 span，同色连续字符合并成一个节点）\n    悬停：列光标 · 读数框',
    keys: [
      ['左 / 右方向键（interactive，聚焦时）', '走到前一个 / 后一个有效点，读屏播报读数'],
      ['Home / End', '走到第一个 / 最后一个有效点'],
      ['Esc', '退出读数，焦点留在图上'],
    ],
  },
  {
    id: 'mini-chart',
    group: 'quotes',
    cardHeight: 260,
    title: 'MiniChart 迷你行情卡',
    summary:
      '照 TradingView 的 Mini Chart 小组件（2026-11-18 在浏览器里看的）：卡片上一行「品种图标 + 代码 + 角标」，一行「最新价 单位 + 涨跌幅」，下面是走势（Sparkline 的 area：线 2px 圆角、线下很淡的同色渐变、末端实心点加空心环）。给了毫秒时间戳与 domain，线只画到现在、右边留空；live 时价格滚动、涨跌幅闪色。没有基准线与坐标轴，默认不开悬停。',
    exports: ['MiniChart'],
    propParts: [{ part: 'MiniChart' }],
    states: [
      '默认：图标、代码、价格、涨跌幅与走势；涨跌色按 change（涨、跌、平）。',
      '给了 times 与 domain（可加 sessions）：横轴是整个交易时段，线只画到最后一个点，右边留空；午休被压缩、线在那里断开。',
      'live：价格变了用 RollingText 滚动，涨跌幅闪一次涨跌色，走势新点追加时线平滑延伸、末端环放大淡出一次。',
      '给了 onSelect：整张卡是按钮，悬停提亮、键盘焦点有环；不要同时开 interactive。',
      'look：原样交给走势的 Sparkline（instrument、ascii），卡片本身与默认外观不变。',
      '没有走势数据（有效值少于两个）：走势的位置只留「—」。',
    ],
    donts: [
      '不要在包里写文字：角标、单位、读屏名都由调用方传。',
      '不要给它加基准线与坐标轴：要它们用 Sparkline 的 baseline 与 axis。',
      '不要在可点的卡上开 interactive：按钮里不该再有可聚焦的子元素。',
      '不要拿它放进表格行：行内用 Sparkline，卡片用 MiniChart。',
    ],
    composition:
      'MiniChart\n  div[role=group] | button\n    span（SymbolMark · 代码 · 角标）\n    span（价 RollingText · 单位 · ChangeText）\n    span > Sparkline',
    keys: [['Tab / Enter', '有 onSelect 时到卡上、触发']],
  },
  {
    id: 'gauge-bar',
    group: 'quotes',
    cardHeight: 300,
    title: 'GaugeBar 进度条',
    summary:
      '上面一行名字、数和档位词，中间一条进度条标出数的位置，下面一句说明数是怎么来的。取不到时不画填充，数那里写原因。从应用的分析视图提来。',
    exports: ['GaugeBar'],
    propParts: [
      {
        part: 'GaugeBar',
        note: 'share 是 0 到 1 的位置（null 表示取不到）；名字、数、档位词与说明都是调用方写好的字。',
      },
    ],
    states: [
      '有位置：填充占轨道的 share，宽度按 snappy 弹簧变。',
      '取不到（share 为 null）：不画填充，数换成弱色小字并写原因。',
      '越界的 share 按边画。',
      '分段（给了 segments）：轨道按各段的量切成色块（色调只有 up / down / muted / accent），段间 1px 缝，标签（含家数）写在条下面；不看 share。',
    ],
    donts: [
      '不要用单段的 share 表达多值：多值给 segments。',
      '不要省掉说明一句：数怎么来的要写在 note 里。',
      '不要给 segments 传色值：只选色调名。',
    ],
    composition:
      'GaugeBar\n  figcaption（label · value · level）\n  div（轨道）\n    span（填充）| span × n（分段）\n  ul（分段标签）\n  p（note）',
    keys: [],
  },
  {
    id: 'treemap',
    group: 'quotes',
    cardHeight: 400,
    title: 'Treemap 矩形树图',
    summary:
      '一格一项，面积按大小，颜色按涨跌分七档（跟涨跌配色走），格子够大才写名字和数；点组头下钻，底部是色例。排布用 d3-hierarchy 的 squarify。从应用的分析视图提来。',
    exports: ['Treemap', 'layoutTreemap', 'colorStep', 'TREEMAP_W', 'TREEMAP_H'],
    propParts: [
      {
        part: 'Treemap',
        note: '排布由调用方先用 layoutTreemap 算好再传 blocks；工具条（下拉、返回钮）从 toolbar 传。点格子 onSelect（旧名 onItem）。',
      },
      {
        part: 'layoutTreemap(items, grouped)',
        symbol: 'layoutTreemap',
        note: 'items 是 { data, size, group }；size 不是正数的项不画；grouped 为 false 整张一块。colorStep(change, limit) 返回 −3 到 3 或 null。',
      },
    ],
    states: [
      '默认：一格一项，面积按大小，颜色七档。',
      '分组下钻：点组头只剩那一组，工具条里自己放返回钮。',
      '格子太小时只留色块，不写字。',
      '没有涨跌数的格子用中性色。',
      '格子上的字按底色明暗选黑或白（oklch 亮度 0.565 为界，relative color 从底色算）：七档在八个主题与两种涨跌配色下都 ≥ 4.5:1（2026-11-18 修，原来一律白字压在亮绿亮红上只有 1.5 到 4.4:1）；色例同理。',
    ],
    donts: [
      '不要用于项目数很多又没法下钻的场景，小格会糊成一片。',
      '不要用 classes 把格子的字色写死成白色：底色最亮的几档会掉到 4.5:1 以下。',
      '不要把排布放进渲染里重算：先用 layoutTreemap 排好再传 blocks。',
    ],
    composition:
      'Treemap\n  div（工具条）\n  div（画布）\n    div（一组）\n      button（组头）\n      div（一格：名字 · 数）\n  ol（色例，五档）',
    keys: [
      ['Tab', '到可点的格子与组头'],
      ['Enter', '点开格子（组头是原生按钮，Enter / Space 都行）'],
    ],
  },
  {
    id: 'price-tag',
    group: 'quotes',
    cardHeight: 48,
    title: 'PriceTag 行内价格标签',
    summary:
      '夹在一句话或一行里的「名字 价格 涨跌」，数字等宽对齐，涨跌带三角与颜色，跟着周围的字号走。值是数（last、changePct，跟统一行情行同名），价格文字由 formatPrice 写。',
    exports: ['PriceTag'],
    propParts: [
      {
        part: 'PriceTag',
        note: '方向由 changePct 的正负定（也可传 tone 盖过）；旧的 price / change 字符串照认一个版本（@deprecated）。不可交互，没有键盘操作。',
      },
    ],
    states: [
      '涨、跌：涨跌文字带三角与对应颜色。',
      '平：没有三角，用弱色。',
      '只有价格：不写名字与涨跌。',
      '价格变了：闪一次涨跌色（ReadoutFlash），约 1 秒落回。',
    ],
    donts: [
      '不要只靠颜色表达涨跌：三角与带符号的文字必须在。',
      '不要传写好的价格字符串：传数与 formatPrice，品种精度由调用方定。',
      '不要拿它当按钮：要可点用 QuoteCard 的 onSelect。',
    ],
    composition: 'PriceTag\n  span（名字）\n  span（价）\n  span（三角 · 涨跌）',
    keys: [],
  },
  {
    id: 'quote-card',
    group: 'quotes',
    cardHeight: 300,
    title: 'QuoteCard 报价卡',
    summary:
      '一只品种一张卡：名字与代码、最新价（大）、涨跌与涨跌幅、可选的迷你图与底部一行；QuoteStrip 是一排小号的卡，放不下横向滚动。值是数（统一行情行的 last / change / changePct），整行 {...row} 直接摊进来，价格文字由 formatPrice 写。',
    exports: ['QuoteCard', 'QuoteStrip'],
    propParts: [
      {
        part: 'QuoteCard',
        note: '方向由 change 的正负定（没有 change 看 changePct，也可传 tone）；迷你图的读屏名在 labels.spark。旧的 price / percent 与字符串 change、sparkLabel 照认一个版本（@deprecated）。',
      },
      { part: 'QuoteStrip', note: 'items 是 QuoteCard 的属性加 id；每张卡用小号。' },
    ],
    states: [
      '默认：名字、价、涨跌；可带迷你图与底部一行。',
      '可点：整张卡是按钮，悬停提亮、按下缩到 0.98、键盘焦点有环。',
      '小号（QuoteStrip 里）：148 宽，放不下横向滚动。',
      '价格变了：闪一次涨跌色；迷你图新点追加时线平滑延伸。',
    ],
    donts: ['不要在卡里再放可点的子元素：给了 onSelect 整张卡已是按钮。', '不要把一排卡折行成网格：一排就是横向滚动。'],
    composition:
      'QuoteCard\n  span（名字 · 代码）\n  span（价）\n  span（三角 · 涨跌 · 涨跌幅）\n  Sparkline\n  span（footer）\nQuoteStrip\n  div role=list\n    div role=listitem\n      QuoteCard size=sm',
    keys: [['Tab / Enter', '有 onSelect 时到卡上、触发']],
  },
  {
    id: 'performance-strip',
    group: 'quotes',
    cardHeight: 150,
    title: 'PerformanceStrip 业绩条',
    summary:
      '照 TradingView 品种页的 Performance 一行（2026-11-15 实测）：一排等宽格，上行周期（1 day … All time）、下行涨跌幅（涨跌色，过千写成 K%、M%）；点一格选中（灰底，aria-pressed）并回调，由调用方去切图表区间。数与周期名都由调用方传，件不算涨跌幅。选中用中性灰，不用 TV 的蓝。',
    exports: ['PerformanceStrip', 'formatPerformance'],
    props: [
      {
        part: 'PerformanceStrip',
        rows: [
          {
            name: 'items',
            type: 'PerformanceItem[]',
            desc: '{ id（旧名 key）, label, change（百分数；没有写 null，画「—」）}。',
          },
          {
            name: 'value / defaultValue / onValueChange',
            type: 'string / string / (id) => void',
            desc: '选中的格子；不给 value 就自己记。',
          },
          { name: 'label', type: 'string', desc: '读屏名（role=group），必填。' },
          { name: 'digits', type: 'number', default: '2', desc: '涨跌幅位数。' },
        ],
      },
      {
        part: 'formatPerformance(value, digits)',
        note: '纯函数：+12.50%、+1.84K%、+142.60K%；不是有限数写「—」。',
        rows: [],
      },
    ],
    states: [
      '选中的格子灰底、aria-pressed=true；悬停提亮。',
      '涨红跌绿由 data-updown 决定，平不着色。',
      '没有数据的格写「—」。',
    ],
    donts: ['不要在件里算涨跌幅；由调用方传。', '不要用蓝色表示选中。'],
    composition: 'PerformanceStrip role=group\n  button × n（周期名 · 涨跌幅）',
    keys: [['Tab / Space / Enter', '到格子上、选中']],
  },
  {
    id: 'peer-cards',
    group: 'quotes',
    cardHeight: 230,
    title: 'PeerCards 同业卡',
    summary:
      '照 TradingView 品种页的 Peers（2026-11-15 实测）：横向卡片带，左右翻页箭头（到头变灰）；每卡一个字母圆徽标、代码、名称（过长截断）、右上「+」、价格（带单位小字）与涨跌幅（涨跌色）；右上角整组一个「Select to compare」按钮。数、价格与文字都由调用方传，不放真实公司标志。',
    exports: ['PeerCards'],
    props: [
      {
        part: 'PeerCards',
        rows: [
          {
            name: 'items',
            type: 'PeerItem[]',
            desc: '统一行情行的字段：{ id, symbol, name, last（数）, changePct（百分数）, unit?, logoSrc? }；旧的 { key, code, price 字符串, change } 照认一个版本。',
          },
          {
            name: 'formatPrice',
            type: '(n: number) => string',
            default: 'toFixed(2)',
            desc: '价格怎么写（品种精度由调用方定）。',
          },
          {
            name: 'labels',
            type: 'PeerCardsLabels',
            desc: '{ list, prev, next, compare, add(item) }：读屏名与按钮字。',
          },
          { name: 'onSelect / onAdd / onCompare', type: 'callbacks', desc: '点卡、点「+」、点「Select to compare」。' },
        ],
      },
    ],
    states: ['滚到最左：上一页箭头 disabled；滚到最右：下一页箭头 disabled。', '名称过长：省略号，悬停看全名。'],
    donts: ['不要把「+」塞进卡的按钮里：它是卡旁边另一个按钮。', '不要放真实公司标志。'],
    composition:
      'PeerCards\n  按钮组（compare · prev · next）\n  div role=list\n    div role=listitem（button 卡 · button +）',
    keys: [['Tab / Enter', '卡、「+」、箭头、对比按钮']],
  },
  {
    id: 'key-stats',
    group: 'quotes',
    cardHeight: 300,
    title: 'KeyStats 关键数据',
    summary:
      '照 TradingView 品种页的 Key stats（2026-11-15 实测）：标题带「›」，三列网格，每项一个灰色小标签（带「›」，给了 onItem 就可点）、一个大号数值（带单位小字）、可选徽标（中性灰胶囊，不用 TV 的紫色）。数值与文字由调用方传。',
    exports: ['KeyStats'],
    props: [
      {
        part: 'KeyStats',
        rows: [
          { name: 'title', type: 'string', desc: '标题。' },
          {
            name: 'items',
            type: 'KeyStatItem[]',
            desc: '{ id（旧名 key）, label, value?, unit?, badge? }；没有值画「—」。',
          },
          {
            name: 'onTitle / onSelect',
            type: 'callbacks',
            desc: '给了标题与标签就变成按钮，带「›」（onSelect 旧名 onItem）。',
          },
          { name: 'columns', type: 'number', default: '3', desc: '列数。' },
        ],
      },
    ],
    states: ['没给 onSelect：标签是普通文字，没有「›」。', '没有值：数值位写「—」。', '数值变了：闪一次涨跌色。'],
    donts: ['不要在件里格式化数值；由调用方传。', '徽标不要用彩色。'],
    composition: 'KeyStats section\n  h3 标题（›）\n  dl 网格\n    div（dt 标签 › · dd 数值 · 单位 · 徽标）',
    keys: [['Tab / Enter', '给了回调时到标题、标签上、触发']],
  },
  {
    id: 'ticker-tape',
    group: 'quotes',
    cardHeight: 150,
    title: 'TickerTape 跑马灯',
    summary:
      '一排品种（徽标 + 代码 + 最新价 + 涨跌幅，可带走势）横向无缝循环滚动：同一排画两遍、CSS 动画平移 -50%，速度按每秒像素算（默认 40）。悬停、聚焦或按右端暂停钮停住；点一项联动。系统「减少动态效果」或 mode="static" 时不动、可横向滚动。布局照 TradingView Ticker Tape 小组件。',
    exports: ['TickerTape'],
    propParts: [
      {
        part: 'TickerTape',
        note: 'items 是 QuoteRow 加 logo / currency / series；价格文字由 formatPrice 写（可拿到这一项按品种定位数）。labels 必填：整条的读屏名、暂停与继续两种字，trend 给了才画走势。',
      },
    ],
    states: [
      '滚动（scroll）：整条匀速左移，循环接缝看不出；第二遍 aria-hidden + inert。',
      '停住：指针在条上、焦点在条里或按了暂停钮；暂停钮换成「继续」。',
      '静止（static，或系统减少动态效果）：只画一遍，没有暂停钮，条可以横向滚动（键盘可聚焦）。',
      '某项悬停：底色提到 surface-raised。价变了只闪变了的尾数（FlashPrice）。',
    ],
    donts: [
      '不要去掉暂停钮：自动动、超过 5 秒、跟别的内容并排就要能停（WCAG 2.2.2）。',
      '不要用颜色以外没有符号的方式表达涨跌：涨跌幅带 + / − 号。',
      '不要放几十项：一遍超过三四屏宽时用 Watchlist。',
    ],
    composition:
      'TickerTape（section）\n  滚动区\n    轨道（两遍）\n      项（button 或 span）：SymbolMark · 代码 · FlashPrice · 币种 · ChangeText · Sparkline\n  暂停 / 继续钮',
    keys: [
      ['Tab', '走到各项（只走第一遍）与暂停钮；焦点在条里时停住'],
      ['Enter / Space', '选这一项（给了 onSelect）；在暂停钮上切暂停 / 继续'],
      ['← / →', '静止时滚动区有焦点，横向滚'],
    ],
  },
  {
    id: 'watchlist',
    group: 'quotes',
    cardHeight: 380,
    title: 'Watchlist 自选列表',
    summary:
      '照 TradingView 右侧自选栏（2026-11-15 实测）：列 Symbol / Last / Chg / Chg%，行首小旗标与字母圆徽标；最新价变动时只有变了的尾数闪涨跌色、约 1 秒落回；点列头排序（升序、降序、回原顺序）。价格怎么写由 formatPrice 定，数与文字由调用方传。',
    exports: ['Watchlist', 'changedTail', 'nextSort', 'sortRows', 'plainPrice', 'rowTone'],
    props: [
      {
        part: 'Watchlist',
        rows: [
          {
            name: 'rows',
            type: 'WatchlistRow[]',
            desc: '统一行情行 QuoteRow { id, symbol, name?, last, change, changePct }（都是数）加 { flagged?, logoSrc? }；旧的 key / code 照认一个版本。',
          },
          {
            name: 'labels',
            type: 'WatchlistLabels',
            desc: '{ columns: { symbol, last, chg, chgPct }, list, empty, flag(row) }。',
          },
          {
            name: 'formatPrice',
            type: '(n: number) => string',
            default: 'toFixed(2)',
            desc: '最新价与涨跌额怎么写；闪色按它写出来的文字比尾数。',
          },
          { name: 'sort / onSortChange', type: 'WatchlistSort | null', desc: '排序（受控）；不给就自己记。' },
          { name: 'onSelect / onFlag', type: 'callbacks', desc: '点行（旧名 onRow）；点旗标（行 + 新状态）。' },
        ],
      },
      {
        part: 'QuoteRow · plainPrice · rowTone',
        note: '统一的行情行（2026-11-18）：Watchlist、QuoteTable、PeerCards、QuoteCard 都用 { id, symbol, name, last, change, changePct }，值是数，文字由 formatPrice 写；plainPrice 是不给 formatPrice 时的两位小数，rowTone(row) 由 change（再看 changePct）定涨跌。',
        rows: [],
      },
      { part: 'changedTail(prev, next)', note: '新旧价格文字从哪一位开始不同：返回 { head, tail }。', rows: [] },
      { part: 'nextSort / sortRows', note: '列头点击的循环与排序，纯函数。', rows: [] },
    ],
    states: [
      '最新价变大：变了的尾数起闪涨色；变小闪跌色；约 1 秒落回原色。',
      '当前排序列的列头带 ▲ / ▼，th 的 aria-sort 跟着变。',
      '旗标：悬停才显示，标上的常亮；没有行画空态。',
    ],
    donts: [
      '不要给整个价格闪色：只有变了的尾数。',
      '不要放真实公司标志。',
      '不要传写好的价格字符串：行是数，位数交给 formatPrice。',
    ],
    composition:
      'Watchlist table\n  thead：列头按钮 × 4\n  tbody tr：旗标 · SymbolMark · 代码 | 最新价（尾数闪色）| 涨跌额 | 涨跌幅',
    keys: [['Tab / Enter', '列头排序、旗标']],
  },
  {
    id: 'range-bar',
    group: 'quotes',
    cardHeight: 60,
    title: 'RangeBar 区间条',
    summary: '一条横线从最低到最高，标记指着现价在区间里的位置，两端写最低与最高。用来看当日区间、52 周区间。',
    exports: ['RangeBar', 'rangeShare', 'CompareBar'],
    propParts: [
      {
        part: 'RangeBar',
        note: 'low / high / value 是数，两端的字由 digits 或调用方的 lowLabel / highLabel 写；role=meter 要 label。',
      },
      {
        part: 'CompareBar',
        note: '两条同比例尺的细条，比成交量与 30 日均量；只用中性灰（没有方向，不上涨跌色）。',
      },
      {
        part: 'rangeShare(low, high, value)',
        symbol: 'rangeShare',
        note: '现价在区间里的位置 0 到 1；算不出是 null。',
      },
    ],
    states: [
      '现价在区间内：标记停在对应位置，标记按弹簧滑动。',
      '现价在区间外：标记贴边。',
      '最高不大于最低或数不是有限数：不画标记，只留两端的数。',
    ],
    donts: ['不要拿它画没有上下界的量。', '不要省略 label：它是 role=meter，读屏要名字。'],
    composition: 'RangeBar role=meter\n  span（最低）\n  span（轨道：填充 · 标记）\n  span（最高）',
    keys: [],
  },
  {
    id: 'rating-gauge',
    group: 'quotes',
    cardHeight: 190,
    title: 'RatingGauge 评级仪表',
    summary:
      '半圆分五段（强烈卖出到强烈买入），一根指针转到分数那一段，圆心下面写档位词，下面可再放卖出 / 中性 / 买入各几个。',
    exports: ['RatingGauge', 'ratingZone', 'ratingAngle'],
    propParts: [
      {
        part: 'RatingGauge',
        note: 'score 是 −1 到 +1 的数，五个档位名由调用方传（zones）；children 放在档位词下面（常是卖出 / 中性 / 买入的个数）。',
      },
      {
        part: 'ratingZone(score) / ratingAngle(score)',
        symbol: 'ratingZone',
        note: '落在第几段（0 到 4）；指针转角（度，−90 到 +90）。',
      },
    ],
    states: [
      '五段之一高亮，其余淡显；指针用 gentle 弹簧转到分数。',
      '分数越界夹到边，不是有限数当 0（中性）。',
      '可在档位词下放个数统计。',
    ],
    donts: ['不要在包里决定评级怎么算：分数与五个档位名由调用方传。', '不要把中间一段当没有信号：中性是一个有效档位。'],
    composition: 'RatingGauge\n  svg（五段弧 · 指针 · 圆心）\n  figcaption（档位词）\n  div（children）',
    keys: [],
  },
  {
    id: 'row-actions',
    group: 'quotes',
    cardHeight: 330,
    title: 'RowActions 行快捷操作与品种菜单',
    summary:
      '所有带品种的行（DataGrid、连板天梯、报价表）与格子（市场热力图）共用的一套：悬停或键盘落到一行时，行右端浮出前几颗无边框图标按钮，浮在行上、不挤列宽；右键（菜单键、Shift+F10）出同一份菜单。件不认识「图表」「自选」，只认 { key, label, icon?, shortcut?, onSelect }，文案与动作都由调用方传；symbolMenu 把标准四项（开图、加自选、新建告警、复制代码，固定次序）拼成这样的数组，调用方的项接在后面。DataGrid、LimitLadder、MarketHeatmap 各有一个可选 prop 接它，不传就没有，旧用法不变。功能参照 TradingView 品种搜索结果行的悬停操作，自选行的细节待核对。样子照连板天梯：按钮无边框、悬停灰底，不加橙色。',
    exports: ['RowActions', 'RowActionMenuItems', 'RowContextMenu', 'symbolMenu'],
    props: [
      {
        part: 'RowActions',
        note: '按钮条绝对定位在宿主行右端，宿主行要 position: relative（单独用时给行加 k-row-host，悬停与焦点在行内都出现）。',
        rows: [
          {
            name: 'items',
            type: 'RowAction[]',
            desc: '全部项；按钮条只画带 icon 的前 max 个，没有图标的项只在菜单里。',
          },
          { name: 'label', type: 'string', desc: '屏幕阅读器念的组名。' },
          { name: 'max', type: 'number', default: '3', desc: '最多画几颗按钮。' },
          {
            name: 'focusable',
            type: 'boolean',
            default: 'true',
            desc: '按钮能不能用 Tab 走到。行自己管键盘的表与列表（DataGrid、LimitLadder）传 false，用菜单键开完整菜单。',
          },
          { name: 'role', type: 'string', default: "'group'", desc: '宿主行是表里的一格时给 gridcell。' },
          {
            name: 'pointerOnly',
            type: 'boolean',
            desc: '按钮画成不可聚焦、对读屏隐藏的 span（宿主行是 option 这类里面不许有可聚焦子项的角色时用，连板天梯就是）；键盘与读屏走菜单键开的整份菜单。',
          },
        ],
      },
      {
        part: 'RowAction',
        rows: [
          { name: 'key', type: 'string', desc: '稳定的名字（DOM 上是 data-action）。' },
          { name: 'label', type: 'string', desc: '菜单文字，按钮的读屏名与悬停提示。' },
          { name: 'icon', type: 'ReactNode', desc: '按钮图标；不给就只出现在菜单里。' },
          { name: 'shortcut', type: 'string', desc: '快捷键的字（写好的）：菜单行尾显示，按钮悬停提示里跟在名字后。' },
          { name: 'disabled', type: 'boolean', desc: '禁用。' },
          { name: 'onSelect', type: '() => void', desc: '点按钮或选菜单项。' },
        ],
      },
      {
        part: 'symbolMenu(input)',
        note: '纯函数，返回 RowAction[]。没传的标准项跳过；标准项没传 icon 用包里的默认图标。',
        rows: [
          {
            name: 'openChart',
            type: '{ label, onSelect, icon?, shortcut?, disabled? }',
            desc: '打开图表（key open-chart）。',
          },
          { name: 'addToWatchlist', type: '同上', desc: '加入自选（add-to-watchlist）。' },
          { name: 'newAlert', type: '同上', desc: '新建告警（new-alert）。' },
          { name: 'copyCode', type: '同上', desc: '复制代码（copy-code）。' },
          { name: 'extra', type: 'RowAction[]', desc: '调用方自己的项，排在标准四项后面。' },
        ],
      },
      {
        part: 'RowContextMenu',
        note: '给一组行包上同一份右键菜单（连板天梯、热力图内部就用它）；自己不画盒子（display: contents）。',
        rows: [
          {
            name: 'actionsFor',
            type: '(key: string) => RowAction[]',
            desc: '按行的键给这一行的项；空数组不出菜单；不传就原样画孩子。',
          },
          { name: 'label', type: 'string', desc: '菜单的读屏名。' },
          { name: 'keyAttribute', type: 'string', default: "'data-code'", desc: '行元素上带键的属性名。' },
        ],
      },
      {
        part: 'RowActionMenuItems',
        rows: [
          {
            name: 'items',
            type: 'RowAction[]',
            desc: '在当前菜单（右键或下拉）里画整份项：图标在名字前，快捷键在行尾。',
          },
        ],
      },
    ],
    states: [
      '默认：按钮条透明、不接指针。悬停宿主行、键盘落到这一行（DataGrid 的当前行、连板天梯的焦点行）、按钮自己聚焦时淡入。',
      '按钮：无边框，悬停 10% 白底；禁用 40% 不透明度。',
    ],
    donts: [
      '不要在件里写死「图表」「自选」的文案或动作：由调用方传。',
      '不要在悬停按钮里放超过三颗：多的进右键菜单。',
      '不要用橙色：橙色只给状态灯与选中条。',
    ],
    composition:
      'RowActions\n  span（group）\n    button × 最多 3（图标）\nRowContextMenu\n  ContextMenu\n    RowActionMenuItems（图标 | 名字 | 快捷键）',
    keys: [
      ['菜单键 / Shift+F10', '在焦点所在的行或格子上开同一份菜单'],
      ['↑ / ↓', '在行间移动（DataGrid、连板天梯），当前行的按钮条跟着出现'],
    ],
  },
  {
    id: 'quote-table',
    group: 'quotes',
    cardHeight: 250,
    title: 'QuoteTable 分组页签行情表',
    summary:
      '上面一排页签（指数、自选、热门……），下面是当前这组的行情表：名称与代码、迷你图、最新价、涨跌幅。由 Tabs 与 Sparkline 组出来；行就是 Watchlist 的行（统一行情行加 spark），值是数，价格文字由 formatPrice 写。',
    exports: ['QuoteTable'],
    propParts: [
      {
        part: 'QuoteTable',
        note: '页签值可受控（value / onValueChange）也可不受控（defaultValue，默认第一组）。文字在 labels（{ list, columns, empty }）；点行 onSelect。旧的 label / columns / empty / onRow 与字符串行（price / percent / tone）照认一个版本（@deprecated）。',
      },
    ],
    states: [
      '默认：第一组页签选中，下面是该组行情表。',
      '最新价变了：只闪变了的尾数（与 Watchlist 同一个 FlashPrice）；涨跌幅变了整格闪涨跌色。',
      '行可点：悬停提亮，键盘 Tab 到行、Enter 触发。',
      '空组：写调用方给的说明，不画表头。',
      '没有迷你图数据的行：走势列留空。',
    ],
    donts: ['不要在包里写死列名与空态文案，由调用方传。', '不要把几十个品种塞进一组不分页：这是总览，不是完整自选表。'],
    composition:
      'QuoteTable\n  Tabs\n    TabsList > TabsTrigger（一组一个）\n    TabsContent\n      table（表头 · 行：名称 · Sparkline · 价 · 涨跌幅）',
    keys: [
      ['← →', '在页签间移动（Radix Tabs）'],
      ['Tab / Enter', '到可点的行、触发'],
    ],
  },
  {
    id: 'uptime-bars',
    group: 'readouts',
    cardHeight: 184,
    title: 'UptimeBars 逐格可用条',
    summary:
      '一格一天或一小时的可用条，用于数据源与连接健康：颜色加高度一起表达状态（绿满格可用、琥珀半高降级、红满格中断、虚线底无数据）；悬停或聚焦一格，条下的读数行写那一格的整句（如断流次数）。功能参照 Arc Uptime status，实现原创。',
    exports: ['UptimeBars', 'uptimeShare'],
    props: [
      {
        part: 'UptimeBars',
        note: '文字全由 props 传：每一格的整句在 cell.label 里，包里没有文案。组是一个 role=group，每格一个带名字的 role=img。',
        rows: [
          {
            name: 'cells',
            type: 'UptimeCell[]',
            desc: '从旧到新；{ id, status: up | degraded | down | none, label }。',
          },
          { name: 'label', type: 'string', desc: '这一条的读屏名（整句）。' },
          { name: 'idle', type: 'ReactNode', desc: '没有悬停也没有聚焦时读数行写什么，常是可用率。' },
          { name: 'onSelect', type: '(cell) => void', desc: '给了格子才可点（Enter / Space 也触发）。' },
          { name: 'className', type: 'string', desc: '加在最外层。' },
        ],
      },
      {
        part: 'uptimeShare(cells)',
        note: '可用格（up）占有数据的格的比例；degraded 与 down 都不算可用，不另给权重；none 不进分母；全是 none 返回 null。',
        rows: [],
      },
    ],
    states: [
      'up 满格绿、degraded 六成高琥珀、down 满格红、none 一条细虚底；状态靠颜色与高度两路表达。',
      '悬停或聚焦一格：加描边，读数行换成那一格的整句；离开后回到 idle。',
      '只有一格在 Tab 序里（默认最新一格），左右键在格间走。',
    ],
    donts: ['不要用它画连续的数值（延迟、用量）：它只有四种离散状态。', '不要省掉每格的 label：悬停读数与读屏都靠它。'],
    composition: 'UptimeBars\n  div role=group\n    span role=img（一格，带 data-status）\n  output（读数行）',
    keys: [
      ['← / →', '焦点在格间移动，到头不绕回'],
      ['Home / End', '跳到最早 / 最新一格'],
      ['Enter / Space', '给了 onSelect 时选中当前格'],
    ],
  },
  {
    id: 'range-histogram-slider',
    group: 'forms',
    cardHeight: 162,
    title: 'RangeHistogramSlider 直方图区间滑块',
    summary:
      '一排柱子画出全体的分布，下面一条轨道两个把手：拖出来的区间里的柱子亮、区间外的暗；柱色取 seq 顺序色阶（越高越亮）。用在筛选器，在全市场分布上拖市值、涨幅、换手的区间。点柱子或轨道，最近的把手跳过去。功能参照 Arc Range histogram slider，实现原创。',
    exports: ['RangeHistogramSlider', 'histogramBins'],
    props: [
      {
        part: 'RangeHistogramSlider',
        note: '角色照 WAI-ARIA APG 的 Multi-Thumb Slider：两个 role=slider，各自带 aria-valuemin / max / now / valuetext；两个把手不交叉。值可受控也可不受控；文字全由 props 传。',
        rows: [
          { name: 'counts', type: 'number[]', desc: '每一箱的个数，等宽分箱铺满 [min, max]；用 histogramBins 算。' },
          { name: 'min / max', type: 'number', desc: '分布的范围。' },
          { name: 'step', type: 'number', default: '(max - min) / 箱数', desc: '步长，拖动与键盘都取整到它。' },
          {
            name: 'value / defaultValue / onValueChange',
            type: '[number, number]',
            desc: '当前区间；不给 value 就是不受控。',
          },
          {
            name: 'formatValue',
            type: '(value: number) => string',
            default: 'String',
            desc: '数值怎么写（读数行与 aria-valuetext）。',
          },
          { name: 'labels', type: 'RangeHistogramSliderLabels', desc: '{ low, high }：两个把手的读屏名（必填）。' },
          { name: 'label', type: 'string', desc: '整条的读屏名（必填）。' },
          { name: 'describe', type: '(range) => ReactNode', desc: '读数行；不给写「下限 – 上限」。' },
        ],
      },
      {
        part: 'histogramBins(values, min, max, bins)',
        note: '把一列数分进等宽的箱，最后一箱含 max；范围外与非有限数丢掉。',
        rows: [],
      },
    ],
    states: [
      '区间内的柱子不透明、区间外 35%，柱色按高度取 seq-200 到 seq-600；区间那一段轨道用强调色。',
      '两个把手叠在一起时，按指针往哪边拖决定动哪个，不会互相夹死。',
      '键盘聚焦的把手有焦点环。',
    ],
    donts: [
      '不要拿它选单个值：单值用 Slider。',
      '不要把原始数据传进来：先用 histogramBins 分箱，箱数也别太多（柱子细到看不清就没有意义）。',
    ],
    composition:
      'RangeHistogramSlider\n  div role=group\n    div（柱子，一箱一根）\n    div（轨道与选中段）\n    div role=slider × 2（把手）\n  output（读数行）',
    keys: [
      ['← / ↓', '当前把手减一个步长'],
      ['→ / ↑', '当前把手加一个步长'],
      ['PageDown / PageUp', '减 / 加十个步长'],
      ['Home / End', '去最小 / 最大（不越过另一个把手）'],
    ],
  },
  {
    id: 'ridgeline',
    group: 'quant',
    cardHeight: 660,
    title: 'Ridgeline 山脊图',
    summary:
      '每组一条核密度曲线，上下叠着排，一眼比各组分布的位置、宽窄与形状（分位层、因子分组的收益分布）。带宽默认 Silverman 经验规则；给了基准线就画一条贯穿的虚线。分层是序数：线与点阵面取 seq 色阶（暗到亮），不用涨跌色。悬停或聚焦一条，其余变暗。功能参照 Arc Ridgeline，实现原创。',
    exports: ['Ridgeline', 'ridgelines', 'ridgeStats', 'silvermanBandwidth', 'gaussianKde'],
    props: [
      {
        part: 'Ridgeline',
        note: '文字全由 props 传：每一条的整句在 describe 里。图是一个 role=group，每条一个带整句名的 role=img。',
        rows: [
          {
            name: 'groups',
            type: 'RidgeGroup[]',
            desc: '{ id, label, values: number[] }，从上到下排；不是有限数的值丢掉。',
          },
          { name: 'label', type: 'string', desc: '整张图的读屏名。' },
          {
            name: 'describe',
            type: '(group, stats) => string',
            desc: '一条的整句（读屏名与读数行）；stats 有 n、mean、median、min、max。',
          },
          { name: 'formatValue', type: '(value: number) => string', default: 'String', desc: '横轴刻度怎么写。' },
          {
            name: 'baseline',
            type: 'number',
            desc: '参照线的位置（如 0）；给了就画一条贯穿的虚线。',
          },
          { name: 'domain', type: '[number, number]', desc: '横轴范围；不给取全体数据加两头各 3 个带宽。' },
          { name: 'bandwidth', type: 'number', desc: '核密度的带宽；不给每组用 Silverman 规则。' },
          { name: 'rowHeight', type: 'number', default: '40', desc: '一行的高（viewBox 单位）。' },
          {
            name: 'overlap',
            type: 'number',
            default: '2',
            desc: '最高的山峰是一行高的几倍；大于 1 山脊叠进上一行。视觉取值，待定。',
          },
          { name: 'idle', type: 'ReactNode', desc: '没有悬停也没有聚焦时读数行写什么。' },
        ],
      },
      {
        part: 'ridgelines(groups, options) / silvermanBandwidth(values)',
        note: 'silvermanBandwidth 是 h = 0.9 · min(σ, IQR / 1.34) · n^(−1/5)（Silverman 1986 式 3.31）；少于两个数或全相等返回 null，ridgelines 用范围的 1/50 兜底（待定）。gaussianKde(values, xs, h) 是高斯核密度，积分为 1。',
        rows: [],
      },
    ],
    states: [
      '默认：每条是点阵纹理的面加顶线，中位数一根竖标；颜色按条的次序取 seq-200 到 seq-600。',
      '给了 baseline：多一条贯穿的虚线；涨跌色不出现（也不跟 data-updown 变）。',
      '悬停或聚焦一条：其余变暗，读数行写这一条的整句。',
      '取不出带宽的组（少于两个数或全相等）画成一个窄峰。',
    ],
    donts: [
      '不要用它比样本很少的组：核密度在几个点上画出的形状不可信，describe 里把个数写出来。',
      '不要在数量级不同的组之间共用一条横轴：先标准化或分开画。',
      '不要拿颜色表达涨跌：颜色只是层的次序，中位数竖标与读数行写出了数值。',
    ],
    composition:
      'Ridgeline\n  svg role=group\n    g（刻度线与基准线）\n    g role=img（一条：标签 · 底线 · 填充 · 顶线 · 中位数竖标）\n  output（读数行）',
    keys: [
      ['↑ / ↓', '焦点在条间移动，到头不绕回'],
      ['Home / End', '跳到第一 / 最后一条'],
    ],
  },
  {
    id: 'quantile-layers',
    group: 'quant',
    cardHeight: 700,
    title: 'QuantileLayers 因子分层',
    summary:
      '因子分层累计收益（卡 QuantileLayers）：层号是序数，线色取 seq-200 到 seq-600（暗到亮，最高层最亮），不用类别色也不用涨跌色。多空差是点阵纹理面加 ink-100 细线，线尾标最高层与最低层，最高层末点是强调色。悬停一层其余变 40%，点击锁定；扫读出 LCD 提示；底部一行结论（单调性灯加词、各项统计、来源）。图右上三件，表格视图必有。',
    exports: ['QuantileLayers', 'isMonotonic', 'layerLevel', 'quantileRange', 'sortLayers', 'lastFinite'],
    props: [
      {
        part: 'QuantileLayers',
        note: '文字全由 props 传。分层多于 10 不画线，只给表格（卡写改热力图，热力图待做）。',
        rows: [
          {
            name: 'layers',
            type: 'QuantileLayer[]',
            desc: '{ rank, label, points }；points 是累计收益，非有限数是缺口。',
          },
          { name: 'longShort', type: 'number[]', desc: '多空差序列（最高层减最低层）。' },
          { name: 'longShortLabel', type: 'string', desc: '多空差的名字。' },
          {
            name: 'labels',
            type: 'QuantileLayersLabels',
            desc: '读屏名、表格表头、单调性两个词、分层太多的提示、图右上三件的名字。',
          },
          { name: 'formatValue / formatX', type: 'function', desc: '数值与横轴格怎么写（纵轴、提示、表格）。' },
          { name: 'monotonic', type: 'boolean', desc: '单调性结论；不给就按期末累计收益是否随层号严格递增算。' },
          {
            name: 'stats',
            type: '{ key, label, value }[]',
            desc: '结论行的统计（多空年化、换手、样本……），口径由调用方写好。',
          },
          { name: 'source', type: 'ReactNode', desc: '来源一行。' },
          { name: 'onExport / onFullscreen', type: '() => void', desc: '不给就不画那个按钮；表格视图总有。' },
        ],
      },
    ],
    states: [
      '默认：每层一条 2px 线，多空差点阵面垫底，0 线 line-200，最高层末点强调色并标值。',
      '悬停或聚焦一层按钮：其余层变 40%；点击锁定（再点解除）。',
      '指针在图上移动或 ←→ 键：竖线加 LCD 提示，列各层与多空差的值。',
      '单调性：灯加词，通过 / 不通过各一个词，不单靠颜色。',
    ],
    donts: [
      '不要用类别色或涨跌色画分层：层号是序数。',
      '不要给多空线单独上色：用 ink-100 细线或点阵面。',
      '不要超过 10 层画线：线挤成一团，改看表格或热力图。',
    ],
    composition:
      'QuantileLayers\n  ChartActions\n  图（svg：网格 · 点阵面 · 0 线 · 多空线 · 分层线 · 竖线）+ 纵轴刻度 + 线尾标 + 末点 + LcdTooltip\n  层按钮一排\n  结论行 · 来源',
    keys: [
      ['← / →', '扫读一格（Shift 三格），Home / End 到头尾，Esc 清掉'],
      ['Tab / Enter', '层按钮：聚焦时淡出其余，Enter 锁定'],
    ],
  },
  {
    id: 'slope-chart',
    group: 'quant',
    cardHeight: 700,
    title: 'SlopeChart 斜率图',
    summary:
      '每项一条线连「前」「后」两列，看再平衡前后的权重、因子排名的变化。线与点是中性墨色，涨跌色只上变化后的那个数字（跟 data-updown 走），悬停与聚焦的线用强调色，两侧写名字与数，标签互相不重叠；rank 模式纵轴是名次，涨跌看名次升降。悬停或聚焦一条，其余变暗。功能参照 Arc Slope chart，实现原创。',
    exports: ['SlopeChart', 'slopeLayout', 'spreadLabels', 'ranks'],
    props: [
      {
        part: 'SlopeChart',
        note: '文字全由 props 传：列头在 columns、每一项的整句在 describe 里。图是一个 role=group，每项一个带整句名的 role=img。',
        rows: [
          { name: 'items', type: 'SlopeItem[]', desc: '{ id, label, before, after }。' },
          { name: 'label', type: 'string', desc: '整张图的读屏名。' },
          { name: 'columns', type: '{ before: string; after: string }', desc: '两列的列头。' },
          {
            name: 'describe',
            type: '(item, change) => string',
            desc: '一项的整句；change 在 value 模式是 after − before，rank 模式是名次升了几位。',
          },
          {
            name: 'mode',
            type: "'value' | 'rank'",
            default: "'value'",
            desc: 'value：纵轴是数值，值大在上；rank：纵轴是名次，第 1 名在上、等距。',
          },
          { name: 'formatValue', type: '(value: number) => string', default: 'String', desc: '两侧标签里的数怎么写。' },
          { name: 'height', type: 'number', desc: '图高（viewBox 单位）；默认按条数每条 18 高、至少 160。' },
          { name: 'onSelect', type: '(item) => void', desc: '给了才可点（Enter 也触发）。' },
          { name: 'idle', type: 'ReactNode', desc: '没有悬停也没有聚焦时读数行写什么。' },
        ],
      },
      {
        part: 'slopeLayout(items, options) / spreadLabels(ys, gap, lo, hi) / ranks(values)',
        note: 'spreadLabels 让标签保持上下次序、相邻至少隔 gap、整体落在 [lo, hi] 里；装不下时均匀铺满。ranks 值大的排前、从 1 起、相同按输入顺序。',
        rows: [],
      },
    ],
    states: [
      '涨：value 模式 after 大于 before，rank 模式名次升；跌相反；相等用中性色。',
      '悬停或聚焦一条：其余变暗，这一条加粗并画在最上面，读数行写它的整句。',
      '点挨得很近时线重叠，但标签被推开，各自对着自己的端点；端点旁的数仍是真值。',
    ],
    donts: [
      '不要放很多条（超过约二三十）：标签推开后离端点太远，读不出对应。',
      '不要拿它画随时间的连续走势：那是折线图；斜率图只比两个时点。',
      'rank 模式下不要再把数值当纵轴理解：线的斜率只表示名次变化。',
    ],
    composition:
      'SlopeChart\n  svg role=group\n    text（两个列头）\n    g role=img（一项：命中线 · 线 · 两个端点 · 两侧标签）\n    g aria-hidden（当前项的副本，画在最上）\n  output（读数行）',
    keys: [
      ['↑ / ↓', '焦点按左侧端点从上到下在项间移动，到头不绕回'],
      ['Home / End', '跳到最上 / 最下一项'],
      ['Enter', '给了 onSelect 时选中当前项'],
    ],
  },
  {
    id: 'connected-scatter',
    group: 'quant',
    cardHeight: 1146,
    title: 'ConnectedScatter 连线散点图',
    summary:
      '每个点是一个时刻的 (x, y)，按时间顺序连成轨迹，看一个对象在两个量之间怎么走（如策略的波动 vs 收益按月的路径、风格漂移）。时间方向不单靠颜色：起点空心圈、终点强调色实心圈加箭头、中间的点按时间取 seq 色阶（越晚越亮）。多条轨迹各取 series 色板的一个色。功能参照 Arc Connected scatter，实现原创。',
    exports: ['ConnectedScatter', 'scatterLayout'],
    props: [
      {
        part: 'ConnectedScatter',
        note: '文字全由 props 传：每个点的整句在 point.label 里，轴名在 axes。图是一个 role=group，每条轨迹一个 role=group，每个点一个带整句名的 role=img。',
        rows: [
          {
            name: 'series',
            type: 'ScatterSeries[]',
            desc: '{ id, label, points: { x, y, label }[] }；点按时间从早到晚排。',
          },
          { name: 'label', type: 'string', desc: '整张图的读屏名。' },
          { name: 'axes', type: '{ x: string; y: string }', desc: '两根轴的名字。' },
          { name: 'formatX / formatY', type: '(value: number) => string', default: 'String', desc: '刻度怎么写。' },
          { name: 'xDomain / yDomain', type: '[number, number]', desc: '轴范围；不给取全体数据放宽 5%。' },
          { name: 'idle', type: 'ReactNode', desc: '没有悬停也没有聚焦时读数行写什么。' },
        ],
      },
      {
        part: 'scatterLayout(series, frame, options)',
        note: '点到像素的纯函数：返回刻度位置、每个点的像素坐标与终点箭头的三个顶点。',
        rows: [],
      },
    ],
    states: [
      '起点空心圈、中间小点、终点大实心圈加箭头；中间的点取 seq-200 到 seq-600（按时间分档），终点用强调色加辉光。',
      '悬停或聚焦一个点：该点描白边，别的轨迹变暗，读数行写这个点的整句。',
      '单点的轨迹只画一个点，没有连线与箭头。',
    ],
    donts: [
      '不要在没有时间顺序的数据上用它：连线表示先后。',
      '不要放太多条轨迹（超过七条色板就循环、颜色重复）：轨迹交叠时看不清。',
      '不要只靠颜色认哪条是哪条：图例与每个点的整句里都写了名字。',
    ],
    composition:
      'ConnectedScatter\n  svg role=group\n    g（刻度线与轴名）\n    g role=group（一条轨迹：折线 · 终点箭头 · 各点 circle role=img）\n  ul（图例）\n  output（读数行）',
    keys: [
      ['← / →', '沿时间在同一条轨迹的点上走，到头不绕回'],
      ['↑ / ↓', '去上一条 / 下一条轨迹的同一位置（不够长落在最后一个点）'],
      ['Home / End', '去这条轨迹的第一个 / 最后一个点'],
    ],
  },
  {
    id: 'param-scatter',
    group: 'quant',
    cardHeight: 800,
    title: 'ParamScatter 参数优化散点图',
    summary:
      '参数扫描的结果图：两个参数为横纵轴，一个点是一组参数，颜色是目标值（夏普、净利润……），点选看这组参数的读数，最优点加琥珀环并有「跳到最优」。颜色：目标值跨过 0 用涨跌发散阶（中灰为中点，负跌色、正涨色），否则用暗灰到亮灰的单色阶，都不用橙与蓝。没有结果的点（如约束不成立）画空心灰点。TradingView 没有这张图，照通用的参数扫描做法；数据是固定种子合成的演示数据。',
    exports: ['ParamScatter', 'valueRange', 'resolveRamp', 'rampPosition', 'rampColor', 'bestIndex', 'moveParam'],
    props: [
      {
        part: 'ParamScatter',
        note: '文字全由 props 传。每个点是 role=button 的圆，读屏名是整句（两个参数、目标值，最优再加一句）；图右上有表格视图、导出、全屏三件（表格视图总有）。',
        rows: [
          {
            name: 'points',
            type: 'ParamPoint[]',
            desc: '{ id, x, y, value }；value 是目标值，没跑出结果传 null。',
          },
          { name: 'label', type: 'string', desc: '整张图的读屏名。' },
          { name: 'axes', type: '{ x: string; y: string }', desc: '两个参数的名字。' },
          { name: 'valueName', type: 'string', desc: '目标值叫什么（色条、读数）。' },
          {
            name: 'formatX / formatY / formatValue',
            type: '(value: number) => string',
            default: 'String',
            desc: '刻度与读数怎么写。',
          },
          {
            name: 'goal',
            type: "'max' | 'min'",
            default: 'max',
            desc: '目标值越大越好还是越小越好，决定哪个点是最优。',
          },
          {
            name: 'ramp',
            type: "'auto' | 'sequential' | 'diverging'",
            default: 'auto',
            desc: '色阶；auto 在目标值跨过 0 时用发散阶。',
          },
          {
            name: 'bestLabel / jumpLabel / noValue / idle',
            type: 'string | ReactNode',
            desc: '「最优」「跳到最优」「没有结果」与没选点时读数区的字。',
          },
          { name: 'selected / onSelect', type: 'string | null', desc: '选中点的 id；不给 selected 用内部状态。' },
          { name: 'extra', type: '(point) => ReactNode', desc: '选中后读数里多加什么（这组参数的其他指标）。' },
          {
            name: 'actionLabels / tableLabel / tableHead / source / onExport / onFullscreen',
            type: 'ChartViewProps',
            desc: '同其他图：三个图工具的名字、表格视图的读屏名与表头、来源一行、导出与全屏的回调。',
          },
        ],
      },
    ],
    states: [
      '点按目标值着色；最优点琥珀环，选中点白环加粗，悬停与聚焦描白边。',
      '点选后读数区写两个参数与目标值；选中的就是最优时再标「最优」。',
      '没有选点时读数区写 idle；没有有效的目标值时不画色条。',
    ],
    donts: [
      '不要只靠颜色分高低：读数区与表格视图里都有数。',
      '不要把它当时间序列用：连线与时间顺序用 ConnectedScatter。',
      '不要超过几千个点：每个点是一个 SVG 圆，更多的点请先在调用方聚合。',
    ],
    composition:
      'ParamScatter\n  图右上三件（表格视图 · 导出 · 全屏）\n  svg role=group\n    g（刻度线与轴名）\n    circle role=button × 点\n  色条（目标值名 · 最小值 · 渐变 · 最大值）\n  output（选中点的读数）\n  「跳到最优」按钮',
    keys: [
      ['Tab', '进图，停在一个点上'],
      ['方向键', '到该方向最近的点'],
      ['Home / End', '到最左 / 最右的点'],
      ['Enter / 空格', '选中当前点'],
      ['Esc', '取消选中'],
    ],
  },
  {
    id: 'flow-sankey',
    group: 'quant',
    cardHeight: 640,
    title: 'FlowSankey 资金流向桑基图',
    summary:
      '资金从来源（央行、银行信贷、财政、海外……）经通道到用途（偿债、消费、投资、资产配置）再到受益方的桑基图，节点与流量由调用方给，列由节点的 column 定。悬停节点或链路出 LCD 读数：金额、占来源流出、占总量；点节点（或聚焦后 Enter / 空格）钉住它的全部上游与下游，其余压暗，再点或 Esc 取消。「交易流量」与「价格重估」分开：交易流量是实色带，价格重估（估值变了、没有资金移动）是斜纹带，占比与总量只算交易流量，右上有开关可以把重估整条拿掉；图例分开写。链路与节点是中性灰，不用橙与蓝，节点想着色由调用方给 color。排布用 d3-sankey 0.12.3（BSD-3-Clause，见 NOTICE），有环时不画、写 labels.cycle（先把回流拆成另一个节点）。需求稿是 issue #45，没有读到可对照的参照产品页面，待核对；演示数据全部虚构。',
    exports: ['FlowSankey', 'layoutFlow', 'linkEnds', 'moveNode', 'neighborhood'],
    props: [
      {
        part: 'FlowSankey',
        note: '文字全由 props 传。图是 viewBox 960 宽的 svg，随容器缩放；每个节点是 role=button 的矩形，读屏名带流入与流出；图右上有表格视图、导出、全屏三件（表格视图总有，表里每条链路一行）。',
        rows: [
          {
            name: 'nodes',
            type: 'FlowNode[]',
            desc: '{ id, label, column?, color? }。column 全给才按它分列（从 0 起），否则由链路深度定；没有任何链路的节点不画。',
          },
          {
            name: 'links',
            type: 'FlowLink[]',
            desc: '{ id?, source, target, value, kind?: flow | revaluation, note? }。value 不是正数或指向不存在节点的链路丢掉。kind 默认 flow。',
          },
          {
            name: 'labels',
            type: 'FlowSankeyLabels',
            desc: '全部文字：读屏名、两种链路的名字、读数行名、开关、空态与有环的提示。',
          },
          { name: 'columnLabels', type: 'string[]', desc: '每一列顶上的标题；不给不画。' },
          {
            name: 'formatValue / formatShare',
            type: '(number) => string',
            desc: '金额（含单位）与占比（0.25）怎么写；占比默认一位小数的百分数。',
          },
          { name: 'height', type: 'number', default: '420', desc: '图高（viewBox 单位）。' },
          { name: 'badge', type: 'ReactNode', desc: '图例行右端的小标，如「演示数据」。' },
          {
            name: 'actionLabels / tableLabel / tableHead / source / onExport / onFullscreen',
            type: 'ChartViewProps',
            desc: '同其他图：三个图工具的名字、表格视图的读屏名与表头（五列：链路、类型、金额、占来源流出、占总量）、来源一行、导出与全屏的回调。',
          },
        ],
      },
      {
        part: 'layoutFlow(nodes, links, options)',
        note: '节点与链路 → 排布、占比、总量的纯函数（总量是没有交易流入的节点的交易流出之和）；返回 { ok: true, nodes, links, total, dropped, columns } 或 { ok: false, reason: empty | cycle }。',
        rows: [],
      },
    ],
    states: [
      '没有选中：全部链路与节点正常亮度；悬停节点时它的上下游亮、其余压暗；悬停链路时只亮它与两端。',
      '钉住节点后离开也保持高亮，直到再点同一个节点、点空白或按 Esc。',
      '价格重估链路是斜纹，不进占比与总量；关掉开关后它整条不参与排布，图上只剩交易流量。',
      '没有可画的链路写 labels.empty；有环写 labels.cycle，不抛错。',
    ],
    donts: [
      '不要把价格重估写成 kind: flow：它没有资金移动，会混进占比。',
      '不要传环（A→B→A）：资金回流请记成另一个节点（例如「回流」）。',
      '不要在件里写文字、也不要把演示数据当真实资金流向。',
    ],
    composition:
      'FlowSankey\n  Switch（显示价格重估）· 图右上三件（表格视图 · 导出 · 全屏）\n  svg role=group\n    pattern（斜纹）\n    path × 链路\n    rect role=button × 节点 · text 标签\n  LcdTooltip（悬停读数）\n  图例（交易流量 · 价格重估 · 小标）',
    keys: [
      ['Tab', '进图，停在一个节点上'],
      ['↑ / ↓', '同一列里上一个 / 下一个节点'],
      ['← / →', '去连着的上一列 / 下一列里纵向最近的节点'],
      ['Home / End', '第一个 / 最后一个节点'],
      ['Enter / 空格', '钉住或取消钉住这个节点的上下游'],
      ['Esc', '取消钉住'],
    ],
  },
  {
    id: 'vintage-series',
    group: 'quant',
    cardHeight: 760,
    title: 'VintageSeries 按发布时间的宏观序列',
    summary:
      '宏观序列按发布时间（point-in-time）画，避免把后来修订的数当成当时已知（框架第十节的要求）。横轴是统计期，同一期有一串发布值（首次发布、每次修订）：一条实线是「当时已知值」（默认每期的首次发布值；给 asOf 就是截至那一刻已知的最后一次发布，那时还没发布的期不画），一条灰虚线是「最新修订值」，上面一排分段按钮切「当时已知值 / 最新修订值 / 两条都看」。每次发布画一个点（空心是当时已知，灰点是最新，更小的是中间的修订），同一期的点之间连细竖线，线长就是修订幅度；下面一条小图画每期修订了多少（最新 − 首次，涨跌发散阶，没修订过的期不画）。顶上四个读数：修订过的期数、平均绝对修订、平均修订方向（正是后来普遍上修）、最大一次。坐标、网格、十字线与 LCD 读数复用 SeriesExplorer 的那套，键位同它。演示数据是固定种子合成的虚构月度同比，页上与小标都写明。',
    exports: ['VintageSeries', 'normalizeVintages', 'knownAt', 'knownValue', 'revisionStats', 'vintageExtent'],
    props: [
      {
        part: 'VintageSeries',
        note: '文字与格式全由 props 传，件不认识任何统计口径。主图高 chartHeight，下面修订小图固定 64px；统计期不超过 72 个时才画发布点，更多只留线与修订竖线。',
        rows: [
          {
            name: 'observations',
            type: 'VintageObservation[]',
            desc: '{ period, releases: { at, value, note? }[] }。period 是统计期（毫秒，UTC），at 是这个值发布的时刻；不用排序，件整理（同一期给两次会合并，非有限数丢掉）。',
          },
          {
            name: 'labels',
            type: 'VintageSeriesLabels',
            desc: '全部文字：读屏名、三个切换项、修订小图名、读数行名、四个读数名、空态。',
          },
          {
            name: 'formatPeriod / formatAt',
            type: '(ms) => string',
            desc: '统计期与发布时刻怎么写；时区与语言由调用方定。',
          },
          { name: 'formatValue / formatDelta', type: '(number) => string', desc: '值与带正负号的变化怎么写。' },
          {
            name: 'asOf',
            type: 'number',
            desc: '「当时已知」取截至这一刻的最后一次发布；不给取每期首次发布值。「最新修订值」不受它影响（它就是事后看到的）。',
          },
          { name: 'defaultMode', type: "'known' | 'latest' | 'both'", default: 'both', desc: '起始看哪条线。' },
          {
            name: 'chartHeight / badge',
            type: 'number / string',
            default: '220',
            desc: '主图高（px）；右上小标，如「演示数据」。',
          },
          {
            name: 'actionLabels / tableLabel / tableHead / source / onExport / onFullscreen',
            type: 'ChartViewProps',
            desc: '同其他图；表格视图每次发布一行（五列：统计期、发布时刻、值、较上次、较首次）。',
          },
        ],
      },
      {
        part: 'normalizeVintages / knownAt / knownValue / revisionStats',
        note: '整理发布值、取某一刻已知的值、统计修订的纯函数；调用方想在别处出同样的数可以直接调。只发布过一次的期修订是 null，不写成 0。',
        rows: [],
      },
    ],
    states: [
      '只发布过一次的期：只有一个点，没有修订竖线，修订小图里没有它的柱。',
      '给了 asOf：那一刻还没发布的期，「当时已知」线在那里断开，读数里写 labels.notYet。',
      '修订小图：最新高于首次是涨色柱、低于是跌色柱，零线以上以下对称不拉伸；没有任何修订时是一条零线。',
      '没有数据写 labels.empty。',
    ],
    donts: [
      '不要把「最新修订值」当成当时已知拿去回测或写成当时的判断：那是偷看未来。',
      '不要只传最新值：件要的是每次发布的值与发布时刻。',
      '不要把演示数据当真实统计。',
    ],
    composition:
      'VintageSeries\n  ToggleGroup（当时已知值 / 最新修订值 / 两条都看）· 小标 · 图右上三件\n  dl（四个修订读数）\n  role=slider 的图\n    主图 svg（网格 · 修订竖线 · 两条线）· 纵轴刻度 · 发布点（HTML 小点）· 十字线 · LcdTooltip\n    修订小图 svg（零线 · 柱）\n  横轴 · 图例',
    keys: [
      ['← / →', '逐期走，十字线与读数跟着'],
      ['Shift + ← / →', '一次走三期'],
      ['Home / End', '第一期 / 最后一期'],
      ['Esc', '清掉十字线'],
    ],
  },
  {
    id: 'symbol-galaxy',
    group: 'blocks',
    cardHeight: 807,
    title: 'SymbolGalaxy 品种星系',
    summary:
      '持仓、自选、筛选结果按行业、市场、因子分位或状态聚成一团团的圆：面积是市值或仓位，圆面用发散色 div-*：正负各两档，-200 只给涨跌幅绝对值在前 20% 的点，中点灰，涨跌色不上面积；团名放在团的外接圆上方的留白里。上面一排切换分组方式，点在团间平滑迁移；悬停读详情，点击选中；Tab 在团间走、方向键在团内走。点多时自动改画 canvas。布局用 d3-hierarchy 的 pack，同样的数据永远同样的位置。功能参照 Arc Customer galaxy，实现原创。',
    exports: ['SymbolGalaxy', 'layoutGalaxy', 'hitNode', 'stepNode'],
    props: [
      {
        part: 'SymbolGalaxy',
        note: '文字全由 props 传：团名取自每个点 groups 里的值，一个点与一团的整句在 describe 与 groupText 里，包里没有文案。每团是一个 Tab 停靠点（role=group）；SVG 与 canvas 两种画法的键盘与读屏一样（团的圈、标签与标记都是 SVG）。',
        rows: [
          {
            name: 'nodes',
            type: 'GalaxyNode[]',
            desc: '{ id, label, size, change, groups: { 分组方式 id: 团名 } }；size 不是正的有限数的点不画；change 是涨跌幅（小数），null 用中性色。',
          },
          { name: 'groupings', type: '{ id, label }[]', desc: '可切换的分组方式，每个点的 groups 里要有这些 id。' },
          {
            name: 'groupBy / defaultGroupBy / onGroupByChange',
            type: 'string',
            desc: '当前分组方式；不给 groupBy 就是不受控。',
          },
          { name: 'label / groupingLabel', type: 'string', desc: '整张图与分组开关的读屏名（必填）。' },
          { name: 'describe', type: '(node) => string', desc: '一个点的整句详情（读数行）。' },
          { name: 'groupText', type: '(group, count) => string', desc: '一团的读屏名，含个数。' },
          { name: 'legendText', type: '(step: number) => string', desc: '色例每一档（-2 到 +2）写的字。' },
          {
            name: 'tooltip',
            type: '(node) => { title, rows }',
            desc: '悬停时的 LCD 提示（标题与「名字 / 数值」几行）；不给就只有读数行。涨跌色只许上数字。',
          },
          {
            name: 'onSelect / selectedId',
            type: '(node) => void / string | null',
            desc: '点击或 Enter 选中；selectedId 画一圈强调色的标记。',
          },
          {
            name: 'canvasFrom',
            type: 'number',
            default: '2000',
            desc: '点数达到它就改画 canvas。2000 出自 issue #1918 的设想，没有实测依据，待测量（测量票 #1923）。',
          },
          { name: 'idle', type: 'ReactNode', desc: '没有悬停也没有聚焦时读数行写什么。' },
        ],
      },
      {
        part: 'layoutGalaxy(nodes, groupBy, frame) / hitNode / stepNode',
        note: '布局：先按团做圆堆积、团内的点也按大小做圆堆积（输入按大小与 id 定序，不用随机），返回各团的圆与每个点的位置；hitNode 找包含某个坐标的最小的圆；stepNode 在一团里按方向键挑最近的点。',
        rows: [],
      },
    ],
    states: [
      '默认：一团一个虚线圈，圈上方写团名，圈里是各点的圆，面积跟大小成正比。',
      '悬停一个点：描一圈，读数行写它的详情；点击选中后留一圈强调色。',
      '切换分组方式：点在团间平滑迁移（SVG 用 CSS 过渡，canvas 自己插值，时长同 --dur-snappy）。',
      '点数达到 canvasFrom：点改画在 canvas 上，团的圈、标签与标记仍是 SVG。',
      '键盘聚焦一团：圈加粗成焦点环，团内当前点描一圈，读数行写它的详情。',
    ],
    donts: [
      '不要拿它比精确的数：面积与位置只给一个大概，要读数看读数行或表格。',
      '不要放没有分组意义的数据：分组方式切到只有一团时它就是一个普通的圆堆。',
      '不要把 canvasFrom 调得很大还指望流畅：SVG 每点一个节点，点多了迁移会卡。',
    ],
    composition:
      'SymbolGalaxy\n  ToggleGroup（分组方式）\n  div\n    canvas（点多时，aria-hidden）\n    svg role=group\n      circle（一个点，SVG 画法）\n      g role=group tabindex=0（一团：圈 · 团名）\n      circle（选中 / 键盘 / 悬停的标记）\n  ol（色例，七档）\n  output（读数行）',
    keys: [
      ['Tab', '在团间走（每团一个停靠点）'],
      ['← ↑ ↓ →', '在团内跳到那个方向最近的点，那一侧没有点就不动'],
      ['Enter / Space', '给了 onSelect 时选中团内当前点'],
    ],
  },
  {
    id: 'textarea',
    group: 'forms',
    cardHeight: 150,
    title: 'Textarea 多行输入',
    summary:
      '多行文本框：与 Input 同一套皮肤（4% 白底 7% 白边，聚焦边提亮），默认三行高，竖向可拖。改自 SmoothUI（MIT）。',
    exports: ['Textarea'],
    propParts: [{ part: 'Textarea', note: '其余属性透传给原生 textarea。' }],
    states: ['默认、有值、禁用。', 'aria-invalid 时边框变危险色。', '焦点：边框提亮，焦点环画在里面。'],
    donts: ['单行文字用 Input。', '不要不带 label 就放出去。'],
    composition: 'Textarea',
    keys: [['Tab', '聚焦；聚焦时边框提亮']],
  },
  {
    id: 'radio-group',
    group: 'forms',
    cardHeight: 150,
    title: 'RadioGroup 单选',
    summary:
      '一组互斥的单选钮：14px 凹陷圆框，选中后框换亮中性，中心一颗深色点从小弹到位。方向键在选项间移动并选中。改自 SmoothUI（MIT）。',
    exports: ['RadioGroup', 'RadioGroupItem'],
    propParts: [
      { part: 'RadioGroup', note: '其余属性透传给 Radix RadioGroup.Root。' },
      { part: 'RadioGroupItem', note: '其余属性透传给 Radix RadioGroup.Item；文字用 Label 包在外面。' },
    ],
    states: [
      '未选、已选、禁用、禁用已选。',
      '错误（aria-invalid）：框变危险色。',
      '竖排（默认）与横排（orientation=horizontal）。',
    ],
    donts: ['选项不超过五个才用；更多换 Select。', '只在两三个选项里切换的工具条，用 ToggleGroup。'],
    composition: 'RadioGroup\n  RadioGroupItem\n  Label',
    keys: [
      ['Tab', '聚焦到选中项（没有选中项就到第一项）'],
      ['↑ ↓ ← →', '移到上一项或下一项并选中'],
      ['Space', '选中当前项'],
    ],
  },
  {
    id: 'toggle',
    group: 'forms',
    cardHeight: 66,
    title: 'Toggle 开关按钮',
    summary:
      '单个按下即开的按钮（aria-pressed）：外形是 Button，开时换分段选中的底与字；按下缩到 0.97。改自 SmoothUI（MIT）。',
    exports: ['Toggle'],
    propParts: [{ part: 'Toggle', note: '其余属性透传给 Radix Toggle.Root。' }],
    states: [
      '关、开、禁用关、禁用开。',
      'md（默认）30 高，sm 是 26 高，icon 是 28 见方；旧名 size="default" 等于 md。',
    ],
    donts: ['互斥的几项用 ToggleGroup。', '设置页里的开关用 Switch。'],
    composition: 'Toggle',
    keys: [
      ['Tab', '聚焦'],
      ['Space / Enter', '翻转'],
    ],
  },
  {
    id: 'checkbox-group',
    group: 'forms',
    cardHeight: 150,
    title: 'CheckboxGroup 勾选组',
    summary: '一组勾选框，值是被选项的数组；带「全选」父项，部分选中时父项半选。改自 SmoothUI（MIT）。',
    exports: ['CheckboxGroup', 'CheckboxGroupItem'],
    propParts: [
      { part: 'CheckboxGroup', note: '其余属性透传给 div（role=group）；读屏名用 aria-label。' },
      { part: 'CheckboxGroupItem' },
    ],
    states: ['未选、已选、禁用项。', '父项：全未选、部分选中（半选）、全选。'],
    donts: ['只有一个勾选框不要包组。', '「全选」要把所有子项的值传给 allValues，组不会自己扫 children。'],
    composition: 'CheckboxGroup\n  CheckboxGroupItem（parent）\n  CheckboxGroupItem',
    keys: [
      ['Tab', '在每个勾选框间走'],
      ['Space', '翻转当前项；在父项上全选或清空'],
    ],
  },
  {
    id: 'input-group',
    group: 'forms',
    cardHeight: 150,
    title: 'InputGroup 输入框组',
    summary:
      '一个外框包住输入框与前后附件（图标、币种、单位、按钮），里面的 Input 去掉自己的边与底；焦点环画在外框里。改自 SmoothUI（MIT）。',
    exports: ['InputGroup', 'InputGroupAddon', 'InputGroupText'],
    propParts: [
      { part: 'InputGroup', note: '其余属性透传给 div（role=group）。' },
      { part: 'InputGroupAddon', note: '其余属性透传给 div。' },
      { part: 'InputGroupText', note: '其余属性透传给 span。' },
    ],
    states: ['默认、聚焦（外框边提亮并画焦点环）、禁用、里面的 Input aria-invalid（外框变危险色）。'],
    donts: ['附件里的按钮必须有 aria-label。', '只要一个单位后缀的数字框用 NumberInput 的 unit。'],
    composition: 'InputGroup\n  InputGroupAddon（start）\n    InputGroupText\n  Input\n  InputGroupAddon（end）',
    keys: [['Tab', '聚焦输入框，再到附件里的按钮']],
  },
  {
    id: 'otp-field',
    group: 'forms',
    cardHeight: 190,
    title: 'OtpField 验证码输入',
    summary:
      '一次性验证码输入（交易二次验证、短信码）：每格一个字，当前格的外框用弹簧滑到下一格，字翻进来，空格里一根闪的光标。一个透明的真输入框接键盘、粘贴与自动填充。改自 SmoothUI（MIT）。',
    exports: ['OtpField'],
    propParts: [{ part: 'OtpField', note: '其余属性透传给里面真正的 input。' }],
    states: [
      '空：第一格显示光标；输入：字翻进格里，外框滑到下一格；填满：触发 onComplete。',
      'mask：格里显示圆点。groupSize：分组之间留一道间隔。',
      '错误（invalid）：格与外框变危险色，aria-invalid。禁用：降到 45%。',
    ],
    donts: [
      '不要拿它收不定长的口令，长度固定才用。',
      '它只在末尾输入与退格，不做格间方向键；输错了退格重来。',
      '读屏名（aria-label）必须传，格子本身对读屏隐藏。',
    ],
    composition: 'OtpField\n  span（格子 × length，aria-hidden）\n  span（当前格的外框）\n  input（透明，真正的输入）',
    keys: [
      ['Tab', '聚焦'],
      ['0-9', '输入一位（pattern=alphanumeric 时字母也行）'],
      ['Backspace', '删最后一位'],
      ['Ctrl/⌘ + V', '粘贴整串，超出长度的截掉'],
    ],
  },
  {
    id: 'morph-toggle',
    group: 'forms',
    cardHeight: 150,
    title: 'MorphToggle 变形开关',
    summary:
      '带仪式感的单个开关：圆钮滑动时形状跟着变（方块变圆），或钮里两个图标转着换。底座是 Radix Switch，尺寸与颜色同 Switch。改自 SmoothUI（MIT）。',
    exports: ['MorphToggle'],
    propParts: [{ part: 'MorphToggle', note: '其余属性透传给 Radix Switch.Root。' }],
    states: [
      'plain、morph、icon 三种变体 × 关、开。',
      'md（默认，与 Switch 同大）；lg 尺寸给带图标的圆钮；旧名 size="default" 等于 md。',
      '禁用降到 45%。',
    ],
    donts: ['设置页里成排的开关用 Switch，别都换成它。', 'icon 变体的两个图标要一眼分得清开与关。'],
    composition: 'MorphToggle\n  span（轨道）\n    motion.span（圆钮）\n      图标（icon 变体）',
    keys: [
      ['Tab', '聚焦'],
      ['Space / Enter', '翻转'],
    ],
  },
  {
    id: 'morph-icon',
    group: 'motion',
    cardHeight: 120,
    title: 'MorphIcon 变形图标',
    summary:
      '图标的线条与形状在两个状态间补间：侧栏收展、列表与网格、菜单与叉、搜索放大、播放与停止、勾选方块。改自 SmoothUI（MIT）。',
    exports: ['MorphIcon', 'MORPH_ICON_VARIANTS'],
    propParts: [
      { part: 'MorphIcon' },
      {
        part: 'MORPH_ICON_VARIANTS',
        note: '八个字形名的只读数组：sidebar、list、grid、compact、menu、search、play、check。',
      },
    ],
    states: ['active 为假：第一个形状；为真：线条补间到第二个形状（时长 duration，默认 0.3 秒）。'],
    donts: [
      '不要拿它做纯装饰的循环动画，它只在状态变化时动。',
      '图标放在按钮里时，名字写在按钮上，图标不要再传 label。',
    ],
    composition: 'MorphIcon\n  svg\n    motion 线条 / 矩形 / 路径',
    keys: [],
  },
  {
    id: 'swap-panel',
    group: 'blocks',
    cardHeight: 460,
    title: 'SwapPanel 兑换面板',
    summary:
      '付出一栏（输入、余额、Max）、收到一栏（报价算出的数额，换了会往上滚；报价中扫光）、中间翻转钮、报价明细（汇率、费用、影响、滑点，有效期画成倒计时圆环）与提交钮。文案全走 labels。改自 SmoothUI（MIT）。',
    exports: ['SwapPanel'],
    propParts: [{ part: 'SwapPanel' }],
    states: [
      'idle / ready：显示报价明细，提交钮可点。',
      'quoting：收到栏扫光，提交钮禁用。',
      'submitting：提交钮写 submitting 的文字并禁用。',
      'error：error 文字显示在报价下面（role=alert），提交钮写 retry 的文字。',
    ],
    donts: [
      '报价要有时效：给 expiresAt，过期由调用方重新取价，面板不自己续。',
      '数额不超过精度时再提交，校验与下单在调用方。',
      '要两个以上币对的列表用 QuoteTable，这个件只做一对。',
    ],
    composition:
      'SwapPanel\n  label · input · AssetChip（Button）\n  Button（翻转）\n  RollingFigure · AssetChip\n  CountdownRing · 报价明细\n  Button（提交）',
    keys: [
      ['Tab', '输入、币种钮、Max、翻转、提交，依次走'],
      ['Enter', '在币种钮、翻转、提交上触发'],
    ],
  },
  {
    id: 'text-reveal',
    group: 'motion',
    cardHeight: 520,
    title: 'TextReveal 文字进场',
    summary:
      '文字一块一块进场：整段、按行、按词或按字，从上下左右某一侧来，可带一点模糊与缩放，按顺序、从中间向外或从两头向中间错峰。SmoothUI 的 17 个文字进场原件（blur-out-up、bottom-up-letters、per-word-crossfade、soft-blur-in、stagger-from-center、mask-reveal-up 等）是同一个机制的不同参数，这里合成一个件：preset 取原件的参数，再改任一项就是自己的变体。新闻标题进场、结论句出现都用它。',
    exports: ['TextReveal', 'TEXT_REVEAL_PRESETS', 'TEXT_REVEAL_EASES'],
    propParts: [
      {
        part: 'TextReveal',
        note: '读屏读完整的句子（sr-only 副本），逐块的字是 aria-hidden。by="all" 时整段就是一块，不拆。',
      },
      {
        part: 'TEXT_REVEAL_PRESETS',
        note: '17 个原件的参数表，键是原件名（短横线小写）；值只有时长、位移、模糊、缩放这些数，直接来自原件。',
      },
      {
        part: 'TEXT_REVEAL_EASES',
        note: '原件用到的六条三次贝塞尔缓动：out、steep、tv、calm、soft、overshoot（过冲）。',
      },
    ],
    states: [
      '进场前：每块透明，按 from 偏到一侧，带 blur 与 scale 的起点。',
      '播放中：每块按 stagger 与 order 的次序到位，到位后不再动。',
      'triggerOnView 且还没滚进视口：保持进场前的样子，进视口才播。',
      'replayKey 变了：从头再播一遍。',
    ],
    donts: [
      '不要给整页的表格或长段落按字进场：按字适合 40px 以上的短标题，长文用 by="word" 或 by="line"。',
      '不要在行情刷新时反复用：它是出现一次的进场，数据变化用 TextMorph 或 RollingText。',
    ],
    composition: 'TextReveal\n  span.sr-only（整句）\n  motion.span（逐块，aria-hidden）',
    keys: [],
  },
  {
    id: 'text-swap',
    group: 'motion',
    cardHeight: 430,
    title: 'TextSwap 文字换句',
    summary:
      '一句话换成下一句：旧的出、新的进。fade-through（Material 淡入淡出）、axis-x（向左滑出、从右滑入）、axis-z（缩放与景深）、word-cut（逐词硬切的阶梯）、slide-right（整句从左滑入、词依次显现）五种换法，对应 SmoothUI 的 fade-through、shared-axis-x/y/z、short-slide-right。自己轮播，或给 index 由外面控制（切换视图时让标签跟着换）。',
    exports: ['TextSwap'],
    propParts: [{ part: 'TextSwap', note: '外层是 aria-live=polite，换句时读屏播报新句。给了 index 就不再自己轮播。' }],
    states: [
      '没给 index：每 interval 毫秒换到下一句，循环。',
      '给了 index：只跟着 index 换，interval 不起作用。',
      'interval 为 0 或只有一句：不换。',
    ],
    donts: [
      '不要用它显示价格这类每秒都在变的数字：aria-live 会不停播报，数字用 RollingText 或 TextMorph。',
      '不要放很长的句子：换句期间会按最宽的一句撑开，长短差得多时版面会跳。',
    ],
    composition: 'TextSwap\n  AnimatePresence\n    motion.span（当前这一句，按 key 换）',
    keys: [],
  },
  {
    id: 'word-build',
    group: 'motion',
    cardHeight: 220,
    title: 'WordBuild 逐词搭句',
    summary:
      '一句话一个词一个词地搭起来，停一会儿，整句退场，再搭下一句。from="right" 是新词从右边进来、把一行推到居中（SmoothUI kinetic-center-build）；from="top" 是新词从上方落下、叠成一列（short-slide-down）。适合一句话的市场摘要、AI 的一行结论。',
    exports: ['WordBuild'],
    propParts: [{ part: 'WordBuild', note: '外层是 aria-live=polite；读屏读到的是已经出现的词。' }],
    states: [
      '搭建中：每隔 wordInterval 毫秒多出一个词。',
      '搭好：停 hold 毫秒。',
      '退场：整句淡出并略位移，然后换下一句；只有一句时搭好就停住。',
    ],
    donts: ['不要用来显示需要一眼读完的关键数据：词是慢慢出现的，读完整句要等。'],
    composition: 'WordBuild\n  AnimatePresence\n    motion.span（一个词）',
    keys: [],
  },
  {
    id: 'typewriter-text',
    group: 'motion',
    cardHeight: 200,
    title: 'TypewriterText 打字机',
    summary:
      '一个字一个字地打出来，可以带光标、循环。文字变长（新文字以已打出的部分开头）时接着往下打，不从头重来，所以流式追加的 AI 回复和交易建议可以直接把累积的文字传进来。读屏读完整的句子，不读打到一半的字。',
    exports: ['TypewriterText'],
    propParts: [
      { part: 'TypewriterText', note: '整句放在 sr-only 里，打字的过程是 aria-hidden，读屏不会读到半句话。' },
    ],
    states: [
      '打字中：根上有 data-typing。',
      '打完：触发一次 onComplete（循环时不触发）；loop 为真则停 1 秒后重打。',
      '文字被换成别的（不是追加）：从头打。',
    ],
    donts: ['不要用它显示用户必须马上读到的告警：先出整句，再决定要不要动画。'],
    composition: 'TypewriterText\n  span.sr-only\n  span（已打出的字，aria-hidden）\n  span.k-tw-caret（caret 时）',
    keys: [],
  },
  {
    id: 'scramble-text',
    group: 'motion',
    cardHeight: 300,
    title: 'ScrambleText 乱码解码',
    summary:
      '文字先乱成随机字符再落回真字：trigger="hover" 在悬停或键盘聚焦时扰一次（SmoothUI scramble-hover）；trigger="change" 在文字变了时扰一次，代码、价格换了用它。数字只换成数字、字母只换成字母、标点不动，宽度跟着原字走；settle="left-to-right" 从左到右一位一位定下来，比整串一起定更好读。',
    exports: ['ScrambleText', 'scrambleFrame'],
    propParts: [
      {
        part: 'ScrambleText',
        note: '读屏读真实文字（sr-only），乱码是 aria-hidden；hover 只在有悬停的指针设备上生效。',
      },
      {
        part: 'scrambleFrame',
        note: '纯函数 (原文, 进度, settle, glyphs)：算某一刻的一帧乱码，进度越大 left-to-right 定下的位越多。',
      },
    ],
    states: [
      '静止：显示真文字。',
      '扰动中：根上有 data-scrambling，按 speed 一帧一帧换字符，duration 到了落回真字。',
      '悬停中途移开或失焦：立刻回到真字。',
    ],
    donts: [
      '不要在比例字体里扰数字：数字宽度不一样会晃，价格配等宽字体（--font-mono）。',
      '不要拿它当唯一的变化提示：涨跌另有颜色和符号。',
    ],
    composition: 'ScrambleText\n  span.sr-only\n  span（当前一帧，aria-hidden）',
    keys: [],
  },
  {
    id: 'text-morph',
    group: 'motion',
    cardHeight: 220,
    title: 'TextMorph 文字变形',
    summary:
      '把一串字变成另一串：按字（或词）对比，两边都有的沿用同一个 key、用布局动画滑到新位置，没了的缩着出去，新来的弹着进来。价格 106,977.4 变 107,011.0 时没变的位置不动；订单状态词整个换。',
    exports: ['TextMorph', 'morphTokens'],
    propParts: [
      { part: 'TextMorph', note: '完整文字放在 sr-only，逐字是 aria-hidden；根元素用 as 换成标题或段落。' },
      {
        part: 'morphTokens',
        note: '纯函数 (text, mode)：切成片并给 key，同一个字第二次出现是「字-1」，对比才能一一对上。',
      },
    ],
    states: ['文字没变：静止。', '文字变了：共有的字滑到新位置，多出的字弹入，没了的字缩出。'],
    donts: [
      '不要用在要逐位翻滚方向的数字上：涨跌方向的里程表式滚动用 RollingText。',
      '不要放整段正文：每个字一个动画节点，字多了会卡。',
    ],
    composition:
      'TextMorph\n  span.sr-only\n  motion.span（排列容器，layout）\n    motion.span（一个字或词，aria-hidden）',
    keys: [],
  },
  {
    id: 'shine-text',
    group: 'motion',
    cardHeight: 150,
    title: 'ShineText 流光文字',
    summary:
      '一道高光循环扫过文字：背景渐变裁进字形，再平移。AI 在分析、数据在加载这类「进行中」的文字用它；底色默认次要文字色，高光默认主文字色，都可传 token。',
    exports: ['ShineText'],
    propParts: [{ part: 'ShineText', note: '就是一个 span；文字对读屏照常可读。' }],
    states: ['一直循环：每次扫过 duration 秒，之间停 repeatDelay 秒。'],
    donts: ['不要给已经完成的状态用：流光表示「还在进行」，完成了就换成普通文字。'],
    composition: 'ShineText\n  motion.span（背景渐变裁到字形）',
    keys: [],
  },
  {
    id: 'wave-text',
    group: 'motion',
    cardHeight: 150,
    title: 'WaveText 波浪文字',
    summary:
      '每个字依次上下起伏，一道波在文字里循环走，表示「正在实时」。起伏高度、一个周期的时长、字与字的间隔都可调。',
    exports: ['WaveText'],
    propParts: [{ part: 'WaveText', note: '整句放在 sr-only，逐字是 aria-hidden。' }],
    states: ['一直循环，没有静止态。'],
    donts: ['不要放在密集的表格里：一整屏的字都在起伏会盖过数据本身。'],
    composition: 'WaveText\n  span.sr-only\n  motion.span（一个字，aria-hidden）',
    keys: [],
  },
  {
    id: 'scroll-reveal-paragraph',
    group: 'motion',
    cardHeight: 300,
    title: 'ScrollRevealParagraph 滚动逐词点亮',
    summary:
      '一段话随滚动一个词一个词地亮起来：每个词叠两层，底层是暗字，上层按滚动进度的一小段从 0 渐到 1。适合长篇研报摘要、说明页的导读。在某个滚动容器里滚时传 container。',
    exports: ['ScrollRevealParagraph'],
    propParts: [{ part: 'ScrollRevealParagraph', note: '整段放在 sr-only，读屏读到全文，与滚动位置无关。' }],
    states: ['还没滚到：全是暗字。', '滚动中：按进度从前往后逐词变亮。', '滚过：全文亮着。'],
    donts: ['不要用在需要一眼读完的重点：未点亮的暗字对比度低。'],
    composition: 'ScrollRevealParagraph\n  p\n    span.sr-only\n    span（一个词：暗字 + 亮字叠层，aria-hidden）',
    keys: [],
  },
  {
    id: 'kinetic-type-scroll',
    group: 'motion',
    cardHeight: 300,
    title: 'KineticTypeScroll 滚动波浪排版',
    summary:
      '随滚动，一道「波」从第一个词走到最后一个词：波峰上的词放大、拉开字距、上浮、变亮，过了就回落；字体是可变字体时还能随之变粗（给 weightRange）。标题与分段大字用。',
    exports: ['KineticTypeScroll'],
    propParts: [
      {
        part: 'KineticTypeScroll',
        note: '整句放在 sr-only，逐词是 aria-hidden。字重默认不动，给了 weightRange 才随波变化（需要可变字体）。',
      },
    ],
    states: [
      '没滚到：所有词在静止值（略小、略暗）。',
      '滚动中：波峰处的词到峰值，前后的词按距离过渡。',
      '滚过：回到静止值。',
    ],
    donts: ['不要用在正文：字距与大小在变，正文阅读会被打断。'],
    composition: 'KineticTypeScroll\n  div\n    span.sr-only\n    motion.span（一个词，aria-hidden）',
    keys: [],
  },
  {
    id: 'perspective-text-3d',
    group: 'motion',
    cardHeight: 300,
    title: 'PerspectiveText3D 景深文字',
    summary:
      '文字摆在一个 3D 平面上，词或行沿 Z 轴错开深度；整个平面随滚动进度、指针位置倾斜（driver），或固定一个角度。大标题的装饰。',
    exports: ['PerspectiveText3D', 'splitDepthSegments'],
    propParts: [
      { part: 'PerspectiveText3D', note: '整句放在 sr-only，各段是 aria-hidden；children 与 text 二选一。' },
      { part: 'splitDepthSegments', note: '纯函数 (内容, split)：按词或按换行切成要错开深度的段。' },
    ],
    states: [
      'static：固定倾斜 rotateX、rotateY。',
      'pointer：随指针在上面的位置倾斜，移开回正。',
      'scroll：随滚动进度在 ±rotate 之间倾斜。',
    ],
    donts: ['不要用在小字号或表格里：透视会让小字发虚。'],
    composition:
      'PerspectiveText3D\n  div（perspective）\n    span.sr-only\n    motion.div（preserve-3d，倾斜）\n      div（一段，translateZ，aria-hidden）',
    keys: [],
  },
  {
    id: 'gravity-letters',
    group: 'motion',
    cardHeight: 360,
    title: 'GravityLetters 重力掉字',
    summary:
      '文字的每个字被放开后受重力掉到容器底、弹几下、静下来；再触发就被弹簧拉回原位。物理（掉落与回位）是纯函数。用于空状态、熔断提示这类带一点玩笑的场合。',
    exports: ['GravityLetters'],
    propParts: [
      {
        part: 'GravityLetters',
        note: 'trigger 为 click 时根是 role=button，aria-pressed 表示是否已掉下；整句放在 sr-only。可以用 collapsed 受控。',
      },
    ],
    states: [
      '静止：字排在原位。',
      '掉落：按 stagger 一个个放开，落地后反弹、摩擦，静止。',
      '回位：弹簧把每个字拉回原位。',
    ],
    donts: ['不要用在需要读的警告上：字掉下去后就读不了了，警告用 Alert。'],
    composition:
      'GravityLetters\n  div（容器）\n    span.sr-only\n    div（隐藏的测量层）\n    div（可见层，每个字绝对定位）',
    keys: [
      ['Enter / Space', 'trigger 为 click 时掉下或收回'],
      ['Tab', 'hover 与 click 时可聚焦；hover 时聚焦即掉下，失焦收回'],
    ],
  },
  {
    id: 'ransom-note',
    group: 'motion',
    cardHeight: 220,
    title: 'RansomNote 剪报勒索信',
    summary:
      '文字像从报纸上剪下的纸片：每个字有自己的字体、底色、倾斜与大小，由种子决定（同种子同文字同排布）；可以飞进来拼好，或一直轻轻抖。纯装饰，与交易数据无关，给空状态和品牌页用；纸色与字体都取我们的 token。',
    exports: ['RansomNote', 'createSeededRandom', 'ransomScraps'],
    propParts: [
      { part: 'RansomNote', note: '整句放在 sr-only，纸片是 aria-hidden。' },
      { part: 'createSeededRandom', note: '纯函数 (seed)：返回一个同种子同序列的随机数函数（mulberry32）。' },
      {
        part: 'ransomScraps',
        note: '纯函数 (文字, 种子, 强度, 角度, 字体, 纸色)：算每张纸片的字体、底色、倾斜、大小与进场偏移。',
      },
    ],
    states: ['assemble：纸片从随机的位置与角度飞来拼好。', 'jitter：纸片在原位轻轻抖。', 'none：静止。'],
    donts: ['不要放数据或需要认真读的内容：纸片的字体和倾斜是故意不统一的。'],
    composition: 'RansomNote\n  div\n    span.sr-only\n    div（aria-hidden）\n      motion.span（一张纸片）',
    keys: [],
  },
  // ---- AI 组：对话、推理、工具调用、审批、来源（多数改自 SmoothUI，MIT） ----
  {
    id: 'ai-conversation',
    group: 'ai',
    cardHeight: 640,
    title: 'AiConversation 对话容器',
    summary:
      '对话的滚动容器：只在读者本来就贴着底部时才跟着往下，往上翻读东西时不拽人；不再跟时冒出「回到最新」药丸。页上是一整段交易助手的演示：问「600519 今天为什么跌」→ 推理 → 调工具 → 带来源的回答 → 一条减仓建议进审批。改自 SmoothUI。',
    exports: ['AiConversation'],
    propParts: [
      {
        part: 'AiConversation',
        note: 'role=log，读屏名取 label；contentKey 变了（消息数或流式文字长度）且读者在底部时跟随。',
      },
    ],
    states: [
      '贴着底部：内容长高时即时滚到底（不用平滑，平滑滚动途中会把「贴底」误判成「已离开」）。',
      '离开底部：冒出药丸，点击平滑滚回。',
    ],
    donts: ['不要在读者往上翻时把他拽回底部。', 'label 与 jumpLabel 必传。'],
    composition: 'AiConversation\n  div role=log（滚动区，可聚焦）\n  button（回到最新药丸，离底时出现）',
    keys: [
      ['Tab', '聚焦滚动区'],
      ['方向键 / PageUp / PageDown', '滚动'],
    ],
  },
  {
    id: 'ai-message',
    group: 'ai',
    cardHeight: 320,
    title: 'AiMessage 对话消息',
    summary:
      '一条消息：气泡加不碍事的动作（复制、重试、赞踩）。动作从气泡自己的边上滑出来，悬停与键盘聚焦都显出，始终挂着只是淡掉，所以行高不跳。助手自带卡片的回合关掉气泡。改自 SmoothUI。',
    exports: ['AiMessage'],
    propParts: [{ part: 'AiMessage', note: '动作按钮用我们的 Button 图标款；哪个动作有 labels 里的名字才画哪个。' }],
    states: [
      '用户 / 助手：气泡朝向与底色不同。',
      '悬停或聚焦：动作滑出；复制后图标换成对勾并弹一下。',
      '赞踩只在助手消息上。',
    ],
    donts: ['别给自己的消息画赞踩。', '助手回合里有推理、工具、diff 卡片时用 bubble={false}。'],
    composition: 'AiMessage\n  div（avatar）\n  div（气泡）\n  div（时间戳 + 动作按钮）',
    keys: [
      ['Tab', '进入消息后依次聚焦各动作（聚焦时动作显出）'],
      ['Enter / Space', '触发动作'],
    ],
  },
  {
    id: 'ai-response',
    group: 'ai',
    cardHeight: 180,
    title: 'AiResponse 流式回答',
    summary:
      '流式的助手文字：词到了才进场（淡入、去模糊、上移 2px），不是定时器逐字打；正文里的 [n] 换成行内引用小标，直接用 WebSearchCitation。切词用 Intl.Segmenter，中文也一词一词进。改自 SmoothUI。',
    exports: ['AiResponse'],
    propParts: [{ part: 'AiResponse', note: 'text 随流增长重新传入；citations 里没有的 [n] 保持普通文字。' }],
    states: [
      '流式中：末尾有明灭的光标。',
      '新来的词进场，已画出的词不再动。',
      '引用：悬停停一会儿或聚焦弹出站名、标题、摘要。',
    ],
    donts: [
      '不要自己用定时器切 text 来模拟打字：节奏要跟真实的流走。',
      'locale 不传时按页面语言切词，混排时建议显式传。',
    ],
    composition: 'AiResponse\n  p\n    span（词）\n    WebSearchCitation（引用小标）\n    span（光标）',
    keys: [['Tab', '聚焦行内引用，立即弹出预览']],
  },
  {
    id: 'ai-reasoning',
    group: 'ai',
    cardHeight: 230,
    title: 'AiReasoning 推理过程',
    summary:
      '可折叠的推理过程：摘要行只在模型真在想的时候有流光；结束后停一拍自动收起并报耗时。手动开合过就不再替你决定。改自 SmoothUI。',
    exports: ['AiReasoning'],
    propParts: [{ part: 'AiReasoning', note: 'labels 三条文案必传；duration 不给就自己计时。' }],
    states: ['流式中：展开，摘要流光。', '结束：停 600ms 后收起，摘要报耗时。', '手动开合后不再自动。'],
    donts: ['流光只给「还在干活」，不要常亮。', '要展示最终回答别放在这里，用 AiResponse。'],
    composition: 'AiReasoning\n  button（展开钮 + 摘要）\n  div（推理内容，左侧竖线）',
    keys: [['Enter / Space', '展开或收起']],
  },
  {
    id: 'ai-tool-call',
    group: 'ai',
    cardHeight: 360,
    title: 'AiToolCall 工具调用',
    summary:
      '一次工具调用，默认一行：名字、右侧小注、状态环。环是一个会变脸的东西：排队呼吸、运行缺一口并转、成功画对勾、失败画叉。参数与结果展开才看。改自 SmoothUI。',
    exports: ['AiToolCall'],
    propParts: [{ part: 'AiToolCall', note: 'args 与 result 是 ReactNode，原样渲染；都没有时整行不可展开。' }],
    states: [
      'pending 排队：环呼吸。',
      'running 运行：环缺一口并匀速转。',
      'success / error：环变绿 / 红并画出对勾 / 叉。',
    ],
    donts: ['状态读屏词在 labels.status，必传，别只靠颜色。', '长结果别塞进 summary，放 result。'],
    composition: 'AiToolCall\n  button（状态环 + 名字 + 小注 + 箭头）\n  div（参数 / 结果，展开时）',
    keys: [['Enter / Space', '展开或收起详情']],
  },
  {
    id: 'ai-diff',
    group: 'ai',
    cardHeight: 360,
    title: 'AiDiff 改动对比',
    summary:
      '一份等人点头的修改：新增行从左往右擦进来，上下文行不动；接受闪一下绿，拒绝闪一下红并把各行收到零高让出版面。交易里用来展示 AI 改了哪些策略参数。改自 SmoothUI。',
    exports: ['AiDiff'],
    propParts: [
      { part: 'AiDiff', note: '只有给了 onAccept / onReject 才画对应按钮；决定后按钮收起，状态词在 role=status 里。' },
    ],
    states: [
      '待决定：标题栏 +N -M，底部两个按钮。',
      '接受：绿色一闪，写「已接受」。',
      '拒绝：红色一闪，行收起，写「已拒绝」。',
    ],
    donts: ['别用它做长文件的行级审阅：它没有折叠与跳转。', '改动要真的落地，调用方在 onAccept 里做，组件只记录决定。'],
    composition:
      'AiDiff\n  div（标题 + 增删计数）\n  div role=list（行：行号 + 符号 + 内容）\n  div（拒绝 / 接受）\n  p role=status',
    keys: [
      ['Tab', '依次聚焦拒绝、接受'],
      ['Enter / Space', '触发'],
    ],
  },
  {
    id: 'ai-approval',
    group: 'ai',
    cardHeight: 620,
    title: 'AiApproval 审批卡',
    summary:
      'Agent 动手之前摆出来的一张卡：问题、事实表（标的、方向、数量、理由）、几个选项。选中不是勾单选钮：选中的一项展开铺满，其余收没。高风险动作（真的下单）的选项带 hold，画成 HoldToConfirm，按住填满才批。改自 SmoothUI，hold 是我们加的。',
    exports: ['AiApproval'],
    propParts: [
      {
        part: 'AiApproval',
        note: 'options 里 hold 有值的项画成「按住确认」；其余是普通按钮。facts 的 tone 读 --pnl-up / --pnl-down。',
      },
    ],
    states: [
      '待决定：事实表加选项，逐个错开进场。',
      '按住确认：底色从左填满，松手退回，填满才触发 onDecide。',
      '已决定：选中项铺满，其余收没；resolvedId 可直接画成已决定。',
    ],
    donts: [
      '下单、撤单、停策略这类不可撤的动作必须给 hold，不要一次点击就批。',
      '不要把被否的选项灰着留着。',
      '一次只决定一次：决定后不能再改。',
    ],
    composition:
      'AiApproval\n  p（问题）\n  dl（事实表）\n  div（理由）\n  div role=group\n    HoldToConfirm / Button（选项）\n    div role=status（已决定）',
    keys: [
      ['Tab', '依次聚焦各选项'],
      ['Enter / Space（按住）', 'hold 项：按住到填满才触发；单击与松开都不触发'],
      ['Enter / Space', '普通选项：触发'],
    ],
  },
  {
    id: 'ai-context-meter',
    group: 'ai',
    cardHeight: 220,
    title: 'AiContextMeter 上下文用量',
    summary:
      '上下文窗口用掉了多少：一个小环加「已用/总量」；越过 80% 变琥珀、越过 95% 变红，几何不变只换色相。悬停、聚焦或点按弹出分项（什么在占窗口）。改自 SmoothUI。',
    exports: ['AiContextMeter'],
    propParts: [
      { part: 'AiContextMeter', note: 'label 必传（读屏名，如「上下文已用 62%」）；有 breakdown 才可展开。' },
    ],
    states: ['常态：环与读数。', '越过 warningAt：环变琥珀；越过 dangerAt：变红。', '有分项：悬停、聚焦或点按弹出。'],
    donts: ['越线不要放大环：放大读成「进展不错」。', '没有分项数据就别给 breakdown，按钮会保持禁用。'],
    composition: 'AiContextMeter\n  button（环 + 读数）\n  div（分项，弹出时）',
    keys: [
      ['Tab', '聚焦，键盘聚焦时弹出分项'],
      ['Enter / Space', '切换分项'],
    ],
  },
  {
    id: 'ai-prompt-input',
    group: 'ai',
    cardHeight: 380,
    title: 'AiPromptInput 提示词输入框',
    summary:
      '多行自动长高（到 8 行封顶再滚）、回车发送、Shift+回车换行；流式中发送钮变停止；附件一排小标；字数到上限的 80% 才显示计数。中文输入法选词时的回车不发送。改自 SmoothUI。',
    exports: ['AiPromptInput'],
    propParts: [
      {
        part: 'AiPromptInput',
        note: 'label 与 labels.send / labels.stop 必传；state 为 streaming 时发送钮是停止，error / done 画一圈语义色。',
      },
    ],
    states: [
      '空：发送钮禁用。',
      'streaming：发送钮变停止（scale 与淡入淡出换字形）。',
      'error / done：边上一圈红 / 绿。',
      '附件：一排小标，可移除。',
    ],
    donts: ['别靠 placeholder 当读屏名：label 必传。', '不要在流式中禁用停止钮。'],
    composition: 'AiPromptInput\n  ul（附件）\n  textarea\n  div（附件钮 + children + 计数 + 发送钮）',
    keys: [
      ['Enter', '发送（输入法选词中的回车不发送）'],
      ['Shift + Enter', '换行'],
    ],
  },
  {
    id: 'ai-suggestions',
    group: 'ai',
    cardHeight: 170,
    title: 'AiSuggestions 提示词建议',
    summary:
      '提示词建议的药丸：对话的空态与回答后的追问一行。从中间向两边错开进场，因为这些是同等分量的备选，不是从左到右的优先级。改自 SmoothUI。',
    exports: ['AiSuggestions'],
    propParts: [{ part: 'AiSuggestions', note: '药丸是我们的 Button；换一组 suggestions 时旧的淡出、新的进场。' }],
    states: ['进场：中间先出，两边依次跟上。', '换组：旧的缩淡出，新的进场。'],
    donts: ['不要超过一行半，太多就失去「建议」的意思。', '选中后由调用方决定是否清掉这一排。'],
    composition: 'AiSuggestions\n  p（标题）\n  ul > li > Button',
    keys: [
      ['Tab', '依次聚焦'],
      ['Enter / Space', '选中'],
    ],
  },
  {
    id: 'ai-artifact',
    group: 'ai',
    cardHeight: 260,
    title: 'AiArtifact 产出框',
    summary:
      '模型产出的东西的框：标题、预览 / 代码两个视图、复制。两个视图沿同一条水平轴走，预览永远在代码左边，所以切换有方向；选中指示块是一个共享元素在页签间滑。改自 SmoothUI。',
    exports: ['AiArtifact'],
    propParts: [
      { part: 'AiArtifact', note: '只给 preview 或只给 code 时不画页签；copyText 与 labels.copy 都给了才画复制钮。' },
    ],
    states: ['预览 / 代码：内容横向挪 24px 淡入淡出。', '复制：图标换对勾约 1.6 秒。'],
    donts: ['两个视图内容要对得上：预览是代码的渲染结果。'],
    composition: 'AiArtifact\n  div（标题 + role=tablist + 复制钮）\n  div role=tabpanel（预览 / 代码）',
    keys: [
      ['← →', '在页签间移动并切换'],
      ['Tab', '页签、复制钮'],
    ],
  },
  {
    id: 'ai-branch',
    group: 'ai',
    cardHeight: 220,
    title: 'AiBranch 对话分支',
    summary:
      '同一个问题重答出的几个版本，用上一个 / 下一个翻，到头绕回；换分支时新的从下面淡入上来；只有一个版本时翻页条不画。复合件。改自 SmoothUI。',
    exports: ['AiBranch', 'AiBranchMessages', 'AiBranchNext', 'AiBranchPage', 'AiBranchPrevious', 'AiBranchSelector'],
    propParts: [
      { part: 'AiBranch', note: '容器，其余属性透传给 div。' },
      { part: 'AiBranchMessages', note: '每个子元素是一个分支；只渲染当前那个。' },
      { part: 'AiBranchSelector', note: 'from 指翻页条靠哪一侧；只有一个分支时不画。' },
      { part: 'AiBranchPrevious', note: 'label 必传，读屏名。' },
      { part: 'AiBranchNext', note: 'label 必传，读屏名。' },
      { part: 'AiBranchPage', note: 'format(位置, 总数) 写页码文字，如「第 1 个，共 3 个」。' },
    ],
    states: ['多个分支：翻页条出现，到头绕回。', '只有一个分支：翻页条不画。'],
    donts: ['不要在 AiBranch 之外用它的子件。', '分支内容变长时别用固定高度。'],
    composition:
      'AiBranch\n  AiBranchMessages（每个子元素一个分支）\n  AiBranchSelector\n    AiBranchPrevious\n    AiBranchPage\n    AiBranchNext',
    keys: [
      ['Tab', '上一个、下一个'],
      ['Enter / Space', '翻页'],
    ],
  },
  {
    id: 'ai-task-list',
    group: 'ai',
    cardHeight: 320,
    title: 'AiTaskList Agent 计划',
    summary:
      'Agent 要走完的一份计划，只读：每一步是 排队 / 进行中 / 完成 / 失败，可带一层子步骤与小注。表头计数从任务派生；完成的行安静下来，进行中的行有流光下划线。与 TaskList（人来勾的清单）是两回事。改自 SmoothUI。',
    exports: ['AiTaskList'],
    propParts: [{ part: 'AiTaskList', note: 'label 与 statusLabels 必传；读者不能改状态，调用方推进 tasks。' }],
    states: [
      'pending：空框。',
      'running：流光下划线。',
      'done：绿框、对勾被画出来、行淡到 65%。',
      'failed：红框、叉被画出来。',
    ],
    donts: ['要让用户勾选用 TaskList。', '计数别手传，它是派生的。'],
    composition: 'AiTaskList\n  div（标题 + n/m）\n  ul > li（框 + 文字 + 小注，子步骤缩进一层）',
    keys: [],
  },
  {
    id: 'agent-avatar',
    group: 'ai',
    cardHeight: 250,
    title: 'AgentAvatar Agent 头像',
    summary:
      'Agent 的像素头像：由字符串种子确定地生成 6×6 的色块，同一个种子永远同一张脸；带呼吸、脉动、斜扫、闪点四种环境动效。多个 Agent（研究员、风控、执行）并存时一眼认出是谁说的话。改自 SmoothUI。',
    exports: ['AgentAvatar'],
    propParts: [
      { part: 'AgentAvatar', note: '画在 canvas 上，role=img，读屏名取 label。颜色是按种子生成的身份色，不跟主题。' },
    ],
    states: ['动画：四种环境动效叠加。', 'animated=false：画静止的一帧。'],
    donts: ['不要拿它当用户头像。', '同一个 Agent 的种子要稳定，别用随机数或时间。'],
    composition: 'AgentAvatar\n  canvas（requestAnimationFrame）',
    keys: [],
  },
  {
    id: 'avatar',
    group: 'readouts',
    cardHeight: 120,
    title: 'Avatar 头像',
    summary:
      '圆形头像：图片没到或失败时显示缩写，右下角可挂在线状态点，AvatarGroup 叠放并把多出的折成 +N；三档尺寸 24 / 32 / 40。',
    exports: ['Avatar', 'AvatarGroup', 'useAvatarSize'],
    propParts: [
      { part: 'Avatar', note: '其余属性透传给 Radix Avatar.Root。' },
      { part: 'AvatarGroup' },
      { part: 'useAvatarSize', note: '返回最近一个头像的尺寸，给放在头像里的自定义部件用。' },
    ],
    states: [
      '图片加载中或失败：显示 fallback（缩写），7% 白底、ink-200 字（ink-300 在 Console 下只有 4.42:1）。',
      '有 status：右下角一个状态点（在线、离开、忙碌、离线），读屏名由 statusLabel 给。',
      '在 AvatarGroup 里：叠放、环形描边，超过 max 的折成 +N。',
    ],
    donts: [
      '不要单靠状态点的颜色传达在线与否：statusLabel 要给，旁边有文字更好。',
      '不要在头像里放超过两个字符的缩写。',
      '要显示一个人的完整信息用 RichPopover 或 HoverCard，不要塞进头像。',
    ],
    composition:
      'AvatarGroup\n  Avatar\n    Radix Avatar.Image（有 src）\n    Radix Avatar.Fallback\n    span（status 点）\n  span（+N）',
    keys: [],
  },
  {
    id: 'breadcrumb',
    group: 'layout',
    cardHeight: 48,
    title: 'Breadcrumb 面包屑',
    summary: '路径导航：一节一节从左侧轻滑进来（错开 40ms），最后一节是当前页、不是链接；分隔符可换。',
    exports: ['Breadcrumb'],
    propParts: [{ part: 'Breadcrumb' }],
    states: [
      '有 href 的节：链接，悬停提亮。',
      '没有 href 的中间节：纯文字。',
      '最后一节：aria-current="page"，ink 色。',
    ],
    donts: [
      '不要超过五节：太深的路径用折叠或换导航方式。',
      '不要拿它当标签页：它只表达位置，不切换并列视图（那是 Tabs）。',
    ],
    composition: 'Breadcrumb\n  nav\n    ol\n      li（每节）\n        a / span',
    keys: [],
  },
  {
    id: 'pagination',
    group: 'layout',
    cardHeight: 48,
    title: 'Pagination 分页',
    summary:
      '分页器：当前页的底块在页码之间用弹簧滑过去，页码错开 30ms 进场，页数多时首尾常驻、当前页两侧留 siblings 页、其余折成省略号。',
    exports: ['Pagination', 'buildPageRange'],
    propParts: [{ part: 'Pagination' }, { part: 'buildPageRange', note: '页码列表的算法，导出给单测与自定义渲染。' }],
    states: [
      '当前页：带底块，aria-current="page"。',
      '第一页时上一页禁用，最后一页时下一页禁用。',
      '总页数不超过 siblings*2+5：全部列出，没有省略号。',
    ],
    donts: ['不要用它翻无限流（行情、新闻流）：那是加载更多。', '不要把 siblings 设成 0：当前页与首尾页会连成一团。'],
    composition:
      'Pagination\n  nav\n    ul\n      li > Button（上一页）\n      li > Button（页码，当前页内含滑动底块）\n      li（省略号）\n      li > Button（下一页）',
    keys: [
      ['Tab', '在按钮间走'],
      ['Enter / Space', '翻到该页'],
    ],
  },
  {
    id: 'collapsible',
    group: 'layout',
    cardHeight: 90,
    title: 'Collapsible 单项折叠',
    summary: '一个标题行加一块可收起的内容；内容高度从 0 长出来，箭头翻过来。成组、同时只开一项的用 Accordion。',
    exports: ['Collapsible', 'CollapsibleContent', 'CollapsibleTrigger'],
    propParts: [
      { part: 'Collapsible', note: '其余属性透传给 Radix Collapsible.Root。' },
      {
        part: 'CollapsibleTrigger / CollapsibleContent',
        symbol: 'CollapsibleTrigger',
        note: '标题行（带箭头）与展开的内容，透传 Radix 同名部件。',
      },
    ],
    states: ['收起、展开。', '禁用：标题行降到 45% 不透明度，不响应。'],
    donts: ['不要把用户必须读的内容收起来。', '几项并列要互斥展开时用 Accordion。'],
    composition: 'Collapsible\n  CollapsibleTrigger\n  CollapsibleContent',
    keys: [['Enter / Space', '展开或收起']],
  },
  {
    id: 'menubar',
    group: 'overlays',
    cardHeight: 48,
    title: 'Menubar 菜单栏',
    summary:
      '一排顶层菜单（文件、视图、运行）：方向键在它们之间走，一个开着时划到别的自动换开；面板用下拉菜单同一套皮肤与入场。',
    exports: ['Menubar', 'MenubarContent', 'MenubarItem', 'MenubarMenu', 'MenubarSeparator', 'MenubarTrigger'],
    propParts: [
      { part: 'Menubar', note: '其余属性透传给 Radix Menubar.Root。' },
      {
        part: 'MenubarMenu / MenubarTrigger / MenubarContent',
        symbol: 'MenubarTrigger',
        note: '一个顶层菜单的入口与面板，透传 Radix 同名部件。',
      },
      {
        part: 'MenubarItem / MenubarSeparator',
        symbol: 'MenubarItem',
        note: '面板里的行与分隔线，透传 Radix 同名部件。',
      },
    ],
    states: [
      '关闭：只有触发器一排。',
      '打开：面板从触发处轻升；再划到旁边的触发器，直接换开。',
      '禁用的行不高亮、不可选。',
    ],
    donts: ['不要把它当应用导航：整页导航用 SideNav，带大块说明的顶栏用 NavigationMenu。', '不要嵌套超过两层。'],
    composition:
      'Menubar\n  MenubarMenu\n    MenubarTrigger\n    MenubarContent\n      MenubarItem\n      MenubarSeparator',
    keys: [
      ['← →', '在顶层菜单之间走'],
      ['↓ / Enter', '打开菜单'],
      ['Esc', '关闭'],
    ],
  },
  {
    id: 'navigation-menu',
    group: 'layout',
    cardHeight: 210,
    title: 'NavigationMenu 导航菜单',
    summary: '顶栏上一排带下拉面板的入口：面板共用一个视口，在入口之间划动时按方向滑入滑出，宽高平滑过渡。',
    exports: [
      'NavigationMenu',
      'NavigationMenuContent',
      'NavigationMenuItem',
      'NavigationMenuLink',
      'NavigationMenuList',
      'NavigationMenuTrigger',
      'navigationMenuTriggerClass',
    ],
    propParts: [
      { part: 'NavigationMenu', note: '其余属性透传给 Radix NavigationMenu.Root；视口内建。' },
      {
        part: 'NavigationMenuList / NavigationMenuItem',
        symbol: 'NavigationMenuList',
        note: '入口的列表与单项，透传 Radix 同名部件。',
      },
      {
        part: 'NavigationMenuTrigger / NavigationMenuContent / NavigationMenuLink',
        symbol: 'NavigationMenuTrigger',
        note: '入口按钮（带箭头）、面板内容与面板里的链接，透传 Radix 同名部件。',
      },
      { part: 'navigationMenuTriggerClass', note: '入口按钮的类名，给要做成链接外观的单项（没有面板的入口）用。' },
    ],
    states: [
      '关闭：一排入口。',
      '打开：面板在视口里长出来；换入口时按方向横向滑入。',
      '当前链接（data-active）有底色。',
    ],
    donts: ['不要在面板里放要操作的表单：面板随指针离开会收起。', '入口只有一两个并且没有面板时不要用它，直接放链接。'],
    composition:
      'NavigationMenu\n  NavigationMenuList\n    NavigationMenuItem\n      NavigationMenuTrigger\n      NavigationMenuContent\n        NavigationMenuLink',
    keys: [
      ['← →', '在入口之间走'],
      ['↓ / Enter', '打开面板'],
      ['Esc', '关闭'],
    ],
  },
  {
    id: 'file-tree',
    group: 'layout',
    cardHeight: 200,
    title: 'FileTree 文件树',
    summary:
      '策略目录、回测产物这类有文件夹也有文件的层级：行首是文件夹 / 文件图标、行尾可挂徽标；文件夹展开时子级高度弹出来、箭头转 90 度，可画纵向引导线。纯分类的树用 TreeView。',
    exports: ['FileTree'],
    propParts: [{ part: 'FileTree' }],
    states: [
      '文件夹收起：关闭的文件夹图标，箭头朝右。',
      '文件夹展开：打开的图标、箭头朝下，子级高度弹出。',
      '选中的行有底色；键盘焦点的行画焦点环。',
      '有 badge 的行：行尾写改动标记或大小。',
    ],
    donts: ['不要拿它放几千个节点：它不做虚拟化。', '不要放没有文件语义的分类（品种分类用 TreeView）。'],
    composition: 'FileTree\n  div role=tree\n    div role=treeitem（一行）\n    div role=group（展开的子级）',
    keys: [
      ['↑ ↓', '上下走'],
      ['→', '展开，已展开则进入第一个子级'],
      ['←', '收起，已收起则回父级'],
      ['Home / End', '到首、末行'],
      ['Enter / Space', '选中，文件夹同时开合'],
    ],
  },
  {
    id: 'dock',
    group: 'layout',
    cardHeight: 110,
    title: 'Dock 坞',
    summary:
      '一排工具图标，指针靠近时按距离放大（升余弦衰减，邻居跟着长）；悬停或聚焦出标签；选中时往上弹跳；active 的在底下画一个点。',
    exports: ['Dock', 'falloff'],
    propParts: [{ part: 'Dock' }, { part: 'falloff', note: '放大的衰减曲线：指针正下是 1，影响半径外是 0。' }],
    states: [
      '静止：所有图标原大小。',
      '指针靠近：按距离放大，标签出现。',
      '键盘聚焦：标签出现。',
      '选中：图标弹跳一次。',
    ],
    donts: [
      '不要当主导航：它是工具坞，放四到八个常用动作。',
      '不要在触屏为主的界面放它：放大靠指针。',
      '没有简化的积分布局：整排的中心会随指针略有漂移。',
    ],
    composition: 'Dock\n  div role=toolbar\n    div（一格）\n      button（图标）\n      span（标签，隐藏时不进读屏）',
    keys: [
      ['← →', '在图标间走（竖排为 ↑ ↓）'],
      ['Enter / Space', '选中'],
    ],
  },
  {
    id: 'rich-popover',
    group: 'overlays',
    cardHeight: 200,
    title: 'RichPopover 富提示',
    summary:
      '点触发器弹出的一张小卡：标题（可带外链）、一段说明、一枚元信息小标和一个主动作，带小尖角；入场是模糊加缩放一起收敛。品种悬停预览用 HoverCard，需要带动作、要点开的用它。',
    exports: ['RichPopover'],
    propParts: [{ part: 'RichPopover' }],
    states: [
      '关闭：只有触发器。',
      '打开：卡从触发处收敛进场，指向触发器的尖角。',
      '没有 actionLabel：不画主动作；没有 meta：左边留空。',
    ],
    donts: [
      '不要放表单：它是预览卡加一个动作。',
      '不要用它代替 Tooltip：一句话的提示用 Tooltip。',
      '不要放需要读屏读到的唯一信息：重要信息在页面里另有一份。',
    ],
    composition:
      'RichPopover\n  Radix Popover.Root\n    Popover.Trigger（你的元素）\n    Popover.Content\n      标题 · 说明 · meta · Button\n      Popover.Arrow',
    keys: [
      ['Enter / Space', '在触发器上打开'],
      ['Esc', '关闭'],
    ],
  },
  {
    id: 'animated-file-upload',
    group: 'forms',
    cardHeight: 210,
    title: 'AnimatedFileUpload 文件上传区',
    summary:
      '拖文件进来时区块放大、图标上浮，放下后文件行错落滑入，删除时向右滑出、剩下的补位；整块是一个按钮，超限的文件过滤掉并提示。导入回测数据、策略文件用。',
    exports: ['AnimatedFileUpload', 'formatBytes'],
    propParts: [{ part: 'AnimatedFileUpload' }, { part: 'formatBytes', note: '字节数写成 B / KB / MB。' }],
    states: [
      '待机：虚线框与说明。',
      '拖入：框放大、实线强调色、图标上浮、说明换成「松开」。',
      '有文件：下面列出文件行，每行可移除。',
      '超限：红字提示（role=alert），超限文件不进列表。',
      '禁用：45% 不透明度，不响应拖放。',
    ],
    donts: [
      '不要在这里做上传进度：它只收文件，上传由调用方做。',
      '不要把 accept 当安全校验：它只是选择器的提示，要在服务端再验。',
    ],
    composition:
      'AnimatedFileUpload\n  input[type=file]（隐藏）\n  div role=button（落点）\n  p role=alert（错误）\n  ul（文件行）',
    keys: [['Enter / Space', '打开文件选择']],
  },
  {
    id: 'expandable-cards',
    group: 'layout',
    cardHeight: 250,
    title: 'ExpandableCards 展开卡片',
    summary:
      '横排卡片，点一张它横向撑开、露出右边的详情，其余保持窄卡，再点收回。并排比较几个版本或方案（策略 v1 到 v4）。',
    exports: ['ExpandableCards'],
    propParts: [{ part: 'ExpandableCards' }],
    states: [
      '全部收起：窄卡，只有标题与一行摘要。',
      '展开一张：宽度弹开，详情带模糊淡入；点别的卡自动换开。',
      '卡多了：横向滚动，点中的卡滚到中间。',
    ],
    donts: ['不要放超过一屏的详情：详情区自己滚，但长内容应另开页面。', '不要放必须同时看见的内容：同时只展开一张。'],
    composition:
      'ExpandableCards\n  div role=group\n    motion.div（一张卡）\n      h3 > button（标题，整张卡面可点）\n      face\n      detail（展开时）',
    keys: [],
  },
  {
    id: 'time-machine-stack',
    group: 'layout',
    cardHeight: 330,
    title: 'TimeMachineStack 时间机器叠层',
    summary:
      '一摞面板按深度排开，只有最前一张可读；滚轮、拖动、方向键往后翻，前一张飞过观众、后一张补上。回看策略版本史：最前是当前版本，往后是更早的。',
    exports: ['TimeMachineStack'],
    propParts: [{ part: 'TimeMachineStack' }],
    states: [
      '静止：最前一张完整，后面的缩小、上移、往后推。',
      '翻页：最前一张飞出，下一张升到最前；往回翻则从前面落下。',
      '到头：滚轮交还给页面。',
      '读屏：aria-live 播报位置。',
    ],
    donts: [
      '不要放需要同时对比的东西：只有最前一张可读（要对比用 ExpandableCards）。',
      '不要放超过几十项：每次只挂 visibleCount 张，但翻起来要很多下。',
    ],
    composition: 'TimeMachineStack\n  div role=listbox\n    motion.div role=option（一张面板）\n  div aria-live',
    keys: [
      ['↓ / ↑', '往后 / 往前翻一张'],
      ['Home / End', '到最前 / 最后一张'],
      ['滚轮 / 拖动', '翻页'],
    ],
  },
  {
    id: 'floating-navbar',
    group: 'layout',
    cardHeight: 230,
    title: 'FloatingNavbar 悬浮导航条',
    summary:
      '一条胶囊浮在内容上，当前项的底块用弹簧滑到点中的项；往下滚时条淡出上移让路，往回滚立即出现，滚过 120px 后收紧。研究报告、长文档的页内跳转用。',
    exports: ['FloatingNavbar'],
    propParts: [{ part: 'FloatingNavbar' }],
    states: [
      '静止：胶囊在顶（或底）部居中。',
      '往下滚：淡出上移，不接收指针。',
      '往回滚：立即出现。',
      '滚过 120px：内边距收紧。',
    ],
    donts: ['不要当整个应用的导航：那是 SideNav。', '不要在没有滚动的页面里设 hideOnScroll：它没有可隐藏的时机。'],
    composition: 'FloatingNavbar\n  motion.nav\n    logo\n    ul > li > a / button（含滑动底块）\n    actions',
    keys: [],
  },
  {
    id: 'expandable-navbar',
    group: 'layout',
    cardHeight: 230,
    title: 'ExpandableNavbar 可展开导航条',
    summary:
      '一排入口，悬停或点击一个，条的下沿长出一块面板把条撑高；在入口间移动时面板按方向横向交叉淡入，高度跟着内容变。',
    exports: ['ExpandableNavbar'],
    propParts: [{ part: 'ExpandableNavbar' }],
    states: [
      '关闭：一排入口。',
      '打开：面板高度用弹簧撑开。',
      '换入口：面板按方向横向交叉淡入，高度过渡到新内容。',
      'Esc、点外面、焦点移出：收起；指针离开延迟 closeDelay 收起。',
    ],
    donts: ['不要在面板里放要填写的表单：指针离开会收起。', '入口多到一行放不下时不要用它。'],
    composition:
      'ExpandableNavbar\n  nav\n    ul > li > button（入口）\n    motion.div（高度）\n      role=region（面板）',
    keys: [
      ['Tab', '在入口间走'],
      ['Enter / Space', '开合面板'],
      ['Esc', '收起'],
    ],
  },
  {
    id: 'mac-terminal',
    group: 'readouts',
    cardHeight: 280,
    title: 'MacTerminal 终端窗',
    summary:
      '一段「命令逐字敲入、输出逐行出现」的脚本回放，用来演示回测日志、部署输出、AI 的推理过程。是回放，不是真终端：没有输入。离开屏幕或标签页隐藏时暂停。',
    exports: ['MacTerminal'],
    propParts: [{ part: 'MacTerminal' }],
    states: [
      '播放：命令打字、输出按 delay 出现，光标闪烁，自动滚到底。',
      'autoPlay 关：等点一下或按 Enter 开始。',
      'loop：播完停 1.5 秒后重来。',
      '成功、错误、注释行各用自己的 token 色。',
    ],
    donts: [
      '不要拿它当日志查看器：真的日志用 CodeBlock 或表格，它只回放脚本。',
      '不要把重要信息只放在逐字出现的行里：完整文本另有一份给读屏。',
    ],
    composition:
      'MacTerminal\n  div role=group\n    顶栏（交通灯 · 标题）\n    pre aria-hidden（回放内容）\n    div sr-only（完整文本）',
    keys: [],
  },
  {
    id: 'folder-reveal',
    group: 'motion',
    cardHeight: 300,
    title: 'FolderReveal 文件夹展开',
    summary:
      '一个合着的文件夹，悬停（或点击）时前盖翻开、里面几张卡扇形展开。装饰件：适用首页、营销页里「一组东西收在一起」的示意；不进交易主界面。',
    exports: ['FolderReveal'],
    propParts: [{ part: 'FolderReveal' }],
    states: [
      '合着：只露最上面一张卡的边。',
      '悬停或聚焦：前盖翻开，卡依次扇出。',
      'trigger=click：点开合；触屏一律点。',
    ],
    donts: ['不要放进交易主界面：它是插画式交互，不是数据容器。', '卡里不要放要点的东西：卡合着时 aria-hidden。'],
    composition: 'FolderReveal\n  div（透视）\n    svg（后板）\n    div aria-hidden（卡）\n    button（前盖）',
    keys: [],
  },
  {
    id: 'glass-card',
    group: 'motion',
    cardHeight: 170,
    title: 'GlassCard 玻璃卡',
    summary:
      '毛玻璃底、内沿高光、随指针的镜面高光，悬停轻轻抬起。装饰件：适用压在图片或渐变上的首页、营销页卡片；压在纯色底上没有意义，不进交易主界面。没有搬原件的 SVG 折射环。',
    exports: ['GlassCard'],
    propParts: [{ part: 'GlassCard' }],
    states: [
      '静止：毛玻璃与内沿高光。',
      '悬停（精细指针）：抬起 3px，镜面高光跟着指针。',
      '触屏：不抬起、没有镜面高光。',
    ],
    donts: ['不要放进交易主界面：背景模糊在大面积重绘时很贵。', '不要压在纯色底上：看不出玻璃。'],
    composition: 'GlassCard\n  motion.div\n    span（色散边）\n    span（镜面高光）\n    div（内容）',
    keys: [],
  },
  {
    id: 'glow-hover-card',
    group: 'motion',
    cardHeight: 130,
    title: 'GlowHoverCard 悬停辉光卡',
    summary:
      '指针在卡上移动时，一团强调色的光斑跟着它，边线在光斑处亮起来。装饰件：适用首页的功能入口卡；不进交易主界面。光斑不跨卡（与原件的差别）。',
    exports: ['GlowHoverCard'],
    propParts: [{ part: 'GlowHoverCard' }],
    states: ['静止：没有光斑。', '悬停：光斑与边线亮起，渐入。', '离开：光斑渐出。'],
    donts: ['不要放进交易主界面。', '不要把 color 写成会和涨跌色混淆的红绿。'],
    composition: 'GlowHoverCard\n  div\n    span（光斑）\n    div（内容）',
    keys: [],
  },
  {
    id: 'gooey-popover',
    group: 'motion',
    cardHeight: 260,
    title: 'GooeyPopover 软糖弹出层',
    summary:
      '圆钮点开，一块「液体」从圆钮里长出来变成内容面板，收起时缩回去；SVG goo 滤镜只画形状，文字在滤镜上层不糊。装饰件：适用首页、营销页的小彩蛋式入口；交易主界面的弹层用 Popover。',
    exports: ['GooeyPopover'],
    propParts: [{ part: 'GooeyPopover' }],
    states: ['收起：一个圆钮。', '展开：形状从圆钮长到面板大小，内容在 57% 处淡入。', '点外面或按 Esc：缩回。'],
    donts: ['不要放进交易主界面：圆钮到面板的形变没有语义。', '不要放要填的长表单：面板靠点外面收起。'],
    composition:
      'GooeyPopover\n  svg（goo 滤镜）\n  div（滤镜层）\n  button（圆钮）\n  motion.div（面板）\n  div（隐藏镜像，量高度）',
    keys: [],
  },
  {
    id: 'morph-surface',
    group: 'motion',
    cardHeight: 190,
    title: 'MorphSurface 变形面',
    summary:
      '一颗小药丸点开后自己长成一张面板，宽、高、圆角一起弹簧过渡；点外面或按 Esc 收回。装饰件：适用首页浮在页面一角的「问 AI」入口；交易主界面提问走命令面板或 AI 输入件。',
    exports: ['MorphSurface'],
    propParts: [{ part: 'MorphSurface' }],
    states: ['收起：药丸，圆角 20。', '展开：宽高圆角一起弹簧过渡到面板，内容淡入；收起时延迟 80ms 让内容先淡出。'],
    donts: [
      '不要放进交易主界面：面板盖在内容上，靠点外面收起，盯盘时容易误触。',
      '原件写死的文案与输入框不在这里：外壳只管变形，内容由调用方传。',
    ],
    composition: 'MorphSurface\n  motion.div（变形的外壳）\n    button（药丸）\n    motion.div（面板内容）',
    keys: [],
  },
  {
    id: 'tilt-card',
    group: 'motion',
    cardHeight: 150,
    title: 'TiltCard 倾斜卡',
    summary:
      '指针在卡上移动时，卡跟着转（最多 12 度），一道高光跟着走，可选让带 data-tilt-depth 的子元素按深度错位出视差。装饰件：适用首页、营销页的功能卡；行情与下单区要稳，不进交易主界面。',
    exports: ['TiltCard'],
    propParts: [{ part: 'TiltCard' }],
    states: [
      '静止：平放。',
      '悬停（精细指针）：倾斜加放大，高光跟着指针。',
      '键盘聚焦：固定的小倾斜。',
      '触屏：不倾斜。',
    ],
    donts: ['不要放进交易主界面。', '不要在要读的长文字卡上用：转动时文字会糊。'],
    composition: 'TiltCard\n  div（透视）\n    motion.div（倾斜）\n      内容\n      div（高光）',
    keys: [],
  },
  {
    id: 'animated-list',
    group: 'feedback',
    cardHeight: 420,
    title: 'AnimatedList 信息流进场',
    summary:
      '新闻快讯、成交回报这类往上顶的信息流：新条目从上方弹性插入并带蓝线高亮，旧条目被挤着下移，超出 maxVisible 的从底部淡出。鼠标停在列表上时新条目先攒着、不往下挤，移开后一次进来，攒了几条可提示。递减（越旧越淡）默认关，信息流要让每一条都读得清。',
    exports: ['AnimatedList'],
    propParts: [
      {
        part: 'AnimatedList',
        note: '条目按显示顺序从上到下给，id 稳定；列表自己比较前后两次的 id 决定谁进谁出。放进 NewsFeed 的列表前面做「新到」区，或给成交回报、炸板提醒这类短流用。',
      },
    ],
    states: [
      '新条目：从上方 14px 处缩放弹入（弹簧 0.25s），带 k-live-enter 的蓝线高亮；一次来几条依次落下。',
      '被挤下移：layout 动画，位置平滑过渡。',
      '悬停：新条目攒着，pendingLabel 给了就出「n 条新快讯」；移开后一起进来。',
      '超出 maxVisible：最老的从底部淡出。',
    ],
    donts: [
      '不要拿它画上千行的表格：每行是一个 layout 动画，行多了用 DataGrid 或 NewsFeed 的虚拟滚动。',
      '不要在信息流上开 recede 再叠高亮：越旧越淡会让人漏读。',
      'onItemClick 开着时每条要给 label。',
    ],
    composition:
      'AnimatedList\n  div\n    span（pendingLabel，role=status）\n    ul（aria-live=polite）\n      motion.li（一条）',
    keys: [
      ['Tab', 'onItemClick 开着时在每条按钮间走'],
      ['Enter / Space', '点中当前条'],
    ],
  },
  {
    id: 'infinite-slider',
    group: 'quotes',
    cardHeight: 300,
    title: 'InfiniteSlider 行情跑马灯',
    summary:
      '无限滚动条，行情跑马灯（Ticker tape）的底座：内容复制一份首尾相接，匀速平移，没有接缝。速度按像素每秒，悬停可减速或停住，暂停与恢复都是平滑的变速，不跳。内容放 RollingText 价格与涨跌色，价格变了数字滚、整串闪一下。',
    exports: ['InfiniteSlider'],
    propParts: [
      {
        part: 'InfiniteSlider',
        note: '只给一份内容，件自己复制第二份；第二份 aria-hidden，读屏只读一遍。paused 是受控的，接 LiveToggle 或页面可见性。',
      },
    ],
    states: [
      '滚动：按 speed 像素每秒匀速，reverse 反向，direction=vertical 竖向。',
      '悬停：减速到 speedOnHover（0 就是停住），移开恢复，速度平滑趋近，不跳。',
      'paused：减速到停，恢复时从原位继续。',
    ],
    donts: [
      '不要在里面放要点击的小控件：它一直在动，目标不好点；要点的用 Watchlist 或 QuoteTable。',
      '不要用它承载唯一的重要信息：读屏用户读到的是静态的一份。',
      '速度别超过 100 像素每秒：读不清。',
    ],
    composition:
      'InfiniteSlider\n  div（role=group）\n    motion.div（轨）\n      div（第一份）\n      div（第二份，aria-hidden）',
    keys: [],
  },
  {
    id: 'dynamic-island',
    group: 'feedback',
    cardHeight: 280,
    title: 'DynamicIsland 通知岛',
    summary:
      '一个胶囊，内容换了它就弹着变成新内容的大小；旧内容模糊淡出、新内容从略小处模糊淡入。拿来放成交回报、炸板提醒、连接状态这类「一眼看到、过会儿退回」的通知。内容与切换时机都由调用方定，件只管那一下弹性变形。',
    exports: ['DynamicIsland'],
    propParts: [
      {
        part: 'DynamicIsland',
        note: 'view 是当前内容的键，换了才触发过渡；内容变了读屏礼貌播报（role=status、aria-live=polite）。',
      },
    ],
    states: [
      '内容换了：胶囊弹簧变到新内容的大小（bounce 默认 0.4），内容模糊淡入。',
      '同一 view 内内容变了：只改内容，不触发过渡。',
    ],
    donts: [
      '不要同时放两座岛：一个窗口只有一个通知出口。',
      '不要用它承载要处理的事（确认、拒绝）：它会被下一条通知顶掉，要处理的用 Toast 或 Dialog。',
      '内容别比 360px 宽：胶囊拉太宽会盖住顶栏。',
    ],
    composition: 'DynamicIsland\n  div\n    motion.div（胶囊，role=status）\n      motion.div（内容，key=view）',
    keys: [],
  },
  {
    id: 'pinned-list',
    group: 'quotes',
    cardHeight: 520,
    title: 'PinnedList 置顶列表',
    summary:
      '可置顶的列表（自选股、常用面板）：点一行把它钉到最上面，钉住的行落下时轻压一下，下面的行依次补位；左侧长出强调条，图钉转 45 度。置顶数有上限，满了其余行变灰不可点。键盘：方向键走、Home / End 到头尾、Enter / 空格 / P 切换。',
    exports: ['PinnedList'],
    propParts: [
      {
        part: 'PinnedList',
        note: 'pinnedIds 受控；不传就用 items 里的 pinned 起头自己记。labels 四项必填（读屏名与空态）。renderItem 自画行内容，图钉与强调条仍是件画的。',
      },
    ],
    states: [
      '未钉住：透明底、线框，右侧灰图钉。',
      '钉住：抬起（bg-300）、左侧强调条、图钉转 45 度填满；落下时压一下。',
      '满额：其余行半透明、不可点，读屏为 aria-disabled。',
      '没有钉住的：钉区显示 emptyPinned 虚线框。',
    ],
    donts: [
      '不要用来做多选：置顶是排序，不是选择；多选用 MultiSelect 或 ChipGroup。',
      '不要放几百行：每行是 layout 动画；长列表用 DataGrid。',
    ],
    composition:
      'PinnedList\n  div\n    ul\n      motion.li（空态）\n      motion.li\n        motion.div（role=button）\n      li（分隔线）',
    keys: [
      ['↑ ↓ ← →', '在行间走（漫游 tabindex）'],
      ['Home / End', '到第一行 / 最后一行'],
      ['Enter / Space / P', '置顶或取消'],
    ],
  },
  {
    id: 'animated-avatar-group',
    group: 'quotes',
    cardHeight: 150,
    title: 'AnimatedAvatarGroup 品种徽标堆',
    summary:
      '重叠的 SymbolMark 堆：ETF 前几大持仓、板块成分、相关品种一行放得下；悬停时拉开、略放大，超出的折成「+n」。外圈用底色描边把相邻两枚隔开。只有有鼠标的设备才展开。与 Avatar / AvatarGroup 的分工：那是人的头像，这是品种徽标。',
    exports: ['AnimatedAvatarGroup'],
    propParts: [{ part: 'AnimatedAvatarGroup', note: '每枚的 name 是读屏名与悬停提示；label 是整组的读屏名。' }],
    states: [
      '收拢：按 overlap 比例重叠，层级前高后低。',
      '悬停（有鼠标）：拉开 4px 间隔、放大 1.05，依次错开 30ms。',
      '超出 maxVisible：末尾一个「+n」圆。',
    ],
    donts: [
      '不要用它放要点击的品种：徽标是装饰性的堆，要点的用 Watchlist。',
      '不要超过 6 枚可见：再多就读不出谁是谁。',
    ],
    composition: 'AnimatedAvatarGroup\n  div（role=group）\n    motion.span\n      SymbolMark\n    motion.span（+n）',
    keys: [],
  },
  {
    id: 'hover-expand',
    group: 'layout',
    cardHeight: 230,
    title: 'HoverExpand 悬停展开面板',
    summary:
      '并排的一组面板，鼠标移到哪块哪块撑开（flex-grow 弹簧 4 比 1），其余收窄、标题竖排；键盘聚焦与方向键同样展开。拿来放板块概览、策略卡、情景对比这类「同时只看一块细节」的并列项。触屏没有悬停，点击展开。',
    exports: ['HoverExpand'],
    propParts: [
      { part: 'HoverExpand', note: 'activeIndex 受控；面板是 aria-pressed 的按钮，children 只在展开时渲染。' },
    ],
    states: ['展开：flex-grow 4，显示 children。', '收起：flex-grow 1，只剩竖排标题。', '聚焦：同悬停，立即展开。'],
    donts: [
      '展开区不要放可点击的控件：悬停到别的面板它就收起了；要交互的内容用 Tabs。',
      '不要超过 5 个面板：收起后标题挤不下。',
    ],
    composition: 'HoverExpand\n  div（role=group）\n    motion.button\n      motion.div（标题与内容）',
    keys: [
      ['← → / ↑ ↓', '横排 / 竖排时切到相邻面板'],
      ['Tab', '聚焦即展开'],
    ],
  },
  {
    id: 'dither-chart',
    group: 'readouts',
    cardHeight: 520,
    title: 'DitherChart 抖动点阵图',
    summary:
      '整张图都由方点拼出来的小图：先在低分辨率画布上画线、柱、堆叠、环、仪表、漏斗或热力，再按 Bayer 矩阵把透明度量化成有点没点，放大成像素风。与 DotMatrix 的分工：DotMatrix 是 SVG 里的固定点阵纹理，DitherChart 是整图。装饰性的概览，不可取值，读准数用 Sparkline 与 EquityCurve。',
    exports: ['DitherChart', 'DITHER_CHART_VARIANTS'],
    propParts: [
      {
        part: 'DitherChart',
        note: '画布图：读屏靠 description（必填）；颜色是 CSS 颜色，画前解析成实色，所以 token 也能用。',
      },
      { part: 'DITHER_CHART_VARIANTS', note: '常量：七种款式的名字。' },
    ],
    states: [
      '进入视口：900ms 缓出画入（animate 为 false 直接画满）。',
      '每个序列按 TONE_RAMP 取不同点阵密度，靠密度而不是只靠色相区分。',
      'matrix 2、4、8：越大渐变越细。',
    ],
    donts: ['不要拿它读精确数值：没有悬停与坐标。', '不要放进要截图比对的页：画入动画与点阵都依赖设备像素比。'],
    composition: 'DitherChart\n  figure\n    canvas（aria-hidden）\n    span.sr-only（description）',
    keys: [],
  },
  {
    id: 'count-badge',
    group: 'readouts',
    cardHeight: 300,
    title: 'CountBadge 角标',
    summary:
      '贴在任何元素角上的角标：点、数字、状态点三种；数字变了按增减方向上下滚，0 时淡出，超过上限写「99+」；可选向外扩散的一圈。与 NotificationBell 的分工：铃是「铃 + 未读数」一个整件，CountBadge 是通用的、贴在头像、标签页、图标按钮上的那一颗。',
    exports: ['CountBadge'],
    propParts: [
      { part: 'CountBadge', note: 'label 必填且要带数字（「3 条未读」），变了会播报；不给 children 就只画角标。' },
    ],
    states: [
      'count：数字，0 时淡出（showZero 保留）；增减时数字上下滚。',
      'dot：纯点，ping 时外扩一圈。',
      'status：online 绿、away 琥珀、busy 红、offline 灰，带底色描边。',
    ],
    donts: ['不要只用颜色传状态：label 里写出状态词。', '不要在同一个元素上叠两颗角标。'],
    composition:
      'CountBadge\n  span\n    children\n    motion.span（role=status）\n      span（数字）\n      span（ping）',
    keys: [],
  },
  {
    id: 'switchboard-card',
    group: 'readouts',
    cardHeight: 620,
    title: 'SwitchboardCard 灯板卡片',
    summary:
      '一块小灯阵加标题与说明：灯按 lit 矩阵常亮，或按种子随机明灭（灭、中、亮三档，像交换机面板）。拿来做「市场活跃度」「在线品种」这类带装饰意味的总览卡。随机用带种子的线性同余，同一个种子同一串，可暂停。',
    exports: ['SwitchboardCard', 'litIndexes'],
    propParts: [
      { part: 'SwitchboardCard', note: '给 onClick 整卡就是按钮（读屏名是 title）；不给就是静态卡。' },
      { part: 'litIndexes', note: '纯函数 (lit, columns, rows)：把一维或二维的 0/1 图案转成亮灯的序号。' },
    ],
    states: [
      'lit 给定：图案常亮。',
      'random：每 200ms 让约 20% 的灯推进一档（灭、中、亮）。',
      'paused：随机的灯停在当下。',
    ],
    donts: ['不要拿灯阵读数：灯没有刻度，数要写在标题或说明里。', '同一页别放超过两块随机的：同时闪会分散注意。'],
    composition:
      'SwitchboardCard\n  button（有 onClick 时）\n    div\n      div（灯阵）\n        span（一盏灯）\n      h3\n      p',
    keys: [['Enter / Space', '有 onClick 时点中整卡']],
  },
  {
    id: 'animated-tags',
    group: 'forms',
    cardHeight: 320,
    title: 'AnimatedTags 标签挑选',
    summary:
      '上面是「已选」，下面是「可选」，点一个标签它就飞到另一边（布局动画加模糊淡出淡入）。拿来选关注板块、策略标签、自选分组。与 ChipGroup 的分工：ChipGroup 是原地开关的筛选芯片，选中不换位置；AnimatedTags 把选中的拎出来单独放，适合要看清「我选了哪几个」。',
    exports: ['AnimatedTags'],
    propParts: [
      { part: 'AnimatedTags', note: 'selected 受控；labels 五项必填（两个区的小标题、空态、移除与添加的读屏名）。' },
    ],
    states: ['已选区：标签带 ×，点一下移走；空时显示 empty。', '可选区：标签带 +，点一下加入。'],
    donts: [
      '不要超过 20 个标签：两个区都会换行成一堆；多的用 MultiSelect 带搜索。',
      '不要拿它做互斥选择：互斥用 ToggleGroup 或 RadioGroup。',
    ],
    composition: 'AnimatedTags\n  div\n    div（已选）\n      motion.button\n    div（可选）\n      motion.button',
    keys: [
      ['Tab', '在标签间走'],
      ['Enter / Space', '加入或移除'],
    ],
  },
  {
    id: 'exposure-slider',
    group: 'forms',
    cardHeight: 300,
    title: 'ExposureSlider 双向刻度尺',
    summary:
      '刻度尺式的双向调节：中间一根定位线，左右拖动刻度尺，对准的刻度亮起，上方的环形读数左半圆表示负、右半圆表示正。拿来调净敞口、仓位偏移、杠杆这类中点是 0 的量；松手吸附到刻度。tone=pnl 时正负按涨跌色着色。',
    exports: ['ExposureSlider'],
    propParts: [
      {
        part: 'ExposureSlider',
        note: 'role=slider：aria-valuenow 是当前值，aria-valuetext 是 format 的结果。受控 value 与 onValueChange。',
      },
    ],
    states: [
      '拖动：刻度尺跟手，弹簧平滑，松手吸附。',
      '键盘：← → 一格，PageUp / PageDown 十格，Home / End 到两端。',
      '值为 0：环不画弧，数字用中性色。',
    ],
    donts: ['不要用来输入精确数字：刻度尺适合粗调，精确值用 NumberInput。', '不要用于只有正数的量：用 Slider。'],
    composition: 'ExposureSlider\n  div\n    div（环形读数）\n    div（role=slider）\n      motion.ul\n        Notch',
    keys: [
      ['← → / ↑ ↓', '一格'],
      ['PageUp / PageDown', '十格'],
      ['Home / End', '到最小 / 最大'],
    ],
  },
  {
    id: 'scrubber',
    group: 'forms',
    cardHeight: 380,
    title: 'Scrubber 擦洗条',
    summary:
      '一条带填充的擦洗控件：左边写名字，右边写读数，在条上按下并拖动就把值擦到那里，松手停住，值按步长吸附。拿来擦回测的回看时间点、拖下单数量、调价格偏移。把手平时小而淡，悬停、聚焦与拖动时变实。',
    exports: ['Scrubber', 'scrubSnap', 'scrubValueAt'],
    propParts: [
      {
        part: 'Scrubber',
        note: 'role=slider：名字取 label，aria-valuetext 是 format 的结果。受控 value 与 onValueChange；不给 value 就自己持有。',
      },
      { part: 'scrubSnap', note: '纯函数 (value, min, max, step)：夹进范围并吸附到步长。' },
      { part: 'scrubValueAt', note: '纯函数 (x, width, min, max, step)：条上的横坐标换成值；宽为 0 返回 null。' },
    ],
    states: [
      '静止：把手小而淡，填充到当前值。',
      '悬停或聚焦：把手变实放大。',
      '拖动：填充与把手跟手，没有过渡；松手停在吸附后的值。',
      '到两端：值夹在最小或最大，不越界。',
    ],
    donts: [
      '不要用来填表单里的必填数值：表单里的单值与区间用 Slider，精确数字用 NumberInput。',
      '不要不写读数格式：调用方用 format 给单位或日期，条里只有一个读数。',
    ],
    composition: 'Scrubber\n  div（role=slider）\n    填充 · 刻度点 · 把手\n    名字 · 读数',
    keys: [
      ['← → / ↑ ↓', '走一步'],
      ['Shift + 方向键 / PageUp / PageDown', '走十步'],
      ['Home / End', '到最小 / 最大'],
    ],
  },
  {
    id: 'power-off-slide',
    group: 'forms',
    cardHeight: 220,
    title: 'PowerOffSlide 滑动确认',
    summary:
      '把圆钮从左拖到头才算数，拖不到头松手就弹回。拿来做「全部平仓」「清仓」「关闭策略」这类不可轻易误触的操作。轨上的字有一道光扫过，圆钮拖远了字渐渐淡掉；确认后轨换成「执行中」文字，到点圆钮回位。键盘与读屏另有路：圆钮聚焦后按 Enter 或空格直接确认。',
    exports: ['PowerOffSlide'],
    propParts: [
      { part: 'PowerOffSlide', note: 'label、busyLabel 与 icon 必填；onConfirm 只在拖到头或键盘确认时调一次。' },
    ],
    states: [
      '待机：圆钮在左端，轨上字闪光。',
      '拖动：圆钮跟手，超过 160px 松手算确认。',
      '执行中：轨换成 busyLabel（role=status），duration 后回位。',
      '禁用：圆钮半透明不可拖。',
    ],
    donts: [
      '不要用来确认可撤销的小事：普通确认用 Dialog 或 Button。',
      '不要把它当唯一的确认入口：键盘与读屏靠 Enter，要在文档里写出来。',
    ],
    composition:
      'PowerOffSlide\n  div\n    div（轨）\n      motion.div（字）\n      motion.div（role=button，圆钮）\n    p（执行中）',
    keys: [['Enter / Space', '圆钮聚焦时直接确认']],
  },
  {
    id: 'animated-stepper',
    group: 'layout',
    cardHeight: 520,
    title: 'AnimatedStepper 步骤条',
    summary:
      '步骤条：下单向导（选品种、填参数、确认）这类多步流程。当前步的圆点外扩一圈光环，完成的步打钩（笔画画出来），步与步之间的线随进度填满，下方内容按前进或后退方向滑入。横排与竖排两种。与 StepPlayer 的分工：StepPlayer 是回放控制，这个是用户自己填的流程进度。',
    exports: ['AnimatedStepper'],
    propParts: [
      {
        part: 'AnimatedStepper',
        note: 'currentStep 受控；allowClickNavigation 关着时步骤只能从外面改，圆点是禁用的。',
      },
    ],
    states: [
      '未到：灰线圆点显示序号。',
      '当前：强调色实心，外扩一圈光环。',
      '完成：打钩，线填满。',
      'allowClickNavigation：点或方向键走任意步。',
    ],
    donts: ['不要超过 6 步：横排标题挤不下。', '步骤互相独立可任意顺序时用 Tabs。'],
    composition:
      'AnimatedStepper\n  div\n    div（role=tablist）\n      motion.button（role=tab）\n    div（role=tabpanel）\n      motion.div（内容）',
    keys: [
      ['← → / ↑ ↓', '允许点击导航时在步骤间走'],
      ['Tab', '焦点只停在当前步'],
    ],
  },
  {
    id: 'squircle',
    group: 'layout',
    cardHeight: 220,
    title: 'Squircle 平滑圆角',
    summary:
      '把元素用 clip-path 裁成曲率连续的圆角矩形（苹果图标那种角）：比 border-radius 的圆弧过渡柔和。smoothing 为 0 就是普通圆角，1 把曲线推到很深。边框改成沿同一条曲线画的 SVG 描边（CSS 边框会被裁断）。本系统的面板默认直角，这件只给头像、徽标、图标底这类单个小方块用。',
    exports: ['Squircle', 'squirclePath'],
    propParts: [
      { part: 'Squircle', note: '裁切会连阴影与焦点环一起裁掉：不要给它放要伸出去的东西。' },
      { part: 'squirclePath', note: '纯函数 (宽, 高, 半径, 平滑度)：返回 clip-path: path() 用的 SVG 路径。' },
    ],
    states: [
      'smoothing 0：与 border-radius 一样。',
      'smoothing 0.6（默认）：柔和的连续曲率。',
      'border：沿曲线的 1px 描边。',
    ],
    donts: [
      '不要用在要带焦点环的可聚焦元素上：焦点环会被裁掉。',
      '不要在一个面板里混用 Squircle 与直角：整块面板统一。',
    ],
    composition: 'Squircle\n  div（clip-path）\n    children\n    svg（描边，border 时）',
    keys: [],
  },
  {
    id: 'grid-loader',
    group: 'feedback',
    cardHeight: 360,
    title: 'GridLoader 点阵加载',
    summary:
      '3×3 像素点阵的转圈：几何小方块按图案亮起、呼吸（pulse）、依次点亮（stagger）或整图案轮换（sequence），带一点辉光。与 Loading 的分工：Loading 是「等数据时先出骨架」的整块门，GridLoader 是小的、不定长等待指示（按钮里、面板角上、AI 在想）。图案有 15 个常用的，也可传自己的 3×3 矩阵。',
    exports: ['GridLoader', 'GRID_LOADER_PATTERNS'],
    propParts: [
      { part: 'GridLoader', note: 'role=status，label 必填。颜色是任意 CSS 颜色，默认当前文字色。' },
      { part: 'GRID_LOADER_PATTERNS', note: '常量：15 个预置图案（3×3 的 0/1 矩阵）。' },
    ],
    states: [
      'pulse：亮的格 0.4 到 1 之间呼吸。',
      'stagger：亮的格按顺序一个一个点亮再灭。',
      'sequence：每个周期换下一个图案。',
      'still：只画图案，不动。',
    ],
    donts: ['不要用来表示有进度的等待：有进度用 Progress。', '不要在一屏里放超过三个：同时闪烁抢注意。'],
    composition: 'GridLoader\n  span（role=status）\n    motion.span（一格）',
    keys: [],
  },
  {
    id: 'motion-loader',
    group: 'feedback',
    cardHeight: 360,
    title: 'MotionLoader 圆形加载',
    summary:
      '一组连续运动的小加载指示：轨道、彗星、雷达、波形条、点环、呼吸光、方块蛇、变形环；都从 size 一个数缩放，颜色跟文字色。波形条与行情的条形很搭，点环适合行内。与 GridLoader 的分工：GridLoader 是像素点阵，MotionLoader 是连续运动的圆形。',
    exports: ['MotionLoader', 'MOTION_LOADER_VARIANTS'],
    propParts: [
      { part: 'MotionLoader', note: 'role=status，label 必填；speed 是倍率。' },
      { part: 'MOTION_LOADER_VARIANTS', note: '常量：八个款式的名字。' },
    ],
    states: ['八个款式各自循环；size 缩放到 16px 也能读出。', 'speed 2 为两倍速。'],
    donts: ['不要拿它当进度条：它不表示进度。', '不要给它加文字说明靠颜色：说明写在 label 里。'],
    composition: 'MotionLoader\n  span（role=status）\n    （款式的运动层）',
    keys: [],
  },
  {
    id: 'page-preloader',
    group: 'feedback',
    cardHeight: 340,
    title: 'PagePreloader 进场遮罩',
    summary:
      '面板或整页的进场遮罩：先盖住内容停一会儿，数据就绪后用幕布、阶梯、像素、文字四种方式之一揭开。用在切换工作区、冷启动首屏。默认只盖住父级，整页遮罩要显式 fullScreen。与 Loading 的分工：Loading 管等数据时的骨架与超时，PagePreloader 只管「揭开」这一下，两者可叠着用。',
    exports: ['PagePreloader', 'PAGE_PRELOADER_VARIANTS', 'preloaderExitMs'],
    propParts: [
      {
        part: 'PagePreloader',
        note: 'active 受控：设为 false 播揭开；不传就停 duration 毫秒后自己揭开。揭开完成后卸载并调 onComplete。',
      },
      { part: 'PAGE_PRELOADER_VARIANTS', note: '常量：四个款式的名字。' },
      { part: 'preloaderExitMs', note: '纯函数 (款式, 列数)：揭开这一下要多少毫秒。' },
    ],
    states: [
      'hold：遮罩盖住，文字款循环换词。',
      'exiting：按款式揭开（幕布向两侧、阶梯逐列下沉、像素乱序消失、文字上滑）。',
      'idle：卸载，什么也不画。',
    ],
    donts: [
      '不要用来掩盖慢：停留时间超过 1.5 秒就该显示真实的加载状态。',
      '不要每次切页都用：只在工作区或整页冷启动时用一次。',
    ],
    composition: 'PagePreloader\n  div（role=status）\n    （款式层：幕布 / 阶梯 / 像素 / 文字）',
    keys: [],
  },
  {
    id: 'scroll-progress',
    group: 'feedback',
    cardHeight: 380,
    title: 'ScrollProgress 滚动进度',
    summary:
      '读长文（研报、新闻正文、策略报告）时指示读到哪了：条、环、数字、分段四种；值经弹簧平滑，不跟着滚轮的颗粒抖。自己读滚动位置（窗口，或 container 指定的滚动容器），不用传值。与 Progress 的分工：Progress 是受控的任务进度，这个读滚动。',
    exports: ['ScrollProgress'],
    propParts: [
      {
        part: 'ScrollProgress',
        note: 'role=progressbar，aria-valuenow 是百分比；label 必填。position=top 或 bottom 时是 sticky，钉在滚动容器的边上。',
      },
    ],
    states: [
      'bar：顶边一条，前端带亮头。',
      'ring：圆环，showValue 时中间写百分比。',
      'number：只有大数字。',
      'segments：一排胶囊依次填满。',
    ],
    donts: ['不要用它表示任务进度：那是 Progress 的事。', '不要在内容短到不滚动的页面放：它永远是 0。'],
    composition: 'ScrollProgress\n  div（role=progressbar）\n    motion.div / svg / span / 胶囊',
    keys: [],
  },
  // —— 动效：过场、背景、特效、媒体（改自 SmoothUI，MIT）——
  {
    id: 'shader-reveal',
    group: 'motion',
    cardHeight: 256,
    title: 'ShaderReveal 着色器过场',
    summary:
      '视图切换时，一层 WebGL 着色器的光带扫过，遮住的那一刻换内容，播完淡去；八种变体（noise、zoom、circle、wipe、luma、planetary、stripes、push）共用一个件。适用持仓、订单、成交这类整块视图的切换；表格里的行刷新不要用。颜色取主题 token，WebGL 不可用或标签页隐藏时退回普通淡入淡出。',
    exports: ['ShaderReveal'],
    propParts: [{ part: 'ShaderReveal' }],
    states: [
      '静止：画布全透明，不画、不占动画帧。',
      '播放：transitionKey 一变就播，过半换内容，约 1 秒；播放中 data-transitioning=true。',
      '被打断：新的 transitionKey 来了就取消上一次，从头再播。',
      'WebGL 不可用：旧内容淡出、换内容、新内容淡入，总时长不变。',
    ],
    donts: [
      '不要用在表格行或价格的刷新上：那是 LiveFlash 与 ReadoutFlash 的事。',
      '不要在内容要读时反复触发：一次过场约 1 秒，用户切得比它快就取消上一次。',
      '不要在动画期间依赖旧内容：换内容发生在过半时刻，之前读到的还是旧的。',
    ],
    composition: 'ShaderReveal\n  div（内容层，换内容时淡出淡入的是它）\n  canvas（aria-hidden，WebGL 光带）',
    keys: [],
  },
  {
    id: 'sdf-blob-transition',
    group: 'motion',
    cardHeight: 212,
    title: 'SdfBlobTransition 融球过场',
    summary:
      '圆、扭环、两球相融、放射圆簇与全部叠加五种距离场形状，从中间长大，遮住的那一刻换内容。和 ShaderReveal 共用同一个 WebGL 引擎，形状更柔，适合首页与引导页的切换；盘中视图用更克制的 ShaderReveal 的 wipe。',
    exports: ['SdfBlobTransition'],
    propParts: [{ part: 'SdfBlobTransition' }],
    states: ['静止：不画。', '播放：约 1.1 秒，过半换内容。', 'WebGL 不可用：普通淡入淡出。'],
    donts: ['不要用在高频切换的视图上。', '不要拿它盖住需要立刻读的数据。'],
    composition: 'SdfBlobTransition\n  div（内容层）\n  canvas（aria-hidden，WebGL）',
    keys: [],
  },
  {
    id: 'aperture-blur-transition',
    group: 'motion',
    cardHeight: 210,
    title: 'ApertureBlurTransition 光圈过场',
    summary:
      '一圈光从中心像光圈一样扩开，带细微的边缘起伏与颗粒，约 0.76 秒，是几个着色器过场里最短的。适合对话框式的内容整体换一页；颜色取主题 token。',
    exports: ['ApertureBlurTransition'],
    propParts: [{ part: 'ApertureBlurTransition' }],
    states: ['静止：不画。', '播放：约 0.76 秒，进度到 0.48 换内容。', 'WebGL 不可用：普通淡入淡出。'],
    donts: ['不要用在盘中行情区。', '不要同时放几个：每个过场件占一个 WebGL 上下文，浏览器对上下文数有上限。'],
    composition: 'ApertureBlurTransition\n  div（内容层）\n  canvas（aria-hidden，WebGL）',
    keys: [],
  },
  {
    id: 'chroma-blur-transition',
    group: 'motion',
    cardHeight: 210,
    title: 'ChromaBlurTransition 色散过场',
    summary:
      '一道带色散的柔光帘子斜着扫过整块内容，约 1 秒；比光圈更柔、更慢。适合整页或整块视图的切换；颜色取主题 token。',
    exports: ['ChromaBlurTransition'],
    propParts: [{ part: 'ChromaBlurTransition' }],
    states: ['静止：不画。', '播放：约 1.04 秒，过半换内容。', 'WebGL 不可用：普通淡入淡出。'],
    donts: ['不要用在盘中行情区。', '不要同时放几个：每个过场件占一个 WebGL 上下文。'],
    composition: 'ChromaBlurTransition\n  div（内容层）\n  canvas（aria-hidden，WebGL）',
    keys: [],
  },
  {
    id: 'aurora-curtain',
    group: 'motion',
    cardHeight: 260,
    title: 'AuroraCurtain 极光背景',
    summary:
      'WebGL2 着色器在内容后面画几条缓缓飘动的光带，可调条数、柔度、亮度、方向与胶片颗粒。适用工作台的空状态、登录页、加载页的底；只当底，不承载数据，内容在它上面。屏外与标签页隐藏时停，WebGL2 不可用时退回 CSS 渐变。',
    exports: ['AuroraCurtain'],
    propParts: [{ part: 'AuroraCurtain' }],
    states: [
      '运行：屏内且标签页可见时每帧画；DPR 封顶 2。',
      '暂停（paused）或屏外：停在当前帧。',
      'WebGL2 不可用：CSS 径向渐变，不动。',
    ],
    donts: [
      '不要在它上面放要读的小字而不加底色：光带亮处对比不够。',
      '不要拿它承载数据或状态：颜色只是氛围，状态用 Led、Badge。',
      '不要在一屏里放很多个：每个占一个 WebGL 上下文。',
    ],
    composition: 'AuroraCurtain\n  div（aria-hidden）\n    canvas\n  div（children）',
    keys: [],
  },
  {
    id: 'gravity-stars',
    group: 'motion',
    cardHeight: 300,
    title: 'GravityStars 引力星空',
    summary:
      'canvas 上的一片星点，缓缓漂移、明暗闪烁，指针像一口引力井，星点被吸过去再带着动量甩出，近处的星更大更快；可连线成星座。适用文档站首页、未连接的占位页；只当底。屏外与标签页隐藏时停。',
    exports: ['GravityStars'],
    propParts: [{ part: 'GravityStars' }],
    states: [
      '运行：每帧步进并重画；窄屏自动减星。',
      '指针在画面里：星点被吸引；离开：回到漂移。',
      '暂停或屏外：停在当前帧。',
      'canvas 不可用：CSS 点阵。',
    ],
    donts: ['不要放进行情区：连线会被读成关联关系。', '不要把 count 开到几百再放多个：每帧都要重算星点与连线。'],
    composition: 'GravityStars\n  div（aria-hidden）\n    canvas\n  div（children）',
    keys: [],
  },
  {
    id: 'liquid-metal',
    group: 'motion',
    cardHeight: 262,
    title: 'LiquidMetal 液态金属',
    summary:
      'WebGL2 着色器画一块流动的金属面（铬、金、水银、油膜四种），指针推动流场；maskText 时把材质裁进字形。金属的明、暗、色调三色由 token 混出，跟主题走。适用会员、高级功能的徽标与标题；不进行情与下单区。',
    exports: ['LiquidMetal'],
    propParts: [{ part: 'LiquidMetal' }],
    states: [
      '面：WebGL2 着色器，屏外停。',
      'maskText：CSS 渐变裁进字形，横向缓扫。',
      'WebGL2 不可用：CSS 圆锥渐变，不动。',
    ],
    donts: [
      '不要拿 maskText 的字当唯一的信息：字形里是渐变，浅色主题下对比不稳。',
      '不要在行情区用：金属反光会抢走涨跌色的注意力。',
    ],
    composition: 'LiquidMetal\n  div（aria-hidden）\n    canvas\n  div（children）',
    keys: [],
  },
  {
    id: 'orb',
    group: 'motion',
    cardHeight: 280,
    title: 'Orb 着色球',
    summary:
      'WebGL2 画的一颗带光照的球，内部是 OkLab 混色的缓慢流动，循环首尾无缝；高光、边缘亮、内部散射、虹彩都可调。适合 AI 思考中、连接中的占位；要表达听与想的状态用 MatrixOrb。读屏看不到它：状态要用文字另外说。',
    exports: ['Orb'],
    propParts: [{ part: 'Orb' }],
    states: ['运行：约 60 帧封顶，离开屏幕就停。', '暂停（paused）：停在当前帧。', 'WebGL2 不可用：一块径向渐变的圆。'],
    donts: ['不要拿它表达数据：颜色只是氛围。', '不要不配文字：画布是 aria-hidden，状态要用文字说。'],
    composition: 'Orb\n  canvas（aria-hidden）',
    keys: [],
  },
  {
    id: 'pixel-flow-field',
    group: 'motion',
    cardHeight: 280,
    title: 'PixelFlowField 像素流场',
    summary:
      'canvas 上一片方、圆或十字的像素格随流场漂，格子取样一个词或一张图：被覆盖的格子亮、强调色、墨色三档，指针划过会推开格子，scatter 加一就把字炸开再聚拢。适用连接中、加载中的占位页；只当底。字在画布里，要读的内容另外放文字。',
    exports: ['PixelFlowField'],
    propParts: [{ part: 'PixelFlowField' }],
    states: [
      '运行：屏内且标签页可见时每帧画；格数封顶 1.4 万。',
      'scatter 变化：格子重新随机散开再聚回。',
      '暂停或屏外：停在当前帧。',
      'canvas 不可用：CSS 点阵。',
    ],
    donts: [
      '不要用它显示要读的字：画布里的字不能被读屏读到、也不能复制。',
      'src 的图要允许跨域读取，读不了就退回 text。',
    ],
    composition: 'PixelFlowField\n  div（aria-hidden）\n    canvas\n  div（children）',
    keys: [],
  },
  {
    id: 'border-beam',
    group: 'motion',
    cardHeight: 142,
    title: 'BorderBeam 边框光束',
    summary:
      '沿元素边框跑一圈带拖尾的彗星光，SVG 描边实现；可多束、反向、悬停暂停、屏外暂停，圆角可用像素或连续圆角。适用「等你处理」的卡片：AI 建议待审批、风控告警未确认；处理完关掉（active=false）。',
    exports: ['BorderBeam'],
    propParts: [{ part: 'BorderBeam' }],
    states: [
      '运行：一圈约 6 秒，beams 束均匀错开。',
      'active=false：光束隐去，只剩一圈细边。',
      '悬停（pauseOnHover）：精细指针下暂停。',
    ],
    donts: [
      '不要同时让几张卡都在跑：谁都在喊就没有谁在被看见。',
      '不要用它代替状态文字：它只提示「有待办」，内容要自己写清。',
    ],
    composition: 'BorderBeam\n  svg（aria-hidden，描边与彗星）\n  children',
    keys: [],
  },
  {
    id: 'cursor-image-trail',
    group: 'motion',
    cardHeight: 245,
    title: 'CursorImageTrail 光标图迹',
    summary:
      '指针在区域里移动，每隔一段距离在光标处放一张图，带随机倾斜，弹出、停留、淡出；移动越快，图越大停得越久。只在有精确指针的设备上启用。适用首页、作品集式的页面；不进盯盘界面。',
    exports: ['CursorImageTrail'],
    propParts: [{ part: 'CursorImageTrail' }],
    states: [
      '指针在区域里：按 distance 放图，循环用 poolSize 张图。',
      '指针离开且图都播完：停掉动画帧。',
      '触屏或无精确指针：不启用，只渲染 children。',
    ],
    donts: [
      '不要放进有操作的区域：图在内容上，会让人以为能点。',
      '每张图都要写 alt（读屏会跳过这层，但是不写会让 lint 报错）。',
    ],
    composition: 'CursorImageTrail\n  children\n  div（aria-hidden）\n    img × poolSize',
    keys: [],
  },
  {
    id: 'drawing-cursor',
    group: 'motion',
    cardHeight: 262,
    title: 'DrawingCursor 光标手绘',
    summary:
      '指针划过留下一条会渐渐消失的线，画布叠在内容上，线宽随速度变细；可选不消退，当作批注，ref 提供 clear 与 toDataURL。只在有精确指针的设备上启用。适用在图表截图上圈一下给同事看；不是正式的绘图工具。',
    exports: ['DrawingCursor'],
    propParts: [{ part: 'DrawingCursor' }],
    states: [
      '指针在区域里：留笔迹，decay 毫秒后消退。',
      '没有笔迹：停掉动画帧。',
      'decay=0：笔迹不消退，直到 clear 或指针离开（clearOnLeave）。',
      '触屏：不启用。',
    ],
    donts: [
      '不要当绘图工具：没有撤销与图层，笔迹只在画布里。',
      '不要盖在可点击的图表上：它不挡指针事件，但划线会让人误以为在操作图表。',
    ],
    composition: 'DrawingCursor\n  children\n  div（aria-hidden）\n    canvas',
    keys: [],
  },
  {
    id: 'emboss-surface',
    group: 'motion',
    cardHeight: 176,
    title: 'EmbossSurface 浮雕面',
    summary:
      '用多层 box-shadow 与 text-shadow 做出压凸、压凹、石膏、金属压印四种浮雕，深度、柔度与光源角度可调，interactive 时光源跟着指针转。适合会员徽章、奖牌卡的面；盘面上的控件用扁平的 token，不要浮雕。',
    exports: ['EmbossSurface'],
    propParts: [{ part: 'EmbossSurface' }],
    states: [
      '静态：光源在 lightAngle，阴影一次算好。',
      'interactive 且有精细指针：光源跟指针转，过渡走 --dur-snappy。',
      '石膏（plaster）：多一层 SVG 高光滤镜。',
    ],
    donts: [
      '不要在行情区用：浮雕让单元格像按钮。',
      '不要用 color 传半透明色：高光与阴影是往里混白、混黑，半透明会发灰。',
    ],
    composition: 'EmbossSurface\n  svg（plaster 才有，aria-hidden，高光滤镜）\n  as（默认 div）',
    keys: [],
  },
  {
    id: 'holographic-foil',
    group: 'motion',
    cardHeight: 204,
    title: 'HolographicFoil 全息箔卡片',
    summary:
      '一张带全息箔的卡：条纹箔层随指针（或设备倾斜）漂移、色相偏转，上面掠过一道柔光，整张卡轻微 3D 倾斜；四种箔（prism、aurora、gold、oil），颜色全由 token 混出。适合年度最佳策略、里程碑这类奖牌卡；不进盯盘界面。',
    exports: ['HolographicFoil'],
    propParts: [{ part: 'HolographicFoil' }],
    states: [
      '无精细指针：箔层静止，只有一道缓慢的掠光。',
      '有精细指针：箔、柔光与卡面按指针偏移，卡倾斜最多 9 度。',
      'useDeviceOrientation：触屏设备按陀螺仪倾斜；iOS 要点 orientationLabel 那个按钮授权。',
    ],
    donts: [
      '不要在卡里放要读的小字而不给底色：箔在内容下面也会透出来。',
      '不要整页铺：每张卡都是一堆混合层，列表里放几十张会掉帧。',
    ],
    composition:
      'HolographicFoil\n  motion.div（卡面，倾斜）\n    div（箔层）\n    div（children）\n    div（掠光、柔光）\n    button（orientationLabel，可选）',
    keys: [],
  },
  {
    id: 'magnetic-field',
    group: 'motion',
    cardHeight: 222,
    title: 'MagneticField 磁场',
    summary:
      '指针靠近时，区域里的元素按弹簧被吸、被推或绕着转，离得越近越强；传 items 时件自己把每个元素放进弹簧容器，也可以给子元素加 data-magnetic。只在有精细指针的设备上启用。适合首页的板块标签云；不进有点击目标的操作区（会让人点不准）。',
    exports: ['MagneticField'],
    propParts: [{ part: 'MagneticField' }],
    states: [
      '指针在 radius 内：元素偏移，距离越近偏得越多。',
      '指针离开：弹簧回位。',
      '触屏或 paused：不启用，元素原位。',
    ],
    donts: ['不要用在按钮、输入框上：它们会跑开，点不到。', '不要给太多元素：每帧要为每个元素算一次。'],
    composition: 'MagneticField\n  items 的每一项 motion.div > element\n  或 children（带 data-magnetic 的子元素）',
    keys: [],
  },
  {
    id: 'parallax-layers',
    group: 'motion',
    cardHeight: 285,
    title: 'ParallaxLayers 视差层',
    summary:
      '多层内容随滚动（可选再随指针）按各自的深度错位移动，每层可加模糊与透明度；container 指向滚动容器时跟它滚。适合首页头图、章节引子；数据、表格不放进去。深度 0 不动，1 动得最多。',
    exports: ['ParallaxLayers'],
    propParts: [{ part: 'ParallaxLayers' }],
    states: ['滚动：每层按 depth 乘以 range 平移，弹簧跟随。', 'pointerParallax：精细指针下再随指针偏移，最多 20px。'],
    donts: ['不要把要读的正文放进最前面的层：它在动，读不稳。', '不要不给容器高度：层是绝对定位，容器高度要自己定。'],
    composition: 'ParallaxLayers\n  div（relative，量滚动进度）\n    motion.div × layers（absolute，各自位移）',
    keys: [],
  },
  {
    id: 'progressive-blur',
    group: 'motion',
    cardHeight: 282,
    title: 'ProgressiveBlur 渐进模糊',
    summary:
      '叠几层带渐变遮罩的背景模糊，从一边向另一边（或由中心向外）模糊越来越重，盖在滚动列表的边缘，提示「下面还有」。模糊层不挡指针，也不进读屏。适用新闻流、日志、侧栏的边缘；表格要读的行不要被它盖住。',
    exports: ['ProgressiveBlur'],
    propParts: [{ part: 'ProgressiveBlur' }],
    states: ['挂载：整叠模糊淡入（fadeIn）。', 'direction 决定向哪一边变重；radial 由中心向外。'],
    donts: [
      '不要盖在需要点击的内容上：它不挡指针，用户看不清却点得到。',
      '层数不要超过 12：每层是一个 backdrop-filter。',
    ],
    composition:
      'ProgressiveBlur\n  div（aria-hidden）\n    div × layers（backdrop-filter 加渐变遮罩）\n  div（children，可选）',
    keys: [],
  },
  {
    id: 'scroll-image-reveal',
    group: 'motion',
    cardHeight: 305,
    title: 'ScrollImageReveal 滚动揭图',
    summary:
      '图片随滚动进度揭开：擦除、帘子、圆形、百叶、缩放五种遮罩，里面的图再做反向视差；once 时揭开后不再合上。适合首页、策略介绍页配图；盘中界面里的图表不用它。必须写 alt。',
    exports: ['ScrollImageReveal'],
    propParts: [{ part: 'ScrollImageReveal' }],
    states: ['滚动进入：遮罩随进度打开，弹簧跟随。', 'once：打开后停在全开。'],
    donts: ['不要揭开需要立刻看到的图：滚到一半时图还是缺的。', 'alt 必填：图是内容，不是装饰。'],
    composition: 'ScrollImageReveal\n  motion.div（clip-path 或 mask）\n    motion.img',
    keys: [],
  },
  {
    id: 'svg-clip-mask',
    group: 'motion',
    cardHeight: 324,
    title: 'SvgClipMask 形状裁切',
    summary:
      '内容按一条 objectBoundingBox 路径（内置 blob、拱、菱形、波浪，或自定义）裁成异形；可循环变形、随滚动换形、悬停换形。变形的路径要有相同的命令结构。适合头像、封面图的异形裁切；数据图表不裁。',
    exports: ['SvgClipMask'],
    propParts: [{ part: 'SvgClipMask' }],
    states: [
      '静态：按 shape 或 path 裁。',
      'morph：在 morphPaths 之间循环插值。',
      'scroll：随滚动进度换下一条。',
      'hover：悬停换成 morphPaths 的第二条（精细指针）。',
    ],
    donts: [
      '不要用结构不同的路径做变形：浏览器按位置插值，结构不同会跳。',
      '被裁掉的部分点不到，也看不到：别把可点的东西放在边角。',
    ],
    composition: 'SvgClipMask\n  svg（aria-hidden）> defs > clipPath > path\n  div（clip-path）> children',
    keys: [],
  },
  {
    id: 'svg-draw-on-scroll',
    group: 'motion',
    cardHeight: 305,
    title: 'SvgDrawOnScroll 滚动描线',
    summary:
      'SVG 路径的笔画长度跟滚动进度走，多条路径依次画；marker 挂在笔尖，位置由路径本身的几何算出。适合策略复盘页的权益曲线入场、引导页的路线图；曲线要读数时用 EquityCurve。',
    exports: ['SvgDrawOnScroll'],
    propParts: [{ part: 'SvgDrawOnScroll' }],
    states: ['滚动：按进度画出路径，弹簧跟随。', 'once：画完停在全长。', 'marker：笔尖的标记点随进度移动。'],
    donts: ['不要拿它读数：画到一半的曲线没有刻度。', 'SVG 是 aria-hidden：曲线说明的内容要另外写成文字。'],
    composition: 'SvgDrawOnScroll\n  svg（aria-hidden）> motion.path × 路径数\n  motion.div（marker，可选）',
    keys: [],
  },
  {
    id: 'ascii-render',
    group: 'motion',
    cardHeight: 254,
    title: 'AsciiRender 字符画',
    summary:
      '把图片或视频按亮度采样成一屏字符，单色（读主题的墨色）或带原图着色；视频按 fps 重画，屏外与暂停时停。读屏读 alt。适合首页的氛围图、加载页的占位；图要允许跨域读取，读不了就退回原图。',
    exports: ['AsciiRender'],
    propParts: [{ part: 'AsciiRender' }],
    states: [
      '图片：画一次。',
      '视频：按 fps 重画，屏外或 paused 时暂停播放。',
      '读取失败（跨域或解码出错）：隐藏字符，显示原图。',
    ],
    donts: ['不要拿它显示要读的图表：字符化后看不出数。', 'columns 不要超过 240：字符越多，每帧越慢。'],
    composition:
      'AsciiRender\n  img 或 video（aria-hidden，取样源）\n  pre（aria-hidden，字符）\n  span.sr-only（alt）',
    keys: [],
  },
  {
    id: 'dither-image',
    group: 'motion',
    cardHeight: 460,
    title: 'DitherImage 抖动图',
    summary:
      '把图片按 Bayer、Atkinson、Floyd-Steinberg 或阈值算法量化成 2 到 8 档，画成像素块；档位色默认取主题的墨色与底色，也可传色阶。progressive 时滚进视口再自上而下擦出。适合首页、文档的像素风配图；图要允许跨域读取。',
    exports: ['DitherImage'],
    propParts: [{ part: 'DitherImage' }],
    states: [
      '加载：先显示原图。',
      '就绪：抖动层淡入盖住原图。',
      'progressive：进入视口前抖动层被裁掉，进入后擦出。',
      '读取失败：一直显示原图。',
    ],
    donts: ['不要拿它显示图表：量化后的数值读不出。', '不要给很大的尺寸：抖动在主线程里算，图越大越久。'],
    composition: 'DitherImage\n  img（原图，alt）\n  motion.canvas（aria-hidden，抖动层）',
    keys: [],
  },
  {
    id: 'pixel-brush-canvas',
    group: 'motion',
    cardHeight: 316,
    title: 'PixelBrushCanvas 像素画板',
    summary:
      '在小网格上画像素画：铅笔、橡皮、填充、直线、矩形，撤销最多 50 步，自带色板与工具条（showTools）。键盘可用：方向键移动，空格落笔，B、E、G 切笔，Ctrl 或 Cmd 加 Z 撤销。所有文案走必填的 labels。适合给头像、策略图标做像素风小图；不是通用绘图工具。',
    exports: ['PixelBrushCanvas'],
    propParts: [{ part: 'PixelBrushCanvas' }],
    states: [
      '空：全部透明。',
      '落笔或拖动：onChange 收到整张像素缓冲的拷贝。',
      '直线与矩形：按下起点、松开终点；键盘用空格设起点再按一次完成。',
    ],
    donts: ['不要当通用绘图工具：只有一层、最多九色、没有缩放。', 'labels 必填：读屏名与播报的文案由调用方给。'],
    composition:
      'PixelBrushCanvas\n  div[role=application]\n    canvas\n    div（光标框）\n    span[aria-live]\n  fieldset（色板）\n  fieldset（工具）',
    keys: [
      ['↑ ↓ ← →', '移动光标格'],
      ['Space', '在光标格落笔（直线、矩形：设起点，再按一次完成）'],
      ['B / E / G', '切到铅笔、橡皮、填充'],
      ['Ctrl / Cmd + Z', '撤销'],
    ],
  },
  // A 股件包（#110，@katana-ui/react/cn）：中国市场才有的概念。文字都由调用方传，cnLabelsZh 是随包的简体中文默认。
  {
    id: 'cn-basics',
    group: 'cn',
    cardHeight: 340,
    title: 'cn 基础：金额、时段、文案',
    summary:
      'A 股件包的第 0 层（纯函数，不带 React）：formatCnAmount 把金额写成万 / 亿；时段轴认 09:15–09:25 竞价、09:30–11:30、13:00–15:00，午休与 09:25–09:30 不占宽度；cnLabelsZh 是随包的简体中文默认文案，可以整份换；取不到的数写「—」并可带原因（readCnValue）。不带数据源与交易日历数据。',
    exports: [
      'formatCnAmount',
      'CN_SESSIONS',
      'CN_AXIS_MINUTES',
      'CN_LATE_FROM',
      'cnAxisPosition',
      'cnPhaseOf',
      'cnTradingMinutesBetween',
      'formatClock',
      'parseClock',
      'cnLabelsZh',
      'readCnValue',
    ],
    propParts: [
      {
        part: 'formatCnAmount(value, { abbreviate, digits, signed }, units)',
        note: '≥1 亿写「x.xx亿」，≥1 万写「x万」（不到 100 万保留一位小数，之后取整），否则原样；null、NaN 写「—」，不写 0。接口跟 formatQuantity 同一套。',
      },
      {
        part: 'cnAxisPosition(minutes)',
        symbol: 'cnAxisPosition',
        note: '时刻在时间轴上的位置 0–1；早于 09:15、晚于 15:00 返回 null。',
      },
      { part: 'cnPhaseOf(minutes)', symbol: 'cnPhaseOf', note: '集合竞价 / 早盘 / 午盘 / 尾盘（14:30 起）。' },
      {
        part: 'cnTradingMinutesBetween(from, to)',
        symbol: 'cnTradingMinutesBetween',
        note: '两个时刻之间实际交易的分钟数。',
      },
      {
        part: 'parseClock(text) / formatClock(minutes)',
        symbol: 'parseClock',
        note: '「09:31」「09:31:05」与自 0 点起的分钟数互转。',
      },
      {
        part: 'CN_SESSIONS、CN_AXIS_MINUTES、CN_LATE_FROM',
        symbol: 'CN_SESSIONS',
        note: '时段表、时间轴总宽（250 分钟）、尾盘起点常量。',
      },
      {
        part: 'cnLabelsZh',
        symbol: 'cnLabelsZh',
        note: '默认文案；每个件的 labels 属性读它的一段，整份换掉就是别的语言。',
      },
      {
        part: 'readCnValue(value)',
        symbol: 'readCnValue',
        note: '读数：数，或 null，或 { value, reason }；非有限数当作取不到。',
      },
    ],
    states: [
      '金额：≥1 亿「1.23亿」，≥1 万「12.5万」，否则原样；负数带 -，signed 给正数带 +。',
      '时间轴：竞价 10 分钟、上午 120、下午 120，共 250 分钟；落在 09:25–09:30 或午休里的时刻贴到前一段末尾。',
      '取不到：null 写「—」，原因放悬停，不写 0。',
    ],
    donts: [
      '不要在包里放交易日历或数据源：哪天开市、数从哪来由调用方传。',
      '不要把文字写死在调用处：从 cnLabelsZh 取，或整份换成自己的语言。',
    ],
    composition: 'formatCnAmount\ncnAxisPosition · cnPhaseOf · cnTradingMinutesBetween\ncnLabelsZh',
    keys: [],
  },
  {
    id: 'streak-badge',
    group: 'cn',
    cardHeight: 330,
    title: 'StreakBadge 连板徽标',
    summary:
      '首板 / 2板 / 「5天3板」，或晋级口径「一进二」；高度越高越醒目（只靠语义色调升四档，不传色值），涨色跟 data-updown。也是 DataGrid 的列类型 streak，可按板数排序。文字由 labels 给（默认简体中文，可整份换），取不到写「—」并可带原因（悬停）。',
    exports: ['StreakBadge', 'normalizeStreak', 'streakLevel', 'streakSortKey', 'streakText'],
    propParts: [
      { part: 'StreakBadge', note: '渲染一个 span，不透传别的属性。' },
      { part: 'StreakValue', note: '连板：{ boards, days?, promotedFrom?, reason? }；也可以直接传数字当板数。' },
      { part: 'streakText(streak, labels, form)', note: '屏幕上的字：首板、2板、5天3板、一进二；取不到「—」。' },
      { part: 'streakLevel(boards)', symbol: 'streakLevel', note: '醒目程度 0–4（0 取不到，4 是四板及以上）。' },
      {
        part: 'streakSortKey(streak)',
        symbol: 'streakSortKey',
        note: '排序值：板数为主、天数为次；取不到 undefined。',
      },
      {
        part: 'normalizeStreak(streak)',
        symbol: 'normalizeStreak',
        note: '数字或对象规整成 StreakValue；小于 1 或非有限数当取不到。',
      },
    ],
    states: [
      '首板：弱灰底；2 板：涨色淡底；3 板：加描边；4 板及以上：更深的底加涨色描边、字加粗。',
      '晋级口径：form="promotion" 且给了 promotedFrom 才写「一进二」，否则退回板数写法。',
      '几天几板：days 大于 boards 才写「5天3板」。',
      '取不到：写「—」，悬停写 reason（没给就写默认文案里的说明）。',
    ],
    donts: ['不要传色值：醒目程度由件按板数定。', '不要在调用处拼「x板」：走 labels，换语言时整份换。'],
    composition: 'StreakBadge',
    keys: [],
  },
  {
    id: 'limit-status',
    group: 'cn',
    cardHeight: 300,
    title: 'LimitStatus 涨停状态',
    summary:
      '封板 / 炸板 / 回封 / 跌停 / 一字 / 竞价涨停六种状态胶囊，涨停一族可带封单额（按万 / 亿写）。状态不只靠颜色，字就是状态名；色调：涨停涨色（跟 data-updown）、炸板警示、跌停跌色。也是 DataGrid 的列类型 limitStatus，可按状态排序。',
    exports: ['LimitStatus', 'LIMIT_STATUS_ORDER', 'limitStatusText', 'limitStatusTone', 'normalizeLimitStatus'],
    propParts: [
      { part: 'LimitStatus', note: '渲染一个 span，不透传别的属性。' },
      { part: 'LimitStatusValue', note: '状态名，或 { status, sealAmount?, reason? }；status 为 null 是取不到。' },
      { part: 'limitStatusText(status, labels)', note: '屏幕上的字：「封板」「封板 3.20亿」；取不到「—」。' },
      { part: 'limitStatusTone(status)', symbol: 'limitStatusTone', note: 'up / warn / down。' },
      {
        part: 'normalizeLimitStatus(status)',
        symbol: 'normalizeLimitStatus',
        note: '规整成 { status, sealAmount, reason }；炸板不带封单额。',
      },
      {
        part: 'LIMIT_STATUS_ORDER',
        symbol: 'LIMIT_STATUS_ORDER',
        note: '排序次序：竞价涨停、一字、封板、回封、炸板、跌停。',
      },
    ],
    states: [
      '涨停一族（封板、回封、一字、竞价涨停）：涨色淡底；炸板：警示色；跌停：跌色。',
      '带封单额：字后接「3.20亿」，悬停写「封单 3.20亿」；炸板不带封单额。',
      '取不到：写「—」，悬停写 reason。',
    ],
    donts: ['不要只靠颜色区分状态：胶囊里的字就是状态名。', '不要给炸板传封单额：件会忽略。'],
    composition: 'LimitStatus\n  状态名\n  封单额（可选）',
    keys: [],
  },
  {
    id: 'board-mark',
    group: 'cn',
    cardHeight: 330,
    title: 'BoardMark 板块标记',
    summary:
      '主板 / 创业板（20cm）/ 科创板（20cm）/ 北交所（30cm）/ ST。默认只标有特殊涨跌幅限制的写「20cm」「30cm」「ST」，主板不画；display 选写板块名或都写。boardKindOf 从代码（与名称）判断板块。取不到写「—」。',
    exports: ['BoardMark', 'BOARD_LIMIT_PERCENT', 'boardKindOf'],
    propParts: [
      { part: 'BoardMark', note: '渲染一个 span，不透传别的属性。' },
      {
        part: 'boardKindOf(code, name?)',
        symbol: 'boardKindOf',
        note: 'ST 优先；300/301/302 创业板，688/689 科创板，4/8 开头与 920 北交所，其余主板；不是六位数字返回 null。',
      },
      {
        part: 'BOARD_LIMIT_PERCENT',
        symbol: 'BOARD_LIMIT_PERCENT',
        note: '各板块涨跌幅限制（%）：主板 10、ST 5、创业板与科创板 20、北交所 30。',
      },
    ],
    states: [
      'cm（默认）：创业板、科创板写「20cm」，北交所「30cm」，ST 写「ST」；主板什么都不画。',
      'name：写板块名；both：「创业板 20cm」。',
      '取不到：写「—」。',
    ],
    donts: ['不要把主板也标上：卡片上的标记是为了提醒涨跌幅限制不同。'],
    composition: 'BoardMark',
    keys: [],
  },
  {
    id: 'theme-card',
    group: 'cn',
    cardHeight: 360,
    title: 'ThemeCard 题材卡',
    summary:
      '卡头是序号、题材名与两枚小胶囊（几只涨停、最高几板），一行催化（省略号截断，悬停看全文与来源），成员表（涨停时间、名称、连板徽标），卡脚「查看 n 只涨停」。ThemeCards 把多张卡横排；按涨停家数 / 时间 / 连板 / 涨幅排，由调用方排。信息结构取自复盘吧的题材异动，样子是 Graphite 的。',
    exports: ['ThemeCard', 'ThemeCards', 'themeCardFigures'],
    propParts: [
      { part: 'ThemeCard', note: '渲染一个 section；成员行与卡脚在给了回调时才是按钮。' },
      { part: 'ThemeCards', note: '横排的容器：一行排不下就横向滚动，卡最窄 220px，有空就均分。' },
      {
        part: 'ThemeCardData',
        note: '题材：key、name、可选 limitUpCount / highestBoard / catalyst / catalystReason，成员 members。',
      },
      {
        part: 'themeCardFigures(theme)',
        note: '纯函数：涨停家数（不给就数成员）与最高板（两板以下是 null，不画胶囊）。',
      },
    ],
    states: [
      '催化有内容：一行省略号，悬停写全文与来源；没有：写「—」，悬停写原因。',
      '涨停家数取不到（null）：胶囊与卡脚写「—」，不写 0。',
      '最高板不到两板：不画「n板」胶囊。',
      '没有成员：写「暂无涨停成员」。',
      '给了 onOpen：卡脚是按钮；给了 onSelectMember：成员行是按钮，可 Tab、Enter。',
    ],
    donts: ['不要在包里排序：多张卡的次序由调用方给。', '不要传色值或固定卡宽：卡宽跟容器走。'],
    composition:
      'ThemeCards\n  ThemeCard\n    卡头（序号 · 题材名 · 涨停数 · 最高板）\n    催化\n    成员行（时间 · 名称 · StreakBadge）\n    卡脚',
    keys: [
      ['Tab', '到成员行与卡脚按钮（给了回调时）'],
      ['Enter / Space', '触发'],
    ],
  },
  {
    id: 'market-pulse',
    group: 'cn',
    cardHeight: 150,
    title: 'MarketPulse 市场全景条',
    summary:
      '一行横条：上涨占比半圆表盘（中间写百分比，下注「上涨占比」）、五个大数（上涨 / 下跌 / 涨停 / 跌停 / 平盘，涨红跌绿，平盘中性）、大数下两行小字读数（涨停池、昨日口径、成交额与主力净流入），最右嵌涨跌分布柱（DistributionBars）。读数只占三行高（小字最多两行，放不下的收进「+n」点开看全部；容器窄于 900px 分布柱移到第二行最右）；取不到写「—」并可带原因（悬停），不写 0。信息结构取自复盘吧的看盘工作台，样子是 Graphite 的。',
    exports: ['MarketPulse', 'pulseShare', 'dialArc'],
    propParts: [
      { part: 'MarketPulse', note: '渲染一个 div（role=group），不透传别的属性。' },
      {
        part: 'MarketPulseCounts',
        note: '五个大数：rising、falling、limitUp、limitDown、flat；各自是数或 { value, reason }。',
      },
      {
        part: 'MarketPulseReadings',
        note: '小字读数，都可选：缺的写「—」。金额单位是元，按万 / 亿写；highestBoard 是板数。',
      },
      { part: 'pulseShare(counts)', note: '纯函数：上涨 /（上涨 + 下跌 + 平盘），任何一项取不到是 null。' },
      { part: 'dialArc(share)', note: '纯函数：半圆表盘的弧路径（viewBox 100×54）。' },
    ],
    states: [
      '占比由三个家数算；任何一个取不到，表盘不画弧、中间写「—」。也可以直接传 share。',
      '读数取不到：写「—」，悬停写 reason（没给就写默认文案里的说明），不写 0。',
      '主力净流入带正负号，涨色 / 跌色跟 data-updown。',
      '给了 distribution 才在最右画分布柱；不给就不画。',
    ],
    donts: [
      '不要传色值：涨跌只靠语义色调。',
      '不要在包里取数：数据源由调用方接，这里只摆。',
      '不要加第四行读数：条的高度就是三行，多出的读数进「+n」。',
    ],
    composition:
      'MarketPulse\n  表盘（半圆 · 占比 · 说明）\n  五个大数\n  小字读数 × 2 行\n  涨跌分布（DistributionBars）',
    keys: [],
  },
  {
    id: 'limit-up-timeline',
    group: 'cn',
    cardHeight: 520,
    title: 'LimitUpTimeline 涨停时间线',
    summary:
      '蛇形时刻轴：按分钟聚合封板时刻成站点（时间胶囊），一行放几站跟着容器宽度走（每站最少 136px，perRow 是上限），奇数行左到右、偶数行右到左，行尾拐弯、箭头指向较新的时刻、标「越来越早」；站点下挂小卡（名称、连板徽标、题材、成交额万 / 亿，20cm 等标板块）；站点按时段着色（集合竞价 / 早盘 / 午盘 / 尾盘）。顶上有排序（最新在前 / 最早在前）、时段图例（站数与只数）、题材 chip 筛。站点等距，午休与 09:25–09:30 不占宽度。梯队表用 LimitLadder，不在这里。',
    exports: ['LimitUpTimeline', 'groupStations', 'phaseSummary', 'themeCounts', 'filterByTheme', 'snakeRows'],
    propParts: [
      { part: 'LimitUpTimeline', note: '渲染一个 section；排序与题材筛选都可受控也可不受控。' },
      {
        part: 'TimelineItem',
        note: '一只票：code、name、time（首次封板时刻）、可选 streak、themes、amount（元）、board。',
      },
      {
        part: 'groupStations(items, order)',
        note: '纯函数：同一分钟并成一站，排好序；没有时刻或不在交易时间内的放 untimed。',
      },
      { part: 'phaseSummary(stations)', note: '纯函数：四个时段各自的站数与只数。' },
      { part: 'themeCounts(items)', note: '纯函数：题材 chip，按票数从多到少。' },
      { part: 'filterByTheme(items, theme)', note: '纯函数：按题材筛，null 是全部。' },
      { part: 'snakeRows(stations, perRow)', note: '纯函数：蛇形分行，奇数行 ltr、偶数行 rtl。' },
    ],
    states: [
      '最新在前（默认）：第一行从最新的站开始，箭头指向较新的一侧，行尾写「越来越早」；最早在前时反过来写「越来越晚」。',
      '时段图例带计数（n 站 m 只），按当前筛选算；题材 chip 带票数，点一下筛，再点「全部」恢复。',
      '没有封板时刻、或不在 09:15–15:00 的票不上轴，上面一行字报数。',
      '没有票：写空态；成交额取不到写「—」。',
      '给了 onSelect：小卡是按钮，可 Tab、Enter。',
    ],
    donts: [
      '不要按时间比例拉开站点：午休不占宽度，站点等距排。',
      '不要传色值：时段色是 token。',
      '不要在包里取数：封板时刻与成交额由调用方给。',
    ],
    composition:
      'LimitUpTimeline\n  标题与汇总\n  顶栏（排序 ToggleGroup · 时段图例 · 题材 chip）\n  蛇形行\n    站点（时间胶囊 · 轨道 · 小卡）\n      小卡（名称 · StreakBadge · BoardMark · 题材 · 成交额）',
    keys: [
      ['Tab', '到排序、题材 chip、小卡（给了 onSelect 时）'],
      ['Enter / Space', '切换排序与题材，或选中小卡'],
    ],
  },
  {
    id: 'sentiment-gauge',
    group: 'cn',
    cardHeight: 300,
    title: 'SentimentGauge 情绪温度',
    summary:
      '0–100 的读数加五档色带（冰点 / 低迷 / 中性 / 升温 / 高潮，各占 20 分），读数落在哪一档那一档全亮；色带下面是调用方写的口径说明（如「规则评分 · 未历史校准」）；再下面是今昨对比两列（涨停、跌停、封率、开板）。评分怎么算、口径、历史校准都不在包里：分数与说明由调用方给。冰点取跌色、高潮取涨色（跟 data-updown）。',
    exports: ['SentimentGauge', 'sentimentLevel'],
    propParts: [
      { part: 'SentimentGauge', note: '渲染一个 section，不透传别的属性。' },
      {
        part: 'SentimentStats',
        note: '今日或昨日的四项：limitUp、limitDown、sealRate（百分数）、broken；各自是数或 { value, reason }。',
      },
      { part: 'sentimentLevel(score)', note: '纯函数：档位 0–4，每档 20 分；取不到是 null。' },
    ],
    states: [
      '有评分：读数、档名、色带当前档全亮、标记落在分数位置。',
      '评分取不到：读数写「—」，不画标记、没有当前档，悬停写 reason，不写 0。',
      '给了 basis 才有口径说明；给了 today 或 yesterday 才有今昨对比，缺的格写「—」。',
    ],
    donts: ['不要在包里算评分：口径与校准由调用方负责，basis 里写明。', '不要传色值：档的颜色是语义 token。'],
    composition: 'SentimentGauge\n  读数 · 档名\n  五档色带（含标记）\n  口径说明\n  今昨对比表',
    keys: [],
  },
  {
    id: 'layout-rules',
    group: 'layout-primitives',
    cardHeight: 560,
    title: '排版 · 四条规则',
    summary:
      '排版（结构、表现形式）的四条规则：数字用等宽数字；数字右对齐、文字左对齐；块与块之间靠细线和留白、不加框；字号随分量走、不随位置乱改。后面六个排版原语（Stack、Cluster、Sidebar、Switcher、Grid、Reel）管「放在哪、隔多远」，分量（EmphasisProvider）管「这一块多重」，这四条管剩下的细节。',
    exports: [],
    propParts: [
      {
        part: '四条规则',
        note: '没有属性：这一页是规则，不是组件。每条都配了一个小样，样子都是用本页之后的件与 token 摆出来的。',
      },
    ],
    states: [
      '等宽数字：数字列、读数、价格都开 tabular-nums（件里已经开了），自己写的数字也要开。',
      '对齐：表里数字列靠右、文字列靠左，列头跟着本列；卡片里的读数单列，靠左。',
      '分组：块与块之间用 Stack、Cluster 的 gap 留白，必要时一条 1px 细线（--line-100），不套框、不上底色。',
      '字号：由 EmphasisProvider 的分量决定（hero 用 display 档，standard 用 data 档，compact 降一档），不因为它摆在哪一格而改。',
    ],
    donts: [
      '不要给原语加边框或底色去「分块」：要分就加间距，或一条细线。',
      '不要用比例数字写数字列：位数对不齐，读串价位。',
      '不要居中对齐数字列，也不要把文字列靠右。',
      '不要在件外面单独写 font-size 去放大或缩小它：调分量。',
    ],
    composition: 'Stack\n  四条规则各一段（标题、小样、一句说明）',
    keys: [],
  },
  {
    id: 'stack',
    group: 'layout-primitives',
    cardHeight: 220,
    title: 'Stack 竖排',
    summary:
      '竖排：子节点自上而下，之间留同一个间距。间距只收间距刻度名（space-1、space-3 …），不收数字。只管位置与间距，不画边框、不带底色。模式借自 Every Layout 的 Stack，代码自己写。什么时候用：一个面板里的几块、表单的几行、一列读数。',
    exports: ['Stack'],
    propParts: [{ part: 'Stack', note: '其余属性（className、style、aria-*）透传给渲染出的元素。' }],
    states: ['默认：间距 space-3（12px）。', 'as 换成 ul、ol、section 等语义元素。'],
    donts: ['不要给它加边框或底色：它只管位置与间距。', '不要传数字间距：只收刻度名。'],
    composition: 'Stack\n  任意子节点',
    keys: [],
  },
  {
    id: 'cluster',
    group: 'layout-primitives',
    cardHeight: 200,
    title: 'Cluster 横排换行',
    summary:
      '横排，放不下就换行，行与行、块与块用同一个间距。align 管同一行里上下对齐（居中、基线……），justify 管左右分布（靠左、居中、靠右、两端）。什么时候用：一排标签、一排按钮、一排筛选芯片、标题加读数。只管位置与间距。',
    exports: ['Cluster'],
    propParts: [{ part: 'Cluster', note: '其余属性透传给渲染出的元素。' }],
    states: [
      '默认：间距 space-3，纵向居中，靠左。',
      'justify 为 between 时首尾贴边、中间均分（两个子节点就是左右各一个）。',
    ],
    donts: ['不要用它做整页的栅格：等宽的格用 Grid。', '不要给它加边框或底色。'],
    composition: 'Cluster\n  任意子节点',
    keys: [],
  },
  {
    id: 'sidebar',
    group: 'layout-primitives',
    cardHeight: 410,
    title: 'Sidebar 一窄一宽',
    summary:
      '一窄一宽并排，放不下时上下叠。恰好两个子节点：side 是 start 时第一个是窄的，是 end 时最后一个是窄的。窄的固定一个宽度（sideWidth），宽的拿走剩下的；宽的不到 contentMin（容器的一半，起始值）就整体叠成上下两块。sideWidth 收间距刻度名或像素数：刻度最大才 32px，放不下一块侧栏，所以也收数字。预览里的框右下角能拖宽窄。',
    exports: ['Sidebar'],
    propParts: [{ part: 'Sidebar', note: '其余属性透传给渲染出的元素。子节点恰好两个。' }],
    states: [
      '放得下：窄的在 side 指的那一边，宽的占满其余。',
      '放不下（宽的不到 contentMin）：两块各占一整行，上下叠。',
      '默认窄的 240px、contentMin 50%：都是待定的起始值，看 KATANAview 样板时量。',
    ],
    donts: ['不要放两个以上的子节点：多的块要自己包一层。', '不要用它做三栏：嵌两层 Sidebar，或用 Grid。'],
    composition: 'Sidebar\n  窄的一块\n  宽的一块',
    keys: [],
  },
  {
    id: 'switcher',
    group: 'layout-primitives',
    cardHeight: 360,
    title: 'Switcher 并排或竖排',
    summary:
      '一行放几块；容器窄于 threshold（px）时整体变成竖排，不是一块一块地往下掉：要么全在一行，要么全竖着。靠的是容器宽度，不是视口宽度，所以放在窄边栏里也对。什么时候用：两三张并列的卡、一对图表。预览里的框右下角能拖宽窄。',
    exports: ['Switcher'],
    propParts: [{ part: 'Switcher', note: '其余属性透传给渲染出的元素。' }],
    states: [
      '容器宽于 threshold：子节点平分一行。',
      '容器窄于 threshold：子节点各占一行，上下叠。',
      '默认 threshold 480px：待定的起始值，看 KATANAview 样板时量。',
    ],
    donts: ['不要拿它做块数很多的网格：多了用 Grid。', '不要把 threshold 当视口断点：它量的是容器。'],
    composition: 'Switcher\n  两个或更多子节点',
    keys: [],
  },
  {
    id: 'grid',
    group: 'layout-primitives',
    cardHeight: 410,
    title: 'Grid 等宽格',
    summary:
      '等宽格：每格至少 min 宽（默认 240，照 KATANAview 的「面板最小 240」），放得下几列就几列；最后一行不够也保持同宽。容器比一格还窄时一列、不溢出。什么时候用：一排题材卡、一组指标卡。预览里的框右下角能拖宽窄。',
    exports: ['Grid'],
    propParts: [{ part: 'Grid', note: '其余属性透传给渲染出的元素。' }],
    states: ['宽的时候多列，窄的时候少列，最窄一列。', '格数不是列数的整数倍：最后一行靠左，格宽不变。'],
    donts: ['不要拿它做表格：对齐靠列的是 DataGrid。', '不要给格子写死宽度：宽度由 min 与容器定。'],
    composition: 'Grid\n  任意子节点（一个一格）',
    keys: [],
  },
  {
    id: 'reel',
    group: 'layout-primitives',
    cardHeight: 140,
    title: 'Reel 横向滚动',
    summary:
      '一行横向滚动：子节点不缩、不换行，放不下就滚。滚动条照 KATANAview 已定的 4px、平时不可见，悬停或键盘聚焦时才显出来。自己是可聚焦的滚动区（方向键能滚），所以要用 aria-label 给它一个名字。什么时候用：一排题材卡、一排报价卡。预览里的框右下角能拖宽窄。',
    exports: ['Reel'],
    propParts: [{ part: 'Reel', note: '其余属性透传给渲染出的元素；tabIndex 默认 0。' }],
    states: [
      '放得下：不滚，没有滚动条。',
      '放不下：横向滚动，滚动条 4px，悬停或聚焦才显出。',
      '焦点：键盘聚焦时画焦点环，方向键滚动。',
    ],
    donts: ['不要给它写死高度去裁内容。', '不要嵌套横向滚动：里面再放一个 Reel 滚不动。'],
    composition: 'Reel\n  任意子节点（每个不缩）',
    keys: [
      ['Tab', '聚焦滚动区，画焦点环'],
      ['← →', '横向滚动'],
    ],
  },
  {
    id: 'emphasis',
    group: 'layout-primitives',
    cardHeight: 1520,
    title: 'Emphasis 分量',
    summary:
      '分量：同一个组件放在看板顶上当主角、放在中间当正文、放在边栏当一行，该画成什么样。三档：hero（主角：大数用 display 档，配迷你线；一个区里最多一处）、standard（正文，默认：完整的表、图、列表，数据用 data 档）、compact（一行：标签加读数并排，表只留前几行且不出表头，列表一行一条）。用 EmphasisProvider 包一层，里面的件各自读 useEmphasis()，往下继承，里层盖住外层。分量只改字号档、显示多少、要不要表头；不改颜色，不改密度（密度仍由 data-density 管）。现在认分量的：QuoteCard、PriceTag、GaugeBar、DataGrid、NewsFeed；别的件照 standard 画。',
    exports: ['EmphasisProvider', 'useEmphasis'],
    propParts: [
      { part: 'EmphasisProvider', note: '只渲染 context，不渲染元素。' },
      {
        part: 'useEmphasis',
        note: '钩子：读最近一层 EmphasisProvider 给的分量（hero、standard 或 compact），没有就是 standard。',
      },
    ],
    states: [
      'hero：QuoteCard、PriceTag、GaugeBar 的数用 display 档（QuoteCard 的迷你图加高）；DataGrid、NewsFeed 内容不变、字上一档。',
      'standard：不包 Provider 时的样子。',
      'compact：QuoteCard 名字、价格、涨跌并排，不画迷你图与下面一行；GaugeBar 只留名字、数、档位词；DataGrid 不出表头、只留排好序之后的前 5 行，表下面写「另有 N 行」（文案由宿主 texts.moreRows 给，不静默截断），列只留名称与主数两列（列声明标 compact: true 的列；一列都没标就留前两个可见列），名称列吃掉剩下的宽度、超长省略号截断；NewsFeed 一行一条（时间加标题），不画标题行、频道、搜索、过滤、来源、品种、快捷操作。',
    ],
    donts: [
      '不要在一个区里放两个 hero：主角只有一个。',
      '不要用分量去改颜色或密度：颜色看语义 token，密度看 data-density。',
      '不要给件单独传「小一点」之类的样式：包一层 EmphasisProvider。',
    ],
    composition: 'EmphasisProvider（value）\n  认分量的件（读 useEmphasis）\n  EmphasisProvider（里层盖住外层）',
    keys: [],
  },
  {
    id: 'emphasis-guide',
    group: 'decisions',
    cardHeight: 310,
    title: '这一块用哪档分量',
    summary:
      '三档分量各什么时候用：hero 给这个区里用户第一眼要看的那一个数（一个区最多一处），standard 给区里读、比、点的主体内容（拿不准就用它），compact 给看一眼就走的边角（边栏、列表项里）。选档看这一块在这个区里的重要程度，不看它摆在哪个位置。表里的件名链到各自的组件页；档位的具体样子见 Emphasis 分量页。',
    exports: [],
    propParts: [{ part: '三档', note: '没有属性：这一页是选法，不是组件。用法见 Emphasis 分量页。' }],
    states: [
      'hero：指数、账户权益、当前品种的价。一个区里最多一处。',
      'standard：完整的表、图、列表；不确定时用它，也是不包 Provider 时的样子。',
      'compact：边栏、列表项里、卡片的角落：标签加读数并排、表前几行、列表一行一条。',
    ],
    donts: [
      '不要把所有块都设成 hero：什么都是主角就没有主角。',
      '不要因为「空间小」就把应该读的表设成 compact：compact 的表只有前几行、没有表头、只剩两列。',
      '不要为了换个样子去改件的字号：改分量。',
    ],
    composition:
      'EmphasisProvider（hero，一个区一处）\nEmphasisProvider（standard，默认）\nEmphasisProvider（compact，边栏里的一行）',
    keys: [],
  },
]

export const pageById = (id: string): DocPage | undefined => PAGES.find((page) => page.id === id)
