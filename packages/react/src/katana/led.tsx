// SPDX-License-Identifier: MIT
// 组件卡 StatusLED。LED 默认 off；只表达真实状态，必须配文字或 aria-label。
// 搬自 src/ui（#1860），皮肤在 ../theme/led.css。G3 起语气是 tone: SeverityExt（lib/severity.ts，neutral/off 熄灭、accent 亮强调色、ok/warn/danger 状态色），
// 旧的 state（off/on/ok/warn/danger）留一个版本作兼容，运行时经 ledOf 映射到同一套类名。
// 状态变了在灯外画一圈光晕闪一次（共用层 useStatusFlash；灯自己的底色就是状态色，闪底色看不见，所以闪外圈）：变坏（警告、危险）用警示闪，变好用涨色闪。
import { useStatusFlash } from '../lib/live.ts'
import { ledOf, type SeverityExt } from '../lib/severity.ts'

export type LedState = 'off' | 'on' | 'ok' | 'warn' | 'danger'

/** 联动组：同组的面板跟着同一个品种走。组的颜色在组件卡里（theme/led.css 的 link-a…d），所以组名定义在这里。 */
export type LinkGroup = 'A' | 'B' | 'C' | 'D'
export const LINK_GROUPS: readonly LinkGroup[] = ['A', 'B', 'C', 'D']

export function Led({
  tone,
  state,
  group,
  hollow,
  bare,
  small,
  label,
}: {
  /**
   * Tone of the light: neutral and off are unlit, accent glows in the accent color, ok, warn and danger in the status colors. Defaults to off.
   * 语气（Severity 加 off / accent）：neutral、off 熄灭，accent 亮强调色（进行中、在线），ok、warn、danger 是状态色。
   */
  tone?: SeverityExt
  /**
   * Old name kept for one release.
   * @deprecated Use tone: off, on (accent), ok, warn, danger.
   */
  state?: LedState
  /** Link group: panels in the same group follow the same symbol; the group color overrides state. */
  group?: LinkGroup | null
  /** Hollow: transparent fill with a 1px border, no glow. */
  hollow?: boolean
  /**
   * Set when no text next to the light names the state: the off state draws a 3:1 ring instead of a barely visible dark dot.
   * 旁边没有写出状态的文字：熄灭态画一圈 3:1 的环，不靠近乎看不见的暗点单独表示（WCAG 1.4.11，#477）。
   */
  bare?: boolean
  /**
   * A 6px light for inline pieces such as pills.
   * 6px 的小灯：药丸这样的行内小件里用（来源角标，#1069）。
   */
  small?: boolean
  /** Accessible name (required). */
  label: string
}) {
  const lit: LedState = tone === undefined ? (state ?? 'off') : ledOf(tone)
  const look = group ? `link-${group.toLowerCase()}` : lit === 'off' ? '' : lit
  const changed = useStatusFlash(lit)
  return (
    <span
      className={`k-led${look ? ` ${look}` : ''}${hollow ? ' hollow' : ''}${bare ? ' bare' : ''}${small ? ' sm' : ''}`}
      role="img"
      aria-label={label}
    >
      {changed.flash && (
        <i
          key={changed.key}
          className={lit === 'warn' || lit === 'danger' ? 'k-led-halo k-live-alert' : 'k-led-halo k-live-flash'}
          data-tone={lit === 'danger' ? 'negative' : undefined}
          data-flash={lit === 'warn' || lit === 'danger' ? undefined : 'up'}
          aria-hidden="true"
        />
      )}
    </span>
  )
}
