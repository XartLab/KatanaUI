# NewsReader

NewsFeed 点开一条后的阅读窗：来源与操作（复制链接、举报、关闭）、标题、元信息、品种胶囊带涨跌、「要点」列表（闪电图标）、正文。照 TradingView 新闻流的阅读窗（主会话 2026-11-15 实测）。件不取数：标题、元信息、要点、正文都由调用方传；正文里的品种胶囊用 NewsSymbolChip 内联。

## Provide

### NewsReader

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `title / source / sourceLogo / meta` | `string` | — | 标题、来源、来源徽标、写好的元信息一行。 |
| `symbols` | `NewsReaderSymbol[]` | — | { code, name?, logo?, change?（涨跌幅百分数） }；涨跌色走 pnl token。 |
| `keyPoints` | `string[]` | — | 要点；空数组不画这一块。 |
| `children` | `ReactNode` | — | 正文。 |
| `labels` | `NewsReaderLabels` | — | 读屏名与「要点」「关闭」「举报」「复制链接」。 |
| `onClose / onReport / onCopyLink / onSymbolPick` | `function` | — | 给了才画对应的按钮；点品种胶囊回调。 |

## States

- 品种涨跌：正涨色、负跌色，0 不上色。

## Don't

- 不要在件里取数或翻译：文字由调用方传。

## Composition

```
NewsReader（article）
  header：来源 + 操作
  标题、元信息
  品种胶囊
  要点
  正文
```

## Keyboard

- `Tab`：在操作与品种胶囊间移动
