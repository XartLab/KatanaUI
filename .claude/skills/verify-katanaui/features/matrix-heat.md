# MatrixHeat 矩阵热力

行 × 列的格子按值着色，格内写数，悬停或聚焦出值与原因，点表头给行或列排序，空格写「—」不着色。KatanaUI#260。

## Sub-features

- `cell-text` 格内写调用方格式化的值（晋级率「45%」）；零写 0 但不着色。
- `empty-cell` 没有样本的格写「—」、不着色，悬停窗只写原因。
- `hover-tip` 悬停或聚焦一格出窗：「行 · 列」、值、原因。
- `sort-rows` 点列头：行按这一列排，降 → 升 → 取消；列头 `aria-sort`。
- `sort-cols` 点行头：列按这一行排。
- `select` 点格或聚焦后 Enter / Space：页上「选中」一行写行、列、值。
- `keyboard` 方向键走格，Tab 只停一个格子。
- `diverging` 第二张是发散色阶：正数涨色、负数跌色，零不着色（根上 `data-updown="cn"` 红涨绿跌）。

## How to get to it (user POV)

文档站左侧目录「量化 → MatrixHeat 矩阵热力」，地址 `#/matrix-heat`。

## Driving it with kui.mjs

前置：`$KUI doctor` 全 OK。目前没有流程脚本（手走）。矩阵 `[data-testid="matrix-heat"]`，格 `[data-slot="matrix-cell"][data-row-index][data-col-index]`。

- **悬停。** 悬停第 2 行（2 连板）第 3 列（11-20）：窗里是「2 连板 · 11-20」「晋级率 44%」「原因 9 只里晋级 4 只」。
- **排序。** 初始行次序 level0..level3。点「按 11-26 给行排序」：level3,level1,level0,level2，`data-col="11-26"` 的 `aria-sort` 是 descending；再点：升序 level0,level1,level3,level2；第三下回到初始。
- **列排序。** 点「按「2 连板」给列排序」：列头次序按这一行的值变。
- **选中。** 点第一行第一格：`matrix-picked` 写「选中：level0 · <该列> · <值>%」。
- **键盘。** 聚焦一格后 ArrowRight、ArrowDown：焦点在 `[1,1]`。
- **证据。** 每步截图，悬停一步贴 ARIA 快照；像素由 `browser/cn-batch4.browser.test.tsx` 守着。

## Gotchas

- 表头按钮的名字是调用方 `labels.sortRows / sortColumns` 写的；演示页是中文「按 11-26 给行排序」。
- 排序后列的次序变了，格子的 `data-col-index` 是显示位置，不是原列序号。
