// SPDX-License-Identifier: MIT
import { Maximize2, Minimize2 } from 'lucide-react'
import { useState } from 'react'
import { PanelFrame, PanelFrameBody, PanelFrameHeader } from '../../src/blocks'
import { Button, Splitter } from '../../src/index'
import type { Pattern } from './types'

function Demo() {
  const [ratio, setRatio] = useState(0.5)
  const [max, setMax] = useState<'left' | 'right' | null>(null)
  const toggle = (side: 'left' | 'right') => setMax((cur) => (cur === side ? null : side))
  const cols =
    max === 'left' ? '1fr 0 0' : max === 'right' ? '0 0 1fr' : `minmax(0, ${ratio}fr) 8px minmax(0, ${1 - ratio}fr)`
  const pane = (side: 'left' | 'right', title: string) => (
    <div style={{ minWidth: 0, overflow: 'hidden', display: max && max !== side ? 'none' : undefined }}>
      <PanelFrame aria-label={title}>
        <PanelFrameHeader
          heading={title}
          actions={
            <Button
              variant="icon"
              aria-label={max === side ? `还原${title}` : `最大化${title}`}
              onClick={() => toggle(side)}
            >
              {max === side ? <Minimize2 /> : <Maximize2 />}
            </Button>
          }
        />
        <PanelFrameBody>
          <p className="gal-note" style={{ padding: 8 }}>
            演示内容
          </p>
        </PanelFrameBody>
      </PanelFrame>
    </div>
  )
  return (
    <div style={{ width: '100%', maxWidth: 640, height: 180, display: 'grid', gridTemplateColumns: cols }}>
      {pane('left', '图表')}
      {max ? null : (
        <Splitter
          axis="row"
          ratio={ratio}
          minFirst={160}
          minSecond={160}
          snapPoints={[0.5]}
          onChange={setRatio}
          label="调整分屏"
          valueText={(v) => `左侧 ${Math.round(v * 100)}%`}
        />
      )}
      {pane('right', '订单')}
    </div>
  )
}

const pattern: Pattern = {
  id: 'split-view',
  title: '分屏',
  summary: '把一块区域切成两个面板，中间一条可拖的分割线；每个面板能单独最大化，再点还原。',
  Demo,
  use: ['图表和订单、列表和详情要同屏对照，比例由用户定', '某个面板偶尔需要占满整块区域（看大图、看长表）'],
  avoid: ['两块内容没有对照关系：用标签页，不要硬切屏', '切成 3 块以上、每块都很窄：改成工作区标签分开放'],
  parts: [
    { page: 'splitter', role: '分割线：拖动、键盘调整、吸附点、最小尺寸' },
    { page: 'panel-frame', role: '每个面板的外框，标题栏放最大化按钮' },
    { page: 'button', role: '图标按钮：最大化 / 还原' },
  ],
  rules: [
    '分割线 8px 宽，悬停显示抓手；方向键每次 8px，Shift + 方向键 32px',
    '每个面板最小 160px（minFirst / minSecond），拖到头就停，不折叠',
    '吸附点 50%，距离 ≤ 6px 时吸过去；双击分割线回到默认比例',
    '最大化把另一个面板收到 0 宽并隐藏分割线，不卸载它，还原后状态原样保留',
    '最大化按钮在面板标题栏右侧，图标在 Maximize / Minimize 之间切换，aria-label 同步写「最大化图表」「还原图表」',
    '比例存进工作区布局，下次打开按上次的比例；最大化状态不存',
  ],
}
export default pattern
