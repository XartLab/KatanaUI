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
    avoid: ['只读的补充说明用 tooltip 或 hover-card。', '要打断用户裁决用 dialog。', '一串命令用 dropdown-menu。'],
    a11y: [
      'Radix Popover，内容是 role=dialog，打开后焦点进入，关闭还给触发器。',
      '用 PopoverTitle 给它名字。',
      '点外面或按 Esc 收起。',
    ],
  },
  dialog: {
    aliases: ['Modal', 'Alert dialog', 'Lightbox', 'Overlay'],
    use: ['需要用户立刻裁决或填写的事（确认、改设置）。', '必须打断当前操作时。'],
    avoid: ['不需要打断的内容用 popover 或 sheet。', '侧边详情用 sheet。', '只是通知用 toast 或 alert。'],
    a11y: [
      'Radix Dialog，role=dialog、aria-modal，名字取 DialogTitle，说明取 DialogDescription。',
      '焦点锁在里面，关闭后回到打开前的元素。',
      '右上角关闭钮的读屏名由 closeLabel 传。',
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
    avoid: ['要用户裁决的事用 dialog。', '一小块内容用 popover。', '常驻的侧栏用 side-nav 或 splitter。'],
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
      '行可带前缀图标、主文字后的灰色说明（description，数值与文字由调用方写，12px 次要色，超宽截断）、元信息徽标（meta，Tag 的中性色）；带 steps 的命令没写 meta 就画 labels.steps(n)（「2 步」）。',
      '多步命令（#194，交互借 Jamie Merrill 的 Command menu，只借交互）：命令声明 steps，选中后面板不关、进第一步；一步是一页，页上筛选框过滤本步选项；每页的主操作是「下一步」，最后一页是 runLabel 或 labels.steps.run，调 onRun(命令 id, { 步 id: 选中的 id 串 }) 后关面板、记进最近。',
      '头部是一句话：命令名，后接每一步的 joiner 与已选标签（「批量导出 从 [美股][港股] 含 [开高低收]」），随勾选实时更新；每步最多 3 个标签，其余折成「+N」。标签是中性 Tag，不用蓝色、紫色。',
      '内置一种步，多选清单：全选行在最前（三态，筛选时只动可见的行）、每行勾选框加主文字加灰色说明；其余内容用 kind: "custom" 自己画，值同样是 id 串。',
      '脚栏：左「已选 N 项」（role=status，读屏会念变化），右「返回」与主操作；这一步 required（默认）而一项没选，主操作禁用。',
      '退路：Backspace（输入为空，按住连发不算）或「返回」退一步，离开的这一步的选择清掉、更早几步的留着；第一步退回命令列表、选择清空。Esc 在步骤页里也是直接关面板，不是退一步。',
    ],
    avoid: ['选一个表单值用 combobox。', '品种搜索带市场页签与过滤，用 SymbolSearch（另一个模块）。'],
    a11y: [
      '同 command：输入框是 combobox、列表是 listbox、行是 option，焦点留在输入框里。',
      '「最近」是带标题的 group，读屏会念组名。',
      'Esc 关闭，焦点回打开前的元素（Dialog 的行为）。走完多步命令后面板关闭，焦点同样回到打开前的元素。',
      '步骤页不用 cmdk 的行：cmdk 的行总是 role=option、aria-selected 说的是高亮，表达不了「已选」。清单步用 APG 的「输入框加多选 listbox」：筛选框是 combobox（aria-expanded、aria-controls 指 listbox、aria-activedescendant 指高亮行），列表是 aria-multiselectable 的 listbox，行是 option，aria-selected 就是「已选」（高亮靠 aria-activedescendant 与 data-active 的底色，两件事不混）；全选行是 option 加 aria-checked=mixed 表示部分。',
      '为什么不选「checkbox 加 roving tabindex」：aria-activedescendant 只有在 combobox 上，读屏（NVDA、VoiceOver）才可靠地念高亮行的变化，普通 textbox 加兄弟节点里的 checkbox 往往不念；多选 listbox 里 option 读成「已选 / 未选」，是读屏用户熟悉的样子；焦点留在筛选框里，边打字边筛边用 ↑↓ 走，不用在输入框与行之间来回切焦点。代价是行不能各自 Tab。',
      '读屏实测：这一条还没在 NVDA 或 VoiceOver 上实测（写这条时没有读屏环境），只过了 axe 与 e2e 对 ARIA 属性的断言；实测结果出来再补在这里。',
      '步骤页的筛选框用 aria-describedby 指向头部句子（命令名加已选标签）与本步标题，聚焦时读屏会念「批量导出 从 美股 港股 …」；custom 步没有清单，它是普通文本框，同样带这个说明。',
      '换步时 CommandSteps 不重新挂载，焦点已在筛选框上，读屏不会播报；所以每页有一个 role=status 的视觉隐藏文字，内容是 labels.steps.stepOf(第几步, 共几步, 标题)（如「第 2 步，共 2 步：选择字段」），换步时文字变化被念出来；只有一步的命令不画它。字由调用方传。',
      '键盘归属：步骤页内的 Enter、Home、End、↑↓（与 Ctrl+N/J/P）不再冒到 cmdk（它对这些键一律 preventDefault：按钮按 Enter 不会点击、输入框 Home / End 移不了光标、多行框 Enter 不换行）；custom 步里调用方的控件键盘自己管。Ctrl+K 不拦，照常冒到 document，登记在那里的 Mod+K 收得到。',
      '步骤页换步、从第一步退回列表时焦点都回到筛选框，不落到 body。',
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
