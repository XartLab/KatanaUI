// SPDX-License-Identifier: MIT
// 组件清单（#107 第 1 层）：工作区里每个可放的组件一份声明。目录、推荐、页签栏、联动、布局模板、Agent 搭布局都读它，不各写一遍。
// 做法参照 VS Code 扩展 package.json 的 contributes 与 OpenBB Workspace 的 widget 声明（只取「声明式」这个思路），字段是我们自己定的。
import type { CatalogCategory, CatalogItem, CatalogKind } from '../component-catalog/component-catalog-model.ts'

/** 联动参数：同一联动组里的面板共用的量。三个内置的之外，宿主可以加自己的。 */
export type LinkParam = 'symbol' | 'interval' | 'time' | (string & {})

export type ComponentManifest = {
  id: string
  name: string
  /** Id of a catalog category. */
  category: string
  kind: CatalogKind
  /** Extra words the catalog search matches. */
  keywords?: readonly string[]
  /** Kinds of component this one goes well beside. */
  pairsWith?: readonly string[]
  /** Smallest size in px at which it is still usable; the layout engine should not shrink it further. */
  minSize?: { width: number; height: number }
  /** Markets it applies to (crypto-perp, us-stock, cn-stock…); leave out for all markets. */
  markets?: readonly string[]
  /** Capabilities it cannot work without (account, l2, options-chain…). */
  needs?: readonly string[]
  /** Link parameters it follows when its panel is in a link group. */
  consumes?: readonly LinkParam[]
  /** Link parameters it can set for its link group. */
  emits?: readonly LinkParam[]
  /** Only one instance makes sense in a workspace (an order ticket per account, say). */
  singleton?: boolean
}

/** 当前的上下文：在看哪个市场、连了哪些能力、当前页签是什么种类、工作区里已经放了哪些组件。 */
export type WorkspaceContext = {
  market?: string
  capabilities?: readonly string[]
  activeKind?: string
  inUse?: readonly string[]
}

/** 用不了时写给用户看的原因，由宿主给文字（语言随产品）。 */
export type UnavailableReasons = {
  /** The component does not apply to this market. */
  market: (manifest: ComponentManifest, market: string) => string
  /** A required capability is missing; `capability` is the first one missing. */
  needs: (manifest: ComponentManifest, capability: string) => string
}

/** 清单按当前上下文变成目录的条目：市场不对或缺能力的置灰并带原因，已在工作区的打勾。推荐交给目录按 pairsWith 与 context 算。 */
export function catalogFromManifests(
  manifests: readonly ComponentManifest[],
  context: WorkspaceContext,
  reasons: UnavailableReasons,
): CatalogItem[] {
  const has = new Set(context.capabilities ?? [])
  const used = new Set(context.inUse ?? [])
  return manifests.map((manifest) => {
    const wrongMarket =
      context.market !== undefined && manifest.markets !== undefined && !manifest.markets.includes(context.market)
    const missing = manifest.needs?.find((capability) => !has.has(capability))
    return {
      id: manifest.id,
      name: manifest.name,
      category: manifest.category,
      kind: manifest.kind,
      keywords: manifest.keywords,
      pairsWith: manifest.pairsWith,
      inUse: used.has(manifest.id),
      unavailable: wrongMarket
        ? reasons.market(manifest, context.market!)
        : missing !== undefined
          ? reasons.needs(manifest, missing)
          : undefined,
    }
  })
}

export type ManifestIssue = { id: string; problem: 'duplicate-id' | 'unknown-category' | 'empty-name' | 'bad-min-size' }

/** 装载清单时查一遍：id 重复、类别不存在、名字空、最小尺寸不是正数。返回空数组就是没问题。 */
export function validateManifests(
  manifests: readonly ComponentManifest[],
  categories: readonly CatalogCategory[],
): ManifestIssue[] {
  const known = new Set(categories.map((category) => category.id))
  const seen = new Set<string>()
  const issues: ManifestIssue[] = []
  for (const manifest of manifests) {
    if (seen.has(manifest.id)) issues.push({ id: manifest.id, problem: 'duplicate-id' })
    seen.add(manifest.id)
    if (!known.has(manifest.category)) issues.push({ id: manifest.id, problem: 'unknown-category' })
    if (manifest.name.trim() === '') issues.push({ id: manifest.id, problem: 'empty-name' })
    if (manifest.minSize && !(manifest.minSize.width > 0 && manifest.minSize.height > 0))
      issues.push({ id: manifest.id, problem: 'bad-min-size' })
  }
  return issues
}
