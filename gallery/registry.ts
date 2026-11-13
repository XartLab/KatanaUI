// SPDX-License-Identifier: AGPL-3.0-only
// 组件文档站的目录与每页的文字（#1860）：只有数据，不引组件，单测（registry.test.ts）拿它跟 src/index.ts 的出口对账。
// 版式照 kobra.systems/components/<件名> 的结构（2026-11-14 读）：左侧目录按类分组，右侧一个组件一页，页上依次是预览、属性、组成、键盘。
// 属性表手写，跟组件的 TS 类型对：改了组件的属性要同步改这里（Radix 底座透传的属性不逐条列，每张表的说明里写透传给谁）。

export type GroupId = 'forms' | 'overlays' | 'layout' | 'readouts' | 'feedback'

export const GROUPS: readonly { id: GroupId; title: string }[] = [
  { id: 'forms', title: '表单控件' },
  { id: 'overlays', title: '浮层' },
  { id: 'layout', title: '布局与导航' },
  { id: 'readouts', title: '读数与状态' },
  { id: 'feedback', title: '反馈' },
]

export type PropRow = { name: string; type: string; default?: string; desc: string }
export type PropTable = { part: string; note?: string; rows: readonly PropRow[] }

export type DocPage = {
  /** 地址 `#/<id>`，也是预览容器的 data-gallery。 */
  id: string
  group: GroupId
  title: string
  summary: string
  /** 这一页覆盖的 `@katanaview/ui` 出口名（部件、变体函数、类名常量、钩子）。registry.test.ts 要求：出口与页一一对应。 */
  exports: readonly string[]
  props: readonly PropTable[]
  /** 组成：由哪几个导出的部件拼出来，缩进表示嵌套。 */
  composition: string
  /** 键盘：[键, 做什么]；没有键盘交互的件留空。 */
  keys: readonly (readonly [string, string])[]
}

/** 不是组件的出口：样式合并与焦点环的类名工具，不单独成页。 */
export const NON_COMPONENT_EXPORTS: readonly string[] = ['cn', 'focusRing', 'focusRingInset']

const RADIX = (name: string) => `其余属性透传给 Radix ${name}。`

export const PAGES: readonly DocPage[] = [
  {
    id: 'button',
    group: 'forms',
    title: 'Button 按钮',
    summary: '30 高的默认按钮，六种变体与三种尺寸；悬停提亮、按下缩到 0.97，禁用降到 45% 不透明度。',
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
    composition: 'Button',
    keys: [
      ['Tab', '聚焦，焦点环 2px'],
      ['Enter / Space', '触发点击'],
    ],
  },
  {
    id: 'input',
    group: 'forms',
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
    composition: 'Input',
    keys: [['Tab', '聚焦；聚焦时边框提亮']],
  },
  {
    id: 'select',
    group: 'forms',
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
    composition: 'Checkbox',
    keys: [
      ['Tab', '聚焦'],
      ['Space', '翻转选中'],
    ],
  },
  {
    id: 'switch',
    group: 'forms',
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
    composition: 'Switch',
    keys: [
      ['Tab', '聚焦'],
      ['Space / Enter', '翻转'],
    ],
  },
  {
    id: 'toggle-group',
    group: 'forms',
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
    composition: 'ToggleGroup\n  ToggleGroupItem',
    keys: [
      ['Tab', '每个按钮都是停靠点（不是方向键走的一组）'],
      ['Space / Enter', '选中这一项'],
    ],
  },
  {
    id: 'slider',
    group: 'forms',
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
    composition: 'TooltipProvider\n  Tooltip\n    TooltipTrigger\n    TooltipContent',
    keys: [
      ['Tab', '聚焦触发器时出现'],
      ['Esc', '收起'],
    ],
  },
  {
    id: 'popover',
    group: 'overlays',
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
    composition: 'Led',
    keys: [],
  },
  {
    id: 'lcd',
    group: 'readouts',
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
    composition: 'Lcd',
    keys: [],
  },
  {
    id: 'dot-matrix',
    group: 'readouts',
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
    composition: 'svg\n  defs\n    DotMatrix\n  rect (fill="url(#id)")',
    keys: [],
  },
  {
    id: 'rolling-text',
    group: 'readouts',
    title: 'RollingText 滚动数字',
    summary: '数字逐位滚动：变了的那几位旧字滚出、新字滚入，涨往上、跌往下，整串闪一下涨色或跌色。',
    exports: ['RollingText', 'rollSlots'],
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
    ],
    composition: 'RollingText',
    keys: [],
  },
  {
    id: 'badge',
    group: 'readouts',
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
    composition: 'BadgeGroup',
    keys: [],
  },
  {
    id: 'kbd',
    group: 'readouts',
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
    composition: 'Kbd',
    keys: [],
  },
  {
    id: 'number-input',
    group: 'forms',
    title: 'NumberInput 数字框',
    summary: '一个框：值加可选的单位后缀，没有 −/+ 按钮；打字、方向键、按住左右拖三种改法。',
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
        ],
      },
    ],
    composition: 'NumberInput\n  input[role=spinbutton]\n  span.k-unit（有 unit 时）',
    keys: [
      ['↑ ↓', '按步长加减；Shift 十档，Alt 精调'],
      ['PageUp / PageDown', '十档'],
      ['Ctrl + Home / End', '跳到 min / max'],
      ['Enter / Esc', '放弃正在打的字'],
      ['拖动', '按住左右拖：向右变大；Shift 粗调、Alt 精调'],
    ],
  },
  {
    id: 'date-time-input',
    group: 'forms',
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
    id: 'skeleton',
    group: 'feedback',
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
    composition: 'Loading\n  LoadingWait（计时）\n    LoadingView\n      Led\n      Button（重试）\n      Skeleton',
    keys: [['Tab', '10 秒后的重试按钮可聚焦；Enter / Space 触发']],
  },
]

export const pageById = (id: string): DocPage | undefined => PAGES.find((page) => page.id === id)
