// SPDX-License-Identifier: MIT
import { useId, useRef, useState, type ReactNode } from 'react'
import { X } from 'lucide-react'
import type { SideNavGroup } from '../src/index'
import { revealCurrent, SideRail } from './SideRail'

// 窄屏（≤ 760px）的目录：固定在底的一条栏，左边「目录」按钮，右边是正在读的节名（省略号截断）；
// 点按钮开一个从底边升起的 <dialog>（showModal，Esc、点外面、点条目、点关闭都关，焦点回到按钮）。
// 照 kubai Vibe Design Tips 008（2026-11-26 读）的窄屏一段，只取结构；弹层的写法照 modern-web-guidance 的 light-dismiss-a-dialog。

export function NavDrawer({
  groups,
  current,
  section,
}: {
  groups: readonly SideNavGroup[]
  current?: string
  /** 正在读的节名。 */
  section: ReactNode
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  const sheet = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const id = useId()
  const show = () => {
    dialog.current?.showModal()
    setOpen(true)
    revealCurrent(sheet.current, 'center')
  }
  return (
    <>
      <div className="gal-dock">
        <button
          type="button"
          className="gal-dock-button"
          aria-haspopup="dialog"
          aria-controls={id}
          aria-expanded={open}
          onClick={show}
        >
          目录
        </button>
        <span className="gal-dock-section">{section}</span>
      </div>
      <dialog
        ref={dialog}
        id={id}
        className="gal-drawer"
        aria-label="文档目录"
        // 原生的点外面关闭（Chrome 134+、Firefox 141+）；Safari 没有，走下面 onClick 的兜底。
        {...{ closedby: 'any' }}
        onClose={() => setOpen(false)}
        onClick={(event) => {
          const dlg = event.currentTarget
          if ((event.target as HTMLElement).closest('a[href]')) return dlg.close()
          if ('closedBy' in HTMLDialogElement.prototype || event.target !== dlg) return
          const box = dlg.getBoundingClientRect()
          const inside =
            box.left <= event.clientX &&
            event.clientX <= box.right &&
            box.top <= event.clientY &&
            event.clientY <= box.bottom
          if (!inside) dlg.close()
        }}
      >
        <div ref={sheet} className="gal-drawer-sheet">
          <div className="gal-drawer-head">
            <b>文档目录</b>
            <button
              type="button"
              className="gal-drawer-close"
              aria-label="关闭目录"
              autoFocus
              onClick={() => dialog.current?.close()}
            >
              <X aria-hidden size={16} />
            </button>
          </div>
          <SideRail groups={groups} current={current} searchHotkey={null} />
        </div>
      </dialog>
    </>
  )
}
