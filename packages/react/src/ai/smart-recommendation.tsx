// SPDX-License-Identifier: MIT
/**
 * Smart recommendation: a suggestion card with a confidence signal, alternatives to switch to, and accept with undo.
 * 带置信度的建议卡（KATANAview #1908 第三批）：Agent 给一个建议（第一项是推荐），写理由与置信度（0–3 格，旁边写成字，不只靠格子）；
 * 「其他选项」是一个单选菜单，换了就显示那一项；「采用」把人选的回调出去，之后换成「已采用」与「撤销」。标题本身是一个开合钮（aria-expanded），默认展开。
 * 产品底线：模型输出只是带来源的建议，人接受才生效；件不替人采用，source 写在理由下面。
 * 功能参照 affectUI 的 Smart Recommendation（affectui.com/components/smart-recommendation，2026-11-23 读；页上标 MIT，这里也只学功能，代码原创）。
 * 菜单用我们的 DropdownMenu（Radix，Esc 关）。包里不带语言。
 */
import { CheckIcon, ChevronDownIcon, ChevronRightIcon } from 'lucide-react'
import { useId, useState, type ReactNode } from 'react'
import { cn } from '../lib/cn.ts'
import { Button } from '../primitives/button.tsx'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '../primitives/dropdown-menu.tsx'

/** One option; the first in the list is the recommended one. */
export type RecommendationOption = {
  /** Stable key. */
  id: string
  /** What to do. */
  label: string
  /** Why. */
  reason?: string
  /** Confidence from 0 to 3. */
  signal: 0 | 1 | 2 | 3
  /** Where the suggestion came from (the model, the rule, the data). */
  source?: string
}

/** Texts of SmartRecommendation (the package ships no text). */
export type SmartRecommendationLabels = {
  /** Confidence in words, per level (「把握不大」…「很有把握」). */
  signal: (signal: 0 | 1 | 2 | 3) => string
  /** Tag on the recommended option. */
  recommended: string
  /** Alternatives menu button. */
  alternatives: string
  /** Accept and undo buttons, and the accepted line. */
  accept: string
  undo: string
  accepted: (label: string) => string
}

export type SmartRecommendationProps = {
  /** Options; the first one is recommended. */
  options: readonly RecommendationOption[]
  /** Called when the person accepts an option. */
  onAccept?: (option: RecommendationOption) => void
  /** Called when an accept is undone. */
  onUndo?: (option: RecommendationOption) => void
  /** Whether the card starts open. */
  defaultOpen?: boolean
  /** Heading (also the fold button). */
  title: ReactNode
  /** Texts. */
  labels: SmartRecommendationLabels
  /** Extra class name on the root. */
  className?: string
}

/** 置信度夹到 0–3 的整数（调用方给了别的数也不画出格）。 */
export const clampSignal = (signal: number): 0 | 1 | 2 | 3 =>
  Math.min(3, Math.max(0, Math.round(signal))) as 0 | 1 | 2 | 3

export function SmartRecommendation({
  options,
  onAccept,
  onUndo,
  defaultOpen = true,
  title,
  labels,
  className,
}: SmartRecommendationProps) {
  const [open, setOpen] = useState(defaultOpen)
  const [pickedId, setPickedId] = useState(options[0]?.id ?? null)
  const [acceptedId, setAcceptedId] = useState<string | null>(null)
  const bodyId = useId()
  const picked = options.find((option) => option.id === pickedId) ?? options[0]
  const accepted = options.find((option) => option.id === acceptedId) ?? null
  if (picked === undefined) return null
  const signal = clampSignal(picked.signal)

  return (
    <section
      className={cn('k-srec', className)}
      data-slot="smart-recommendation"
      data-accepted={accepted ? '' : undefined}
    >
      <h4 className="k-srec-title">
        <button type="button" aria-expanded={open} aria-controls={bodyId} onClick={() => setOpen(!open)}>
          {open ? <ChevronDownIcon size={14} aria-hidden="true" /> : <ChevronRightIcon size={14} aria-hidden="true" />}
          {title}
        </button>
      </h4>
      <div id={bodyId} className="k-srec-body" hidden={!open}>
        <p className="k-srec-pick" data-slot="recommendation-pick">
          <span>{picked.label}</span>
          {picked.id === options[0]!.id && <small className="k-srec-tag">{labels.recommended}</small>}
        </p>
        {picked.reason !== undefined && <p className="k-srec-reason">{picked.reason}</p>}
        {picked.source !== undefined && <p className="k-srec-source">{picked.source}</p>}
        <p className="k-srec-signal" data-signal={signal}>
          <span className="k-srec-bars" aria-hidden="true">
            {[1, 2, 3].map((level) => (
              <i key={level} data-on={level <= signal ? '' : undefined} />
            ))}
          </span>
          <span data-slot="recommendation-signal">{labels.signal(signal)}</span>
        </p>
        <div className="k-srec-actions">
          {accepted === null ? (
            <>
              {options.length > 1 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" variant="ghost">
                      {labels.alternatives}
                      <ChevronDownIcon size={14} aria-hidden="true" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuRadioGroup value={picked.id} onValueChange={setPickedId}>
                      {options.map((option) => (
                        <DropdownMenuRadioItem key={option.id} value={option.id}>
                          {option.label}
                        </DropdownMenuRadioItem>
                      ))}
                    </DropdownMenuRadioGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              <Button
                size="sm"
                variant="primary"
                data-slot="recommendation-accept"
                onClick={() => {
                  setAcceptedId(picked.id)
                  onAccept?.(picked)
                }}
              >
                {labels.accept}
              </Button>
            </>
          ) : (
            <>
              <span className="k-srec-accepted" aria-live="polite">
                <CheckIcon size={14} aria-hidden="true" />
                {labels.accepted(accepted.label)}
              </span>
              <Button
                size="sm"
                onClick={() => {
                  setAcceptedId(null)
                  onUndo?.(accepted)
                }}
              >
                {labels.undo}
              </Button>
            </>
          )}
        </div>
      </div>
    </section>
  )
}
