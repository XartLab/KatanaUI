// SPDX-License-Identifier: MIT
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vite-plus/test'
import { Input } from './input.tsx'
import { Tabs, TabsList, TabsTrigger } from './tabs.tsx'
import { ToggleGroup, ToggleGroupItem } from './toggle-group.tsx'

// #104 第 3 条：带标签与单位的 Input、整宽与 split 的 ToggleGroup、line 的 Tabs。服务端渲染看结构与类名；点击与外观在 e2e/base-variants.spec.ts。

describe('Input caption / unit', () => {
  it('不带 caption / unit 时还是单个 input，没有外框', () => {
    const html = renderToStaticMarkup(<Input aria-label="x" />)
    expect(html).not.toContain('data-slot="input-box"')
  })

  it('字串 caption 成为这个输入框的 label，unit 画在右边，align=end 靠右', () => {
    const html = renderToStaticMarkup(<Input id="px" caption="价格" unit="USDT" align="end" />)
    expect(html).toContain('data-slot="input-box"')
    expect(html).toMatch(/<label for="px"[^>]*>价格<\/label>/)
    expect(html).toContain('USDT')
    expect(html).toContain('text-right')
  })

  it('节点 caption 原样画，不包 label；aria-invalid 与 disabled 反映到外框', () => {
    const html = renderToStaticMarkup(
      <Input caption={<button type="button">填法</button>} aria-label="数量" aria-invalid disabled />,
    )
    expect(html).not.toContain('<label')
    expect(html).toContain('填法')
    expect(html).toContain('opacity-45')
    expect(html).toContain('border-(color:--k-status-danger-foreground)')
  })

  it('wrapperClassName 落在外框，className 落在 input', () => {
    const html = renderToStaticMarkup(<Input unit="×" wrapperClassName="WRAP" className="INNER" />)
    expect(html).toMatch(/data-slot="input-box"[^>]*class="[^"]*WRAP/)
    expect(html).toMatch(/<input[^>]*class="[^"]*INNER/)
  })
})

describe('ToggleGroup fullWidth / split', () => {
  const group = (props: Record<string, unknown>) =>
    renderToStaticMarkup(
      <ToggleGroup value="a" onValueChange={() => {}} aria-label="g" {...props}>
        <ToggleGroupItem value="a" tone="up">
          甲
        </ToggleGroupItem>
        <ToggleGroupItem value="b" tone="down">
          乙
        </ToggleGroupItem>
      </ToggleGroup>,
    )

  it('默认没有整宽也没有 split', () => {
    const html = group({})
    expect(html).not.toContain('w-full')
    expect(html).not.toContain('data-split')
  })

  it('fullWidth：整组撑满，各项等分', () => {
    const html = group({ fullWidth: true })
    expect(html).toContain('flex w-full')
    expect(html.match(/flex-1/g)?.length).toBe(2)
  })

  it('split：不要容器皮肤，项自带边；tone 给选中项涨跌色；仍是 aria-pressed 开关', () => {
    const html = group({ split: true, fullWidth: true })
    expect(html).toContain('data-split="true"')
    expect(html).not.toContain('--k-selectable-groupBorderColor')
    expect(html).toContain('data-[state=on]:bg-(--pnl-up)')
    expect(html).toContain('data-[state=on]:bg-(--pnl-down)')
    expect(html).toContain('aria-pressed="true"')
    expect(html).toContain('aria-pressed="false"')
    // split 没有滑块。
    expect(html).not.toContain('toggle-group-pill')
  })
})

describe('Tabs line', () => {
  it('line 的页签列表没有药丸底块，只有边线；当前项挂下划线类', () => {
    const html = renderToStaticMarkup(
      <Tabs value="a">
        <TabsList variant="line" aria-label="t">
          <TabsTrigger value="a">甲</TabsTrigger>
          <TabsTrigger value="b">乙</TabsTrigger>
        </TabsList>
      </Tabs>,
    )
    expect(html).toContain('data-variant="line"')
    expect(html).toContain('border-b')
    expect(html).not.toContain('tabs-pill')
    expect(html).toContain('group-data-[variant=line]/tabs-list:data-[state=active]:after:opacity-100')
  })
})
