// SPDX-License-Identifier: MIT
// 浮层从 Radix 换成 UI SDK（#263）后，对外仍保持 Radix 的写法（KATANAview 与文档站都在用）：asChild、onOpenAutoFocus / onCloseAutoFocus、
// onEscapeKeyDown / onPointerDownOutside / onFocusOutside / onInteractOutside。这里把它们翻成 UI SDK 的 render、initialFocus / finalFocus、onOpenChange 的 details。
import { mergeProps } from '@ui-sdk/react/primitive'
import {
  cloneElement,
  createContext,
  createElement,
  isValidElement,
  useEffect,
  useState,
  type ElementType,
  type ReactElement,
  type ReactNode,
} from 'react'

/**
 * 部件的 render：写回我们原来的 data-slot（UI SDK 自带的会盖掉它），asChild 时把子元素当宿主（等于 Radix 的 Slot）。
 * asChild 的子元素自己的 props 与部件的 props 合并（子元素的处理函数先跑，className 拼接），子元素自己的 children 保留。
 */
export function partRender(name: string, tag: ElementType, asChild?: boolean, children?: ReactNode) {
  const child = asChild && isValidElement(children) ? (children as ReactElement<Record<string, unknown>>) : undefined
  return (props: Record<string, unknown>) =>
    child
      ? cloneElement(child, mergeProps(props, child.props, { 'data-slot': child.props['data-slot'] ?? name }))
      : createElement(tag, { ...props, 'data-slot': name })
}

/** asChild 时部件不再渲染我们传的 children（子元素自己带着），否则原样传。 */
export const childrenOf = (asChild: boolean | undefined, children: ReactNode) =>
  asChild && isValidElement(children) ? undefined : children

/** Radix 的事件对象：preventDefault 后浮层不关 / 焦点不动。 */
export type CompatEvent<E extends Event = Event> = E & { detail?: { originalEvent?: Event } }

export type ContentHandlers = {
  onEscapeKeyDown?: (event: KeyboardEvent) => void
  onPointerDownOutside?: (event: Event) => void
  onFocusOutside?: (event: Event) => void
  onInteractOutside?: (event: Event) => void
}

/** 内容登记的 Radix 式关闭回调存在这里，根在 onOpenChange 里读。 */
export type HandlerStore = { get: () => ContentHandlers; set: (handlers: ContentHandlers) => void }

export const HandlersContext = createContext<HandlerStore | null>(null)

export function useHandlerStore(): HandlerStore {
  const [store] = useState<HandlerStore>(() => {
    let current: ContentHandlers = {}
    return { get: () => current, set: (handlers) => (current = handlers) }
  })
  return store
}

/** 内容挂载后把自己的关闭回调登记给根；卸载时撤掉。 */
export function useRegisterHandlers(store: HandlerStore | null, handlers: ContentHandlers) {
  const { onEscapeKeyDown, onPointerDownOutside, onFocusOutside, onInteractOutside } = handlers
  useEffect(() => {
    store?.set({ onEscapeKeyDown, onPointerDownOutside, onFocusOutside, onInteractOutside })
    return () => store?.set({})
  }, [store, onEscapeKeyDown, onPointerDownOutside, onFocusOutside, onInteractOutside])
}

const fake = (type: string, original?: Event) => {
  const event = new Event(type, { cancelable: true }) as CompatEvent
  Object.defineProperty(event, 'detail', { value: { originalEvent: original } })
  if (original) Object.defineProperty(event, 'target', { value: original.target })
  return event
}

/** 关闭是不是被 Radix 式回调拦下了（preventDefault）。不是这几种关闭原因的，放行。 */
export function allowsClose(
  handlers: ContentHandlers | undefined,
  details: { reason: string; event?: Event },
): boolean {
  if (!handlers) return true
  const run = (list: (((event: never) => void) | undefined)[], type: string) => {
    const event = fake(type, details.event)
    for (const handler of list) handler?.(event as never)
    return !event.defaultPrevented
  }
  if (details.reason === 'escape-key') return run([handlers.onEscapeKeyDown], 'dismissableLayer.escape')
  if (details.reason === 'outside-press')
    return run([handlers.onPointerDownOutside, handlers.onInteractOutside], 'dismissableLayer.pointerDownOutside')
  if (details.reason === 'focus-out')
    return run([handlers.onFocusOutside, handlers.onInteractOutside], 'dismissableLayer.focusOutside')
  return true
}

const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]):not([type=hidden]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'

/**
 * onOpenAutoFocus / onCloseAutoFocus（Radix：事件上 preventDefault 就不移焦点）翻成 UI SDK 的 initialFocus / finalFocus。
 * 没传回调就不给（用 UI SDK 的默认：第一个可聚焦元素 / 回到触发钮）。ref 要挂到内容元素上。
 */
export function useFocusCompat({
  onOpenAutoFocus,
  onCloseAutoFocus,
}: {
  onOpenAutoFocus?: (event: Event) => void
  onCloseAutoFocus?: (event: Event) => void
}) {
  const [content, setContent] = useState<HTMLDivElement | null>(null)
  const open = onOpenAutoFocus
  const close = onCloseAutoFocus
  return {
    attach: setContent,
    initialFocus: open
      ? () => {
          const event = fake('focusScope.autoFocusOnMount')
          open(event)
          // UI SDK 的函数返回空就聚焦内容本身；要「不挪」只能返回现在拿着焦点的元素。
          if (event.defaultPrevented)
            return document.activeElement instanceof HTMLElement ? document.activeElement : null
          return content?.querySelector<HTMLElement>(FOCUSABLE) ?? content
        }
      : undefined,
    finalFocus: close
      ? () => {
          const event = fake('focusScope.autoFocusOnUnmount')
          close(event)
          if (!event.defaultPrevented) return undefined
          // 回调自己挪了焦点就认它挪到的地方；没挪就留在原地。
          const active = document.activeElement
          return active instanceof HTMLElement && active !== document.body ? active : null
        }
      : undefined,
  }
}

/**
 * 根的 onOpenChange：Radix 式回调（onEscapeKeyDown 等，由内容登记）拦下的关闭不往外报，也不执行。
 * 受控时靠「不往外报」保持打开，非受控靠 details.cancel()。
 */
export function useCompatRoot(onOpenChange?: (open: boolean) => void) {
  const handlers = useHandlerStore()
  return {
    handlers,
    onOpenChange: (open: boolean, details: { reason: string; event?: Event; cancel: () => void }) => {
      if (!open && !allowsClose(handlers.get(), details)) {
        details.cancel()
        return
      }
      onOpenChange?.(open)
    },
  }
}

/** Radix 式内容口子的类型：焦点与关闭回调、asChild、forceMount。 */
export type CompatContent = ContentHandlers & {
  /** Called when focus moves into the content; preventDefault keeps focus where it is. */
  onOpenAutoFocus?: (event: Event) => void
  /** Called when focus returns on close; preventDefault keeps focus where it is. */
  onCloseAutoFocus?: (event: Event) => void
  /** Keep the content in the page while closed (hidden). */
  forceMount?: true
  /** Merge the content's props onto its only child. */
  asChild?: boolean
}
