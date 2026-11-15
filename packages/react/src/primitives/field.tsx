// SPDX-License-Identifier: MIT
// 起步代码取自 shadcn/ui（https://ui.shadcn.com ，MIT，Copyright (c) 2023 shadcn），2026-11-14 用 `shadcn add` 生成（#1870）；
// 拷进来以后归我们改：尺寸、颜色按我们的 token 重写，并补上标签、说明、错误与控件的 ARIA 关联（决策记录 0049）。
import { cva, type VariantProps } from 'class-variance-authority'
import {
  createContext,
  useCallback,
  useContext,
  useId,
  useLayoutEffect,
  useMemo,
  useState,
  type ComponentProps,
} from 'react'
import { cn } from '../lib/cn.ts'
import { Label } from './label.tsx'
import { Separator } from './separator.tsx'

// 表单字段：标签 + 控件 + 说明 + 错误排成一组。Field 是一组的根，发一个控件 id 与说明、错误的 id：
//   - FieldLabel 的 htmlFor 指向控件；FieldDescription、FieldError 带上自己的 id；
//   - 控件调 useFieldControl() 拿 { id, aria-describedby, aria-invalid, disabled } 展开到自己身上（Input、Select 的触发器、Checkbox 都行），
//     说明与错误真的渲染了才写进 aria-describedby，不会指向不存在的 id；
//   - Field 的 invalid 为真时标签变危险色、控件 aria-invalid、FieldError 才显示（role=alert，出现时读屏马上读）。
// 文案都是调用方传的 children，包里不写字。horizontal：标签在左、控件在右（设置页的行）；vertical：标签在上。
type FieldState = {
  controlId: string
  descriptionId: string
  errorId: string
  invalid: boolean
  disabled: boolean
  describedBy: string | undefined
  register: (part: 'description' | 'error') => () => void
}

const FieldContext = createContext<FieldState | null>(null)

const fieldVariants = cva('group/field flex w-full gap-1.5 data-[invalid=true]:text-danger', {
  variants: {
    /** Label above the control, or label and description on the left with the control on the right. */
    orientation: {
      vertical: 'flex-col [&>*]:w-full',
      horizontal: 'flex-row items-center justify-between gap-3',
    },
  },
  defaultVariants: { orientation: 'vertical' },
})

function Field({
  className,
  orientation,
  invalid = false,
  disabled = false,
  ...props
}: ComponentProps<'div'> &
  VariantProps<typeof fieldVariants> & {
    /** Turns the label to the danger color, marks the control aria-invalid and shows FieldError. */
    invalid?: boolean
    /** Dims the label to 45% and disables the control. */
    disabled?: boolean
  }) {
  const base = useId()
  const [parts, setParts] = useState<{ description: number; error: number }>({ description: 0, error: 0 })
  const register = useCallback((part: 'description' | 'error') => {
    setParts((current) => ({ ...current, [part]: current[part] + 1 }))
    return () => setParts((current) => ({ ...current, [part]: current[part] - 1 }))
  }, [])
  const state = useMemo<FieldState>(() => {
    const descriptionId = `${base}-description`
    const errorId = `${base}-error`
    const ids = [parts.description > 0 ? descriptionId : null, invalid && parts.error > 0 ? errorId : null].filter(
      Boolean,
    )
    return {
      controlId: `${base}-control`,
      descriptionId,
      errorId,
      invalid,
      disabled,
      describedBy: ids.length > 0 ? ids.join(' ') : undefined,
      register,
    }
  }, [base, parts, invalid, disabled, register])
  return (
    <FieldContext value={state}>
      <div
        role="group"
        data-slot="field"
        data-orientation={orientation ?? 'vertical'}
        data-invalid={invalid}
        data-disabled={disabled}
        className={cn(fieldVariants({ orientation }), className)}
        {...props}
      />
    </FieldContext>
  )
}

/** 控件要展开的属性：id 对上标签，aria-describedby 指向渲染着的说明与错误，invalid 时 aria-invalid。在 Field 外面调用返回空对象。 */
function useFieldControl() {
  const field = useContext(FieldContext)
  if (!field) return {}
  return {
    id: field.controlId,
    'aria-describedby': field.describedBy,
    'aria-invalid': field.invalid || undefined,
    ...(field.disabled ? { disabled: true } : {}),
  }
}

function FieldSet({ className, ...props }: ComponentProps<'fieldset'>) {
  return (
    <fieldset
      data-slot="field-set"
      className={cn('m-0 flex min-w-0 flex-col gap-4 border-0 p-0', className)}
      {...props}
    />
  )
}

function FieldLegend({ className, ...props }: ComponentProps<'legend'>) {
  return <legend data-slot="field-legend" className={cn('k-text-title mb-2 p-0 text-ink', className)} {...props} />
}

function FieldGroup({ className, ...props }: ComponentProps<'div'>) {
  return <div data-slot="field-group" className={cn('flex w-full flex-col gap-4', className)} {...props} />
}

/** 标签 + 说明的一栏（horizontal 的 Field 里放在左边）。 */
function FieldContent({ className, ...props }: ComponentProps<'div'>) {
  return <div data-slot="field-content" className={cn('flex min-w-0 flex-1 flex-col gap-1', className)} {...props} />
}

function FieldLabel({ className, ...props }: ComponentProps<typeof Label>) {
  const field = useContext(FieldContext)
  return (
    <Label
      data-slot="field-label"
      htmlFor={field?.controlId}
      className={cn(
        'w-fit group-data-[disabled=true]/field:opacity-45 group-data-[invalid=true]/field:text-danger',
        className,
      )}
      {...props}
    />
  )
}

function FieldDescription({ className, id, ...props }: ComponentProps<'p'>) {
  const field = useContext(FieldContext)
  const register = field?.register
  useLayoutEffect(() => register?.('description'), [register])
  return (
    <p
      data-slot="field-description"
      id={id ?? field?.descriptionId}
      className={cn('k-text-caption m-0 text-ink-3', className)}
      {...props}
    />
  )
}

/** 错误：Field 的 invalid 为真才渲染；children 是调用方写的话。 */
function FieldError({ className, id, children, ...props }: ComponentProps<'div'>) {
  const field = useContext(FieldContext)
  const register = field?.register
  const shown = field ? field.invalid : true
  useLayoutEffect(() => (shown ? register?.('error') : undefined), [register, shown])
  if (!shown || !children) return null
  return (
    <div
      role="alert"
      data-slot="field-error"
      id={id ?? field?.errorId}
      className={cn('k-text-caption text-danger', className)}
      {...props}
    >
      {children}
    </div>
  )
}

/** 字段之间的分隔线；有 children 时线中间写一小段字（「或」之类，调用方给）。 */
function FieldSeparator({ children, className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="field-separator"
      data-content={Boolean(children)}
      className={cn('relative -my-1 flex h-5 items-center', className)}
      {...props}
    >
      <Separator className="absolute inset-x-0 top-1/2" />
      {children ? (
        <span
          data-slot="field-separator-content"
          className="k-text-caption relative mx-auto block w-fit bg-surface-3 px-2 text-ink-3"
        >
          {children}
        </span>
      ) : null}
    </div>
  )
}

export {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
  useFieldControl,
}
