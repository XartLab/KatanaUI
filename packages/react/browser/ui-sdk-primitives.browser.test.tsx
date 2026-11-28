// SPDX-License-Identifier: MIT
// 换成 UI SDK 的 primitives（#263 PR 2）的键盘、焦点、无障碍检查，不截图：用真键盘、真点击在 Chromium 里走，状态读 UI SDK 的数据属性。
import { useState } from 'react'
import { afterEach, describe, expect, test } from 'vite-plus/test'
import { userEvent } from 'vite-plus/test/browser'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Avatar,
  Checkbox,
  ChipGroup,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  Label,
  MorphToggle,
  Progress,
  RadioGroup,
  RadioGroupItem,
  ScrollArea,
  Separator,
  Switch,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Toggle,
} from '../src/index.ts'
import { mount } from './render.tsx'

afterEach(() => document.body.replaceChildren())

const active = () => document.activeElement as HTMLElement | null
const q = (selector: string) => document.querySelector<HTMLElement>(selector)!

describe('Checkbox', () => {
  test('空格切换，三态读 aria-checked 与 data-checked / data-indeterminate，禁用的不可聚焦', async () => {
    const seen: unknown[] = []
    function Harness() {
      const [checked, setChecked] = useState<boolean | 'indeterminate'>('indeterminate')
      return (
        <>
          <Checkbox
            aria-label="全选"
            checked={checked}
            onCheckedChange={(next) => {
              seen.push(next)
              setChecked(next)
            }}
          />
          <Checkbox aria-label="停用" disabled />
        </>
      )
    }
    await mount(<Harness />)
    const box = q('[aria-label="全选"]')
    expect(box.getAttribute('aria-checked')).toBe('mixed')
    expect(box.hasAttribute('data-indeterminate')).toBe(true)
    expect(box.getAttribute('data-state')).toBe('indeterminate')
    await userEvent.tab()
    expect(active()).toBe(box)
    await userEvent.keyboard(' ')
    expect(seen).toEqual([true])
    expect(box.getAttribute('aria-checked')).toBe('true')
    expect(box.hasAttribute('data-checked')).toBe(true)
    expect(box.getAttribute('data-state')).toBe('checked')
    await userEvent.keyboard(' ')
    expect(box.hasAttribute('data-checked')).toBe(false)
    expect(box.getAttribute('data-state')).toBe('unchecked')
    await userEvent.tab()
    expect(active()).not.toBe(q('[aria-label="停用"]'))
  })
})

describe('Switch / MorphToggle', () => {
  test('Switch：role=switch，空格拨动，data-checked 在开关与圆钮上；点 Label 也能拨', async () => {
    await mount(
      <div>
        <Label htmlFor="sw">成交量</Label>
        <Switch id="sw" />
      </div>,
    )
    const sw = q('[role="switch"]')
    await userEvent.tab()
    expect(active()).toBe(sw)
    await userEvent.keyboard(' ')
    expect(sw.getAttribute('aria-checked')).toBe('true')
    expect(sw.hasAttribute('data-checked')).toBe(true)
    expect(q('[data-slot="switch-thumb"]').hasAttribute('data-checked')).toBe(true)
    expect(sw.getAttribute('data-state')).toBe('checked')
    expect(q('[data-slot="switch-thumb"]').getAttribute('data-state')).toBe('checked')
    await userEvent.click(q('[data-slot="label"]'))
    expect(sw.getAttribute('aria-checked')).toBe('false')
    expect(sw.getAttribute('data-state')).toBe('unchecked')
    // 回车也拨动：迁移前的 Radix 开关是原生按钮，回车就是点击（UI SDK 只认空格）。
    await userEvent.keyboard('{Enter}')
    expect(sw.getAttribute('aria-checked')).toBe('true')
  })

  test('MorphToggle：空格与回车都拨动，onCheckedChange 只收布尔', async () => {
    const seen: unknown[] = []
    await mount(<MorphToggle aria-label="主题" onCheckedChange={(next) => seen.push(next)} />)
    await userEvent.tab()
    await userEvent.keyboard(' ')
    await userEvent.keyboard(' ')
    await userEvent.keyboard('{Enter}')
    expect(seen).toEqual([true, false, true])
    expect(q('[data-slot="morph-toggle"]').getAttribute('data-state')).toBe('checked')
  })
})

