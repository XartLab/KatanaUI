// SPDX-License-Identifier: MIT
import { useState } from 'react'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
  Input,
} from '../../src/index'
import type { Pattern } from './types'

// 演示数据：命令和品种是编的。
const COMMANDS = [
  { value: 'open-lab', label: '打开 研究台', keys: '⌘2' },
  { value: 'new-ws', label: '新建工作区', keys: '⌘T' },
  { value: 'flatten', label: '全部平仓…', keys: '⇧⌘F' },
]
const SYMBOLS = ['示例阿尔法', '示例贝塔', '示例伽马', '示例德尔塔']

function Demo() {
  const [q, setQ] = useState('')
  const rows = SYMBOLS.filter((s) => s.includes(q.trim()))
  return (
    <div
      className="gal-stack"
      style={{
        width: '100%',
        maxWidth: 720,
        display: 'grid',
        gap: 16,
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
      }}
    >
      <section aria-label="全局搜索">
        <p className="gal-note">全局：⌘K 打开，跨页面、命令、品种（演示数据）</p>
        <div style={{ height: 220, border: '1px solid var(--border-100, #333)', borderRadius: 8 }}>
          <Command label="命令面板">
            <CommandInput placeholder="搜命令、品种、页面" />
            <CommandList aria-label="结果">
              <CommandEmpty>没有匹配项</CommandEmpty>
              <CommandGroup heading="命令">
                {COMMANDS.map((c) => (
                  <CommandItem key={c.value} value={c.value}>
                    {c.label}
                    <CommandShortcut>{c.keys}</CommandShortcut>
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandGroup heading="品种">
                {SYMBOLS.map((s) => (
                  <CommandItem key={s} value={s}>
                    {s}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </div>
      </section>
      <section aria-label="列表内过滤">
        <p className="gal-note">列表内：输入框就在列表上方，只过滤这一张表</p>
        <Input aria-label="过滤品种" placeholder="过滤品种" value={q} onChange={(e) => setQ(e.target.value)} />
        <ul className="gal-list" aria-live="polite">
          {rows.length ? rows.map((s) => <li key={s}>{s}</li>) : <li>没有匹配项</li>}
        </ul>
      </section>
    </div>
  )
}

const pattern: Pattern = {
  id: 'search',
  title: '搜索',
  summary: '两种搜索各管一摊：⌘K 命令面板跳到任何地方、执行任何命令；列表内过滤只缩小眼前这一张表。',
  Demo,
  use: [
    '全局：目标不确定、分散在几个页面（找品种、找命令、跳页面）：⌘K 命令面板',
    '列表内：已经站在列表里，只想少看几行：列表上方一个过滤框',
  ],
  avoid: [
    '要按数值范围、多条件圈行：用过滤条（见「列表筛选」），不是搜索框',
    '只有 5 个以内的选项：直接用下拉或标签页，不必搜',
  ],
  parts: [
    { page: 'command', role: '⌘K 面板：输入框 + 分组结果 + 快捷键提示' },
    { page: 'input', role: '列表内过滤框' },
    { page: 'combobox', role: '表单里「搜了再选」的单个字段' },
    { page: 'kbd', role: '在入口旁提示「⌘K」' },
  ],
  rules: [
    '⌘K（Windows 是 Ctrl+K）全局唯一入口；再按一次或 Esc 关闭，焦点回到打开前的位置',
    '结果按「命令 / 品种 / 页面」分组，组名小号淡色，每组最多 5 条，超出写「更多 N 条」',
    '输入即搜，不要「搜索」按钮；防抖 ≤ 150ms，本地数据不需要防抖',
    '没有结果写「没有匹配项」，不是空白；方向键移动、Enter 执行、行尾放快捷键提示',
    '列表内过滤框放在列表正上方，宽度跟列表一样，占位写「过滤 + 对象名」',
    '过滤后命中数写在列表头（「3 / 40」），清空输入恢复全部，不记忆上次的输入',
  ],
  source: { label: 'Salt · Search', href: 'https://www.saltdesignsystem.com/salt/patterns/search' },
}
export default pattern
