// SPDX-License-Identifier: MIT
// 密钥输入：框里的字默认遮住，右侧的眼睛按钮切换显示 / 隐藏。用于连接窗的 API key、secret 与代理密码。
// 交互学自 rare-ui 的 password-input（2026-11-14 读），实现为本仓库原创，未复制其代码。
// 学到的事实（只取行为）：① 切换按钮按下时不抢走输入框的焦点（pointerdown 里 preventDefault）；② 切换输入类型会让部分浏览器丢掉选区，
// 切换后要补回光标与选区；③ 眼睛的上下眼睑用弹簧开合，闭合时多一道划线；④ 自动填充、拼写检查、自动大写都关掉。
// 不学它的强度条：控制台里填的是交易所发的密钥，强度没有意义。
import { animate, motion, useMotionValue, useTransform } from 'motion/react'
import { useEffect, useRef, useState, type ComponentProps } from 'react'
import { cn } from '../lib/cn'
import { focusRingInset } from '../lib/focus'
import { snappy } from '../lib/motion'
import { unit } from '../lib/spring'
import { Input } from '../primitives/input'

/** 眼睛的轮廓：open 为 1 是睁开的杏仁形，为 0 是压平的一条线（眼睑合上）。 */
export function eyePath(open: number): string {
  const lift = 8 * Math.min(1, Math.max(0, open))
  return `M2 12C6 ${12 - lift} 18 ${12 - lift} 22 12C18 ${12 + lift} 6 ${12 + lift} 2 12Z`
}

function Eye({ open }: { open: boolean }) {
  const amount = useMotionValue(open ? 1 : 0)
  useEffect(() => {
    const run = animate(amount, open ? 1 : 0, unit(snappy))
    return () => run.stop()
  }, [open, amount])
  const lid = useTransform(amount, eyePath)
  const strike = useTransform(amount, (value) => 1 - value)
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      data-slot="password-input-eye"
      data-open={open}
    >
      <motion.path d={lid} />
      <motion.circle
        cx={12}
        cy={12}
        r={2.4}
        style={{ opacity: amount, scale: amount, transformBox: 'fill-box', transformOrigin: 'center' }}
      />
      <motion.path d="M5 19 19 5" style={{ pathLength: strike, opacity: strike }} />
    </svg>
  )
}

export type PasswordInputProps = Omit<ComponentProps<'input'>, 'type' | 'size'> & {
  /** 切换按钮的读屏名（必填：包里没有文字）。名字不随状态变，当前是不是显示着由 aria-pressed 表达。 */
  toggleLabel: string
  defaultVisible?: boolean
  onVisibleChange?: (visible: boolean) => void
  size?: 'default' | 'sm'
}

export function PasswordInput({
  toggleLabel,
  defaultVisible = false,
  onVisibleChange,
  size,
  className,
  ref,
  disabled,
  ...props
}: PasswordInputProps) {
  const [visible, setVisible] = useState(defaultVisible)
  const input = useRef<HTMLInputElement | null>(null)
  const frame = useRef(0)
  useEffect(() => () => cancelAnimationFrame(frame.current), [])
  const toggle = () => {
    const el = input.current
    const start = el?.selectionStart ?? null
    const end = el?.selectionEnd ?? null
    const focused = el !== null && document.activeElement === el
    setVisible(!visible)
    onVisibleChange?.(!visible)
    // 改 type 之后 Chromium 会把光标放到末尾：下一帧补回原来的选区。
    cancelAnimationFrame(frame.current)
    frame.current = requestAnimationFrame(() => {
      if (el && focused && start !== null && end !== null) el.setSelectionRange(start, end)
    })
  }
  return (
    <span data-slot="password-input" data-visible={visible} className="relative inline-flex w-full">
      <Input
        {...props}
        ref={(node) => {
          input.current = node
          if (typeof ref === 'function') ref(node)
          else if (ref) ref.current = node
        }}
        type={visible ? 'text' : 'password'}
        size={size}
        disabled={disabled}
        autoComplete={props.autoComplete ?? 'off'}
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        className={cn('pr-8 [&::-ms-reveal]:hidden', className)}
      />
      <button
        type="button"
        data-slot="password-input-toggle"
        aria-label={toggleLabel}
        aria-pressed={visible}
        disabled={disabled}
        // 按下时不让输入框失焦：正在输入的人点一下眼睛，光标还在原处。
        onPointerDown={(event) => event.preventDefault()}
        onClick={toggle}
        className={cn(
          'absolute top-1/2 right-0.5 grid size-6 -translate-y-1/2 cursor-pointer place-items-center rounded-[5px] text-ink-3',
          'transition-colors duration-[120ms] not-disabled:hover:text-ink disabled:cursor-not-allowed disabled:opacity-45',
          '[&_svg]:size-[15px]',
          focusRingInset,
        )}
      >
        <Eye open={visible} />
      </button>
    </span>
  )
}
