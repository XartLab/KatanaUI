// SPDX-License-Identifier: MIT
// 侧栏导航（2026-11-17，用户：「为什么我们的没法跟 Rare UI 左侧栏一样」）：照 rareui.com 组件站左栏的结构与手感（同日在用户 Chrome 里实测），实现原创。
// - 分组：小号大写组名，组内一列链接；没选中的字淡（ink-300），悬停变亮，当前项最亮。
// - 轨迹：每组左边一条 1px 虚线从组顶走到「当前项」的中线，再用一个 6px 半径的弯钩拐进那一项；悬停另一项时，同样的轨迹以淡色画到悬停项。
//   轨迹的 top / height 走 200ms 过渡，切换当前项时会「滑」过去；减少动态时不过渡。
// - 搜索：顶上一个过滤框，⌘K / Ctrl+K 聚焦；只按标题与关键词过滤，没有命中的组整组隐藏。
// 件不管路由：items 给 href，当前项由调用方传 current。

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'

export type SideNavItem = {
  id: string
  label: ReactNode
  href: string
  /** 16px 图标（如 lucide 的图标）；同一组里有的有、有的没有时，没有的留出同宽的空位，字对齐。 */
  icon?: ReactNode
  keywords?: string
  title?: string
}
export type SideNavGroup = { id: string; title: string; icon?: ReactNode; items: readonly SideNavItem[] }

export type SideNavProps = {
  groups: readonly SideNavGroup[]
  /** 当前项的 id。 */
  current?: string
  /** 顶部（品牌、面包屑、收起按钮等）。 */
  header?: ReactNode
  /** 底部（版本、链接等）。 */
  footer?: ReactNode
  /** 搜索框的占位与读屏名；不给就不显示搜索框。 */
  searchLabel?: string
  /** 搜索没有结果时的文字。 */
  emptyLabel?: string
  'aria-label'?: string
}

type Trail = { height: number } | null

/** 轨迹：虚线从组顶到目标项中线上方 6px，弯钩补完最后 6px 并拐进去。位置由 paint() 直接写 style（量布局，不进 React 状态）。 */
function TrailMark({ kind, mark }: { kind: 'hover' | 'active'; mark: (node: HTMLSpanElement | null) => void }) {
  return (
    <span ref={mark} className="k-sidenav-trail" data-kind={kind} style={{ opacity: 0 }} aria-hidden="true">
      <span className="k-sidenav-line" style={{ height: 0 }} />
      <svg className="k-sidenav-hook" width="12" height="7" viewBox="0 0 12 7" fill="none" style={{ top: -6 }}>
        <path d="M0.5 0a6 6 0 0 0 6 6H12" stroke="currentColor" strokeDasharray="2 2" />
      </svg>
    </span>
  )
}

function paint(mark: HTMLSpanElement | null, trail: Trail) {
  if (!mark) return
  const line = mark.firstElementChild as HTMLElement | null
  const hook = mark.lastElementChild as SVGElement | null
  mark.style.opacity = trail ? '1' : '0'
  if (!trail) return
  if (line) line.style.height = `${trail.height}px`
  if (hook) hook.style.top = `${trail.height}px`
}

