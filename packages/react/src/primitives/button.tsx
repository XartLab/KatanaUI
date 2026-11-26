// SPDX-License-Identifier: MIT
// 起步代码取自 shadcn/ui（https://ui.shadcn.com ，MIT，Copyright (c) 2023 shadcn），2026-11-11 用 `shadcn add` 生成（#1777），行为底座是 Radix；
// 拷进来以后归我们改：样子（尺寸、颜色、动效）按 OpenMarket 实测样式与我们的 token 重写（决策记录 0049）。
import { cva, type VariantProps } from 'class-variance-authority'
import { Slot } from 'radix-ui'
import { animate } from 'motion/react'
import { useEffect, useRef, type ComponentProps, type Ref } from 'react'
import { cn } from '../lib/cn.ts'
import { PENDING_DELAY_MS, PENDING_MIN_MS, useDelayedFlag, useSpinWholeTurns } from '../lib/delayed-flag.ts'
import { focusRing } from '../lib/focus.ts'

// 按钮：照 OpenMarket action-btn / tsc-add（2026-10-05 实测，数值照抄，颜色落到 token）。30 高 · 圆角 control · 4% 白底 8% 白边 · 12px 500；
// 主按钮实心浅色 + 深字 700；悬停提亮、按下再深一档并缩到 0.97（界面在听）。禁用不接指针事件之外的任何状态变化。
// 颜色与尺寸只读 characteristics 与 density（--k-*，#1943，照 Salt 的分层）：不写 palette 名；高度与内距随 data-density 变，默认 medium 与改前一致。
// 进行中（pending，#251 批 A，kubai Vibe Design Tips 017）：单个动作等 0.3 到 3s，在按钮原地说，字与宽度不变。pending 满 300ms 才出转圈、出了至少留 500ms（useDelayedFlag）；
// 转圈是一个绝对定位的小环，不进文字的排版，所以按钮宽度前后一致：有字的画在左内边距里，图标按钮里换掉原图标、居中。进行中不能再按（aria-disabled 加吞掉点击，不用 disabled，键盘与读屏仍能到），aria-busy=true，不灰按钮、不盖整页。
// 按钮自己的图标就是动作（刷新、同步）时传 spinIcon：按下立刻转那颗图标（不等 300ms、不另出转圈），至少转一整圈，停在整圈上（useSpinWholeTurns）。
// Tailwind 的 (--x) 简写在颜色与长度之间有歧义的地方（border、text、decoration）写 (color:--x) 说明类型。
const buttonVariants = cva(
  [
    'relative inline-flex shrink-0 cursor-pointer items-center justify-center gap-(--k-spacing-100) whitespace-nowrap select-none',
    'k-text-data leading-none rounded-[var(--radius-control)] border border-(color:--k-actionable-borderColor) bg-(--k-actionable-background) text-(color:--k-actionable-foreground)',
    'transition-[color,background-color,border-color,scale] duration-150 ease-out',
    'not-disabled:hover:bg-(--k-actionable-background-hover) not-disabled:hover:text-(color:--k-actionable-foreground-hover) not-disabled:active:scale-[0.97] not-disabled:active:bg-(--k-actionable-background-active)',
    'disabled:cursor-not-allowed disabled:opacity-45',
    // 进行中：不灰、不再有按下缩放；转自己图标时（spinIcon）图标按我们的周期转（SPIN_TURN_MS，640ms）。
    'aria-busy:cursor-progress aria-busy:active:scale-100! data-[spinning=true]:[&_svg]:animate-[spin_640ms_linear_infinite]',
    '[&_svg]:pointer-events-none [&_svg]:size-[13px] [&_svg]:shrink-0',
    focusRing,
  ],
  {
    variants: {
      /**
       * Visual style: primary is the solid light button, danger uses the danger text color, icon is a borderless 28px icon button.
       */
      variant: {
        default: '',
        primary:
          'border-transparent bg-(--k-actionable-bold-background) font-bold text-(color:--k-actionable-bold-foreground) not-disabled:hover:bg-(--k-actionable-bold-background-hover) not-disabled:hover:text-(color:--k-actionable-bold-foreground-hover) not-disabled:active:bg-(--k-actionable-bold-background-active)',
        danger:
          'border-(color:--k-actionable-negative-borderColor) bg-(--k-actionable-negative-background) text-(color:--k-actionable-negative-foreground) not-disabled:hover:bg-(--k-actionable-negative-background-hover) not-disabled:hover:text-(color:--k-actionable-negative-foreground) not-disabled:active:bg-(--k-actionable-negative-background-active)',
        ghost: 'border-transparent bg-transparent not-disabled:hover:bg-(--k-actionable-background-hover)',
        // 图标按钮（原 .k-icon-btn，照 OpenMarket asd-panel-close）：28 × 28 · 透明 · 无边 · 悬停 5% 白，按下不缩放、不再深一档（改前没有按下态，2026-11-13 独立审）；焦点环画在里面（贴边的小按钮，外移会被容器裁掉）。
        icon: 'size-(--k-size-row) border-0 bg-transparent p-0 text-(color:--k-actionable-subtle-foreground) transition-[color,background-color] duration-[120ms] not-disabled:hover:bg-(--k-actionable-subtle-background-hover) not-disabled:hover:text-(color:--k-actionable-subtle-foreground-hover) not-disabled:active:scale-100 not-disabled:active:bg-(--k-actionable-subtle-background-active) disabled:opacity-35 focus-visible:-outline-offset-2 [&_svg]:size-[15px]',
        link: 'border-transparent bg-transparent font-normal text-(color:--k-content-secondary-foreground) underline decoration-(color:--k-separable-primary-borderColor) underline-offset-[3px] not-disabled:hover:bg-transparent not-disabled:hover:text-(color:--k-content-primary-foreground) not-disabled:active:bg-transparent',
      },
      /** Height: md is 30px, sm is 26px with an 8px radius, icon is a 28px square (any variant, icon-only content). */
      size: {
        md: 'h-(--k-size-base) px-(--k-spacing-200)',
        sm: 'k-text-caption h-[26px] rounded-[8px] px-2 font-semibold',
        icon: 'size-(--k-size-row) p-0',
      },
    },
    // 链接按钮：高 auto · 内边 2px 4px（size 的类写在 variant 之后会盖掉它，所以单独列；改前 .k-btn.lnk，ui.css 52-62）。
    compoundVariants: [{ variant: 'link', size: 'md', class: 'h-auto px-1 py-0.5' }],
    defaultVariants: { variant: 'default', size: 'md' },
  },
)

