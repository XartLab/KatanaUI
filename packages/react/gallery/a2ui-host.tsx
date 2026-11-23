// SPDX-License-Identifier: MIT
// A2UI 演示的宿主一侧：造 MessageProcessor、渲染 surface、把收到的 Action 交给调用方。@a2ui 的东西都在这里，由 usage/A2uiCatalogUsage 懒加载。
import { A2uiSurface, type ReactCatalogComponent } from '@a2ui/react'
import { MessageProcessor } from '@a2ui/web_core'
import { useEffect, useState } from 'react'
import { katanaCatalog } from '../src/a2ui'

export type Received = { name: string; sourceComponentId: string; context: Record<string, unknown>; metadata?: unknown }

export default function HostSurface({
  messages,
  onAction,
}: {
  messages: readonly unknown[]
  onAction: (action: Received) => void
}) {
  const [processor] = useState(() => {
    const next = new MessageProcessor<ReactCatalogComponent>([katanaCatalog])
    next.processMessages(messages as never)
    return next
  })
  const [surfaces, setSurfaces] = useState(() => [...processor.model.surfacesMap.values()])
  useEffect(() => {
    const sync = () => setSurfaces([...processor.model.surfacesMap.values()])
    const created = processor.onSurfaceCreated(sync)
    const deleted = processor.onSurfaceDeleted(sync)
    const action = processor.model.onAction.subscribe((payload) => onAction(payload))
    return () => {
      created.unsubscribe()
      deleted.unsubscribe()
      action.unsubscribe()
    }
  }, [processor, onAction])
  return (
    <>
      {surfaces.map((surface) => (
        <A2uiSurface key={surface.id} surface={surface} />
      ))}
    </>
  )
}
