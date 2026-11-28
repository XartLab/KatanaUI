# 基础件的键盘（UI SDK 行为层，#263）

Checkbox、Switch、MorphToggle、RadioGroup、Toggle、ChipGroup、Collapsible、Accordion、Tabs、ScrollArea 的行为底座从 Radix 换成了 UI SDK。点按与键盘的手感以迁移前为准（2026-11-28 用户定）：下面几条是换底座时曾经变过、现已补回的，验收按迁移前的判；`data-state` 的值也同迁移前。

## Sub-features

- `switch-space-enter` Switch / MorphToggle：焦点在开关上，空格与回车都拨动。点它的 Label 也能拨。
- `accordion-arrows` Accordion：↑↓ 在标题钮之间走、Home / End 到头尾、两头回绕、跳过禁用的标题；Tab 也能到各标题。回车或空格展开收起。
- `collapsible-enter` Collapsible：回车展开收起，触发钮 `aria-expanded` 跟着变。
- `radio-arrow` RadioGroup：只有一个 Tab 停靠点；方向键移动并选中。
- `chip-arrow` ChipGroup：方向键在芯片间走，Tab 只停一个；空格开关；方向键跳过禁用的芯片。
- `toggle-enter-space` Toggle：回车与空格都切换 `aria-pressed`。

## How to get to it (user POV)

- 文档站「表单」里的 `#/switch`、`#/checkbox`、`#/radio-group`、`#/toggle`；「布局与导航」里的 `#/accordion`、`#/collapsible`；`#/morph-toggle`；`#/chip-group`。页签的键盘在 [Tabs 页签](tabs.md)。

## Driving it with kui.mjs

前置：`$KUI doctor` 全 OK。页上控件的读屏名按文档站当前文案写，先 `aria` 存一份快照再定名字（下面写的是 2026-11-28 页上的名字）。

- **Switch 空格与回车。** `#/switch`，`section.getByRole('switch', { name: '关', exact: true }).focus()`，按 `Enter`：`aria-checked` 变 `true`；再按 `Space`：变回 `false`。`data-state` 跟着 `checked` / `unchecked`。
- **MorphToggle 同上。** `#/morph-toggle`，`getByRole('switch', { name: '实盘模式' }).focus()`，`Enter` 与 `Space` 都翻转。
- **Accordion 方向键走标题。** `#/accordion`，`getByRole('button', { name: '数据从哪来' }).focus()`，按 `ArrowDown`：焦点到下一个标题；到最后一个再按回到第一个；`Home` / `End` 到头尾。回车收起：`aria-expanded` 变 `false`，面板按 `kc-accordion-up` 收完才从页上消失。
- **Collapsible 回车。** `#/collapsible`，触发钮上按 `Enter`：`aria-expanded` 翻转，面板出现或卸载。
- **Radio 方向键。** `#/radio-group`，Tab 进组只停在一个钮上；按 `ArrowDown`（竖排）或 `ArrowRight`（横排）：焦点和 `aria-checked` 一起到下一个。
- **证据。** 每步动作后的 `aria-checked` / `aria-expanded` / 焦点所在元素的读数，加 `$KUI shot <页 id>` 的截图。没有流程文件，手走；走了几页写几页。

## Gotchas

- 禁用的 ChipGroup 芯片用 `aria-disabled`，不是 `disabled`：Playwright 的 `click()` 不会等它，直接点会点下去；要证明「按不动」，断言 `aria-pressed` 没变。方向键会跳过它，所以键盘走不到。
- Accordion 的 single 与 multiple 值类型不同（字符串 / 数组），只影响调用方的回调，页上看不出来。
