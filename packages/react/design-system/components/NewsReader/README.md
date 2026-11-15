# NewsReader

NewsFeed 点开一条后的阅读窗：来源与操作（复制链接、举报、关闭）、标题、元信息、品种胶囊带涨跌、「要点」列表（闪电图标）、正文。照 TradingView 新闻流的阅读窗（主会话 2026-11-15 实测）。件不取数：标题、元信息、要点、正文都由调用方传；正文里的品种胶囊用 NewsSymbolChip 内联。

## Provide

`*` marks a required prop.

### NewsReader

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `title / source / sourceLogo / meta` | `string` | — | 标题、来源、来源徽标、写好的元信息一行。 |
| `symbols` | `NewsReaderSymbol[]` | — | { code, name?, logo?, change?（涨跌幅百分数） }；涨跌色走 pnl token。 |
| `keyPoints` | `string[]` | — | 要点；空数组不画这一块。 |
| `children` | `ReactNode` | — | 正文。 |
| `labels` | `NewsReaderLabels` | — | 读屏名与「要点」「关闭」「举报」「复制链接」。 |
| `onClose / onReport / onCopyLink / onSymbolPick` | `function` | — | 给了才画对应的按钮；点品种胶囊回调。 |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { NewsReader } from '@katana-ui/react/blocks'

export function NewsReaderUsage() {
  return (
    <div style={{ width: '100%', maxWidth: 560 }}>
      <NewsReader
        title="演示：虚构公司公布季度业绩，营收好于预期"
        source="演示通讯社"
        meta="7 分钟前 · 演示通讯社 · 2 分钟阅读"
        symbols={[
          { code: 'ALFA', name: '示例阿尔法科技', change: 1.82 },
          { code: 'BETA', name: '示例贝塔零售', change: -0.59 },
        ]}
        keyPoints={['营收同比增长 12%，高于市场预期的 9%', '管理层上调全年指引']}
        labels={{ reader: '新闻阅读', keyPoints: '要点', close: '关闭', report: '举报', copyLink: '复制链接' }}
        onClose={() => undefined}
        onReport={() => undefined}
        onCopyLink={() => undefined}
      >
        <p>以上内容是演示文字，公司、数字与来源都是虚构的。</p>
      </NewsReader>
    </div>
  )
}
```

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
