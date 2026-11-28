// SPDX-License-Identifier: MIT
// 浮层换成 UI SDK（#263 PR 3）的键盘、焦点、无障碍检查，不截图：真键盘、真点击，对外仍是 Radix 的写法（asChild、onEscapeKeyDown、onOpenAutoFocus 等）。
import { useState } from 'react'
import { afterEach, describe, expect, test } from 'vite-plus/test'
import { userEvent } from 'vite-plus/test/browser'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogTrigger,
  Button,
  Combobox,
  ComboboxContent,
  ComboboxTrigger,
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
  ToggleGroup,
  ToggleGroupItem,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '../src/index.ts'
import { mount } from './render.tsx'

afterEach(() => document.body.replaceChildren())

const active = () => document.activeElement as HTMLElement | null
const q = (selector: string) => document.querySelector<HTMLElement>(selector)
const settle = (ms = 400) => new Promise((resolve) => setTimeout(resolve, ms))
const shown = (selector: string) => {
  const el = q(selector)
  return !!el && !el.hidden && el.hasAttribute('data-open')
}

describe('迁移前的属性', () => {
  test('data-state 与 aria-haspopup=listbox 照 Radix 时期', async () => {
    await mount(
      <>
        <Popover>
          <PopoverTrigger data-testid="p">开</PopoverTrigger>
          <PopoverContent>里面</PopoverContent>
        </Popover>
        <Combobox>
          <ComboboxTrigger aria-label="周期">1h</ComboboxTrigger>
          <ComboboxContent label="搜周期">x</ComboboxContent>
        </Combobox>
      </>,
    )
    const trigger = q('[data-testid=p]')!
    expect(trigger.dataset.state).toBe('closed')
    await userEvent.click(trigger)
    await settle()
    expect(trigger.dataset.state).toBe('open')
    expect(q('[data-slot=popover-content]')!.dataset.state).toBe('open')
    const combo = q('[data-slot=combobox-trigger]')!
    await userEvent.click(combo)
    await settle()
    expect(combo.getAttribute('aria-haspopup')).toBe('listbox')
  })
})

describe('调用方自己的 data-slot', () => {
  test('触发器与内容上写的 data-slot 不被默认名盖掉', async () => {
    await mount(
      <Popover>
        <PopoverTrigger data-slot="my-trigger">开</PopoverTrigger>
        <PopoverContent data-slot="my-content">里面</PopoverContent>
      </Popover>,
    )
    expect(q('[data-slot=my-trigger]')).not.toBeNull()
    expect(q('[data-slot=popover-trigger]')).toBeNull()
    await userEvent.click(q('[data-slot=my-trigger]')!)
    await settle()
    expect(q('[data-slot=my-content]')).not.toBeNull()
  })
})

describe('Popover', () => {
  test('asChild 的触发器、Esc 关、焦点回触发器；onEscapeKeyDown 里 preventDefault 就不关', async () => {
    let block = false
    await mount(
      <Popover>
        <PopoverTrigger asChild>
          <Button data-testid="open">开</Button>
        </PopoverTrigger>
        <PopoverContent onEscapeKeyDown={(event) => block && event.preventDefault()}>
          <button type="button">里面</button>
        </PopoverContent>
      </Popover>,
    )
    const trigger = q('[data-testid=open]')!
    expect(trigger.dataset.slot).toBe('popover-trigger')
    expect(trigger.getAttribute('aria-expanded')).toBe('false')
    await userEvent.click(trigger)
    await settle()
    expect(shown('[data-slot=popover-content]')).toBe(true)
    block = true
    await userEvent.keyboard('{Escape}')
    await settle()
    expect(shown('[data-slot=popover-content]')).toBe(true)
    block = false
    await userEvent.keyboard('{Escape}')
    await settle()
    expect(shown('[data-slot=popover-content]')).toBe(false)
    expect(active()).toBe(trigger)
  })

  test('onOpenAutoFocus 里 preventDefault：焦点不进内容', async () => {
    await mount(
      <Popover>
        <PopoverTrigger>开</PopoverTrigger>
        <PopoverContent onOpenAutoFocus={(event) => event.preventDefault()}>
          <button type="button">里面</button>
        </PopoverContent>
      </Popover>,
    )
    const trigger = q('[data-slot=popover-trigger]')!
    await userEvent.click(trigger)
    await settle()
    expect(q('[data-slot=popover-content]')!.contains(active())).toBe(false)
  })
})

