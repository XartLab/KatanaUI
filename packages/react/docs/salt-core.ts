// SPDX-License-Identifier: MIT
// 「对照 Salt」表的纯逻辑（#104）：docs/salt-map.json 的类型与汇总。文档站的覆盖页与测试共用这一份，数字不会各算各的。

export const SALT_STATUSES = ['有', '部分', '没有'] as const
export type SaltStatus = (typeof SALT_STATUSES)[number]

export interface SaltEntry {
  /** Salt 文档里的路径尾巴（`accordion`、`layouts/grid-layout`），在 /salt/components/ 之下，当作唯一键。 */
  slug: string
  /** Salt 的组件名。 */
  name: string
  /** 有：读过我们那一页，功能对得上；部分：缺的写在 note；没有：包里没有对应的件，原因写在 note。 */
  status: SaltStatus
  /** 我们的件，写文档站页 id（gallery/registry.ts 的 id）。有与部分必须有，没有必须为空。 */
  pages: readonly string[]
  note?: string
}

export interface SaltMap {
  source: string
  /** 读 Salt 组件清单的日期（YYYY-MM-DD）。 */
  readOn: string
  components: readonly SaltEntry[]
}

/** 各状态的个数。 */
export function summarizeSalt(map: SaltMap): Record<SaltStatus, number> {
  const count = (status: SaltStatus) => map.components.filter((entry) => entry.status === status).length
  return { 有: count('有'), 部分: count('部分'), 没有: count('没有') }
}
