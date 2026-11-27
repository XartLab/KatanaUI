// SPDX-License-Identifier: MIT
// 真被截断时悬停出全文（#250 第一部分，kubai 007「截断真生效」：「真被截断时悬停出全文」）。
// 库里有几十处 CSS 省略号（text-overflow: ellipsis，包括 Tailwind 的 truncate）；逐处加 title 会让没被截断的文字也冒出提示，
// 所以做成一个委托监听：指针移到一个文字上时，只在它「真的放不下」时才补 title，放得下就不补（补过又放得下了就撤掉）。
// 用法：应用启动时调一次 installTruncationTitles()，返回的函数用来卸载。作者自己写了 title 的元素不动。
// 原生 title 只有鼠标悬停能出，键盘与触屏没有：这些人要全文，靠选中项里写全或另有详情（modern-web-guidance: single-line-overflow）。

const MARK = 'data-k-auto-title'
/** 往上找几层：悬停到的常是省略号元素里的子节点（图标、加粗的字）。 */
const CLIMB = 4

/** 纯判断：省略号开着、内容比盒子宽（留 1px 的亚像素余量），才算真被截断。 */
export function isTruncated(box: { textOverflow: string; scrollWidth: number; clientWidth: number }): boolean {
  return box.textOverflow === 'ellipsis' && box.scrollWidth - box.clientWidth > 1
}

/** 全文：折掉换行与连续空白，跟屏幕上看到的一致。 */
const fullText = (element: Element) => (element.textContent ?? '').replace(/\s+/g, ' ').trim()

/** 给文档（或 shadow root）装上委托监听；返回卸载函数。没有 document 的环境（SSR、单测）什么都不做。 */
export function installTruncationTitles(root: Document | ShadowRoot | undefined = globalThis.document): () => void {
  if (!root) return () => {}
  const onOver = (event: Event) => {
    let element = event.target instanceof Element ? event.target : null
    for (let depth = 0; element && depth < CLIMB; depth += 1, element = element.parentElement) {
      if (!(element instanceof HTMLElement)) continue
      const own = element.hasAttribute('title') && !element.hasAttribute(MARK)
      if (own) return
      if (getComputedStyle(element).textOverflow !== 'ellipsis') continue
      if (
        isTruncated({ textOverflow: 'ellipsis', scrollWidth: element.scrollWidth, clientWidth: element.clientWidth })
      ) {
        const text = fullText(element)
        if (text) {
          element.title = text
          element.setAttribute(MARK, '')
        }
      } else if (element.hasAttribute(MARK)) {
        element.removeAttribute('title')
        element.removeAttribute(MARK)
      }
      return
    }
  }
  root.addEventListener('pointerover', onOver, { passive: true })
  return () => root.removeEventListener('pointerover', onOver)
}
