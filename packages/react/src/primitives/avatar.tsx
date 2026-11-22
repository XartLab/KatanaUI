// SPDX-License-Identifier: MIT
// 改自 SmoothUI avatar（https://github.com/educlopez/smoothui ，MIT，© 2024 Eduardo Calvo）
import { Avatar as AvatarPrimitive } from 'radix-ui'
import { Children, createContext, useContext, type ComponentProps, type ReactNode } from 'react'
import { cn } from '../lib/cn.ts'

// 头像：图片加载失败或还没到就显示 fallback（缩写）；右下角可挂在线状态点；AvatarGroup 叠放并把多出的折成 +N。
// 状态点与 +N 的读屏名由调用方传（labels / statusLabel），包里不带文字。底座是 Radix Avatar。
// 缩写与 +N 的字用 ink-200（--k-content-body-foreground）：ink-300 压在 7% 白的底上 Console 下只有 4.42:1（G1 axe 查出，2026-11-18）。

export type AvatarSize = 'sm' | 'md' | 'lg'
export type AvatarStatusValue = 'online' | 'away' | 'busy' | 'offline'

const SIZE: Record<AvatarSize, string> = {
  sm: 'size-6 k-text-micro',
  md: 'size-8 k-text-caption',
  lg: 'size-10 k-text-data',
}
const DOT: Record<AvatarSize, string> = { sm: 'size-2', md: 'size-[10px]', lg: 'size-3' }
// 状态色走信号色 token：在线绿、离开琥珀、忙碌红、离线灰。
const STATUS: Record<AvatarStatusValue, string> = {
  online: 'bg-(--k-status-ok-foreground)',
  away: 'bg-(--k-status-warn-foreground)',
  busy: 'bg-(--k-status-danger-foreground)',
  offline: 'bg-(--k-content-tertiary-foreground)',
}

const GroupContext = createContext<AvatarSize | undefined>(undefined)
const SizeContext = createContext<AvatarSize>('md')

export type AvatarProps = Omit<ComponentProps<typeof AvatarPrimitive.Root>, 'children'> & {
  /** Image URL; leave it out to show only the fallback. */
  src?: string
  /** Alt text of the image and the accessible name (required). */
  alt: string
  /** Shown while the image loads or when it fails, usually initials. */
  fallback: ReactNode
  /** Diameter: sm 24, md 32, lg 40. */
  size?: AvatarSize
  /** Presence dot at the bottom right. */
  status?: AvatarStatusValue
  /** Spoken name of the presence dot (required when status is set). */
  statusLabel?: string
}

export function Avatar({ src, alt, fallback, size, status, statusLabel, className, ...props }: AvatarProps) {
  const inGroup = useContext(GroupContext)
  const resolved = size ?? inGroup ?? 'md'
  return (
    <SizeContext value={resolved}>
      <AvatarPrimitive.Root
        data-slot="avatar"
        data-size={resolved}
        className={cn(
          'relative inline-flex shrink-0 items-center justify-center align-middle select-none',
          SIZE[resolved],
          className,
        )}
        {...props}
      >
        {src ? (
          <AvatarPrimitive.Image src={src} alt={alt} className="aspect-square size-full rounded-full object-cover" />
        ) : null}
        <AvatarPrimitive.Fallback
          aria-label={alt}
          role="img"
          className="flex size-full items-center justify-center rounded-full bg-(--k-container-subtle-background) font-medium text-(color:--k-content-body-foreground) uppercase ring-1 ring-(color:--k-container-bold-borderColor) ring-inset"
        >
          {fallback}
        </AvatarPrimitive.Fallback>
        {status ? (
          <span
            role="img"
            aria-label={statusLabel}
            data-slot="avatar-status"
            data-status={status}
            className={cn(
              'absolute right-0 bottom-0 rounded-full ring-2 ring-(color:--k-surface-base-background)',
              DOT[resolved],
              STATUS[status],
            )}
          />
        ) : null}
      </AvatarPrimitive.Root>
    </SizeContext>
  )
}

export type AvatarGroupProps = {
  /** The avatars. */
  children: ReactNode
  /** What screen readers call the group (required). */
  label: string
  /** Show at most this many, then a +N chip. */
  max?: number
  /** Size for every avatar inside. */
  size?: AvatarSize
  /** Spoken name of the +N chip, e.g. count 3 becomes "3 more" (required when max is set). */
  overflowLabel?: (count: number) => string
  /** Extra classes for the root element. */
  className?: string
}

export function AvatarGroup({ children, label, max, size = 'md', overflowLabel, className }: AvatarGroupProps) {
  const all = Children.toArray(children)
  const shown = max !== undefined && all.length > max ? all.slice(0, max) : all
  const hidden = all.length - shown.length
  return (
    <GroupContext value={size}>
      <div
        role="group"
        aria-label={label}
        data-slot="avatar-group"
        className={cn(
          'flex items-center -space-x-2 [&>[data-slot=avatar]]:ring-2 [&>[data-slot=avatar]]:ring-(color:--k-surface-base-background) [&>[data-slot=avatar-overflow]]:ring-2 [&>[data-slot=avatar-overflow]]:ring-(color:--k-surface-base-background)',
          className,
        )}
      >
        {shown}
        {hidden > 0 ? (
          <span
            role="img"
            aria-label={overflowLabel?.(hidden)}
            data-slot="avatar-overflow"
            className={cn(
              'inline-flex shrink-0 items-center justify-center rounded-full bg-(--k-container-subtle-background) font-medium text-(color:--k-content-body-foreground) tabular-nums select-none',
              SIZE[size],
            )}
          >
            +{hidden}
          </span>
        ) : null}
      </div>
    </GroupContext>
  )
}

/** Size of the nearest avatar, for custom parts placed inside one. */
export const useAvatarSize = () => useContext(SizeContext)
