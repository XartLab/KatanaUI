// SPDX-License-Identifier: MIT
import { Maximize2, Minimize2, Settings, X } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '../lib/cn.ts'
import { Led, type LinkGroup } from '../katana/led.tsx'
import { ToolButton } from './toolbar/toolbar.tsx'

// 面板外壳（组件卡 PanelFrame，2026-11-14 读 design/katana-console/project/components/PanelFrame；#7）。
// 底是 KATANAview 工作台现在的面板头（40 高的薄头、标题 ink-300、聚焦面板标题 ink-100、右侧图标钮），不是卡上 32 高的铆钉版；
// 上面加精密仪器语言：面板编号（强调色）、点阵元信息位、来源行位、聚焦时的橙色角括号（橙色只用在角括号与状态灯上）。
// 面板不得自己画边框或阴影，只能用它；标题栏的图标钮不超过 3 个（设置 / 最大化 / 关闭），多的进设置。
// 包里不带语言：标题、对象、读屏名都由调用方传。

export type PanelFrameLabels = {
  /** 外壳 section 的读屏名之外的三个图标钮。 */
  settings: string
  maximize: string
  restore: string
  close: string
}

export type PanelFrameProps = {
  /** 面板编号（01、02……）：强调色点阵字，让同屏的面板认得出谁是谁。 */
  index?: string
  title: string
  /** 当前对象：标题后面的小字，如「核心池 · 24」（前面的「·」由外壳画）。 */
  object?: string
  /** 联动组色标；null 或不给是熄灭。pinned 时画成空心圈（固定，不跟随联动）。 */
  linkGroup?: LinkGroup | null
  linkLabel?: string
  pinned?: boolean
  /** 点阵元信息位：标题行右侧的一小段点阵字（刷新频率、周期之类）。 */
  meta?: string
  /** 局部工具条：放在标题与右侧图标钮之间。 */
  toolbar?: ReactNode
  /** 来源行位：底部一行点阵字（「SOURCE · …」），不给就没有这一行。 */
  source?: ReactNode
  /** 焦点面板：标题 ink-100、其余 ink-300（三层对比），并画角括号（brackets 默认跟着它）。 */
  focused?: boolean
  /** 四角的橙色 L 形括号；默认等于 focused。工作台只在大屏（≥ 1200px）画，件里不判断屏宽，调用方按需传。 */
  brackets?: boolean
  maximized?: boolean
  onSettings?: () => void
  onMaximize?: () => void
  onClose?: () => void
  labels: PanelFrameLabels
  className?: string
  children?: ReactNode
}

export function PanelFrame({
  index,
  title,
  object,
  linkGroup = null,
  linkLabel,
  pinned = false,
  meta,
  toolbar,
  source,
  focused = false,
  brackets = focused,
  maximized = false,
  onSettings,
  onMaximize,
  onClose,
  labels,
  className,
  children,
}: PanelFrameProps) {
  return (
    <section
      className={cn('k-panel', focused && 'is-focused', maximized && 'is-maximized', className)}
      data-slot="panel-frame"
      aria-label={title}
    >
      <header className="k-panel-head" data-slot="panel-head">
        {index === undefined ? null : (
          <span className="k-panel-index" data-slot="panel-index">
            {index}
          </span>
        )}
        {linkLabel === undefined ? null : (
          <Led group={linkGroup} hollow={pinned} bare={linkGroup === null} label={linkLabel} />
        )}
        <h2 className="k-panel-title" data-slot="panel-title">
          {title}
        </h2>
        {object === undefined ? null : (
          <span className="k-panel-object" data-slot="panel-object">
            · {object}
          </span>
        )}
        {toolbar === undefined ? null : <div className="k-panel-toolbar">{toolbar}</div>}
        {meta === undefined ? null : (
          <span className="k-panel-meta" data-slot="panel-meta">
            {meta}
          </span>
        )}
        <div className="k-panel-actions">
          {onSettings && (
            <ToolButton label={labels.settings} onClick={onSettings}>
              <Settings size={14} aria-hidden="true" />
            </ToolButton>
          )}
          {onMaximize && (
            <ToolButton label={maximized ? labels.restore : labels.maximize} onClick={onMaximize}>
              {maximized ? <Minimize2 size={14} aria-hidden="true" /> : <Maximize2 size={14} aria-hidden="true" />}
            </ToolButton>
          )}
          {onClose && (
            <ToolButton label={labels.close} onClick={onClose}>
              <X size={14} aria-hidden="true" />
            </ToolButton>
          )}
        </div>
      </header>
      <div className="k-panel-body" data-slot="panel-body">
        {children}
      </div>
      {source === undefined ? null : (
        <footer className="k-panel-source" data-slot="panel-source">
          {source}
        </footer>
      )}
      {brackets ? (
        <span className="k-panel-brackets" data-slot="panel-brackets" aria-hidden="true">
          <i />
          <i />
          <i />
          <i />
        </span>
      ) : null}
    </section>
  )
}
