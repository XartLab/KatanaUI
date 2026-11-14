# 换皮：别的项目只覆盖哪些变量

组件只读语义 token（`--bg-*`、`--ink-*`、`--pnl-up` …），不读 KATANA 专有的名字，所以换皮只改变量、不改组件。
`src/theming.test.ts` 守着这一条：`src/primitives/`、`patterns/`、`lib/`、`quant/` 里出现的 `var(--x)`（含 Tailwind 的 `h-(--x)` 简写）不在 `tokens/tokens.css` 里就红。
三类例外不是 token：Radix 在打开的弹层上写进来的 `--radix-*`，动效入场用的 `--k-in-*`（带 fallback），Tailwind 自己的 `--tw-*`。

## 怎么覆盖

先引 `tokens.css`，再引你自己的覆盖，最后引 `ui.css`：

```css
@import 'katana/ui/tokens/tokens.css';
@import './my-theme.css'; /* 下面这种 */
@import 'katana/ui/ui.css';
```

```css
:root[data-theme='acme'] {
  --bg-000: #0a0f1a;
  /* … 最小一组，见下 */
}
```

没覆盖的变量保持 Console 的值。根元素上设 `data-theme="acme"` 即生效；`data-updown="cn"` 照常互换涨跌色（它只换 `pnl-up` 与 `pnl-down` 一对，见 `tokens.css` 末尾）。

## 最小可用的一组（15 个）

换出一个看得过去的皮，覆盖这 15 个就够；表里是每个变量管什么。

| 变量 | 管什么 | 取值的要求 |
| --- | --- | --- |
| `--bg-000` | 凹陷面：输入框、LCD 窗 | 比周围更暗（深色皮）或更亮的一档 |
| `--bg-100` | 整体地面 | |
| `--bg-300` | 面板主体 | 比 `bg-100` 高一层 |
| `--bg-400` | 悬停、浮起层（弹层、菜单） | 比 `bg-300` 再高一层 |
| `--line-100` | 唯一的分隔线 | |
| `--line-200` | 控件边缘、禁用条 | 比 `line-100` 明显 |
| `--ink-100` | 数据层文字 | 在五层底上 ≥ 4.5:1 |
| `--ink-200` | 正文 | 在五层底上 ≥ 4.5:1 |
| `--ink-300` | 说明、单位、时间戳 | 在 `bg-000` 到 `bg-300` 上 ≥ 4.5:1 |
| `--signal-orange` | 强调色：选中、主操作、LED | 在底上 ≥ 3:1（做字时 ≥ 4.5:1） |
| `--signal-red` | 错误、危险 | 同上 |
| `--focus-ring` | 键盘焦点环 | 在各层底上 ≥ 3:1 |
| `--pnl-up` | 涨、盈 | 在底上 ≥ 4.5:1；默认引用 `signal-green` |
| `--pnl-down` | 跌、亏 | 同上；默认引用 `signal-red` |
| `--font-sans` | 界面字体 | 要有汉字回退 |

对比度怎么量：`pnpm lint:ds` 用的算法（WCAG 2.x 相对亮度）在 `scripts/ds-tokens.mjs`；设计系统包的 `tokens.json` 里 `contrast` 一节就是这套 token 的量法，别的皮照抄那几对去量。

## 建议一起换的

没列进最小组、但换底色时不一起换会显得脏的：

- `--bg-200`（单元格）：在 `bg-100` 与 `bg-300` 之间，底色整体变了要跟着变。
- `--ink-400`：刻度与占位，不是文字。
- `--signal-green`、`--signal-amber`、`--signal-blue`、`--signal-orange-dim`：状态色与强调色的暗档。
- `--radius-control`、`--radius-overlay`、`--radius-inner`：圆角，Graphite 就是靠它们与阴影变得更圆。
- `--plate`、`--recess`、`--lift`、`--glow-orange`：阴影，表达材质。

## 现状里已知的限制（不替它们说好话）

- 件里的白色透明度层（边、悬停底、分隔线，照 OpenMarket 实测）现在是一把 14 档的刻度 `--alpha-white-1` … `--alpha-white-14`（2.4%、3%、4% … 30%；定义在 `design/tokens.json`，带 usage），Tailwind 里写 `bg-alpha-white-3`、`border-alpha-white-7`，CSS 里写 `var(--alpha-white-3)`；件里不写裸的白色透明度。它们仍假定底是深色：换成浅底的皮，覆盖这 14 个变量就行（例如换成黑色的透明度）。
- Paper（浅色主题）在 `design/tokens.json` 里有值，但 `tokens.css` 没出，也没验过，所以包里只有 Console 与 Graphite 两个主题。
