// SPDX-License-Identifier: MIT
import { useEffect, useState, useSyncExternalStore } from 'react'
import { CodeBlock, SideNav, ToggleGroup, ToggleGroupItem, type SideNavGroup } from '../src/index'
import { CopyButton } from './CopyButton'
import { CoveragePage } from './coverage'
import { RENDERING_ID, RenderingPage } from './rendering'
import { FOUNDATION_PAGES, FoundationPage, isFoundation } from './foundations'
import { GUIDES, GUIDE_GROUPS, GuidePage, guideBySlug } from './guides'
import { DEMOS } from './demos'
import { resolveParts, type ResolvedPart } from './props'
import { GROUPS, PAGES, pageById, type DocPage } from './registry'
import { usageName, usageOf } from './usage'

// 组件文档站（#1860）：左侧目录按类分组，右侧一个组件一页，地址 `#/<件名>`，可直接打开、可前进后退。
// 版式照 kobra.systems/components/<件名>（2026-11-14 读，只取结构）：标题与一句说明、实时预览、属性表、组成、键盘。
// 预览默认 Graphite 主题（跟 Console 应用的默认一致，KATANAview #1775），页头的切换看 Console（主题是根节点上的 data-theme）；?theme=console 直接以它打开。

/** 「覆盖」页的地址 `#/coverage`：不是组件页，在目录里单列一组「总览」。 */
export const COVERAGE_ID = 'coverage'

export type ThemeName = 'console' | 'graphite'

const THEMES: readonly { id: ThemeName; label: string }[] = [
  { id: 'console', label: 'Console' },
  { id: 'graphite', label: 'Graphite' },
]

export const themeFromUrl = (): ThemeName =>
  new URLSearchParams(location.search).get('theme') === 'console' ? 'console' : 'graphite'