describe('RadioGroup', () => {
  test('一个 Tab 停靠点，方向键移动并选中，onValueChange 收字符串，aria-orientation 跟 orientation', async () => {
    const seen: string[] = []
    await mount(
      <RadioGroup aria-label="周期" defaultValue="1m" orientation="horizontal" onValueChange={(v) => seen.push(v)}>
        <RadioGroupItem value="1m" aria-label="1 分钟" />
        <RadioGroupItem value="5m" aria-label="5 分钟" />
        <RadioGroupItem value="1h" aria-label="1 小时" />
      </RadioGroup>,
    )
    expect(q('[role="radiogroup"]').getAttribute('aria-orientation')).toBe('horizontal')
    expect(document.querySelectorAll('[role="radio"][tabindex="0"]')).toHaveLength(1)
    await userEvent.tab()
    expect(active()?.getAttribute('aria-label')).toBe('1 分钟')
    await userEvent.keyboard('{ArrowRight}')
    expect(active()?.getAttribute('aria-label')).toBe('5 分钟')
    expect(active()?.hasAttribute('data-checked')).toBe(true)
    await userEvent.keyboard('{ArrowLeft}{ArrowLeft}')
    expect(active()?.getAttribute('aria-label')).toBe('1 小时')
    expect(seen).toEqual(['5m', '1m', '1h'])
  })
})

describe('Toggle', () => {
  test('回车与空格切换 aria-pressed 与 data-pressed', async () => {
    await mount(<Toggle aria-label="均线">均线</Toggle>)
    const toggle = q('[data-slot="toggle"]')
    await userEvent.tab()
    expect(active()).toBe(toggle)
    await userEvent.keyboard('{Enter}')
    expect(toggle.getAttribute('aria-pressed')).toBe('true')
    expect(toggle.hasAttribute('data-pressed')).toBe(true)
    await userEvent.keyboard(' ')
    expect(toggle.getAttribute('aria-pressed')).toBe('false')
  })
})

describe('Progress / Separator / Avatar', () => {
  test('Progress：role=progressbar，aria-valuenow 跟值，不给值是不确定态；条宽跟百分比', async () => {
    await mount(
      <div style={{ width: 200 }}>
        <Progress aria-label="导入" value={60} />
        <Progress aria-label="等待" />
      </div>,
    )
    const [a, b] = document.querySelectorAll<HTMLElement>('[role="progressbar"]')
    expect(a?.getAttribute('aria-valuenow')).toBe('60')
    expect(b?.hasAttribute('aria-valuenow')).toBe(false)
    expect(b?.querySelector('[data-slot="progress-indicator"]')?.hasAttribute('data-indeterminate')).toBe(true)
    const fill = a!.querySelector<HTMLElement>('[data-slot="progress-indicator"]')!
    expect(Math.round((fill.getBoundingClientRect().width / a!.getBoundingClientRect().width) * 100)).toBe(60)
  })

  test('Separator：默认只是装饰（role=none），decorative={false} 才是 separator 并带方向', async () => {
    await mount(
      <>
        <Separator />
        <Separator decorative={false} orientation="vertical" />
      </>,
    )
    const [a, b] = document.querySelectorAll<HTMLElement>('[data-slot="separator"]')
    expect(a?.getAttribute('role')).toBe('none')
    expect(b?.getAttribute('role')).toBe('separator')
    expect(b?.getAttribute('aria-orientation')).toBe('vertical')
    expect(b?.getAttribute('data-orientation')).toBe('vertical')
  })

  test('Avatar：没图时显示缩写，读屏名取 alt', async () => {
    await mount(<Avatar alt="张三" fallback="张" />)
    const fallback = q('[role="img"]')
    expect(fallback.getAttribute('aria-label')).toBe('张三')
    expect(fallback.textContent).toBe('张')
  })
})

