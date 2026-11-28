// SPDX-License-Identifier: MIT
// 改自 SmoothUI morph-toggle（https://github.com/educlopez/smoothui ，MIT，© 2024 Eduardo Calvo）：圆钮滑过去时形状跟着变（方 ↔ 圆），或钮里换图标；
// 行为底座换成 UI SDK 的 Switch（role=switch、表单的 name / value、键盘），弹簧用我们的 snappy。
import { Switch as SwitchRoot } from '@ui-sdk/react/switch'
import { AnimatePresence, motion } from 'motion/react'
import { useState, type ComponentProps, type ReactNode } from 'react'
import { cn } from '../lib/cn.ts'
import { focusRing } from '../lib/focus.ts'
import { snappy } from '../lib/motion.ts'
import { legacyState, part, pressOnEnter } from '../lib/legacy-attrs.ts'
import { unit } from '../lib/spring.ts'

// 尺寸：md（旧名 default）与 Switch 一样（轨道 34 × 18 · 圆钮 14），lg 给带图标的圆钮（轨道 44 × 24 · 圆钮 20）。外层盒子的高、焦点环也照 Switch：--target-min。
const SIZES = {
  md: { track: 'w-[34px] h-[18px]', thumb: 14, travel: 16, inset: 2, box: 'w-10' },
  lg: { track: 'w-[44px] h-[24px]', thumb: 20, travel: 20, inset: 2, box: 'w-[50px]' },
} as const

// 圆钮的两种圆角：关时 3px 的小圆角方块，开时全圆（morph 变体）。
const RADIUS_OFF = 3
const RADIUS_ON = 999

/**
 * 开关的动效版：variant=morph 圆钮滑动时方块变圆，icon 在圆钮里放两个图标（开、关各一个）转着换。
 * 要一个普通开关用 Switch；这个件是给「有仪式感」的单个开关（主题、静音、实盘模式）。读屏名必须传 aria-label。
 */
function MorphToggle({
  className,
  variant = 'morph',
  size = 'md',
  icons,
  checked: checkedProp,
  defaultChecked = false,
  onCheckedChange,
  onKeyDown,
  ...props
}: Omit<ComponentProps<typeof SwitchRoot>, 'children' | 'onCheckedChange'> & {
  /** Called with the new state when the user flips it. */
  onCheckedChange?: (checked: boolean) => void
  /** Thumb motion: morph changes the thumb shape while it slides, icon swaps the icons inside it, plain only slides. */
  variant?: 'plain' | 'morph' | 'icon'
  /** md (default) matches Switch; lg is bigger so an icon fits in the thumb. `'default'` is the deprecated name of md. */
  size?: keyof typeof SIZES | 'default'
  /** Icons shown in the thumb for the on and off states (icon variant). */
  icons?: { on: ReactNode; off: ReactNode }
  /** Accessible name (required). */
  'aria-label': string
}) {
  const [inner, setInner] = useState(defaultChecked)
  const checked = checkedProp ?? inner
  const dims = SIZES[size === 'default' ? 'md' : size]
  // 弹簧：moving 的位置与圆角用同一条 snappy；0 到 1 的量（缩放、透明度）用 unit() 收紧停止阈值。
  const spring = unit(snappy)
  return (
    <SwitchRoot
      render={part('button', { slot: 'morph-toggle', state: legacyState.checked })}
      onKeyDown={(event) => {
        onKeyDown?.(event)
        pressOnEnter(event)
      }}
      data-variant={variant}
      checked={checked}
      onCheckedChange={(next) => {
        if (checkedProp === undefined) setInner(next)
        onCheckedChange?.(next)
      }}
      className={cn(
        'group relative inline-flex h-(--target-min) shrink-0 cursor-pointer items-center justify-center rounded-full border-0 bg-transparent p-0',
        'disabled:cursor-not-allowed disabled:opacity-45',
        dims.box,
        focusRing,
        className,
      )}
      {...props}
    >
      <span
        data-slot="morph-toggle-track"
        aria-hidden
        className={cn(
          'pointer-events-none relative rounded-full bg-(--k-selectable-track-background) shadow-[inset_0_0_0_1px_var(--k-selectable-track-borderColor)]',
          'transition-[background-color,box-shadow] duration-150 group-enabled:group-hover:bg-(--k-selectable-track-background-hover)',
          'group-data-[state=checked]:bg-(--k-selectable-bold-background-selected) group-data-[state=checked]:shadow-none group-data-[state=checked]:group-enabled:group-hover:bg-(--k-selectable-bold-background-selectedHover)',
          dims.track,
        )}
      >
        <motion.span
          data-slot="morph-toggle-thumb"
          initial={false}
          animate={{
            x: checked ? dims.travel : 0,
            borderRadius: variant === 'morph' && !checked ? RADIUS_OFF : RADIUS_ON,
          }}
          transition={spring}
          style={{ width: dims.thumb, height: dims.thumb, left: dims.inset, top: dims.inset }}
          className={cn(
            'absolute grid place-items-center bg-(--k-selectable-thumb-background) shadow-[var(--shadow-thumb)]',
            checked && 'bg-(--k-selectable-bold-foreground-selected)',
          )}
        >
          {variant === 'icon' && icons ? (
            <AnimatePresence initial={false} mode="wait">
              <motion.span
                key={checked ? 'on' : 'off'}
                initial={{ opacity: 0, rotate: 90, scale: 0.5 }}
                animate={{ opacity: 1, rotate: 0, scale: 1 }}
                exit={{ opacity: 0, rotate: -90, scale: 0.5 }}
                transition={spring}
                className={cn(
                  'grid place-items-center',
                  checked
                    ? 'text-(color:--k-selectable-bold-background-selected)'
                    : 'text-(color:--k-selectable-bold-foreground-selected)',
                )}
                style={{ width: dims.thumb - 6, height: dims.thumb - 6 }}
              >
                {checked ? icons.on : icons.off}
              </motion.span>
            </AnimatePresence>
          ) : null}
        </motion.span>
      </span>
    </SwitchRoot>
  )
}

export { MorphToggle }
