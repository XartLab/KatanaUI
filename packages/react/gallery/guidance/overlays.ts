// SPDX-License-Identifier: MIT
// 浮层组的「怎么用 / 无障碍」（照 Salt 组件页）。
import type { GuidanceMap } from './types'

const overlays: GuidanceMap = {
  tooltip: {
    aliases: ['Tip', 'Hint', 'Title attribute', 'Popup label'],
    use: ['给图标按钮补一句名字或快捷键。', '解释一个缩写、截断的文字。'],
    avoid: ['里面要放链接或按钮用 popover。', '想补充一小块信息用 hover-card。', '必须读到的内容直接写在页面上。'],
    a11y: [
      'Radix Tooltip，浮层是 role=tooltip，触发器靠 aria-describedby 指向它。',
      '聚焦触发器也会出现。',
      '触屏没有悬停，别只放在这里。',
    ],
  },
  popover: {
    aliases: ['Popup', 'Dropdown panel', 'Floating panel', 'Flyout'],
    use: ['点开一小块可操作的内容（筛选项、设置）。', '菜单、选择器等需要同一块材质的浮层底座。'],
    avoid: [
      '只读的补充说明用 tooltip 或 hover-card。',
      '要打断用户裁决用 dialog 或 alert-dialog。',
      '一串命令用 dropdown-menu。',
    ],
    a11y: [
      'Radix Popover，内容是 role=dialog，打开后焦点进入，关闭还给触发器。',
      '用 PopoverTitle 给它名字。',
      '点外面或按 Esc 收起。',
    ],
  },
  dialog: {
    aliases: ['Modal', 'Lightbox', 'Overlay'],
    use: ['需要用户填写或多步操作的事（改设置、填表）。', '必须打断当前操作时。'],
    avoid: [
      '不能撤回、只要选「做 / 不做」的确认用 alert-dialog。',
      '不需要打断的内容用 popover 或 sheet。',
      '只是通知用 toast 或 alert。',
    ],
    a11y: [
      'Radix Dialog，role=dialog、aria-modal，名字取 DialogTitle，说明取 DialogDescription。',
      '焦点锁在里面，关闭后回到打开前的元素。',
      '右上角关闭钮的读屏名由 closeLabel 传。',
    ],
  },
  'alert-dialog': {
    aliases: ['Alert dialog', 'Confirm dialog', 'Confirmation', 'Destructive confirm'],
    use: ['平仓、撤单、删除这类不能撤回的事，做之前要用户明确选一个。', '一句话说得清的用 size="sm"。'],
    avoid: ['能撤回的直接做并给撤销。', '要填表、多步的用 dialog。', '按钮不要写「确定」「是」，写动作本身。'],
    a11y: [
      'Radix AlertDialog，role=alertdialog、aria-modal，名字取 AlertDialogTitle，说明取 AlertDialogDescription。',
      '打开时焦点落在 AlertDialogCancel；点背板不关，只有取消、确认与 Esc 能关。',
      'Esc 只触发 onOpenChange(false)，不点取消钮：取消要做的事写在 onOpenChange 里，不要只写在取消钮的 onClick 里。',
    ],
  },
  'dropdown-menu': {
    aliases: ['Menu', 'Action menu', 'Overflow menu', 'Select menu'],
    use: ['一组相关动作收进一个触发器。', '带勾选、单选或二级菜单的设置项。'],
    avoid: ['项很多要搜索用 command。', '选一个值填表单用 select。', '右键触发用 context-menu。'],
    a11y: [
      'Radix 菜单：role=menu，项是 menuitem、menuitemcheckbox、menuitemradio。',
      '打开后焦点进菜单，关闭回触发器。',
      '禁用项用 aria-disabled，仍留在读屏序列里。',
    ],
  },
  'context-menu': {
    aliases: ['Right-click menu', 'Shortcut menu', 'Popup menu', 'Contextual menu'],
    use: ['图表、行等区域上的二级动作。', '给高级用户的快捷入口。'],
    avoid: ['唯一入口不要放右键里，同样的动作要有按钮。', '项很多用 command。', '按钮触发用 dropdown-menu。'],
    a11y: [
      'Radix 菜单：role=menu，项同下拉菜单。',
      '可由菜单键或 Shift+F10 在焦点处打开。',
      '关闭后焦点回到打开前的位置。',
    ],
  },
  sheet: {
    aliases: ['Drawer', 'Side panel', 'Slide-over', 'Offcanvas'],
    use: ['从边上滑出的详情、设置或筛选面板。', '需要看着主页面又要操作的内容。'],
    avoid: [
      '要用户裁决的事用 dialog 或 alert-dialog。',
      '一小块内容用 popover。',
      '常驻的侧栏用 side-nav 或 splitter。',
    ],
    a11y: [
      'Radix Dialog，role=dialog，名字取 SheetTitle，说明取 SheetDescription，必须带。',
      '焦点锁在里面，关闭回到触发器。',
      '关闭钮的读屏名由 closeLabel 传。',
    ],
  },
  'hover-card': {
    aliases: ['Preview card', 'Peek', 'Link preview', 'Rich tooltip'],
    use: ['悬停一个品种、用户名时预览补充信息。', '内容比 tooltip 长、但不需要操作。'],
    avoid: ['需要点里面的东西用 popover。', '一句话用 tooltip。', '重要信息直接写在页面。'],
    a11y: [
      'Radix HoverCard，只面向有指针的用户，读屏不会朗读卡里的内容，所以别把独有信息放这里。',
      '键盘聚焦触发器也会打开，Esc 收起。',
    ],
  },
  'command-palette': {
    aliases: ['Quick search', 'Command palette with recent', 'Spotlight', '快速搜索'],
    use: [
      '全局命令搜索（照 TradingView 的 Ctrl/Cmd+K 快速搜索）：CommandDialog 加「最近」分组，选过的命令放最前、去重、最多 5 条（recentLimit）。',
      '「最近」只在没输入时出现；一输入就按全部命令过滤，同一条不会出现两次；删掉的命令不在最近里显示。',
      '最近记录：受控（recent / onRecentChange）、recentKey 存 localStorage（usePersistedState，版本 1），都不给只记在页内存里。',
      '选中一条：先关面板、清掉搜索词，再执行；打开它的键一般用 useHotkeys 登记 Mod+K（allowInInput）。',
    ],
    avoid: ['选一个表单值用 combobox。', '品种搜索带市场页签与过滤，用 SymbolSearch（另一个模块）。'],
    a11y: [
      '同 command：输入框是 combobox、列表是 listbox、行是 option，焦点留在输入框里。',
      '「最近」是带标题的 group，读屏会念组名。',
      'Esc 关闭，焦点回打开前的元素（Dialog 的行为）。',
    ],
  },
  command: {
    aliases: ['Command palette', 'Command menu', 'Spotlight', 'Quick switcher'],
    use: ['全局搜命令、跳页面、切品种。', '很长的可搜索列表。'],
    avoid: ['选一个表单值用 combobox 或 select。', '少量固定动作用 dropdown-menu。'],
    a11y: [
      '底座是 cmdk：输入框是 combobox，列表是 listbox，行是 option。',
      '名字取 Command 的 label，CommandDialog 取标题。',
      'aria-selected 表示高亮，不是已选。',
      '焦点始终留在输入框里。',
      'cmdk 在可用的行上也写 data-disabled="false"：行的禁用样式只认 data-disabled="true"（以前按属性存在判断，每行都被画成禁用、对比度 2.67:1，G1 修）。',
      '分隔线是 role="none" 的装饰线，不用 cmdk 的 Separator（它写死 role="separator"，listbox 里不许有，axe aria-required-children）；有搜索词时照样隐去，alwaysRender 留着。',
    ],
  },
}

export default overlays
