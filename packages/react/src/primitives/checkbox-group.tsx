// SPDX-License-Identifier: MIT
// 改自 SmoothUI checkbox-group（https://github.com/educlopez/smoothui ，MIT，© 2024 Eduardo Calvo）：一组勾选，带「全选」父项（部分选中时是半选）。
import {
  createContext,
  useCallback,
  useContext,
  useId,
  useMemo,
  useState,
  type ComponentProps,
  type ReactNode,
} from 'react'
import { cn } from '../lib/cn.ts'
import { Checkbox } from './checkbox.tsx'

type GroupState = {
  value: readonly string[]
  allValues: readonly string[]
  disabled: boolean
  toggle: (item: string, on: boolean) => void
  toggleAll: (on: boolean) => void
}
const GroupContext = createContext<GroupState | null>(null)

/**
 * 一组勾选：值是被选中的项的数组。受控传 value + onValueChange，不受控传 defaultValue。
 * 要「全选」父项，必须把所有子项的值传给 allValues（组本身不扫描 children）。读屏名用 aria-label 或 aria-labelledby。
 */
function CheckboxGroup({
  value: valueProp,
  defaultValue = [],
  onValueChange,
  allValues = [],
  disabled = false,
  className,
  ...props
}: Omit<ComponentProps<'div'>, 'defaultValue' | 'onChange'> & {
  /** The selected item values (controlled). */
  value?: readonly string[]
  /** The initially selected item values (uncontrolled). */
  defaultValue?: readonly string[]
  /** Called with the new list of selected values. */
  onValueChange?: (value: string[]) => void
  /** Every child value; required when the group has a parent (select all) item. */
  allValues?: readonly string[]
  /** Disables the whole group. */
  disabled?: boolean
}) {
  const [inner, setInner] = useState<readonly string[]>(defaultValue)
  const value = valueProp ?? inner
  const set = useCallback(
    (next: string[]) => {
      if (valueProp === undefined) setInner(next)
      onValueChange?.(next)
    },
    [valueProp, onValueChange],
  )
  const state = useMemo<GroupState>(
    () => ({
      value,
      allValues,
      disabled,
      toggle: (item, on) => set(on ? [...value.filter((v) => v !== item), item] : value.filter((v) => v !== item)),
      toggleAll: (on) => set(on ? [...allValues] : []),
    }),
    [value, allValues, disabled, set],
  )
  return (
    <GroupContext value={state}>
      <div role="group" data-slot="checkbox-group" className={cn('grid gap-2', className)} {...props} />
    </GroupContext>
  )
}

/** 组里的一项：左边勾选框、右边文字（children，点文字也能勾）；parent 为真时它是「全选」，部分选中显示半选。 */
function CheckboxGroupItem({
  value,
  parent = false,
  disabled,
  children,
  className,
  indicator,
}: {
  /** The value of this item; omit it on the parent item. */
  value?: string
  /** Makes this the select-all item. */
  parent?: boolean
  /** Disables this item. */
  disabled?: boolean
  /** The label next to the box (required, it is the accessible name). */
  children: ReactNode
  /** Extra class name on the row. */
  className?: string
  /** Mark inside the box, see Checkbox. */
  indicator?: ComponentProps<typeof Checkbox>['indicator']
}) {
  const group = useContext(GroupContext)
  const id = useId()
  if (!group) throw new Error('CheckboxGroupItem 必须放在 CheckboxGroup 里')
  const selected = group.value.filter((v) => group.allValues.includes(v)).length
  const checked: boolean | 'indeterminate' = parent
    ? selected === 0
      ? false
      : selected === group.allValues.length
        ? true
        : 'indeterminate'
    : group.value.includes(value ?? '')
  const off = disabled || group.disabled
  return (
    <div data-slot="checkbox-group-item" className={cn('flex items-center gap-2', className)}>
      <Checkbox
        id={id}
        indicator={indicator}
        checked={checked}
        disabled={off}
        onCheckedChange={(next) => (parent ? group.toggleAll(next === true) : group.toggle(value ?? '', next === true))}
      />
      <label
        htmlFor={id}
        className={cn(
          'k-text-body cursor-pointer text-ink',
          off && 'cursor-not-allowed opacity-45',
          parent && 'font-medium',
        )}
      >
        {children}
      </label>
    </div>
  )
}

export { CheckboxGroup, CheckboxGroupItem }
