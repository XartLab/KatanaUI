// SPDX-License-Identifier: MIT
import { useState } from 'react'
import { WorkspaceTabs, type WorkspaceTab } from '../../src/blocks'
import { Led } from '../../src/index'
import type { Pattern } from './types'

const TABS: readonly WorkspaceTab[] = [
  { id: 'overview', name: '总览', hotkey: '⌘1' },
  { id: 'desk', name: '交易台', hotkey: '⌘2' },
  { id: 'lab', name: '研究台', hotkey: '⌘3' },
]

function Demo() {
  const [tabs, setTabs] = useState(TABS)
  const [active, setActive] = useState('desk')
  return (
    <div className="gal-stack" style={{ width: '100%', maxWidth: 760 }}>
      <p className="gal-note">演示数据：时钟和链路是写死的。</p>
      <header
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, height: 36 }}
        aria-label="应用顶栏"
      >
        <div style={{ minWidth: 0, flex: 1 }}>
          <WorkspaceTabs
            workspaces={tabs}
            activeId={active}
            label="工作区"
            createLabel="新建工作区"
            moreLabel="更多工作区"
            onSelect={setActive}
            onRename={() => {}}
            onCreate={() => setTabs((prev) => [...prev, { id: `ws${prev.length}`, name: `工作区 ${prev.length}` }])}
            onReorder={() => {}}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <Led state="ok" label="行情已连接" />
          <Led state="warn" label="下单变慢" />
          <time dateTime="2026-11-17T09:30:12" style={{ fontVariantNumeric: 'tabular-nums' }}>
            09:30:12
          </time>
        </div>
      </header>
    </div>
  )
}

const pattern: Pattern = {
  id: 'app-header',
  title: '应用顶栏',
  summary: '窗口最上面一条：左边是工作区标签，右边是系统灯和时钟；不放页面标题，不放操作按钮。',
  Demo,
  use: ['多工作区的桌面式应用，用户要随时切换、新建、重命名工作区', '要常驻显示系统健康和交易时钟的地方'],
  avoid: ['页面内部的区块切换：用标签页（Tabs）', '只有一个固定页面的小工具：不需要顶栏，直接放内容'],
  parts: [
    { page: 'workspace-tabs', role: '工作区标签：切换、双击重命名、拖拽排序、溢出折叠' },
    { page: 'led', role: '行情 / 下单链路灯，点开看详情' },
    { page: 'status-bar', role: '灯多于 3 个时，改放到底部状态栏' },
    { page: 'command', role: '顶栏右侧的 ⌘K 入口（可选）' },
  ],
  rules: [
    '高度 48px（rail-h），贴页面底色，底部一条 1px 分隔线，不加阴影',
    '左标签右状态：标签占满剩余宽度并可收进「更多」，右侧区域 flex-shrink: 0，永不被挤掉',
    '工作区前 9 个带 ⌘1…⌘9 快捷键，标签上显示键位',
    '时钟用等宽数字（tabular-nums），显示交易所时区并写明时区，不用本机时区悄悄代替',
    '右侧最多 3 个灯 + 1 个时钟；更多的健康项放底部状态栏',
    '顶栏不放保存、导出这类操作按钮；操作属于面板标题栏或工具栏',
  ],
  source: { label: 'Salt · App header', href: 'https://www.saltdesignsystem.com/salt/patterns/app-header' },
}
export default pattern
