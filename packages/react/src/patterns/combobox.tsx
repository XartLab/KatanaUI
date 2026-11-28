// SPDX-License-Identifier: MIT
import type { ComponentProps, ReactNode, Ref } from 'react'
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
// 行可选带两个槽（#193）：prefix（文字前的头像、图标，纯装饰）与 description（文字下的第二行说明）；都不传就跟以前一样。
// 带槽时 value 默认取主文字（字符串时），说明不进搜索，要搜就放 keywords；主文字不是字符串时自己传 value。
// 要在输入框里带标签的多选，用 TagCombobox（patterns/tag-combobox.tsx）。
// 文案（占位、没有结果）都由调用方传，包里不写字。
function Combobox({ ...props }: ComponentProps<typeof Popover>) {
  return <Popover {...props} />
}

// UI SDK 的弹层触发器自己写 aria-haspopup="dialog"（写在调用方的 props 之后）；combobox 的弹出物是 listbox（迁移前也是），
// 所以挂载后盯着这个属性，被改就写回。
function keepListbox(node: HTMLButtonElement | null) {
  if (!node) return
  const set = () => node.getAttribute('aria-haspopup') !== 'listbox' && node.setAttribute('aria-haspopup', 'listbox')
  set()
  const observer = new MutationObserver(set)
  observer.observe(node, { attributes: true, attributeFilter: ['aria-haspopup'] })
  return () => observer.disconnect()
}

function ComboboxTrigger({ className, children, ...props }: ComponentProps<typeof PopoverTrigger>) {
  return (
    <PopoverTrigger
      data-slot="combobox-trigger"
      role="combobox"
      aria-haspopup="listbox"
      ref={keepListbox as Ref<HTMLButtonElement>}
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
      aria-label={label}
      align="start"
      sideOffset={2}
      className={cn(
        'w-[max(var(--anchor-width),220px)] overflow-hidden rounded-[var(--radius-overlay)] border-(color:--k-overlay-compact-borderColor) p-0 shadow-(--k-overlay-compact-shadow)',
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
  prefix,
  description,
  className,
  children,
  value,
  ...props
}: Omit<ComponentProps<typeof CommandItem>, 'prefix'> & {
  /** Selected: draws a check mark on the left and sets data-checked. */
  selected?: boolean
  /**
   * Node before the text (avatar, icon, flag). Decorative: hidden from screen readers, so the row text must carry the name.
   * 文字前面的节点（头像、图标、旗）；纯装饰，读屏不读，名字要写在行的文字里。
   */
  prefix?: ReactNode
  /**
   * Second line under the text (a role, an exchange). Searched by the row's value only if you put it in keywords.
   * 文字下面的第二行说明（角色、交易所）。要按它搜，把它也放进 keywords。
   */
  description?: ReactNode
}) {
  // cmdk 在没传 value 时用行的 textContent 当 value：带了说明或前缀，value 就成了「主文字 + 说明（+ 前缀里的字）」的拼接串，
  // 说明会被搜到、onSelect 也收到拼接串（#198 审查）。所以带槽、没传 value、主文字是字符串时，用主文字当 value；主文字不是字符串时调用方要自己传 value。
  const rowValue = value ?? ((prefix || description) && typeof children === 'string' ? children : undefined)
  return (
    <CommandItem
      data-slot="combobox-item"
      value={rowValue}
      data-checked={selected ? '' : undefined}
      className={cn(
        'data-[checked]:font-medium data-[checked]:text-(color:--k-content-primary-foreground)',
        // 带第二行说明时行自己长高（不然 30 高放不下两行）；不带就还是 30 高，跟以前一样。
        // Graphite 的 .k-pop-item 规则（theme/graphite.css）把高写死 32、竖向内距 0；带说明的行在那个文件里用 :has() 放开，这里不用 ! 去压。
        description ? 'h-auto min-h-[30px] py-1.5' : undefined,
        className,
      )}
      {...props}
    >
      <span aria-hidden="true" className="w-[10px] flex-none text-(color:--k-content-primary-foreground)">
        {selected ? '✓' : ''}
      </span>
      {prefix ? (
        <span aria-hidden="true" data-slot="combobox-item-prefix" className="inline-flex flex-none items-center">
          {prefix}
        </span>
      ) : null}
      {description ? (
        <span className="flex min-w-0 flex-col gap-px">
          <span>{children}</span>
          <span
            data-slot="combobox-item-description"
            className="k-text-caption font-normal text-(color:--k-content-secondary-foreground)"
          >
            {description}
          </span>
        </span>
      ) : (
        children
      )}
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
