// SPDX-License-Identifier: MIT
// 组件文档站的目录与每页的文字（#1860）：只有数据，不引组件，单测（registry.test.ts）拿它跟 src/index.ts 的出口对账。
// 版式照 kobra.systems/components/<件名> 的结构（2026-11-14 读）：左侧目录按类分组，右侧一个组件一页，页上依次是预览、属性、组成、键盘。
// 属性表手写，跟组件的 TS 类型对：改了组件的属性要同步改这里（Radix 底座透传的属性不逐条列，每张表的说明里写透传给谁）。

export type GroupId = 'forms' | 'overlays' | 'layout' | 'readouts' | 'feedback' | 'quotes' | 'quant' | 'blocks'

export const GROUPS: readonly { id: GroupId; title: string }[] = [
  { id: 'forms', title: '表单控件' },
  { id: 'overlays', title: '浮层' },
  { id: 'layout', title: '布局与导航' },
  { id: 'readouts', title: '读数与状态' },
  { id: 'feedback', title: '反馈' },
  { id: 'quotes', title: '报价与行情' },
  { id: 'quant', title: '量化' },
  { id: 'blocks', title: '积木' },
]

export type PropRow = { name: string; type: string; default?: string; desc: string }
export type PropTable = { part: string; note?: string; rows: readonly PropRow[] }

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
  props: readonly PropTable[]
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
export const NON_COMPONENT_EXPORTS: readonly string[] = ['cn', 'focusRing', 'focusRingInset', 'InlineOverlays']

const RADIX = (name: string) => `其余属性透传给 Radix ${name}。`

