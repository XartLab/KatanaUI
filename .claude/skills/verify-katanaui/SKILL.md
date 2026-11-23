---
name: verify-katanaui
description: "在真实浏览器里启动并驱动 KatanaUI 的组件文档站（packages/react 的 pnpm dev），照功能地图从用户视角操作组件、留截图与 ARIA 快照作证据。改了看得见的组件行为要验收、要复现某个件的交互问题、或要给 PR 补「在浏览器里亲手走过」的证据时用。"
---

# 验证 KatanaUI 组件文档站

照 pstack 的 `create-verification-skill`（Lauren Tan，MIT）为本仓库写的：怎么起、怎么诊断、怎么驱动、看什么算数、怎么收尾。仓库里的「验收」就用它（XartLab/KatanaUI#143）。
功能地图在 [features/](features/README.md)：先读索引，再读要走的那个功能。地图只写用户看到的路径和能观察的结果，不写实现。

- 表面：文档站，`packages/react` 下 `pnpm dev` 起来的组件页，一个件一页，地址 `#/<页 id>`，`?theme=console` 换主题（不带是 Graphite）。每页的实时预览在 `[data-gallery="<页 id>"]` 里。组件截图（Vitest 浏览器模式）、整页视觉回归（pixelgate）不归这份技能管，见 AGENTS.md「门禁」。
- 驱动工具：仓库锁定的 `@playwright/test`（1.56.1，`packages/react` 的开发依赖），借系统 Chrome（`C:/Program Files/Google/Chrome/Application/chrome.exe`），因为它锁定的 chromium-1194 本机没装。
- 辅助脚本只有一个：`.claude/skills/verify-katanaui/scripts/kui.mjs`，在仓库根目录用 `node` 跑。下文把它简写成 `$KUI`：

```bash
KUI="node .claude/skills/verify-katanaui/scripts/kui.mjs"
```

## Launch

```bash
pnpm install          # 新 worktree 才要
$KUI start            # 端口默认 5196，KUI_PORT=<端口> 可换
```

`start` 做的就是 `pnpm dev` 的两步：先 `pnpm --filter @katana-ui/tokens run tokens:sync`，再 `vp dev --host 127.0.0.1 --port 5196 --strictPort`（直接用 node 起 vp，日志才进得了文件）。它会：

1. 端口被别人占着就退出（退出码 2），不碰那个进程；
2. 把 pid、端口、起服务时的提交写进 `.tmp/verify-katanaui/run/server.json`，日志写进同目录的 `dev.log`；
3. 等 `GET http://127.0.0.1:5196/` 返回标题为 `KatanaUI components` 的页面；
4. 再开一次浏览器，等 `#/button` 的预览 `[data-gallery="button"]` 真的画出来，才打印「就绪」。

就绪信号：命令打印 `就绪：http://127.0.0.1:5196/#/button 画出来了`，退出码 0；`dev.log` 里有 `ready in … ms` 和 `Local: http://127.0.0.1:5196/`。文档站没有数据目录、没有登录、不需要种子数据；演示数据写死在 `packages/react/gallery/` 里。每次驱动都是新的浏览器上下文，`localStorage` 是空的。

关闭：`$KUI stop`（见 Cleanup）。

## Doctor

出现意外先跑，只读，不改任何状态：

```bash
$KUI doctor           # 全 OK 退出码 0，有一条 FAIL 退出码 1
```

逐行回答「这个实例值得接着驱动吗」：

| 行 | 查什么 |
| --- | --- |
| `repo` | 当前分支与提交 |
| `state` / `pid` | `server.json` 在、记的进程还活着 |
| `port` | 5196 上监听的进程是不是 `server.json` 那个 pid 的子孙；不是就说明端口上是别人的服务，测到的是别人的代码 |
| `head` | 起服务以后有没有换过提交（换了就 stop 再 start） |
| `chrome` / `playwright` | 系统 Chrome 在不在、`@playwright/test` 的版本 |
| `http` | 首页 200 且是文档站 |
| `render` | 浏览器里 `#/button` 画得出来，`data-theme` 是什么 |
| `errors` | 页面未捕获异常与控制台报错；favicon 404 与已知报错单列，不算失败 |

## Drive

一条功能一条流程，流程文件在 `scripts/flows/<名>.mjs`，名字与功能地图的文件名一一对应：

```bash
$KUI drive data-grid       # features/data-grid.md
$KUI drive order-ticket    # features/order-ticket.md
$KUI drive overlays        # features/overlays.md
$KUI drive tabs            # features/tabs.md
$KUI drive agent-run-detail # features/agent-run-detail.md
$KUI drive tabs --theme console   # 换主题走同一条
$KUI drive tabs --headed          # 开着窗口看它走
```

每一步打印「做了什么 → 看到什么」，全过打印 `PASS <证据目录>`、退出码 0；任何一步断言不过、页面抛异常、或控制台有不在已知名单里的报错，打印 `FAIL` 和第一条原因、退出码 1。

只想看一页、不走流程：

```bash
$KUI shot data-grid              # 预览区截图 + 预览区 ARIA 快照
$KUI shot data-grid --full       # 再加整页截图
```

加新流程：照现有的 `flows/*.mjs` 写，导出 `{ title, page, run }`。`run` 拿到 `{ page, section, step, expect, aria }`：`section` 是该页的 `[data-gallery]` 预览区，`step(标题, 动作)` 执行动作、把返回值记成「看到什么」并截一张图，`expect` 是 `@playwright/test` 的断言，`aria(locator, 文件名)` 存 ARIA 快照。定位照这个顺序选：ARIA 角色加名字（`getByRole('tab', { name: '换手榜', exact: true })`）、`data-slot`、`data-testid`、`data-col`；不用坐标和 Tab 次序。同时更新 `features/` 里对应的地图。

