# KatanaUI Agent 指南

给在本仓库干活的 AI Agent（Claude Code、Codex 等）的规矩。跟用户说中文，先说结论。

## 这是什么

KatanaUI 是设计系统的**源头仓库**（2026-11-14 用户定，#2）：token、React 组件、文档站都在这里开发。
以前它是 KATANAview `packages/ui` 的只读镜像，现在反过来，KATANAview 按 git 标签依赖这里发布的版本，不再带组件库源码。

- 结构照 salt-ds：仓库根是 pnpm workspace，包在 `packages/`。现在有 `packages/react`（`@katana-ui/react`）；
  `packages/tokens`（`@katana-ui/tokens`：三层 token 与密度、弹簧，生成 `tokens.css`）；`packages/logos`（`@katana-ui/logos`：徽标解析、来源、缓存、`LogoProvider`、命令行 `katana-logos`，#94）。`@katana-ui/react` 依赖这两个，在 package.json 里写确切版本、不写 `workspace:`，放 `peerDependencies` 并同版本写进 `devDependencies`。
- 包内的分层、件的归属、文档站与设计系统产物的规矩见 [packages/react/docs/zh-CN.md](packages/react/docs/zh-CN.md)。
- 许可证 MIT。每个源文件头写 `SPDX-License-Identifier: MIT`。不许引进 AGPL 的代码；取自别处的写明出处与许可证，记进包的 `NOTICE`。
- 包不依赖任何应用。应用相关的事（行情、面板、文案语言）由调用方传。

## 已定的设计决定（不要推翻，要改先问用户）

- 默认主题是 Graphite（用户 2026-11-14 定，KATANAview #1775；已落地：`tokens.css` 的 `:root` 就是 Graphite，Console 是 `data-theme="console"` 的覆盖块，文档站默认也是 Graphite）。Graphite 是中性色纯灰，信号色是油画颜料色（土黄 `#d6a548`、铬绿 `#5fae8c`、玫瑰茜红 `#f2607c`）；Console 留作可切主题。不用 TradingView 蓝，不用暖白配高亮黄。
- 组件的样子以 KATANAview 工作台现在的样式为准；Salt 学 token 结构（原值 → 调色 → 语义特征）、密度、文档组织，Salt 是 Apache-2.0，能照搬的实现可以照搬，写出处。
- 包名 `@katana-ui/*`，不带 `katanaview`：要能用在别的量化项目里。
- **设计决定要写进文档站**（用户 2026-11-17：「为什么滑条还有这些的设计没写到我们设计需要里面」「那些 MD 文档很多废话」）：用户在对话里定了样子，落代码的同一个 PR 里写进文档站对应的页——基础 / Token 与主题（`gallery/foundations*.tsx`）、组件页的「怎么用 / 无障碍」（`gallery/guidance/<组>.ts`）、模式（`gallery/patterns/<id>.tsx`）。一条一句，写数值和做法，不写套话；照搬别处的写出处。跟旧规则冲突的写明，待用户定的列出来。只写在代码注释或 markdown 里不算。

## 门禁

在仓库根目录跑，全部通过才算完成，CI（`.github/workflows/ci.yml`）跑同样几项：

- `pnpm test`：`vp check`（格式与代码检查，有一条提示就不过）、token 生成物与源头一致、设计系统产物与代码一致、单测（含「包里没有越出包的路径」）。
- `pnpm typecheck`
- `pnpm build:site`

**快速模式（2026-11-18 用户定：速度太慢，平时只跑 fast）**：改完在 `packages/react` 跑 `pnpm fast`（一般一分钟内）：只查改动文件的格式与 lint、类型检查、受影响的单测、受影响页的 e2e（dpr-1）、`vr:fast`；改了共用层（令牌、theme 样式、lib、primitives、被二十几页引用的件）它会跳过 e2e 并提示。全量（`pnpm test`、`pnpm test:e2e`、`pnpm vr`）只在一批改动合并前集中跑一次，红了再修。派给 worker 的活也照这个验，不要每件都跑全量、补全量截图。

**写界面代码前查现代写法（modern-web-guidance，Chrome / Edge / Firefox / MDN 维护）**：做对话框、浮层、动画进出场、滚动、表单、布局这类件之前，先 `npx -y modern-web-guidance@latest search "<要做的事>"`，再 `retrieve <guide-id>` 读对应指南，优先用平台原生能力（popover、dialog、View Transitions、field-sizing、toSorted 等），别照训练数据里的老套路写。交付前可跑 `npx -y modern-web-guidance@latest legacy-scan src` 看有没有新引入的旧写法。

Vite+ 用足（2026-11-18）：根目录直接 `pnpm fast` / `pnpm vr` / `pnpm vr:fast`（转给 @katana-ui/react）。类型检查、单测、文档自检是 `vite.config.ts` 里 `run.tasks` 的带缓存任务（`vp run tsc` / `unit` / `docs-check`），输入没变秒命中。提交时 `.vite-hooks/pre-commit` 跑 `vp staged`，只对暂存文件 `vp check --fix`；新克隆后跑一次 `vp hooks enable`。语法直接写最新的：tsconfig target/lib 都是 ESNext，`Object.groupBy`、`Array.prototype.toSorted/findLast`、`using`、`Promise.withResolvers` 等随便用，不写兼容垫片。

