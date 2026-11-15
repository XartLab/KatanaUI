// SPDX-License-Identifier: MIT
import { ChevronDown } from 'lucide-react'
import { createContext, useContext, useId, useState, type ComponentProps, type ReactNode } from 'react'
import { cn } from '../../lib/cn.ts'
import { Led, type LinkGroup } from '../../katana/led.tsx'
import { Skeleton } from '../../katana/skeleton.tsx'
import { EmptyState } from '../empty-state.tsx'

// 面板壳（#1901，原应用 workspace/PaneFrame 的外壳部分）：所有工作台面板共用的外框——标题栏（联动色点、标题、品种标签、工具条、右侧动作）、
// 内容区、可折叠、焦点四角括号。组件卡 PanelFrame：面板自己不画边框与阴影，只用这个壳。
// 包里不知道工作区模型：拖动重排、关闭、右键菜单、改名这些由宿主经 props / 子元素 / 展开到 header 的属性接上
// （header 的其余属性展开到 <header>，宿主可以拿 Radix 的 ContextMenuTrigger asChild 包它）。
// 结构照 VS Code 的 view container（标题栏 + 动作 + 可折叠）与 ATAS 面板头。

type FrameContext = { collapsed: boolean; toggle: () => void; bodyId: string }
const Frame = createContext<FrameContext | null>(null)

export type PanelFrameSlot = 'root' | 'header' | 'title' | 'object' | 'actions' | 'brackets' | 'body'

export type PanelFrameProps = Omit<ComponentProps<'section'>, 'onToggle'> & {
  /** 焦点面板：标题文字提亮，其余面板标题退后（三层对比）。 */
  focused?: boolean
  /** 画四角括号（大屏模式下的焦点面板；什么时候算「大屏」是宿主的事）。 */
  brackets?: boolean
  /** 折叠：只剩标题栏。受控；不传 collapsed 时用 defaultCollapsed 自己管。 */
  collapsed?: boolean
  defaultCollapsed?: boolean
  onCollapsedChange?: (collapsed: boolean) => void
  /** 宿主要给各部分挂自己的类名时用（应用的旧类名钩子）。 */
  classNames?: Partial<Record<PanelFrameSlot, string>>
}

export function PanelFrame({
  focused = false,
  brackets = false,
  collapsed: controlled,
  defaultCollapsed = false,
  onCollapsedChange,
  classNames = {},
  className,
  children,
  ...rest
}: PanelFrameProps) {
  const [own, setOwn] = useState(defaultCollapsed)
  const collapsed = controlled ?? own
  const bodyId = useId()
  const toggle = () => {
    if (controlled === undefined) setOwn(!collapsed)
    onCollapsedChange?.(!collapsed)
  }
  return (
    <Frame.Provider value={{ collapsed, toggle, bodyId }}>
      <section
        {...rest}
        data-slot="panel-frame"
        data-focused={focused ? '' : undefined}
        data-collapsed={collapsed ? '' : undefined}
        className={cn('k-panel', focused && 'is-focused', classNames.root, className)}
      >
        {children}
        {brackets && (
          <span className={cn('k-panel-brackets', classNames.brackets)} aria-hidden="true">
            <i />
            <i />
            <i />
            <i />
          </span>
        )}
      </section>
    </Frame.Provider>
  )
}

export type PanelFrameHeaderProps = ComponentProps<'header'> & {
  /** 标题（h2）。不传就没有标题行（空格子）。不叫 title：那是 header 自己的悬停提示属性，照常透传。 */
  heading?: ReactNode
  /** 标题只给读屏、不画出来（工具条占着标题栏时）。 */
  headingHidden?: boolean
  /** 标题后的当前对象（品种、过滤条件），等宽小字。 */
  object?: ReactNode
  /** 联动组的色点：给组名画那一组的颜色；null 画熄灭的环；不传不画。 */
  linkGroup?: LinkGroup | null
  /** 色点的名字（读屏念，包里没有文字）。有 linkGroup 时必填。 */
  linkLabel?: string
  /** 固定（不跟随联动）：色点变空心圆。 */
  pinned?: boolean
  /** 标题后的局部工具条。 */
  toolbar?: ReactNode
  /** 右侧动作槽（设置、最大化、关闭这类图标按钮；不超过三个，更多进设置）。 */
  actions?: ReactNode
  /** 画折叠按钮；两个名字由调用方传。 */
  collapsible?: boolean
  collapseLabel?: string
  expandLabel?: string
  classNames?: Partial<Record<PanelFrameSlot, string>>
}

export function PanelFrameHeader({
  heading,
  headingHidden = false,
  object,
  linkGroup,
  linkLabel = '',
  pinned = false,
  toolbar,
  actions,
  collapsible = false,
  collapseLabel,
  expandLabel,
  classNames = {},
  className,
  children,
  ...rest
}: PanelFrameHeaderProps) {
  const frame = useContext(Frame)
  const collapsed = frame?.collapsed ?? false
  return (
    <header
      {...rest}
      data-slot="panel-frame-header"
      className={cn('k-panel-header', toolbar && 'has-toolbar', classNames.header, className)}
    >
      {collapsible && frame && (
        <button
          type="button"
          className="k-panel-collapse"
          aria-expanded={!collapsed}
          aria-controls={frame.bodyId}
          aria-label={collapsed ? expandLabel : collapseLabel}
          onClick={frame.toggle}
        >
          <ChevronDown aria-hidden="true" />
        </button>
      )}
      {linkGroup !== undefined && (
        <span className="k-panel-link">
          <Led group={linkGroup} hollow={pinned && linkGroup !== null} bare={linkGroup === null} label={linkLabel} />
        </span>
      )}
      {/* 标题的样子用 `.k-panel-header > h2` 选，不挂类名：宿主给了 classNames.title 就只有宿主的类（应用的单测与样式按它找）；隐藏时没给类名就用 sr-only。 */}
      {heading ? <h2 className={classNames.title ?? (headingHidden ? 'sr-only' : undefined)}>{heading}</h2> : null}
      {object ? <span className={cn('k-panel-object', classNames.object)}>{object}</span> : null}
      {toolbar}
      {children}
      {actions ? <div className={cn('k-panel-actions', classNames.actions)}>{actions}</div> : null}
    </header>
  )
}

export type PanelFrameState = 'ready' | 'loading' | 'empty' | 'disconnected'

export type PanelFrameBodyProps = ComponentProps<'div'> & {
  /** 内容区的状态：ready 画 children；loading 画骨架；empty、disconnected 画空态（不画假数据）。 */
  state?: PanelFrameState
  /** loading 时骨架的名字（读屏念，包里没有文字）。 */
  loadingLabel?: string
  /** empty、disconnected 时空态的文字与动作；同一个面板两种状态各传各的。 */
  view?: { tag?: string; title: string; description?: ReactNode; actions?: ReactNode }
}

export function PanelFrameBody({
  state = 'ready',
  loadingLabel = '',
  view,
  className,
  children,
  ...rest
}: PanelFrameBodyProps) {
  const frame = useContext(Frame)
  return (
    <div
      hidden={frame?.collapsed || undefined}
      {...rest}
      id={rest.id ?? frame?.bodyId}
      data-slot="panel-frame-body"
      data-state={state}
      className={cn('k-panel-body', className)}
    >
      {state === 'ready' ? (
        children
      ) : state === 'loading' ? (
        <Skeleton label={loadingLabel} lines={6} />
      ) : view ? (
        <EmptyState tag={view.tag} title={view.title} actions={view.actions}>
          {view.description}
        </EmptyState>
      ) : null}
    </div>
  )
}
