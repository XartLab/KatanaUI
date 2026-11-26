// SPDX-License-Identifier: MIT
import { CheckIcon, DownloadIcon, TriangleAlertIcon } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { CopyResult } from '../lib/copy-image.ts'
import type { Severity } from '../lib/severity.ts'
import {
  TOAST_EXIT_MS,
  Toast,
  ToastClose,
  ToastContent,
  ToastDescription,
  ToastIcon,
  ToastText,
  ToastTitle,
  ToastViewport,
  type ToastPhase,
  type ToastPosition,
} from './toast.tsx'

// 复制的结果提示（#77 第 4 条，#22 G11「统一的结果提示」）：复制图、复制文字（lib/copy-image 的 CopyResult）共用一条 Toast。
//   copied → ok 语气、勾；downloaded（剪贴板不支持或被拒，改成下载了）→ warn、下载图标，说明写为什么；failed → danger、警示图标，说明写为什么。
//   读屏（#251，kubai 016）：视口 polite；downloaded（warn）与 failed（danger）这两条自带 role=alert，copied 走视口礼貌播报。
//   语气不只靠颜色：标题就是结果（「已复制图片」「已改为下载」「复制失败」）。
// 计时：useCopyFeedback 管一条，默认 2400ms 后自己收；指针停在上面或焦点在里面时不收（离开后重新计时）。再复制一次是新的一条（新 key），
//   读屏会再读一遍（VoiceOver 同一句不读第二遍的问题由「新插入的节点」避开，modern-web-guidance copy-button）。
// 文案全由调用方传；包里不带语言。

export type CopyToastLabels = {
  /** 视口的读屏名。 */
  region: string
  /** 写进剪贴板了：图、文字。 */
  copiedImage: string
  copiedText: string
  /** 改成下载了（标题）；说明取下面的原因。 */
  downloaded: string
  /** 没复制成（标题）。 */
  failed: string
  /** 原因：剪贴板不支持（非 https、浏览器不支持写图）、被拒（没给权限）、拍图失败。 */
  unsupported: string
  denied: string
  render: string
  /** 关掉的读屏名。 */
  close: string
}

export type CopyToastItem = { id: number; result: CopyResult; phase: ToastPhase }

const TONE: Record<CopyResult['status'], Severity> = { copied: 'ok', downloaded: 'warn', failed: 'danger' }

/** 一条复制结果提示的状态：report 交一个结果（或 Promise），dismiss 收起。 */
export function useCopyFeedback({ duration = 2400 }: { duration?: number } = {}) {
  const [toast, setToast] = useState<CopyToastItem | null>(null)
  const next = useRef(1)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const dismiss = useCallback(() => {
    clearTimeout(timer.current)
    setToast((item) => (item ? { ...item, phase: 'closing' } : item))
    timer.current = setTimeout(() => setToast(null), TOAST_EXIT_MS)
  }, [])

  const arm = useCallback(() => {
    clearTimeout(timer.current)
    timer.current = setTimeout(dismiss, duration)
  }, [dismiss, duration])

  const report = useCallback(
    async (result: CopyResult | Promise<CopyResult>) => {
      const settled = await result
      const id = next.current++
      setToast({ id, result: settled, phase: 'entering' })
      // 先画一帧 entering 再换 open，过渡才有起点（同 Toast 页的写法）。
      requestAnimationFrame(() =>
        requestAnimationFrame(() => setToast((item) => (item?.id === id ? { ...item, phase: 'open' } : item))),
      )
      arm()
      return settled
    },
    [arm],
  )

  const pause = useCallback(() => clearTimeout(timer.current), [])
  useEffect(() => () => clearTimeout(timer.current), [])

  return { toast, report, dismiss, pause, resume: arm }
}

export type CopyToastProps = {
  /** The toast to show, from useCopyFeedback (null shows nothing). */
  toast: CopyToastItem | null
  /** All text (titles, reasons, close name); the package ships none. */
  labels: CopyToastLabels
  /** Dismiss handler; renders the close button when given. */
  onDismiss?: () => void
  /** Pause the auto-dismiss while the pointer or focus is inside (useCopyFeedback pause). 指针或焦点进来时停计时。 */
  onPause?: () => void
  /** Resume the auto-dismiss when the pointer or focus leaves (useCopyFeedback resume). */
  onResume?: () => void
  /** Window corner of the viewport; default bottom-right. */
  position?: ToastPosition
  /** Set false to render only the toast, without the fixed viewport (docs, screenshots, your own viewport). 默认 true。 */
  viewport?: boolean
}

function message(result: CopyResult, labels: CopyToastLabels): { title: string; description?: string } {
  if (result.status === 'copied') return { title: result.kind === 'image' ? labels.copiedImage : labels.copiedText }
  if (result.status === 'downloaded') return { title: labels.downloaded, description: labels[result.reason] }
  return { title: labels.failed, description: labels[result.reason] }
}

const ICON = { copied: <CheckIcon />, downloaded: <DownloadIcon />, failed: <TriangleAlertIcon /> }

/** 复制结果的一条提示。 */
export function CopyToast({
  toast,
  labels,
  onDismiss,
  onPause,
  onResume,
  position = 'bottom-right',
  viewport = true,
}: CopyToastProps) {
  const text = toast === null ? null : message(toast.result, labels)
  const item =
    toast === null || text === null ? null : (
      <Toast
        key={toast.id}
        tone={TONE[toast.result.status]}
        phase={toast.phase}
        data-slot="copy-toast"
        data-status={toast.result.status}
        onPointerEnter={onPause}
        onPointerLeave={onResume}
        onFocus={onPause}
        onBlur={onResume}
      >
        <ToastContent>
          <ToastIcon>{ICON[toast.result.status]}</ToastIcon>
          <ToastText>
            <ToastTitle>{text.title}</ToastTitle>
            {text.description === undefined ? null : <ToastDescription>{text.description}</ToastDescription>}
          </ToastText>
          {onDismiss ? <ToastClose label={labels.close} onClick={onDismiss} /> : null}
        </ToastContent>
      </Toast>
    )
  if (!viewport) return item
  return (
    <ToastViewport position={position} aria-label={labels.region}>
      {item}
    </ToastViewport>
  )
}
