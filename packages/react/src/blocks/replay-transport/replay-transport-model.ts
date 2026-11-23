// SPDX-License-Identifier: MIT
// 回放控制条的纯逻辑：时刻读写、键位、跳过 tick 数的校验。件本身不走时钟，只发事件。

const pad = (n: number, width = 2) => String(n).padStart(width, '0')

/** 默认时刻写法：UTC 的 `YYYY-MM-DD HH:MM:SS`（回放的时间轴不跟本机时区走，免得两台机器读数不一致）。取不到有限数时返回 null。 */
export function formatReplayTime(ms: number): string | null {
  if (!Number.isFinite(ms)) return null
  const d = new Date(ms)
  if (Number.isNaN(d.getTime())) return null
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`
}

/** 默认时刻读法：认 `YYYY-MM-DD`、`YYYY-MM-DD HH:MM`、`YYYY-MM-DD HH:MM:SS`（也认 T 分隔），一律按 UTC；读不出返回 null。 */
export function parseReplayTime(text: string): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?$/.exec(text.trim())
  if (!m) return null
  const [, y, mo, d, h = '0', mi = '0', s = '0'] = m
  const ms = Date.UTC(Number(y), Number(mo) - 1, Number(d), Number(h), Number(mi), Number(s))
  // Date.UTC 会把 2 月 31 日滚成 3 月 3 日；回读比对，滚过的算读不出。
  const back = new Date(ms)
  if (back.getUTCMonth() !== Number(mo) - 1 || back.getUTCDate() !== Number(d)) return null
  return Number.isNaN(ms) ? null : ms
}

/** 把用户输入的 tick 数夹成正整数；空、非数、小于 1 返回 null（按钮灰掉）。 */
export function parseSkipTicks(text: string): number | null {
  if (!/^\s*\d+\s*$/.test(text)) return null
  const n = Number(text)
  return n >= 1 && Number.isSafeInteger(n) ? n : null
}

/** 进度条的步长：把区间切成 1000 份，至少 1 毫秒，键盘 ← → 走一份、Shift 走十份。 */
export const progressStep = (start: number, end: number): number => Math.max(1, Math.round((end - start) / 1000))

export type TransportCommand = 'toggle' | 'step' | 'slower' | 'faster'

/**
 * 快捷键：k 播放 / 暂停，. 逐根，[ 减速，] 加速。
 * 焦点在输入框或滑块上时不认：输入框要打字，滑块的键盘归滑块。按钮上照认（它们的空格与回车是点击，不和这几个键冲突）。
 * Ctrl / Alt / Meta 组合键不认（留给浏览器与宿主）。
 */
export function transportCommand(
  event: { key: string; ctrlKey?: boolean; altKey?: boolean; metaKey?: boolean },
  target: { tagName?: string; role?: string | null } | null,
): TransportCommand | null {
  if (event.ctrlKey || event.altKey || event.metaKey) return null
  const tag = target?.tagName?.toUpperCase()
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target?.role === 'slider') return null
  switch (event.key) {
    case 'k':
    case 'K':
      return 'toggle'
    case '.':
      return 'step'
    case '[':
      return 'slower'
    case ']':
      return 'faster'
    default:
      return null
  }
}

/** 倍速列表里相邻的一档：减速、加速都停在两端；当前倍速不在列表里时从最接近的一档算。 */
export function neighbourSpeed(speeds: readonly number[], current: number, dir: -1 | 1): number | null {
  if (speeds.length === 0) return null
  const sorted = [...speeds].sort((a, b) => a - b)
  if (dir > 0) return sorted.find((s) => s > current) ?? sorted[sorted.length - 1]!
  return [...sorted].reverse().find((s) => s < current) ?? sorted[0]!
}
