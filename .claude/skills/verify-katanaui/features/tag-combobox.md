# TagCombobox 带标签的多选

字段本身是输入框：已选的人以小标签排在框里（可换行，每个有 ×，带头像缩写），光标跟在最后一个标签后面。点字段开列表，打字过滤并把命中的字加粗，点一行或按 Enter 切换（行尾画勾、输入清空、列表不收），输入框空着时按两次 Backspace 删最后一个标签。标签多到换行时字段长高，弹层贴着字段下沿跟着下移。

## Sub-features

- `tag-open` 点字段（或焦点在输入框里按 ↓）：列表开，焦点在输入框，`aria-expanded` 变 `true`。只靠聚焦或 Tab 进来不开。
- `tag-pick` 点一行（或高亮后 Enter）：该行 `aria-selected` 变 `true`、行尾出勾，标签进框，输入清空，列表不收，焦点不离开输入框。
- `tag-filter` 打字：只留含输入词的行（大小写、重音不分，说明里有也算），命中的字 `[data-hit]` 加粗提亮；没有匹配时列表换成 `role=status` 的提示。
- `tag-backspace` 输入空时 Backspace：最后一个标签 `data-picked`；再按一次删掉它，对应行的勾消失。← → 在标签间移，Delete 删选中的。
- `tag-remove` 点标签上的 ×：移除，列表与焦点不变。
- `tag-wrap` 标签多到换行：字段长高，弹层上沿始终在字段下沿之下。
- `tag-keys` ↑ ↓ 移高亮（首尾相接，滚进视野），Esc 先收列表、再取消标签选中。

## How to get to it (user POV)

- 文档站左侧目录「表单」一组：`TagCombobox 带标签的多选`，地址 `#/tag-combobox`。
- 页上三个字段：`评审人`（默认选了 Aisha Khan、Elena Petrova，候选 16 人带头像缩写与角色）、`策略类型`（纯文字，可按英文关键词搜）、`只读评审人`（禁用）。
- 单选 Combobox 新加的两个槽（前缀节点、第二行说明）在 `#/combobox` 页的「带前缀与说明（单选）」一行。

## Driving it with kui.mjs

前置：`$KUI doctor` 全 OK。只走第一个字段 `section.getByRole('combobox', { name: '评审人', exact: true })`；列表在 portal 里，用 `page.getByRole('listbox', { name: '评审人', exact: true })` 找。

- **点开。** 点字段框里的空白处（`box = field.locator('xpath=..')`，点右侧偏左处）。`field` 聚焦、`aria-expanded="true"`，listbox 可见且 `aria-multiselectable="true"`。
- **点两项。** 点 `Ben Carter`、`Hiro Tanaka`（`list.getByRole('option', { name: /^Ben Carter/ })`）。框里 4 个标签（`.k-tagcb-tag`，先后是 Aisha Khan、Elena Petrova、Ben Carter、Hiro Tanaka），这两行 `aria-selected="true"`，listbox 仍可见，`field` 仍聚焦且值为空。
- **过滤。** `field.pressSequentially('an')`。每一行文字都含 an（不分大小写）；`[data-hit]` 至少一个、文字都是 an、字重 700。
- **退格两次。** `field.fill('')` 后按 `Backspace`：最后一个标签 `data-picked`，标签数不变。再按一次：标签少一个，`Hiro Tanaka` 行 `aria-selected="false"`，焦点仍在 `field`。
- **换行。** 再点 5 行（Camille Girard、Chloe Martin、Daniel Foster、Elif Demir、Fatima Al-Sayed）。框高比之前多 10px 以上；`[data-slot="popover-content"]` 的 y 不小于框的下沿。
- **证据。** `$KUI drive tag-combobox`：五步五张截图，`tag-combobox-open.aria.yml`、`tag-combobox-filtered.aria.yml` 是列表打开与过滤后的 ARIA 快照。

## Gotchas

- 页上有三个 combobox：`评审人` 要 `exact: true`，否则会连 `只读评审人` 一起匹配（严格模式报错）。
- 弹层在页面根部的 portal 里，不在 `[data-gallery]` 里面。
- 行与 × 按下时不抢焦点（`preventDefault`）：点它们之后焦点仍在输入框，不用再 `field.focus()`。
- 滚动即关：页面或装着字段的容器一滚，列表就关（Popover 的通用规矩）；列表自己里面滚不关。键盘移高亮是手动改列表的 `scrollTop`，不会触发。
- 命中字的字重要在 Graphite 与 Console 两个主题下都是 700；换主题用 `--theme console`。
- 本机浏览器路径不是默认的：`KUI_CHROME=<chrome 可执行文件>` 指一下。