// 进行中的小环（不进排版：绝对定位，所以宽度不变）：环 1.5px、轨 30%、一圈 900ms（kubai 017：一圈约 0.9s），颜色取按钮的前景色（currentColor）。
// 有字的按钮画在左内边距里（md 内边 12px 放 10px；sm 内边 8px 放 7px），图标按钮居中；链接按钮内边只有 4px，画到字的左外侧。
const SPINNER_BASE =
  'pointer-events-none absolute rounded-full border-[1.5px] border-current/30 border-t-current animate-[spin_900ms_linear_infinite]'
const spinnerClass = (size: ButtonSize, variant: string | null | undefined) =>
  cn(
    SPINNER_BASE,
    size === 'icon'
      ? 'top-1/2 left-1/2 size-[13px] -translate-x-1/2 -translate-y-1/2'
      : variant === 'link'
        ? 'top-1/2 left-[-12px] size-2.5 -translate-y-1/2'
        : size === 'sm'
          ? 'top-1/2 left-px size-[7px] -translate-y-1/2'
          : 'top-1/2 left-px size-2.5 -translate-y-1/2',
  )

type ButtonEffect = 'magnetic' | 'dot-morph' | 'clip-corners'

/**
 * Button height: sm or md (default); icon is the 28px square for icon-only buttons.
 * 尺寸统一 sm | md（体检 §4，G1）；icon 是形状（正方形），不是高度档，留着；'default' 是旧名，等于 md。
 */
type ButtonSize = 'sm' | 'md' | 'icon'

/** Maps the deprecated size name to the current one. */
const buttonSizeOf = (size: ButtonSize | 'default' | null | undefined): ButtonSize =>
  size == null || size === 'default' ? 'md' : size

// 磁吸：指针靠近按钮时按钮朝指针偏一点，离开后弹回。弹簧参数取自 SmoothUI magnetic-button（bounce 0.1 · duration 0.4）；
// 只在有精确指针的设备上生效（hover: hover 且 pointer: fine）。没开 magnetic 的按钮不挂任何监听，也不建任何弹簧。
const MAGNET_SPRING = { type: 'spring', bounce: 0.1, duration: 0.4 } as const

