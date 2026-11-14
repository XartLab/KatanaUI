# design/：设计稿存档（内部）

## 这是什么

`design/katana-console/` 是 KATANAview（XartLab/KATANAview）控制台的设计稿存档：`project/`（组件卡、样例、设计说明）、`prototypes/`（原型）、`research/`（调研）。
原来在 KATANAview 的 `design/katana-console/`，2026-11-15 随 #14 搬到这里，路径不变，存档内的相对链接不用改。

- 来源：KATANAview main `3c5897fb` 的 `design/katana-console/`，加上还没合的 KATANAview #1933（分支 `docs/precision-instrument`，头提交 `f10ebcac`）对 `project/precision-instrument.md`、`project/samples/precision-instrument.html`、`project/README.md` 的改动。
- 组件卡是组件库「样子」的依据，`packages/react/docs/coverage-map.json` 把每张卡映射到包里的件，`pnpm ui:coverage` 据此生成覆盖表。
- 工作台的样式、token 的来龙去脉，以 `packages/` 里的代码与文档为准；存档是当时的设计稿，不随代码改。

## 许可与发布

- 不随包发布（`@katana-ui/react` 的 `files` 里没有它），也不在仓库的 MIT 许可范围内。
- 里面有参照产品（TradingView、ATAS、OpenMarket 等）的截图与摘录，版权不归我们。**仓库公开之前要先过一遍：** 删掉或换掉不能公开的截图与摘录，再决定存档放不放出去。
- 字体不在这里：随包发的字体在 `packages/react/src/fonts/`，声明在 `packages/react/src/fonts.css`。