const subscribe = (listener: () => void) => {
  window.addEventListener('hashchange', listener)
  return () => window.removeEventListener('hashchange', listener)
}
const currentId = () => location.hash.replace(/^#\/?/, '')

/** 把主题写到根节点与地址上（地址的 ?theme= 让刷新、分享链接都停在同一个主题）。 */
export function applyTheme(theme: ThemeName) {
  document.documentElement.dataset.theme = theme
  const url = new URL(location.href)
  if (theme === 'graphite') url.searchParams.delete('theme')
  else url.searchParams.set('theme', theme)
  history.replaceState(null, '', url)
}

function PropsTable({ table }: { table: ResolvedPart }) {
  return (
    <div className="gal-prop" data-part={table.part}>
      <h3>{table.part}</h3>
      {table.note ? <p className="gal-note">{table.note}</p> : null}
      {table.rows.length > 0 ? (
        <table>
          <thead>
            <tr>
              <th scope="col">属性</th>
              <th scope="col">类型</th>
              <th scope="col">默认</th>
              <th scope="col">说明</th>
            </tr>
          </thead>
          <tbody>
            {table.rows.map((row) => (
              <tr key={row.name}>
                <td>
                  <code>{row.name}</code>
                  {row.required ? <abbr title="必填">*</abbr> : null}
                </td>
                <td>
                  <code>{row.type}</code>
                </td>
                <td>{row.default ? <code>{row.default}</code> : '—'}</td>
                <td>{row.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
    </div>
  )
}

/** 「用法」：最小例子（usage/ 里的真实组件）渲染出来，下面是它的源码，可复制。 */
function UsageSection({ page }: { page: DocPage }) {
  const usage = usageOf(page.id)
  if (!usage) return null
  const { Usage, source } = usage
  return (
    <section aria-labelledby="gal-h-usage" className="gal-usage" data-usage>
      <div className="gal-usage-head">
        <h2 id="gal-h-usage">用法</h2>
        <CopyButton text={source} label="复制用法代码" />
      </div>
      <div className="gal-usage-live" data-usage-live>
        <Usage />
      </div>
      <div data-usage-code>
        <CodeBlock
          code={source}
          language="tsx"
          filename={`usage/${usageName(page.id)}.tsx`}
          showHeader={false}
          showCopyButton={false}
          copyLabel="复制"
          copiedLabel="已复制"
        />
      </div>
    </section>
  )
}

function DocBody({ page }: { page: DocPage }) {
  const Demo = DEMOS[page.id]
  return (
    <article className="gal-doc" data-page={page.id}>
      <header className="gal-doc-head">
        <h1>{page.title}</h1>
        <p>{page.summary}</p>
      </header>
      <section className="gal-preview" data-gallery={page.id} aria-label="预览">
        {Demo ? <Demo /> : null}
      </section>
      <UsageSection page={page} />
      <section aria-labelledby="gal-h-props">
        <h2 id="gal-h-props">属性</h2>
        {resolveParts(page).map((table) => (
          <PropsTable key={table.part} table={table} />
        ))}
      </section>
      <section aria-labelledby="gal-h-states">
        <h2 id="gal-h-states">状态</h2>
        <ul className="gal-list">
          {page.states.map((state) => (
            <li key={state}>{state}</li>
          ))}
        </ul>
      </section>
      <section aria-labelledby="gal-h-donts">
        <h2 id="gal-h-donts">不要</h2>
        <ul className="gal-list">
          {page.donts.map((dont) => (
            <li key={dont}>{dont}</li>
          ))}
        </ul>
      </section>
      <section aria-labelledby="gal-h-parts">
        <h2 id="gal-h-parts">组成</h2>
        <pre className="gal-code" tabIndex={0}>
          {page.composition}
        </pre>
      </section>
      {page.keys.length > 0 ? (
        <section aria-labelledby="gal-h-keys">
          <h2 id="gal-h-keys">键盘</h2>
          <table className="gal-keys">
            <tbody>
              {page.keys.map(([key, what]) => (
                <tr key={key}>
                  <th scope="row">
                    <kbd>{key}</kbd>
                  </th>
                  <td>{what}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ) : null}
    </article>
  )
}

/** 左栏目录：基础 → 各组组件 → 文档 → 总览；组件页的名字用页标题（英文名 + 中文名），按 id 与标题都能搜到。 */
const navGroups: readonly SideNavGroup[] = [
  {
    id: 'foundations',
    title: '基础',
    items: FOUNDATION_PAGES.map((item) => ({
      id: item.id,
      label: item.title,
      href: `#/${item.id}`,
      keywords: item.id,
    })),
  },
  ...GROUPS.map((group) => ({
    id: group.id,
    title: group.title,
    items: PAGES.filter((item) => item.group === group.id).map((item) => {
      const [name, ...rest] = item.title.split(' ')
      return {
        id: item.id,
        label: (
          <>
            {name}
            {rest.length > 0 ? <span className="gal-nav-cn"> {rest.join(' ').replace(/（[^）]*）/g, '')}</span> : null}
          </>
        ),
        href: `#/${item.id}`,
        keywords: `${item.id} ${item.title}`,
      }
    }),
  })).filter((group) => group.items.length > 0),
  ...GUIDE_GROUPS.map((group) => ({
    id: group.id,
    title: group.title,
    items: GUIDES.filter((guide) => guide.group === group.id).map((guide) => ({
      id: guide.slug,
      label: guide.title,
      href: `#/${guide.slug}`,
      keywords: guide.path,
      title: guide.path,
    })),
  })),
  {
    id: 'overview',
    title: '总览',
    items: [
      { id: COVERAGE_ID, label: '设计稿覆盖表', href: `#/${COVERAGE_ID}`, keywords: COVERAGE_ID },
      { id: RENDERING_ID, label: '渲染设置', href: `#/${RENDERING_ID}`, keywords: RENDERING_ID },
    ],
  },
]

function PanelIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="2" y="2.5" width="12" height="11" rx="2.5" stroke="currentColor" />
      <path d="M6 2.5v11" stroke="currentColor" />
    </svg>
  )
}

export function Docs({ theme, onTheme }: { theme: ThemeName; onTheme: (theme: ThemeName) => void }) {
  const id = useSyncExternalStore(subscribe, currentId)
  const page = pageById(id)
  // 地址里没有页（直接打开 /ui-gallery.html）：落到第一页，用 replace 不留一条空历史。
  useEffect(() => {
    if (id === '') history.replaceState(null, '', `#/${PAGES[0].id}`)
  }, [id])
  const shown = page ?? (id === '' ? PAGES[0] : undefined)
  const onCoverage = id === COVERAGE_ID
  const onRendering = id === RENDERING_ID
  const onFoundation = isFoundation(id)
  const onGuide = guideBySlug(id) !== undefined
  const [navOpen, setNavOpen] = useState(true)
  const currentNav = onCoverage || onRendering || onFoundation || onGuide ? id : shown?.id
  return (
    <div className="gal-shell" data-gallery-theme={theme}>
      {navOpen ? (
        <aside className="gal-side">
          <SideNav
            aria-label="文档目录"
            groups={navGroups}
            current={currentNav}
            searchLabel="搜索组件与文档"
            emptyLabel="没有匹配的页"
            header={
              <div className="gal-side-head">
                <button
                  type="button"
                  className="gal-side-toggle"
                  onClick={() => setNavOpen(false)}
                  aria-label="收起目录"
                >
                  <PanelIcon />
                </button>
                <a className="gal-crumb" href={`#/${PAGES[0].id}`}>
                  <span className="gal-crumb-dot" aria-hidden="true" />
                  KatanaUI <span className="gal-crumb-sep">/</span> <b>组件</b>
                </a>
              </div>
            }
          />
        </aside>
      ) : null}
      <div className="gal-main">
        <div className="gal-bar">
          {navOpen ? null : (
            <button type="button" className="gal-side-toggle" onClick={() => setNavOpen(true)} aria-label="展开目录">
              <PanelIcon />
            </button>
          )}
          <span>组件文档 · 演示数据</span>
          <ToggleGroup
            variant="sm"
            value={theme}
            onValueChange={(next) => onTheme(next as ThemeName)}
            aria-label="主题"
          >
            {THEMES.map((item) => (
              <ToggleGroupItem key={item.id} value={item.id}>
                {item.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
        <main>
          {onCoverage ? (
            <CoveragePage />
          ) : onRendering ? (
            <RenderingPage />
          ) : onFoundation ? (
            <FoundationPage id={id} />
          ) : onGuide ? (
            <GuidePage key={id} slug={id} />
          ) : shown ? (
            <DocBody key={shown.id} page={shown} />
          ) : (
            <p className="gal-missing" role="alert">
              没有「{id}」这一页，从左侧目录里选。
            </p>
          )}
        </main>
      </div>
    </div>
  )
}
