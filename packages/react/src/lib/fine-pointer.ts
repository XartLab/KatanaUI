// SPDX-License-Identifier: MIT
// 改自 SmoothUI tilt-card、glass-card 里重复的「有精细指针的设备」检测（https://github.com/educlopez/smoothui ，MIT，© 2024 Eduardo Calvo）：
// 指针跟随类的装饰件（倾斜、玻璃高光）只在有悬停能力的设备上动，触屏没有悬停。用 useSyncExternalStore 读媒体查询，没有 effect 里的同步 setState。
import { useSyncExternalStore } from 'react'

const QUERY = '(hover: hover) and (pointer: fine)'

function subscribe(onChange: () => void) {
  const query = window.matchMedia(QUERY)
  query.addEventListener('change', onChange)
  return () => query.removeEventListener('change', onChange)
}

/** 设备是否有悬停能力的精细指针（鼠标、触控板）；服务端渲染时为 false。 */
export function useFinePointer(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(QUERY).matches,
    () => false,
  )
}
