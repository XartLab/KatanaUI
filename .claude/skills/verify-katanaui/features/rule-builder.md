# RuleBuilder 规则构建器

告警、风控、选股条件共用的「条件树 + 动作」编辑器。WHEN 是一棵条件树：每条条件是字段、运算符、值，条件可组成组（组内 And / Or 点一下切，最多三层），左边画着连线，And / Or 小标签坐在线上；有锁定的起始条件（锁图标，不能删不能拖，只改值）。THEN 分「若为真 / 若为假」两段动作（默认不必填，选股规则可以只有 WHEN），动作带若干参数、各有各的校验（下单草稿 = 方向 + 数量 + 价格类型），下单只出草稿（行上有草稿标）。顶行把整棵规则回读成一句话；改错的行红框、行下写原因。整份规则是 JSON，文档站的演示把它回显在「Rule JSON」里。

## Sub-features

- `rule-tree` 锁定条件、条件、嵌套组、连线与 And / Or 标签、回读（判据 1）。
- `rule-mode` 点标签切组合方式，回读与 JSON 跟着变（判据 2）。
- `rule-reorder` 同组换序：Alt+↑↓ 与拖动，跨组与锁定条件之前不落（判据 3）。
- `rule-validate` 越界与必填缺失：红框、原因接到格子的 aria-describedby、顶行状态（判据 4）。
- `rule-actions` 若为真 / 若为假加动作、JSON 往返、撤销重做（判据 5、6）。
- `rule-values` 多选标签、引用另一个字段、区间、锁定条件只改值。
- `rule-params` 动作的多个参数：各自的类型与校验、回读按次序写。
- `rule-issue-jump` 点顶行「N issues」：全部标红，焦点到第一个出错的格子。
- `rule-locked-group` 含锁定条件的组删不掉：按钮禁用并说明，Delete 不动。
- `rule-switch-doc` 受控 value 换成另一份规则：撤销栈与「改过的行」清零。
- `rule-field-change` 换字段：同类同单位留值，口径不同清空，引用清掉。

## How to get to it (user POV)

- 文档站左侧目录「积木 → RuleBuilder 规则构建器」，地址 `#/rule-builder`。
- 演示数据（写死，刷新回到初始）：一条选股告警。WHEN：锁定的「Market is A-shares」、「Sector is any of Semiconductors / Software」、「Close crosses above MA20」（值是另一个字段）、一个 Or 组（「Turnover > 500 M」「Turnover rate > 3%」）。THEN 若为真：Send alert to Push、Draft order Buy 10 lots at Limit（方向、数量、价格类型三个参数）；若为假：Add to watchlist to To review。
- 页上有三份：「选股告警」那份（`[data-gallery-rule="main"]`，预览与「用法」页签各渲一次，取预览里第一份，下面的步骤都在它上面；「Rule JSON」折叠块 `[data-gallery-rule-json]` 是它的 JSON），「校验（全显）」那份（`[data-gallery-rule="broken"]`，故意写坏，showIssues 全显），和「换一份规则（受控）」那份（`[data-gallery-rule="switch"]`：上面有 `[data-switch="a"]` / `[data-switch="b"]` 两个按钮；规则 A 的第一个 Group 里是锁定的 `market`，外面有 `rate` 3；规则 B 的 `rate` 是越界的 130，没有动作）。这份没有 JSON 回显。

## Driving it with kui.mjs

前置：`$KUI doctor` 全 OK。行是 `[data-slot="rule-condition"]` / `[data-slot="rule-action"]`（`data-id` 是它在 JSON 里的 id），组的列表是 `[data-list="<组 id>"]`（根组 `root`，嵌套组 `liquidity`，动作段 `ifTrue` / `ifFalse`），把手是 `[data-id=…] [data-part="handle"]`，And / Or 是列表后面紧跟的 `[data-slot="rule-mode"]`，播报是 `[data-slot="rule-live"]`。

