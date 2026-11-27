// SPDX-License-Identifier: MIT
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vite-plus/test'
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './card.tsx'

// Card（#104 对照 Salt）：部件的 data-slot、四档底色、可点的卡是子元素本身。

describe('Card', () => {
  it('部件各带 data-slot，默认 secondary 的底', () => {
    const html = renderToStaticMarkup(
      <Card>
        <CardHeader>
          <CardTitle>Account A</CardTitle>
          <CardDescription>Cash</CardDescription>
          <CardAction>menu</CardAction>
        </CardHeader>
        <CardContent>body</CardContent>
        <CardFooter>foot</CardFooter>
      </Card>,
    )
    for (const slot of [
      'card',
      'card-header',
      'card-title',
      'card-description',
      'card-action',
      'card-content',
      'card-footer',
    ])
      expect(html).toContain(`data-slot="${slot}"`)
    expect(html).toContain('data-variant="secondary"')
    expect(html).toContain('bg-(--k-container-secondary-background)')
  })

  it('variant 换底色；ghost 透明无边', () => {
    expect(renderToStaticMarkup(<Card variant="primary" />)).toContain('bg-(--k-container-primary-background)')
    expect(renderToStaticMarkup(<Card variant="tertiary" />)).toContain('bg-(--k-container-tertiary-background)')
    const ghost = renderToStaticMarkup(<Card variant="ghost" />)
    expect(ghost).toContain('bg-transparent')
    expect(ghost).toContain('border-transparent')
  })

  it('asChild + interactive：整张卡就是那个 a，带悬停与焦点环的类；不加 interactive 时没有', () => {
    const link = renderToStaticMarkup(
      <Card asChild interactive>
        <a href="#r">Report</a>
      </Card>,
    )
    expect(link).toMatch(/^<a [^>]*data-slot="card"/)
    expect(link).toContain('cursor-pointer')
    expect(link).toContain('focus-visible')
    expect(renderToStaticMarkup(<Card />)).not.toContain('cursor-pointer')
  })
})
