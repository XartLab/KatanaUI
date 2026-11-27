// SPDX-License-Identifier: MIT
// 改自 SmoothUI agent-avatar（https://github.com/educlopez/smoothui ，MIT，© 2024 Eduardo Calvo）
// Agent 的像素头像：由一个字符串种子确定地生成 6x6 的色块（同一个种子永远同一张脸），带呼吸、脉动、斜扫、闪点四种环境动效。
// 用来在多个 Agent（研究员、风控、执行）并存时一眼认出是谁说的话。
// 颜色是「按种子生成的身份色」，不是主题色：色相由种子散列决定，所以不走 token；底色取元素自己的背景（bg-surface-0 跟主题走）。
// 相对原件：读屏名由调用方传（原件拼英文）；底色不写死 #08080f；去掉 prefers-reduced-motion 监听。
import { useEffect, useRef } from 'react'
import { cn } from '../lib/cn.ts'
import { createAvatar } from './agent-avatar-model.ts'

export type AgentAvatarProps = {
  /** String seed; the same seed always draws the same avatar. */
  seed: string
  /** Accessible name (required), such as "Risk agent". */
  label: string
  /** Diameter in px. */
  size?: number
  /** Run the ambient pixel animation; a still frame is drawn when false. */
  animated?: boolean
  /** Extra class name on the canvas. */
  className?: string
}

export function AgentAvatar({ seed, label, size = 64, animated = true, className }: AgentAvatarProps) {
  const canvas = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const el = canvas.current
    const ctx = el?.getContext('2d')
    if (!el || !ctx) return
    const ratio = window.devicePixelRatio || 1
    el.width = size * ratio
    el.height = size * ratio
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
    const avatar = createAvatar(seed, size)
    let raf = 0
    const frame = (time: number) => {
      // 底色每帧从元素读：主题切换后下一帧就对了。
      avatar.draw(ctx, time, getComputedStyle(el).backgroundColor, animated)
      if (animated) raf = requestAnimationFrame(frame)
    }
    frame(0)
    return () => cancelAnimationFrame(raf)
  }, [seed, size, animated])
  return (
    <canvas
      ref={canvas}
      role="img"
      aria-label={label}
      data-slot="agent-avatar"
      className={cn('block flex-none rounded-full bg-surface-0', className)}
      style={{ width: size, height: size }}
    />
  )
}
