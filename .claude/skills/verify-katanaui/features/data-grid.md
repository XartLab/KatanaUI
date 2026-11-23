# DataGrid 数据表

用户点列头给表排序，再点换方向、第三次取消；表放在窄容器里时，放不下的列按优先级收起，表头右端出一个「+N cols」胶囊，点开看全部列、再点收回。

## Sub-features

- `grid-sort` 点列头的排序钮：升序 → 降序 → 不排序，列头的 `aria-sort` 跟着变，行序跟着变。
- `grid-priority` 窄容器里按列的优先级收起放不下的列，不出横向滚动。
- `grid-priority-expand` 点「+N cols」显示全部列、改成横向滚动，胶囊写 `Collapse`；再点收回。

## How to get to it (user POV)

- 文档站左侧目录「积木 → DataGrid 数据表」，地址 `#/data-grid`。
- 排序：「示例」页签第一张表（说明写「每种列类型一列；点表头排序」，`data-testid="grid-demo"`）的列头。
- 收列：同页说明写「列优先级（#122）」下面那张 300px 宽的八列表（`data-testid="grid-priority"`）。

## Driving it with kui.mjs

前置：`$KUI doctor` 全 OK；新开的浏览器上下文（列摆法存在 `localStorage`，新上下文里是默认的）。

- **看默认行序。** `section.getByTestId('grid-demo')`，读 `[role="gridcell"][data-col="symbol"]`。行序 `BTCUSDT, 600519, ES`；PnL 列头 `aria-sort="none"`。
- **升序。** `grid.getByRole('columnheader', { name: 'PnL' }).getByRole('button').click()`。列头 `aria-sort="ascending"`，第一行是亏损的 `600519`（`-310.75 USDT`）。
- **降序。** 同一个钮再点。`aria-sort="descending"`，第一行是 `BTCUSDT`（`+125.40 USDT`）。
- **取消排序。** 第三次点。`aria-sort="none"`，行序回到 `BTCUSDT, 600519, ES`。
- **窄容器收列。** `section.getByTestId('grid-priority')`，胶囊是 `.k-grid-cols-toggle`。胶囊写 `+5 cols`、`aria-expanded="false"`；列头只剩 `Symbol, Side, PnL`（PnL 写了 priority: 2，比声明在前的 Price 晚收）；`.k-grid-scroll` 的 `scrollWidth - clientWidth <= 0`。
- **展开。** 点胶囊。胶囊写 `Collapse`、`aria-expanded="true"`；八列 `Symbol, Side, Price, Qty, PnL, Chg %, Time (UTC), Fills`；横向可滚（2026-11-23 实测溢出 393px）。
- **收回。** 再点胶囊。回到 `+5 cols` 和三列。
- **证据。** `$KUI drive data-grid`：七步七张截图，`grid-priority-collapsed.aria.yml` 是收起时那张表的 ARIA 快照。

## Gotchas

- `#/data-grid` 有好几张表（`grid-demo`、`grid-columns`、`grid-priority`、`grid-detail` 等），`getByRole('columnheader', { name: 'PnL' })` 不先收到 `grid-demo` 会命中好几个。
- 品种格里除了代码还有徽标字和交易所名（`贵 / 600519 / SSE`），断言行序只取代码那一行。
- 列头文字带排序箭头 `▲▼`，比列名前先去掉。
- 「列头右键菜单、拖动换列、ColumnPicker」那张表（`grid-columns`）的列摆法存进 `localStorage`：同一个上下文里走过它，再走别的流程前先换新上下文，`kui.mjs` 每条命令都是新的。
- 收列只影响显示；复制与导出仍是全部列，不要拿可见列数去断言导出结果。
