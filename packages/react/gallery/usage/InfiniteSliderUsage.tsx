// SPDX-License-Identifier: MIT
import { InfiniteSlider } from '../../src/index'

export function InfiniteSliderUsage() {
  return (
    <InfiniteSlider label="Index quotes" speed={60} speedOnHover={15}>
      <span>BTC 106,977.4 +1.20%</span>
      <span>ETH 3,814.2 +0.63%</span>
      <span>NVDA 148.62 -1.71%</span>
    </InfiniteSlider>
  )
}
