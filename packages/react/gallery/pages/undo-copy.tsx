// SPDX-License-Identifier: MIT
// 撤销栈与复制图（#77 第 4 条）的演示。文案与数据都是演示用的。
import { CopyToast, type CopyResult, type CopyToastLabels } from '../../src/index'
import { CopyToastUsage } from '../usage/CopyToastUsage.tsx'
import { UseUndoStackUsage } from '../usage/UseUndoStackUsage.tsx'
import { Row } from './parts'

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

const STATES: readonly CopyResult[] = [
  { status: 'copied', kind: 'image' },
  { status: 'downloaded', kind: 'image', reason: 'denied', filename: 'equity-curve.png' },
  { status: 'failed', kind: 'image', reason: 'render' },
]

/** 三种结果静态摆出（不套固定视口）。 */
export function CopyToastStates() {
  return (
    <div style={{ width: 340, display: 'grid', gap: 8 }} data-gallery-copy-states>
      {STATES.map((result, index) => (
        <CopyToast
          key={result.status}
          viewport={false}
          toast={{ id: index + 1, result, phase: 'open' }}
          labels={LABELS}
          onDismiss={() => {}}
        />
      ))}
    </div>
  )
}

export function CopyToastDemo() {
  return (
    <>
      <Row name="点相机钮复制（剪贴板不行就下载）">
        <CopyToastUsage />
      </Row>
      <Row name="三种结果">
        <CopyToastStates />
      </Row>
    </>
  )
}

export function UseUndoStackDemo() {
  return (
    <Row name="列布局：拖列宽合并成一步，换列序另算；点进这块后 Mod+Z / Mod+Shift+Z">
      <UseUndoStackUsage />
    </Row>
  )
}
