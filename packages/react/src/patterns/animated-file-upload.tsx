// SPDX-License-Identifier: MIT
// 改自 SmoothUI animated-file-upload（https://github.com/educlopez/smoothui ，MIT，© 2024 Eduardo Calvo）
import { File as FileIcon, Upload, X } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useRef, useState, type ChangeEvent, type DragEvent, type KeyboardEvent } from 'react'
import { cn } from '../lib/cn.ts'
import { focusRing } from '../lib/focus.ts'
import { snappy } from '../lib/motion.ts'
import { unit } from '../lib/spring.ts'
import { Button } from '../primitives/button.tsx'

// 文件上传区：拖进来时区块放大一点、图标上浮，放下后文件行错落滑入，删除时向右滑出、剩下的行补位（原件的分镜）。
// 用来导入回测数据、策略文件。整块是一个按钮（名字与说明由调用方传），隐藏的 input 不进读屏树；超限的文件过滤掉并提示。弹簧换成我们的 snappy。
/** 原件拖入时图标的弹簧（SmoothUI animated-file-upload 的 SPRING_BOUNCY：bounce 0.2 · 0.3s）。 */
const ICON_SPRING = { type: 'spring' as const, bounce: 0.2, duration: 0.3 }

export type FileUploadLabels = {
  /** Accessible name of the whole drop zone. */
  zone: string
  /** Text shown while idle. */
  idle: string
  /** Text shown while a file is dragged over. */
  dragging: string
  /** Name of the list of chosen files. */
  list: string
  /** Name of a remove button. */
  remove: (fileName: string) => string
  /** Message when files were dropped for being too big. */
  tooLarge: (count: number, limit: string) => string
}

export type AnimatedFileUploadProps = {
  /** Called with the whole list of chosen files after each change. */
  onFilesSelected: (files: File[]) => void
  /** All visible and spoken text (required). */
  labels: FileUploadLabels
  /** Comma-separated types for the picker, e.g. ".csv,.parquet". */
  accept?: string
  /** Allow more than one file. */
  multiple?: boolean
  /** Largest allowed file in bytes. */
  maxSize?: number
  /** Ignore clicks and drops. */
  disabled?: boolean
  /** Extra classes for the root element. */
  className?: string
}

/** 字节数写成 B / KB / MB（单位不是文案）。 */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function AnimatedFileUpload({
  onFilesSelected,
  labels,
  accept,
  multiple = true,
  maxSize,
  disabled = false,
  className,
}: AnimatedFileUploadProps) {
  const input = useRef<HTMLInputElement>(null)
  const depth = useRef(0)
  const [over, setOver] = useState(false)
  const [files, setFiles] = useState<File[]>([])
  const [error, setError] = useState<string | null>(null)

  const take = (incoming: File[]) => {
    setError(null)
    let valid = incoming
    if (maxSize) {
      const big = incoming.filter((f) => f.size > maxSize)
      if (big.length) {
        setError(labels.tooLarge(big.length, formatBytes(maxSize)))
        valid = incoming.filter((f) => f.size <= maxSize)
      }
    }
    if (!valid.length) return
    const next = multiple ? [...files, ...valid] : valid.slice(0, 1)
    setFiles(next)
    onFilesSelected(next)
  }
  const remove = (index: number) => {
    const next = files.filter((_, i) => i !== index)
    setFiles(next)
    onFilesSelected(next)
  }
  const open = () => {
    if (!disabled) input.current?.click()
  }
  const onKeyDown = (event: KeyboardEvent) => {
    if ((event.key === 'Enter' || event.key === ' ') && !disabled) {
      event.preventDefault()
      open()
    }
  }
  const onDrop = (event: DragEvent) => {
    event.preventDefault()
    depth.current = 0
    setOver(false)
    if (!disabled) take(Array.from(event.dataTransfer.files))
  }
  const onChange = (event: ChangeEvent<HTMLInputElement>) => {
    take(event.target.files ? Array.from(event.target.files) : [])
    event.target.value = ''
  }

  return (
    <div data-slot="file-upload" className={cn('flex w-full flex-col gap-3', className)}>
      <input
        ref={input}
        type="file"
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        onChange={onChange}
        aria-hidden="true"
        tabIndex={-1}
        className="sr-only"
      />
      <motion.div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label={labels.zone}
        aria-disabled={disabled || undefined}
        data-dragging={over ? '' : undefined}
        animate={{ scale: over ? 1.02 : 1 }}
        transition={unit(snappy)}
        onClick={open}
        onKeyDown={onKeyDown}
        onDragEnter={(event) => {
          event.preventDefault()
          if (disabled) return
          depth.current += 1
          setOver(true)
        }}
        onDragLeave={(event) => {
          event.preventDefault()
          depth.current -= 1
          if (depth.current <= 0) setOver(false)
        }}
        onDragOver={(event) => event.preventDefault()}
        onDrop={onDrop}
        className={cn(
          'relative flex cursor-pointer flex-col items-center justify-center gap-1 rounded-[var(--radius-overlay)] border border-dashed px-6 py-8 transition-colors duration-150',
          over ? 'border-(--accent) bg-alpha-white-3' : 'border-line-strong hover:border-ink-4 hover:bg-alpha-white-2',
          disabled && 'pointer-events-none opacity-45',
          focusRing,
        )}
      >
        <motion.div
          animate={over ? { scale: 1.15, y: -4 } : { scale: 1, y: 0 }}
          transition={ICON_SPRING}
          className={cn('mb-1', over ? 'text-ink' : 'text-ink-3')}
        >
          <Upload size={28} strokeWidth={1.5} aria-hidden="true" />
        </motion.div>
        <AnimatePresence initial={false} mode="wait">
          <motion.p
            key={over ? 'drop' : 'idle'}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="k-text-data m-0 text-ink"
          >
            {over ? labels.dragging : labels.idle}
          </motion.p>
        </AnimatePresence>
        <p className="k-text-caption m-0 text-ink-3 tabular-nums">
          {accept ? accept.replaceAll(',', ', ') : null}
          {accept && maxSize ? ' · ' : null}
          {maxSize ? formatBytes(maxSize) : null}
        </p>
      </motion.div>
      <AnimatePresence>
        {error ? (
          <motion.p
            role="alert"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={snappy}
            className="k-text-caption m-0 text-danger"
          >
            {error}
          </motion.p>
        ) : null}
      </AnimatePresence>
      {files.length ? (
        <ul aria-label={labels.list} className="m-0 flex list-none flex-col gap-1.5 p-0">
          <AnimatePresence initial={false}>
            {files.map((file, index) => (
              <motion.li
                key={`${file.name}-${file.size}-${file.lastModified}`}
                layout
                initial={{ opacity: 0, scale: 0.95, x: -16 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95, x: 24, transition: { duration: 0.15 } }}
                transition={snappy}
                className="flex items-center gap-3 rounded-[var(--radius-control)] border border-alpha-white-6 bg-surface-2 px-3 py-2"
              >
                <FileIcon size={14} aria-hidden="true" className="shrink-0 text-ink-3" />
                <div className="min-w-0 flex-1">
                  <p className="k-text-data m-0 truncate text-ink">{file.name}</p>
                  <p className="k-text-caption m-0 text-ink-3 tabular-nums">{formatBytes(file.size)}</p>
                </div>
                <Button size="icon" variant="icon" aria-label={labels.remove(file.name)} onClick={() => remove(index)}>
                  <X />
                </Button>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      ) : null}
    </div>
  )
}
