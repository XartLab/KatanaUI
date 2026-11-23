// SPDX-License-Identifier: MIT
// TagCombobox（#193）的「怎么用 / 无障碍」。一条一句，写数值和做法；已定的样子也写在这里（用户 2026-11-17：设计决定要进文档站）。
import type { GuidanceMap } from './types'

const tagCombobox: GuidanceMap = {
  'tag-combobox': {
    aliases: [
      'Multi select combobox',
      'Multiselect combo box (Salt)',
      'Tokenized combobox',
      'Chips autocomplete',
      '带标签的多选',
      '多选搜索框',
    ],
    use: [
      '从上十项的固定候选里挑多个，并且要一眼看见选了谁：评审人、策略类型、品种清单。',
      '候选行带头像、图标或一句角色说明时（prefix、description）。',
    ],
    avoid: [
      '标签是用户自由打出来的字（代码清单、关键词）用 TagInput。',
      '只选一个值用 Combobox 或 Select；候选少于十来项用 MultiSelect 或 ChipGroup。',
      '候选要按市场、分组分段或带底栏的，先用 Combobox 的多选拼，这件不分组。',
    ],
    a11y: [
      '输入框是 combobox：aria-expanded 随列表开关，列表有行时 aria-controls 指向它，aria-activedescendant 指高亮行，焦点始终留在输入框。',
      '列表是 listbox（aria-multiselectable），行是 option；aria-selected 表示「已选」，不是高亮（跟 Combobox 的 cmdk 行相反，这里不用 cmdk）。',
      '输入框的读屏名取 label；列表的读屏名取 labels.list，不传就用 label。',
      '标签上的 × 与右端箭头是按钮，读屏名由 labels.remove(label)、labels.toggle 给；两者不进 Tab 序列，键盘走 Backspace、← →，按下不抢输入框焦点。',
      '选中、移除、选中标签都在一个 aria-live=polite 的屏外区播报（labels.added、removed、picked，可选）；没有匹配的提示是 role=status。',
      'prefix（头像、图标）对读屏隐藏：label 写全名字，别让名字只存在于图片里。',
      '弹层容器 role=presentation（不是 Radix 默认的无名 dialog），axe 在 Graphite 与 Console 下都无违规。',
    ],
  },
}

export default tagCombobox
