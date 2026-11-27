// SPDX-License-Identifier: MIT
// 视觉回归快速模式的映射：改了哪些文件 → 该截哪几页。全是纯函数（文件内容与图由调用方读好传进来），单测在 vr-fast-map.test.ts。
// 原则：宁可多截也不漏截；认不出的文件按「共用层」处理（跑代表页，并提示合并前跑全量）。

export type PageInfo = { id: string; exports: readonly string[] }

export type MapContext = {
  pages: readonly PageInfo[]
  /** 包内相对路径（`src/katana/button.tsx`）→ 出口名，从各 index.ts 的 `export { X } from './y'` 读出。 */
  exportFiles: ReadonlyMap<string, readonly string[]>
  /** 包内相对路径 → 直接引了它的文件（反向引用图），含 src/ 与 gallery/。 */
  dependents: ReadonlyMap<string, readonly string[]>
  /** `gallery/pages/x.tsx` → 用了它的页 id，从 demos.tsx 读出。 */
  demoFiles: ReadonlyMap<string, readonly string[]>
}

export type Selection = {
  /** 要截的组件页 id。 */
  ids: string[]
  /** 碰到了共用层（或认不出的文件）：要追加代表页，并提示全量。 */
  shared: boolean
  /** 有基础页（侧栏之外的文字页）受影响：追加一张基础页外壳。 */
  foundation: boolean
  /** 认不出、按共用层处理的文件，给人看。 */
  unmapped: string[]
}

/** 共用层改了只跑这几页：覆盖按钮、输入、表格、读数卡、迷你图、浮层。 */
export const REPRESENTATIVE_IDS: readonly string[] = [
  'button',
  'input',
  'data-grid',
  'metric-card',
  'sparkline',
  'dialog',
]
/** 反查出的页超过这个数，就当共用层（再逐页跑就不快了）。 */
export const MAX_PAGES = 24

const PKG = 'packages/react/'

const normalize = (path: string): string => {
  const out: string[] = []
  for (const part of path.split('/')) {
    if (part === '..') out.pop()
    else if (part !== '.' && part !== '') out.push(part)
  }
  return out.join('/')
}

/** 一个入口文件里的转出口：`export { A, type B } from './x'` → [['src/katana/x.ts', ['A','B']]]。`dir` 是入口所在目录（`src/blocks/`）。 */
export function parseReexports(dir: string, source: string): [string, string[]][] {
  const out: [string, string[]][] = []
  for (const match of source.matchAll(/export\s*\{([\s\S]*?)\}\s*from\s*'\.\/([^']+)'/g)) {
    const file = normalize(`${dir}${match[2]}`)
    if (file.endsWith('index.ts')) continue
    const names = match[1]!
      .split(',')
      .map((raw) =>
        raw
          .replace(/^\s*type\s+/, '')
          .split(/\s+as\s+/)
          .pop()!
          .trim(),
      )
      .filter(Boolean)
    out.push([file, names])
  }
  return out
}

/** demos.tsx：`import { A, B } from './pages/x.tsx'` 加 `'页id': A,` → `gallery/pages/x.tsx` → [页 id]。 */
export function parseDemoFiles(source: string): Map<string, string[]> {
  const byComponent = new Map<string, string>()
  for (const match of source.matchAll(/import\s*\{([^}]*)\}\s*from\s*'\.\/([^']+)'/g)) {
    for (const raw of match[1]!.split(',')) {
      const name = raw
        .split(/\s+as\s+/)
        .pop()!
        .trim()
      if (name) byComponent.set(name, `gallery/${normalize(match[2]!)}`)
    }
  }
  const out = new Map<string, string[]>()
  for (const match of source.matchAll(/^\s*'?([\w-]+)'?\s*:\s*(\w+),?\s*$/gm)) {
    const file = byComponent.get(match[2]!)
    if (!file) continue
    out.set(file, [...(out.get(file) ?? []), match[1]!])
  }
  return out
}

/** usage 文件名 → 页 id：ButtonUsage.tsx → button（按页清单反查，不靠拆大驼峰）。 */
const usageIds = (pages: readonly PageInfo[]): Map<string, string> =>
  new Map(
    pages.map((page) => [
      `${page.id
        .split('-')
        .map((word) => word[0]!.toUpperCase() + word.slice(1))
        .join('')}Usage.tsx`,
      page.id,
    ]),
  )

