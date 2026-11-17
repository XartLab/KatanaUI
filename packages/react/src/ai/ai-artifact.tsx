// SPDX-License-Identifier: MIT
// 改自 SmoothUI ai-artifact（https://github.com/educlopez/smoothui ，MIT，© 2024 Eduardo Calvo）
// 模型产出的东西的框：标题、预览 / 代码两个视图、复制。两个视图沿同一条水平轴走——预览永远在代码左边——所以切换有方向、切过一次就有记忆；
// 交叉淡入会让人不知道另一个视图去了哪、会从哪回来。选中指示块是一个共享的 layoutId 元素在两个页签间滑，而不是两个页签各自换色。
// 相对原件：预览 / 代码 / 复制等词改成 labels；页签补上方向键与 tabpanel 关联（原件只有 role=tab）；颜色走 token；弹簧取 snappy；去掉 reduced-motion 分支。
import { Check, Copy } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useId, useState, type KeyboardEvent, type ReactNode } from 'react'
import { Button } from '../primitives/button.tsx'
import { cn } from '../lib/cn.ts'
import { focusRing } from '../lib/focus.ts'
import { snappy } from '../lib/motion.ts'
import { unit } from '../lib/spring.ts'

/** 切换时内容横向挪的距离（原件 TRAVEL_PX）。 */
const TRAVEL_PX = 24
const COPIED_RESET_MS = 1600

export type AiArtifactPane = 'preview' | 'code'
const PANES: readonly AiArtifactPane[] = ['preview', 'code']

export type AiArtifactLabels = {
  preview: string
  code: string
  /** 页签组的读屏名。 */
  views: string
  /** 复制钮；给了 copyText 才画。 */
  copy?: string
  copied?: string
}

export type AiArtifactProps = {
  /** Name of the artifact, so it can be referred to in conversation. */
  title: string
  /** Texts in the UI language (required). */
  labels: AiArtifactLabels
  /** The rendered form. */
  preview?: ReactNode
  /** The raw form (source, JSON, markup), shown in a monospace block. */
  code?: ReactNode
  /** Which pane to start on. */
  defaultPane?: AiArtifactPane
  /** Plain text for the clipboard; the copy button needs this and `labels.copy`. */
  copyText?: string
  /** Extra class name on the root. */
  className?: string
}

export function AiArtifact({
  title,
  labels,
  preview,
  code,
  defaultPane = 'preview',
  copyText,
  className,
}: AiArtifactProps) {
  const id = useId()
  const available = PANES.filter((pane) => (pane === 'preview' ? Boolean(preview) : Boolean(code)))
  const [pane, setPane] = useState<AiArtifactPane>(defaultPane)
  const [copied, setCopied] = useState(false)
  const direction = pane === 'code' ? 1 : -1

  useEffect(() => {
    if (!copied) return
    const timer = setTimeout(() => setCopied(false), COPIED_RESET_MS)
    return () => clearTimeout(timer)
  }, [copied])

  const copy = async () => {
    if (!copyText) return
    try {
      await navigator.clipboard.writeText(copyText)
      setCopied(true)
    } catch {
      // 剪贴板被挡不值得一个出错态。
    }
  }
  const tabKeys = (event: KeyboardEvent) => {
    if (available.length < 2) return
    const at = available.indexOf(pane)
    const step = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0
    if (!step) return
    event.preventDefault()
    const next = available[(at + step + available.length) % available.length]!
    setPane(next)
    document.getElementById(`${id}-tab-${next}`)?.focus()
  }

  return (
    <div
      data-slot="ai-artifact"
      data-pane={pane}
      className={cn(
        'w-full overflow-hidden rounded-[var(--radius-overlay)] border border-line bg-surface-1',
        className,
      )}
    >
      <div className="flex items-center gap-2 border-b border-line px-2 py-1.5">
        <span className="k-text-caption min-w-0 truncate px-1 font-semibold text-ink">{title}</span>
        {available.length > 1 ? (
          <div
            role="tablist"
            aria-label={labels.views}
            onKeyDown={tabKeys}
            className="ml-auto flex items-center gap-0.5 rounded-[var(--radius-control)] bg-surface-3 p-0.5"
          >
            {available.map((candidate) => (
              <button
                key={candidate}
                id={`${id}-tab-${candidate}`}
                type="button"
                role="tab"
                data-slot="ai-artifact-tab"
                aria-selected={pane === candidate}
                aria-controls={`${id}-panel`}
                tabIndex={pane === candidate ? 0 : -1}
                onClick={() => setPane(candidate)}
                className={cn(
                  'k-text-caption relative cursor-pointer rounded-[var(--radius-inner)] px-2 py-1 transition-colors duration-[120ms]',
                  pane === candidate ? 'text-ink' : 'text-ink-3 hover:text-ink',
                  focusRing,
                )}
              >
                {pane === candidate ? (
                  // 一个共享元素在页签间滑：两个页签各自换色读成两个状态，不是一个选择在移动。
                  <motion.span
                    layoutId={`${id}-indicator`}
                    className="absolute inset-0 rounded-[var(--radius-inner)] bg-surface-1 shadow-sm"
                    transition={unit(snappy)}
                  />
                ) : null}
                <span className="relative">{candidate === 'preview' ? labels.preview : labels.code}</span>
              </button>
            ))}
          </div>
        ) : null}
        {copyText && labels.copy ? (
          <Button
            type="button"
            variant="icon"
            size="icon"
            data-slot="ai-artifact-copy"
            aria-label={copied ? (labels.copied ?? labels.copy) : labels.copy}
            className={cn(available.length > 1 ? '' : 'ml-auto', copied && 'text-ink')}
            onClick={copy}
          >
            {copied ? <Check aria-hidden="true" size={13} /> : <Copy aria-hidden="true" size={13} />}
          </Button>
        ) : null}
      </div>
      <div
        role="tabpanel"
        id={`${id}-panel`}
        aria-labelledby={`${id}-tab-${pane}`}
        className="relative overflow-hidden"
      >
        <AnimatePresence custom={direction} initial={false} mode="wait">
          <motion.div
            key={pane}
            initial={{ opacity: 0, x: direction * TRAVEL_PX }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -direction * TRAVEL_PX }}
            transition={unit(snappy)}
          >
            {pane === 'preview' ? (
              <div className="p-3">{preview}</div>
            ) : (
              <pre className="k-text-caption m-0 overflow-x-auto p-3 font-mono leading-relaxed text-ink">{code}</pre>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