describe('Dialog', () => {
  test('Esc 关、焦点回触发器、点背板关；对话框里有 aria-modal 与标题名', async () => {
    await mount(
      <Dialog>
        <DialogTrigger asChild>
          <Button>开</Button>
        </DialogTrigger>
        <DialogContent closeLabel="关闭">
          <DialogTitle>设置</DialogTitle>
        </DialogContent>
      </Dialog>,
    )
    const trigger = q('[data-slot=dialog-trigger]')!
    await userEvent.click(trigger)
    await settle()
    const content = q('[data-slot=dialog-content]')!
    expect(shown('[data-slot=dialog-content]')).toBe(true)
    expect(content.getAttribute('aria-modal')).toBe('true')
    expect(content.getAttribute('aria-labelledby')).toBe(q('[data-slot=dialog-title]')!.id)
    await userEvent.keyboard('{Escape}')
    await settle()
    expect(shown('[data-slot=dialog-content]')).toBe(false)
    expect(active()).toBe(trigger)
    await userEvent.click(trigger)
    await settle()
    await userEvent.click(q('[aria-label=关闭]')!)
    await settle()
    expect(shown('[data-slot=dialog-content]')).toBe(false)
  })

  test('受控时 onEscapeKeyDown 拦下就不报 onOpenChange(false)', async () => {
    const seen: boolean[] = []
    function Case() {
      const [open, setOpen] = useState(true)
      return (
        <Dialog
          open={open}
          onOpenChange={(next) => {
            seen.push(next)
            setOpen(next)
          }}
        >
          <DialogContent onEscapeKeyDown={(event) => event.preventDefault()}>
            <DialogTitle>t</DialogTitle>
          </DialogContent>
        </Dialog>
      )
    }
    await mount(<Case />)
    await settle()
    await userEvent.keyboard('{Escape}')
    await settle()
    expect(seen).toEqual([])
    expect(shown('[data-slot=dialog-content]')).toBe(true)
  })
})

describe('AlertDialog', () => {
  test('打开时焦点在取消；点背板不关；取消与确认都关', async () => {
    await mount(
      <AlertDialog>
        <AlertDialogTrigger>开</AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogTitle>确认？</AlertDialogTitle>
          <AlertDialogCancel>取消</AlertDialogCancel>
          <AlertDialogAction>删除</AlertDialogAction>
        </AlertDialogContent>
      </AlertDialog>,
    )
    const trigger = q('[data-slot=alert-dialog-trigger]')!
    await userEvent.click(trigger)
    await settle()
    expect(q('[data-slot=alert-dialog-content]')!.getAttribute('role')).toBe('alertdialog')
    expect(active()?.textContent).toBe('取消')
    await userEvent.click(q('[data-slot=alert-dialog-overlay]')!, { position: { x: 2, y: 2 } })
    await settle()
    expect(shown('[data-slot=alert-dialog-content]')).toBe(true)
    await userEvent.click(q('[data-slot=alert-dialog-action]')!)
    await settle()
    expect(shown('[data-slot=alert-dialog-content]')).toBe(false)
    expect(active()).toBe(trigger)
  })
})

describe('Sheet', () => {
  test('Esc 关、焦点回触发器', async () => {
    await mount(
      <Sheet>
        <SheetTrigger>开</SheetTrigger>
        <SheetContent side="left">
          <SheetTitle>抽屉</SheetTitle>
        </SheetContent>
      </Sheet>,
    )
    const trigger = q('[data-slot=sheet-trigger]')!
    await userEvent.click(trigger)
    await settle()
    expect(q('[data-slot=sheet-content]')!.dataset.side).toBe('left')
    await userEvent.keyboard('{Escape}')
    await settle()
    expect(shown('[data-slot=sheet-content]')).toBe(false)
    expect(active()).toBe(trigger)
  })
})

describe('Tooltip', () => {
  test('悬停停够延迟才出，离开收起；键盘聚焦也出', async () => {
    await mount(
      <Tooltip delayDuration={100}>
        <TooltipTrigger>提示</TooltipTrigger>
        <TooltipContent>说明</TooltipContent>
      </Tooltip>,
    )
    const trigger = q('[data-slot=tooltip-trigger]')!
    await userEvent.hover(trigger)
    await settle(500)
    expect(shown('[data-slot=tooltip-content]')).toBe(true)
    expect(q('[data-slot=tooltip-content]')!.getAttribute('role')).toBe('tooltip')
    await userEvent.unhover(trigger)
    await settle(500)
    expect(shown('[data-slot=tooltip-content]')).toBe(false)
  })
})

describe('ToggleGroup', () => {
  test('Tab 只停一个，方向键在项之间走，空格选中；点已选的不取消', async () => {
    const seen: string[] = []
    function Case() {
      const [value, setValue] = useState<string | null>('a')
      return (
        <>
          <button type="button">前</button>
          <ToggleGroup
            value={value}
            onValueChange={(next) => {
              seen.push(next)
              setValue(next)
            }}
          >
            <ToggleGroupItem value="a">甲</ToggleGroupItem>
            <ToggleGroupItem value="b">乙</ToggleGroupItem>
            <ToggleGroupItem value="c">丙</ToggleGroupItem>
          </ToggleGroup>
          <button type="button">后</button>
        </>
      )
    }
    await mount(<Case />)
    await userEvent.click(q('button')!)
    await userEvent.keyboard('{Tab}')
    expect(active()?.textContent).toBe('甲')
    await userEvent.keyboard('{ArrowRight}')
    expect(active()?.textContent).toBe('乙')
    await userEvent.keyboard(' ')
    expect(seen).toEqual(['b'])
    expect(active()?.getAttribute('aria-pressed')).toBe('true')
    await userEvent.keyboard('{Tab}')
    expect(active()?.textContent).toBe('后')
    await userEvent.click(q('[data-slot=toggle-group-item][aria-pressed=true]')!)
    expect(seen).toEqual(['b'])
  })
})
