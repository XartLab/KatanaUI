// SPDX-License-Identifier: MIT
/**
 * Template library: a searchable, grouped tree of templates on the left and a detail pane on the right.
 * 模板库（#226）：左边可搜索、分组（我的 / 内置）的模板树，右边详情：标题与正文就地编辑（点即编辑，Esc 取消，⌘↵ 保存）、元信息、复制、「使用模板」。
 * 量化里用于策略模板、提示词模板、回测配置模板。交互借自 Jamie Merrill 的「保存模板」「Inline editing」「使用角色详情生成工作范围」
 * （x.com/Jamie_Merrill/status/2110231876329714006、2110955897186824289、2108807436492783675，2026-11-24 逐帧看），只借交互，样子是我们的。
 * 树是 react-aria 的 Tree（treegrid 角色）：↑↓ 走、→ 展开、← 收起、Enter 或点一下选中；搜索只按标题，命中的字高亮，搜索时命中的分支都展开。
 * 标题的就地编辑直接用 InlineEdit；正文是多行，在这里照 InlineEdit 的做法写：点一下变输入框，⌘/Ctrl+Enter 保存、Esc 放弃、点到外面也保存；
 * Enter、Esc、⌘↵ 一律先判输入法组字（isComposing 或 keyCode 229），组字时的回车是选字，不是保存。
 * 保存是调用方的事（onSave 返回 Promise 时，reject 会退回旧值并提示）；内置分组 readOnly，不能改，只能复制或使用。文字全由 labels 给；件里不读时钟。
 */
