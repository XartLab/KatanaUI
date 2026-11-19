// SPDX-License-Identifier: MIT
// 停靠工作区（#107 第 2 层）。引擎是 Dockview（https://github.com/mathuo/dockview ，MIT，© mathuo；用户 2026-11-19 同意加这个依赖）：
// 页签组、把页签拖到上下左右中五个落点分屏或并组、浮窗、最大化、布局存成 JSON 再还原，都是它的；我们不重写。
// 我们加的是上面几层的接法：面板由组件清单（ComponentManifest）定义；页签带状态点与当前对象；页签栏右端只放当前页签那个组件的工具
// （K 线与表各一套，PanelTabs 的做法）；页签栏左端「+」把当前组件的种类带给宿主去开目录；ComponentCatalog 的卡片可以直接拖进来落在任意落点。
// 手感参照 Blender 4.x 的区域停靠（拖动时实时预览落点结果）与一键最大化再还原。
import {
  DockviewReact,
  type DockviewApi,
  type DockviewDidDropEvent,
  type DockviewTheme,
  type IDockviewHeaderActionsProps,
  type IDockviewPanelHeaderProps,
  type IDockviewPanelProps,
  type SerializedDockview,
} from 'dockview-react'
import { Maximize2, Minimize2, PictureInPicture2, Plus, X } from 'lucide-react'
import {
  createContext,
  useContext,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type ReactNode,
  type Ref,
} from 'react'
import { cn } from '../../lib/cn.ts'
import { Button } from '../../primitives/button.tsx'
import { CATALOG_ITEM_MIME } from '../component-catalog/component-catalog.tsx'
import type { PanelTabStatus } from '../panel-tabs/panel-tabs.tsx'
import type { ComponentManifest } from '../workspace-model/component-manifest.ts'

const KATANA_THEME: DockviewTheme = {
  name: 'katana',
  className: 'dockview-theme-katana',
  colorScheme: 'dark',
  gap: 1,
  dndPanelOverlay: 'group',
  dndTabIndicator: 'line',
}

export type DockDirection = 'left' | 'right' | 'above' | 'below' | 'within'

/** 起始布局里的一块：放哪个组件，相对谁、在哪边；不写 beside 就接在上一块所在的组里。 */
export type DockPanelSeed = {
  component: string
  /** Panel id; defaults to the component id (give one to place the same component twice). */
  id?: string
  /** Panel id this one is placed against. */
  beside?: string
  direction?: DockDirection
  /** Starting size in px along the split. */
  size?: number
}

/** 页签上随数据变的东西：状态点、当前对象、角标。宿主按面板 id 给。 */
export type DockPanelMeta = { status?: PanelTabStatus; context?: string; badge?: string }

export type DockWorkspaceLabels = {
  /** Accessible name of the + in a group's tab bar. */
  add: string
  /** Accessible name of a tab's close button, with {name}. */
  close: string
  maximize: string
  restore: string
  float: string
  /** Accessible name of the active component's tools group, with {name}. */
  tools: string
  status?: Partial<Record<PanelTabStatus, string>>
}

export type DockWorkspaceHandle = {
  /** The Dockview API, for anything not wrapped here (null before the layout is ready). */
  api: DockviewApi | null
  /** Adds a component: into `groupOf`'s group, or beside it in `direction`; with neither, into the active group. */
  add: (component: string, where?: { groupOf?: string; direction?: DockDirection }) => string | undefined
  /** Ids of the components currently placed. */
  placed: () => string[]
  /** Throws the layout away and rebuilds the default one. */
  reset: () => void
  /** The layout as JSON, for saving. */
  save: () => SerializedDockview | undefined
}

type Shared = {
  manifests: ReadonlyMap<string, ComponentManifest>
  render: (component: string, panelId: string) => ReactNode
  tools?: (component: string, panelId: string) => ReactNode
  meta?: (panelId: string, component: string) => DockPanelMeta | undefined
  onRequestAdd?: (panelId: string | undefined, kind: string | undefined) => void
  labels: DockWorkspaceLabels
}
const Context = createContext<Shared | null>(null)
const useShared = () => useContext(Context)!

type Params = { component: string }

function DockPanel({ api, params }: IDockviewPanelProps<Params>) {
  const { render } = useShared()
  return (
    <div data-slot="dock-panel" data-component={params.component} className="k-text-body size-full overflow-auto">
      {render(params.component, api.id)}
    </div>
  )
}

