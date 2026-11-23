# CopyToast

图右上的相机钮把整张图拍成 PNG 写进剪贴板（ClipboardItem），剪贴板不支持或被拒就退回下载文件；结果（已复制 / 已改为下载 / 失败与原因）用一条 Toast 说。copyImage、copyText 不抛错，返回 CopyResult；提示的计时由 useCopyFeedback 管。

## Provide

`*` marks a required prop.

### CopyToast

toast 来自 useCopyFeedback；viewport=false 只画这一条（文档与截图）。文案全在 labels（CopyToastLabels）。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `toast` * | `CopyToastItem \| null` | — | The toast to show, from useCopyFeedback (null shows nothing). |
| `labels` * | `CopyToastLabels` | — | All text (titles, reasons, close name); the package ships none. |
| `onDismiss` | `() => void` | — | Dismiss handler; renders the close button when given. |
| `onPause` | `() => void` | — | Pause the auto-dismiss while the pointer or focus is inside (useCopyFeedback pause). |
| `onResume` | `() => void` | — | Resume the auto-dismiss when the pointer or focus leaves (useCopyFeedback resume). |
| `position` | `ToastPosition` | `'bottom-right'` | Window corner of the viewport; default bottom-right. |
| `viewport` | `boolean` | `true` | Set false to render only the toast, without the fixed viewport (docs, screenshots, your own viewport). |

### useCopyFeedback({ duration? })

返回 { toast, report, dismiss, pause, resume }：report(结果或 Promise) 插一条新的（新 key，读屏会再读），默认 2400ms 后收；pause / resume 接到 CopyToast 的 onPause / onResume，指针或焦点在上面时不收。

### copyImage(node, { filename?, background?, scale?, noDownload? })

拍 node（ChartActions 交来的是图的 figure）：逐元素抄计算样式、canvas 换成图片，放进 SVG foreignObject 画到 canvas 上，转 PNG；data-copy-image="skip" 的元素（工具条）不进图。默认倍数 devicePixelRatio（1–3），底色取最近一个不透明的祖先背景。

### copyText(text) / canCopyImage() / elementToPng(node)

copyText 写文字（复制代码、直链）；canCopyImage 判剪贴板能不能写图（ClipboardItem、安全上下文、supports("image/png")）；elementToPng 只拍不写。

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { CopyToast, copyImage, useCopyFeedback, type CopyToastLabels } from '@katana-ui/react'
import { EquityCurve, type EquityCurvePoint } from '@katana-ui/react/quant'

const LABELS: CopyToastLabels = {
  region: '复制结果',
  copiedImage: '已复制图片',
  copiedText: '已复制',
  downloaded: '已改为下载 PNG',
  failed: '复制失败',
  unsupported: '这个浏览器不能把图片写进剪贴板',
  denied: '剪贴板权限被拒',
  render: '没能把图拍下来',
  close: '关掉提示',
}

const POINTS: EquityCurvePoint[] = Array.from({ length: 40 }, (_, i) => {
  const equity = 50_000 + Math.round(Math.sin(i / 4) * 900 + i * 60)
  return {
    time: Date.UTC(2026, 9, 8, 1, 30) + i * 15 * 60_000,
    equity,
    drawdown: Math.min(0, Math.round(Math.sin(i / 4) * 900)),
    title: `第 ${i + 1} 笔`,
    equityText: equity.toLocaleString('en-US'),
    drawdownText: '0',
  }
})

// 相机钮在 ChartActions 里：点了把图的 figure 交给 onCopyImage，直接调 copyImage（别先 await 别的），结果交给 report。
export function CopyToastUsage() {
  const feedback = useCopyFeedback()
  return (
    <div className="gal-wide" data-gallery-copy style={{ maxWidth: 640 }}>
      <EquityCurve
        points={POINTS}
        title="权益曲线"
        name="权益"
        label="权益曲线"
        axis={(v) => v.toLocaleString('en-US')}
        formatTime={(t) => new Date(t).toISOString().slice(11, 16)}
        labels={{
          drawdown: '回撤',
          time: '时刻',
          scale: { group: '纵轴', linear: '线性', log: '对数' },
          brush: { start: '窗口起点', end: '窗口终点', window: '窗口位置' },
          actions: {
            group: '图工具',
            table: '表格视图',
            exportCsv: '导出 CSV',
            fullscreen: '全屏',
            copyImage: '复制图片',
          },
        }}
        onCopyImage={(chart) => void feedback.report(copyImage(chart, { filename: 'equity-curve' }))}
      />
      <CopyToast
        toast={feedback.toast}
        labels={LABELS}
        onDismiss={feedback.dismiss}
        onPause={feedback.pause}
        onResume={feedback.resume}
      />
    </div>
  )
}
```

## States

- 已复制（copied）：ok 语气、勾，标题「已复制图片」或「已复制」。
- 已改为下载（downloaded）：warn 语气、下载图标，说明写原因（不支持 / 被拒）。
- 失败（failed）：danger 语气、警示图标；拍图失败（render）不会下载。

## Don't

- 不要在点击处理里先 await 别的再调 copyImage：浏览器会认为不是用户手势，剪贴板被拒。
- 不要因为复制在进行就禁用相机钮：复制可以重来，禁用会丢焦点（modern-web-guidance copy-button）。
- 不要在包里造直链：复制链接只给回调，地址由宿主给。

## Composition

```
ChartActions
  表格视图 · 导出 CSV · 复制图（相机） · 全屏
CopyToast（ToastViewport）
  Toast（tone 按结果）
    ToastIcon · ToastTitle · ToastDescription · ToastClose
```

## Keyboard

- `Tab`：走到相机钮
- `Enter / Space`：复制图
