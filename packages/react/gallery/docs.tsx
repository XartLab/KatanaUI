// SPDX-License-Identifier: MIT
import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import {
  CodeBlock,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SideNav,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  type SideNavGroup,
} from '../src/index'
import tokensJson from '../src/tokens-json'
import { guidanceOf } from './guidance'
import { PATTERN_GROUPS, PatternPage, patternById } from './patterns'
import { packageOf, sourceOf } from './source-map'
import { CopyButton } from './CopyButton'
import { DocToc } from './DocToc'
import { CoveragePage } from './coverage'
import { RENDERING_ID, RenderingPage } from './rendering'
import { FOUNDATION_PAGES, FOUNDATION_SECTIONS, FoundationPage, isFoundation } from './foundations'
import { GROUP_ICONS, KatanaMark } from './nav-icons'
import { DEMOS } from './demos'
import { resolveParts, type ResolvedPart } from './props'
import { GROUPS, PAGES, pageById, type DocPage } from './registry'
import { usageName, usageOf } from './usage'

// 组件文档站（#1860）：左侧目录按类分组，右侧一个组件一页，地址 `#/<件名>`，可直接打开、可前进后退。
// 版式照 kobra.systems/components/<件名>（2026-11-14 读，只取结构）：标题与一句说明、实时预览、属性表、组成、键盘。
// 预览默认 Graphite 主题（跟 Console 应用的默认一致，KATANAview #1775），页头的切换看 Console（主题是根节点上的 data-theme）；?theme=console 直接以它打开。

/** 「覆盖」页的地址 `#/coverage`：不是组件页，在目录里单列一组「总览」。 */
export const COVERAGE_ID = 'coverage'

export type ThemeName = string

/** 主题清单读 tokens.json（color.themes）：加主题只改 token 源头，文档站自己跟上。默认 Graphite 排第一。 */
const THEMES: readonly { id: ThemeName; label: string }[] = [
  ...(tokensJson as { color: { themes: { id: string; name: string }[] } }).color.themes,
]
  .sort((a, b) => (a.id === 'graphite' ? -1 : b.id === 'graphite' ? 1 : 0))
  .map((theme) => ({ id: theme.id, label: theme.name }))

/** 下拉里的小色样：每个主题的底色、文字、强调与涨跌色（直接从 tokens.json 读值，不靠 CSS 变量——那只对当前主题生效）。 */
const COLOR_TOKENS = (tokensJson as { color: { tokens: { name: string; value: Record<string, string> }[] } }).color
  .tokens
function themeColor(name: string, theme: string): string {
  let value = COLOR_TOKENS.find((token) => token.name === name)?.value[theme] ?? '#000'
  for (let i = 0; i < 4 && value.startsWith('{'); i++) {
    value = COLOR_TOKENS.find((token) => token.name === value.slice(1, -1))?.value[theme] ?? '#000'
  }
  return value
}
const swatchStyle = (theme: string) => ({
  background: `linear-gradient(90deg, ${themeColor('bg-300', theme)} 0 40%, ${themeColor('ink-100', theme)} 40% 55%, ${themeColor('accent', theme)} 55% 70%, ${themeColor('pnl-up', theme)} 70% 85%, ${themeColor('pnl-down', theme)} 85%)`,
})

export const themeFromUrl = (): ThemeName => {
  const asked = new URLSearchParams(location.search).get('theme')
  return THEMES.some((theme) => theme.id === asked) ? asked! : 'graphite'
}

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
          labels={{ copy: '复制', copied: '已复制' }}
        />
      </div>
    </section>
  )
}

function DocBody({ page }: { page: DocPage }) {
  const Demo = DEMOS[page.id]
  const guide = guidanceOf(page.id)
  const source = sourceOf(page.exports, page.title)
  const avoid = [...(guide.avoid ?? []), ...page.donts]
  return (
    <article className="gal-doc" data-page={page.id}>
      <header className="gal-doc-head">
        <h1>{page.title}</h1>
        <p>{page.summary}</p>
        <dl className="gal-doc-meta">
          <div>
            <dt>包</dt>
            <dd>
              <code>{packageOf(page.exports, page.title)}</code>
            </dd>
          </div>
          {source ? (
            <div>
              <dt>源码</dt>
              <dd>
                <a href={source.href} target="_blank" rel="noreferrer">
                  {source.path}
                </a>
              </dd>
            </div>
          ) : null}
          {guide.aliases && guide.aliases.length > 0 ? (
            <div>
              <dt>也叫</dt>
              <dd>{guide.aliases.join('、')}</dd>
            </div>
          ) : null}
        </dl>
      </header>
      <Tabs defaultValue="examples" className="gal-doc-tabs">
        {/* 页签行吸在顶栏下面：长页滚动时随时能切页签。 */}
        <div className="gal-doc-tablist">
          <TabsList variant="line" aria-label="这一页的内容">
            <TabsTrigger value="examples">示例</TabsTrigger>
            <TabsTrigger value="usage">怎么用</TabsTrigger>
            <TabsTrigger value="a11y">无障碍</TabsTrigger>
            <TabsTrigger value="props">属性</TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="examples">
          <section className="gal-preview" data-gallery={page.id} aria-label="预览">
            {Demo ? <Demo /> : null}
          </section>
          <UsageSection page={page} />
        </TabsContent>
        <TabsContent value="usage">
          <GuideList id="gal-h-use" title="什么时候用" items={guide.use} />
          <GuideList id="gal-h-avoid" title="什么时候别用" items={avoid} />
          <GuideList id="gal-h-states" title="状态" items={page.states} />
          <section aria-labelledby="gal-h-parts">
            <h2 id="gal-h-parts">组成</h2>
            <pre className="gal-code" tabIndex={0}>
              {page.composition}
            </pre>
          </section>
        </TabsContent>
        <TabsContent value="a11y">
          <GuideList id="gal-h-a11y" title="读屏、焦点与对比度" items={guide.a11y} />
          <section aria-labelledby="gal-h-keys">
            <h2 id="gal-h-keys">键盘</h2>
            {page.keys.length > 0 ? (
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
            ) : (
              <p className="gal-todo">没有键盘交互（不能聚焦，或只用 Tab 经过）。</p>
            )}
          </section>
        </TabsContent>
        <TabsContent value="props">
          <section aria-labelledby="gal-h-props">
            <h2 id="gal-h-props">属性</h2>
            {resolveParts(page).map((table) => (
              <PropsTable key={table.part} table={table} />
            ))}
          </section>
        </TabsContent>
      </Tabs>
    </article>
  )
}