仓库自带的 e2e 规格也能拿来当补充证据（它自己打包文档站、用 `vp preview` 起在 5197，跟上面的开发服务器互不相干）：

```bash
$KUI e2e e2e/data-grid-columns.spec.ts -g "列优先级"
```

它临时写一个 `packages/react/.pw-local.config.ts`（继承 `playwright.config.ts`，只把浏览器换成系统 Chrome），跑完就删。这只是补充：功能地图里的判据以 `drive` 的结果为准。

## Evidence

- 证据都在 `.tmp/verify-katanaui/evidence/`（`.tmp/` 在 `.gitignore` 里，不进仓库）：
  - `drive` 每跑一次一个目录 `<本地时间>-<流程>/`：每步一张截图 `NN-<步骤名>.png`、流程里存的 `*.aria.yml`、`report.md`（一张「做了什么 / 看到什么 / 截图」的表）、`result.json`（同样内容加报错分类、提交号、地址），失败时多一张 `fail.png`。
  - `shot` 一个目录 `<本地时间>-shot-<页 id>/`：`<页 id>.png`、`<页 id>.aria.yml`、`errors.json`。
  - `stop` 把这次的 `dev.log` 复制成 `dev-<本地时间>.log`。
- 算数的证明：走用户的路径（点、键盘、填框），不调组件内部的 setter，不改演示数据；每一步记动作和动作后的状态（`aria-sort`、`aria-selected`、`aria-expanded`、焦点在谁身上、回显里的文字），不只拍最后一屏；会产生输出的动作（下单）要从第二个地方读结果，比如下单面板下面的 `output` 回显。
- 报告里写：流程名、提交号、PASS / FAIL、证据目录；没走到的路径照实写试了什么、缺什么，不拿别的入口顶替。

## Cleanup

```bash
$KUI stop
```

- 只停 `server.json` 里那个 pid 的进程树（Windows 上 `taskkill /T`），绝不按进程名杀：同一台机器上常有别的 worktree 的 `vp dev` 和 `node` 在跑。
- 等端口空出来，复制日志进证据目录，再删 `.tmp/verify-katanaui/run/`。证据目录不删。
- 浏览器每条命令结束时自己关；`drive` 中途被打断，用任务管理器按 pid 收拾，同样不要按名字杀 Chrome（用户自己的 Chrome 也叫 `chrome.exe`）。
- `start` 失败、`drive` 失败之后也要 `stop`，免得留下占着 5196 的服务。

## Gotchas

- **锁定的浏览器没装**：`@playwright/test` 1.56.1 要 chromium-1194，本机的 Playwright 缓存只有更新的版本，所以 `kui.mjs` 一律用 `executablePath` 指到系统 Chrome。换机器时设 `KUI_CHROME=<chrome 路径>`。仓库的 `pnpm test:e2e` 直接跑会报找不到浏览器，用 `$KUI e2e`。
- **favicon 404 是噪声**：文档站没有 favicon，系统 Chrome 会去要 `/favicon.ico`（锁定的 headless_shell 不要），控制台就多一条 `Failed to load resource … 404`。`kui.mjs` 把它单列成 `noise`，不判失败；拿整套 e2e 判回归时也要先剔掉它（2026-11-22 整套 a11y 跑出 520 条红，全是这一条）。
- **已知报错**：c9634db 上每页都报一条 React 告警 `Encountered two children with the same key, decisions`（文档站目录的 decisions 一组 key 重复）。`kui.mjs` 的 `KNOWN_CONSOLE` 把它记成 `known`、不判失败；修好以后从名单里删掉。加别的条目要写明在哪个提交上见到、票号。`dev.log` 里还有一条 Vite 的 `Assets in public directory cannot be imported from JavaScript`（a2ui 的 `v1.json`），也是 main 上就有的，不影响页面。
- **无头模式藏滚动条**：无头 Chrome 默认带 `--hide-scrollbars`，量滚动条宽度、看滚动条有没有出来时要加 `--scrollbars`（`$KUI drive <流程> --scrollbars`，内部是 `ignoreDefaultArgs: ['--hide-scrollbars']`）。
- **sticky 顶栏挡住时 click 会自己再滚**：文档站页头是 sticky 的，Playwright 的 `click` 发现目标被挡住会再滚一下页面。验「页面一滚弹层就关」这类行为时，这次额外的滚动会让结果失真：在流程里改用 `locator.evaluate((el) => el.click())`。
- **首次打开要编译**：开发服务器第一次打开某页时才编译它用到的模块，`start` 用 `#/button` 预热过；别的页第一次打开可能要多几秒，`kui.mjs` 等预览区出来最多 90 秒，不要写固定的 `sleep`。
- **页上不止一个同类件**：一页常有好几个演示（`#/data-grid` 有好几张表，`#/tabs` 有两组页签），定位先收到具体的那个（`getByTestId('grid-demo')`、`getByRole('tablist').first()`），否则会点到别的演示上。
- **换页别重载**：同一条流程里换到另一页，点左侧目录（`navigation「文档目录」` 里的 `a.k-sidenav-link[href="#/<id>"]`），单页应用不重载，主题和页面状态都留着；`page.goto` 会重来一遍。
- **端口**：5196 是这份技能的默认端口，`playwright.config.ts` 的 e2e 默认 5331、`$KUI e2e` 用 5197。几个 worktree 同时验时各设一个 `KUI_PORT`；`doctor` 的 `port` 一行不是 OK 时不要接着驱动。
