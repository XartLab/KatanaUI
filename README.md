# @katanaview/ui

KatanaConsole 自建的组件框架（决策记录 [0049](../../docs/architecture/adr/0049-self-built-ui-framework.md)）：Radix 做行为底座，shadcn 的代码做起步，Tailwind v4 写样式，颜色、字体、间距、动效全部取自 `tokens.json` 生成的 token。
私有包，AGPL-3.0-only；`src/primitives/` 里的文件是 shadcn/ui 的衍生（MIT，文件头写着）。不依赖应用代码，也不依赖别的 `@katanaview/*` 包。

## 分层

```
tokens → theme → lib → primitives → patterns
```

只许往左依赖（`.dependency-cruiser.cjs` 的 `ui-*` 规则）。

| 层 | 目录 | 放什么 |
| --- | --- | --- |
| tokens | `src/tokens/` | `tokens.css`（`node scripts/sync-tokens.mjs` 从 `design/tokens.json` 生成，不手改）、`motion.tokens.json`（三条弹簧） |
| theme | `src/theme/` | `theme.css`：Tailwind v4 的 `@theme inline` 把 token 接成工具类；`motion.css`：入场、退场的关键帧与 `data-state` 动效 |
| lib | `src/lib/` | `cn`（`clsx` + `tailwind-merge`，认得 `k-text-*` 字号档）、`focus`（焦点环类）、`motion`（弹簧参数） |
| primitives | `src/primitives/` | 无业务的基础件：button、checkbox、switch、tooltip、popover、dialog、dropdown-menu、tabs、accordion |
| patterns | `src/patterns/` | 由基础件组出来的固定搭法（只有说明，还没有代码） |

## 应用怎么用

只从三个出口引：

```ts
import { Button, Switch } from '@katanaview/ui' // 组件
import '@katanaview/ui/tokens.css' // token，先引
import '@katanaview/ui/ui.css' // Tailwind 主题与动效，最后引
import { snappy } from '@katanaview/ui/motion' // 弹簧参数（motion/react 用）
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
4. 在 `src/index.ts` 导出；在 `gallery/gallery.tsx` 摆出它的各个状态；在 `e2e/ui-gallery.spec.ts` 加断言用户看得见的行为。
5. 文件名保持 shadcn 的短横线小写（`dropdown-menu.tsx`），这是 `scripts/check-components.mjs` 的例外：它只扫应用的 `src/`。

## 展示页

开发服务器（`pnpm dev:all`）与 e2e 测试台上有 `/ui-gallery.html`（根目录的 `vp preview` 没有）：每个件的各个状态，Console 与 Graphite 两个主题并排（`?theme=console` 或 `?theme=graphite` 只看一个）。正式构建里没有。
悬停、按下、键盘焦点没法静态摆出来，用鼠标和 Tab 键去碰页上的件，`e2e/ui-gallery.spec.ts` 量它们的计算样式。

## 测试

- `pnpm --filter @katanaview/ui test`：纯逻辑（`cn`、弹簧参数）与基础件的服务端渲染结构。根目录的 `pnpm test` 包含它。
- `pnpm --filter @katanaview/ui typecheck`：根目录的 `pnpm typecheck` 包含它。
- 浏览器行为：`E2E_GROUP=panel E2E_DEV=1 pnpm exec playwright test e2e/ui-gallery.spec.ts --project dpr-1`。
