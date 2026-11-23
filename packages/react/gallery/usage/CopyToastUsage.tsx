// SPDX-License-Identifier: MIT
import { CopyToast, copyImage, useCopyFeedback, type CopyToastLabels } from '../../src/index'
import { EquityCurve, type EquityCurvePoint } from '../../src/quant'

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
