// SPDX-License-Identifier: MIT
// 代码块：带文件名的头、行号、一键复制，配色由一个强调色生成（关键字取强调色，字符串、数字、函数是它跟正文色按比例调出来的，注释灰）。
// 用于脚本、Agent 定义、文档里的代码。交互学自 rare-ui 的 code-block（2026-11-14 读），实现为本仓库原创，未复制其代码。
// 学到的事实（只取行为）：① 整套配色只从一个强调色派生，不是一张固定色表；② 头部写文件名（没有就写语言），右边是复制钮，
// 复制成功钮变成对勾、一段时间后复原，切换用弹簧缩放；③ 行号在行首、不可选中、右对齐、宽度跟总行数的位数走；④ 可以高亮指定的行；
// ⑤ 滚动区是 region、可聚焦，长行横向滚；⑥ 去掉开头的空行与结尾的空白；⑦ 没有头时复制钮浮在右上角。
// 我们的做法：配色用 CSS 的 color-mix 从强调色与主题的 ink token 混出来，所以两个主题自动跟着换，不读页面是深是浅；
// 词法切分是自己写的小切分器（code-highlight.ts），没有加 prism 之类的依赖。
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { cn } from '../lib/cn'
import { focusRing } from '../lib/focus'
import { snappy } from '../lib/motion'
import { unit } from '../lib/spring'
import { highlight } from './code-highlight'

const COPIED_MS = 1800
/** 字体族写成行内样式：k-text-* 是 font 简写，会带上无衬线体，类名里的 font-* 排不过它。 */
const MONO: CSSProperties = { fontFamily: 'var(--font-mono)' }

/** 去掉开头的空行与结尾的空白。 */
export function trimCode(code: string): string {
  return code.replace(/^(?:[ \t]*\r?\n)+/, '').trimEnd()
}

/** 行号栏的宽（字符数）：总行数的位数，至少 1。 */
export function gutterWidth(lines: number): number {
  return String(Math.max(1, lines)).length
}

async function writeClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}

function CopyButton({
  code,
  copyLabel,
  copiedLabel,
  floating,
}: {
  code: string
  copyLabel: string
  copiedLabel: string
  floating?: boolean
}) {
  const [copied, setCopied] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  useEffect(() => () => clearTimeout(timer.current), [])
  const copy = async () => {
    if (!(await writeClipboard(code))) return
    setCopied(true)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setCopied(false), COPIED_MS)
  }
  return (
    <button
      type="button"
      data-slot="code-block-copy"
      data-copied={copied || undefined}
      aria-label={copied ? copiedLabel : copyLabel}
      onClick={copy}
      className={cn(
        'relative grid size-7 flex-none cursor-pointer place-items-center rounded-[var(--radius-control)] text-ink-3',
        'transition-colors duration-[120ms] hover:bg-alpha-white-6 hover:text-ink active:scale-[0.92]',
        copied && 'text-(--cb-accent) hover:text-(--cb-accent)',
        floating && 'absolute top-2 right-2 z-10 border border-line bg-surface-3',
        focusRing,
      )}
    >
      <AnimatePresence initial={false} mode="popLayout">
        <motion.span
          key={copied ? 'done' : 'copy'}
          className="grid place-items-center"
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.5, opacity: 0 }}
          transition={unit(snappy)}
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="size-[15px]"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {copied ? (
              <motion.path
                d="M5 12.5 10 17.5 19 7"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={unit(snappy)}
              />
            ) : (
              <>
                <rect x={9} y={9} width={11} height={11} rx={2} />
                <path d="M5 15V6a2 2 0 0 1 2-2h8" />
              </>
            )}
          </svg>
        </motion.span>
      </AnimatePresence>
    </button>
  )
}