export const PAGES: readonly DocPage[] = [
  {
    id: 'button',
    group: 'forms',
    cardHeight: 350,
    title: 'Button 按钮',
    summary:
      '30 高的默认按钮，六种变体与三种尺寸；悬停提亮、按下缩到 0.97，禁用降到 45% 不透明度。颜色只读 actionable（bold = primary、subtle = icon、negative = danger）、content、separable、focused 这几类 characteristic，高度与内距读密度（data-density 的 size-base、size-row、spacing-*）；「主题 × 密度」那三行在 high、medium、low 下各摆一遍。',
    exports: ['Button', 'buttonVariants'],
    props: [
      {
        part: 'Button',
        note: '其余属性透传给原生 button；type 默认 button，放进表单不会误提交。',
        rows: [
          {
            name: 'variant',
            type: "'default' | 'primary' | 'danger' | 'ghost' | 'icon' | 'link'",
            default: "'default'",
            desc: 'primary 是实心浅色主按钮；danger 字色走危险色；icon 是 28 见方无边的图标钮。',
          },
          {
            name: 'size',
            type: "'default' | 'sm' | 'icon'",
            default: "'default'",
            desc: 'default 30 高；sm 26 高圆角 8；icon 28 见方。',
          },
          {
            name: 'asChild',
            type: 'boolean',
            default: 'false',
            desc: '渲染成子元素自己（链接、菜单触发器），不套一层 button。',
          },
        ],
      },
      {
        part: 'buttonVariants',
        note: '返回类名的函数，给不是 button 的元素画成按钮（包着文件输入的 label 之类）。',
        rows: [
          { name: 'variant', type: '同 Button', desc: '同上。' },
          { name: 'size', type: '同 Button', desc: '同上。' },
        ],
      },
    ],
    states: [
      '默认：4% 白底 8% 白边，悬停提亮，按下缩到 0.97。',
      '禁用：45% 不透明度，不响应指针。',
      '焦点：键盘 Tab 到时画 focus-ring 的外框。',
    ],
    donts: ['不要在一个区域放两个主要按钮。', '图标按钮必须带 aria-label。', '不要用颜色以外没有字的危险按钮。'],
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
    summary: '单行文本框：30 高（sm 26 高），4% 白底 8% 白边；聚焦边变亮，禁用降到 45%。',
    exports: ['Input', 'inputVariants'],
    props: [
      {
        part: 'Input',
        note: '其余属性透传给原生 input；type 默认 text。',
        rows: [
          {
            name: 'size',
            type: "'default' | 'sm'",
            default: "'default'",
            desc: 'default 30 高；sm 26 高、字号取 data 档。',
          },
        ],
      },
      {
        part: 'inputVariants',
        note: '返回类名的函数，给 textarea 等非 input 元素用。',
        rows: [
          { name: 'size', type: "'default' | 'sm'", default: "'default'", desc: '同 Input。' },
          { name: 'multiline', type: 'boolean', default: 'false', desc: '多行：高度由内容定。' },
        ],
      },
    ],
    states: ['默认、有值、禁用。', 'aria-invalid 时边框变危险色。', '焦点：边框提亮（focus-ring）。'],
    donts: ['不要不带 label 就放出去。', '不要在占位符里放必须读的信息。'],
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
    props: [
      {
        part: 'Select',
        note: RADIX('Select.Root'),
        rows: [
          { name: 'value', type: 'string', desc: '当前值；传空串显示 SelectValue 的 placeholder。' },
          { name: 'onValueChange', type: '(value: string) => void', desc: '选了一项。' },
          { name: 'disabled', type: 'boolean', desc: '整个下拉灰掉。' },
        ],
      },
      {
        part: 'SelectTrigger',
        note: RADIX('Select.Trigger') + '没有可见文字时要给 aria-label。',
        rows: [{ name: 'className', type: 'string', desc: '追加类名（宽度、对齐在这里调）。' }],
      },
      {
        part: 'SelectValue',
        note: RADIX('Select.Value'),
        rows: [{ name: 'placeholder', type: 'ReactNode', desc: '没有值时写的字，文案由调用方传。' }],
      },
      {
        part: 'SelectItem',
        note: RADIX('Select.Item'),
        rows: [
          { name: 'value', type: 'string', desc: '这一项的值。' },
          { name: 'leading', type: 'ReactNode', desc: '文字前面的东西（色带之类），不进触发器上的值。' },
        ],
      },
      { part: 'SelectContent', note: RADIX('Select.Content') + '位置固定在触发器下方，偏移 2px。', rows: [] },
      { part: 'SelectArrow', note: '触发器右边的小箭头，自己拼触发器时用。', rows: [] },
      {
        part: 'selectTriggerVariants / selectItemClass',
        note: '触发器与列表项的类名，MultiSelect 与应用里别的下拉用它们跟单选下拉长一个样。',
        rows: [],
      },
    ],
    states: ['默认、已选、未选（占位）、禁用。', '展开：列表项左侧留一列放勾；当前项加粗。'],
    donts: ['不要把可以直接点的两三个选项藏进下拉。'],
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
    props: [
      {
        part: 'MultiSelect',
        rows: [
          { name: 'values', type: 'readonly string[]', desc: '已选项的 id。' },
          {
            name: 'options',
            type: 'readonly (readonly [string, string])[]',
            desc: '[id, 显示的字]，按这个顺序显示与上报。',
          },
          { name: 'onValuesChange', type: '(values: string[]) => void', desc: '切了一项后的整组 id。' },
          { name: 'empty', type: 'string', desc: '一个都没选时触发器上写的字。' },
          { name: 'separator', type: 'string', desc: '已选项名字之间的分隔。' },
          { name: 'label', type: 'string', desc: '触发器的读屏名字。' },
          { name: 'width', type: 'number', desc: '触发器宽度（px）。' },
          {
            name: 'triggerClassName / contentClassName',
            type: 'string',
            desc: '应用里的样式与测试按这两个类找触发器与弹层。',
          },
        ],
      },
    ],
    states: [
      '一个都没选：写 empty。',
      '已选若干：按选项的顺序写名字，separator 隔开。',
      '点一项只切这一项，列表不收。',
    ],
    donts: ['不要在包里写死分隔符与空态文案，由调用方传。'],
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
    summary: '14px 凹陷方框；选中后中心一块 6px 橙色发光方块（像一颗 LED），框换暗橙边、暗橙底，不画勾。',
    exports: ['Checkbox'],
    props: [
      {
        part: 'Checkbox',
        note: RADIX('Checkbox.Root'),
        rows: [
          { name: 'checked', type: "boolean | 'indeterminate'", desc: '受控的选中状态。' },
          { name: 'defaultChecked', type: 'boolean', desc: '不受控的初值。' },
          { name: 'onCheckedChange', type: "(checked: boolean | 'indeterminate') => void", desc: '点了。' },
          { name: 'disabled', type: 'boolean', desc: '灰掉，不响应。' },
          { name: 'aria-invalid', type: 'boolean', desc: '为真时框边变红。' },
        ],
      },
    ],
    states: ['未勾、已勾、禁用、禁用已勾、错误（aria-invalid）。'],
    donts: ['不要让勾选框单独承载状态而不带文字。'],
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
    props: [
      {
        part: 'Switch',
        note: RADIX('Switch.Root'),
        rows: [
          { name: 'checked', type: 'boolean', desc: '受控的开关状态。' },
          { name: 'defaultChecked', type: 'boolean', desc: '不受控的初值。' },
          { name: 'onCheckedChange', type: '(checked: boolean) => void', desc: '拨了一下。' },
          { name: 'disabled', type: 'boolean', desc: '灰掉，不响应。' },
        ],
      },
    ],
    states: ['关、开、禁用关、禁用开。'],
    donts: ['不要用开关做「提交」这类一次性动作。'],
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
    props: [
      {
        part: 'ToggleGroup',
        note: RADIX('ToggleGroup.Root') + '单选语义：点已选中的项不会取消。',
        rows: [
          { name: 'value', type: 'string | null', desc: '当前选中项；null 是一个都没选。' },
          { name: 'onValueChange', type: '(value: string) => void', desc: '选了另一项。' },
          {
            name: 'variant',
            type: "'default' | 'sm'",
            default: "'default'",
            desc: 'default 带边的设置页样式；sm 是 26 高的工具条样式。',
          },
          { name: 'pillClassName / textClassName', type: 'string', desc: '选中块、文字外壳上追加的类名。' },
        ],
      },
      {
        part: 'ToggleGroupItem',
        note: RADIX('ToggleGroup.Item'),
        rows: [
          { name: 'value', type: 'string', desc: '这一项的值。' },
          { name: 'disabled', type: 'boolean', desc: '这一项灰掉。' },
        ],
      },
      { part: 'toggleGroupVariants / toggleItemVariants', note: '外壳与按钮的类名函数。', rows: [] },
    ],
    states: ['选中、未选、禁用项。', '键盘 Tab 到每个按钮，Space 或 Enter 选中。'],
    donts: ['超过五项换 Select。'],
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
          { name: 'clearLabel', type: 'string', desc: '给了，有选中项时末尾出现清除钮，读屏名与提示用它。' },
        ],
      },
    ],
    states: [
      '未选：4% 白底。',
      '选中：实心浅底深字（同分段切换）。',
      '禁用：降到 35% 不透明度。',
      '有选中项且给了 clearLabel：末尾出现 ×。',
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
    summary: '凹槽轨 + 点阵填充 + 发光圆把手；拖动跟手，松手 settle 弹簧吸附到步进；一个值或一段范围。',
    exports: ['Slider'],
    props: [
      {
        part: 'Slider',
        note: RADIX('Slider.Root') + '只做横向，受控。',
        rows: [
          { name: 'value', type: 'readonly number[]', desc: '每个把手一个值；两个值是范围。' },
          { name: 'onValueChange', type: '(value: number[]) => void', desc: '拖动时每一步都调。' },
          {
            name: 'onValueCommit',
            type: '(value: number[]) => void',
            desc: '松手或键盘改完一步时调，存东西放这里。',
          },
          { name: 'min / max / step', type: 'number', default: '0 / 100 / 1', desc: '范围与步进。' },
          {
            name: 'thumbLabels',
            type: 'readonly string[]',
            desc: '每个把手的读屏名字（名字只放在真正的 slider 上）。',
          },
          { name: 'disabled', type: 'boolean', desc: '灰掉，不能拖。' },
        ],
      },
    ],
    states: ['单值、区间、禁用。', '键盘 ← → 走一格。'],
    donts: ['滑钮必须有 thumbLabels。'],
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
    props: [
      {
        part: 'TooltipProvider',
        note: RADIX('Tooltip.Provider'),
        rows: [{ name: 'delayDuration', type: 'number', default: '0', desc: '悬停多少毫秒后出现。' }],
      },
      {
        part: 'Tooltip',
        note: RADIX('Tooltip.Root'),
        rows: [{ name: 'defaultOpen / open', type: 'boolean', desc: '初始或受控的开合。' }],
      },
      { part: 'TooltipTrigger', note: RADIX('Tooltip.Trigger') + '用 asChild 套在按钮上。', rows: [] },
      {
        part: 'TooltipContent',
        note: RADIX('Tooltip.Content'),
        rows: [{ name: 'sideOffset', type: 'number', default: '6', desc: '离触发器的距离。' }],
      },
      { part: 'tooltipContentClass', note: '提示的皮肤类名，应用里自己定位的提示（图表悬停）借它长一个样。', rows: [] },
    ],
    states: ['触发器静止；悬停或聚焦后浮出提示（默认没有延迟）。'],
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
    props: [
      {
        part: 'Popover',
        note: RADIX('Popover.Root'),
        rows: [{ name: 'open / onOpenChange', type: 'boolean / (open: boolean) => void', desc: '受控的开合。' }],
      },
      {
        part: 'PopoverContent',
        note: RADIX('Popover.Content'),
        rows: [
          { name: 'variant', type: "'panel' | 'menu' | 'bare'", default: "'panel'", desc: '皮肤。' },
          { name: 'align', type: "'start' | 'center' | 'end'", default: "'center'", desc: '对齐触发器的哪一边。' },
          { name: 'sideOffset', type: 'number', default: '4', desc: '离触发器的距离。' },
        ],
      },
      {
        part: 'PopoverTrigger / PopoverAnchor / PopoverClose',
        note: '透传 Radix 同名部件；Anchor 用来把弹层定位在触发器以外的元素上。',
        rows: [],
      },
      { part: 'PopoverHeader / PopoverTitle / PopoverDescription', note: '面板里的标题区，纯排版。', rows: [] },
      {
        part: 'useHoverOpen',
        note: 'Radix 没有悬停打开，这个钩子补上：返回 open、setOpen 与挂在触发器和内容上的 hover 事件。',
        rows: [
          { name: 'openDelay', type: 'number', desc: '停在触发器上多少毫秒后开。' },
          { name: 'closeDelay', type: 'number', desc: '离开触发器与弹层多少毫秒后收。' },
        ],
      },
    ],
    states: ['收起；打开后焦点落进去，Esc 收起并还回焦点。', '三种皮肤：panel、menu、bare。'],
    donts: ['不要在弹层里再开弹层。'],
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
    props: [
      {
        part: 'Dialog',
        note: RADIX('Dialog.Root'),
        rows: [
          {
            name: 'open / onOpenChange',
            type: 'boolean / (open: boolean) => void',
            desc: '受控的开合；代码开的对话框用它。',
          },
        ],
      },
      {
        part: 'DialogContent',
        note: RADIX('Dialog.Content'),
        rows: [
          {
            name: 'closeLabel',
            type: 'string',
            desc: '给了就在标题栏右上角画关闭钮，读屏读这个名字；包里不放文案。',
          },
          { name: 'bare', type: 'boolean', desc: '不带皮肤，样子由调用方的类名给。' },
          { name: 'overlayClassName', type: 'string', desc: '遮罩上追加的类名。' },
        ],
      },
      {
        part: 'DialogTitle',
        note: RADIX('Dialog.Title'),
        rows: [{ name: 'bare', type: 'boolean', desc: '不带标题样式。' }],
      },
      { part: 'DialogHeader / DialogBody / DialogFooter', note: '标题栏（50 高）、正文、按钮栏，纯排版。', rows: [] },
      {
        part: 'DialogTrigger / DialogClose / DialogDescription / DialogPortal / DialogOverlay',
        note: '透传 Radix 同名部件。',
        rows: [],
      },
    ],
    states: ['收起；打开后焦点圈在对话框里，Esc 关闭并还回焦点。'],
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
    props: [
      {
        part: 'DropdownMenu / DropdownMenuTrigger / DropdownMenuContent',
        note: RADIX('DropdownMenu 的同名部件'),
        rows: [],
      },
      {
        part: 'DropdownMenuItem',
        note: RADIX('DropdownMenu.Item'),
        rows: [
          { name: 'variant', type: "'default' | 'danger'", default: "'default'", desc: 'danger 字色走危险色。' },
          { name: 'bare', type: 'boolean', desc: '不带行皮肤。' },
          { name: 'onSelect', type: '(event: Event) => void', desc: '选中（一次点击只叫一次）。' },
        ],
      },
      {
        part: 'DropdownMenuCheckboxItem / DropdownMenuRadioGroup / DropdownMenuRadioItem',
        note: '勾选项与单选组，透传 Radix 同名部件（checked / onCheckedChange、value / onValueChange）。',
        rows: [],
      },
      {
        part: 'DropdownMenuSub / DropdownMenuSubTrigger / DropdownMenuSubContent',
        note: '二级菜单。安全三角：斜着朝二级走时路过下一行不误收。',
        rows: [],
      },
      {
        part: 'DropdownMenuLabel / DropdownMenuSeparator / DropdownMenuShortcut / DropdownMenuGroup / DropdownMenuPortal',
        note: '分组标题、分隔线、快捷键提示（右对齐）、分组、传送门。',
        rows: [],
      },
      {
        part: 'menuContainerClass / menuRowClass / menuSeparatorClass',
        note: '菜单容器、行、分隔线的类名，别的浮层（Popover 的 menu 皮肤、应用里的菜单）借它们长一个样。',
        rows: [],
      },
      {
        part: 'useMenuParts / MenuCheckColumn / MenuItemIcon / MenuItemLabel / MenuItemHint',
        note: '行内的对齐列：勾选列、图标、文字、右侧提示；useMenuParts 让同一份菜单内容既能画在下拉菜单里也能画在右键菜单里。',
        rows: [],
      },
    ],
    states: ['行：默认、悬停、禁用、危险。', '勾选行左侧占一列放勾。'],
    donts: ['菜单项不超过一屏，更长的换命令面板。'],
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
    props: [
      {
        part: 'ContextMenu / ContextMenuTrigger / ContextMenuContent',
        note: RADIX('ContextMenu 的同名部件') + '触发器常用 asChild 套在要响应右键的元素上。',
        rows: [],
      },
      {
        part: 'ContextMenuItem',
        note: RADIX('ContextMenu.Item'),
        rows: [
          { name: 'variant', type: "'default' | 'danger'", default: "'default'", desc: 'danger 字色走危险色。' },
          { name: 'onSelect', type: '(event: Event) => void', desc: '选中（一次点击只叫一次）。' },
        ],
      },
      { part: '其余部件', note: '与 DropdownMenu 的同名部件一一对应，属性也相同。', rows: [] },
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
    props: [
      {
        part: 'Tabs',
        note: RADIX('Tabs.Root'),
        rows: [
          {
            name: 'value / defaultValue / onValueChange',
            type: 'string / string / (value: string) => void',
            desc: '受控与不受控。',
          },
          { name: 'bare', type: 'boolean', desc: '不带皮肤。' },
        ],
      },
      {
        part: 'TabsList',
        note: RADIX('Tabs.List') + 'tabsListVariants 是它的类名函数。',
        rows: [
          {
            name: 'variant',
            type: "'default' | 'line' | 'bare'",
            default: "'default'",
            desc: 'bare 不带皮肤，样子由调用方的类名给。',
          },
        ],
      },
      {
        part: 'TabsTrigger',
        note: RADIX('Tabs.Trigger'),
        rows: [
          { name: 'value', type: 'string', desc: '对应 TabsContent 的 value。' },
          { name: 'disabled', type: 'boolean', desc: '这一页签灰掉。' },
          { name: 'bare', type: 'boolean', desc: '不带皮肤。' },
        ],
      },
      {
        part: 'TabsContent',
        note: RADIX('Tabs.Content'),
        rows: [{ name: 'value', type: 'string', desc: '对应 TabsTrigger 的 value。' }],
      },
    ],
    states: ['选中、未选、禁用页签。', '默认与 line 两种样式。'],
    donts: ['页签名保持短，一行放得下。'],
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
    props: [
      {
        part: 'Accordion',
        note: RADIX('Accordion.Root'),
        rows: [
          { name: 'type', type: "'single' | 'multiple'", desc: '同时能展开一项还是多项（必填）。' },
          { name: 'collapsible', type: 'boolean', desc: 'single 时能不能把唯一展开的那项也收起。' },
          { name: 'defaultValue / value', type: 'string | string[]', desc: '展开的项。' },
        ],
      },
      {
        part: 'AccordionItem',
        note: RADIX('Accordion.Item'),
        rows: [{ name: 'value', type: 'string', desc: '这一项的值。' }],
      },
      {
        part: 'AccordionTrigger / AccordionContent',
        note: '标题行（带箭头）与展开的内容，透传 Radix 同名部件。',
        rows: [],
      },
    ],
    states: ['展开、收起。', '键盘 ↑ ↓ 在标题间走，Enter 或 Space 展开。'],
    donts: ['不要把用户必须读的内容收起来。'],
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
    props: [
      {
        part: 'Led',
        note: '一个 role=img 的 span，名字是 label。',
        rows: [
          {
            name: 'state',
            type: "'off' | 'on' | 'ok' | 'warn' | 'danger'",
            default: "'off'",
            desc: 'on 是橙色发光，ok / warn / danger 是绿、琥珀、红。',
          },
          {
            name: 'group',
            type: "'A' | 'B' | 'C' | 'D' | null",
            desc: '联动组：同组的面板跟着同一个品种走；给了就用组的颜色，盖过 state。',
          },
          { name: 'hollow', type: 'boolean', desc: '空心：透明底加 1px 边，不发光。' },
          {
            name: 'bare',
            type: 'boolean',
            desc: '旁边没有写出状态的文字时给：熄灭态画一圈 3:1 的环，不靠几乎看不见的暗点（WCAG 1.4.11）。',
          },
          { name: 'small', type: 'boolean', desc: '6px 的小灯，药丸这样的行内小件里用。' },
          { name: 'label', type: 'string', desc: '读屏名（必填）。' },
        ],
      },
      {
        part: 'LINK_GROUPS',
        note: '联动组名的列表 A、B、C、D；组的颜色是 token link-a 到 link-d。',
        rows: [],
      },
    ],
    states: ['熄灭（默认）、on、ok、warn、danger；联动组按组色。', '空心、小号两种形态；无文字的灯必须带读屏名。'],
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
    props: [
      {
        part: 'Lcd',
        rows: [
          { name: 'label', type: 'string', desc: '点阵小标签。' },
          { name: 'value', type: 'string | null', desc: '读数；没有数据传 null，显示「—」。' },
          {
            name: 'tone',
            type: "'neutral' | 'up' | 'down' | 'accent' | 'warn'",
            default: "'neutral'",
            desc: '数值颜色：中性、涨、跌、当前关注（橙）、警告（琥珀）。',
          },
          { name: 'note', type: 'string', desc: '数字下面一行 10px 小字（单位、口径）；不放第二个数值。' },
          { name: 'inline', type: 'boolean', desc: '标签与数字排成一行。' },
          { name: 'fill', type: 'boolean', desc: '撑满所在的格子（KPI 行里每格一个）；默认按内容收缩。' },
        ],
      },
    ],
    states: [
      '有值：标签在上、数字在中、小字在下。',
      '没有数据：数字位置写「—」，不写 0。',
      '色调：up、down、accent、warn，或不着色。',
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
    props: [
      {
        part: 'DotMatrix',
        note: '返回一个 SVG pattern，放进 <svg><defs>，用 fill="url(#id)" 引用。',
        rows: [
          { name: 'id', type: 'string', desc: 'pattern 的 id；同一页面里每张图要不同。' },
          { name: 'color', type: 'string', default: "'var(--seq-300)'", desc: '点的填充色。' },
        ],
      },
      {
        part: 'DOT_SIZE / DOT_PITCH',
        note: '点的边长 4 与点距 6（像素），给要自己算对齐的图表用。',
        rows: [],
      },
    ],
    states: ['静态纹理：4px 实、2px 空；颜色默认取中性，可传 token。'],
    donts: ['不要用它代替需要读数的实色块；它只给面（回撤面等）。'],
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
    props: [
      {
        part: 'RollingText',
        note: '旧字只在样式里画，不进文本：复制、读屏拿到的只有当前的完整数字。',
        rows: [
          { name: 'text', type: 'string', desc: '要显示的整串数字（含千分位、小数点）。' },
          { name: 'value', type: 'number', desc: '同一个数的数值，用来判断涨跌方向。' },
          {
            name: 'animate',
            type: 'boolean',
            desc: 'false 时直接换字不滚（十字线在看历史）；位数变了、距上次滚动不到 1 秒也直接换。',
          },
        ],
      },
      {
        part: 'rollSlots',
        note: '纯函数 (text, from, rolling)：每一位的当前字，和滚出去的旧字。',
        rows: [],
      },
      {
        part: 'rollStrip',
        note: '纯函数 (char, out, direction)：一位从旧字转到新字时转轮上经过的字（一行一个）与格数；9 到 0 走一格，不是数字的位只走一格。',
        rows: [],
      },
    ],
    states: ['值没变：静止。', '值变了：变了的那几位滚动，涨往上、跌往下，整串闪一下涨色或跌色。'],
    donts: ['值没变时不要滚；价格、盈亏的变化只用它给的一次闪，不再加别的动效。'],
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
    props: [
      {
        part: 'BadgeGroup',
        note: '没有徽标时什么都不画。每个徽标是一个 role=img，名字是全称，读屏读「科创板：涨跌幅 20%」。',
        rows: [
          {
            name: 'items',
            type: '{ id: string; label: string; text: string }[]',
            desc: 'label 是上标上的字（单字），text 是全称（读屏名与悬停提示）。',
          },
        ],
      },
    ],
    states: ['次要文字色的上标小字；悬停写全称。'],
    donts: ['不要用它放必须读的信息：它在品种名旁边，是次要的。'],
    composition: 'BadgeGroup',
    keys: [],
  },
  {
    id: 'kbd',
    group: 'readouts',
    cardHeight: 88,
    title: 'Kbd 快捷键方块',
    summary: '把一个快捷键组合画成一串小方块：20 高、圆角 4、6% 白底 12% 白边。',
    exports: ['Kbd'],
    props: [
      {
        part: 'Kbd',
        note: '怎么把「Mod+Shift+H」拆成块、Mod 在这个平台叫什么，是调用方的事。',
        rows: [
          { name: 'parts', type: 'readonly string[]', desc: '每一块上的字。' },
          { name: 'label', type: 'string', desc: '读屏读的整串（必填）。' },
        ],
      },
    ],
    states: ['一个组合画成一串小方块；单键与多键。'],
    donts: ['不要把快捷键写成普通文字加方括号。'],
    composition: 'Kbd',
    keys: [],
  },
  {
    id: 'symbol-mark',
    group: 'readouts',
    cardHeight: 220,
    title: 'SymbolMark 品种徽标',
    summary:
      '品种名前的小圆标（学 TradingView 列表里企业 / 币种标志）：有图显示圆形裁切的图片，加载失败退回字母；没有图就是字母圆标，底 bg-400、字 ink-200，不按代码随机上色。尺寸默认 18（行高 28 的一行）。',
    exports: ['SymbolMark', 'symbolMarkLetters'],
    props: [
      {
        part: 'SymbolMark',
        note: '图片从哪来由调用方给；件里不带任何企业或币种的标志（商标）。读屏名用 name，没有就用 code。',
        rows: [
          { name: 'code', type: 'string', desc: '品种代码；字母圆标取其中的拉丁字母前 2 个。' },
          { name: 'name', type: 'string', desc: '名称：读屏名；代码里没有字母（600519、00700）时取名称首字。' },
          { name: 'src', type: 'string', desc: '图片地址；不给或加载失败就画字母。' },
          { name: 'size', type: 'number', default: '18', desc: '直径（像素）。' },
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
    states: ['字母圆标；有图；图加载失败退回字母。'],
    donts: ['不要按代码随机上色：颜色留给数据。', '不要在件里内置真实公司或币种的标志。'],
    composition: 'SymbolMark\n  span[role=img][aria-label]\n    img（有图且没失败）| span 字母',
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
          { name: 'onValue', type: '(next: string | null) => void', desc: '录到新的或清除。冲突与不合规的不回调。' },
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
    props: [
      {
        part: 'NumberInput',
        note: '角色是 spinbutton，带当前值与范围；只在值合法时回调，回调的值一定在 min / max 之内。',
        rows: [
          { name: 'value', type: 'number', desc: '当前值。' },
          { name: 'onValue', type: '(value: number) => void', desc: '值变了。空串、非数字不回调。' },
          { name: 'unit', type: 'string', desc: '单位后缀；给了读屏读「值 + 单位」。' },
          { name: 'min / max', type: 'number', desc: '范围；越界夹进去。' },
          { name: 'step', type: 'number', default: '1', desc: '步长。' },
          { name: 'size', type: "'sm'", desc: '26 高；默认 30 高。' },
          { name: 'width', type: 'number', default: '96', desc: '框宽（像素）。' },
          { name: 'label', type: 'string', desc: '读屏名。' },
          { name: 'invalid', type: 'boolean', desc: '红边。' },
          { name: 'disabled', type: 'boolean', desc: '灰掉：不能打字、不能拖、方向键不动它。' },
          {
            name: 'autoValue / autoText',
            type: 'number / string',
            desc: '哨兵值：值等于 autoValue 又没在打字时，框里写 autoText，不把内部的数露给用户。',
          },
          {
            name: 'expression',
            type: 'boolean',
            default: 'false',
            desc: '框里可以写算式，回车或离开时按当前值算：+10、*2、/4、+10%（×1.1）、100*1.5；Esc 放弃，写不成算式的字标红。',
          },
          { name: 'caption', type: 'string', desc: '框内左边的文字标签；拖它与拖整个框一样改值。' },
        ],
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
    props: [
      {
        part: 'DateTimeInput',
        note: '值一律是字符串（日期 YYYY-MM-DD，时刻 HH:mm 或 HH:mm:ss，空串是没填完）；按哪个时区解读由调用方定。',
        rows: [
          { name: 'label', type: 'string', desc: '字段名，拼进读屏名。' },
          { name: 'date / onDate', type: 'string / (value: string) => void', desc: '日期。' },
          { name: 'time / onTime', type: 'string / (value: string) => void', desc: '时刻；不给 onTime 就只有日期。' },
          { name: 'seconds', type: 'boolean', default: 'false', desc: '时刻带秒。' },
          {
            name: 'min / max',
            type: 'string',
            desc: '能选的最早、最晚日期；范围外的日子灰着点不了，打进去的标成不合法。',
          },
          { name: 'size', type: "'sm'", desc: '26 高。' },
          { name: 'labels', type: 'DateTimeLabels', desc: '读屏名与按钮名（包里不带文字，调用方按界面语言给）。' },
          { name: 'locale', type: 'string', desc: '给 react-aria 的语言：zh-CN 或 en-CA，都是年-月-日的顺序。' },
          { name: 'autoFocus / className', type: 'boolean / string', desc: '照原生。' },
        ],
      },
    ],
    states: ['默认、聚焦、错误（日期或时间不合法）。', '日期框右边的日历按钮打开日历。'],
    donts: ['不要依赖浏览器语言的日期格式：这个件不随它变。'],
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
            name: 'onValue',
            type: '(range: DateRange) => void',
            desc: '凑成合法区间（起点不晚于终点）才回调；只填了一头不回调。',
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
      '等数据的那一块：500ms 内到了什么也不画；超过了出点阵骨架，2s 说「仍在加载」，10s 转琥珀条加重试。不脉冲、不转圈。',
    exports: ['Skeleton', 'Loading', 'LoadingBoundary', 'LoadingView'],
    props: [
      {
        part: 'Skeleton',
        rows: [
          { name: 'label', type: 'string', desc: '读屏读的话（必填）。' },
          { name: 'lines', type: 'number', desc: '画几行。' },
          { name: 'rows', type: 'boolean', default: 'false', desc: '撑满面板主体时每行占一个表格行高。' },
        ],
      },
      {
        part: 'Loading',
        note: 'pending 为真时 children 不挂载；骨架出过的内容用 2px 模糊揭示，没出过的直接出现。只管显示，不管取数。',
        rows: [
          { name: 'texts', type: 'LoadingTexts', desc: '全部文字（包里不带文字）。' },
          { name: 'pending', type: 'boolean', desc: '在等吗。' },
          { name: 'what / source', type: 'string', desc: 'caption「加载 <what> · <source>」的两段；source 没有就省。' },
          { name: 'lines', type: 'number', default: '3', desc: '不知道可见高度时画几行。' },
          { name: 'fill', type: 'boolean', default: 'false', desc: '撑满父级，行数按容器高度量。' },
          { name: 'header', type: 'ReactNode', desc: '已经知道的真表头，骨架只占它下面。' },
          { name: 'onRetry', type: '() => void', desc: '给了，10 秒后的琥珀条上才有重试。' },
          { name: 'label', type: 'string', desc: '骨架的读屏名，不给用 texts.skeleton。' },
        ],
      },
      {
        part: 'LoadingBoundary',
        note: 'Suspense 的写法：等的是 React.lazy 或 use() 的 promise；属性同 Loading，没有 pending、source、header。',
        rows: [],
      },
      {
        part: 'LoadingView',
        note: '只管画「在等」这一块，计时与量高度不在这里；通常不直接用。',
        rows: [
          { name: 'phase', type: "'loading' | 'slow' | 'timeout' | null", desc: '当前这一段；null 什么也不画。' },
          { name: 'texts', type: 'LoadingTexts', desc: '文字。' },
          {
            name: 'rows / measured / fill',
            type: 'number / boolean / boolean',
            desc: '骨架行数；行数是否量出来的；是否撑满。',
          },
        ],
      },
    ],
    states: [
      '500ms 内：什么也不画。',
      '超过 500ms：点阵骨架；2s：说「仍在加载」；10s：琥珀条加重试。',
      '数据到了：骨架出过的内容用 2px 模糊揭示，没出过的直接出现。',
    ],
    donts: ['不要脉冲、不要转圈。', '表头与外框已知时保留，骨架只占内容区。'],
    composition: 'Loading\n  LoadingWait（计时）\n    LoadingView\n      Led\n      Button（重试）\n      Skeleton',
    keys: [['Tab', '10 秒后的重试按钮可聚焦；Enter / Space 触发']],
  },
  {
    id: 'change-text',
    group: 'quant',
    cardHeight: 122,
    title: 'ChangeText 涨跌幅',
    summary:
      '百分数的涨跌幅文字，写成「+1.23%」；颜色只读 --pnl-up / --pnl-down，根上设 data-updown="cn" 就互换成红涨绿跌；零不着色。',
    exports: ['ChangeText'],
    props: [
      {
        part: 'ChangeText',
        note: '其余属性透传给 span。四舍五入成 0 的小负数也按「平」处理，不带正负号。',
        rows: [
          { name: 'value', type: 'number', desc: '已经是百分数（1.5 就是 1.5%）。' },
          { name: 'digits', type: 'number', default: '2', desc: '小数位。' },
          { name: 'arrow', type: 'boolean', default: 'false', desc: '文字前加 ▲ / ▼（平不加）：方向不只靠颜色。' },
        ],
      },
    ],
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
    id: 'pnl-text',
    group: 'quant',
    cardHeight: 70,
    title: 'PnlText 盈亏',
    summary: '盈亏文字：字由调用方格式化好（币种、位数、符号都由调用方定），本件只按方向着色，颜色规则同 ChangeText。',
    exports: ['PnlText'],
    props: [
      {
        part: 'PnlText',
        note: '其余属性透传给 span。',
        rows: [
          {
            name: 'value',
            type: 'number | string | null | undefined',
            desc: '只用来定方向；0、空、解析不了的算「平」。',
          },
          {
            name: 'tone',
            type: "'up' | 'down' | 'flat'",
            desc: '方向不是由 value 的符号推出来时（例：亏损额写成正数）盖掉。',
          },
          { name: 'arrow', type: 'boolean', default: 'false', desc: '文字前加 ▲ / ▼。' },
          { name: 'as', type: "'span' | 'strong'", default: "'span'", desc: '渲染成哪个元素。' },
        ],
      },
    ],
    states: ['盈：pnl-up；亏：pnl-down；零或没有值：不着色。', '亏损额写成正数时传 tone="down"。'],
    donts: ['不要在件里拼币种与位数，由调用方传。', '不要用颜色以外没有符号或箭头的写法表达盈亏。'],
    composition: 'PnlText（内部：ToneText）',
    keys: [],
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
      'toneOf',
    ],
    props: [
      {
        part: 'formatPrice(value, { precision, tick, fallback })',
        note: '千分位固定 en-US；不是有限数写 —。',
        rows: [
          { name: 'precision', type: 'number | null', desc: '品种的价格精度；给了就恒写这么多位。' },
          {
            name: 'tick',
            type: 'number',
            desc: '最小变动价位（A 股 0.01、期货 0.25、加密 1e-8）；没给 precision 时由它定小数位。',
          },
          { name: 'fallback', type: '{ maxFraction } | { significant }', desc: '两个都没有时怎么写。' },
        ],
      },
      {
        part: 'decimalsOfTick(tick)',
        note: '1e-8 在 String() 里是科学计数，拆开尾数与指数数位。',
        rows: [{ name: 'tick', type: 'number', desc: '正数；否则抛 RangeError。' }],
      },
      {
        part: 'formatPercentChange(value, digits) / toneOf(value, digits)',
        note: '都先四舍五入再定符号与方向。',
        rows: [{ name: 'digits', type: 'number', default: '2 / 8', desc: '小数位。' }],
      },
      {
        part: 'formatQuantity / formatCount / formatCompact / compactParts / AUTO_SIZE',
        note: '数量的缩写（K / M / B）与千分位；单位 base 是币量、usd 带 $。',
        rows: [],
      },
    ],
    states: [
      'formatPrice：定了小数位就恒写这么多位；不是有限数写 —。',
      'formatPercentChange 与 toneOf 先舍入再定符号与方向：舍入成 0 的小负数是「平」。',
    ],
    donts: ['不要在格式化函数里猜品种的精度，由调用方传 precision 或 tick。', '不要自己拼千分位。'],
    composition:
      'formatPrice\n  decimalsOfTick\nformatPercentChange\ntoneOf\nformatQuantity\n  formatCount\nformatCompact\n  compactParts',
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
          { name: 'naText', type: 'string', default: "'N/A'", desc: '没有数的位置写什么。' },
          { name: 'estimateText', type: 'string', default: "'est.'", desc: '估算标记的字。' },
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
          { name: 'currentText', type: 'string', desc: '「当前」的字；给了 current 就要给。' },
          { name: 'estimateText', type: 'string', default: "'est.'", desc: '有估算段时图例末尾的字。' },
          {
            name: 'onPickState',
            type: '(id: string | null) => void',
            desc: '给了图例每项就是按钮：点选高亮，再点取消（传 null）。',
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
    keys: [['Enter / Space', '给了 onPickState 时，图例项点选或取消高亮']],
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
          { name: 'intent', type: 'ReactNode', desc: '当前意图（下单 · 账户 A · 买 300750 × 2,000）。' },
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
    props: [
      {
        part: 'ToastViewport',
        note: '其余属性透传给 div。role=region、aria-live=assertive：新插进来的条目读屏马上读；aria-label 由调用方给。',
        rows: [
          {
            name: 'position',
            type: "'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'",
            default: "'bottom-right'",
            desc: '哪个角。下面两个角新的贴着窗口边往上叠，上面两个角往下叠。',
          },
        ],
      },
      {
        part: 'Toast',
        note: '其余属性透传给 div。过渡的起点与终点由 data-starting-style、data-ending-style 给（phase 换的）。',
        rows: [
          {
            name: 'phase',
            type: "'entering' | 'open' | 'closing'",
            default: "'open'",
            desc: 'entering 是刚插进来（画一帧再改成 open，过渡才有起点）；closing 是收起中，过了 TOAST_EXIT_MS 调用方再摘节点。',
          },
        ],
      },
      {
        part: 'ToastClose',
        note: '其余属性透传给 Button（icon 变体）。',
        rows: [{ name: 'label', type: 'string', desc: '读屏名（必填，包里不放文案）。' }],
      },
      { part: 'ToastClear / ToastIcon / ToastText / ToastTitle / ToastDescription / ToastContent', rows: [] },
    ],
    states: [
      '进入：从边上平移加淡入（phase=entering 画一帧再切 open）。',
      '收起：反向平移淡出，播完（TOAST_EXIT_MS）调用方再摘节点。',
      '多条：按位置叠，两条以上出「全部关掉」。',
    ],
    donts: [
      '不要把需要用户处理的事只放在弹出提示里，它会自己消失。',
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
    props: [
      {
        part: 'Alert',
        note: '其余属性透传给 div。语气不能只靠颜色：标题或说明里要写字。',
        rows: [
          {
            name: 'tone',
            type: "'default' | 'ok' | 'warn' | 'danger'",
            default: "'default'",
            desc: '色条与图标的颜色。',
          },
          {
            name: 'role',
            type: 'string',
            desc: '默认 warn 与 danger 是 alert（读屏马上读），default 与 ok 是 status；一直在页面里的可以传 note。',
          },
        ],
      },
      { part: 'AlertTitle / AlertDescription', note: '都是 div。', rows: [] },
    ],
    states: ['default、ok：role=status；warn、danger：role=alert。', '左边 2px 色条取语气的颜色。'],
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
    props: [
      {
        part: 'Progress',
        note: RADIX('Progress.Root') + '读屏要一个名字：传 aria-label。',
        rows: [
          { name: 'value', type: 'number | null', desc: '0 到 max；不给或 null 是不确定态（没有 aria-valuenow）。' },
          { name: 'max', type: 'number', default: '100', desc: '满格的值。' },
          {
            name: 'tone',
            type: "'default' | 'ok' | 'warn' | 'danger'",
            default: "'default'",
            desc: '只改填充的颜色；状态别只靠颜色，旁边写字。',
          },
        ],
      },
    ],
    states: [
      '确定：按 value 填充，aria-valuenow 跟值。',
      '不确定：value 缺省，来回滑动的条，不带 aria-valuenow。',
      'tone：default、ok、warn、danger 换填充颜色。',
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
    props: [
      { part: 'Sheet', note: RADIX('Dialog.Root'), rows: [] },
      {
        part: 'SheetContent',
        note: RADIX('Dialog.Content') + '要有 SheetTitle（读屏靠它报名字），不想显示就加 sr-only。',
        rows: [
          {
            name: 'side',
            type: "'right' | 'left' | 'top' | 'bottom'",
            default: "'right'",
            desc: '贴哪一边；入场从那一边滑进来。',
          },
          { name: 'closeLabel', type: 'string', desc: '给了就在右上角画关闭钮，读屏读这个名字。' },
        ],
      },
      { part: 'SheetHeader / SheetBody / SheetFooter / SheetTitle / SheetDescription', rows: [] },
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
    props: [
      { part: 'HoverCard', note: RADIX('HoverCard.Root') + 'openDelay、closeDelay 在这里改。', rows: [] },
      {
        part: 'HoverCardContent',
        note: RADIX('HoverCard.Content'),
        rows: [
          { name: 'align', type: "'start' | 'center' | 'end'", default: "'center'", desc: '对齐触发器的哪一边。' },
          { name: 'sideOffset', type: 'number', default: '4', desc: '离触发器的距离。' },
        ],
      },
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
    props: [
      {
        part: 'Command',
        note: '其余属性透传给 cmdk 的 Command（shouldFilter、filter、loop、value、onValueChange）。',
        rows: [],
      },
      {
        part: 'CommandItem',
        note: '其余属性透传给 cmdk 的 Item。aria-selected 说的是当前高亮，不是已选。',
        rows: [
          { name: 'value', type: 'string', desc: '过滤用的值，同一个 Command 里要唯一。' },
          { name: 'keywords', type: 'string[]', desc: '额外的搜索词（别名、拼音、英文名）。' },
          { name: 'onSelect', type: '(value: string) => void', desc: '回车或点击选中。' },
          { name: 'disabled', type: 'boolean', desc: '不可选。' },
        ],
      },
      {
        part: 'CommandDialog',
        note: '其余属性透传给 Dialog。',
        rows: [
          { name: 'title', type: 'string', desc: '读屏用的标题（不显示，必填）。' },
          { name: 'description', type: 'string', desc: '读屏用的说明（不显示，必填）。' },
          { name: 'commandProps', type: 'ComponentProps<typeof Command>', desc: '给里面的 Command。' },
        ],
      },
      {
        part: 'CommandInput / CommandList / CommandEmpty / CommandGroup / CommandSeparator / CommandShortcut',
        rows: [],
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
    props: [
      { part: 'Combobox', note: RADIX('Popover.Root') + 'open、onOpenChange 受控。', rows: [] },
      {
        part: 'ComboboxContent',
        note: RADIX('Popover.Content') + '宽跟触发器一样（最窄 220）。',
        rows: [
          { name: 'label', type: 'string', desc: '搜索框与列表的读屏名（必填）。' },
          {
            name: 'commandProps',
            type: 'ComponentProps<typeof Command>',
            desc: '给里面的 Command（例：shouldFilter: false，自己排名）。',
          },
        ],
      },
      {
        part: 'ComboboxItem',
        note: '同 CommandItem。',
        rows: [{ name: 'selected', type: 'boolean', default: 'false', desc: '已选：左边画勾，data-checked。' }],
      },
      { part: 'ComboboxTrigger / ComboboxInput / ComboboxList / ComboboxEmpty / ComboboxGroup', rows: [] },
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
    props: [
      {
        part: 'Separator',
        note: RADIX('Separator.Root'),
        rows: [
          { name: 'orientation', type: "'horizontal' | 'vertical'", default: "'horizontal'", desc: '横或竖。' },
          {
            name: 'decorative',
            type: 'boolean',
            default: 'true',
            desc: '真：只是画一道线；假：role=separator 与 aria-orientation，读屏知道这里分了区域。',
          },
        ],
      },
    ],
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
    props: [
      {
        part: 'ScrollArea',
        note: RADIX('ScrollArea.Root') + '给 Root 一个确定的高（或 max-height），内容比它高才滚。',
        rows: [
          {
            name: 'type',
            type: "'hover' | 'always' | 'scroll' | 'auto'",
            default: "'hover'",
            desc: 'hover：指到才显示；always：一直；scroll：滚动时；auto：内容溢出就显示。',
          },
          { name: 'viewportClassName', type: 'string', desc: '给里面可滚动的 Viewport。' },
        ],
      },
      { part: 'ScrollBar', note: '自己拼时用；orientation 默认 vertical。', rows: [] },
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
          { name: 'selectedKeys / defaultSelectedKeys', type: 'string[]', desc: '选中的 id，受控 / 非受控。' },
          { name: 'onSelectionChange', type: '(keys: string[]) => void', desc: '选中变了。' },
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
      '标签加控件加说明加错误排成一组，并把它们的 ARIA 关联好：标签点一下聚焦控件，说明与错误进控件的 aria-describedby，出错时 aria-invalid、错误条 role=alert。',
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
    props: [
      {
        part: 'Field',
        note: '其余属性透传给 div。控件调 useFieldControl() 拿 { id, aria-describedby, aria-invalid, disabled } 展开到自己身上。',
        rows: [
          {
            name: 'orientation',
            type: "'vertical' | 'horizontal'",
            default: "'vertical'",
            desc: '标签在上，或标签与说明在左、控件在右。',
          },
          {
            name: 'invalid',
            type: 'boolean',
            default: 'false',
            desc: '标签变危险色、控件 aria-invalid、FieldError 才显示。',
          },
          { name: 'disabled', type: 'boolean', default: 'false', desc: '标签降到 45%，控件 disabled。' },
        ],
      },
      {
        part: 'FieldError',
        note: 'Field 的 invalid 为真才渲染；children 是调用方写的话。',
        rows: [],
      },
      {
        part: 'Label',
        note: RADIX('Label.Root') + '不在 Field 里单独用也行。',
        rows: [],
      },
      {
        part: 'FieldLabel / FieldDescription / FieldContent / FieldGroup / FieldSet / FieldLegend / FieldSeparator',
        rows: [],
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
            name: 'hint',
            type: 'string',
            desc: '读屏与悬停提示，如「按住 2 秒，全部平仓」。必填：没有它读屏用户不知道要按住。',
          },
          {
            name: 'holdMs',
            type: 'number',
            default: '2000',
            desc: '按住多久填满。2000 取自 Emil Kowalski 的 hold-to-delete 写法（2026-11-14 读），对交易动作是否合适没有实测，默认值待定；越不可撤越长。',
          },
          { name: 'releaseMs', type: 'number', default: '200', desc: '松手后从满格退回空格要多久（同一出处）。' },
          { name: 'confirmedLabel', type: 'ReactNode', desc: '填满后的字，原地换掉 children，直到松手退完。' },
          { name: 'tone', type: "'danger' | 'default'", default: "'danger'", desc: '填充色：红，或中性。' },
          { name: 'disabled', type: 'boolean', desc: '灰掉，按不动。' },
        ],
      },
    ],
    states: [
      '空闲：和普通按钮一样。',
      '按住：填充从左往右走；到 holdMs 填满并触发，字换成 confirmedLabel。',
      '松手：填充在 releaseMs 内退回；填满后手还按着，填充停在满格，松手才退。',
      '焦点移走或指针被抢走：按松手处理，退回。',
    ],
    donts: [
      '不要拿它做可撤销的动作：那些直接用 Button，确认框和按住都是摩擦。',
      '不要缩短 holdMs 到几百毫秒：那和单击没有区别。',
      'hint 要写清按多久、做什么，读屏用户靠它。',
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
    props: [
      {
        part: 'PasswordInput',
        note: '其余属性透传给 Input（不含 type）；ref 指向里面的 input。自动填充、拼写检查、自动大写默认关。',
        rows: [
          {
            name: 'toggleLabel',
            type: 'string',
            desc: '眼睛按钮的读屏名（必填）。名字不随状态变，当前是否显示由 aria-pressed 表达。',
          },
          { name: 'defaultVisible', type: 'boolean', default: 'false', desc: '一开始就显示明文。' },
          { name: 'onVisibleChange', type: '(visible: boolean) => void', desc: '切换时回调。' },
          { name: 'size', type: "'default' | 'sm'", default: "'default'", desc: '同 Input：30 高与 26 高。' },
        ],
      },
    ],
    states: [
      '默认：内容遮住，眼睛是闭着的。',
      '点眼睛：显示明文，输入框不丢焦点与选区，眼睑睁开；再点遮回去。',
      '禁用：按钮不可点。',
    ],
    donts: ['眼睛按钮的读屏名 toggleLabel 必须传，包里不写文案。', '不要用它放不需要遮住的普通文本。'],
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
    props: [
      {
        part: 'DeleteButton',
        rows: [
          { name: 'label', type: 'string', desc: '原按钮的读屏名，如「删除工作区」（必填）。' },
          { name: 'confirmLabel / cancelLabel', type: 'string', desc: '展开后两个小钮的读屏名（必填）。' },
          { name: 'doneLabel / keptLabel', type: 'string', desc: '确认、取消之后读屏播报的话；不给就不播。' },
          { name: 'onConfirm', type: '() => void', desc: '点了确认。第一次点原按钮不会触发它。' },
          { name: 'onCancel', type: '() => void', desc: '取消（含 Esc、点外面、Tab 走开）。' },
          { name: 'disabled', type: 'boolean', desc: '禁用原按钮。' },
        ],
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
    props: [
      {
        part: 'NotificationBell',
        note: '其余属性透传给 button。角标对读屏隐藏，数变了由名字（label）播报。',
        rows: [
          { name: 'count', type: 'number', default: '0', desc: '未读数；不是有限数时当 0。' },
          { name: 'max', type: 'number', default: '99', desc: '角标显示到几，超过写「<max>+」。' },
          { name: 'variant', type: "'count' | 'dot'", default: "'count'", desc: 'count 画数字，dot 只画一个点。' },
          { name: 'label', type: 'string', desc: '读屏名（必填），要带上未读数，数变了就换这个字符串。' },
        ],
      },
    ],
    states: ['0：角标收起。', '有未读：角标弹出，数字按增减方向滚。', '数变多：铃从顶端摆一下。'],
    donts: ['铃是图标，label 必须传（读屏名字）。'],
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
    props: [
      {
        part: 'StatusIcon',
        note: '16 见方，role=img。应用的提示条（AlertToasts）用它表达成功与警告。',
        rows: [
          {
            name: 'status',
            type: "'success' | 'error' | 'warning' | 'info' | 'pending'",
            desc: '状态；pending 是转动的弧。',
          },
          { name: 'label', type: 'string', desc: '读屏名（必填）：不单靠颜色与形状说话。' },
        ],
      },
    ],
    states: ['成功、失败、警告、说明、进行中五种。', '换状态时旧的缩小退出、新的弹入，对勾与叉一笔一笔画出来。'],
    donts: ['不要单靠图标说话：旁边要有文字。', 'label 必须传（读屏名字）。'],
    composition: 'StatusIcon\n  svg（按 status 换，笔画画出来）',
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
    props: [
      {
        part: 'AiStatus',
        note: '整行是 role=status，状态变了读屏播报。',
        rows: [
          {
            name: 'state',
            type: "'thinking' | 'searching' | 'writing' | 'done' | 'error'",
            desc: '状态；前三个是进行中。',
          },
          { name: 'label', type: 'string', desc: '状态文字（必填），状态变了就换这个字符串。' },
          { name: 'detail', type: 'string', desc: '文字后的灰色细节，如正在读哪个来源。' },
          { name: 'elapsed', type: 'number', desc: '已进行的秒数；只在进行中显示，写成「12s」「1m 05s」。' },
        ],
      },
    ],
    states: [
      '按 state 换图标与文字；进行中带流光。',
      '可带 detail 与耗时 elapsed。',
      '换状态时图标缩放、文字上下滑、整行宽度弹簧伸缩。',
    ],
    donts: ['没有真实进展时不要显示进行中。'],
    composition: 'AiStatus\n  span（图标，按 state 换）\n  span（文字，按 label 换）\n  span（细节）\n  span（耗时）',
    keys: [],
  },
  {
    id: 'matrix-orb',
    group: 'readouts',
    cardHeight: 261,
    title: 'MatrixOrb 点阵状态球',
    summary:
      '一盘方点排成圆：待命慢呼吸，聆听同心波跟音量走，思考几个热点绕着转。点阵签名件的动态版，用来表达 Agent 在做什么。学自 rare-ui。',
    exports: ['MatrixOrb'],
    props: [
      {
        part: 'MatrixOrb',
        note: '画在 canvas 上，role=img；状态用文字另外读出。颜色取元素的 color，跟主题走。',
        rows: [
          {
            name: 'state',
            type: "'idle' | 'listening' | 'thinking'",
            default: "'idle'",
            desc: '状态；换状态时三种的权重插值过去，不跳。',
          },
          { name: 'level', type: 'number', desc: '聆听态的音量 0 到 1；不给用模拟包络。' },
          { name: 'cells', type: 'number', default: '16', desc: '一边几个点；点距 6px，所以 16 是 96px 见方。' },
          {
            name: 'color',
            type: 'string',
            default: "'var(--signal-orange)'",
            desc: '点的颜色，CSS 颜色或 var(--token)。',
          },
          { name: 'label', type: 'string', desc: '读屏名（必填）。' },
        ],
      },
    ],
    states: ['待命：慢呼吸。', '聆听：同心波跟 level 音量走。', '思考：几个热点绕着转。'],
    donts: ['只表达 Agent 真实在做的事，不当装饰。', 'label 要传（读屏名字）。'],
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
            default: "['transparent', 'var(--signal-orange)']",
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
          { name: 'window / defaultWindow', type: '[number, number]', desc: '受控 / 不受控的窗口，默认整段。' },
          {
            name: 'onWindowChange',
            type: '(window: [number, number]) => void',
            desc: '窗口变了（拖、键盘、点概览条）。',
          },
          { name: 'minSpan', type: 'number', default: '2', desc: '窗口最少几个点：折线至少两个点才画得出来。' },
          { name: 'height / brushHeight', type: 'number', default: '160 / 40', desc: '主图与概览条的高（px）。' },
        ],
      },
      {
        part: 'BrushStrip',
        note: '只有概览条（SeriesExplorer 这类自己画主图的件用它）。属性是 values、window、onWindowChange、formatX、labels、minSpan、height。',
        rows: [{ name: 'window / onWindowChange', type: '[number, number]', desc: '必填：窗口由上层持有。' }],
      },
    ],
    states: [
      '默认：窗口整段（或 defaultWindow），概览条上窗口外变暗。',
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
          { name: 'otherLabel / shareLabel', type: '(n) => string / string', desc: '「其他 ×n」与占比那一行的标签。' },
          {
            name: 'title / meta',
            type: 'string / (scale) => string',
            desc: '标题（宽体大写英文）与下一行点阵元信息；刻度 ±max 只在元信息里写一次。',
          },
          {
            name: 'dimensions / ranges',
            type: '{ label, options, value, onChange }',
            desc: '顶行的两组分段；换了就换 items，同一位置的条长会过渡。',
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
          { name: 'onWindowChange', type: '(window) => void', desc: '拖概览条改窗口后回调，宿主可把别的表跟着筛。' },
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
    group: 'quant',
    cardHeight: 200,
    title: 'SparkTile KPI 瓦片',
    summary:
      'KPI 行的瓦片：点阵标签、LCD 数值、24px 迷你折线（末点橙）、一行变化说明；有阈值画琥珀虚线，接近阈值边框转暗橙并脉冲一次。对设计稿的 SparkTile 卡。',
    exports: ['SparkTile'],
    props: [
      {
        part: 'SparkTile',
        note: '一行最多 5 个，由调用方的布局定。迷你线不画轴、不画网格、不标数值；悬停出 LCD tooltip。给 onOpen 就渲染成按钮（点开该指标的完整图）。',
        rows: [
          { name: 'label', type: 'string', desc: '点阵标签（大写短码）。' },
          {
            name: 'text / value',
            type: 'string | null / number | null',
            desc: '数值的显示文字与数；没有数据两个都传 null，显示「—」。数变化时逐位滚动。',
          },
          { name: 'unit', type: 'string', desc: '数值后的小字单位。' },
          { name: 'series', type: 'number[]', desc: '迷你线的数，从旧到新；少于两个数不画。' },
          {
            name: 'pointLabels / formatPoint',
            type: 'string[] / (v) => string',
            desc: '悬停 tooltip 的时间标签与值的写法。',
          },
          {
            name: 'delta / deltaTone',
            type: 'string / up | down | muted | warn',
            desc: '变化行。up、down 用涨跌色（只给这行数字）。',
          },
          { name: 'threshold', type: 'number', desc: '上限或下限：画 1px 琥珀虚线，迷你线的范围把它包进来。' },
          {
            name: 'near',
            type: 'boolean',
            desc: '接近阈值：边框转暗橙、变化行转琥珀、脉冲一次。是否接近由调用方判（比例没有通用的出处）。',
          },
          {
            name: 'trendTone',
            type: 'series | neutral',
            default: 'series',
            desc: 'neutral 用灰线，表示「越低越好」的指标。',
          },
          { name: 'seriesLabel', type: 'string', desc: '迷你线的读屏名。' },
        ],
      },
    ],
    states: [
      '默认：迷你线 series-1，末点橙。',
      '越低越好：trendTone 为 neutral，线用 ink-300。',
      '有阈值：琥珀虚线；near 时边框转暗橙。',
      '没有数据：数值写「—」，不画迷你线。',
    ],
    donts: [
      '不要用颜色区分瓦片类型：只用标签。',
      '不要在迷你线上画轴、网格或数值。',
      '一行不超过 5 个：更多拆两行或进表格。',
    ],
    composition:
      'SparkTile\n  点阵标签\n  LCD 数值（RollingText）\n  迷你线（svg + 末点 + 阈值虚线 + LCD tooltip）\n  变化行',
    keys: [],
  },
  {
    id: 'meter',
    group: 'quant',
    cardHeight: 520,
    title: 'Meter 仪表（条 / 刻度盘 / 同步率）',
    summary:
      '仪表的三种形态：条（进度、负载、敞口，点阵填充）、刻度盘（0 到 100 的读数带指针）、同步率（分段齿条加评估点刻度加大百分比）。限额板传软限与硬限，达到软限算接近、达到硬限算越限。对设计稿的 Meter 卡；功能参照 Arc 的 Budget variance。',
    exports: ['Meter'],
    props: [
      {
        part: 'Meter',
        note: '角色是 meter。调用方只传 tone，不传颜色。外观读 CSS 变量（点阵纹理、强调色、数字字体），见 theme/chart-kit.css 开头。',
        rows: [
          {
            name: 'value / max',
            type: 'number',
            desc: '读数与满刻度（max 默认 100；gauge 与 sync 固定按 0 到 100 读）。超出满刻度的条画满。',
          },
          {
            name: 'display',
            type: 'bar | gauge | sync',
            default: 'bar',
            desc: '形态。sync 只给 paper 进度、容量使用、偏离门距离、回放进度。',
          },
          {
            name: 'tone',
            type: 'accent | ok | warn | off | ink',
            default: 'accent',
            desc: '进行中 / 健康 / 受限或越界 / 停用。有软限或硬限且已达到时自动换成 warn。',
          },
          {
            name: 'soft / hard',
            type: 'number',
            desc: '软限（接近，琥珀刻度）与硬限（越限，红刻度）；都可以不给。状态按「达到」算。',
          },
          { name: 'label', type: 'string', desc: '量的是什么：左上角的字，也是读屏名。' },
          { name: 'valueText', type: 'string', desc: '读屏整句，调用方按界面语言写。' },
          { name: 'formatValue', type: '(value: number) => string', desc: '读数写成什么字（sync 是右侧大百分比）。' },
          {
            name: 'stateLabels',
            type: '{ ok?, warn?, breach? }',
            desc: '三种状态的词，写在读数后面；不给就不写。状态不单靠颜色。',
          },
          { name: 'tickLabels', type: '{ soft?, hard? }', desc: 'bar 里刻度下面的小字。' },
          {
            name: 'weakBelow / locked',
            type: 'number / boolean',
            desc: 'gauge：读数低于 weakBelow 指针转红（Meter 卡写 30）；locked 转琥珀。',
          },
          { name: 'mark', type: 'number', desc: 'sync：评估点（0 到 100），画琥珀刻度。' },
        ],
      },
    ],
    states: [
      '健康 / 进行中 / 停用：tone 决定点阵填充的颜色。',
      '接近（已用 ≥ 软限）：tone 转 warn，状态词转琥珀，条体脉冲一次。',
      '越限（已用 ≥ 硬限）：tone 仍是 warn，状态词转红，硬限刻度红。',
      '刻度盘弱势 / 受锁：指针转红 / 琥珀。',
    ],
    donts: [
      '不要传颜色：只传 tone。',
      '不要做「只有一根条」：条永远有标签和读数。',
      '不要做环形仪表（第一版不做）。',
      '不要在包里决定软限、硬限是多少：限额由风控设置传进来。',
    ],
    composition:
      'Meter\n  标题行（label · 读数 · 状态词）\n  bar：div[role=meter]（点阵填充 · 软限刻度 · 硬限刻度）+ 刻度小字\n  gauge：div[role=meter]（中线 · 指针 · 0/25/50/75/100）\n  sync：标签 + 分段齿条（评估点刻度）+ 大百分比',
    keys: [],
  },
  {
    id: 'calendar-heatmap',
    group: 'quant',
    cardHeight: 560,
    title: 'CalendarHeatmap 日历',
    summary:
      '月历格：底色是收益（或换手）的低饱和发散热力，格内日期左上、数值右下，左下点阵事件点（最多 3 个，更多写 +n）；休市日灰底写「休」，今天强调色描边，周标 W40。切「事件」视图时格子不着色。mode 为 year 是整年的格子。对设计稿的 Calendar 卡；功能参照 Arc 的 Activity heatmap。',
    exports: ['CalendarHeatmap'],
    props: [
      {
        part: 'CalendarHeatmap',
        note: '日期是不带时区的日历日 YYYY-MM-DD，按 UTC 零点算。外观读 CSS 变量，见 theme/chart-kit.css 开头。年视图用的是整年的格子（一周一列），不是 12 个缩小月历（待定：第一版先做整年格子）。',
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
        ],
      },
    ],
    states: [
      '默认：开市日按收益着色，休市日灰底写「休」，今天描边。',
      '格色：发散色浅档是大多数，深档只给超月内 80 分位的格；全饱和不出现。',
      '换手视图：序数色，格从暗到亮。',
      '事件视图：格子不着色，每格最多列两条事件文字。',
      '没有数据的日子：只有日期与「·」，与持平（中点灰）不同。',
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
    props: [
      {
        part: 'StepPlayer',
        note: '值与播放状态都可受控，也可不受控。文字全由 labels 给，包里没有文案。',
        rows: [
          {
            name: 'steps',
            type: 'number | { duration?, label? }[]',
            default: '4',
            desc: '步数，或每一步的描述（可自带时长）。',
          },
          { name: 'value / defaultValue / onValueChange', type: 'number', desc: '当前第几步（0 起）。' },
          { name: 'playing / defaultPlaying / onPlayingChange', type: 'boolean', desc: '是否在放。' },
          { name: 'duration', type: 'number', default: '4000', desc: '每步默认放多久（毫秒）。' },
          { name: 'loop', type: 'boolean', default: 'false', desc: '最后一步放完回到第一步继续。' },
          { name: 'onComplete', type: '() => void', desc: '最后一步放完触发一次（循环时也触发）。' },
          { name: 'seekable', type: 'boolean', default: 'false', desc: '点圆点直接去那一步；点击区至少 44px 高。' },
          { name: 'size', type: 'number', default: '32', desc: '钮与条的高（px）。' },
          {
            name: 'labels',
            type: 'StepPlayerLabels',
            desc: '{ play, pause, replay, group(index, count), step(index, count) }（必填）。',
          },
        ],
      },
    ],
    states: ['播放中：当前一步撑成长条，里面的填充随时间走。', '暂停、重放；可循环。', 'seekable 时可点圆点跳步。'],
    donts: ['它是按时间走的演示进度，不要拿它表示真实任务进度。'],
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
    props: [
      {
        part: 'ThemeSelector',
        note: 'role=radiogroup；tab 只停在选中那张。value 传 null 表示受控但还没选。',
        rows: [
          {
            name: 'themes',
            type: 'ThemeOption[]',
            desc: '{ value, label, colors: { rail, panel, line, strong, muted, tile } }（必填）。',
          },
          { name: 'value / defaultValue / onChange', type: 'string', desc: '当前主题。' },
          { name: 'label', type: 'string', desc: '整组的读屏名（必填）。' },
          { name: 'showLabels', type: 'boolean', default: 'true', desc: '缩略下面写不写名字（读屏名不受影响）。' },
          { name: 'disabled', type: 'boolean', desc: '整组禁用。' },
        ],
      },
    ],
    states: ['选中的那张加一圈环，环在选项之间用弹簧滑过去。', '禁用：不响应。'],
    donts: ['缩略颜色由调用方传，不要在包里写死主题色。'],
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
    props: [
      {
        part: 'CodeBlock',
        note: '认得 ts / tsx / js / json / py / sh / css；别的语言当纯文本。开头的空行与结尾的空白会去掉。',
        rows: [
          { name: 'code', type: 'string', desc: '源码（必填）。' },
          { name: 'language', type: 'string', default: "'plain'", desc: '语言。' },
          { name: 'accent', type: 'string', default: "'var(--signal-orange)'", desc: '强调色，任何 CSS 颜色。' },
          { name: 'filename', type: 'string', desc: '头里写的名字；不给写语言。' },
          {
            name: 'showHeader / showLineNumbers / showCopyButton',
            type: 'boolean',
            default: 'true',
            desc: '关掉头时复制钮浮在右上角。',
          },
          { name: 'highlightLines', type: 'number[]', desc: '要高亮的行（1 起）。' },
          { name: 'copyLabel / copiedLabel', type: 'string', desc: '复制钮的读屏名，与复制成功后的读屏名（必填）。' },
        ],
      },
    ],
    states: ['带文件名头、行号、复制钮；复制后钮上写 copiedLabel。', '可高亮指定的行。'],
    donts: ['复制钮的文案由调用方传（copyLabel、copiedLabel）。'],
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
    props: [
      {
        part: 'WebSearch',
        note: '检索中的进度环每来一条结果补上剩下的 30%，不会自己走满；第四条起最后一格是「还有 N 条」。',
        rows: [
          { name: 'sources', type: 'WebSource[]', desc: '{ id, site, title, snippet? }（必填）。' },
          {
            name: 'status',
            type: "'searching' | 'done'",
            default: "'done'",
            desc: '检索中带流光与进度环、没到的位置画空骨架。',
          },
          { name: 'label', type: 'string', desc: '药丸里的状态文字（必填）；换了字符串就上下滑着换。' },
          {
            name: 'moreLabel / lessLabel',
            type: '(n) => string / string',
            desc: '「还有 N 条」与「收起」卡片的文字（必填）。',
          },
          { name: 'open / defaultOpen / onOpenChange', type: 'boolean', default: 'true', desc: '来源区展开与否。' },
          { name: 'onOpen', type: '(source) => void', desc: '给了，来源卡片才可点。' },
        ],
      },
      {
        part: 'WebSearchCitation',
        note: '悬停停 300ms 才开、离开 150ms 才收；键盘聚焦立即开。',
        rows: [
          { name: 'source', type: 'WebSource', desc: '这条引用指向的来源。' },
          { name: 'index', type: 'number', desc: '行内序号（1 起），不给不写。' },
        ],
      },
      {
        part: 'useHoverIntent',
        note: '钩子 (openDelay = 300, closeDelay = 150)：返回 { active, set(next, delay), hover }，hover 展开到触发处与弹层上。触屏不处理。',
        rows: [],
      },
    ],
    states: [
      '药丸：进度环、状态文字、叠起来的来源小标。',
      '点开是一排来源卡片；「还有 N 条」展开全部。',
      '行内引用：悬停或键盘聚焦弹出预览。',
    ],
    donts: ['不存也不开 URL：要打开来源由调用方在 onOpen 里处理。'],
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
    props: [
      {
        part: 'TaskList',
        note: '每行是 role=checkbox 的按钮；屏外有 role=status 的区播报勾上与取消。',
        rows: [
          {
            name: 'tasks / defaultTasks / onTasksChange',
            type: 'Task[]',
            desc: '{ id, label, done? }；可受控也可不受控。',
          },
          { name: 'labels', type: 'TaskListLabels', desc: '{ completed(label), reopened(label) }：播报的话（必填）。' },
          { name: 'label', type: 'string', desc: '清单的读屏名。' },
        ],
      },
    ],
    states: ['未勾：空圈。', '已勾：圆圈填强调色、对勾画出、文字划掉，沉到底部。', '再点取消，回到原位。'],
    donts: ['任务文案与标签由调用方传。'],
    composition:
      'TaskList\n  li（layout 动画）\n    button role=checkbox（圆圈 + 对勾 + 划线文字）\n  li role=status（播报）',
    keys: [
      ['Tab', '在各行之间移动'],
      ['Space / Enter', '勾上或取消'],
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
    props: [
      {
        part: 'DurationPicker',
        rows: [
          {
            name: 'value / defaultValue / onChange',
            type: '{ hours, minutes }',
            desc: '当前时长；打字时即时回调（已夹进范围）。',
          },
          { name: 'onConfirm', type: '(value) => void', desc: '点对勾或 Enter 确认时触发。' },
          { name: 'onEditingChange / defaultEditing', type: '(editing) => void / boolean', desc: '编辑状态。' },
          { name: 'maxHours / maxMinutes', type: 'number', default: '24 / 59', desc: '上限；超过的输入夹到上限。' },
          {
            name: 'labels',
            type: 'DurationPickerLabels',
            desc: '{ hours, minutes, edit, save, hoursInput, minutesInput }（必填）。',
          },
          { name: 'disabled', type: 'boolean', desc: '禁用。' },
        ],
      },
    ],
    states: [
      '平时：连成一整条的药丸加笔钮。',
      '编辑中：三段分开，数字变成输入框，笔变对勾。',
      '输入超上限：夹住并抖一下。',
      '禁用：笔点不动。',
    ],
    donts: ['上限 maxHours、maxMinutes 由调用方定，不要省略。'],
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
    exports: ['DataGrid', 'DataGridHostProvider', 'tableCsv'],
    props: [
      {
        part: 'DataGrid',
        note: '示例数据写死在页里，不是行情。行高档：compact 20、default 24、relaxed 32。没有 DataGridHost 时能点、能排序、能键盘选行，只是没有快捷键与标准右键项。',
        rows: [
          {
            name: 'columns',
            type: 'GridColumn<Row>[]',
            desc: '列的定义：id、type、value、format、text、sort、tone、fill、cell（custom 列的内容）、render、csv、rowHeader。列对象要稳定，别每次渲染新建。',
          },
          {
            name: 'layout',
            type: 'GridColumnLayout[]',
            desc: '列怎么摆：次序就是显示次序，每项 id、label、width、visible、align、fixed。',
          },
          { name: 'rows / rowId', type: 'Row[] / (row) => string', desc: '行与稳定的行 id。' },
          { name: 'label', type: 'string', desc: '屏幕阅读器念的表名。' },
          {
            name: 'sort / onSortChange',
            type: 'SortSpec | null / (next) => void',
            desc: '排序受控；点表头在升序、倒序、不排之间转。没给 onSortChange 就不能排序，表头是普通的字。',
          },
          { name: 'sortRemovable', type: 'boolean', default: 'true', desc: 'false 时第三下回到升序。' },
          {
            name: 'onResize / onResetColumns',
            type: 'function',
            desc: '拖完列宽 / 重置列；没给就没有拖动把手与「重置列」。',
          },
          {
            name: 'onOpen / restoreRow / isOpened',
            type: 'function',
            desc: '点一行、从详情返回时放回键盘所在行、正开着的行（左边强调色）。',
          },
          {
            name: 'rowProps',
            type: '(row) => GridRowProps | undefined',
            desc: '给一行加属性：className（并进行的类名）、title、data-*、aria-*。状态、测试钩子从这里来，不用在外面再包一层。',
          },
          {
            name: 'renderSubRow',
            type: '(row) => ReactNode',
            desc: '可展开的子行，跨满整行宽、高度跟着内容走；返回 null / undefined / false 是这一行没有子行。表按 treegrid 读，有子行的行带 aria-expanded。',
          },
          {
            name: 'expanded / onExpandedChange / defaultExpanded',
            type: 'Set<string> / (id, expanded) => void / (row) => boolean',
            desc: '展开状态：给了 expanded 就受控（展开收起只通知 onExpandedChange）；不给时表自己记，没动过的行看 defaultExpanded（省略是收起）。',
          },
          {
            name: 'menu / panelMenu / menuTail / rowInfo / extrasFirst',
            type: 'function',
            desc: '右键菜单里标准项之外追加的项与次序。',
          },
          {
            name: 'askText / onExport',
            type: 'function',
            desc: '问 Agent 的摘要文字（需宿主 askAgent）/ 导出 CSV 交给宿主存。',
          },
          { name: 'timeZone', type: "'local' | 'utc' | string", default: "'local'", desc: 'time 列的时区。' },
          { name: 'density', type: "'compact' | 'default' | 'relaxed'", default: "'default'", desc: '行高档。' },
          { name: 'hideHeader', type: 'boolean', default: 'false', desc: '不画表头。' },
          {
            name: 'autoRowHeight',
            type: 'boolean',
            default: 'false',
            desc: '行高跟着内容走：多行的格子、行里有按钮的表。density 的行高是最小高度，格子里的字可以折行。',
          },
          { name: 'ruled', type: 'boolean', default: 'false', desc: '行与行之间画一道细线。' },
          {
            name: 'selectable',
            type: 'boolean',
            default: 'true',
            desc: 'false：点行不选、不打开，没有悬停底色，只留键盘移动与展开（行里主要是按钮的表）。',
          },
          {
            name: 'interactive',
            type: 'boolean',
            default: 'true',
            desc: 'false 是只读展示表（ARIA table），行不响应点击。',
          },
          {
            name: 'fit / maxHeight',
            type: 'boolean / number',
            desc: '高度跟着内容走（对话框里的小表），maxHeight 像素以内不出滚动条。',
          },
          {
            name: 'foot / presorted / rowTree / classNames',
            type: 'various',
            desc: '表下说明、调用方已排好、树形行、各部分额外类名（含 subrow）。',
          },
        ],
      },
      {
        part: '列类型 ColumnType',
        note: '数字类默认靠右，用等宽数字；pnl、change、side 用 ToneText 跟 data-updown 着色（红涨绿跌时互换）。',
        rows: [
          { name: 'text', type: 'string', desc: '字符串，按字排序（自然序）。' },
          {
            name: 'number',
            type: 'number | 十进制字符串',
            desc: '数值排序（十进制字符串不转双精度）；format.digits 定小数位。',
          },
          { name: 'price', type: 'number', desc: 'formatPrice：format.precision 或 tick 定小数位。' },
          { name: 'quantity', type: 'number', desc: 'formatQuantity：format.units（base | usd）与 size 缩写。' },
          { name: 'pnl', type: 'number', desc: '带符号的盈亏，format.digits（默认 2）、suffix（单位），按方向着色。' },
          { name: 'change', type: 'number（百分数）', desc: '+1.23% 写法，按方向着色。' },
          { name: 'side', type: "'buy' | 'sell'", desc: '买卖文字加方向色；format.labels 传文案。' },
          {
            name: 'time',
            type: '毫秒时间戳',
            desc: 'YYYY-MM-DD HH:MM:SS，时区取 timeZone；format.timeStyle 可只写时间或日期。',
          },
          { name: 'symbol', type: 'string | { code, venue? }', desc: '代码加场所两段，场所写淡。' },
          {
            name: 'custom',
            type: 'cell(row) => ReactNode',
            desc: '格子里画什么都行（多行的字、使用度条、按钮）；复制、导出与排序用 text 与 sort。放在里面的按钮自己管点击。',
          },
        ],
      },
      {
        part: 'DataGridHost（经 DataGridHostProvider 提供）',
        note: '应用才有的能力；包里不带语言，文案都是宿主传的。',
        rows: [
          {
            name: 'matchKey / keysOf',
            type: 'function',
            desc: '按键对应表的哪个动作（copy、save、resetColumns、contextMenu、askAgent）/ 动作的快捷键写法。',
          },
          {
            name: 'texts',
            type: 'Partial<DataGridTexts>',
            desc: '菜单项与可访问名称的文案；copy、save、resetColumns 三项都给了菜单里才有标准项。',
          },
          {
            name: 'renderMenu',
            type: '(entries) => ReactNode',
            desc: '宿主的菜单项比包里的多时自己画；省略时包里画 item / 二级 / 分隔线。',
          },
          {
            name: 'askAgent',
            type: '(text | null) => void',
            desc: '问 Agent：给了它，又给了 askText，菜单多一项、表获得焦点时按键也一样。',
          },
        ],
      },
      {
        part: 'tableCsv(header, rows)',
        note: '导出的 CSV：含逗号、引号、换行的格子加引号，公式开头的补单引号。',
        rows: [],
      },
    ],
    states: [
      '无行：显示 emptyText 或空白，表头仍在。',
      '有选中行：一整行底色，Esc 清掉。',
      '键盘所在行：焦点环；排序列：表头带升降箭头。',
      '只读（interactive=false）：table 语义，表头不是按钮。',
      '子行：有子行的行带 aria-expanded（true 摊开、false 收起）；没有子行的行没有这个属性，按 → 没反应。',
      'custom 列没有 text 时复制与导出是空字；有按钮的格子别指望整行点击。',
    ],
    donts: [
      '不要把例子里的数据当真实行情；调用方要传真实行。',
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
      ['菜单键 / Shift+F10', '开右键菜单（宿主的 matchKey 提供）'],
      ['Ctrl+C / Ctrl+S / Ctrl+R', '复制所选行 / 导出 CSV / 重置列（宿主的键位表）'],
    ],
  },
  {
    id: 'empty-state',
    group: 'blocks',
    cardHeight: 260,
    title: 'EmptyState 空态',
    summary: '面板的「空」态：点阵小标签、一行标题、说明与动作。没有连接、没选品种、没有数据时摆它，不画假数据。',
    exports: ['EmptyState'],
    props: [
      {
        part: 'EmptyState',
        rows: [
          { name: 'tag', type: 'string', desc: '点阵小标签；点阵字体没打包时回退到等宽字体。' },
          { name: 'title', type: 'string', desc: '标题。' },
          { name: 'children', type: 'ReactNode', desc: '标题下的说明。' },
          { name: 'actions', type: 'ReactNode', desc: '动作区（按钮）。' },
          {
            name: 'classNames',
            type: 'Partial<Record<root | tag | title | text | actions, string>>',
            desc: '各部分额外类名。',
          },
        ],
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
    cardHeight: 300,
    title: 'PanelFrame 面板外壳',
    summary:
      '面板的外壳：编号、标题、对象、联动灯、点阵元信息位、局部工具条、右侧图标钮与底部来源行。聚焦时四角画橙色括号。面板不自己画边框与阴影。',
    exports: ['PanelFrame'],
    props: [
      {
        part: 'PanelFrame',
        rows: [
          { name: 'index', type: 'string', desc: '面板编号（01、02……），强调色点阵字。' },
          { name: 'title', type: 'string', desc: '标题，同时是外壳的读屏名。' },
          { name: 'object', type: 'string', desc: '当前对象，标题后的小字；前面的「·」由外壳画。' },
          {
            name: 'linkGroup / linkLabel / pinned',
            type: 'LinkGroup | null / string / boolean',
            desc: '联动组色灯；pinned 画空心圈。',
          },
          { name: 'meta', type: 'string', desc: '点阵元信息位（刷新频率、周期之类）。' },
          { name: 'toolbar', type: 'ReactNode', desc: '局部工具条，放在标题与图标钮之间。' },
          { name: 'source', type: 'ReactNode', desc: '来源行位：底部一行点阵字，不给就没有。' },
          {
            name: 'focused / brackets',
            type: 'boolean',
            desc: '聚焦面板标题 ink-100；brackets 默认跟着 focused，画四角橙色括号。',
          },
          {
            name: 'maximized / onSettings / onMaximize / onClose',
            type: 'boolean / () => void',
            desc: '右侧图标钮；不传回调就不画那个钮。',
          },
          { name: 'labels', type: 'PanelFrameLabels', desc: '设置 / 最大化 / 还原 / 关闭的读屏名，由调用方传。' },
        ],
      },
    ],
    states: ['普通：标题 ink-300。', '聚焦：标题 ink-100，四角橙色括号。', '空态：正文摆 EmptyState，不画假数据。'],
    donts: ['不要在面板里再画边框与阴影。', '不要把橙色用在数据上；它只给括号与状态灯。', '标题栏图标钮不超过 3 个。'],
    composition:
      'PanelFrame（section）\n  头：编号 | 联动灯 | 标题 | 对象 | 工具条 | 元信息 | 图标钮\n  正文\n  来源行\n  角括号（装饰）',
    keys: [],
  },
  {
    id: 'toolbar',
    group: 'blocks',
    cardHeight: 150,
    title: 'Toolbar 工具条',
    summary:
      '面板头的工具条零件：role=toolbar 的容器、左右两组、每个工具一个槽、图标或文字按钮。哪些放得下、收进「»」是宿主的事（要量宽度）。',
    exports: ['Toolbar', 'ToolbarGroup', 'ToolSlot', 'ToolButton', 'useRovingToolbar'],
    props: [
      {
        part: 'Toolbar',
        note: '其余属性透传给 div；ref 给宿主量宽度、找子元素。',
        rows: [{ name: 'label', type: 'string', desc: '工具条的名字（屏幕阅读器念）。' }],
      },
      { part: 'ToolbarGroup', rows: [{ name: 'side', type: "'left' | 'right'", desc: '左组或右组。' }] },
      {
        part: 'ToolSlot',
        rows: [
          { name: 'tool', type: 'string', desc: '工具 id，写成 data-tool，宿主据此量宽度。' },
          { name: 'folded', type: 'boolean', desc: '收起：藏起来但不拆掉（量宽度还要用）。' },
          { name: 'separator', type: 'boolean', desc: '前面画一道分隔线（相邻工具属于不同用途组）。' },
        ],
      },
      {
        part: 'ToolButton',
        rows: [
          { name: 'label', type: 'string', desc: '按钮的名字（aria-label，也是没有 title 时的悬停提示）。' },
          { name: 'title', type: 'string', desc: '悬停提示（比名字多一句说明）。' },
          { name: 'keys', type: 'ReactNode', desc: '提示里跟在后面的快捷键写法。' },
          { name: 'pressed', type: 'boolean', desc: '开关类工具是否开着（aria-pressed，橙色）。' },
          { name: 'renderTooltip', type: '(button) => ReactElement', desc: '宿主有自己的提示件时包按钮。' },
        ],
      },
      {
        part: 'useRovingToolbar(ref)',
        note: 'Toolbar 内部用；自己拼工具条的也可以拿去。整条只占一个 Tab 站。',
        rows: [],
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
    summary: '琥珀色描边的小字标记（例如「按 K 线估算」），悬停写规则摘要；字与规则由调用方传。',
    exports: ['EstimateBadge'],
    props: [
      {
        part: 'EstimateBadge',
        rows: [
          { name: 'label', type: 'string', desc: '标记上的字。' },
          { name: 'title', type: 'string', desc: '悬停提示。' },
        ],
      },
    ],
    states: ['只有一种样子：小标，悬停给出估算依据。'],
    donts: ['不要在精确值上挂估算标记。', '不要省略 title 里的依据。'],
    composition: 'EstimateBadge',
    keys: [],
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
      '一列数从旧到新，整宽铺开、上下按这列的高低，一根线。线色按头尾涨跌（涨跌色跟涨跌配色走），没有数据只留「—」。从应用的分析视图提来。',
    exports: ['Sparkline', 'sparkPoints', 'sparkTone', 'quoteTone'],
    props: [
      {
        part: 'Sparkline',
        rows: [
          { name: 'values', type: 'readonly number[]', desc: '从旧到新；少于两个数画「—」。' },
          { name: 'label', type: 'string', desc: '读屏名（整句，含没有数据的说法），必填，由调用方按界面语言写。' },
          { name: 'tone', type: "'up' | 'down' | 'flat'", desc: '不给就按头尾涨跌。' },
          { name: 'className / emptyClassName', type: 'string', desc: '加在折线 svg 与空态「—」上。' },
        ],
      },
      {
        part: '纯函数',
        note: 'sparkPoints(values, width, height) 给 polyline 的点；sparkTone(values) 取头尾三态；quoteTone(change) 由一个涨跌数取三态（报价类的件共用）。',
        rows: [],
      },
    ],
    states: [
      '有数据：一根折线，线色按头尾涨跌（涨、跌、平）。',
      '没有数据（少于两个数）：只留「—」，读屏名说清没有数据。',
    ],
    donts: [
      '不要在折线上读具体数值：它只表达走势，要数请配价格文字。',
      '不要把读屏名写死在包里，由调用方按界面语言传。',
    ],
    composition: 'Sparkline\n  svg role=img\n    polyline（vector-effect: non-scaling-stroke，线宽不随拉伸变）',
    keys: [],
  },
  {
    id: 'gauge-bar',
    group: 'quotes',
    cardHeight: 78,
    title: 'GaugeBar 进度条',
    summary:
      '上面一行名字、数和档位词，中间一条进度条标出数的位置，下面一句说明数是怎么来的。取不到时不画填充，数那里写原因。从应用的分析视图提来。',
    exports: ['GaugeBar'],
    props: [
      {
        part: 'GaugeBar',
        rows: [
          { name: 'label', type: 'ReactNode', desc: '名字。' },
          { name: 'value', type: 'ReactNode', desc: '已格式化好的数。' },
          { name: 'unavailable', type: 'boolean', desc: '数取不到：换成弱色小字。' },
          {
            name: 'share',
            type: 'number | null',
            desc: '数在最小到最大之间的位置（0 到 1，越界按边画）；null 不画填充。填充宽度按 snappy 弹簧变。',
          },
          { name: 'level', type: 'ReactNode', desc: '档位词，常是一枚徽标。' },
          { name: 'note', type: 'ReactNode', desc: '下面一句说明。' },
          {
            name: 'classes',
            type: 'GaugeBarClasses',
            desc: '每个部位（root、head、label、value、track、fill、note）额外加的类名，写在包里类名之后。',
          },
        ],
      },
    ],
    states: [
      '有位置：填充占轨道的 share，宽度按 snappy 弹簧变。',
      '取不到（share 为 null）：不画填充，数换成弱色小字并写原因。',
      '越界的 share 按边画。',
    ],
    donts: ['不要用它表达多段或多值：它只标一个数在区间里的位置。', '不要省掉说明一句：数怎么来的要写在 note 里。'],
    composition: 'GaugeBar\n  figcaption（label · value · level）\n  div（轨道）\n    span（填充）\n  p（note）',
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
    props: [
      {
        part: 'Treemap',
        note: '排布由调用方先用 layoutTreemap 算好再传 blocks；工具条（下拉、返回钮）从 toolbar 传。',
        rows: [
          { name: 'blocks', type: 'TreemapBlock<T>[]', desc: 'layoutTreemap 的结果。' },
          { name: 'heads', type: 'boolean', default: 'false', desc: '画组头（可点下钻）；下钻之后传 false。' },
          {
            name: 'describe',
            type: '(data: T) => { name, text, change }',
            desc: '一格上写的名字与数，change 是颜色用的涨跌数（小数，null 是没有数）。',
          },
          {
            name: 'limit',
            type: 'number',
            default: '0.03',
            desc: '色例两端是多少（小数）：涨跌幅按 ±limit 切成 −3 到 +3 七档。',
          },
          { name: 'legendText', type: '(step: number) => string', desc: '色例上每一档写的字。' },
          { name: 'toolbar', type: 'ReactNode', desc: '格子上面一行。' },
          {
            name: 'onGroup / onItem',
            type: 'function',
            desc: '点组头、点格子（给了 onItem 格子才是可聚焦的按钮，回车触发）。',
          },
          { name: 'classes', type: 'TreemapClasses', desc: '各部位额外的类名。' },
        ],
      },
      {
        part: 'layoutTreemap(items, grouped)',
        note: 'items 是 { data, size, group }；size 不是正数的项不画；grouped 为 false 整张一块。colorStep(change, limit) 返回 −3 到 3 或 null。',
        rows: [],
      },
    ],
    states: [
      '默认：一格一项，面积按大小，颜色七档。',
      '分组下钻：点组头只剩那一组，工具条里自己放返回钮。',
      '格子太小时只留色块，不写字。',
      '没有涨跌数的格子用中性色。',
    ],
    donts: [
      '不要用于项目数很多又没法下钻的场景，小格会糊成一片。',
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
    summary: '夹在一句话或一行里的「名字 价格 涨跌」，数字等宽对齐，涨跌带三角与颜色，跟着周围的字号走。',
    exports: ['PriceTag'],
    props: [
      {
        part: 'PriceTag',
        rows: [
          { name: 'name', type: 'string', desc: '品种名或代码；不给就只有价与涨跌。' },
          { name: 'price', type: 'string', desc: '已格式化好的价。' },
          { name: 'change', type: 'string', desc: '已格式化好的涨跌（带符号）。' },
          {
            name: 'tone',
            type: "'up' | 'down' | 'flat'",
            default: "'flat'",
            desc: '涨跌三态：定颜色与三角（▲ ▼，平没有）。',
          },
          { name: 'label', type: 'string', desc: '读屏读的整句；不给就读可见的字。' },
        ],
      },
    ],
    states: ['涨、跌：涨跌文字带三角与对应颜色。', '平：没有三角，用弱色。', '只有价格：不写名字与涨跌。'],
    donts: ['不要只靠颜色表达涨跌：三角与带符号的文字必须在。', '不要在包里格式化数字，价与涨跌由调用方传好。'],
    composition: 'PriceTag\n  span（名字）\n  span（价）\n  span（三角 · 涨跌）',
    keys: [],
  },
  {
    id: 'quote-card',
    group: 'quotes',
    cardHeight: 300,
    title: 'QuoteCard 报价卡',
    summary:
      '一只品种一张卡：名字与代码、最新价（大）、涨跌与涨跌幅、可选的迷你图与底部一行；QuoteStrip 是一排小号的卡，放不下横向滚动。',
    exports: ['QuoteCard', 'QuoteStrip'],
    props: [
      {
        part: 'QuoteCard',
        rows: [
          { name: 'name / symbol', type: 'string', desc: '名字与代码。' },
          { name: 'price / change / percent', type: 'string', desc: '已格式化好的价、涨跌额、涨跌幅。' },
          { name: 'tone', type: "'up' | 'down' | 'flat'", default: "'flat'", desc: '涨跌三态。' },
          { name: 'spark / sparkLabel', type: 'number[] / string', desc: '迷你图的数与读屏名；不给 spark 就不画。' },
          { name: 'footer', type: 'ReactNode', desc: '卡下面一行，常放 RangeBar。' },
          { name: 'size', type: "'md' | 'sm'", default: "'md'", desc: 'sm 是 148 宽的小卡，QuoteStrip 里用。' },
          { name: 'onSelect', type: '() => void', desc: '给了整张卡渲染成一个按钮（悬停提亮、按下缩到 0.98）。' },
        ],
      },
      {
        part: 'QuoteStrip',
        rows: [
          { name: 'label', type: 'string', desc: '读屏名，必填。' },
          { name: 'items', type: '(QuoteCardProps & { id })[]', desc: '每张卡的属性加一个 id。' },
        ],
      },
    ],
    states: [
      '默认：名字、价、涨跌；可带迷你图与底部一行。',
      '可点：整张卡是按钮，悬停提亮、按下缩到 0.98、键盘焦点有环。',
      '小号（QuoteStrip 里）：148 宽，放不下横向滚动。',
    ],
    donts: ['不要在卡里再放可点的子元素：给了 onSelect 整张卡已是按钮。', '不要把一排卡折行成网格：一排就是横向滚动。'],
    composition:
      'QuoteCard\n  span（名字 · 代码）\n  span（价）\n  span（三角 · 涨跌 · 涨跌幅）\n  Sparkline\n  span（footer）\nQuoteStrip\n  div role=list\n    div role=listitem\n      QuoteCard size=sm',
    keys: [['Tab / Enter', '有 onSelect 时到卡上、触发']],
  },
  {
    id: 'range-bar',
    group: 'quotes',
    cardHeight: 60,
    title: 'RangeBar 区间条',
    summary: '一条横线从最低到最高，标记指着现价在区间里的位置，两端写最低与最高。用来看当日区间、52 周区间。',
    exports: ['RangeBar', 'rangeShare'],
    props: [
      {
        part: 'RangeBar',
        rows: [
          {
            name: 'low / high / value',
            type: 'number',
            desc: '最低、最高、现价。现价在区间外贴边；最高不大于最低时不画标记。',
          },
          { name: 'format', type: '(value: number) => string', desc: '数怎么写；不给最多两位小数。' },
          { name: 'label', type: 'string', desc: '读屏名（role=meter），必填。' },
          { name: 'lowLabel / highLabel', type: 'string', desc: '两端数上面的小标题。' },
        ],
      },
      { part: 'rangeShare(low, high, value)', note: '现价在区间里的位置 0 到 1；算不出是 null。', rows: [] },
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
    props: [
      {
        part: 'RatingGauge',
        rows: [
          {
            name: 'score',
            type: 'number',
            desc: '−1（强烈卖出）到 +1（强烈买入），平分五段；越界夹到边，不是有限数当 0。',
          },
          { name: 'zones', type: '[string × 5]', desc: '五段的名字，从卖到买，档位词也取自这里。' },
          { name: 'label', type: 'string', desc: '读屏名，必填。' },
          { name: 'children', type: 'ReactNode', desc: '档位词下面再写点什么（个数统计）。' },
        ],
      },
      {
        part: 'ratingZone(score) / ratingAngle(score)',
        note: '落在第几段（0 到 4）；指针转角（度，−90 到 +90）。',
        rows: [],
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
    id: 'quote-table',
    group: 'quotes',
    cardHeight: 250,
    title: 'QuoteTable 分组页签行情表',
    summary:
      '上面一排页签（指数、自选、热门……），下面是当前这组的行情表：名称与代码、迷你图、最新价、涨跌幅。由 Tabs 与 Sparkline 组出来。',
    exports: ['QuoteTable'],
    props: [
      {
        part: 'QuoteTable',
        note: '页签值可受控（value / onValueChange）也可不受控（defaultValue，默认第一组）。',
        rows: [
          {
            name: 'groups',
            type: '{ id, label, rows: QuoteRow[] }[]',
            desc: '每组一个页签；QuoteRow 是 { id, name, symbol?, price, percent?, tone?, spark?, sparkLabel? }。',
          },
          { name: 'columns', type: '{ name, trend, price, change }', desc: '表头四列的字。' },
          { name: 'empty', type: 'string', desc: '这一组没有行时写的字。' },
          { name: 'label', type: 'string', desc: '页签条的读屏名。' },
          { name: 'onRow', type: '(row: QuoteRow) => void', desc: '给了行可点、可聚焦，回车触发。' },
        ],
      },
    ],
    states: [
      '默认：第一组页签选中，下面是该组行情表。',
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
          { name: 'labels', type: '{ low: string; high: string }', desc: '两个把手的读屏名（必填）。' },
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
]

export const pageById = (id: string): DocPage | undefined => PAGES.find((page) => page.id === id)
