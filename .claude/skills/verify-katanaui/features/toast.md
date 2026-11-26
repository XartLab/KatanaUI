# Toast 弹出提示

窗口右下角的弹出提示：操作完成、告警到达这类会自己消失的反馈。一般提示礼貌播报，不打断读屏；警告和危险那一条自己打断。能撤销的操作带「撤销」钮和一个随时间变短的倒计时环，撤销后字变「已恢复」再收。

## Sub-features

- `toast-polite` 视口是 `role=region`、`aria-live=polite`；neutral、ok 的条没有 `role=alert`，warn、danger 的单条有（#251，kubai 016）。
- `toast-stack` 点「弹一条提示」弹出，贴窗口右下角，两条以上出「全部关掉」，叉与全部关掉收起后摘节点。
- `toast-undo` 点「删除一条画线」：出「已删除画线」，带倒计时环与「撤销」；环随剩余时间变短；点「撤销」字变「已恢复」，约 1.5 秒后收；不点则约 5 秒后自己收，指针或焦点停在上面时停表。

## How to get to it (user POV)

- 文档站左侧目录「反馈 → Toast 弹出提示」，地址 `#/toast`。
- 「语气」那一行是四条静态示例：ok、warn、danger 各一条（`data-testid="toast-ok|warn|danger"`）。

## Driving it with kui.mjs

还没有流程脚本（手走）。前置：`$KUI doctor` 全 OK；打开 `#/toast`，等 `[data-gallery="toast"]`。

- **读屏语义。** `page.getByTestId('toast-viewport')` 的 `role` 是 `region`、`aria-live` 是 `polite`。`toast-danger`、`toast-warn` 的 `role` 是 `alert`；`toast-ok` 没有 `role`。ARIA 快照里：视口是名为「演示提示」的 region，danger 与 warn 两条是 alert。
- **弹出。** 点 `getByRole('button', { name: '弹一条提示' })`。`getByTestId('toast')` 出一条，离窗口右、下边各 16px；再点一次出第二条与「全部关掉（2）」。
- **撤销。** 点 `getByRole('button', { name: '删除一条画线' })`。`getByTestId('toast-undo')` 出现，标题「已删除画线」，里面有 `[data-slot="toast-countdown"]` 与「撤销」钮。每隔半秒读 `[data-slot="toast-countdown-arc"]` 的 `stroke-dashoffset`，值逐步变大（环变短）。点「撤销」：标题变「已恢复」，「撤销」钮没了；约 1.5 秒后整条摘掉。
- **停表。** 再点「删除一条画线」，把鼠标停在这一条上 6 秒以上，它不收；移开后继续走，约剩余时间后收。
- **证据。** 每一步的截图与 ARIA 快照（撤销前、点撤销后各一份）。

## Gotchas

- 提示叠在右下角的 fixed 视口里，不在 `[data-gallery]` 里面：用 `page.getByTestId(...)`，不要在 `section` 里找。
- 进出有过渡（translate 与不透明度）：断言可见性用会等待的 `expect(...).toBeVisible()`，量位置要等 `data-starting-style` 没了。
- 倒计时环是装饰，`aria-hidden`，读不到秒数；要量剩余时间就读 `stroke-dashoffset`（整环周长约 37.7，剩余比例 r 时偏移是 37.7 × (1 − r)）。
- 价格告警在 KATANAview 里是通知，不是 toast；这页只演示库里的零件。
