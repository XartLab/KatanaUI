// SPDX-License-Identifier: MIT
// 文档站的全局「实时 / 暂停」开关（照 ToggleGroup）：开关状态在 live-sim.ts 的全局 store，页上所有模拟器一起听；文字由调用处传，不写死语言。
import { ToggleGroup, ToggleGroupItem } from '../src/index'
import { useLiveEnabled } from './live-sim'

export type LiveToggleLabels = {
  /** 整组的读屏名，如「数据刷新」。 */
  group: string
  live: string
  paused: string
}

export function LiveToggle({ labels, className }: { labels: LiveToggleLabels; className?: string }) {
  const [on, setOn] = useLiveEnabled()
  return (
    <ToggleGroup
      aria-label={labels.group}
      variant="sm"
      className={className}
      data-slot="live-toggle"
      value={on ? 'live' : 'paused'}
      onValueChange={(value) => setOn(value === 'live')}
    >
      <ToggleGroupItem value="live">{labels.live}</ToggleGroupItem>
      <ToggleGroupItem value="paused">{labels.paused}</ToggleGroupItem>
    </ToggleGroup>
  )
}
