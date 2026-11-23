// SPDX-License-Identifier: MIT
// usage.ts、source-map.ts、guidance 用到 Vite 的 import.meta.glob；只声明本包用到的这一种写法，不引整套 vite/client 类型（它会带进 DOM 之外的一堆全局声明）。
interface ImportMeta {
  /** Vite 注入的站点前缀（SITE_BASE），文档站引 public/ 里的文件用。 */
  readonly env: { readonly BASE_URL: string }
  glob(
    pattern: string | readonly string[],
    options: { eager: true; query?: string; import?: string },
  ): Record<string, unknown>
}
