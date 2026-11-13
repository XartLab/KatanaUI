# @katanaview/ui

KatanaConsole 自建的组件框架（决策记录 [0049](../../docs/architecture/adr/0049-self-built-ui-framework.md)）：Radix 做行为底座，shadcn 的代码做起步，Tailwind v4 写样式，颜色、字体、间距、动效全部取自 `tokens.json` 生成的 token。
私有包（还没发 npm），许可证 **MIT**（用户 2026-11-14 定，#1876），好复用到别的量化项目，包括不是 AGPL 的项目；应用与别的 `@katanaview/*` 包仍是 AGPL-3.0。`src/primitives/` 里的文件是 shadcn/ui 的衍生（MIT，文件头写着出处），我们自己写的件在 `src/katana/`（也是 MIT）。
不依赖应用代码，也不依赖别的 `@katanaview/*` 包，所以 MIT 的包里不会混进 AGPL 的代码（`.dependency-cruiser.cjs` 的 `ui-standalone` 守着）。包里每个源文件头写 `SPDX-License-Identifier: MIT`，`node scripts/check-license.mjs --fix` 会补上缺的、改掉写成 AGPL 的头。

## 分层

```
tokens → theme → lib → primitives → katana → patterns → quant
```

只许往左依赖（`.dependency-cruiser.cjs` 的 `ui-*` 规则）。

| 层 | 目录 | 放什么 |
| --- | --- | --- |
| tokens | `src/tokens/` | `tokens.css`（`node scripts/sync-tokens.mjs` 从 `design/tokens.json` 生成，不手改）、`motion.tokens.json`（三条弹簧） |
| theme | `src/theme/` | `theme.css`：Tailwind v4 的 `@theme inline` 把 token 接成工具类；`motion.css`：入场、退场的关键帧与 `data-state` 动效 |
| lib | `src/lib/` | `cn`（`clsx` + `tailwind-merge`，认得 `k-text-*` 字号档）、`focus`（焦点环类）、`motion`（弹簧参数） |
| primitives | `src/primitives/` | 无业务的基础件：button（含 `icon` 变体）、input、select、toggle-group、slider、checkbox、switch、tooltip、popover、dialog、dropdown-menu、context-menu、tabs、accordion |
| katana | `src/katana/` | KATANA 自有的件（见下）：led、lcd、dot-matrix、rolling-text、badge、kbd、number-input、date-time-input、skeleton 与加载态、password-input、delete-button、notification-bell、status-icon、ai-status、matrix-orb、step-player、theme-selector、code-block、web-search、task-list、duration-picker（后十二件交互学自 rare-ui，实现原创，文件头写明）；可以用 primitives，不是 shadcn 的衍生，所以单放一处（`scripts/check-license.mjs` 把 `primitives/` 整个当 MIT） |
| patterns | `src/patterns/` | 由基础件组出来的固定搭法：multi-select（弹层加勾选） |
| quant | `src/quant/` | 量化领域的件与格式化（出口 `@katanaview/ui/quant`）：`ChangeText`（涨跌幅）、`PnlText`（盈亏）、`format/`（价格按精度或 tick、涨跌幅、数量缩写；纯函数另有 `@katanaview/ui/quant/format` 出口，画布与 Worker 里用）。只依赖下面几层，不依赖行情、图表包与应用；品种、精度、单位由调用方传。有两个及以上调用方的才进 |

### KATANA 自有件（#1860）

读数与状态灯这类件是我们自己的，不是 shadcn 起步的，原来在应用的 `src/ui/`：Led、Lcd、DotMatrix、RollingText、BadgeGroup、Kbd、NumberInput、DateTimeInput、Skeleton 与 Loading、LoadingBoundary、LoadingView。
样子照组件卡，没改：规则是 `src/theme/` 下的普通 CSS（`led.css`、`lcd.css`、`kbd.css`、`badge.css`、`rolling-text.css`、`number-input.css`、`date-time.css`、`loading.css`），类名 `k-*` 原样保留，应用里按这些类写的覆盖规则照旧生效。
文字一律由调用方传（`label`、`LoadingTexts`、`DateTimeLabels`），包里没有中文；跟应用耦合的部分（徽标从市场包来、快捷键按平台拆块、文字按界面语言翻）留在 `src/ui/` 的适配层，调用处不用改。

## 应用怎么用

只从这几个出口引：

```ts
import { Button, Switch } from '@katanaview/ui' // 组件
import '@katanaview/ui/tokens.css' // token，先引
import '@katanaview/ui/ui.css' // Tailwind 主题与动效，最后引
import { snappy } from '@katanaview/ui/motion' // 弹簧参数（motion/react 用）
import { ChangeText, formatPrice } from '@katanaview/ui/quant' // 量化层
```

`ui.css` 要最后引：Tailwind 的工具类不放进 `@layer`，同样的选择器权重下靠引入次序压过应用里的旧样式。没有 preflight，不改应用已有的基础样式。
应用里不要用与 Tailwind 工具类同名的类名（`.flex`、`.hidden`、`.border`、`.container` 这类）：工具类不在 `@layer` 里，同名的应用类会被它压住或压住它。
应用自己的组件想用 Tailwind 类，要在应用的 CSS 里为那些文件加 `@source`（目前没有这种用法）。

## 添加一个组件

```
pnpm --filter @katanaview/ui exec shadcn add <component>
```

`shadcn` 命令行钉在 4.22.2，配置在本目录的 `components.json`（文件落到 `src/primitives/`，`cn` 用 `src/lib/cn`）。生成之后要做：

