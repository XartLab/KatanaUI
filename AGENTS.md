# KatanaUI Agent 指南

给在本仓库干活的 AI Agent（Claude Code、Codex 等）的规矩。跟用户说中文，先说结论。

## 这是什么

KatanaUI 是设计系统的**源头仓库**（2026-11-14 用户定，#2）：token、React 组件、文档站都在这里开发。
以前它是 KATANAview `packages/ui` 的只读镜像，现在反过来，KATANAview 按 git 标签依赖这里发布的版本，不再带组件库源码。

- 结构照 salt-ds：仓库根是 pnpm workspace，包在 `packages/`。现在有 `packages/react`（`@katana-ui/react`）；
  `packages/tokens`（`@katana-ui/tokens`：三层 token 与密度、弹簧，生成 `tokens.css`）。`@katana-ui/react` 依赖它，在 package.json 里写确切版本、不写 `workspace:`，放 `peerDependencies` 并同版本写进 `devDependencies`。
- 包内的分层、件的归属、文档站与设计系统产物的规矩见 [packages/react/docs/zh-CN.md](packages/react/docs/zh-CN.md)。
- 许可证 MIT。每个源文件头写 `SPDX-License-Identifier: MIT`。不许引进 AGPL 的代码；取自别处的写明出处与许可证，记进包的 `NOTICE`。
- 包不依赖任何应用。应用相关的事（行情、面板、文案语言）由调用方传。

## 已定的设计决定（不要推翻，要改先问用户）

- 默认主题是 Graphite（用户 2026-11-14 定，KATANAview #1775；已落地：`tokens.css` 的 `:root` 就是 Graphite，Console 是 `data-theme="console"` 的覆盖块，文档站默认也是 Graphite）。Graphite 是中性色纯灰，信号色是油画颜料色（土黄 `#d6a548`、铬绿 `#5fae8c`、玫瑰茜红 `#f2607c`）；Console 留作可切主题。不用 TradingView 蓝，不用暖白配高亮黄。
- 组件的样子以 KATANAview 工作台现在的样式为准；Salt 学 token 结构（原值 → 调色 → 语义特征）、密度、文档组织，Salt 是 Apache-2.0，能照搬的实现可以照搬，写出处。
- 包名 `@katana-ui/*`，不带 `katanaview`：要能用在别的量化项目里。

## 门禁

在仓库根目录跑，全部通过才算完成，CI（`.github/workflows/ci.yml`）跑同样几项：

- `pnpm test`：`vp check`（格式与代码检查，有一条提示就不过）、token 生成物与源头一致、设计系统产物与代码一致、单测（含「包里没有越出包的路径」）。
- `pnpm typecheck`
- `pnpm build:site`

**敏捷节奏（2026-11-15 用户定：先出效果，测试以后再说）**：做组件时每个 PR 只跑 `pnpm typecheck`、`pnpm build:site`（改了件就 `pnpm ds:build` 并提交生成物）和改到的那一个文档站 e2e 文件的 dpr-1，先截图给用户看样式；全量 `pnpm test` 与全量 e2e 攒到用户点头的几件合完后集中跑一次，红了再修。用户原话：「每次全量测试太慢了，我们先敏捷开发，先出来看效果再说测试的问题」。

改 token：改 `packages/tokens/src/tokens.json`（弹簧改 `motion.tokens.json`），跑 `pnpm tokens:sync`；改了文档站的页数据或件，跑 `pnpm ds:build`。生成文件不手改。

## 发版

还没有 npm（仓库私有，见 #2「发布与消费」）。发版就是在 main 上打标签 `vX.Y.Z`，同时改 `packages/*/package.json` 的 version；
消费方写 `git+https://github.com/XartLab/KatanaUI.git#vX.Y.Z&path:packages/react`。破坏性改动在 PR 正文写清怎么改。

## 提交

- 每件事先开 issue，每个改动走 PR（`Closes #N`），squash 合并；不直推 main。
- `feat:` / `fix:` / `docs:` / `chore:` 前缀加中文主题；提交带 `Co-Authored-By` 与会话署名行，`git commit -s`。不替别人写作者行。
- 内部文档、注释、提交说明用中文；README、CONTRIBUTING 用英文。
