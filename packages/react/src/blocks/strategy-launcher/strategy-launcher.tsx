// SPDX-License-Identifier: MIT
// 策略入口（工具）：顶上一条可关的风险提示，下面一列入口卡：图标、名字、可选「New」角标、标签串、右箭头；点卡回调 onOpen(id)。
// 功能参照 OKX 永续交易页的「工具」组件（2026-11-26 在用户的 Chrome 里打开看的：风险提示条加六张策略入口卡，每张有图标、名字、三四个标签、右箭头）。实现原创。
// 件只管「列出入口、点了告诉宿主」：入口指向什么（下单策略、运行中心、网格、信号）由宿主定，OKX 的网格、马丁格尔、流动性市场是它自家产品，这里不带任何一个。
// 卡是原生按钮（列表 + 按钮语义），Tab 逐张走、Enter / 空格打开；风险提示的文字与关闭由调用方控制：给了 notice 才画，点关闭记在件里并回调 onNoticeDismiss。
// 皮肤在 ../../theme/strategy-launcher.css；风险提示是 Alert（warn，role=note：页面里一直在的，不是动态弹出的）。颜色只读 characteristics。
import { ChevronRight, TriangleAlert, X } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Tag } from '../../katana/tag.tsx'
import { cn } from '../../lib/cn.ts'
import { focusRingInset } from '../../lib/focus.ts'
import { Alert, AlertDescription } from '../../primitives/alert.tsx'
import { Button } from '../../primitives/button.tsx'

/** One entry card. */
export type StrategyEntry = {
  /** Stable id passed to onOpen. */
  id: string
  /** Name of the strategy or tool. */
  name: string
  /** Icon node in a 32px tile; decorative, give it aria-hidden. */
  icon?: ReactNode
  /** Draws the New badge after the name. */
  isNew?: boolean
  /** Short tags under the name (three or four words each at most). */
  tags?: readonly string[]
}

export type StrategyLauncherLabels = {
  /** Accessible name of the whole launcher. */
  region: string
  /** Accessible name of the risk notice's close button. */
  dismiss: string
  /** Text of the New badge. */
  new: string
}

export type StrategyLauncherProps = {
  /** The entry cards, in order. */
  entries: readonly StrategyEntry[]
  /** Called with the entry id when a card is clicked or opened with Enter or Space. */
  onOpen: (id: string) => void
  /** Risk notice above the cards; nothing is drawn when omitted or after it is closed. */
  notice?: ReactNode
  /** Called when the risk notice is closed. */
  onNoticeDismiss?: () => void
  /** How tags are drawn: joined with " / " in one line (default) or as small outlined tags. */
  tagStyle?: 'text' | 'chips'
  /** Accessible names and the New badge text. */
  labels: StrategyLauncherLabels
  /** Extra class name on the root. */
  className?: string
}

/** Strategy launcher: a dismissible risk notice over a column of entry cards that each open something the host chooses. */
export function StrategyLauncher({
  entries,
  onOpen,
  notice,
  onNoticeDismiss,
  tagStyle = 'text',
  labels,
  className,
}: StrategyLauncherProps) {
  const [dismissed, setDismissed] = useState(false)
  return (
    <section aria-label={labels.region} data-slot="strategy-launcher" className={cn('k-launcher', className)}>
      {notice && !dismissed ? (
        <Alert tone="warn" role="note" data-slot="launcher-notice" className="k-launcher-notice">
          <TriangleAlert aria-hidden="true" />
          <AlertDescription>{notice}</AlertDescription>
          <Button
            variant="icon"
            size="icon"
            aria-label={labels.dismiss}
            data-slot="launcher-dismiss"
            className="k-launcher-dismiss"
            onClick={() => {
              setDismissed(true)
              onNoticeDismiss?.()
            }}
          >
            <X aria-hidden="true" />
          </Button>
        </Alert>
      ) : null}
      <ul className="k-launcher-list">
        {entries.map((entry) => (
          <li key={entry.id}>
            <button
              type="button"
              data-slot="launcher-entry"
              data-id={entry.id}
              className={cn('k-launcher-entry', focusRingInset)}
              onClick={() => onOpen(entry.id)}
            >
              {entry.icon ? (
                <span className="k-launcher-icon" aria-hidden="true">
                  {entry.icon}
                </span>
              ) : null}
              <span className="k-launcher-body">
                <span className="k-launcher-name">
                  {entry.name}
                  {entry.isNew ? (
                    <Tag tone="ok" size="sm" data-slot="launcher-new">
                      {labels.new}
                    </Tag>
                  ) : null}
                </span>
                {entry.tags?.length ? (
                  tagStyle === 'chips' ? (
                    <span className="k-launcher-tags" data-style="chips">
                      {entry.tags.map((tag) => (
                        <Tag key={tag} size="sm" outlined>
                          {tag}
                        </Tag>
                      ))}
                    </span>
                  ) : (
                    <span className="k-launcher-tags">{entry.tags.join(' / ')}</span>
                  )
                ) : null}
              </span>
              <ChevronRight className="k-launcher-chevron" aria-hidden="true" />
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