1. 文件头补上 MIT 与出处，格式照现有文件（`scripts/check-license.mjs` 查）。
2. 尺寸、圆角、颜色、动效改成我们的：取 token，不写色值；字号用 `k-text-*`；焦点环用 `lib/focus`；动效写进 `theme/motion.css`，缓动取 `--ease-snappy` 等。
3. 文案不写死在组件里（需要的文字由调用方传，比如 Dialog 的 `closeLabel`），包里不出现中文。
4. 在 `src/index.ts` 导出；在文档站加它的页（见下一节）；在 `e2e/ui-gallery.spec.ts` 加断言用户看得见的行为。
5. 文件名保持 shadcn 的短横线小写（`dropdown-menu.tsx`），这是 `scripts/check-components.mjs` 的例外：它只扫应用的 `src/`。

## 文档站

开发服务器（`pnpm dev:all`）与 e2e 测试台上有 `/ui-gallery.html`（根目录的 `vp preview` 没有）：组件文档站，版式照 kobra.systems 的组件页（2026-11-14 读，只取结构）。
左侧目录按类分组，右侧一个组件一页，地址 `#/<件名>`（直接打开、前进后退都行）；每页依次是实时预览（默认 Console，页头切 Graphite，`?theme=graphite` 直接以它打开）、属性表、组成、键盘操作。正式构建里没有。
悬停、按下、键盘焦点没法静态摆出来，用鼠标和 Tab 键去碰页上的件，`e2e/ui-gallery.spec.ts` 量它们的计算样式。

加一个件的文档页：在 `gallery/registry.ts` 的 `PAGES` 里加一项（说明、覆盖的出口名、属性表、组成、键盘），在 `gallery/pages/` 写它的演示、在 `gallery/demos.tsx` 登记。
`gallery/registry.test.tsx` 把页和 `src/index.ts` 的出口对账：每个导出的件都要有页，每页写的件都要存在。属性表是手写的，改了组件的属性要同步改它。

## 给别的项目用：shadcn 注册表

`registry.json` 是 shadcn registry 的清单（shadcn 4.22.2 的 schema），由 `scripts/registry-json.mjs` 从源码生成，不手写；每个源文件一项，`registryDependencies` 与 npm 依赖从 import 里扫出来。
`pnpm --filter @katanaview/ui registry:build` 先生成清单，再 `shadcn build` 出到 `packages/ui/r/`（在 `.gitignore` 里，发版时生成）。

- **type 的分法：** `primitives/` 的件是 `registry:ui`；`lib/` 与 `quant/format/` 是 `registry:lib`；`patterns/` 与 `quant/` 的件是 `registry:component`；`style`（token、Tailwind 主题、动效，共六个 CSS）是 `registry:style`。
- **命名：** `@katana/<文件名>`（`button`、`multi-select`、`change-text`）。每层的文件名要唯一，生成时查。
- **落点：** 每个文件装到 `src/katana/ui/<层>/<文件>`，保持包内的相对结构，所以件之间的相对 import 与 `theme.css` 里 `@source` 的相对路径在别的项目里原样有效。

别的项目的 `components.json` 加命名空间注册表（仓库是私有的，`Authorization` 头读环境变量 `GITHUB_TOKEN`；`r/` 要放在这个项目能访问的地址，下面的地址是占位，换成实际托管处）：

```json
{
  "registries": {
    "@katana": {
      "url": "https://<托管 r/ 的地址>/{name}.json",
      "headers": { "Authorization": "Bearer ${GITHUB_TOKEN}" }
    }
  }
}
```

装法（项目要用 Tailwind v4）：

```
npx shadcn add @katana/style @katana/button @katana/change-text
```

然后在入口样式里先引 `katana/ui/tokens/tokens.css`、最后引 `katana/ui/ui.css`（次序见上面「应用怎么用」）。换皮只覆盖哪些变量见 [theming.md](docs/theming.md)。

## 许可证

MIT（用户 2026-11-14 定，#1876），见本文开头。别的项目经注册表装进去的文件，文件头也是 MIT。

## 设计系统包

`design-system/` 是 design-pipeline（0.15.0-beta.1）格式的设计系统包，**由脚本从代码生成，不手写**：`pnpm --filter @katanaview/ui ds:build`。
`tokens.json` 来自 `design/tokens.json`（只带实装了的 Console 与 Graphite，补 `contrast`；对不上比例的 token 保留原值，比值写在它的 usage 里），
`README.md` 来自手写的 `ds/guidelines.md`，`components/bundle.css` 是 `tokens.css` 加 Tailwind 编出的 `ui.css`，
每个件的 `README.md` 与 `preview.html` 读文档站的页数据（`gallery/registry.ts` 的 `PAGES`：说明、属性、组成、键盘；预览是 `gallery/demos.tsx` 经 `react-dom/server` 渲染的静态 HTML，预览里摆件的版面类在 `gallery/preview.css`），经 `ds/render.tsx` 生成，不另写一份。页就是件：加一页（含自有件、量化件）设计系统包就多一个件，注册表的 item 说明也读同一页；每页的 `cardHeight` 是预览卡的高度（生成后在卡里量）。
门禁是 `pnpm lint:ds`，用法见 [测试](../../docs/contributing/testing.md)。

## 测试

- `pnpm --filter @katanaview/ui test`：纯逻辑（`cn`、弹簧参数）与基础件的服务端渲染结构。根目录的 `pnpm test` 包含它。
- `pnpm --filter @katanaview/ui typecheck`：根目录的 `pnpm typecheck` 包含它。
- 浏览器行为：`E2E_GROUP=panel E2E_DEV=1 pnpm exec playwright test e2e/ui-gallery.spec.ts --project dpr-1`。