describe('Collapsible / Accordion / Tabs', () => {
  test('Collapsible：回车展开收起，触发钮 aria-expanded 与 data-open 同步，收起后面板卸载', async () => {
    await mount(
      <Collapsible>
        <CollapsibleTrigger>详情</CollapsibleTrigger>
        <CollapsibleContent>内容</CollapsibleContent>
      </Collapsible>,
    )
    const trigger = q('[data-slot="collapsible-trigger"]')
    expect(trigger.getAttribute('aria-expanded')).toBe('false')
    expect(document.querySelector('[data-slot="collapsible-content"]')).toBeNull()
    await userEvent.tab()
    await userEvent.keyboard('{Enter}')
    expect(trigger.getAttribute('aria-expanded')).toBe('true')
    expect(trigger.hasAttribute('data-open')).toBe(true)
    expect(trigger.getAttribute('data-state')).toBe('open')
    expect(q('[data-slot="collapsible-content"]').getAttribute('data-state')).toBe('open')
    expect(q('[data-slot="collapsible-content"]').textContent).toBe('内容')
    await userEvent.keyboard(' ')
    expect(trigger.getAttribute('aria-expanded')).toBe('false')
  })

  test('Accordion single + collapsible：只开一项，Tab 与方向键都能在标题间移动，值是字符串', async () => {
    const seen: string[] = []
    await mount(
      <Accordion type="single" collapsible defaultValue="a" onValueChange={(v) => seen.push(v)}>
        <AccordionItem value="a">
          <AccordionTrigger>甲</AccordionTrigger>
          <AccordionContent>甲的内容</AccordionContent>
        </AccordionItem>
        <AccordionItem value="b">
          <AccordionTrigger>乙</AccordionTrigger>
          <AccordionContent>乙的内容</AccordionContent>
        </AccordionItem>
      </Accordion>,
    )
    const [a, b] = document.querySelectorAll<HTMLElement>('[data-slot="accordion-trigger"]')
    expect(a?.getAttribute('aria-expanded')).toBe('true')
    expect(a?.getAttribute('data-state')).toBe('open')
    expect(b?.getAttribute('data-state')).toBe('closed')
    expect(a?.getAttribute('data-orientation')).toBe('vertical')
    await userEvent.tab()
    // 迁移前（Radix）：↓ ↑ 在标题间走、两头回绕，Home / End 到头尾；UI SDK 没有。
    await userEvent.keyboard('{ArrowDown}')
    expect(active()).toBe(b)
    await userEvent.keyboard('{ArrowDown}')
    expect(active()).toBe(a)
    await userEvent.keyboard('{ArrowUp}')
    expect(active()).toBe(b)
    await userEvent.keyboard('{Home}')
    expect(active()).toBe(a)
    await userEvent.keyboard('{End}')
    expect(active()).toBe(b)
    await userEvent.keyboard('{Enter}')
    expect(seen).toEqual(['b'])
    expect(a?.getAttribute('aria-expanded')).toBe('false')
    await userEvent.keyboard('{Enter}')
    expect(seen).toEqual(['b', ''])
  })

  test('Accordion multiple：可以同时开多项，值是数组', async () => {
    const seen: string[][] = []
    await mount(
      <Accordion type="multiple" onValueChange={(v) => seen.push(v)}>
        <AccordionItem value="a">
          <AccordionTrigger>甲</AccordionTrigger>
          <AccordionContent>甲的内容</AccordionContent>
        </AccordionItem>
        <AccordionItem value="b">
          <AccordionTrigger>乙</AccordionTrigger>
          <AccordionContent>乙的内容</AccordionContent>
        </AccordionItem>
      </Accordion>,
    )
    await userEvent.tab()
    await userEvent.keyboard('{Enter}{Tab}{Enter}')
    expect(seen.at(-1)?.toSorted()).toEqual(['a', 'b'])
  })

  test('Tabs：automatic 方向键移动并选中，manual 只移焦点；选中的带 data-state=active，只渲染当前面板', async () => {
    await mount(
      <>
        <Tabs defaultValue="a">
          <TabsList aria-label="自动">
            <TabsTrigger value="a">甲</TabsTrigger>
            <TabsTrigger value="b">乙</TabsTrigger>
          </TabsList>
          <TabsContent value="a">甲的内容</TabsContent>
          <TabsContent value="b">乙的内容</TabsContent>
        </Tabs>
        <Tabs defaultValue="c" activationMode="manual">
          <TabsList aria-label="手动">
            <TabsTrigger value="c">丙</TabsTrigger>
            <TabsTrigger value="d">丁</TabsTrigger>
          </TabsList>
          <TabsContent value="c">丙的内容</TabsContent>
          <TabsContent value="d">丁的内容</TabsContent>
        </Tabs>
      </>,
    )
    await userEvent.tab()
    await userEvent.keyboard('{ArrowRight}')
    expect(active()?.textContent).toBe('乙')
    expect(active()?.hasAttribute('data-selected')).toBe(true)
    expect(active()?.getAttribute('data-state')).toBe('active')
    expect(active()?.getAttribute('aria-selected')).toBe('true')
    expect(document.querySelector('[data-slot="tabs-content"]')?.getAttribute('data-state')).toBe('active')
    expect(document.body.textContent).toContain('乙的内容')
    expect(document.body.textContent).not.toContain('甲的内容')
    await userEvent.tab()
    await userEvent.tab()
    expect(active()?.textContent).toBe('丙')
    await userEvent.keyboard('{ArrowRight}')
    expect(active()?.textContent).toBe('丁')
    expect(active()?.hasAttribute('data-selected')).toBe(false)
    expect(active()?.getAttribute('data-state')).toBe('inactive')
    await userEvent.keyboard('{Enter}')
    expect(active()?.hasAttribute('data-selected')).toBe(true)
  })

  test('Tabs：方向键、Home / End 跳过禁用的页签，两头回绕；禁用的页签画成 30% 不透明、不接指针', async () => {
    await mount(
      <Tabs defaultValue="a">
        <TabsList aria-label="周期">
          <TabsTrigger value="a">甲</TabsTrigger>
          <TabsTrigger value="b" disabled>
            乙
          </TabsTrigger>
          <TabsTrigger value="c">丙</TabsTrigger>
          <TabsTrigger value="d" disabled>
            丁
          </TabsTrigger>
        </TabsList>
        <TabsContent value="a">甲的内容</TabsContent>
        <TabsContent value="c">丙的内容</TabsContent>
      </Tabs>,
    )
    const [, b] = document.querySelectorAll<HTMLElement>('[data-slot="tabs-trigger"]')
    expect(getComputedStyle(b!).opacity).toBe('0.3')
    expect(getComputedStyle(b!).cursor).toBe('not-allowed')
    await userEvent.tab()
    expect(active()?.textContent).toBe('甲')
    await userEvent.keyboard('{ArrowRight}')
    expect(active()?.textContent).toBe('丙')
    expect(active()?.getAttribute('aria-selected')).toBe('true')
    await userEvent.keyboard('{ArrowRight}')
    expect(active()?.textContent).toBe('甲')
    await userEvent.keyboard('{End}')
    expect(active()?.textContent).toBe('丙')
    await userEvent.keyboard('{Home}')
    expect(active()?.textContent).toBe('甲')
    await userEvent.keyboard('{ArrowLeft}')
    expect(active()?.textContent).toBe('丙')
  })
})

