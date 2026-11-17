// SPDX-License-Identifier: MIT
import { useState } from 'react'
import { Kbd, ShortcutRecorder, type ShortcutRecorderLabels } from '../../src/index'
import type { Pattern } from './types'

const LABELS: ShortcutRecorderLabels = {
  empty: '未设置',
  recording: '按下新的快捷键',
  clear: '清除快捷键',
  conflict: (action) => `已被「${action}」使用`,
  needModifier: '要带 Ctrl、Alt、Shift 或 Meta',
}

// 演示数据：动作和键位是编的。
const FIXED = [
  { action: '打开命令面板', parts: ['Ctrl', 'K'] },
  { action: '切到工作区 2', parts: ['Ctrl', '2'] },
]
const TAKEN = { 'Ctrl+Shift+K': '全部撤单', 'Alt+B': '市价买入' }

function Demo() {
  const [flatten, setFlatten] = useState<string | null>('Ctrl+Shift+F')
  return (
    <div className="gal-stack" style={{ width: '100%', maxWidth: 480 }}>
      <p className="gal-note">演示数据。上面是只读的键帽显示；下面录一个新键，试试 Ctrl+Shift+K（会提示冲突）。</p>
      <ul className="gal-list">
        {FIXED.map((f) => (
          <li key={f.action}>
            {f.action} <Kbd parts={f.parts} label={f.parts.join('+')} />
          </li>
        ))}
      </ul>
      <ShortcutRecorder
        label="全部平仓快捷键"
        value={flatten}
        onValue={setFlatten}
        labels={LABELS}
        conflicts={TAKEN}
        requireModifier
      />
    </div>
  )
}

const pattern: Pattern = {
  id: 'keyboard-shortcuts',
  title: '快捷键',
  summary: '快捷键怎么显示、怎么让用户改、撞了怎么办：显示用键帽，修改用录入框，冲突就地提示。',
  Demo,
  use: [
    '高频操作（切工作区、下单、平仓、撤单）要让用户不碰鼠标',
    '菜单、提示、命令面板里要告诉用户「这个操作的键是什么」',
  ],
  avoid: ['一次性或低频的操作：不占键位，走菜单或命令面板', '输入框聚焦时的单字母键：会跟打字冲突，必须带修饰键'],
  parts: [
    { page: 'kbd', role: '键帽显示：每个键一块，整串给读屏' },
    { page: 'shortcut-recorder', role: '录入新键位：按下即录，带修饰键校验和冲突提示' },
    { page: 'command', role: '命令行尾用 CommandShortcut 显示键位' },
    { page: 'tooltip', role: '按钮提示里带上键位' },
  ],
  rules: [
    'Mac 显示 ⌘ ⇧ ⌥ ⌃，其它平台写 Ctrl Shift Alt；同一个键位在存储里只存一种写法（Ctrl+Shift+K）',
    '键帽一键一块（20px 高），整串给读屏读「Ctrl+Shift+K」，不要读成三个字母',
    '录入框点一下开始录，按 Esc 取消，Backspace 清空；录到的值立即生效，不要「保存」按钮',
    '有风险的操作（全部平仓、全部撤单）必须带修饰键，requireModifier 打开，不允许裸字母',
    '冲突就地写「已被「全部撤单」使用」，不自动抢占也不静默覆盖；用户要抢就先去清掉对方',
    '设置页里一行一个动作，左边动作名，右边录入框，底部一个「恢复默认」',
  ],
  source: {
    label: 'Salt · Keyboard shortcuts',
    href: 'https://www.saltdesignsystem.com/salt/patterns/keyboard-shortcuts',
  },
}
export default pattern
