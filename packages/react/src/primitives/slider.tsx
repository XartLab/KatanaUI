// SPDX-License-Identifier: MIT
// 起步代码取自 shadcn/ui（https://ui.shadcn.com ，MIT，Copyright (c) 2023 shadcn），2026-11-13 用 `shadcn add slider` 生成（#1794），行为底座是 Radix；
// 拷进来以后归我们改：样子照组件卡（决策记录 0049），拖动跟手与松手吸附是我们加的。
import { Slider as SliderPrimitive } from 'radix-ui'
import { useEffect, useRef, useState, type ComponentProps, type PointerEvent } from 'react'
import { cn } from '../lib/cn.ts'
import { focusRing } from '../lib/focus.ts'

// 滑块：KATANA 自有件，照组件卡（design/katana-console/project/components/Controls/README.md「Slider」）：
// 凹槽轨（6 高 · 最深底 · 1px 线 · recess）+ 点阵填充（3px 亮 2px 暗的竖纹）+ 圆把手（14 · 强调色，不发光）；拖动跟手，松手 settle 弹簧吸附到步进；键盘 ← →。
// 跟手：Radix 只给步进后的值，把手会一格一格跳。单个把手时这里另外量指针在轨上的位置（手的位置），把手与填充画在手的位置上，
// 值仍是步进的（onValueChange 照给）；松手后把手与填充走 settle 弹簧（theme/motion.css 的 slider-thumb、slider-fill）落到步进位置。
// 两个把手（范围）不做跟手，把手按步进走，填充用 Radix 的 Range。
const THUMB = 14

function Slider({
  className,
  value,
  min = 0,
  max = 100,
  step = 1,
  thumbLabels,
  disabled,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
  ...props
}: Omit<ComponentProps<typeof SliderPrimitive.Root>, 'value' | 'defaultValue' | 'orientation'> & {
  /**
   * One value per thumb; two values make a range.
   * 受控：每个把手一个值。
   */
  value: readonly number[]
  /**
   * Accessible name of each thumb (the name goes on the real slider element, not on the Root).
   * 每个把手的名字（读屏器读它；名字只放在真正的 slider 上，Root 是没有 role 的 span）。
   */
  thumbLabels?: readonly string[]
}) {
  const single = value.length === 1
  const root = useRef<HTMLSpanElement>(null)
  // hand：拖动时把手中心跟着手的位置（0..1 的比例，按把手能走的那段轨算）与那段轨的像素长；settling：松手后这一段时间里把手与填充带弹簧过渡。
  const [hand, setHand] = useState<{ fraction: number; span: number } | null>(null)
  const [settling, setSettling] = useState(false)
  const timer = useRef<number | undefined>(undefined)
  useEffect(() => () => window.clearTimeout(timer.current), [])

  const aim = (event: PointerEvent<HTMLSpanElement>) => {
    const box = root.current?.getBoundingClientRect()
    if (!box || box.width === 0) return
    const span = box.width - THUMB
    setHand({ fraction: Math.min(1, Math.max(0, (event.clientX - box.left - THUMB / 2) / span)), span })
  }
  const release = () => {
    if (!hand) return
    setHand(null)
    setSettling(true)
    window.clearTimeout(timer.current)
    // 时长取 --dur-settle（783ms）再留一点余量；过了以后键盘改值不再带弹簧（把手那时是直接跳的，填充不能自己慢半拍）。
    timer.current = window.setTimeout(() => setSettling(false), 900)
  }

  const stepped = ((value[0] ?? min) - min) / (max - min || 1)
  const fraction = hand ? hand.fraction : stepped
  const at = value.map((v) => (v - min) / (max - min || 1))
  const low = Math.min(...at)
  const high = Math.max(...at)
  return (
    <SliderPrimitive.Root
      ref={root}
      data-slot="slider"
      data-dragging={hand ? '' : undefined}
      data-settling={settling ? '' : undefined}
      value={[...value]}
      min={min}
      max={max}
      step={step}
      disabled={disabled}
      className={cn(
        'relative flex h-7 w-full touch-none items-center select-none',
        'data-[disabled]:cursor-not-allowed data-[disabled]:opacity-40',
        className,
      )}
      onPointerDown={(event) => {
        onPointerDown?.(event)
        if (single && !disabled && event.button === 0) {
          setSettling(false)
          aim(event)
        }
      }}
      onPointerMove={(event) => {
        onPointerMove?.(event)
        if (hand) aim(event)
      }}
      onPointerUp={(event) => {
        onPointerUp?.(event)
        release()
      }}
      onPointerCancel={(event) => {
        onPointerCancel?.(event)
        release()
      }}
      {...props}
    >
      <SliderPrimitive.Track
        data-slot="slider-track"
        className="relative h-[6px] w-full grow border border-line bg-surface-0 shadow-[var(--recess)]"
      >
        {single ? (
          // 填充的右端停在把手中心：宽度 = 比例 × (轨宽 − 把手) + 把手的一半。
          <span
            data-slot="slider-fill"
            className="absolute inset-y-0 left-0 bg-[repeating-linear-gradient(90deg,var(--signal-orange)_0_3px,transparent_3px_5px)]"
            style={{ width: `calc(${fraction} * (100% - ${THUMB}px) + ${THUMB / 2}px)` }}
          />
        ) : (
          // 多把手：填充从最小那个把手的中心到最大那个的中心（Radix 的 Range 按百分比摆，两端对不到把手中心，差最多 7px）。
          <span
            data-slot="slider-fill"
            className="absolute inset-y-0 bg-[repeating-linear-gradient(90deg,var(--signal-orange)_0_3px,transparent_3px_5px)]"
            style={{
              left: `calc(${low} * (100% - ${THUMB}px) + ${THUMB / 2}px)`,
              width: `calc(${high - low} * (100% - ${THUMB}px))`,
            }}
          />
        )}
      </SliderPrimitive.Track>
      {value.map((_, index) => (
        <SliderPrimitive.Thumb
          key={index}
          data-slot="slider-thumb"
          aria-label={thumbLabels?.[index]}
          className={cn(
            'box-border block size-[14px] shrink-0 cursor-grab rounded-full border-2 border-surface-3 bg-(--accent)',
            'active:cursor-grabbing',
            focusRing,
          )}
          style={hand && single ? { translate: `${(hand.fraction - stepped) * hand.span}px 0` } : undefined}
        />
      ))}
    </SliderPrimitive.Root>
  )
}

export { Slider }
