// SPDX-License-Identifier: MIT

// 模板库（TemplateLibrary，#226）的纯函数：按标题搜索过滤整棵树、把命中的字切开给高亮、按 id 找模板。
// 数据是调用方的：分组（我的 / 内置）、模板、变体都由它给；这里不改数据，只出视图。

/** 一个模板（策略模板、提示词模板、回测配置）；children 是它的变体，一层。 */
export type TemplateEntry = {
  /** 全树唯一（分组 id 也算在内）。 */
  id: string
  title: string
  /** 正文，纯文本，多行。 */
  body: string
  /** 详情里的元信息，一行一项，例如 { label: '创建人', value: 'Wang · 2026-10-09 06:05' }；文字与时间格式由调用方给。 */
  meta?: readonly { label: string; value: string }[]
  /** 行尾的小字，例如「使用中」。 */
  badge?: string
  /** 变体：挂在这个模板下面的几份。 */
  children?: readonly TemplateEntry[]
}

/** 一个分组：「我的」「内置」；readOnly 的分组里模板不能改。 */
export type TemplateGroup = {
  id: string
  title: string
  templates: readonly TemplateEntry[]
  /** 内置模板这类：标题与正文不能就地改，只能复制或使用。 */
  readOnly?: boolean
}

/** 过滤后的一个分组：只剩命中的模板（命中的变体连同它的父模板一起留下）。 */
export type FilteredGroup = Omit<TemplateGroup, 'templates'> & { templates: readonly TemplateEntry[] }

const norm = (text: string) => text.toLocaleLowerCase()

/** 标题里含 query（不分大小写）；空的 query 全部命中。 */
export const matches = (title: string, query: string): boolean => {
  const needle = norm(query.trim())
  return needle === '' || norm(title).includes(needle)
}

/**
 * 按标题过滤：模板自己命中就整个留下（连变体一起）；自己没中、变体里有命中的，留下父模板与命中的变体；
 * 没有命中的分组整组去掉。query 为空（或全是空白）原样返回。命中的总数（模板与变体各算一个）一并给出，读屏播报用。
 */
export function filterTemplates(
  groups: readonly TemplateGroup[],
  query: string,
): { groups: readonly FilteredGroup[]; count: number } {
  if (query.trim() === '') return { groups, count: groups.reduce((sum, group) => sum + countAll(group.templates), 0) }
  let count = 0
  const kept: FilteredGroup[] = []
  for (const group of groups) {
    const templates: TemplateEntry[] = []
    for (const template of group.templates) {
      if (matches(template.title, query)) {
        templates.push(template)
        count += 1 + (template.children?.filter((child) => matches(child.title, query)).length ?? 0)
        continue
      }
      const hit = template.children?.filter((child) => matches(child.title, query)) ?? []
      if (hit.length > 0) {
        templates.push({ ...template, children: hit })
        count += hit.length
      }
    }
    if (templates.length > 0) kept.push({ ...group, templates })
  }
  return { groups: kept, count }
}

function countAll(templates: readonly TemplateEntry[]): number {
  return templates.reduce((sum, template) => sum + 1 + (template.children?.length ?? 0), 0)
}

/** 把标题按 query 切成「中 / 没中」几段，给高亮用；空 query 是整段没中。段拼起来等于原文。 */
export function highlightParts(text: string, query: string): { text: string; match: boolean }[] {
  const needle = norm(query.trim())
  if (!needle) return [{ text, match: false }]
  const lower = norm(text)
  // toLocaleLowerCase 偶尔改变长度（如带点的 İ）：对不上就不高亮，宁可不亮也不切错。
  if (lower.length !== text.length) return [{ text, match: false }]
  const parts: { text: string; match: boolean }[] = []
  let from = 0
  for (let at = lower.indexOf(needle); at >= 0; at = lower.indexOf(needle, from)) {
    if (at > from) parts.push({ text: text.slice(from, at), match: false })
    parts.push({ text: text.slice(at, at + needle.length), match: true })
    from = at + needle.length
  }
  if (from < text.length) parts.push({ text: text.slice(from), match: false })
  return parts
}

/** 按 id 找模板（含变体）与它所在的分组；找不到是 null。 */
export function findTemplate(
  groups: readonly TemplateGroup[],
  id: string | null | undefined,
): { template: TemplateEntry; group: TemplateGroup; parent: TemplateEntry | null } | null {
  if (!id) return null
  for (const group of groups) {
    for (const template of group.templates) {
      if (template.id === id) return { template, group, parent: null }
      const child = template.children?.find((item) => item.id === id)
      if (child) return { template: child, group, parent: template }
    }
  }
  return null
}

/** 搜索时要展开的所有行：每个分组，加上带变体的模板（命中的变体才看得见）。 */
export function expandAllIds(groups: readonly FilteredGroup[]): string[] {
  return groups.flatMap((group) => [
    group.id,
    ...group.templates.filter((template) => (template.children?.length ?? 0) > 0).map((template) => template.id),
  ])
}
