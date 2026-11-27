// SPDX-License-Identifier: MIT
/**
 * Keyboard shortcuts overview: the registered hotkeys grouped by scope, searchable, with conflict marks and optional rebinding.
 * 快捷键总览（#77 G9）：按作用域分组列出注册表里现在的快捷键，可搜索，冲突的行标出来，给了 onComboChange 时每行用 ShortcutRecorder 改键。
 * 照 TradingView 的「Keyboard shortcuts」面板（Ctrl+/，主会话 2026-11-18 实看）：上面一个「Find shortcut」搜索框，下面按类分节，
 * 每行左边动作名、右边按键方块，几种按法之间写「or」。分节跟 TradingView 一样默认收起，点节名展开（#87 第 3 条）；
 * 搜索时命中的节自动展开、没命中的节不出，清空搜索回到用户自己展开过的样子。defaultOpenScopes 给一开始就展开的节。
 * 件只是内容，放进 Dialog、Sheet 还是侧栏由调用方定；文案都由调用方传。
 */
import { ChevronRightIcon } from 'lucide-react'
import { useId, useState } from 'react'
import { cn } from '../lib/cn.ts'
import { Kbd } from '../katana/kbd.tsx'
import { Input } from '../primitives/input.tsx'
import { useHotkeyEntries, type HotkeyRegistry } from './hotkeys.tsx'
import { GLOBAL_SCOPE, comboKeys, partLabelFor } from './hotkeys-model.ts'
import { ShortcutRecorder, type ShortcutRecorderLabels } from './shortcut-recorder.tsx'

export type ShortcutSheetLabels = {
  /** Accessible name of the search box (e.g. "Find shortcut"). */
  search: string
  /** Placeholder of the search box; defaults to the search label. */
  searchPlaceholder?: string
  /** Text when nothing matches. */
  empty: string
  /** Word between alternative combos (e.g. "or"). */
  or: string
  /** Conflict note on a row: names of the other actions on the same combo. */
  conflict: (others: string) => string
  /** Heading of a scope; defaults to the scope id. */
  scope?: (scope: string) => string
  /** Texts of the recorder when rebinding is on. */
  recorder?: ShortcutRecorderLabels
}

export type ShortcutSheetProps = {
  /** Texts written by the caller. */
  labels: ShortcutSheetLabels
  /** Scope order of the sections; scopes not listed follow in first-registered order. */
  scopeOrder?: readonly string[]
  /** Sections open at first; the rest start collapsed (as in TradingView). While searching, every section with a match is open. */
  defaultOpenScopes?: readonly string[]
  /** Registry to read; defaults to the one from HotkeysProvider or the module default. */
  registry?: HotkeyRegistry
  /** Turns each row into a ShortcutRecorder; called with the action id and the new combo (null clears). */
  onComboChange?: (id: string, combo: string | null) => void
  /** Extra class name. */
  className?: string
}

/** 搜索：动作名、作用域名、按键（按平台写出来的字与规范串）里有这几个字就留下。 */
const matches = (query: string, ...texts: string[]) => {
  const q = query.trim().toLowerCase()
  return q === '' || texts.some((text) => text.toLowerCase().includes(q))
}

