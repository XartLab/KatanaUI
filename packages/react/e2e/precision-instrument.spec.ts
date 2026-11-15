// SPDX-License-Identifier: MIT
import { expect, test } from '@playwright/test'

// 精密仪器语言（#7）的正面证明：点阵元信息行真的用点阵字（Doto，汉字落到随包发的方舟像素子集），编号是强调色。
// 临时把 --font-dot 的方舟像素去掉，或把编号色改掉，这条会红。
test.use({ viewport: { width: 1100, height: 1500 } })

test('序列探索：元信息行是点阵字，汉字用随包的方舟像素，编号是强调色', async ({ page }) => {
  await page.goto('/?theme=graphite#/series-explorer')
  const meta = page.locator('[data-gallery="series-explorer"] [data-slot="series-meta"]').first()
  await expect(meta).toBeVisible()

  const family = await meta.evaluate((element) => getComputedStyle(element).fontFamily)
  expect(family).toMatch(/^"?Doto"?, "?Ark Pixel 12 zh_cn Subset"?/)

  // 汉字真的是方舟像素子集画的：字体文件加载成功，且子集里有这行里的字
  const loaded = await page.evaluate(async () => {
    await document.fonts.load('12px "Ark Pixel 12 zh_cn Subset"', '演示数据')
    return document.fonts.check('12px "Ark Pixel 12 zh_cn Subset"', '演示数据')
  })
  expect(loaded).toBe(true)
  const faces = await page.evaluate(
    () =>
      [...document.fonts].filter(
        (face) => face.family.includes('Ark Pixel 12 zh_cn Subset') && face.status === 'loaded',
      ).length,
  )
  expect(faces).toBe(1)
})
