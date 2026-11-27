// SPDX-License-Identifier: MIT
import { useEffect, useLayoutEffect, useRef, type ReactNode } from 'react'
import { SideNav, type SideNavGroup } from '../src/index'

// 文档站左栏的外壳（kubai Vibe Design Tips 008，2026-11-26 读，只取结构；实现原创）：
// - 换页后把当前项露出来：只滚目录自己的滚动层，不带着整页滚（scrollIntoView 会连页面一起滚，吸顶的左栏会被带下去）；
// - 滚动位置记在 sessionStorage，刷新、收起再展开左栏都回到原位；
// - 上下两端的渐隐：这里按滚动位置给目录的滚动层写 data-more-above / data-more-below，gallery.css（.gal-rail）据此画 mask，
//   只在那一端还有内容时出现。不用 CSS 的滚动驱动动画：它没有终点，等「动画走完」的测试与截图工具会一直等。
// 窄屏的抽屉（NavDrawer）用同一个外壳：不记位置，打开时把当前项放在正中。

/** 左栏滚动位置的存档键（#251）。 */
export const SIDE_SCROLL_KEY = 'katanaui-gallery-side-scroll'

/** 当前项离上沿、下沿至少留多少：下沿 56px 是 gallery.css 里下端的渐隐带，上沿只让开一个组名的高度。 */
const CLEAR_TOP = 24
const CLEAR_BOTTOM = 56

const scrollerOf = (host: HTMLElement | null) => host?.querySelector<HTMLElement>('.k-sidenav-scroll') ?? null

/** 把当前项露出来：nearest 只在它落进渐隐带或看不见时滚一点；center 放到正中（抽屉打开时）。 */
export function revealCurrent(host: HTMLElement | null, mode: 'nearest' | 'center') {
  const scroller = scrollerOf(host)
  const link = scroller?.querySelector<HTMLElement>('[aria-current="page"]')
  if (!scroller || !link) return
  const view = scroller.getBoundingClientRect()
  const at = link.getBoundingClientRect()
  let delta = 0
  if (mode === 'center') delta = at.top + at.height / 2 - (view.top + view.height / 2)
  else if (at.top < view.top + CLEAR_TOP) delta = at.top - view.top - CLEAR_TOP
  else if (at.bottom > view.bottom - CLEAR_BOTTOM) delta = at.bottom - (view.bottom - CLEAR_BOTTOM)
  if (delta !== 0) scroller.scrollTop += delta
}

const isEditable = (target: EventTarget | null) =>
  target instanceof HTMLElement && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName))

export function SideRail({
  groups,
  current,
  header,
  remember = false,
  slashFocus = false,
  searchHotkey,
}: {
  groups: readonly SideNavGroup[]
  current?: string
  header?: ReactNode
  /** 记滚动位置、换页露出当前项（只给常驻的左栏）。 */
  remember?: boolean
  /** 按 / 聚焦搜索框（只给常驻的左栏）。 */
  slashFocus?: boolean
  searchHotkey?: string | null
}) {
  const host = useRef<HTMLDivElement>(null)

  // 两端是否还有内容：滚动、尺寸变化（窄屏转屏、窗口高度）、内容变化（搜索过滤）时重算。
  useEffect(() => {
    const scroller = scrollerOf(host.current)
    if (!scroller) return
    const update = () => {
      scroller.toggleAttribute('data-more-above', scroller.scrollTop > 1)
      scroller.toggleAttribute(
        'data-more-below',
        scroller.scrollHeight - scroller.clientHeight - scroller.scrollTop > 1,
      )
    }
    update()
    scroller.addEventListener('scroll', update, { passive: true })
    const resize = new ResizeObserver(update)
    resize.observe(scroller)
    const mutate = new MutationObserver(update)
    mutate.observe(scroller, { childList: true, subtree: true })
    return () => {
      scroller.removeEventListener('scroll', update)
      resize.disconnect()
      mutate.disconnect()
    }
  }, [])

  // 挂上时先放回记下的位置；SideNav 自己的「当前项不在视区就滚过去」在它的 effect 里跑，晚于这里，两者不打架。
  useLayoutEffect(() => {
    if (!remember) return
    const scroller = scrollerOf(host.current)
    if (!scroller) return
    const saved = Number(sessionStorage.getItem(SIDE_SCROLL_KEY))
    if (Number.isFinite(saved) && saved > 0) scroller.scrollTop = saved
    let frame = 0
    const save = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() =>
        sessionStorage.setItem(SIDE_SCROLL_KEY, String(Math.round(scroller.scrollTop))),
      )
    }
    scroller.addEventListener('scroll', save, { passive: true })
    return () => {
      cancelAnimationFrame(frame)
      scroller.removeEventListener('scroll', save)
    }
  }, [remember])

  // 换页（也包括刷新后直接打开某一页）：当前项在渐隐带里或看不见就滚到可见处。
  useEffect(() => {
    if (remember) revealCurrent(host.current, 'nearest')
  }, [current, remember])

  useEffect(() => {
    if (!slashFocus) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== '/' || event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey) return
      if (isEditable(event.target)) return
      const input = host.current?.querySelector<HTMLInputElement>('.k-sidenav-search input')
      if (!input) return
      event.preventDefault()
      input.focus()
      input.select()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [slashFocus])

  return (
    <div ref={host} className="gal-rail">
      <SideNav
        aria-label="文档目录"
        groups={groups}
        current={current}
        header={header}
        labels={{ search: '搜索组件与文档', empty: '没有匹配的页' }}
        {...(searchHotkey === undefined ? {} : { searchHotkey })}
      />
    </div>
  )
}
