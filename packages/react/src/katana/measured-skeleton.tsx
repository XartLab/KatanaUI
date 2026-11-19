// SPDX-License-Identifier: MIT
import { useEffect, useState, type ReactNode } from 'react'
import { Skeleton as SkulletSkeleton } from 'skullet/react'
import { cn } from '../lib/cn.ts'
import { LOADING_DELAY_MS } from './loading-gate.ts'

// 量出来的骨架：薄适配层，组件只认这里，不直接 import skullet（依赖锁精确版本，换库只改这一个文件）。
// 原理：把真组件加示例数据在不可见层排一次版，量出每行文字、每个图片 / 控件 / 按钮的位置再画骨架，内容到了位置不动。
// 外观走 theme/loading.css 的 .k-measured（line-200、不动画、文字条圆角同 k-loading-line）；读屏名由调用方传，包里不带文字。
// 出现时机沿用 loading-gate 的 500ms：LoadingWait 自己画行骨架，套不上量出来的版面，所以只借它的延迟值，
// 延迟内不可见层照样占位（内容区不塌），到点才露出骨架条，快的请求不闪。

type Common = {
  /**
   * Accessible name read while loading (required; the package ships no text).
   * 读屏名（必填，包里不带文字）：加载期间由 role=status 读出。
   */
  label: string
  /**
   * Whether we are waiting; data mode defaults to "data is empty".
   * 在等：不给时按数据是否为空算（data 模式），plain 模式必须给。
   */
  loading?: boolean
  /**
   * Remember the measured shape under this key.
   * 按这个 key 记住形状，下次进来第一帧就是准的。
   */
  id?: string
  /**
   * Called once when content has replaced the skeleton.
   * 内容替换掉骨架并淡入结束时调一次。
   */
  onReveal?: () => void
  /**
   * Milliseconds to wait before the bars show; defaults to LoadingWait's 500.
   * 骨架出现前等多久（毫秒），默认与 LoadingWait 同一个 500ms。
   */
  delay?: number
  /** Class name for the root element. */
  className?: string
}

export type MeasuredSkeletonDataProps<T> = Common & {
  /**
   * The data; loading while null or undefined.
   * 为空（null / undefined）就是在加载。
   */
  data: T | null | undefined
  /**
   * Example data laid out to draw the skeleton before real data arrives.
   * 数据没来之前用它排版画骨架；形状要和真数据差不多（文字行数、有没有图）。
   */
  sample?: T
  /** Renders the content from the data. */
  children: (data: T) => ReactNode
}

export type MeasuredSkeletonPlainProps = Common & {
  data?: never
  /**
   * Example content measured while loading, instead of children.
   * 加载期间量它来画骨架（给了就替换 children）；不给就量 children。
   */
  sample?: ReactNode
  /** The content shown once loading is done. */
  children: ReactNode
}

export type MeasuredSkeletonProps<T = unknown> = MeasuredSkeletonDataProps<T> | MeasuredSkeletonPlainProps

/** 在等了 delay 毫秒以后才为真；不在等时立刻回到假。 */
function useElapsed(active: boolean, delay: number): boolean {
  const [elapsed, setElapsed] = useState(false)
  useEffect(() => {
    if (!active) return
    const timer = setTimeout(() => {
      setElapsed(true)
    }, delay)
    return () => {
      clearTimeout(timer)
      setElapsed(false)
    }
  }, [active, delay])
  return elapsed
}

export function MeasuredSkeleton<T>(props: MeasuredSkeletonProps<T>) {
  const { label, id, onReveal, delay = LOADING_DELAY_MS, className } = props
  const render = typeof props.children === 'function'
  const loading = props.loading ?? (render ? props.data == null : false)
  const elapsed = useElapsed(loading, delay)
  const classes = cn('k-measured', loading && !elapsed && 'is-wait', className)
  return (
    <>
      <span className="sr-only" role="status">
        {loading ? label : null}
      </span>
      {render ? (
        <SkulletSkeleton
          data={(props as MeasuredSkeletonDataProps<T>).data}
          sample={(props as MeasuredSkeletonDataProps<T>).sample}
          loading={loading}
          id={id}
          onReveal={onReveal}
          className={classes}
        >
          {(props as MeasuredSkeletonDataProps<T>).children}
        </SkulletSkeleton>
      ) : (
        <SkulletSkeleton loading={loading} id={id} onReveal={onReveal} className={classes}>
          {loading && props.sample !== undefined ? (props.sample as ReactNode) : (props.children as ReactNode)}
        </SkulletSkeleton>
      )}
    </>
  )
}
