// SPDX-License-Identifier: MIT
/**
 * Import research material: a source switch (upload, paste, link) and a list of files with progress, status, retry and remove.
 * 资料导入（#226）：顶部「上传 / 粘贴 / 链接」三个来源页签，下面是多文件清单，每行类型图标、名字、大小、上传进度、完成或失败，失败行有「重试 / 移除」。
 * 研究资料用：研报 PDF、因子 CSV、回测结果 parquet。交互借自 Jamie Merrill 的「文档上传」与「Document card actions」
 * （x.com/Jamie_Merrill/status/2109202814350291096、2110082995998937591，2026-11-24 逐帧看：三个来源页签、行内百分比与完成、失败行出现重试与删除），只借交互，样子是我们的。
 * 上传本身由调用方做：件只显示 items 给的状态（排队、上传中带百分比、完成、失败带原因），选了文件、粘了文字、给了链接都只是回调（onFiles、onPaste、onLink），
 * 重试与移除也只回调 id（onRetry、onRemove）；件里没有网络、没有定时器、不读时钟。
 * 上传区是现有的 AnimatedFileUpload（list={false}，列表由本件画）：拖进来的放大、图标上浮、超限提示都沿用，没有另起一份落点。
 * 文字全由 labels 给，包里没有语言；颜色走语义 token，状态的语气走 lib/severity（theme/file-import.css）。
 */
import {
  Check,
  CircleAlert,
  ClipboardPaste,
  Database,
  File as FileIcon,
  FileSpreadsheet,
  FileText,
  Link as LinkIcon,
  RotateCcw,
  Trash2,
  Upload,
} from 'lucide-react'
import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'
import { cn } from '../lib/cn.ts'
import { statusColor } from '../lib/severity.ts'
import { Button } from '../primitives/button.tsx'
import { Input } from '../primitives/input.tsx'
import { Progress } from '../primitives/progress.tsx'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../primitives/tabs.tsx'
import { Textarea } from '../primitives/textarea.tsx'
import { AnimatedFileUpload, formatBytes, type FileUploadLabels } from './animated-file-upload.tsx'
import {
  clampPercent,
  fileKind,
  parseLink,
  toneOfStatus,
  type FileKind,
  type ImportItem,
  type ImportStatus,
} from './file-import-model.ts'

export type { ImportItem, ImportStatus } from './file-import-model.ts'

/** The three ways to bring material in. */
export type ImportSource = 'upload' | 'paste' | 'link'

/** Texts of FileImport (the package ships no text). */
export type FileImportLabels = {
  /** Accessible name of the source tabs. */
  sources: string
  /** Tab text of each source. */
  source: Readonly<Record<ImportSource, string>>
  /** Drop zone texts (zone, idle, dragging, tooLarge). */
  upload: Pick<FileUploadLabels, 'zone' | 'idle' | 'dragging' | 'tooLarge'>
  /** Name of the list of material. */
  list: string
  /** Heading over the list, for example "3 documents added" (put the plural rule in the function). */
  count: (total: number) => string
  /** Status text of a row; uploading gets the percent, or null while the caller does not know it. */
  status: {
    queued: string
    uploading: (percent: number | null) => string
    done: string
    failed: string
  }
  /** Accessible name of a row's retry button. */
  retry: (name: string) => string
  /** Accessible name of a row's remove button. */
  remove: (name: string) => string
  /** The paste tab. */
  paste: { label: string; placeholder: string; submit: string }
  /** The link tab; invalid is the message under the field for a text that is not an http(s) link. */
  link: { label: string; placeholder: string; submit: string; invalid: string }
}

export type FileImportProps = {
  /** The list as the caller tracks it: one row per file, link or pasted text. */
  items: readonly ImportItem[]
  /** Called with the files just picked or dropped (after the size check); the caller starts the uploads and adds the rows. */
  onFiles: (files: File[]) => void
  /** Called with the row id when the retry button of a failed row is pressed. */
  onRetry: (id: string) => void
  /** Called with the row id when its remove button is pressed (it also cancels an upload in progress). */
  onRemove: (id: string) => void
  /** Called with the pasted text (trimmed); give it to show the paste tab. */
  onPaste?: (text: string) => void
  /** Called with a valid http(s) link; give it to show the link tab. */
  onLink?: (url: string) => void
  /** Texts. */
  labels: FileImportLabels
  /** Comma-separated types for the picker, for example ".pdf,.csv,.parquet". */
  accept?: string
  /** Largest allowed file in bytes. */
  maxSize?: number
  /** Ignore all input. */
  disabled?: boolean
  /** Extra class names on the root. */
  className?: string
}