import { Check, ChevronRight, Copy, CopyPlus, Search } from 'lucide-react'
import { useEffect, useId, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react'
import {
  Button as AriaButton,
  Collection,
  Tree,
  TreeItem,
  TreeItemContent,
  type Selection,
} from 'react-aria-components'
import { cn } from '../lib/cn.ts'
import { Button } from '../primitives/button.tsx'
import { Input } from '../primitives/input.tsx'
import { InlineEdit, type InlineEditLabels } from './inline-edit.tsx'
import {
  expandAllIds,
  filterTemplates,
  findTemplate,
  highlightParts,
  type FilteredGroup,
  type TemplateEntry,
  type TemplateGroup,
} from './template-library-model.ts'

export type { TemplateEntry, TemplateGroup } from './template-library-model.ts'

/** Texts of TemplateLibrary (the package ships no text). */
export type TemplateLibraryLabels = {
  /** Accessible name of the whole library. */
  library: string
  /** Accessible name and placeholder of the search field. */
  search: string
  /** Accessible name of the tree. */
  tree: string
  /** Read out under the search while a query is typed, for example "3 templates match". */
  results: (count: number) => string
  /** Shown in the tree when the query matches nothing. */
  noMatch: string
  /** Shown in the detail pane while nothing is selected. */
  empty: string
  /** Accessible name of the title field (the template's name). */
  titleField: string
  /** Accessible name of the body field. */
  bodyField: string
  /** Message under the title field when it is emptied. */
  titleEmpty: string
  /** Read after the body text, for example "Activate to edit". */
  editHint: string
  /** Texts for the title's inline editor. */
  title: InlineEditLabels
  /** Accessible name of the body editor's save and cancel buttons. */
  save: string
  cancel: string
  /** Message under the body after a save was rejected; the body is back to the last saved text. */
  bodyFailed: string
  /** Meta list heading (accessible name of the list of created by, updated at). */
  meta: string
  /** Copy-text button, and the text it shows for a moment after copying. */
  copy: string
  copied: string
  /** Duplicate button (shown when onDuplicate is given). */
  duplicate: string
  /** The primary button, "Use template". */
  use: string
  /** Shown in place of the body when a read-only template has no text. */
  readOnly: string
}

export type TemplateLibraryProps = {
  /** Groups of templates, for example mine and built-in. */
  groups: readonly TemplateGroup[]
  /** The selected template id (controlled); null for none. */
  value?: string | null
  /** The selected template id at first (uncontrolled). */
  defaultValue?: string | null
  /** Called with the id of the template that was picked in the tree. */
  onValueChange?: (id: string) => void
  /** Persist an edit: the field and the new text (title is trimmed). Return a promise to roll back by rejecting it. */
  onSave?: (id: string, patch: { title: string } | { body: string }) => void | Promise<unknown>
  /** Called with the id when "Use template" is pressed. */
  onUse: (id: string) => void
  /** Called with the id after the text was copied to the clipboard. */
  onCopy?: (id: string) => void
  /** Called with the id to make an editable copy (give it to show the duplicate button). */
  onDuplicate?: (id: string) => void
  /** Texts. */
  labels: TemplateLibraryLabels
  /** Extra class names on the root. */
  className?: string
}

const toKeys = (keys: Selection): string[] => (keys === 'all' ? [] : [...keys].map(String))

function Highlight({ text, query }: { text: string; query: string }) {
  return (
    <>
      {highlightParts(text, query).map((part, index) =>
        part.match ? (
          <mark key={index} className="k-tpl-mark">
            {part.text}
          </mark>
        ) : (
          part.text
        ),
      )}
    </>
  )
}

function renderRow(node: TemplateEntry | FilteredGroup, query: string, isGroup: boolean) {
  const children = isGroup ? (node as FilteredGroup).templates : ((node as TemplateEntry).children ?? [])
  const hasChildren = children.length > 0
  const title = node.title
  return (
    <TreeItem
      id={node.id}
      textValue={title}
      hasChildItems={hasChildren}
      className="k-tpl-item"
      data-group={isGroup || undefined}
    >
      <TreeItemContent>
        {({ isExpanded, level }) => (
          <div
            className="k-tpl-row"
            data-expanded={isExpanded || undefined}
            style={{ '--k-tpl-level': level - 1 } as CSSProperties}
          >
            {hasChildren ? (
              <AriaButton slot="chevron" className="k-tpl-chevron">
                <ChevronRight size={14} aria-hidden />
              </AriaButton>
            ) : (
              <span className="k-tpl-chevron" aria-hidden="true" />
            )}
            <span className="k-tpl-title">
              <Highlight text={title} query={isGroup ? '' : query} />
            </span>
            {!isGroup && (node as TemplateEntry).badge ? (
              <span className="k-tpl-badge">{(node as TemplateEntry).badge}</span>
            ) : null}
          </div>
        )}
      </TreeItemContent>
      <Collection items={children}>{(child) => renderRow(child, query, false)}</Collection>
    </TreeItem>
  )
}

/** The body text: click to edit in place, ⌘/Ctrl+Enter saves, Esc cancels, leaving the field saves. */
function BodyEdit({
  value,
  readOnly,
  label,
  labels,
  onSave,
}: {
  value: string
  readOnly: boolean
  label: string
  labels: TemplateLibraryLabels
  onSave?: (next: string) => void | Promise<unknown>
}) {
  const [shown, setShown] = useState(value)
  const [seen, setSeen] = useState(value)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const [failed, setFailed] = useState(false)
  const field = useRef<HTMLTextAreaElement>(null)
  const display = useRef<HTMLButtonElement>(null)
  const root = useRef<HTMLDivElement>(null)
  const refocus = useRef(false)
  const run = useRef(0)
  const hintId = useId()
  const editable = !readOnly && onSave !== undefined

  // 外面换了值（换了模板、保存后重新给）：没在编辑就直接换上。
  if (value !== seen) {
    setSeen(value)
    if (!editing) {
      setShown(value)
      setFailed(false)
    }
  }

  useEffect(() => {
    if (editing) {
      const input = field.current
      input?.focus({ preventScroll: true })
      input?.setSelectionRange(input.value.length, input.value.length)
    } else if (refocus.current) {
      refocus.current = false
      display.current?.focus({ preventScroll: true })
    }
  }, [editing])

  const start = () => {
    if (!editable || editing) return
    setDraft(shown)
    setFailed(false)
    setEditing(true)
  }
  const commit = (source: 'key' | 'blur') => {
    setEditing(false)
    if (source === 'key') refocus.current = true
    if (draft === shown) return
    const previous = shown
    const mine = ++run.current
    setShown(draft)
    void Promise.resolve()
      .then(() => onSave?.(draft))
      .catch(() => {
        if (mine !== run.current) return
        setShown(previous)
        setFailed(true)
      })
  }
  const cancel = () => {
    setEditing(false)
    refocus.current = true
  }
  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    // 输入法组字时的 Enter、Esc 是选字与取消候选，不是保存与放弃。
    if (event.nativeEvent.isComposing || event.keyCode === 229) return
    if (event.key === 'Escape') {
      event.preventDefault()
      event.stopPropagation()
      cancel()
    } else if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
      event.preventDefault()
      commit('key')
    }
  }

  return (
    <div
      ref={root}
      className="k-tpl-body"
      data-slot="template-body"
      data-editing={editing || undefined}
      onBlur={(event) => {
        if (!editing) return
        const next = event.relatedTarget as Node | null
        if (next && root.current?.contains(next)) return
        if (!next && !document.hasFocus()) return
        commit('blur')
      }}
    >
      {editing ? (
        <>
          <textarea
            ref={field}
            className="k-tpl-textarea"
            aria-label={label}
            value={draft}
            spellCheck={false}
            onChange={(event) => setDraft(event.currentTarget.value)}
            onKeyDown={onKeyDown}
          />
          <span className="k-tpl-body-actions">
            <button
              type="button"
              className="k-tpl-action"
              aria-label={labels.save}
              onPointerDown={(event) => event.preventDefault()}
              onClick={() => commit('key')}
            >
              <Check size={14} aria-hidden />
            </button>
            <button
              type="button"
              className="k-tpl-action"
              aria-label={labels.cancel}
              onPointerDown={(event) => event.preventDefault()}
              onClick={cancel}
            >
              ×
            </button>
          </span>
        </>
      ) : editable ? (
        <button
          ref={display}
          type="button"
          className="k-tpl-body-text"
          aria-label={`${label}: ${shown}`}
          aria-describedby={hintId}
          onClick={start}
        >
          {shown}
        </button>
      ) : (
        <p className="k-tpl-body-text" data-readonly="">
          {shown || labels.readOnly}
        </p>
      )}
      <span id={hintId} className="sr-only">
        {labels.editHint}
      </span>
      {failed ? (
        <p className="k-tpl-failed" role="alert">
          {labels.bodyFailed}
        </p>
      ) : null}
    </div>
  )
}