function useMagnet(ref: { current: HTMLElement | null }, enabled: boolean, strength: number, radius: number) {
  useEffect(() => {
    const el = ref.current
    if (!enabled || !el || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return
    let resting = true
    const move = (event: PointerEvent) => {
      const box = el.getBoundingClientRect()
      const dx = event.clientX - (box.left + box.width / 2)
      const dy = event.clientY - (box.top + box.height / 2)
      const distance = Math.hypot(dx, dy)
      // 离中心越近吸得越多，出了半径就回到 0；已经在原位又在半径外就不再重启弹簧。
      const pull = distance < radius ? (1 - distance / radius) * strength : 0
      if (pull === 0 && resting) return
      resting = pull === 0
      animate(el, { x: dx * pull, y: dy * pull }, MAGNET_SPRING)
    }
    window.addEventListener('pointermove', move, { passive: true })
    return () => {
      window.removeEventListener('pointermove', move)
      animate(el, { x: 0, y: 0 }, { duration: 0 })
    }
  }, [ref, enabled, strength, radius])
}

function Button({
  className,
  variant = 'default',
  size: sizeProp,
  asChild = false,
  type,
  effect,
  magnetStrength = 0.3,
  magnetRadius = 120,
  pending = false,
  spinIcon = false,
  onClick,
  'aria-disabled': ariaDisabled,
  children,
  ref,
  ...props
}: ComponentProps<'button'> &
  Omit<VariantProps<typeof buttonVariants>, 'size'> & {
    /**
     * Height: sm is 26px, md (default) is 30px, icon is a 28px square. `'default'` is the deprecated name of md.
     */
    size?: ButtonSize | 'default' | null
    /** Render the child element itself (a link, a menu trigger) instead of wrapping it in a button. */
    asChild?: boolean
    /**
     * Optional hover effect from SmoothUI: magnetic leans toward the pointer, dot-morph stretches a leading dot into a bar, clip-corners cuts the corners wider.
     * 可选的悬停效果（改自 SmoothUI）：magnetic 朝指针偏、dot-morph 前面一颗点拉成竖条、clip-corners 四个角切口变大；dot-morph 不能与 asChild 同用。
     */
    effect?: ButtonEffect
    /** How far a magnetic button leans: the fraction of the pointer offset it follows (0 to 1). */
    magnetStrength?: number
    /** Distance in px from the button center within which a magnetic button reacts. */
    magnetRadius?: number
    /**
     * The action is running. After 300ms a small spinner appears in place (kept at least 500ms); the label and the width do not change.
     * While it runs a second press is swallowed (aria-disabled, still focusable), aria-busy is true, and the button is not greyed out.
     * 动作进行中：满 300ms 才在原地出转圈（出了至少留 500ms），字与宽度不变；期间再按无效（aria-disabled，仍可聚焦），aria-busy=true，不灰。asChild 时只有 aria 与吞掉传给 Button 的 onClick，没有转圈（子元素自己的点击处理不归这里管）。
     */
    pending?: boolean
    /**
     * Use with pending when the button's own icon already means the action (refresh, sync): that icon turns from the press, at least one whole turn, and stops on a whole turn; no separate spinner.
     * 按钮自己的图标就是动作（刷新、同步）：pending 时转它自己，按下立刻转，至少一整圈、停在整圈上，不另出转圈。
     */
    spinIcon?: boolean
  }) {
  const size = buttonSizeOf(sizeProp)
  const Comp = asChild ? Slot.Root : 'button'
  const own = useRef<HTMLButtonElement | null>(null)
  useMagnet(own, effect === 'magnetic', magnetStrength, magnetRadius)
  const spinner = useDelayedFlag(pending && !spinIcon, PENDING_DELAY_MS, PENDING_MIN_MS)
  const spinning = useSpinWholeTurns(pending && spinIcon)
  // 忙：动作在跑，或转圈还在留着（至少 500ms）。忙时挡住再按、读屏读「忙」。
  const busy = pending || spinner
  const setRef = (node: HTMLButtonElement | null) => {
    own.current = node
    if (typeof ref === 'function') ref(node)
    else if (ref) (ref as { current: HTMLButtonElement | null }).current = node
  }
  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      data-effect={effect}
      data-pending={busy || undefined}
      data-spinning={spinning || undefined}
      aria-busy={busy || undefined}
      aria-disabled={busy || ariaDisabled}
      ref={setRef as Ref<HTMLButtonElement>}
      // 原生 button 默认是 submit；放进表单里误提交的坑比多写一个 type 大得多。
      type={asChild ? type : (type ?? 'button')}
      className={cn(
        buttonVariants({ variant, size }),
        // 转圈出了以后：图标按钮里原图标让位（占位不变），有字的按钮里图标位留空；字不动。
        spinner && '[&_svg]:invisible',
        className,
      )}
      onClick={(event) => {
        // 进行中吞掉再按：不触发上层的 onClick，也不提交表单；键盘 Enter / Space 同样走这里。
        if (busy) {
          event.preventDefault()
          return
        }
        onClick?.(event)
      }}
      {...props}
    >
      {/* asChild 的 Slot 只认一个子元素，不能在前面塞点；dot-morph 因此不与 asChild 同用。 */}
      {asChild ? (
        children
      ) : (
        <>
          {effect === 'dot-morph' ? <span aria-hidden="true" data-slot="button-dot" /> : null}
          {spinner ? (
            <span aria-hidden="true" data-slot="button-spinner" className={spinnerClass(size, variant)} />
          ) : null}
          {children}
        </>
      )}
    </Comp>
  )
}

export { Button, buttonSizeOf, buttonVariants }
export type { ButtonSize }
