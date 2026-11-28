// SPDX-License-Identifier: MIT
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vite-plus/test'
import {
  Alert,
  Button,
  Checkbox,
  Input,
  Progress,
  Switch,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  ToggleGroup,
  ToggleGroupItem,
  buttonVariants,
} from './index.ts'

// 件的结构：用 react-dom/server 渲染成字符串，断言用户和读屏器碰到的东西（role、aria、type、变体标记）。
// 看得见的样子（尺寸、悬停、动效）在 e2e/ui-gallery.spec.ts 里用真浏览器量。

// 进行中（#251，kubai 017）：满 300ms 才出转圈、转圈出了至少留 500ms 的时间规则在 lib/delayed-flag.test.ts；点击被吞、宽度不变这类要真浏览器，在 e2e/ui-gallery.spec.ts「按钮：进行中」。
describe('Button pending', () => {
  const tagOf = (html: string) => /<button\b[^>]*>/.exec(html)![0]

  it('进行中：aria-busy 与 aria-disabled，不用 disabled 属性（键盘与读屏仍能到），字还在', () => {
    const html = renderToStaticMarkup(<Button pending>保存</Button>)
    const tag = tagOf(html)
    expect(tag).toContain('aria-busy="true"')
    expect(tag).toContain('aria-disabled="true"')
    expect(tag).not.toMatch(/\sdisabled(=|\s|>)/)
    expect(html).toContain('保存')
  })

  it('不在进行中：没有 aria-busy 与 aria-disabled', () => {
    const tag = tagOf(renderToStaticMarkup(<Button>保存</Button>))
    expect(tag).not.toMatch(/\saria-busy=/)
    expect(tag).not.toMatch(/\saria-disabled=/)
  })

  it('首帧不出转圈：转圈要等满 300ms（useDelayedFlag）', () => {
    expect(renderToStaticMarkup(<Button pending>保存</Button>)).not.toContain('data-slot="button-spinner"')
  })

  it('传 spinIcon：pending 时按下就转自己的图标（data-spinning），不另出转圈', () => {
    const html = renderToStaticMarkup(
      <Button pending spinIcon aria-label="刷新">
        <svg />
      </Button>,
    )
    expect(tagOf(html)).toContain('data-spinning="true"')
    expect(html).not.toContain('data-slot="button-spinner"')
  })

  it('调用方自己传的 aria-disabled 照用', () => {
    expect(tagOf(renderToStaticMarkup(<Button aria-disabled>保存</Button>))).toContain('aria-disabled="true"')
  })
})

describe('Button', () => {
  it('默认 type=button（不会在表单里误提交），带变体与尺寸标记', () => {
    const html = renderToStaticMarkup(<Button>确定</Button>)
    expect(html).toContain('type="button"')
    expect(html).toContain('data-slot="button"')
    expect(html).toContain('data-variant="default"')
    expect(html).toContain('data-size="md"')
  })

  it('尺寸统一 sm | md：旧名 default 等于 md（留一个版本）', () => {
    expect(renderToStaticMarkup(<Button size="default">x</Button>)).toContain('data-size="md"')
    expect(renderToStaticMarkup(<Input size="default" />)).toContain('data-size="md"')
    expect(renderToStaticMarkup(<Input size="sm" />)).toContain('data-size="sm"')
  })

  it('变体：primary 是实心浅色，danger 的字是危险色；调用方的 className 排在最后', () => {
    expect(buttonVariants({ variant: 'primary' })).toContain('bg-(--k-actionable-bold-background)')
    expect(buttonVariants({ variant: 'danger' })).toContain('text-(color:--k-actionable-negative-foreground)')
    expect(renderToStaticMarkup(<Button className="w-full">x</Button>)).toMatch(/class="[^"]*w-full"/)
  })

  it('asChild：渲染成子元素自己（链接），不套一层 button', () => {
    const html = renderToStaticMarkup(
      <Button asChild>
        <a href="/x">去</a>
      </Button>,
    )
    expect(html.startsWith('<a ')).toBe(true)
    expect(html).not.toContain('<button')
  })
})

describe('Switch / Checkbox', () => {
  it('开关：role=switch，状态在 aria-checked 上，开关与圆钮都带 data-checked', () => {
    const on = renderToStaticMarkup(<Switch checked aria-label="成交量" />)
    expect(on).toContain('role="switch"')
    expect(on).toContain('aria-checked="true"')
    expect(on).toContain('data-slot="switch-thumb"')
    expect(on.match(/data-checked=""/g)?.length).toBe(2)
    expect(renderToStaticMarkup(<Switch checked={false} aria-label="x" />)).toContain('aria-checked="false"')
  })

  it('勾选：role=checkbox，勾上的带 data-state=checked', () => {
    const html = renderToStaticMarkup(<Checkbox checked aria-label="只看主板" />)
    expect(html).toContain('role="checkbox"')
    expect(html).toContain('aria-checked="true"')
    expect(html).toContain('data-checked=""')
    expect(html).toContain('data-state="checked"')
  })
})

describe('Tabs', () => {
  it('页签：role=tablist / tab，当前页签 aria-selected，只渲染当前面板', () => {
    const html = renderToStaticMarkup(
      <Tabs defaultValue="a">
        <TabsList>
          <TabsTrigger value="a">甲</TabsTrigger>
          <TabsTrigger value="b">乙</TabsTrigger>
        </TabsList>
        <TabsContent value="a">甲的内容</TabsContent>
        <TabsContent value="b">乙的内容</TabsContent>
      </Tabs>,
    )
    expect(html).toContain('role="tablist"')
    expect(html.match(/role="tab"/g)?.length).toBe(2)
    expect(html).toMatch(/aria-selected="true"[^>]*>甲|>甲<\/button>/)
    expect(html).toContain('甲的内容')
    expect(html).not.toContain('乙的内容')
  })
})

describe('Alert / Progress / ToggleGroup：新名与旧名', () => {
  it('Alert 与 Progress 的 tone 是 Severity，旧名 default 等于 neutral', () => {
    expect(renderToStaticMarkup(<Alert>x</Alert>)).toContain('data-tone="neutral"')
    expect(renderToStaticMarkup(<Alert tone="default">x</Alert>)).toContain('data-tone="neutral"')
    expect(renderToStaticMarkup(<Alert tone="danger">x</Alert>)).toContain('role="alert"')
    const neutral = renderToStaticMarkup(<Progress aria-label="p" value={10} tone="default" />)
    expect(neutral).toContain('bg-(--k-status-neutral-bold-background)')
    expect(renderToStaticMarkup(<Progress aria-label="p" value={10} tone="warn" />)).toContain(
      'bg-(--k-status-warn-foreground)',
    )
  })

  it('ToggleGroup：size 取代 variant，旧的 variant="sm" 照样是 sm', () => {
    const item = <ToggleGroupItem value="a">A</ToggleGroupItem>
    const noop = () => {}
    expect(
      renderToStaticMarkup(
        <ToggleGroup aria-label="g" value="a" onValueChange={noop}>
          {item}
        </ToggleGroup>,
      ),
    ).toContain('data-size="md"')
    expect(
      renderToStaticMarkup(
        <ToggleGroup aria-label="g" size="sm" value="a" onValueChange={noop}>
          {item}
        </ToggleGroup>,
      ),
    ).toContain('data-size="sm"')
    expect(
      renderToStaticMarkup(
        <ToggleGroup aria-label="g" variant="sm" value="a" onValueChange={noop}>
          {item}
        </ToggleGroup>,
      ),
    ).toContain('data-size="sm"')
  })
})