全量门禁在 CI 上并行跑（单测、组件截图、整页回归、e2e 切 4 片，runner 由仓库变量 KATANAUI_RUNNER 指到自建机）；本地全量是 `pnpm full`，约 20 分钟，只在必要时跑。整页回归不再截有组件截图的页（423 → 30 张）。

快速模式的预算是 60 秒（2026-11-18）：`pnpm fast` 超过一分钟就算 bug，它会以非 0 退出并点名最慢的一步——去修那一步，不要调大预算。现在的做法：单测不隔离（isolate: false）；组件截图（browser/*.browser.test.tsx，Vitest 浏览器模式 + pixelgate）只截 Graphite、最多 30 个件，波及更多时截代表件；e2e 只跑改动的件自己那页、最多 15 条；改动全有组件截图时跳过整页 vr:fast。新组件要配组件截图，测试名等于文件名（lcd.tsx → 'lcd'），否则快速模式认不出、只能退回整页。改了截图测试本身时只截改动落到的那几个测试（落在 test 之外就是该文件的全部，最多 30 个），改了共用底座（browser/render.tsx、browser/open-frame.tsx、vitest.browser.config.ts）才退回代表件，不再整套（2026-11-24，#201：整套约 6 分钟）。

并行派发的规矩（2026-11-18，G1–G6 一轮用了约 7 小时的教训）：这台机器 2 核 7G，同时最多 2 个 worker；worker 只跑 `pnpm fast`，不跑全量 e2e / vr（全量只在合并后跑一次）；worker 不提交生成物（registry.json、props.generated.json、design-system/**、a2ui v1.json、tokens.css），合并后统一重新生成；按文件边界切批（共享的 tokens.json、ui.css、registry.ts、index.ts 由我在合并时一次改），批次间先约定好新 token 名，免得各造一份。

**视觉回归（pixelgate，自研）**：改了视觉相关的件，交付前在 `packages/react` 跑 `pnpm vr:fast`（只截受影响的页，约半分钟），在汇报里附 changed 列表与 report 路径（`.pixelgate/report/index.html`）；合并前、或改了令牌 / theme 样式 / lib / primitives 这类共用层，跑全量 `pnpm vr`。预期的变化用 `pnpm vr:approve` 收为新基线并随代码提交，规则写在文档站「开发接入 → 视觉回归」。

读 token：新代码只读 characteristics（`--k-*`）与语义 token（`--pnl-up`、`--chart-grid`、`--shadow-overlay` 这类），不直接读色阶（`--bg-*`、`--ink-*`、`--signal-*`、`--alpha-white-*`）；阴影不写 rgba，用 `--shadow-*`；状态与涨跌的类型用 `src/lib/severity.ts`、`src/lib/tone.ts`（2026-11-18，G0）。

改 token：改 `packages/tokens/src/tokens.json`（弹簧改 `motion.tokens.json`），跑 `pnpm tokens:sync`；改了文档站的页数据或件，跑 `pnpm ds:build`。生成文件不手改。

## 验收（2026-11-23 用户定，#143）

词的意思见 [GLOSSARY.md](GLOSSARY.md)：回执、审查、验收、功能地图、判据。做法照 pstack（Lauren Tan）的 `create-verification-skill` 与 `create-formal-verification-skill`。

- **回执不算数**：执行者（人或 agent）交回的 PASS / ISSUES 只是自述，不能代替审查或验收。
- **审查与验收分开**：审查是另一个会话读 diff 找缺陷，管代码好不好；验收是另一个会话照功能地图亲手驱动、按票里的判据逐条给证据（过 / 不过 / 没法验），管功能到没到。
- **验收不拦合并，只拦关票**：门禁过了照旧可以合（2026-11-14 那条不变）；票要等验收过了才关，验收没过就另开修复 PR。
- **验证技能 `.claude/skills/verify-katanaui/`**：在真实浏览器里驱动文档站、留证据；新件或改了行为的件，同一个 PR 里补它在功能地图（`features/`）里的那一份。
- **形式化验证只挑最贵的承诺**：违背了会伤用户、测试又难覆盖的才做（第一个是订单簿合并档位，`.claude/skills/formal-tick-merge/`）。验证要能失败：故意改坏被保护的代码要变红。代码动了按技能里记的覆盖范围重跑，重新对齐后再推进同步提交。

## 发版

还没有 npm（仓库私有，见 #2「发布与消费」）。发版就是在 main 上打标签 `vX.Y.Z`，同时改 `packages/*/package.json` 的 version；
消费方写 `git+https://github.com/XartLab/KatanaUI.git#vX.Y.Z&path:packages/react`。破坏性改动在 PR 正文写清怎么改。

**按批发版（2026-11-21 用户定，《人月神话》：团队之间的接口按版本走）**：一批改动（用户点头的几件，或一天里给 KATANAview 用的组件 PR）合完打一个标签，不为每个 PR 打。KATANAview 只升到标签、一批升一次（它的 AGENTS.md「组件库已搬出」）；它被这边某个修复卡住时可以先升到提交号，下一批打标签时换回。改了 `dependencies` 的批次在发版说明里写明，KATANAview 那边要正常 `pnpm install` 重算锁文件。

## 提交

- 每件事先开 issue，每个改动走 PR（`Closes #N`），squash 合并；不直推 main。
- `feat:` / `fix:` / `docs:` / `chore:` 前缀加中文主题；提交带 `Co-Authored-By` 与会话署名行，`git commit -s`。不替别人写作者行。
- 内部文档、注释、提交说明用中文；README、CONTRIBUTING 用英文。
