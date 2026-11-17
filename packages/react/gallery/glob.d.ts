// SPDX-License-Identifier: MIT
// usage.ts、guides.ts 用到 Vite 的 import.meta.glob；只声明本包用到的这一种写法，不引整套 vite/client 类型（它会带进 DOM 之外的一堆全局声明）。
interface ImportMeta {
  glob(
    pattern: string | readonly string[],
    options: { eager: true; query?: string; import?: string },
  ): Record<string, unknown>
}

// vite.config.ts 的 extraDocs 插件：仓库级 markdown，键是相对仓库根的路径。
declare module 'virtual:extra-docs' {
  const files: Record<string, string>
  export default files
}