describe('Accordion / Collapsible 的动画（迁移前是 keyframes，不是 transition）', () => {
  test('展开放 kc-accordion-down、收起放 kc-accordion-up，放完才卸载；首次渲染就开着的不放', async () => {
    await mount(
      <Accordion type="single" collapsible defaultValue="a">
        <AccordionItem value="a">
          <AccordionTrigger>甲</AccordionTrigger>
          <AccordionContent>甲的内容</AccordionContent>
        </AccordionItem>
        <AccordionItem value="b">
          <AccordionTrigger>乙</AccordionTrigger>
          <AccordionContent>乙的内容</AccordionContent>
        </AccordionItem>
      </Accordion>,
    )
    const names = (el: Element | null) => el?.getAnimations().map((a) => (a as CSSAnimation).animationName) ?? []
    const [a, b] = document.querySelectorAll<HTMLElement>('[data-slot="accordion-trigger"]')
    await expect.poll(() => names(q('[data-slot="accordion-content"]'))).toEqual([])
    await userEvent.click(b!)
    expect(
      names(document.querySelectorAll('[data-slot="accordion-content"]')[1] ?? null).includes('kc-accordion-down'),
    ).toBe(true)
    await userEvent.click(a!)
    // 甲正在收起：data-ending-style 在、kc-accordion-up 在放；面板还在页上。
    const closing = document.querySelector('[data-slot="accordion-content"][data-ending-style]')
    expect(closing).not.toBeNull()
    expect(names(closing)).toContain('kc-accordion-up')
    await expect.poll(() => document.querySelectorAll('[data-slot="accordion-content"]').length).toBe(1)
  })

  test('Collapsible 同样：收起放 kc-collapsible-up', async () => {
    await mount(
      <Collapsible defaultOpen>
        <CollapsibleTrigger>详情</CollapsibleTrigger>
        <CollapsibleContent>内容</CollapsibleContent>
      </Collapsible>,
    )
    await userEvent.click(q('[data-slot="collapsible-trigger"]'))
    const closing = document.querySelector('[data-slot="collapsible-content"][data-ending-style]')
    expect(closing?.getAnimations().map((a) => (a as CSSAnimation).animationName)).toContain('kc-collapsible-up')
    await expect.poll(() => document.querySelector('[data-slot="collapsible-content"]')).toBeNull()
  })

  test('禁用的折叠标题是原生 disabled：Tab 跳过它，方向键也跳过', async () => {
    await mount(
      <Accordion type="multiple">
        <AccordionItem value="a">
          <AccordionTrigger>甲</AccordionTrigger>
          <AccordionContent>甲的内容</AccordionContent>
        </AccordionItem>
        <AccordionItem value="b" disabled>
          <AccordionTrigger>乙</AccordionTrigger>
          <AccordionContent>乙的内容</AccordionContent>
        </AccordionItem>
        <AccordionItem value="c">
          <AccordionTrigger>丙</AccordionTrigger>
          <AccordionContent>丙的内容</AccordionContent>
        </AccordionItem>
      </Accordion>,
    )
    const [, b] = document.querySelectorAll<HTMLButtonElement>('[data-slot="accordion-trigger"]')
    expect(b?.disabled).toBe(true)
    await userEvent.tab()
    expect(active()?.textContent).toBe('甲')
    await userEvent.tab()
    expect(active()?.textContent).toBe('丙')
    await userEvent.keyboard('{ArrowUp}')
    expect(active()?.textContent).toBe('甲')
  })
})

