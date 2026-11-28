# 基础件的键盘（UI SDK 行为层，#263）

Checkbox、Switch、MorphToggle、RadioGroup、Toggle、ChipGroup、Collapsible、Accordion、Tabs、ScrollArea 的行为底座从 Radix 换成了 UI SDK。点按的手感没变；下面几条键盘行为变了，验收按新的判。

## Sub-features

- `switch-space-only` Switch / MorphToggle：焦点在开关上，空格拨动，回车不拨动（APG 的 switch 只要求空格）。点它的 Label 也能拨。
- `accordion-tab-order` Accordion：Tab 在各标题钮之间移动；方向键不再在标题间移动。回车或空格展开收起。
- `collapsible-enter` Collapsible：回车展开收起，触发钮 `aria-expanded` 跟着变。
- `radio-arrow` RadioGroup：只有一个 Tab 停靠点；方向键移动并选中。
- `chip-arrow` ChipGroup：方向键在芯片间走，Tab 只停一个；空格开关；禁用的芯片仍可方向键走到，按不动。
- `toggle-enter-space` Toggle：回车与空格都切换 `aria-pressed`。

## How to get to it (user POV)

- 文档站「表单」里的 `#/switch`、`#/checkbox`、`#/radio-group`、`#/toggle`；「布局与导航」里的 `#/accordion`、`#/collapsible`；`#/morph-toggle`；`#/chip-group`。页签的键盘在 [Tabs 页签](tabs.md)。

## Driving it with kui.mjs

前置：`$KUI doctor` 全 OK。页上控件的读屏名按文档站当前文案写，先 `aria` 存一份快照再定名字（下面写的是 2026-11-28 页上的名字）。

- **Switch 空格不回车。** `#/switch`，`section.getByRole('switch', { name: '关', exact: true }).focus()`，按 `Enter`：`aria-checked` 仍是 `false`；按 `Space`：变 `true`。
- **MorphToggle 同上。** `#/morph-toggle`，`getByRole('switch', { name: '实盘模式' }).focus()`，`Enter` 不变，`Space` 翻成 `true`；再 `Space` 翻回 `false`。
- **Accordion 方向键不动。** `#/accordion`，`getByRole('button', { name: '数据从哪来' }).focus()`，按 `ArrowDown`：焦点还在这一个标题上（`document.activeElement` 没变）；按 `Tab`：焦点到下一个标题钮。回车收起：`aria-expanded` 变 `false`，面板文字不在页上。
- **Collapsible 回车。** `#/collapsible`，触发钮上按 `Enter`：`aria-expanded` 翻转，面板出现或卸载。
- **Radio 方向键。** `#/radio-group`，Tab 进组只停在一个钮上；按 `ArrowDown`（竖排）或 `ArrowRight`（横排）：焦点和 `aria-checked` 一起到下一个。
- **证据。** 每步动作后的 `aria-checked` / `aria-expanded` / 焦点所在元素的读数，加 `$KUI shot <页 id>` 的截图。没有流程文件，手走；走了几页写几页。

## Gotchas

- 禁用的 ChipGroup 芯片用 `aria-disabled`，不是 `disabled`：Playwright 的 `click()` 不会等它，直接点会点下去；要证明「按不动」，断言 `aria-pressed` 没变。
- Accordion 的 single 与 multiple 值类型不同（字符串 / 数组），只影响调用方的回调，页上看不出来。
