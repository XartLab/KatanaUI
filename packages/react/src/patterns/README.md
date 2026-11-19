# patterns

数据驱动的组合件与表单、动作件放这里：由多个 primitives 拼成，带一点业务无关的约定。目录与说明由 #1838 起。

- 组合件：multi-select、combobox、chip-group、date-range-picker、tree-view、filter-bar、view-switcher、side-nav 等。
- 表单与动作件（G2，2026-11-18 从 `katana/` 搬来）：number-input、date-time-input、duration-picker、password-input、shortcut-recorder、theme-selector、hold-to-confirm、delete-button、task-list，以及 rendering-settings（与 font-catalog）、range-histogram-slider。

约定：

- 只依赖 `../primitives`、`../lib` 与 `../katana` 的读数件（ShortcutRecorder 用 Kbd）；不依赖 quant、blocks。quote-table、row-actions 的旧依赖由行情批次（G4）处理。
- 值回调一律 `value / defaultValue / onValueChange`，多选的值是 `string[]`；文案一律 `labels?: XxxLabels`，包里不带语言。改名时旧名留一个版本，类型上标 `@deprecated`、运行时映射到新名。
- 纯函数放同名的 `*-model.ts`（registry 里是 `registry:lib`），带单测。
- 每件一个 css，放 `src/theme/<件名>.css`（number-input、date-time、date-range、chip-group、filter-bar、view-switcher、shortcut-recorder、hold-to-confirm、range-histogram-slider、rendering），只读 `--k-*` 与语义 token。
