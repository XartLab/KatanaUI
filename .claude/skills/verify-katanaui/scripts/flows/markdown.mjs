// SPDX-License-Identifier: MIT
// 功能地图 features/markdown.md：模型回话照常排版、角标槽画进去；HTML、图片、非 http(s) 链接被拦下；文档模式的锚点与相对链接。
export default {
  title: 'Markdown 安全正文：渲染与拦截',
  page: 'markdown',
  async run({ page, section, step, expect, aria }) {
    const reply = section.locator('[data-gallery-markdown="reply"] [data-slot="markdown"]')
    const doc = section.locator('[data-gallery-markdown="doc"] [data-slot="markdown"]')
    const opened = section.locator('[data-gallery-markdown-opened]')

    await step('回话：粗体、列表、表格、行内代码照常画，两个引用小标画在列表项里', async () => {
      await expect(reply.locator('strong').first()).toHaveText('结论')
      const items = reply.getByRole('list').first().getByRole('listitem')
      await expect(items).toHaveCount(2)
      await expect(items.nth(0).getByRole('button', { name: '财新 1' })).toBeVisible()
      await expect(items.nth(1).getByRole('button', { name: '上交所 2' })).toBeVisible()
      const table = reply.getByRole('table')
      await expect(table.getByRole('row')).toHaveCount(3)
      await expect(table.getByRole('row').first()).toHaveText(/指标\s*今日\s*5 日/)
      await expect(table.getByRole('cell', { name: '-3.2 亿' })).toBeVisible()
      await expect(reply.locator('code')).toHaveText('katana quote 600519')
      await aria(reply, 'markdown-reply.aria.yml')
      return {
        items: (await items.allInnerTexts()).map((t) => t.trim()),
        rows: await table.getByRole('row').count(),
        code: await reply.locator('code').innerText(),
      }
    })
    await step(
      '拦截：模型写的 <script> 原样当字、页上没有 script 元素；图片只写「[图片：日线截图]」、不取图',
      async () => {
        await expect(reply.getByText("<script>alert('模型写的 HTML 只当字')</script>", { exact: true })).toBeVisible()
        await expect(reply.locator('script')).toHaveCount(0)
        await expect(reply.locator('img')).toHaveCount(0)
        await expect(reply.getByText('[图片：日线截图]', { exact: true })).toBeVisible()
        // 页上任何地方都没去取演示里那张图。
        const fetched = await page.evaluate(() =>
          performance.getEntriesByType('resource').some((r) => r.name.includes('example.com/chart.png')),
        )
        expect(fetched).toBe(false)
        return {
          scripts: await reply.locator('script').count(),
          imgs: await reply.locator('img').count(),
          imageText: await reply.locator('.k-md-image').innerText(),
          chartFetched: fetched,
        }
      },
    )
    await step('外链「上交所披露」：只认 https，新标签页打开、不带来源（不点，不出站）', async () => {
      const link = reply.getByRole('link', { name: '上交所披露' })
      await expect(link).toHaveAttribute('href', 'https://www.sse.com.cn')
      await expect(link).toHaveAttribute('target', '_blank')
      await expect(link).toHaveAttribute('rel', 'noopener noreferrer')
      return {
        href: await link.getAttribute('href'),
        target: await link.getAttribute('target'),
        rel: await link.getAttribute('rel'),
      }
    })
    await step('文档模式：标题带锚点；认得的「设置」是站内链接，不认得的「开发者文档」只留文字', async () => {
      await expect(doc.getByRole('heading', { level: 1, name: '快速上手' })).toHaveAttribute('data-anchor', '快速上手')
      await expect(doc.getByRole('heading', { level: 2, name: '下单 F9' })).toHaveAttribute('data-anchor', '下单-f9')
      const settings = doc.getByRole('link', { name: '设置' })
      await expect(settings).toHaveAttribute('href', '#')
      await expect(settings).toHaveAttribute('data-target', 'settings.md')
      await expect(doc.getByRole('link', { name: '开发者文档' })).toHaveCount(0)
      await expect(doc.getByText('开发者文档', { exact: false })).toBeVisible()
      await aria(doc, 'markdown-doc.aria.yml')
      return {
        links: (await doc.getByRole('link').allInnerTexts()).map((t) => t.trim()),
        anchors: await doc.locator('[data-anchor]').evaluateAll((els) => els.map((e) => e.getAttribute('data-anchor'))),
      }
    })
    await step('点「设置」：交给页面回调，回显「点了：settings.md」，地址不跳', async () => {
      await expect(opened).toHaveText('点了：（还没点）')
      const before = page.url()
      await doc.getByRole('link', { name: '设置' }).click()
      await expect(opened).toHaveText('点了：settings.md')
      expect(page.url()).toBe(before)
      return { opened: await opened.innerText(), url: page.url() }
    })
  },
}