export type CodeBlockProps = {
  code: string
  /** 语言：ts tsx js json py sh css 等；认不得的当纯文本。 */
  language?: string
  /** 强调色，任何 CSS 颜色；整套配色从它混出来。默认主题的强调色。 */
  accent?: string
  /** 头里写的名字；不给写语言。 */
  filename?: string
  /** 要不要头（文件名与复制钮）；关了复制钮浮在右上角。 */
  showHeader?: boolean
  showLineNumbers?: boolean
  showCopyButton?: boolean
  /** 要高亮的行（1 起）。 */
  highlightLines?: readonly number[]
  /** 复制钮的读屏名与复制成功后的读屏名（调用方按界面语言给）。 */
  copyLabel: string
  copiedLabel: string
  className?: string
}

export function CodeBlock({
  code,
  language = 'plain',
  accent = 'var(--signal-orange)',
  filename,
  showHeader = true,
  showLineNumbers = true,
  showCopyButton = true,
  highlightLines,
  copyLabel,
  copiedLabel,
  className,
}: CodeBlockProps) {
  const source = useMemo(() => trimCode(code), [code])
  const lines = useMemo(() => highlight(source, language), [source, language])
  const marked = useMemo(() => new Set(highlightLines), [highlightLines])
  const name = filename ?? language
  const style = { '--cb-accent': accent } as CSSProperties
  return (
    <div
      data-slot="code-block"
      data-language={language}
      style={style}
      className={cn(
        'relative flex min-w-0 flex-col overflow-hidden rounded-[var(--radius-overlay)] border border-line bg-surface-1',
        className,
      )}
    >
      {showHeader ? (
        <div
          data-slot="code-block-header"
          className="flex h-9 flex-none items-center gap-3 border-b border-line bg-surface-2 pr-1.5 pl-3"
        >
          <span data-slot="code-block-name" className="k-text-caption min-w-0 flex-1 truncate text-ink-3" style={MONO}>
            {name}
          </span>
          {showCopyButton ? <CopyButton code={source} copyLabel={copyLabel} copiedLabel={copiedLabel} /> : null}
        </div>
      ) : showCopyButton ? (
        <CopyButton code={source} copyLabel={copyLabel} copiedLabel={copiedLabel} floating />
      ) : null}
      <div
        role="region"
        tabIndex={0}
        aria-label={name}
        data-slot="code-block-viewport"
        className={cn('min-h-0 flex-1 overflow-auto py-2.5', focusRing, '-outline-offset-2')}
      >
        <pre
          data-slot="code-block-pre"
          className="k-text-data m-0 w-max min-w-full leading-5 [tab-size:2]"
          style={MONO}
        >
          {lines.map((line, row) => (
            <div
              key={row}
              data-line={row + 1}
              data-marked={marked.has(row + 1) || undefined}
              className={cn(
                'flex min-w-full px-3',
                marked.has(row + 1) && 'bg-[color-mix(in_srgb,var(--cb-accent)_12%,transparent)]',
              )}
            >
              {showLineNumbers ? (
                <span
                  aria-hidden="true"
                  data-slot="code-block-gutter"
                  className="mr-3 flex-none text-right text-ink-4 select-none"
                  style={{ width: `${gutterWidth(lines.length)}ch` }}
                >
                  {row + 1}
                </span>
              ) : null}
              <code className="pr-3">
                {line.map((token, at) => (
                  <span key={at} data-token={token.type} className={TOKEN_CLASS[token.type]}>
                    {token.text}
                  </span>
                ))}
              </code>
            </div>
          ))}
        </pre>
      </div>
    </div>
  )
}

/** 各类 token 的颜色：都是强调色与 ink token 的混合，主题换了自动跟着换。 */
const TOKEN_CLASS = {
  plain: 'text-ink',
  comment: 'text-ink-4 italic',
  punctuation: 'text-ink-3',
  keyword: 'text-(--cb-accent)',
  string: 'text-[color-mix(in_srgb,var(--cb-accent)_45%,var(--ink-100))]',
  number: 'text-[color-mix(in_srgb,var(--cb-accent)_70%,var(--ink-100))]',
  function: 'text-[color-mix(in_srgb,var(--cb-accent)_22%,var(--ink-100))]',
} as const satisfies Record<string, string>