export function ShortcutSheet({
  labels,
  scopeOrder = [],
  defaultOpenScopes = [],
  registry,
  onComboChange,
  className,
}: ShortcutSheetProps) {
  const { entries, conflicts, platform } = useHotkeyEntries(registry)
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState<ReadonlySet<string>>(() => new Set(defaultOpenScopes))
  const searching = query.trim() !== ''
  const toggle = (scope: string) => {
    const next = new Set(open)
    if (next.has(scope)) next.delete(scope)
    else next.add(scope)
    setOpen(next)
  }
  const searchId = useId()
  const scopeName = labels.scope ?? ((scope: string) => scope)
  const partLabel = partLabelFor(platform)
  const nameOf = new Map(entries.map((entry) => [entry.id, entry.label]))
  const clash = (id: string) =>
    conflicts
      .filter((conflict) => conflict.ids.includes(id))
      .flatMap((conflict) => conflict.ids.filter((other) => other !== id))
  const shown = entries.filter((entry) =>
    matches(
      query,
      entry.label,
      scopeName(entry.scope),
      ...entry.combos,
      ...entry.combos.map((combo) => comboKeys(combo, platform).join('+')),
    ),
  )
  const scopes = [...new Set([...scopeOrder, ...entries.map((entry) => entry.scope)])]
  const groups = scopes
    .map((scope) => ({ scope, items: shown.filter((entry) => entry.scope === scope) }))
    .filter((group) => group.items.length > 0)
  // 改键时的冲突表：同作用域与 global 里别的动作占着的组合。
  const takenFor = (id: string, scope: string) =>
    Object.fromEntries(
      entries
        .filter(
          (entry) =>
            entry.id !== id && (entry.scope === scope || entry.scope === GLOBAL_SCOPE || scope === GLOBAL_SCOPE),
        )
        .flatMap((entry) => entry.combos.map((combo) => [combo, entry.label])),
    )

  return (
    <div className={cn('k-shortcut-sheet', className)} data-slot="shortcut-sheet">
      <label htmlFor={searchId} className="sr-only">
        {labels.search}
      </label>
      <Input
        id={searchId}
        type="search"
        size="sm"
        value={query}
        placeholder={labels.searchPlaceholder ?? labels.search}
        onChange={(event) => setQuery(event.target.value)}
        className="k-shortcut-search"
      />
      {groups.length === 0 && (
        <p className="k-shortcut-empty" role="status">
          {labels.empty}
        </p>
      )}
      {groups.map(({ scope, items }, index) => {
        // 搜索时命中的节都展开（照 TradingView：边打字边看到结果，不用先点开）；不搜时看用户展开过哪几节。
        const expanded = searching || open.has(scope)
        return (
          <section
            key={scope}
            className="k-shortcut-group"
            aria-labelledby={`${searchId}-g${index}`}
            data-scope={scope}
            data-open={expanded ? '' : undefined}
          >
            <h3 className="k-shortcut-heading">
              <button
                type="button"
                id={`${searchId}-g${index}`}
                className="k-shortcut-toggle"
                aria-expanded={expanded}
                aria-controls={`${searchId}-l${index}`}
                disabled={searching}
                onClick={() => toggle(scope)}
              >
                <ChevronRightIcon size={12} aria-hidden="true" />
                {scopeName(scope)}
              </button>
            </h3>
            {expanded && (
              <ul id={`${searchId}-l${index}`} className="k-shortcut-list">
                {items.map((entry) => {
                  const others = clash(entry.id)
                  return (
                    <li
                      key={entry.id}
                      className="k-shortcut-row"
                      data-shortcut={entry.id}
                      data-disabled={entry.enabled ? undefined : ''}
                      data-conflict={others.length ? '' : undefined}
                    >
                      <span className="k-shortcut-name">
                        {entry.label}
                        {others.length > 0 && (
                          <span className="k-shortcut-conflict">
                            {labels.conflict(others.map((other) => nameOf.get(other) ?? other).join(', '))}
                          </span>
                        )}
                      </span>
                      <span className="k-shortcut-keys">
                        {onComboChange && labels.recorder ? (
                          <ShortcutRecorder
                            value={entry.combos[0] ?? null}
                            onValueChange={(next) => onComboChange(entry.id, next)}
                            label={entry.label}
                            labels={labels.recorder}
                            conflicts={takenFor(entry.id, entry.scope)}
                            partLabel={partLabel}
                          />
                        ) : (
                          entry.combos.map((combo, at) => (
                            <span key={combo} className="k-shortcut-combo">
                              {at > 0 && <span className="k-shortcut-or">{labels.or}</span>}
                              <Kbd parts={comboKeys(combo, platform)} label={comboKeys(combo, platform).join('+')} />
                            </span>
                          ))
                        )}
                      </span>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>
        )
      })}
    </div>
  )
}