const KIND_ICON: Record<FileKind, typeof FileIcon> = {
  pdf: FileText,
  sheet: FileSpreadsheet,
  data: Database,
  text: FileText,
  link: LinkIcon,
  other: FileIcon,
}

const SOURCE_ICON = { upload: Upload, paste: ClipboardPaste, link: LinkIcon } as const

function statusText(item: ImportItem, labels: FileImportLabels): string {
  const { status } = labels
  switch (item.status) {
    case 'queued':
      return status.queued
    case 'uploading':
      return status.uploading(item.progress === undefined ? null : clampPercent(item.progress))
    case 'done':
      return status.done
    case 'failed':
      return status.failed
  }
}

function Row({
  item,
  labels,
  disabled,
  onRetry,
  onRemove,
}: {
  item: ImportItem
  labels: FileImportLabels
  disabled?: boolean
  onRetry: (id: string) => void
  onRemove: (id: string) => void
}) {
  const Icon = KIND_ICON[fileKind(item.name)]
  const tone = toneOfStatus(item.status)
  const status: ImportStatus = item.status
  return (
    <li
      className="k-imp-row"
      data-slot="import-row"
      data-item-id={item.id}
      data-status={status}
      data-kind={fileKind(item.name)}
    >
      <span className="k-imp-icon" aria-hidden="true">
        <Icon size={16} />
      </span>
      <span className="k-imp-main">
        <span className="k-imp-line">
          <span className="k-imp-name" title={item.name}>
            {item.name}
          </span>
          {item.size !== undefined ? <span className="k-imp-size">{formatBytes(item.size)}</span> : null}
        </span>
        {status === 'failed' && item.error ? (
          <span className="k-imp-error" role="alert">
            {item.error}
          </span>
        ) : null}
      </span>
      <span className="k-imp-status" data-slot="import-status" style={{ color: statusColor(tone) }}>
        {statusText(item, labels)}
        {status === 'done' ? <Check size={14} aria-hidden="true" /> : null}
        {status === 'failed' ? <CircleAlert size={14} aria-hidden="true" /> : null}
      </span>
      <span className="k-imp-actions">
        {status === 'failed' ? (
          <Button
            size="icon"
            variant="icon"
            disabled={disabled}
            aria-label={labels.retry(item.name)}
            title={labels.retry(item.name)}
            data-action="retry"
            onClick={() => onRetry(item.id)}
          >
            <RotateCcw />
          </Button>
        ) : null}
        <Button
          size="icon"
          variant="icon"
          disabled={disabled}
          aria-label={labels.remove(item.name)}
          title={labels.remove(item.name)}
          data-action="remove"
          onClick={() => onRemove(item.id)}
        >
          <Trash2 />
        </Button>
      </span>
      {status === 'uploading' ? (
        <Progress
          className="k-imp-progress"
          aria-label={item.name}
          value={item.progress === undefined ? null : clampPercent(item.progress)}
        />
      ) : null}
    </li>
  )
}

