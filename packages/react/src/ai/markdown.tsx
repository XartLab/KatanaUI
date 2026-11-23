// SPDX-License-Identifier: MIT
// 安全的 Markdown（#132，从 KATANAview src/ui/Markdown.tsx 搬进包，2026-11-22；原件是 KATANAview #181 / #1069 / #1462）。
// 给模型写的话用：照 OpenAlgo 的 Agent 与 OpenAlice 的做法，挡掉两条把数据带出去的路：
// - 不渲染 HTML（html: false，原样当字写出来）；
// - 不画图片：图片会去取一个模型选的地址，只写成「[图片：说明]」；
// - 链接只认 http(s)，在新标签页打开，不带来源。
// 角标的位置：调用方把脚注换成「私有区字符 + 序号 + 私有区字符」的占位符（markdownSlot(n)），这里在对应位置留一个空槽，
// 槽里画调用方给的节点（slots[序号]）。序号超出 slots 的占位符当没有；模型自己写的占位符只会指到调用方给的节点。
// 文档模式（传 resolveLink）用同一套渲染，只多三样（另起一个实例，回话的那个不变）：
// - 标题带 data-anchor：用 GitHub 的规则（github-slugger）从标题文字生成，同一篇里重名加 -1、-2；
// - 相对链接交给调用方认：认得的写成 href="#" + data-target（点了交给 onOpenLink，不跳页），不认得的只留文字，不留死链；
// - 仍不渲染 HTML、不画图片，外链仍只认 http(s)、新标签页打开。
// 相对原件：lingui 的 t 换成 labels（包不带语言，默认中文）；加了 markdownSlot 与 data-slot。
import GithubSlugger from 'github-slugger'
import MarkdownIt from 'markdown-it'
import { useEffect, useEffectEvent, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '../lib/cn.ts'

export type MarkdownLabels = {
  /** Placeholder text written in place of an image; `alt` is empty when the image has none. Escaped before use. */
  image: (alt: string) => string
}

const DEFAULT_LABELS: MarkdownLabels = { image: (alt) => (alt ? `图片：${alt}` : '图片') }

type Env = {
  slots?: number
  labels?: MarkdownLabels
  resolveLink?: (href: string) => string | null
  dropClose?: boolean
}

const isRelative = (url: string) => !/^[a-z][a-z0-9+.-]*:/i.test(url) && !url.startsWith('//')

const SLOT = /(\d{1,3})/

/** The placeholder that marks where `slots[index]` goes in the text. */
export const markdownSlot = (index: number): string => `${index}`

function createMd(docs: boolean) {
  const md = new MarkdownIt({ html: false, linkify: !docs, breaks: true })
  md.validateLink = (url) => /^https?:\/\//i.test(url.trim()) || (docs && isRelative(url.trim()))
  md.renderer.rules.image = (tokens, idx, _options, rawEnv) => {
    const env = rawEnv as Env
    const alt = tokens[idx]!.children?.map((child) => child.content).join('') ?? ''
    // 先拿整句文案、再整句转义：文案可以来自用户导入的语言包，不能让它把 HTML 带进 innerHTML。
    const label = (env.labels ?? DEFAULT_LABELS).image(alt)
    return `<span class="k-md-image">[${md.utils.escapeHtml(label)}]</span>`
  }
  const defaultLink =
    md.renderer.rules.link_open ?? ((tokens, idx, options, _env, self) => self.renderToken(tokens, idx, options))
  md.renderer.rules.link_open = (tokens, idx, options, rawEnv, self) => {
    const env = rawEnv as Env
    const token = tokens[idx]!
    const href = String(token.attrGet('href') ?? '')
    if (docs && isRelative(href)) {
      const target = env.resolveLink?.(href) ?? null
      if (target === null) {
        env.dropClose = true
        return ''
      }
      token.attrSet('href', '#')
      token.attrSet('data-target', target)
      return defaultLink(tokens, idx, options, env, self)
    }
    token.attrSet('target', '_blank')
    token.attrSet('rel', 'noopener noreferrer')
    return defaultLink(tokens, idx, options, env, self)
  }
  const defaultClose =
    md.renderer.rules.link_close ?? ((tokens, idx, options, _env, self) => self.renderToken(tokens, idx, options))
  md.renderer.rules.link_close = (tokens, idx, options, rawEnv, self) => {
    const env = rawEnv as Env
    if (!env.dropClose) return defaultClose(tokens, idx, options, env, self)
    env.dropClose = false
    return ''
  }
  // 行内解析完以后，把文字里的占位符拆成槽记号；放在 core 阶段是因为私有区字符不是行内规则的终止符，行内规则抢不到它。
  md.core.ruler.after('inline', 'k_slot', (state) => {
    const slots = (state.env as Env).slots ?? 0
    for (const block of state.tokens) {
      if (block.type !== 'inline' || !block.children) continue
      const children: typeof block.children = []
      for (const child of block.children) {
        if (child.type !== 'text' || !SLOT.test(child.content)) {
          children.push(child)
          continue
        }
        for (const [i, part] of child.content.split(new RegExp(SLOT.source, 'g')).entries()) {
          if (i % 2 === 0) {
            if (!part) continue
            const text = new state.Token('text', '', 0)
            text.content = part
            children.push(text)
          } else if (Number(part) < slots) {
            const slot = new state.Token('k_slot', '', 0)
            slot.content = part
            children.push(slot)
          }
        }
      }
      block.children = children
    }
  })
  md.renderer.rules.k_slot = (tokens, idx) => `<span class="k-md-slot" data-slot="${tokens[idx]!.content}"></span>`
  if (docs) {
    md.core.ruler.push('k_anchor', (state) => {
      const slugger = new GithubSlugger()
      for (const [i, token] of state.tokens.entries())
        if (token.type === 'heading_open') token.attrSet('data-anchor', slugger.slug(inlineText(state.tokens[i + 1])))
    })
  }
  return md
}

/** 标题的纯文字：跟 mdast-util-to-string 一样，只取文字、行内代码与图片的说明，不带强调、链接的标记。 */
const inlineText = (inline: { children?: { type: string; content: string }[] | null } | undefined): string =>
  (inline?.children ?? [])
    .filter((child) => child.type === 'text' || child.type === 'code_inline' || child.type === 'image')
    .map((child) => child.content)
    .join('')

const md = createMd(false)
const docsMd = createMd(true)

/** Renders untrusted Markdown (model output) to an HTML string; `slots` is how many slot placeholders are live. */
export const renderMarkdown = (text: string, slots = 0, labels?: MarkdownLabels): string =>
  md.render(text, { slots, labels } satisfies Env)

/**
 * Renders a help document to an HTML string. `resolveLink` gets each relative link as written (percent-encoded by
 * markdown-it) and returns the target handed to `onOpenLink`; `null` means the link points somewhere not bundled, so
 * only its text is kept.
 */
export const renderDoc = (
  text: string,
  resolveLink: (href: string) => string | null,
  labels?: MarkdownLabels,
): string => docsMd.render(text, { resolveLink, labels } satisfies Env)

export type MarkdownHeading = { level: number; text: string; anchor: string }

/** The headings of a document and their anchors (the same `data-anchor` values `renderDoc` writes). */
export function docHeadings(text: string): MarkdownHeading[] {
  const tokens = docsMd.parse(text, {})
  return tokens.flatMap((token, i) =>
    token.type === 'heading_open'
      ? [
          {
            level: Number(token.tag.slice(1)),
            text: inlineText(tokens[i + 1]),
            anchor: String(token.attrGet('data-anchor') ?? ''),
          },
        ]
      : [],
  )
}

export type MarkdownProps = {
  /** The Markdown source. HTML in it is written out as text; images become a placeholder. */
  text: string
  /** Nodes drawn where the text has `markdownSlot(i)` placeholders (by index), such as citation marks. */
  slots?: readonly ReactNode[]
  /**
   * Turns on document mode: headings get anchors and relative links go through this (see `renderDoc`). Keep the
   * reference stable; a new function re-renders.
   */
  resolveLink?: (href: string) => string | null
  /** Called with the target `resolveLink` returned when the reader clicks such a link (the page does not navigate). */
  onOpenLink?: (target: string) => void
  /** Text for the image placeholder; defaults to Chinese. Keep the reference stable. */
  labels?: MarkdownLabels
  /** Extra class name on the root. */
  className?: string
}

export function Markdown({ text, slots, resolveLink, onOpenLink, labels, className }: MarkdownProps) {
  const html = useMemo(
    () => (resolveLink ? renderDoc(text, resolveLink, labels) : renderMarkdown(text, slots?.length ?? 0, labels)),
    [text, slots?.length, resolveLink, labels],
  )
  const root = useRef<HTMLDivElement>(null)
  const open = useEffectEvent((target: string) => onOpenLink?.(target))
  useEffect(() => {
    const node = root.current
    if (!node || !resolveLink) return
    const onClick = (event: MouseEvent) => {
      const link = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>('a[data-target]') : null
      if (!link || !node.contains(link)) return
      event.preventDefault()
      open(link.dataset.target ?? '')
    }
    node.addEventListener('click', onClick)
    return () => node.removeEventListener('click', onClick)
  }, [resolveLink])
  /** 槽是 innerHTML 写进去的，只有提交以后才量得到；html 换了重量一遍。 */
  const [found, setFound] = useState<{ html: string; nodes: readonly Element[] }>({ html: '', nodes: [] })
  useLayoutEffect(() => {
    setFound({ html, nodes: root.current ? [...root.current.querySelectorAll('.k-md-slot')] : [] })
  }, [html])
  return (
    <>
      <div
        ref={root}
        data-slot="markdown"
        className={cn('k-md', className)}
        dangerouslySetInnerHTML={{ __html: html }}
      />
      {found.html === html &&
        found.nodes.map((node) => createPortal(slots?.[Number((node as HTMLElement).dataset.slot)], node))}
    </>
  )
}