describe('ChipGroup', () => {
  test('多选：方向键在芯片间走，Tab 只停一个，空格开关，禁用项仍可到达但按不动', async () => {
    function Harness() {
      const [value, setValue] = useState<string[]>([])
      return (
        <ChipGroup
          label="分面"
          value={value}
          onValueChange={setValue}
          items={[
            { value: 'a', label: '港股' },
            { value: 'b', label: '美股', disabled: true },
            { value: 'c', label: 'A 股' },
          ]}
        />
      )
    }
    await mount(<Harness />)
    expect(q('[role="group"]').getAttribute('aria-label')).toBe('分面')
    await userEvent.tab()
    expect(active()?.textContent).toBe('港股')
    await userEvent.keyboard(' ')
    expect(active()?.getAttribute('aria-pressed')).toBe('true')
    expect(active()?.hasAttribute('data-pressed')).toBe(true)
    await userEvent.keyboard('{ArrowRight}')
    await userEvent.keyboard(' ')
    expect(active()?.textContent).toBe('美股')
    expect(active()?.getAttribute('aria-pressed')).toBe('false')
    await userEvent.keyboard('{ArrowRight}{Enter}')
    expect(active()?.textContent).toBe('A 股')
    expect(active()?.getAttribute('aria-pressed')).toBe('true')
  })

  test('single：最多选一个，点已选的取消', async () => {
    function Harness() {
      const [value, setValue] = useState<string[]>(['a'])
      return (
        <ChipGroup
          label="单选"
          selection="single"
          value={value}
          onValueChange={setValue}
          items={[
            { value: 'a', label: '甲' },
            { value: 'b', label: '乙' },
          ]}
        />
      )
    }
    await mount(<Harness />)
    const [a, b] = document.querySelectorAll<HTMLElement>('.k-chip')
    await userEvent.click(b!)
    expect(a?.getAttribute('aria-pressed')).toBe('false')
    expect(b?.getAttribute('aria-pressed')).toBe('true')
    await userEvent.click(b!)
    expect(b?.getAttribute('aria-pressed')).toBe('false')
  })
})