function DockTab({ api, params }: IDockviewPanelHeaderProps<Params>) {
  const { manifests, meta, labels } = useShared()
  const manifest = manifests.get(params.component)
  const name = manifest?.name ?? api.title ?? params.component
  const info = meta?.(api.id, params.component)
  return (
    <span className="k-dock-tab" data-slot="dock-tab" data-component={params.component}>
      {info?.status ? (
        <span
          className="k-dock-tab-dot"
          data-status={info.status}
          role="img"
          aria-label={labels.status?.[info.status]}
        />
      ) : null}
      <span>{name}</span>
      {info?.context ? <span className="k-dock-tab-context">{info.context}</span> : null}
      {info?.badge ? <span className="k-dock-tab-badge">{info.badge}</span> : null}
      <button
        type="button"
        className="k-dock-tab-close"
        aria-label={labels.close.replace('{name}', name)}
        // 页签本身可拖：按在「×」上不该开始拖动。
        onPointerDown={(event) => event.stopPropagation()}
        onClick={(event) => {
          event.stopPropagation()
          api.close()
        }}
      >
        <X aria-hidden="true" />
      </button>
    </span>
  )
}

function LeftActions({ activePanel }: IDockviewHeaderActionsProps) {
  const { manifests, onRequestAdd, labels } = useShared()
  if (!onRequestAdd) return null
  const component = (activePanel?.params as Params | undefined)?.component
  return (
    <div className="k-dock-actions">
      <Button
        size="icon"
        variant="icon"
        aria-label={labels.add}
        data-slot="dock-add"
        onClick={() => onRequestAdd(activePanel?.id, component ? manifests.get(component)?.kind : undefined)}
      >
        <Plus aria-hidden="true" />
      </Button>
    </div>
  )
}

function RightActions({ activePanel, api, containerApi, group }: IDockviewHeaderActionsProps) {
  const { manifests, tools, labels } = useShared()
  const [maximized, setMaximized] = useState(api.isMaximized())
  useEffect(() => {
    const subscription = containerApi.onDidMaximizedGroupChange(() => setMaximized(api.isMaximized()))
    return () => subscription.dispose()
  }, [api, containerApi])
  const component = (activePanel?.params as Params | undefined)?.component
  const own = component && activePanel ? tools?.(component, activePanel.id) : null
  return (
    <div className="k-dock-actions">
      {own ? (
        <div
          className="k-dock-tools"
          role="group"
          data-slot="dock-tools"
          aria-label={labels.tools.replace('{name}', manifests.get(component!)?.name ?? '')}
        >
          {own}
        </div>
      ) : null}
      {api.location.type === 'grid' ? (
        <Button
          size="icon"
          variant="icon"
          aria-label={labels.float}
          data-slot="dock-float"
          onClick={() => containerApi.addFloatingGroup(group)}
        >
          <PictureInPicture2 aria-hidden="true" />
        </Button>
      ) : null}
      <Button
        size="icon"
        variant="icon"
        aria-label={maximized ? labels.restore : labels.maximize}
        data-slot="dock-maximize"
        onClick={() => (maximized ? api.exitMaximized() : api.maximize())}
      >
        {maximized ? <Minimize2 aria-hidden="true" /> : <Maximize2 aria-hidden="true" />}
      </Button>
    </div>
  )
}

const COMPONENTS = { katana: DockPanel }
const FROM_DROP = { top: 'above', bottom: 'below', left: 'left', right: 'right', center: 'within' } as const

