// SPDX-License-Identifier: MIT
// 文档页的属性表数据：新结构读 props.generated.json（pnpm docs:props 从 TS 类型生成），旧结构读页上手写的表（#1902 过渡，见 registry.ts）。
import generated from './props.generated.json'
import type { DocPage } from './registry'

export type PropDoc = { name: string; type: string; required: boolean; default?: string; description: string }
export type ExportDoc = { kind: 'component' | 'function' | 'type' | 'value'; source: string; props: readonly PropDoc[] }
export type ResolvedPart = { part: string; note?: string; rows: readonly PropDoc[] }

export const GENERATED: Readonly<Record<string, ExportDoc>> = generated.exports as Record<string, ExportDoc>

/** 一页要显示的属性表：有 propParts 读生成的（优先），没有就退到手写的旧表。 */
export function resolveParts(page: DocPage): readonly ResolvedPart[] {
  if (page.propParts) {
    return page.propParts.map((item) => ({
      part: item.part,
      note: item.note,
      rows: GENERATED[item.symbol ?? item.part]?.props ?? [],
    }))
  }
  return (page.props ?? []).map((table) => ({
    part: table.part,
    note: table.note,
    rows: table.rows.map((row) => ({
      name: row.name,
      type: row.type,
      required: false,
      default: row.default,
      description: row.desc,
    })),
  }))
}