/** Searchable grouped template tree with a detail pane; see the file comment. */
export function TemplateLibrary({
  groups,
  value,
  defaultValue = null,
  onValueChange,
  onSave,
  onUse,
  onCopy,
  onDuplicate,
  labels,
  className,
}: TemplateLibraryProps) {
  const [query, setQuery] = useState('')
  const [inner, setInner] = useState<string | null>(defaultValue)
  const selected = value === undefined ? inner : value
  const [expanded, setExpanded] = useState<string[]>(() => groups.map((group) => group.id))
  const [copied, setCopied] = useState(false)
  const copyTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  useEffect(() => () => clearTimeout(copyTimer.current), [])

  const searching = query.trim() !== ''
  const { groups: shown, count } = filterTemplates(groups, query)
  const found = findTemplate(groups, selected)
  const groupIds = groups.map((group) => group.id)

  const pick = (keys: Selection) => {
    const id = toKeys(keys)[0]
    if (!id || groupIds.includes(id)) return
    if (value === undefined) setInner(id)
    onValueChange?.(id)
  }
  const copy = async () => {
    if (!found) return
    try {
      await navigator.clipboard.writeText(`${found.template.title}\n\n${found.template.body}`)
    } catch {
      return
    }
    onCopy?.(found.template.id)
    setCopied(true)
    clearTimeout(copyTimer.current)
    copyTimer.current = setTimeout(() => setCopied(false), 1500)
  }
  const onSearchKey = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.nativeEvent.isComposing || event.keyCode === 229) return
    if (event.key === 'Escape' && query) {
      event.preventDefault()
      event.stopPropagation()
      setQuery('')
    }
  }

  return (
    <div className={cn('k-tpl', className)} data-slot="template-library" role="group" aria-label={labels.library}>
      <div className="k-tpl-side">
        <div className="k-tpl-search">
          <Search size={14} aria-hidden className="k-tpl-search-icon" />
          <Input
            type="search"
            aria-label={labels.search}
            placeholder={labels.search}
            autoComplete="off"
            spellCheck={false}
            value={query}
            onChange={(event) => setQuery(event.currentTarget.value)}
            onKeyDown={onSearchKey}
            className="k-tpl-search-input"
          />
        </div>
        <span className="sr-only" role="status">
          {searching ? labels.results(count) : ''}
        </span>
        {shown.length === 0 ? (
          <p className="k-tpl-empty">{labels.noMatch}</p>
        ) : (
          <Tree
            aria-label={labels.tree}
            className="k-tpl-tree"
            items={shown}
            dependencies={[query]}
            selectionMode="single"
            selectionBehavior="toggle"
            disallowEmptySelection
            disabledKeys={groupIds}
            disabledBehavior="selection"
            selectedKeys={selected ? new Set([selected]) : new Set()}
            onSelectionChange={pick}
            expandedKeys={new Set(searching ? expandAllIds(shown) : expanded)}
            onExpandedChange={(keys) => {
              if (!searching) setExpanded(toKeys(keys))
            }}
          >
            {(group) => renderRow(group, query, true)}
          </Tree>
        )}
      </div>
      <div className="k-tpl-detail">
        {found ? (
          <>
            <InlineEdit
              key={`title-${found.template.id}`}
              as="h3"
              className="k-tpl-heading"
              value={found.template.title}
              label={labels.titleField}
              labels={labels.title}
              disabled={found.group.readOnly || !onSave}
              validate={(next) => (next ? null : labels.titleEmpty)}
              onSave={(next) => onSave?.(found.template.id, { title: next })}
            />
            {found.template.meta?.length ? (
              <dl className="k-tpl-meta" aria-label={labels.meta}>
                {found.template.meta.map((item) => (
                  <div key={item.label} className="k-tpl-meta-row">
                    <dt>{item.label}</dt>
                    <dd>{item.value}</dd>
                  </div>
                ))}
              </dl>
            ) : null}
            <BodyEdit
              key={`body-${found.template.id}`}
              value={found.template.body}
              readOnly={Boolean(found.group.readOnly)}
              label={labels.bodyField}
              labels={labels}
              onSave={onSave ? (next) => onSave(found.template.id, { body: next }) : undefined}
            />
            <div className="k-tpl-footer">
              <Button onClick={copy} data-action="copy">
                {copied ? <Check /> : <Copy />}
                <span aria-live="polite">{copied ? labels.copied : labels.copy}</span>
              </Button>
              {onDuplicate ? (
                <Button onClick={() => onDuplicate(found.template.id)} data-action="duplicate">
                  <CopyPlus />
                  {labels.duplicate}
                </Button>
              ) : null}
              <Button variant="primary" onClick={() => onUse(found.template.id)} data-action="use">
                {labels.use}
              </Button>
            </div>
          </>
        ) : (
          <p className="k-tpl-empty">{labels.empty}</p>
        )}
      </div>
    </div>
  )
}
