// SPDX-License-Identifier: MIT
import { useState } from 'react'
import { ShortcutRecorder, type ShortcutRecorderLabels } from '../../src/index'

const RECORDER_LABELS: ShortcutRecorderLabels = {
  empty: '未设置',
  recording: '按下新的快捷键',
  clear: '清除快捷键',
  conflict: (action) => `已被「${action}」使用`,
  needModifier: '要带 Ctrl、Alt、Shift 或 Meta',
}

// 演示用的占用表：另外两个动作的快捷键。

const TAKEN = { 'Ctrl+Shift+K': '全部撤单', 'Alt+B': '市价买入' }

export function ShortcutRecorderUsage() {
  const [flatten, setFlatten] = useState<string | null>('Ctrl+Shift+F')
  const [bare, setBare] = useState<string | null>(null)
  return (
    <>
      <ShortcutRecorder
        label="全部平仓快捷键"
        value={flatten}
        onValue={setFlatten}
        labels={RECORDER_LABELS}
        conflicts={TAKEN}
      />
      <output data-gallery-recorder>{flatten ?? '未设置'}</output>

      <ShortcutRecorder
        label="切换品种快捷键"
        value={bare}
        onValue={setBare}
        labels={RECORDER_LABELS}
        requireModifier
      />
      <output data-gallery-recorder-mod>{bare ?? '未设置'}</output>

      <ShortcutRecorder label="只读快捷键" value="F5" onValue={() => {}} labels={RECORDER_LABELS} disabled />
    </>
  )
}

// 演示用的筛选项与命中数（不是行情）。
