// SPDX-License-Identifier: MIT
// 功能地图 features/research-calendar.md 的「资料导入」：并发多文件进度、失败重试与移除、粘贴与链接页签的回调。
export default {
  title: '资料导入：多文件进度、失败重试与移除、粘贴与链接',
  page: 'file-import',
  async run({ page, section, step, expect, aria }) {
    const list = section.getByRole('list', { name: '已添加的资料' })
    const row = (id) => list.locator(`[data-item-id="${id}"]`)
    const log = section.locator('[data-gallery-import-log]')

    await step('打开页：4 行，上传中 62%、完成、失败（带原因）、等待中', async () => {
      await expect(list.getByRole('listitem')).toHaveCount(4)
      await expect(row('r1')).toContainText('62% 上传中')
      await expect(row('r1').getByRole('progressbar')).toHaveAttribute('aria-valuenow', '62')
      await expect(row('r3').getByRole('alert')).toContainText('网络中断')
      await aria(section, 'file-import.aria.yml')
      return { rows: await list.getByRole('listitem').count(), statuses: await list.locator('[data-status]').evaluateAll((els) => els.map((e) => e.dataset.status)) }
    })
    await step('一次选两个文件：两行同时上传中，点「进度 +25%」两行一起到 25%', async () => {
      await section.locator('input[type="file"]').setInputFiles([
        { name: 'a.csv', mimeType: 'text/csv', buffer: Buffer.from('a\n1\n') },
        { name: 'b.parquet', mimeType: 'application/octet-stream', buffer: Buffer.from('PAR1') },
      ])
      await expect(list.locator('[data-status="uploading"]')).toHaveCount(3)
      await section.getByRole('button', { name: '进度 +25%' }).click()
      await expect(list.locator('[data-item-id]').filter({ hasText: 'a.csv' })).toContainText('25% 上传中')
      await expect(list.locator('[data-item-id]').filter({ hasText: 'b.parquet' })).toContainText('25% 上传中')
      return { log: await log.innerText() }
    })
    await step('失败行点「重试」：回调带 id，行回到上传中', async () => {
      await row('r3').getByRole('button', { name: '重试 backtest_result.parquet' }).click()
      await expect(log).toContainText('重试 r3')
      await expect(row('r3')).toHaveAttribute('data-status', 'uploading')
      return { log: await log.innerText(), status: await row('r3').getAttribute('data-status') }
    })
    await step('点「移除 factors_2026.csv」：行消失，回调带 id，焦点接给相邻的一行', async () => {
      await row('r2').getByRole('button', { name: '移除 factors_2026.csv' }).click()
      await expect(row('r2')).toHaveCount(0)
      await expect(log).toContainText('移除 r2')
      await expect(list.locator('[data-item-id]:focus-within')).toHaveCount(1)
      return { log: await log.innerText(), focusedRow: await list.locator('[data-item-id]:focus-within').getAttribute('data-item-id') }
    })
    await step('粘贴页签：写字、Ctrl+Enter 添加，回调收到字数，框清空', async () => {
      await section.getByRole('tab', { name: '粘贴' }).click()
      const box = section.getByRole('textbox', { name: '粘贴的文字' })
      await box.fill('半导体周报：库存去化')
      await box.press('Control+Enter')
      await expect(log).toContainText('粘贴了 10 个字')
      await expect(box).toHaveValue('')
      return { log: await log.innerText() }
    })
    await step('链接页签：ftp 链接标红并写原因；https 链接添加，回调收到链接', async () => {
      await section.getByRole('tab', { name: '链接' }).click()
      const link = section.getByRole('textbox', { name: '资料链接' })
      await link.fill('ftp://example.com/x')
      await link.press('Enter')
      await expect(link).toHaveAttribute('aria-invalid', 'true')
      const message = await section.getByRole('alert').filter({ hasText: 'http' }).innerText()
      await link.fill('https://example.com/semis')
      await link.press('Enter')
      await expect(log).toContainText('链接 https://example.com/semis')
      return { invalidMessage: message, log: await log.innerText() }
    })
  },
}