/** 怎么用 / 无障碍里的一节：一条一句；没写的显示「待补」。 */
function GuideList({ id, title, items }: { id: string; title: string; items?: readonly string[] }) {
  return (
    <section aria-labelledby={id}>
      <h2 id={id}>{title}</h2>
      {items && items.length > 0 ? (
        <ul className="gal-list">
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : (
        <p className="gal-todo">待补。</p>
      )}
    </section>
  )
}

/** 左栏目录：基础 → 各组组件 → 文档 → 总览；组件页的名字用页标题（英文名 + 中文名），按 id 与标题都能搜到。
 * 目录照 Salt：入门 → 基础 → Token 与主题 → 组件各组 → 模式 → 总览。
 * 图标只给大分组（用户 2026-11-17：「大分组有，小分组没 logo」），条目不带图标。 */
const groupIcon = (id: string) => {
  const Icon = GROUP_ICONS[id]
  return Icon ? <Icon aria-hidden /> : undefined
}

const navGroups: readonly SideNavGroup[] = [
  ...FOUNDATION_SECTIONS.map((section) => ({
    id: section.id,
    title: section.title,
    icon: groupIcon(section.id),
    items: FOUNDATION_PAGES.filter((item) => item.section === section.id).map((item) => ({
      id: item.id,
      label: item.title,
      href: `#/${item.id}`,
      keywords: item.id,
    })),
  })),
  ...GROUPS.map((group) => ({
    id: group.id,
    title: group.title,
    icon: groupIcon(group.id),
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
  ...PATTERN_GROUPS,
  {
    id: 'overview',
    title: '总览',
    icon: groupIcon('overview'),
    items: [
      {
        id: COVERAGE_ID,
        label: '设计稿覆盖表',
        href: `#/${COVERAGE_ID}`,
        keywords: COVERAGE_ID,
      },
      {
        id: RENDERING_ID,
        label: '渲染设置',
        href: `#/${RENDERING_ID}`,
        keywords: RENDERING_ID,
      },
    ],
  },
]

/** 面包屑：页 id → 所在分组（名字、第一页的地址）与页名；从目录数据里查，目录加页它自己跟上。 */
const crumbOf = (id: string) => {
  for (const group of navGroups) {
    const item = group.items.find((entry) => entry.id === id)
    if (!item) continue
    const title = PAGES.find((entry) => entry.id === id)?.title
    // 组件页的目录条目是 JSX，页名取标题的英文名；别的页直接用条目文字。
    const name = title ? title.split(' ')[0] : typeof item.label === 'string' ? item.label : id
    return { group: group.title, href: group.items[0].href, name }
  }
  return null
}

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
  const pattern = patternById(id)
  const [navOpen, setNavOpen] = useState(true)
  const body = useRef<HTMLDivElement>(null)
  // 切页回到顶：侧栏、锚点或上一页的滚动位置都可能把页面带下去，标题会藏到顶栏后面。
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [id])
  const currentNav = onCoverage || onRendering || onFoundation || pattern ? id : shown?.id
  const crumb = currentNav ? crumbOf(currentNav) : null
  return (
    <div className="gal-shell" data-gallery-theme={theme}>
      {navOpen ? (
        <aside className="gal-side">
          <SideNav
            aria-label="文档目录"
            groups={navGroups}
            current={currentNav}
            labels={{ search: '搜索组件与文档', empty: '没有匹配的页' }}
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
                  <KatanaMark />
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
          <div className="gal-bar-left">
            <nav className="gal-bar-crumb" aria-label="面包屑">
              {crumb ? (
                <>
                  <a href={crumb.href}>{crumb.group}</a>
                  <span className="gal-bar-sep" aria-hidden="true">
                    /
                  </span>
                  <b aria-current="page">{crumb.name}</b>
                </>
              ) : (
                <b>组件文档</b>
              )}
            </nav>
            <span className="gal-bar-tag">演示数据</span>
          </div>
          <Select value={theme} onValueChange={(next) => onTheme(next)}>
            <SelectTrigger aria-label="主题" className="gal-theme-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {THEMES.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  <span className="gal-theme-swatch" style={swatchStyle(item.id)} aria-hidden="true" />
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <main className="gal-page">
          <div className="gal-page-body" ref={body}>
            {onCoverage ? (
              <CoveragePage />
            ) : onRendering ? (
              <RenderingPage />
            ) : onFoundation ? (
              <FoundationPage id={id} />
            ) : pattern ? (
              <PatternPage key={id} pattern={pattern} />
            ) : shown ? (
              <DocBody key={shown.id} page={shown} />
            ) : (
              <p className="gal-missing" role="alert">
                没有「{id}」这一页，从左侧目录里选。
              </p>
            )}
          </div>
          <DocToc key={id} root={body} />
        </main>
      </div>
    </div>
  )
}