/** 一个文件牵到的页：它自己（出口名、demo、usage 文件名）加上逐层引了它的文件（src 与 gallery 都算）牵到的。 */
function closureIds(file: string, ctx: MapContext, usage: ReadonlyMap<string, string>): Set<string> {
  const hit = new Set<string>()
  const seen = new Set<string>()
  const queue = [file]
  while (queue.length > 0) {
    const next = queue.pop()!
    if (seen.has(next)) continue
    seen.add(next)
    for (const name of ctx.exportFiles.get(next) ?? []) {
      for (const page of ctx.pages) if (page.exports.includes(name)) hit.add(page.id)
    }
    for (const id of ctx.demoFiles.get(next) ?? []) hit.add(id)
    const usageId = /^gallery\/usage\/([^/]+)$/.exec(next)?.[1]
    if (usageId && usage.has(usageId)) hit.add(usage.get(usageId)!)
    queue.push(...(ctx.dependents.get(next) ?? []))
  }
  return hit
}

/** 改动文件（仓库根相对路径）→ 影响哪些页。 */
export function selectPages(changed: readonly string[], ctx: MapContext): Selection {
  const ids = new Set<string>()
  const unmapped: string[] = []
  let shared = false
  let foundation = false
  const usage = usageIds(ctx.pages)

  for (const full of changed) {
    if (!full.startsWith(PKG)) {
      // 令牌包的改动波及所有页；别处（文档、工作流、AGENTS）不影响截图。
      if (full.startsWith('packages/tokens/src/') || full === 'pnpm-lock.yaml') shared = true
      continue
    }
    const file = full.slice(PKG.length)
    // 不影响预览像素的：测试、文档、生成物、e2e、脚本、配置、页的文字（registry / guidance / props）。
    if (
      /\.(test|spec)\.tsx?$/.test(file) ||
      file.endsWith('.md') ||
      /^(e2e|scripts|docs|design|ds|design-system|r|lib|public|\.pixelgate|patches)\//.test(file) ||
      /^(pixelgate|happo|playwright|tsconfig)[\w.-]*\.(ts|json)$/.test(file) ||
      /^(registry\.json|components\.json)$/.test(file) ||
      /^gallery\/(registry\.ts|props\.generated\.json|props\.ts|usage\.ts|demos\.tsx|calls\.ts|coverage\.tsx|source-map\.ts|guidance\/.*|patterns\/.*)$/.test(
        file,
      )
    ) {
      continue
    }
    if (/^(package\.json|vite\.config\.ts)$/.test(file)) {
      shared = true
      continue
    }
    if (/^gallery\/(foundations[\w-]*|rendering)\.tsx$/.test(file)) {
      foundation = true
      continue
    }
    // 共用层：样式、令牌、工具、文档站外壳；原语（primitives）按引用面算：被很多页用到的（Button）自然超过 MAX_PAGES 落到共用层，只有少数页用的就只跑那几页。
    if (
      /^src\/(theme|lib|fonts)\//.test(file) ||
      /^src\/[\w-]+\.(css|ts)$/.test(file) ||
      /^gallery\/[\w-]+\.(css|tsx?)$/.test(file)
    ) {
      shared = true
      continue
    }
    if (/^(src|gallery\/(usage|pages))\//.test(file)) {
      const hit = closureIds(file, ctx, usage)
      if (hit.size === 0) {
        shared = true
        unmapped.push(full)
      } else if (hit.size > MAX_PAGES) shared = true
      else for (const id of hit) ids.add(id)
      continue
    }
    shared = true
    unmapped.push(full)
  }
  return { ids: [...ids].sort(), shared, foundation, unmapped }
}

/**
 * 选好的页 → pixelgate 的页名（graphite 主题一个 target）。
 * 共用层改动、或多个文件加起来超过 MAX_PAGES 时只跑代表页（不再把各文件的页并起来）：快速模式要的是一分钟内出结果，全面覆盖交给合并前的全量。
 */
export function onlyNames(selection: Selection, pageIds: ReadonlySet<string>): string[] {
  const wide = selection.shared || selection.ids.length > MAX_PAGES
  const ids = new Set(wide ? [] : selection.ids)
  if (wide) for (const id of REPRESENTATIVE_IDS) if (pageIds.has(id)) ids.add(id)
  const names = [...ids].sort().map((id) => `graphite--${id}`)
  if (wide || selection.foundation) names.push('graphite--shell-foundation')
  return names
}