/** Source tabs (upload, paste, link) over a list of material with progress, status, retry and remove; see the file comment. */
export function FileImport({
  items,
  onFiles,
  onRetry,
  onRemove,
  onPaste,
  onLink,
  labels,
  accept,
  maxSize,
  disabled = false,
  className,
}: FileImportProps) {
  const ids = useId()
  const sources: ImportSource[] = [
    'upload',
    ...(onPaste ? (['paste'] as const) : []),
    ...(onLink ? (['link'] as const) : []),
  ]
  const [source, setSource] = useState<ImportSource>('upload')
  const [text, setText] = useState('')
  const [url, setUrl] = useState('')
  const [linkError, setLinkError] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  // 移除之后焦点接给相邻的一行：先记下邻居，行真的消失（调用方改了 items）后再去聚焦。
  const handoff = useRef<{ removed: string; neighbor: string | null } | null>(null)

  useEffect(() => {
    const pending = handoff.current
    if (!pending || items.some((item) => item.id === pending.removed)) return
    handoff.current = null
    const scope = root.current
    const next = pending.neighbor
      ? scope?.querySelector<HTMLElement>(`[data-item-id="${CSS.escape(pending.neighbor)}"] [data-action="remove"]`)
      : scope?.querySelector<HTMLElement>('[data-slot="file-upload"] [role="button"]')
    next?.focus()
  }, [items])

  const remove = (id: string) => {
    const index = items.findIndex((item) => item.id === id)
    const neighbor = items[index + 1]?.id ?? items[index - 1]?.id ?? null
    handoff.current = { removed: id, neighbor }
    onRemove(id)
  }

  const submitPaste = () => {
    const value = text.trim()
    if (!value || !onPaste) return
    onPaste(value)
    setText('')
  }
  const submitLink = () => {
    if (!onLink) return
    const value = parseLink(url)
    if (value === null) {
      setLinkError(true)
      return
    }
    onLink(value)
    setUrl('')
    setLinkError(false)
  }
  // 输入法组字时的 Enter 是选字，不是提交；组字时 keyCode 是 229。
  const onPasteKey = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.nativeEvent.isComposing || event.keyCode === 229) return
    if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
      event.preventDefault()
      submitPaste()
    }
  }
  const onLinkKey = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.nativeEvent.isComposing || event.keyCode === 229) return
    if (event.key === 'Enter') {
      event.preventDefault()
      submitLink()
    }
  }

  const upload = (
    <AnimatedFileUpload
      list={false}
      multiple
      accept={accept}
      maxSize={maxSize}
      disabled={disabled}
      onFilesAdded={onFiles}
      labels={{ ...labels.upload, list: labels.list, remove: labels.remove }}
    />
  )
  const countId = `${ids}-count`

  return (
    <div ref={root} className={cn('k-imp', className)} data-slot="file-import">
      {sources.length > 1 ? (
        <Tabs value={source} onValueChange={(next) => setSource(next as ImportSource)}>
          <TabsList aria-label={labels.sources}>
            {sources.map((id) => {
              const Icon = SOURCE_ICON[id]
              return (
                <TabsTrigger key={id} value={id} disabled={disabled}>
                  <Icon size={14} aria-hidden="true" />
                  {labels.source[id]}
                </TabsTrigger>
              )
            })}
          </TabsList>
          <TabsContent value="upload">{upload}</TabsContent>
          {onPaste ? (
            <TabsContent value="paste" className="k-imp-pane">
              <Textarea
                rows={5}
                aria-label={labels.paste.label}
                placeholder={labels.paste.placeholder}
                value={text}
                disabled={disabled}
                onChange={(event) => setText(event.currentTarget.value)}
                onKeyDown={onPasteKey}
              />
              <Button variant="primary" disabled={disabled || !text.trim()} onClick={submitPaste}>
                {labels.paste.submit}
              </Button>
            </TabsContent>
          ) : null}
          {onLink ? (
            <TabsContent value="link" className="k-imp-pane">
              <span className="k-imp-link">
                <Input
                  type="text"
                  inputMode="url"
                  autoComplete="off"
                  spellCheck={false}
                  aria-label={labels.link.label}
                  placeholder={labels.link.placeholder}
                  aria-invalid={linkError || undefined}
                  aria-describedby={linkError ? `${ids}-link-error` : undefined}
                  value={url}
                  disabled={disabled}
                  onChange={(event) => {
                    setUrl(event.currentTarget.value)
                    setLinkError(false)
                  }}
                  onKeyDown={onLinkKey}
                />
                <Button variant="primary" disabled={disabled || !url.trim()} onClick={submitLink}>
                  {labels.link.submit}
                </Button>
              </span>
              {linkError ? (
                <p id={`${ids}-link-error`} className="k-imp-error" role="alert">
                  {labels.link.invalid}
                </p>
              ) : null}
            </TabsContent>
          ) : null}
        </Tabs>
      ) : (
        upload
      )}
      {items.length > 0 ? (
        <section className="k-imp-list" aria-labelledby={countId}>
          <p id={countId} className="k-imp-count">
            {labels.count(items.length)}
          </p>
          <ul aria-label={labels.list} className="k-imp-rows">
            {items.map((item) => (
              <Row key={item.id} item={item} labels={labels} disabled={disabled} onRetry={onRetry} onRemove={remove} />
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  )
}
