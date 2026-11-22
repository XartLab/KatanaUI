// SPDX-License-Identifier: MIT
// 快捷键注册表、快捷键总览、命令面板「最近」（#77 G9）的演示。
// 照 TradingView：Ctrl/Cmd+/ 开快捷键面板（按类分节、可搜索、几种按法写 or），Ctrl/Cmd+K 快速搜索带「最近」（主会话 2026-11-18 实看）。
import { useState } from 'react'
import {
  Button,
  CommandPalette,
  Dialog,
  DialogBody,
  DialogContent,
  DialogHeader,
  DialogTitle,
  HotkeysProvider,
  Input,
  Kbd,
  ShortcutSheet,
  Switch,
  comboKeys,
  createHotkeyRegistry,
  normalizeCombo,
  useHotkeys,
  type CommandPaletteLabels,
  type HotkeyBinding,
  type HotkeyRegistry,
  type PaletteCommand,
  type ShortcutSheetLabels,
} from '../../src/index.ts'
import { Row } from './parts.tsx'

export const SHEET_LABELS: ShortcutSheetLabels = {
  search: '查找快捷键',
  empty: '没有匹配的快捷键',
  or: '或',
  conflict: (others) => `与「${others}」冲突`,
  scope: (scope) => ({ global: '通用', chart: '图表', watchlist: '自选表' })[scope] ?? scope,
  recorder: {
    empty: '未设置',
    recording: '按下新的快捷键',
    clear: '清除快捷键',
    conflict: (action) => `已被「${action}」使用`,
    needModifier: '要带修饰键',
  },
}

export const PALETTE_LABELS: CommandPaletteLabels = {
  title: '命令面板',
  description: '搜索命令并执行',
  placeholder: '搜索命令…',
  empty: '没有匹配的命令',
  recent: '最近',
}

/** 演示用的默认键位（动作 id → 组合串）。 */
const DEFAULT_KEYS: Readonly<Record<string, string | readonly string[] | null>> = {
  palette: 'Mod+Shift+P',
  sheet: 'Mod+/',
  'chart-reset': 'Alt+R',
  'chart-snapshot': 'Mod+Alt+S',
  'chart-alert': 'Alt+A',
  'watch-next': ['ArrowDown', 'Space'],
  'watch-prev': ['ArrowUp', 'Shift+Space'],
  'watch-flag': 'Alt+Enter',
  // 故意跟 chart-alert 撞：总览表标出冲突。
  'chart-drawing': 'Alt+A',
}
const NAMES: Readonly<Record<string, [string, string]>> = {
  palette: ['global', '打开命令面板'],
  sheet: ['global', '快捷键总览'],
  'chart-reset': ['chart', '重置图表'],
  'chart-snapshot': ['chart', '截图'],
  'chart-alert': ['chart', '新建告警'],
  'chart-drawing': ['chart', '画线工具'],
  'watch-next': ['watchlist', '下一个品种'],
  'watch-prev': ['watchlist', '上一个品种'],
  'watch-flag': ['watchlist', '插旗 / 拔旗'],
}

function useDemoKeys() {
  const [keys, setKeys] = useState(DEFAULT_KEYS)
  const [log, setLog] = useState('')
  const [watchlistOn, setWatchlistOn] = useState(true)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const bindings: HotkeyBinding[] = Object.entries(NAMES).flatMap(([id, [scope, label]]) => {
    const combo = keys[id]
    if (!combo) return []
    return [
      {
        id,
        combo,
        label,
        scope,
        enabled: scope !== 'watchlist' || watchlistOn,
        allowInInput: id === 'palette' || id === 'sheet',
        handler: () => {
          if (id === 'palette') setPaletteOpen(true)
          else if (id === 'sheet') setSheetOpen(true)
          else setLog(label)
        },
      },
    ]
  })
  useHotkeys(bindings)
  return {
    keys,
    setKey: (id: string, combo: string | null) => setKeys({ ...keys, [id]: combo }),
    log,
    setLog,
    watchlistOn,
    setWatchlistOn,
    sheetOpen,
    setSheetOpen,
    paletteOpen,
    setPaletteOpen,
  }
}

/** 每个演示一个自己的注册表：在文档站里切页时不跟别的页混。 */
function useOwnRegistry(): HotkeyRegistry {
  const [registry] = useState(() => createHotkeyRegistry())
  return registry
}

function Keys({ registry, combo }: { registry: HotkeyRegistry; combo: string }) {
  const parts = comboKeys(normalizeCombo(combo, registry.platform), registry.platform)
  return <Kbd parts={parts} label={parts.join('+')} />
}

function commandsFor(registry: HotkeyRegistry, setLog: (text: string) => void): PaletteCommand[] {
  const shortcut = (combo: string) => <Keys registry={registry} combo={combo} />
  return [
    { id: 'reset', label: '重置图表', group: '图表', shortcut: shortcut('Alt+R'), onSelect: () => setLog('重置图表') },
    { id: 'snapshot', label: '截图', group: '图表', shortcut: shortcut('Mod+Alt+S'), onSelect: () => setLog('截图') },
    { id: 'alert', label: '新建告警', group: '图表', keywords: ['alert'], onSelect: () => setLog('新建告警') },
    { id: 'theme', label: '切换主题', group: '设置', keywords: ['theme', 'dark'], onSelect: () => setLog('切换主题') },
    { id: 'density', label: '紧凑行高', group: '设置', onSelect: () => setLog('紧凑行高') },
    { id: 'export', label: '导出 CSV', group: '数据', keywords: ['csv'], onSelect: () => setLog('导出 CSV') },
  ]
}

