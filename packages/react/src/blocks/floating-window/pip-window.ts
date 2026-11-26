// SPDX-License-Identifier: MIT
// Document Picture-in-Picture 的薄封装：取 API、把当前文档的样式搬进小窗。
// API 说明：Chrome 开发者文档 Document Picture-in-Picture（developer.chrome.com/docs/web-platform/document-picture-in-picture，规范在 WICG，2026-11-26 读）：
// `window.documentPictureInPicture.requestWindow({ width, height })` 要用户刚操作过（瞬时激活），返回一个同源的 Window；用户关窗触发它的 `pagehide`。
// TypeScript 的 DOM 库还没有这组类型，这里写一份最小的。

export type PipApi = {
  requestWindow(options?: { width?: number; height?: number }): Promise<Window>
}

/** 浏览器有 Document Picture-in-Picture 就给它，没有（或在服务端）是 undefined。每次现取：测试里可以注入或删掉。 */
export function pipApi(): PipApi | undefined {
  if (typeof window === 'undefined') return undefined
  return (window as unknown as { documentPictureInPicture?: PipApi }).documentPictureInPicture
}

/** 页面根元素上要跟过去的属性：主题（data-theme）、语言、方向、类与行内变量。 */
const ROOT_ATTRIBUTES = ['data-theme', 'data-density', 'lang', 'dir', 'class', 'style']

/** 把根元素上的主题相关属性搬过去（没有的删掉）。 */
export function copyRootAttributes(from: Document, to: Document): void {
  for (const name of ROOT_ATTRIBUTES) {
    const value = from.documentElement.getAttribute(name)
    if (value === null) to.documentElement.removeAttribute(name)
    else to.documentElement.setAttribute(name, value)
  }
}

/**
 * 把当前文档的样式表复制进小窗，再搬根元素属性与正文的底色、文字色、字体：token 在 :root 与 [data-theme] 上，样式表不带过去小窗就是白底黑字。
 * 能读规则的样式表（同源与内联）拷成一个 <style>；读不了的（跨域，读规则抛 SecurityError）退回 <link>。
 */
export function copyDocumentStyles(from: Document, to: Document): void {
  for (const sheet of from.styleSheets) {
    try {
      const style = to.createElement('style')
      style.textContent = [...sheet.cssRules].map((rule) => rule.cssText).join('\n')
      to.head.append(style)
    } catch {
      if (!sheet.href) continue
      const link = to.createElement('link')
      link.rel = 'stylesheet'
      link.href = sheet.href
      to.head.append(link)
    }
  }
  copyRootAttributes(from, to)
  const computed = from.defaultView?.getComputedStyle(from.body)
  Object.assign(to.body.style, {
    margin: '0',
    background: computed?.backgroundColor ?? '',
    color: computed?.color ?? '',
    font: computed?.font ?? '',
  })
}
