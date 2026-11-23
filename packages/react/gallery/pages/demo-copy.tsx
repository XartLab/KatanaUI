// SPDX-License-Identifier: MIT
// 文档站演示里的「复制图」（#87 补充第 7 条）：各图的相机钮都交给 demoCopyImage，结果由文档站外壳里唯一的 DemoCopyToast 提示。
// 演示页只要在图的 props 里加 onCopyImage: demoCopyImage 与 actions 文案的 copyImage；真实用法（useCopyFeedback + CopyToast）见 copy-toast 页。
import { useEffect } from 'react'
import { CopyToast, copyImage, useCopyFeedback, type CopyResult, type CopyToastLabels } from '../../src/index'

const COPY_LABELS: CopyToastLabels = {
  // 跟 copy-toast 页自己的提示区分开：两处同名的 region 会被 axe 判 landmark-unique。
  region: '复制结果（演示）',
  copiedImage: '已复制图片',
  copiedText: '已复制',
  downloaded: '已改为下载 PNG',
  failed: '复制失败',
  unsupported: '这个浏览器不能把图片写进剪贴板',
  denied: '剪贴板权限被拒',
  render: '没能把图拍下来',
  close: '关掉提示',
}

const listeners = new Set<(result: Promise<CopyResult>) => void>()

/** 相机钮的回调：在点击的同一拍里调 copyImage（浏览器才认用户手势），结果交给外壳的提示。 */
export function demoCopyImage(chart: HTMLElement) {
  const result = copyImage(chart, { filename: chart.getAttribute('aria-label') ?? 'chart' })
  for (const listener of listeners) listener(result)
}

/** 文档站外壳挂一个：收 demoCopyImage 的结果，弹复制提示。 */
export function DemoCopyToast() {
  const feedback = useCopyFeedback()
  const { report } = feedback
  useEffect(() => {
    const listener = (result: Promise<CopyResult>) => void report(result)
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  }, [report])
  return (
    <CopyToast
      toast={feedback.toast}
      labels={COPY_LABELS}
      onDismiss={feedback.dismiss}
      onPause={feedback.pause}
      onResume={feedback.resume}
    />
  )
}