function Workbench({ registry }: { registry: HotkeyRegistry }) {
  const demo = useDemoKeys()
  return (
    <>
      <Row name="作用域">
        <Switch
          checked={demo.watchlistOn}
          onCheckedChange={demo.setWatchlistOn}
          aria-label="自选表作用域"
          data-testid="scope-watchlist"
        />
        <span className="gal-note" style={{ margin: 0 }}>
          自选表作用域（关掉后它的快捷键不触发，总览里灰着）
        </span>
      </Row>
      <Row name="打开">
        <Button size="sm" onClick={() => demo.setSheetOpen(true)}>
          快捷键总览 <Keys registry={registry} combo="Mod+/" />
        </Button>
        <Button size="sm" onClick={() => demo.setPaletteOpen(true)}>
          命令面板 <Keys registry={registry} combo="Mod+Shift+P" />
        </Button>
      </Row>
      <p className="gal-note" data-testid="hotkey-log">
        {demo.log ? `最近触发：${demo.log}` : '最近触发：无'}
      </p>
      <Dialog open={demo.sheetOpen} onOpenChange={demo.setSheetOpen}>
        <DialogContent closeLabel="关闭" style={{ width: 460 }}>
          <DialogHeader>
            <DialogTitle>键盘快捷键</DialogTitle>
          </DialogHeader>
          <DialogBody style={{ maxHeight: 420, overflowY: 'auto' }}>
            <ShortcutSheet labels={SHEET_LABELS} scopeOrder={['global', 'chart', 'watchlist']} />
          </DialogBody>
        </DialogContent>
      </Dialog>
      <CommandPalette
        open={demo.paletteOpen}
        onOpenChange={demo.setPaletteOpen}
        commands={commandsFor(registry, demo.setLog)}
        labels={PALETTE_LABELS}
        recentKey="katana-ui-gallery:command-recent"
      />
    </>
  )
}

/** hotkeys 页：组件里声明快捷键，Mod+/ 开总览，Mod+Shift+P 开命令面板；可关掉一个作用域。 */
export function HotkeysDemo() {
  const registry = useOwnRegistry()
  return (
    <HotkeysProvider registry={registry}>
      <p className="gal-note">
        演示：页上登记了通用、图表、自选表三组快捷键（Alt+A 故意登记两次，总览里标冲突）。按 Mod+/（Mac 是 ⌘/，别处
        Ctrl+/）开总览，Mod+Shift+P 开命令面板（文档站目录的搜索占着 Mod+K（连带 Mod+Shift+K），演示让开；应用里照
        TradingView 用 Mod+K）；Alt+R 触发「重置图表」。焦点在输入框里时普通快捷键不触发。
      </p>
      <Workbench registry={registry} />
      <Row name="输入框">
        <Input aria-label="试着在这里按 Alt+R" placeholder="在这里按 Alt+R 不触发" style={{ width: 220 }} />
      </Row>
    </HotkeysProvider>
  )
}

/** shortcut-sheet 页：总览表直接摊在页上，可改键（用 ShortcutRecorder）。 */
export function ShortcutSheetDemo() {
  const registry = useOwnRegistry()
  return (
    <HotkeysProvider registry={registry}>
      <SheetInline />
    </HotkeysProvider>
  )
}

function SheetInline() {
  const demo = useDemoKeys()
  const [editing, setEditing] = useState(false)
  return (
    <>
      <Row name="改键">
        <Switch checked={editing} onCheckedChange={setEditing} aria-label="改键" />
      </Row>
      <div data-testid="sheet-inline" style={{ width: 440 }}>
        <ShortcutSheet
          labels={SHEET_LABELS}
          scopeOrder={['global', 'chart', 'watchlist']}
          onComboChange={editing ? demo.setKey : undefined}
        />
      </div>
    </>
  )
}

/** command-palette 页：按钮或 Mod+Shift+P 打开（文档站的搜索占着 Mod+K），选过的命令进「最近」（存在 localStorage）。 */
export function CommandPaletteDemo() {
  const registry = useOwnRegistry()
  return (
    <HotkeysProvider registry={registry}>
      <PaletteOnly registry={registry} />
    </HotkeysProvider>
  )
}

function PaletteOnly({ registry }: { registry: HotkeyRegistry }) {
  const [open, setOpen] = useState(false)
  const [log, setLog] = useState('')
  useHotkeys([
    { id: 'palette', combo: 'Mod+Shift+P', label: '打开命令面板', allowInInput: true, handler: () => setOpen(true) },
  ])
  return (
    <>
      <Row name="打开">
        <Button size="sm" onClick={() => setOpen(true)}>
          命令面板 <Keys registry={registry} combo="Mod+Shift+P" />
        </Button>
      </Row>
      <p className="gal-note" data-testid="palette-log">
        {log ? `执行了：${log}` : '执行了：无'}；选过的命令下次打开排在「最近」（最多 5 条，存在 localStorage）。
      </p>
      <CommandPalette
        open={open}
        onOpenChange={setOpen}
        commands={commandsFor(registry, setLog)}
        labels={PALETTE_LABELS}
        recentKey="katana-ui-gallery:command-recent"
      />
    </>
  )
}