- **打开。** 锁定行有 `Locked` 图标、没有把手与删除钮；根组标签 `And`、嵌套组标签 `Or`；顶行写 `When Market is A-shares and Sector is any of Semiconductors / Software and Close crosses above MA20 and (Turnover > 500 M or Turnover rate > 3%), then Send alert to Push and Draft order Buy 10 lots at Limit, otherwise Add to watchlist to To review`。
- **切组合方式。** 点嵌套组的 `Or`：标签变 `And`，播报 `Group now combines with And`，JSON 里该组 `mode` 是 `and`，回读里是 `(Turnover > 500 M and Turnover rate > 3%)`。
- **Alt+↓ 换序。** 聚焦 `Turnover` 的把手按 Alt+↓：组里变成 `rate, turnover`，焦点仍在它的把手，播报 `Moved Turnover > 500 M to position 2 of 2`；再按 Alt+↓ 不动，根组次序不变。`Sector` 的把手按 Alt+↑ 不动（上面是锁定条件）。
- **拖动。** 鼠标按住把手往同组另一行上方拖（例如把 `Turnover` 拖到 `Turnover rate` 上面）：那一行出现 `data-drop="before"` 的落点线，松手换序。拖到别的组的行上：`[data-slot="rule-builder"]` 带 `data-drag="blocked"`，松手后 JSON 不变；拖动中按 Esc 取消，播报 `Move cancelled`。
- **校验。** `Turnover rate` 的输入框填 `130`：行出现 `data-invalid`，输入框 `aria-invalid="true"`，它的 `aria-describedby` 指向行下那句 `Must be between 0 and 100`，顶行状态 `1 issue`，回读里仍写 `130%`；清空写 `Fill in a value`；填回 `3` 状态回到 `Ready`。「校验」那份：顶行 `6 issues`（是按钮，名字 `6 issues: show all and go to the first`），行下依次写 `Must be between 0 and 100`、`Fill in a value`（RSI 上限）、`Fill in a value`（Sector）、`Add at least one condition`（空组）、`Fill in a value`（下单草稿只填了方向，缺数量与价格类型，合成一句）。点这个按钮：焦点到 `Turnover rate` 的输入框（阅读次序里第一个出错的格子）。
- **动作与撤销。** 点 THEN 下的 `Add action`（`[data-add="ifTrue"]`、`[data-add="ifFalse"]`）：两段各多一个，JSON 的 `ifTrue`、`ifFalse` 各多一条，新动作缺参数在改它之前不红；改了类型与参数后红框消失。顶行 `Undo` / `Redo` 或焦点在把手上按 Ctrl+Z / Ctrl+Shift+Z 回退与重做；`Undo` 到底后是禁用的。把手上按 Delete 删这一行，焦点去前一行的把手。
- **动作参数。** 「Draft order」行有三个格子（`[data-part="param"]`，`data-key` 是 `side` / `quantity` / `price`）：数量填 `500` 只有数量红、原因 `Must be between 1 and 100`；方向选 `Sell`、数量填 `25` 后 JSON 是 `params: { side: 'sell', quantity: 25, price: 'limit' }`，回读 `Draft order Sell 25 lots at Limit`。
- **点状态栏。** 在 THEN 若为真下点 `Add action`：新行不红但状态写 `1 issue`（按钮）；点它：新行红、焦点落在它的 `Channel` 格子。
- **Alt+↑↓ 在下拉上。** 聚焦 `Sector` 的字段下拉按 Alt+↓：整行下挪，下拉不打开；不带 Alt 的 ↓ 才打开。
- **换字段。** `Turnover`（M）换成 `Turnover rate`（%）：值清空，播报 `Value cleared…`；`Sector` 换成 `Market`：值清成空列表；`Close crosses above` 的引用换字段后清成空数字；两个都没单位的字段（`RSI(14)` → `Close`）之间值留着。
- **含锁定条件的组。** 「换一份规则」那份里第一个 Group 的删除钮 `aria-disabled`，名字 `Cannot remove Group · 1 condition · And: it holds a locked condition`；点它或在把手上按 Delete 都不动（后者播报同一句）；加一个新组再删可以删。
- **换一份规则。** 在规则 A 里改 `rate`、撤销一步后点 `Load rule B`：`rate` 的 130 不红（没改过）、状态 `1 issue`、`Undo` 与 `Redo` 都禁用；之后的撤销只回到 B。
- **删了再加。** 在根组加一条条件、选个值、删掉、再加：新行用回同一个 id，但不红、行下没有原因。
- **值。** 点标签的 `Remove Software`：JSON 的 `values` 少一个；点 `Add` 开勾选列表，点选项切换、列表不收，Esc 关。`Close` 那行的链接钮（`Compare with another field`）在「引用 MA20」与数字之间切。把 `Turnover` 的运算符换成 `between`：出 `Minimum`、`Maximum` 两个框，下限大于上限时 `Maximum` 报 `The lower bound is above the upper bound`。锁定行的 `Market` 值可改成 `US`，字段与运算符是文字。
- **证据。** `$KUI drive rule-builder`：每步一张截图，`rule-builder-default.aria.yml` 是默认状态整份规则的 ARIA 快照，`rule-builder-broken.aria.yml` 是校验那份的。

## Gotchas

- WHEN / THEN 是 `role=group`（不是 region），标题层级由 `headingLevel` 定（文档站三份都设 2）；一页多份同名也不报 axe 的 landmark-unique，axe 的 heading-order 也过。

- 页上有两份主演示（预览与「用法」页签各渲一次）：`[data-gallery-rule="main"]` 要 `.first()`，不然 Playwright 严格模式报两个元素。
- 「默认只显示改过的行的问题」：没动过的行即使不合法也不红；要看全部用「校验」那份（showIssues="all"）。顶行状态不受这个影响，一直数全部问题。
- 把手拖动用指针事件：流程里要先 `mouse.move` 到把手、`down`、小幅移动几步再移向目标（一步跳过去时落点来不及算）；松手后再读 JSON。
- 数字框读写的是文字：`fill('130')` 就是 130，不会被夹回范围；单位（M、%）是框里的字，不在输入值里。
- Select 的选项渲染在页外的弹层里：用 `page.getByRole('option', …)` 找，不要在 `main` 里找。多选的勾选列表同样在页外。
- 文档站是开发模式时控制台有两条与本件无关的报错（目录里重复 key `decisions`、favicon 404），a11y 用例在开发模式会因此红；构建版没有。
