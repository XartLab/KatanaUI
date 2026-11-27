# GroupedTable 分组表

DataGrid 加分组：按列分组，组头可收起、带行数与汇总（晋级 k/n），成交额合计对齐在列下；组按汇总数排序，没分进组的放最后「其他」。KatanaUI#260。

## Sub-features

- `group-headers` 组头写「标题 · 行数 · 汇总」，每个组头有收起钮。
- `group-order` 按连板数分组时高板在前；按题材分组时按成交额合计从大到小。
- `other-last` 没有连板数（或题材）的行在最后一组「其他」。
- `collapse` 点三角收起该组，只留组头；页上「收起回调」一行写「组键 收起」。
- `mode-switch` 「按连板数 / 按题材」换分组维度，组头整个换掉。
- `sort-in-group` 点列头排序：组头与组的次序不动，行在组内排。
- `aggregates` 「成交额」列下每个组头有合计（写成万 / 亿），表尾「合计」只算数据行。

## How to get to it (user POV)

文档站左侧目录「积木 → GroupedTable 分组表」，地址 `#/grouped-table`。

## Driving it with kui.mjs

前置：`$KUI doctor` 全 OK。目前没有流程脚本（手走）。表 `[data-testid="grouped-table"]`，组头 `[data-slot="grid-section-row"]`。

- **组头。** 打开页：组头依次是「5 连板 1 晋级 1/1」「4 连板 …」「3 连板 2 晋级 1/2」「2 连板 3 晋级 1/3」「1 连板 3 晋级 2/3」「其他 2 晋级 0/2」。
- **收起。** 点第 2 个组头的收起钮（名字「Collapse section」）：`[data-row]` 少一行，`grouped-last` 写「收起回调：4 收起」。
- **换维度。** 点「按题材」：组头依次是算力 4、低空经济 2、电池 2、机器人 2、其他 2（按成交额合计排）。
- **组内排序。** 点「涨跌幅」列头：组头次序不变。
- **证据。** 每步截图；组件级像素由 `browser/cn-batch4.browser.test.tsx` 守着。

## Gotchas

- 收起钮是 DataGrid 宿主传的文案：没提供宿主时名字是英文「Collapse section / Expand section」。
- 「其他」组的受控键是空串 `""`，不是 null。
