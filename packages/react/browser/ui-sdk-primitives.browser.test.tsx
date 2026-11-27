// SPDX-License-Identifier: MIT
// 换成 UI SDK 的 primitives（#263 PR 2）的键盘、焦点、无障碍检查，不截图：用真键盘、真点击在 Chromium 里走，状态读 UI SDK 的数据属性。
import { useState } from 'react'
import { afterEach, describe, expect, test } from 'vite-plus/test'
import { userEvent } from 'vite-plus/test/browser'
import { Avatar, Checkbox, Label, MorphToggle, Progress, RadioGroup, RadioGroupItem, Separator, Switch, Toggle } from '../src/index.ts'
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
    await userEvent.tab()
    expect(active()).toBe(box)
    await userEvent.keyboard(' ')
    expect(seen).toEqual([true])
    expect(box.getAttribute('aria-checked')).toBe('true')
    expect(box.hasAttribute('data-checked')).toBe(true)
    await userEvent.keyboard(' ')
    expect(box.hasAttribute('data-checked')).toBe(false)
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
    await userEvent.click(q('[data-slot="label"]'))
    expect(sw.getAttribute('aria-checked')).toBe('false')
  })

  test('MorphToggle：空格拨动，onCheckedChange 只收布尔（回车不再拨动，APG 的 switch 只要求空格）', async () => {
    const seen: unknown[] = []
    await mount(<MorphToggle aria-label="主题" onCheckedChange={(next) => seen.push(next)} />)
    await userEvent.tab()
    await userEvent.keyboard(' ')
    await userEvent.keyboard(' ')
    expect(seen).toEqual([true, false])
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
    expect(Math.round(fill.getBoundingClientRect().width / a!.getBoundingClientRect().width * 100)).toBe(60)
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
