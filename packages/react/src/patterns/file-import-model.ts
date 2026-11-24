// SPDX-License-Identifier: MIT
import type { Severity } from '../lib/severity.ts'

// 资料导入（FileImport，#226）的纯函数：一行文件是什么类型、什么语气、整张清单的计数、粘贴的链接合不合法。
// 上传本身（网络、重试的次数、进度怎么来）是调用方的事；件只显示它给的状态。

/** 一个文件在导入里的状态：排队、上传中、完成、失败。 */
export type ImportStatus = 'queued' | 'uploading' | 'done' | 'failed'

/** 导入清单里的一行。 */
export type ImportItem = {
  /** 稳定的键，回调（重试、移除）带它回来。 */
  id: string
  /** 显示的名字，粘贴的文字或链接也给个名字。 */
  name: string
  /** 字节数；不知道（链接、粘贴）就不给。 */
  size?: number
  status: ImportStatus
  /** 上传进度 0–100，只在 uploading 时看；不给是「不知道多少」，进度条走不确定态。 */
  progress?: number
  /** 失败的原因（一句话），写在名字下面。 */
  error?: string
}

/** 文件类型的大类，决定行首的图标：研报与文档、表格（CSV、Excel）、数据（parquet、json）、文字、别的。 */
export type FileKind = 'pdf' | 'sheet' | 'data' | 'text' | 'link' | 'other'

const KIND_OF_EXT: Readonly<Record<string, FileKind>> = {
  pdf: 'pdf',
  doc: 'pdf',
  docx: 'pdf',
  csv: 'sheet',
  tsv: 'sheet',
  xls: 'sheet',
  xlsx: 'sheet',
  parquet: 'data',
  arrow: 'data',
  feather: 'data',
  json: 'data',
  ndjson: 'data',
  txt: 'text',
  md: 'text',
}

/** 按扩展名认类型；链接（http 开头的名字）是 link，认不出是 other。 */
export function fileKind(name: string): FileKind {
  if (/^https?:\/\//i.test(name)) return 'link'
  const dot = name.lastIndexOf('.')
  if (dot < 0) return 'other'
  return KIND_OF_EXT[name.slice(dot + 1).toLowerCase()] ?? 'other'
}

/** 状态对应的语气：完成 ok、失败 danger，排队与上传中是 neutral（进度本身不是好坏）。 */
export function toneOfStatus(status: ImportStatus): Severity {
  return status === 'done' ? 'ok' : status === 'failed' ? 'danger' : 'neutral'
}

/** 进度取整并夹在 0–100；不是有限数字（NaN）当 0。 */
export function clampPercent(value: number): number {
  return Number.isFinite(value) ? Math.min(100, Math.max(0, Math.round(value))) : 0
}

/** 清单的计数：各状态几个、一共几个。 */
export type ImportSummary = Record<ImportStatus, number> & { total: number }

export function summarize(items: readonly ImportItem[]): ImportSummary {
  const summary: ImportSummary = { queued: 0, uploading: 0, done: 0, failed: 0, total: items.length }
  for (const item of items) summary[item.status] += 1
  return summary
}

/** 粘贴框里的链接：去掉首尾空白，只认 http 与 https；合法返回规范写法前的原文（去空白），不合法 null。 */
export function parseLink(text: string): string | null {
  const value = text.trim()
  if (!value || /\s/.test(value)) return null
  if (!URL.canParse(value)) return null
  const { protocol } = new URL(value)
  return protocol === 'http:' || protocol === 'https:' ? value : null
}
