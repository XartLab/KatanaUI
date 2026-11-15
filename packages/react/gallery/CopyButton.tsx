// SPDX-License-Identifier: MIT
import { Check, Copy } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Button, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../src/index'

const COPIED_MS = 1800

/** 复制一段文字到剪贴板：图标钮加提示，复制成功后提示写「已复制」（读屏也播报），一会儿复原。剪贴板不可用时什么也不提示。 */
export function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false)
  const [hovered, setHovered] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  useEffect(() => () => clearTimeout(timer.current), [])
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      return
    }
    setCopied(true)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setCopied(false), COPIED_MS)
  }
  return (
    <TooltipProvider>
      <Tooltip open={hovered || copied} onOpenChange={setHovered}>
        <TooltipTrigger asChild>
          <Button variant="icon" size="icon" aria-label={label} data-copied={copied || undefined} onClick={copy}>
            {copied ? <Check /> : <Copy />}
          </Button>
        </TooltipTrigger>
        <TooltipContent>{copied ? '已复制' : '复制'}</TooltipContent>
      </Tooltip>
      <span role="status" className="gal-sr">
        {copied ? '已复制' : ''}
      </span>
    </TooltipProvider>
  )
}
