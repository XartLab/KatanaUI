// SPDX-License-Identifier: MIT
import type { ComponentProps } from 'react'
import { cn } from '../lib/cn.ts'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '../primitives/command.tsx'
import { Popover, PopoverContent, PopoverTrigger } from '../primitives/popover.tsx'
import { SelectArrow, selectTriggerVariants } from '../primitives/select.tsx'

// 可搜索下拉：Popover（弹层、焦点圈住与归还）加 Command（cmdk 的搜索过滤与键盘）拼出来，是 shadcn 文档里 combobox 的老写法
// （shadcn 4.22.2 的 combobox 底座是 Base UI，我们已经去掉了它，#1797，所以不用）。
// 触发器跟单选下拉一个样（selectTriggerVariants）。打开后焦点在搜索框，打字过滤，↑↓ 移动高亮，回车选中；Esc 收起，焦点回触发器。
// 单选还是多选由调用方定：选中后收起（单选）用受控的 open，多选就不收；每一行用 selected 画勾（勾在左，没选的也占位，文字才对得齐）。
// 读屏与测试按 ARIA 的 combobox 认它：触发器 role=combobox（aria-expanded），弹层里 listbox，行 option；option 的 aria-selected 是 cmdk 的「当前高亮」，不是「已选」，
// 已选看 data-checked（调用方要读屏知道已选，就在行的文字里写上）。过滤用行的 value 与 keywords 模糊匹配；自己排名的传 commandProps={{ shouldFilter: false }}。
// 文案（占位、没有结果）都由调用方传，包里不写字。
function Combobox({ ...props }: ComponentProps<typeof Popover>) {
  return <Popover {...props} />
}

function ComboboxTrigger({ className, children, ...props }: ComponentProps<typeof PopoverTrigger>) {
  return (
    <PopoverTrigger
      data-slot="combobox-trigger"
      role="combobox"
      aria-haspopup="listbox"
      className={cn(selectTriggerVariants(), className)}
      {...props}
    >
      {children}
      <SelectArrow />
    </PopoverTrigger>
  )
}

/** 弹层：宽跟触发器一样（最窄 220），里面是 Command，children 放 ComboboxInput、ComboboxList 与别的（例如底下的按钮）。 */
function ComboboxContent({
  className,
  children,
  label,
  commandProps,
  ...props
}: ComponentProps<typeof PopoverContent> & {
  /**
   * Accessible name of the search box and the list (required: cmdk names the combobox and the listbox with it).
   * 搜索框与列表的读屏名（必填：cmdk 用它给 combobox 与 listbox 起名）。
   */
  label: string
  /** Props passed to the Command inside (for example shouldFilter: false to rank on your own). */
  commandProps?: ComponentProps<typeof Command>
}) {
  return (
    <PopoverContent
      data-slot="combobox-content"
      align="start"
      sideOffset={2}
      className={cn(
        'w-[max(var(--radix-popover-trigger-width),220px)] overflow-hidden rounded-[7px] border-alpha-white-8 p-0 shadow-[0_8px_24px_rgba(0,0,0,0.4)]',
        className,
      )}
      {...props}
    >
      <Command label={label} {...commandProps}>
        {children}
      </Command>
    </PopoverContent>
  )
}

const ComboboxInput = CommandInput
const ComboboxList = CommandList
const ComboboxEmpty = CommandEmpty
const ComboboxGroup = CommandGroup

function ComboboxItem({
  selected = false,
  className,
  children,
  ...props
}: ComponentProps<typeof CommandItem> & {
  /** Selected: draws a check mark on the left and sets data-checked. */
  selected?: boolean
}) {
  return (
    <CommandItem
      data-slot="combobox-item"
      data-checked={selected ? '' : undefined}
      className={cn('data-[checked]:font-medium data-[checked]:text-ink', className)}
      {...props}
    >
      <span aria-hidden="true" className="w-[10px] flex-none text-ink">
        {selected ? '✓' : ''}
      </span>
      {children}
    </CommandItem>
  )
}

export {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxTrigger,
}
