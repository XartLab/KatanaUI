// SPDX-License-Identifier: MIT
// #1954 从 Arc 照搬的三件（拆分按钮、标签输入、原地改名）的「怎么用 / 无障碍」。
import type { GuidanceMap } from './types'

const arcInputs: GuidanceMap = {
  'split-button': {
    aliases: ['Split button', 'Menu button with default action', 'Dropdown button', '拆分按钮', '组合按钮'],
    use: [
      '一个常用动作加几个同类变体：买入的委托类型、平仓的方式、保存的方式。',
      '工具条上「记住上次用的」那种分组按钮：菜单里选了谁，调用方把主按钮换成谁。',
    ],
    avoid: ['动作之间不是同一类时用 DropdownMenu 或 Toolbar。', '不可撤的主动作用 HoldToConfirm。'],
    a11y: [
      '两半是两个原生 button：主按钮读屏名取它的字，箭头那半取 labels.menu，并带 aria-haspopup=menu 与 aria-expanded。',
      '主按钮带 aria-keyshortcuts=Alt+ArrowDown：焦点在它上面也能开菜单。',
      '菜单关上后焦点回到箭头那半（Radix 的规矩）。',
    ],
  },
  'tag-input': {
    aliases: ['Tag input', 'Tokenized input (Salt)', 'Chips input', '标签输入', '代码清单输入'],
    use: ['自由输入的一组短词：品种代码清单、策略标签、检索关键词。', '要粘一串代码进来一次拆开的地方。'],
    avoid: ['从固定一组里选用 MultiSelect、ChipGroup 或 AnimatedTags。', '只有一个值用 Input。'],
    a11y: [
      '输入框的读屏名取 label；被拒时 aria-invalid，并用 aria-describedby 指到框下的原因。',
      '加入、移除、重复、选中都在一个 aria-live=polite 的屏外区播报，文字由 labels 给。',
      '标签上的 × 不进 Tab 序列，键盘走退格选中再删；读屏的浏览模式仍能点到它（读屏名 labels.remove）。',
    ],
  },
  'inline-edit': {
    aliases: ['Inline edit', 'Editable label (Salt)', 'Click to edit', '原地编辑', '原地改名'],
    use: [
      '读得多、改得少的单个短字段：分组名、布局名、策略名、预警名。',
      '标题本身就要能改的地方（as="h2"）。',
      '失焦即保存，编辑中被卸载（条件渲染、树上点了另一项）与失焦一致：草稿与原值不同、校验也过就补调一次 onSave，草稿不丢；组字中被卸载用组字前已确认的文字；卸载后看不到保存结果，onSave 失败也只能吞掉，要处理失败的调用方别在编辑态卸载它。',
    ],
    avoid: ['几个字段一起存用表单。', '下单参数用 NumberInput。'],
    a11y: [
      '组字中的 Enter（选字）与 Esc（取消候选词）不触发保存与放弃（isComposing 或 keyCode 229）。',
      '静止时是原生 button，读屏名「label: 值」，描述是 labels.editHint；Enter 或空格进编辑并全选。',
      '编辑时 input 的读屏名取 label；校验不过 aria-invalid，并指到框下的原因。',
      '保存中、已保存在 role=status 的屏外区播报；失败的说明与「重试」按钮在框下，看得见。',
    ],
  },
}

export default arcInputs
