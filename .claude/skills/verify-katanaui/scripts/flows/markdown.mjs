// SPDX-License-Identifier: MIT
// 功能地图 features/markdown.md：模型回话的安全渲染（HTML 当字、图片写说明、外链新标签页、角标槽）
// 与文档模式（标题带锚点、认得的相对链接交给 onOpenLink、不认得的只留文字）。
export default {
  title: 'Markdown：回话渲染与帮助文档',
  page: 'markdown',
  async run({ page, section, step, expect, aria }) {
    const reply = section.locator('[data-gallery-markdown="reply"]')
    const doc = section.locator('[data-gallery-markdown="doc"]')
    const opened = section.locator('[data-gallery-markdown-opened]')
    const root = (locator) => locator.locator('[data-slot="markdown"]')

    await step('打开 Markdown 页：两段演示都在，回话里的粗体、列表、表格、代码照常画', async () => {
      const md = root(reply)
      await expect(md.locator('strong').first()).toHaveText('结论')
      expect(await md.locator('li').count()).toBe(2)
      await expect(md.locator('table')).toContainText('涨跌幅')
      await expect(md.locator('code').first()).toHaveText('katana quote 600519')
      await aria(reply, 'markdown-reply.aria.yml')
      return {
        bold: await md.locator('strong').first().innerText(),
        listItems: await md.locator('li').count(),
        table: (await md.locator('table').innerText()).split('\n')[0] ?? '',
        code: await md.locator('code').first().innerText(),
      }
    })
    await step('角标槽：占位符的位置画出了调用方给的引用小标', async () => {
      const slots = root(reply).locator('.k-md-slot')
      expect(await slots.count()).toBe(2)
      for (const slot of await slots.all()) {
        await expect(slot.locator('[data-slot="web-search-citation"]')).toHaveCount(1)
      }
      return {
        slots: await slots.count(),
        citations: (await root(reply).locator('[data-slot="web-search-chip"]').allInnerTexts()).map((t) => t.trim()),
      }
    })
    await step('不渲染 HTML：脚本成了字，页上没有 script 元素', async () => {
      const md = root(reply)
      await expect(md.locator('script')).toHaveCount(0)
      await expect(md.locator('img')).toHaveCount(0)
      expect(await md.innerText()).toContain("<script>alert('模型写的 HTML 只当字')</script>")
      return { scripts: await md.locator('script').count(), imgs: await md.locator('img').count() }
    })
    await step('不画图片：图片只写说明，地址不出现在页上', async () => {
      const md = root(reply)
      await expect(md.locator('.k-md-image')).toHaveText('[图片：日线截图]')
      expect(await md.innerText()).not.toContain('example.com')
      return { imageText: await md.locator('.k-md-image').innerText() }
    })
    await step('外链：只认 http(s)，在新标签页打开且不带来源', async () => {
      const link = root(reply).getByRole('link', { name: '上交所披露' })
      await expect(link).toHaveAttribute('href', 'https://www.sse.com.cn')
      await expect(link).toHaveAttribute('target', '_blank')
      await expect(link).toHaveAttribute('rel', 'noopener noreferrer')
      return {
        href: await link.getAttribute('href'),
        target: await link.getAttribute('target'),
        rel: await link.getAttribute('rel'),
      }
    })

    await step('帮助文档：标题带锚点，认得的相对链接写成 data-target', async () => {
      const md = root(doc)
      await expect(md.locator('h1[data-anchor="快速上手"]')).toHaveCount(1)
      await expect(md.locator('h2[data-anchor="下单-f9"]')).toHaveCount(1)
      const setting = md.getByRole('link', { name: '设置' })
      await expect(setting).toHaveAttribute('data-target', 'settings.md')
      await aria(doc, 'markdown-doc.aria.yml')
      return {
        anchors: await md.locator('h1[data-anchor], h2[data-anchor]').count(),
        settingsTarget: await setting.getAttribute('data-target'),
      }
    })
    await step('点认得的相对链接：不跳页，交给 onOpenLink，回显写它的返回值', async () => {
      const before = page.url()
      await root(doc).getByRole('link', { name: '设置' }).click()
      await expect(opened).toContainText('点了：settings.md')
      expect(page.url()).toBe(before)
      return { opened: (await opened.innerText()).trim(), url: page.url() }
    })
    await step('不认得的相对链接只留文字，不留死链', async () => {
      const md = root(doc)
      await expect(md.getByRole('link', { name: '开发者文档' })).toHaveCount(0)
      expect(await md.locator('a').count()).toBe(1)
      expect(await md.innerText()).toContain('开发者文档')
      return { links: await md.locator('a').count(), keepsText: (await md.innerText()).includes('开发者文档') }
    })
  },
}