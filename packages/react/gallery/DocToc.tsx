// SPDX-License-Identifier: MIT
import { useEffect, useRef, useState, type RefObject } from 'react'

// 右侧「本页」目录（照 Salt 文档站）：列出当前页签里的 h2 / h3，点击平滑滚到该节，滚动时高亮当前节。
type Heading = { id: string; text: string; level: 2 | 3; el: HTMLElement }

/** 示例预览、用法实时区与代码块里的标题是演示内容，不是这一页的节。 */
const SKIP = '.gal-preview, .gal-usage-live, [data-usage-code], [hidden]'

function collect(root: HTMLElement): Heading[] {
  const found: Heading[] = []
  root.querySelectorAll<HTMLElement>('h2, h3').forEach((el, index) => {
    if (el.closest(SKIP)) return
    // 基础页的标题没写 id：补一个（只写 DOM 属性，React 不管它）。
    if (!el.id) el.id = `gal-s-${index}`
    found.push({ id: el.id, text: el.textContent ?? '', level: el.tagName === 'H3' ? 3 : 2, el })
  })
  return found
}

export function DocToc({
  root,
  onActive,
}: {
  root: RefObject<HTMLElement | null>
  /** 当前读到的节名（窄屏底栏显示）；这一页没有节时给空串。 */
  onActive?: (title: string) => void
}) {
  const [items, setItems] = useState<Heading[]>([])
  const [active, setActive] = useState('')
  const lock = useRef(false)

  // 页签切换、内容更换都会改 DOM：盯着子树变化，重新收集（同一批标题不重复 setState）。
  useEffect(() => {
    const host = root.current
    if (!host) return
    let frame = 0
    const scan = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const next = collect(host)
        setItems((prev) =>
          prev.length === next.length && prev.every((item, i) => item.el === next[i].el && item.text === next[i].text)
            ? prev
            : next,
        )
      })
    }
    scan()
    const watch = new MutationObserver(scan)
    watch.observe(host, { childList: true, subtree: true, characterData: true })
    return () => {
      cancelAnimationFrame(frame)
      watch.disconnect()
    }
  }, [root])

  // 高亮：取在「顶栏 + 页签」下沿到视口上 30% 之间的最靠上一节；一节都不在带里时，沿用上一次的。
  useEffect(() => {
    if (items.length === 0) return
    // 窄屏顶栏不吸顶（position: static），不占顶上的带。
    const barEl = document.querySelector<HTMLElement>('.gal-bar')
    const bar = barEl && getComputedStyle(barEl).position === 'sticky' ? barEl.offsetHeight : 0
    const tabs = document.querySelector<HTMLElement>('.gal-doc-tablist')?.offsetHeight ?? 0
    const inBand = new Set<string>()
    const watch = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) inBand.add(entry.target.id)
          else inBand.delete(entry.target.id)
        }
        if (lock.current) return
        const first = items.find((item) => inBand.has(item.id))
        if (first) setActive(first.id)
      },
      { rootMargin: `-${bar + tabs}px 0px -70% 0px` },
    )
    items.forEach((item) => watch.observe(item.el))
    return () => watch.disconnect()
  }, [items])

  // 还没滚动、或当前节已不在页上时，高亮第一节（渲染时算，不在 effect 里 setState）。
  const shownId = items.length === 0 ? '' : items.some((item) => item.id === active) ? active : items[0].id
  const shownText = items.find((item) => item.id === shownId)?.text ?? ''
  useEffect(() => {
    onActive?.(shownText)
  }, [shownText, onActive])
  useEffect(() => () => onActive?.(''), [onActive])
  if (items.length === 0) return null
  return (
    <nav className="gal-toc" aria-label="本页">
      <p className="gal-toc-title">本页</p>
      <ul>
        {items.map((item) => (
          <li key={item.id} data-level={item.level}>
            <button
              type="button"
              aria-current={item.id === shownId ? 'location' : undefined}
              onClick={() => {
                setActive(item.id)
                // 平滑滚动期间不让高亮跟着中途经过的节跳。
                lock.current = true
                item.el.scrollIntoView({ behavior: 'smooth', block: 'start' })
                window.setTimeout(() => (lock.current = false), 700)
              }}
            >
              {item.text}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  )
}
