// SPDX-License-Identifier: MIT
import { useState } from 'react'
import { RenderingSettings, applyRendering, readRendering, type RenderingSettingsValue } from '../../src/index'

// 应用启动时：读存盘的设置，applyRendering 写回根节点；改了就存盘。
export function RenderingSettingsUsage() {
  const [value, setValue] = useState<RenderingSettingsValue>(readRendering)
  return (
    <RenderingSettings
      value={value}
      onValueChange={(next) => {
        setValue(next)
        applyRendering(next)
      }}
    />
  )
}
