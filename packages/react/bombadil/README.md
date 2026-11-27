# 文档站的性质测试（Bombadil）

[Bombadil](https://github.com/antithesishq/bombadil)（Antithesis，MIT）是给 Web UI 做性质测试的工具。它不按剧本走，而是在页面里随机点击、按键、拖拽、滚动，每走一步就检查一遍我们写下的性质（LTL 时序逻辑：`always`、`eventually`、`next`，可以加时限）。

它和别的测试分工如下：

| 测试 | 管什么 |
| --- | --- |
| 单测、e2e | 这几步操作的结果对不对 |
| pixelgate、Happo | 画面长得对不对 |
| Bombadil | 不管怎么操作，都不该出现的事 |

## 跑

```bash
pnpm explore                        # 在仓库根目录跑，默认 5 分钟，无头
EXPLORE_TIME=30m pnpm explore       # 夜间长跑
EXPLORE_HEADED=1 pnpm explore       # 开着窗口看它怎么点
EXPLORE_EXIT_ON_VIOLATION=1 pnpm explore
```

- 它按时长跑，跑不出「一分钟内结束」，所以**不进每个 PR 的快检**，只在夜间或手动跑。
- 有违例时退出码非零。轨迹写在 `packages/react/node_modules/.cache/katana-ui-explore/trace-*.bin`，有三种看法：
  - `pnpm exec bombadil browser inspect <轨迹>`：逐步回放，带截图。
  - `pnpm exec bombadil trace --json <轨迹>`：每个状态一行 JSON，可以用 jq 筛。
  - `pnpm exec bombadil trace --state 380..384 --screenshots <目录> <轨迹>`：导出那几步的截图。
- 复现：`bombadil browser test <地址> bombadil/docs-site.spec.ts --reproduce <轨迹>`。这是尽力复现，页面行为一旦和轨迹对不上就会失败。
- 二进制由 npm 包 `@antithesishq/bombadil` 自带，`pnpm install` 后就有，只支持 Linux 和 macOS。

## 查的性质（`docs-site.spec.ts`）

| 性质 | 说的是 |
| --- | --- |
| `noUncaughtExceptions` / `noUnhandledPromiseRejections` / `noConsoleErrors` / `noHttpErrorCodes` | Bombadil 的默认性质 |
| `themeInSync` | 页头按下的主题和根节点的 `data-theme` 一致 |
| `noBrokenText` | 活的演示区里不出现 `NaN`、`undefined`、`[object Object]`，代码块除外 |
| `noHorizontalOverflow` | 没有哪个件把整页撑出横向滚动 |
| `overlaysInViewport` | 显示中的浮层（popover、menu、listbox、tooltip、dialog）整个落在视口内 |
| `escapeClosesOverlay` | 有浮层时按 Escape，下一步至少少一层；tooltip 不算，因为文档站有常开的演示 |

动作方面：侧栏换页的比重压低，主要在件上点击、按键盘（方向键、Home/End、Enter、空格、Escape、Tab）、在演示区里拖拽（覆盖滑块、分隔条、刷选、图表平移），再加上输入、滚动、前进后退。

## 写新性质时注意

- 浮层要排除 `data-state="closed"`：无头 Chrome 里退场动画可能停住，Radix 会一直挂着正在退场的元素。
- 不用 `extras/resources` 的泄漏性质：它读的是 GC 前的计数，误报很多（2026-11-22 用强制 GC 核对过）。要查泄漏，用 Playwright 先调 `HeapProfiler.collectGarbage` 再读数。
- 报出违例后，先用截图或 Playwright 复现一遍，确认是真的再开 issue。