/** Docking workspace: tab groups you split by dragging, float, maximise and save, with panels defined by component manifests. */
export function DockWorkspace({
  ref,
  manifests,
  render,
  tools,
  meta,
  defaultPanels,
  layout,
  onLayoutChange,
  onPlacedChange,
  onRequestAdd,
  labels,
  className,
}: {
  /** Imperative handle: add, reset, save and the raw Dockview API. */
  ref?: Ref<DockWorkspaceHandle>
  /** Everything that can be placed; panels are created from these by id. */
  manifests: readonly ComponentManifest[]
  /** Draws a component's content. */
  render: (component: string, panelId: string) => ReactNode
  /** Draws a component's own tools, shown in its group's tab bar while its tab is selected. */
  tools?: (component: string, panelId: string) => ReactNode
  /** Live tab details per panel: status dot, current object, badge. */
  meta?: (panelId: string, component: string) => DockPanelMeta | undefined
  /** The layout used at first and after reset. */
  defaultPanels: readonly DockPanelSeed[]
  /** A saved layout to restore instead of the default; falls back to the default if it cannot be read. */
  layout?: SerializedDockview
  /** Called with the layout JSON whenever it changes. */
  onLayoutChange?: (layout: SerializedDockview) => void
  /** Called with the component ids currently placed whenever panels are added or removed. */
  onPlacedChange?: (components: string[]) => void
  /** Called when a group's + is clicked, with the active panel id and its component kind; leave out to hide the +. */
  onRequestAdd?: (panelId: string | undefined, kind: string | undefined) => void
  /** Accessible names. */
  labels: DockWorkspaceLabels
  /** Extra class name on the workspace. */
  className?: string
}) {
  const dock = useRef<DockviewApi | null>(null)
  const byId = new Map(manifests.map((manifest) => [manifest.id, manifest]))
  const latest = useRef({ byId, defaultPanels, onLayoutChange, onPlacedChange })
  useEffect(() => {
    latest.current = { byId, defaultPanels, onLayoutChange, onPlacedChange }
  })

  const placed = () => (dock.current?.panels ?? []).map((panel) => (panel.params as Params).component)

  const add: DockWorkspaceHandle['add'] = (component, where) => {
    const api = dock.current
    const manifest = latest.current.byId.get(component)
    if (!api || !manifest) return undefined
    // 只该有一个的组件已经在了：不再加，切过去。
    const existing = api.panels.find((panel) => (panel.params as Params).component === component)
    if (existing && manifest.singleton) {
      existing.api.setActive()
      return existing.id
    }
    let id = component
    for (let n = 2; api.getPanel(id); n++) id = `${component}-${n}`
    const reference = where?.groupOf ?? api.activePanel?.id
    api.addPanel<Params>({
      id,
      component: 'katana',
      title: manifest.name,
      params: { component },
      minimumWidth: manifest.minSize?.width,
      minimumHeight: manifest.minSize?.height,
      ...(reference && api.getPanel(reference)
        ? { position: { referencePanel: reference, direction: where?.direction ?? 'within' } }
        : {}),
    })
    return id
  }

  const build = (api: DockviewApi) => {
    api.clear()
    let previous: string | undefined
    for (const seed of latest.current.defaultPanels) {
      const manifest = latest.current.byId.get(seed.component)
      if (!manifest) continue
      const id = seed.id ?? seed.component
      const reference = seed.beside ?? previous
      const direction = seed.beside ? (seed.direction ?? 'right') : 'within'
      const along = direction === 'left' || direction === 'right' ? 'initialWidth' : 'initialHeight'
      api.addPanel<Params>({
        id,
        component: 'katana',
        title: manifest.name,
        params: { component: seed.component },
        minimumWidth: manifest.minSize?.width,
        minimumHeight: manifest.minSize?.height,
        ...(seed.size && direction !== 'within' ? { [along]: seed.size } : {}),
        ...(reference ? { position: { referencePanel: reference, direction } } : {}),
      })
      previous = id
    }
  }

  useImperativeHandle(ref, () => ({
    get api() {
      return dock.current
    },
    add,
    placed,
    reset: () => dock.current && build(dock.current),
    save: () => dock.current?.toJSON(),
  }))

  const shared: Shared = { manifests: byId, render, tools, meta, onRequestAdd, labels }

  return (
    <Context.Provider value={shared}>
      <DockviewReact
        className={cn('size-full', className)}
        theme={KATANA_THEME}
        components={COMPONENTS}
        defaultTabComponent={DockTab}
        leftHeaderActionsComponent={LeftActions}
        rightHeaderActionsComponent={RightActions}
        onReady={({ api }) => {
          dock.current = api
          const report = () => {
            latest.current.onLayoutChange?.(api.toJSON())
            latest.current.onPlacedChange?.(api.panels.map((panel) => (panel.params as Params).component))
          }
          api.onDidLayoutChange(report)
          // 目录里拖来的卡片（CATALOG_ITEM_MIME）也接：别的拖放不认。
          api.onUnhandledDragOver((event) => {
            const transfer = 'dataTransfer' in event.nativeEvent ? event.nativeEvent.dataTransfer : null
            if (transfer?.types.includes(CATALOG_ITEM_MIME)) event.accept()
          })
          let restored = false
          if (layout) {
            try {
              api.fromJSON(layout)
              restored = true
            } catch {
              // 存下来的布局读不了（组件改名、版本不对）：退回默认布局，不留半截。
              restored = false
            }
          }
          if (!restored) build(api)
          report()
        }}
        onDidDrop={(event: DockviewDidDropEvent) => {
          const transfer = 'dataTransfer' in event.nativeEvent ? event.nativeEvent.dataTransfer : null
          const component = transfer?.getData(CATALOG_ITEM_MIME)
          if (!component) return
          const reference = event.group?.activePanel?.id
          add(component, reference ? { groupOf: reference, direction: FROM_DROP[event.position] } : undefined)
        }}
      />
    </Context.Provider>
  )
}
