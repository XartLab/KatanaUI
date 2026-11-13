// SPDX-License-Identifier: MIT
import { useEffect, useSyncExternalStore } from 'react'
import { ToggleGroup, ToggleGroupItem } from '../src/index'
import { DEMOS } from './demos'
import { GROUPS, PAGES, pageById, type DocPage, type PropTable } from './registry'

// 组件文档站（#1860）：左侧目录按类分组，右侧一个组件一页，地址 `#/<件名>`，可直接打开、可前进后退。
// 版式照 kobra.systems/components/<件名>（2026-11-14 读，只取结构）：标题与一句说明、实时预览、属性表、组成、键盘。
// 预览默认 Console 主题，页头的切换看 Graphite（主题是根节点上的 data-theme）；?theme=graphite 直接以它打开。

export type ThemeName = 'console' | 'graphite'

const THEMES: readonly { id: ThemeName; label: string }[] = [
  { id: 'console', label: 'Console' },
  { id: 'graphite', label: 'Graphite' },
]

export const themeFromUrl = (): ThemeName =>
  new URLSearchParams(location.search).get('theme') === 'graphite' ? 'graphite' : 'console'

const subscribe = (listener: () => void) => {
  window.addEventListener('hashchange', listener)
  return () => window.removeEventListener('hashchange', listener)
}
const currentId = () => location.hash.replace(/^#\/?/, '')

/** 把主题写到根节点与地址上（地址的 ?theme= 让刷新、分享链接都停在同一个主题）。 */
export function applyTheme(theme: ThemeName) {
  document.documentElement.dataset.theme = theme
  const url = new URL(location.href)
  if (theme === 'console') url.searchParams.delete('theme')
  else url.searchParams.set('theme', theme)
  history.replaceState(null, '', url)
}

function PropsTable({ table }: { table: PropTable }) {
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
                </td>
                <td>
                  <code>{row.type}</code>
                </td>
                <td>{row.default ? <code>{row.default}</code> : '—'}</td>
                <td>{row.desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
    </div>
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
      <section aria-labelledby="gal-h-props">
        <h2 id="gal-h-props">属性</h2>
        {page.props.map((table) => (
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
        <pre className="gal-code">{page.composition}</pre>
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

export function Docs({ theme, onTheme }: { theme: ThemeName; onTheme: (theme: ThemeName) => void }) {
  const id = useSyncExternalStore(subscribe, currentId)
  const page = pageById(id)
  // 地址里没有页（直接打开 /ui-gallery.html）：落到第一页，用 replace 不留一条空历史。
  useEffect(() => {
    if (id === '') history.replaceState(null, '', `#/${PAGES[0].id}`)
  }, [id])
  const shown = page ?? (id === '' ? PAGES[0] : undefined)
  return (
    <div className="gal-shell" data-gallery-theme={theme}>
      <nav className="gal-nav" aria-label="组件">
        <a className="gal-brand" href={`#/${PAGES[0].id}`}>
          @katanaview/ui
        </a>
        {GROUPS.map((group) => {
          const pages = PAGES.filter((item) => item.group === group.id)
          if (pages.length === 0) return null
          return (
            <section key={group.id}>
              <h2>{group.title}</h2>
              <ul>
                {pages.map((item) => (
                  <li key={item.id}>
                    <a href={`#/${item.id}`} aria-current={item.id === shown?.id ? 'page' : undefined}>
                      {item.id}
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )
        })}
      </nav>
      <div className="gal-main">
        <div className="gal-bar">
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
          {shown ? (
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
