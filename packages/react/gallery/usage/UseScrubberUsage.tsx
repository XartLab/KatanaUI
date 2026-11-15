// SPDX-License-Identifier: MIT
import { useScrubber } from '../../src/index'

export function UseScrubberUsage() {
  const bars = [4, 7, 5, 9, 12, 8, 6, 10, 14, 11, 7, 9]
  const scrub = useScrubber({ count: bars.length, mode: 'band' })
  return (
    <>
      <div className="gal-scrub" data-gallery-scrubber role="group" aria-label="扫读演示：十二根柱" {...scrub.props}>
        {bars.map((value, i) => (
          <span
            key={i}
            className="gal-scrub-bar"
            data-active={scrub.index === i ? 'true' : undefined}
            style={{ height: value * 6 }}
          />
        ))}
      </div>
      <output className="gal-label" data-gallery-scrubber-readout>
        {scrub.index === null ? '未选中' : `第 ${scrub.index + 1} 格 · 值 ${bars[scrub.index]}`}
      </output>
    </>
  )
}
