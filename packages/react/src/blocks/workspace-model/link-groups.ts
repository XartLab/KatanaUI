// SPDX-License-Identifier: MIT
// 联动组（#107 第 4 层）的纯模型：同一组（一种颜色）里的面板共用品种、周期、十字线时间这类参数，一个面板改了，同组里收这个参数的面板都跟着。
// 不在任何组里的面板各管各的。做法参照 Bloomberg Launchpad 的颜色组与 TradingView 多图布局的同步开关（只取行为），实现原创。
import type { ComponentManifest, LinkParam } from './component-manifest.ts'

export type LinkGroupsState = {
  /** 每个组现在的参数值：组 id → 参数 → 值。 */
  groups: Readonly<Record<string, Readonly<Record<string, string>>>>
  /** 每个面板在哪个组；不在这张表里或值是 null 就是没联动。 */
  members: Readonly<Record<string, string | null>>
  /** 没联动的面板自己的参数值：面板 id → 参数 → 值。 */
  own: Readonly<Record<string, Readonly<Record<string, string>>>>
}

export const emptyLinkState: LinkGroupsState = { groups: {}, members: {}, own: {} }

/** 这个面板现在该用的参数值：在组里读组的，不在组里读自己的。 */
export function linkValues(state: LinkGroupsState, panelId: string): Readonly<Record<string, string>> {
  const group = state.members[panelId]
  return (group ? state.groups[group] : state.own[panelId]) ?? {}
}

/** 一个面板改了某个参数：在组里就改组的值（同组的都会读到），不在组里只改它自己的。 */
export function setLinkParam(
  state: LinkGroupsState,
  panelId: string,
  param: LinkParam,
  value: string,
): LinkGroupsState {
  const group = state.members[panelId]
  if (group) return { ...state, groups: { ...state.groups, [group]: { ...state.groups[group], [param]: value } } }
  return { ...state, own: { ...state.own, [panelId]: { ...state.own[panelId], [param]: value } } }
}

/**
 * 把面板放进一个组，或传 null 拿出来。进组：组里已有值就跟组走；组是空的，面板把自己的值带进去当组的初值。
 * 出组：面板带走组当时的值，所以画面不跳。
 */
export function joinLinkGroup(state: LinkGroupsState, panelId: string, group: string | null): LinkGroupsState {
  const current = linkValues(state, panelId)
  const members = { ...state.members, [panelId]: group }
  if (group === null) return { ...state, members, own: { ...state.own, [panelId]: { ...current } } }
  const existing = state.groups[group]
  const seeded = existing && Object.keys(existing).length > 0 ? existing : { ...current }
  return { ...state, members, groups: { ...state.groups, [group]: seeded } }
}

/**
 * 某个面板改了 param 之后，哪些面板要跟着更新：同组、清单里声明收这个参数的，不含发起的那个。
 * panels：面板 id → 它放的组件的清单。
 */
export function linkFollowers(
  state: LinkGroupsState,
  panelId: string,
  param: LinkParam,
  panels: Readonly<Record<string, Pick<ComponentManifest, 'consumes'>>>,
): string[] {
  const group = state.members[panelId]
  if (!group) return []
  return Object.keys(panels).filter(
    (id) => id !== panelId && state.members[id] === group && panels[id]!.consumes?.includes(param) === true,
  )
}