function Group({ group, current }: { group: SideNavGroup; current?: string }) {
  const list = useRef<HTMLDivElement>(null)
  const active = useRef<HTMLSpanElement | null>(null)
  const hover = useRef<HTMLSpanElement | null>(null)

  const trailTo = useCallback((id: string | undefined): Trail => {
    const box = list.current
    if (!box || !id) return null
    const link = box.querySelector<HTMLElement>(`[data-nav-id="${CSS.escape(id)}"]`)
    if (!link) return null
    return { height: Math.max(0, Math.round(link.offsetTop + link.offsetHeight / 2 - 6)) }
  }, [])

  useLayoutEffect(() => {
    const draw = () => paint(active.current, trailTo(current))
    draw()
    const box = list.current
    if (!box || typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(draw)
    observer.observe(box)
    return () => observer.disconnect()
  }, [current, group.items, trailTo])

  const point = (id: string | null) => paint(hover.current, id && id !== current ? trailTo(id) : null)

  return (
    <section className="k-sidenav-group" data-slot="side-nav-group">
      <h2 className="k-sidenav-title">
        {group.icon ? <span className="k-sidenav-title-icon">{group.icon}</span> : null}
        {group.title}
      </h2>
      <div ref={list} className="k-sidenav-items" onPointerLeave={() => point(null)}>
        <TrailMark kind="hover" mark={(node) => void (hover.current = node)} />
        <TrailMark kind="active" mark={(node) => void (active.current = node)} />
        <ul className="k-sidenav-list">
          {group.items.map((item) => (
            <li key={item.id}>
              <a
                href={item.href}
                className="k-sidenav-link"
                data-nav-id={item.id}
                aria-current={item.id === current ? 'page' : undefined}
                title={item.title}
                onPointerEnter={() => point(item.id)}
                onFocus={() => point(item.id)}
                onBlur={() => point(null)}
              >
                {group.items.some((entry) => entry.icon) ? (
                  <span className="k-sidenav-icon" aria-hidden="true">
                    {item.icon}
                  </span>
                ) : null}
                <span className="k-sidenav-label">{item.label}</span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

const text = (node: ReactNode): string => (typeof node === 'string' || typeof node === 'number' ? String(node) : '')

/** 侧栏导航：分组链接 + 当前项轨迹 + 悬停轨迹 + 过滤框。 */
export function SideNav({ groups, current, header, footer, searchLabel, emptyLabel, ...rest }: SideNavProps) {
  const [query, setQuery] = useState('')
  const input = useRef<HTMLInputElement>(null)
  const scroller = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!searchLabel) return
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        input.current?.focus()
        input.current?.select()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [searchLabel])

  // 当前项滚进可视区（只在 current 变了时）。
  useEffect(() => {
    const link = scroller.current?.querySelector<HTMLElement>('[aria-current="page"]')
    // 当前项在视口里就不动；不在就滚到它，并让组名也露出来（组太长时至少保证当前项可见）。
    const box = scroller.current
    if (!link || !box) return
    const view = box.getBoundingClientRect()
    const at = link.getBoundingClientRect()
    if (at.top >= view.top && at.bottom <= view.bottom - 48) return
    const section = link.closest('section')
    const top = section && at.bottom - section.getBoundingClientRect().top < view.height - 48 ? section : link
    top.scrollIntoView({ block: 'start' })
  }, [current])

  const needle = query.trim().toLowerCase()
  const shown = needle
    ? groups
        .map((group) => ({
          ...group,
          items: group.items.filter((item) =>
            [item.id, text(item.label), item.keywords ?? '', item.title ?? ''].join(' ').toLowerCase().includes(needle),
          ),
        }))
        .filter((group) => group.items.length > 0)
    : groups

  return (
    <nav className="k-sidenav" data-slot="side-nav" aria-label={rest['aria-label']}>
      {header ? <div className="k-sidenav-head">{header}</div> : null}
      {searchLabel ? (
        <div className="k-sidenav-search">
          <input
            ref={input}
            type="search"
            value={query}
            placeholder={searchLabel}
            aria-label={searchLabel}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Escape') setQuery('')
              if (event.key === 'Enter') {
                const first = scroller.current?.querySelector<HTMLAnchorElement>('.k-sidenav-link')
                first?.click()
              }
            }}
          />
          <kbd aria-hidden="true">⌘K</kbd>
        </div>
      ) : null}
      <div ref={scroller} className="k-sidenav-scroll">
        {shown.map((group) => (
          <Group key={group.id} group={group} current={current} />
        ))}
        {shown.length === 0 ? <p className="k-sidenav-empty">{emptyLabel}</p> : null}
      </div>
      {footer ? <div className="k-sidenav-foot">{footer}</div> : null}
    </nav>
  )
}
