// SPDX-License-Identifier: MIT
// 「文档」两组页：仓库里的 markdown 说明直接放进文档站看（用户 2026-11-17：「我需要放里面方便看」）。
// 包里的 .md 用 import.meta.glob 打进站里，仓库级的 design/ 由 virtual:extra-docs 注入，marked 渲染；md 之间的相对链接改成站内地址 #/doc/<slug>。
// 源文件不动，仍以仓库里的 .md 为准；新加的 .md 放进下面两个目录就会自己出现。

import { marked } from 'marked'
import { useMemo } from 'react'
import EXTRA from 'virtual:extra-docs'

type Guide = { slug: string; path: string; title: string; group: 'library' | 'design' | 'cards'; source: string }

const LIBRARY = import.meta.glob(['../README.md', '../docs/*.md'], {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

/** 仓库里的路径（从仓库根算），用来显示出处与解析相对链接。 */
const repoPath = (key: string) => key.replace(/^\.\.\//, 'packages/react/')

const slugOf = (path: string) =>
  path
    .replace(/^packages\/react\/docs\//, '')
    .replace(/^packages\/react\//, '')
    .replace(/^design\/katana-console\/project\//, 'design/')
    .replace(/^design\/katana-console\//, 'design/archive/')
    .replace(/^design\/README$/, 'design/index')
    .replace(/\.md$/, '')

const titleOf = (source: string, path: string) => source.match(/^#\s+(.+)$/m)?.[1]?.trim() ?? path.split('/').at(-1)!

const build = (files: Record<string, string>, group: Guide['group']): Guide[] =>
  Object.entries(files)
    .map(([key, source]) => {
      const path = repoPath(key)
      return { slug: `doc/${slugOf(path)}`, path, title: titleOf(source, path), group, source }
    })
    .sort((a, b) =>
      a.path.endsWith('README.md') ? -1 : b.path.endsWith('README.md') ? 1 : a.path.localeCompare(b.path),
    )

// 设计稿的组件卡（各组件目录下的 README 与 api/components）单成一组，跟规范正文分开。
const isCard = (path: string) => /\/components\//.test(path)
// 仓库级的设计规范由构建时注入（vite.config.ts 的 extraDocs）；包单独构建时这一组是空的。
const DESIGN_ALL = build(EXTRA, 'design')
export const GUIDES: readonly Guide[] = [
  ...build(LIBRARY, 'library'),
  ...DESIGN_ALL.filter((guide) => !isCard(guide.path)),
  ...DESIGN_ALL.filter((guide) => isCard(guide.path)).map((guide) => ({ ...guide, group: 'cards' as const })),
]
export const GUIDE_GROUPS = [
  { id: 'library', title: '文档 · 组件库' },
  { id: 'design', title: '文档 · 设计规范' },
  { id: 'cards', title: '文档 · 设计稿组件卡' },
] as const
export const guideBySlug = (slug: string) => GUIDES.find((guide) => guide.slug === slug)

/** 把 md 里指向别的 .md 的相对链接改成站内地址；指不到的保持原样。 */
function resolveLinks(html: string, from: string) {
  const base = from.split('/').slice(0, -1)
  return html.replace(/href="([^"#:]+\.md)(?:#[^"]*)?"/g, (whole, rel: string) => {
    const parts = [...base]
    for (const seg of rel.split('/')) {
      if (seg === '..') parts.pop()
      else if (seg !== '.') parts.push(seg)
    }
    const target = GUIDES.find((guide) => guide.path === parts.join('/'))
    return target ? `href="#/${target.slug}"` : whole
  })
}

export function GuidePage({ slug }: { slug: string }) {
  const guide = guideBySlug(slug)!
  const html = useMemo(() => resolveLinks(marked.parse(guide.source, { async: false, gfm: true }), guide.path), [guide])
  return (
    <article className="gal-guide">
      <p className="gal-guide-path">
        <code>{guide.path}</code>
      </p>
      <div className="gal-guide-body" dangerouslySetInnerHTML={{ __html: html }} />
    </article>
  )
}