describe('ScrollArea', () => {
  test('视口能 Tab 到，方向键与 PageDown 能滚；滚动条是 aria-hidden 的装饰，溢出才有 data-overflow-y', async () => {
    await mount(
      <ScrollArea style={{ height: 120, width: 200 }}>
        {Array.from({ length: 30 }, (_, i) => (
          <div key={i}>{`Row ${i + 1}`}</div>
        ))}
      </ScrollArea>,
    )
    const viewport = q('[data-slot="scroll-area-viewport"]')
    await userEvent.tab()
    expect(active()).toBe(viewport)
    await userEvent.keyboard('{PageDown}')
    await expect.poll(() => viewport.scrollTop).toBeGreaterThan(0)
    expect(q('[data-slot="scroll-area"]').hasAttribute('data-overflow-y')).toBe(true)
    expect(q('[data-slot="scroll-area-scrollbar"]').getAttribute('aria-hidden')).toBe('true')
  })
})

// UI SDK 的部件自带 data-slot，写在我们传的 props 之后会盖掉我们的名字；样式、e2e 与 KATANAview 的选择器认的是原来的名字（#263，src/lib/slot-name.ts）。
// 每个换了的件挂出来，原来的 slot 名一个都不能少。
describe('data-slot 名字还在', () => {
  test('每个换了的件的 slot 名都写回了', async () => {
    await mount(
      <div>
        <Accordion type="single" collapsible defaultValue="a">
          <AccordionItem value="a">
            <AccordionTrigger>标题</AccordionTrigger>
            <AccordionContent>内容</AccordionContent>
          </AccordionItem>
        </Accordion>
        <Avatar alt="张三" fallback="张" />
        <Checkbox aria-label="勾选" defaultChecked />
        <Collapsible defaultOpen>
          <CollapsibleTrigger>开合</CollapsibleTrigger>
          <CollapsibleContent>内容</CollapsibleContent>
        </Collapsible>
        <Label>标签</Label>
        <MorphToggle aria-label="实盘" />
        <Progress aria-label="导入" value={60} />
        <RadioGroup aria-label="周期" defaultValue="1m">
          <RadioGroupItem value="1m" aria-label="1 分钟" />
        </RadioGroup>
        <ScrollArea style={{ height: 40, width: 100 }}>
          {Array.from({ length: 10 }, (_, i) => (
            <div key={i}>{`Row ${i + 1}`}</div>
          ))}
        </ScrollArea>
        <Separator />
        <Switch aria-label="开关" />
        <Tabs defaultValue="a">
          <TabsList>
            <TabsTrigger value="a">甲</TabsTrigger>
          </TabsList>
          <TabsContent value="a">甲的内容</TabsContent>
        </Tabs>
        <Toggle aria-label="按下">按下</Toggle>
      </div>,
    )
    const slots = [
      'accordion',
      'accordion-item',
      'accordion-trigger',
      'accordion-content',
      'avatar',
      'checkbox',
      'collapsible',
      'collapsible-trigger',
      'collapsible-content',
      'label',
      'morph-toggle',
      'morph-toggle-thumb',
      'progress',
      'progress-indicator',
      'radio-group',
      'radio-group-item',
      'scroll-area',
      'scroll-area-viewport',
      'separator',
      'switch',
      'switch-thumb',
      'tabs',
      'tabs-list',
      'tabs-trigger',
      'tabs-content',
      'toggle',
    ]
    const missing = slots.filter((name) => !document.querySelector(`[data-slot="${name}"]`))
    expect(missing).toEqual([])
  })

  test('调用方写的 data-slot 盖得住默认名（Tabs、TabsList、TabsTrigger、Label）', async () => {
    await mount(
      <div>
        <Tabs defaultValue="a" data-slot="my-tabs">
          <TabsList data-slot="my-list">
            <TabsTrigger value="a" data-slot="my-tab">
              甲
            </TabsTrigger>
          </TabsList>
          <TabsContent value="a">甲的内容</TabsContent>
        </Tabs>
        <Label data-slot="my-label">标签</Label>
      </div>,
    )
    for (const name of ['my-tabs', 'my-list', 'my-tab', 'my-label']) {
      expect(document.querySelector(`[data-slot="${name}"]`), name).not.toBeNull()
    }
    expect(document.querySelector('[data-slot="tabs-trigger"]')).toBeNull()
  })
})
